"""Automated test suite for KrishiLink ML pipelines."""

from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd

from integration.ml_client import MLClient
from ml.run import run_daily
from ml.step1_ingest import run_ingest
from ml.step2_features import build_price_inference_rows
from ml.step3_price_model import (
    compute_published_target,
    predict_price_bands,
    train_price_model,
)
from ml.step4_demand_model import predict_demand_and_curves, train_demand_model


def test_no_lookahead_price_features() -> None:
    """Mutating prices on or after delivery_date MUST NOT change inference features."""
    bundle = run_ingest(save_processed=False)
    max_dt = pd.Timestamp(bundle.market_prices["date"].max()).date()
    delivery_dt = max_dt  # Uses strictly <= max_dt - 1 day

    base_feats = build_price_inference_rows(
        bundle.market_prices, bundle.weather, bundle.holidays, delivery_dt
    )

    corrupted = bundle.market_prices.copy()
    corrupted.loc[corrupted["date"] >= pd.Timestamp(delivery_dt), "modal_inr_per_kg"] = 99999.0
    corrupted_feats = build_price_inference_rows(
        corrupted, bundle.weather, bundle.holidays, delivery_dt
    )

    pd.testing.assert_frame_equal(base_feats, corrupted_feats)


def test_published_target_ordering() -> None:
    low, high = compute_published_target(20.0, 25.0, 32.0)
    assert 20 <= low <= 25 <= high <= 32


def test_price_model_contract_and_organic(tmp_path) -> None:
    bundle = run_ingest(save_processed=False)
    art = train_price_model(
        bundle.market_prices, bundle.weather, bundle.holidays, save_path=tmp_path / "price.joblib"
    )
    tomorrow = date.today() + timedelta(days=1)
    bands = predict_price_bands(
        bundle.market_prices, bundle.weather, bundle.holidays, tomorrow, artifact=art
    )
    assert len(bands) == 55  # 5 hubs x 11 active crops (Coriander excluded)
    assert all(b.crop_id != "coriander_leaves" for b in bands)
    assert all(b.p10 <= b.p50 <= b.p90 for b in bands)

    org = [b for b in bands if b.hub_id == "hub_blr_main" and b.crop_id == "tomato_organic"][0]
    base = [b for b in bands if b.hub_id == "hub_blr_main" and b.crop_id == "tomato"][0]
    assert org.pricing_mode == "derived_premium"
    assert org.p50 > base.p50


def test_demand_reconciliation_and_cold_start(tmp_path) -> None:
    bundle = run_ingest(save_processed=False)
    # Remove history for one (hub, crop) pair to test cold-start flagging
    trimmed_orders = bundle.orders[
        ~((bundle.orders["hub_id"] == "hub_kolar") & (bundle.orders["crop_id"] == "capsicum"))
    ].copy()

    art = train_demand_model(
        trimmed_orders, bundle.weather, bundle.holidays, save_path=tmp_path / "demand.joblib"
    )
    tomorrow = date.today() + timedelta(days=1)
    forecasts, curves = predict_demand_and_curves(
        trimmed_orders, bundle.weather, bundle.holidays, tomorrow, artifact=art
    )

    cold = [f for f in forecasts if f.hub_id == "hub_kolar" and f.crop_id == "capsicum"][0]
    assert cold.is_cold_start is True

    # Exact hub-level reconciliation: sum of non-cold-start crops == curve @ 10:00
    for hub_id in {f.hub_id for f in forecasts}:
        crop_sum_q50 = sum(f.q50_kg for f in forecasts if f.hub_id == hub_id and not f.is_cold_start)
        end_pt = [c for c in curves if c.hub_id == hub_id and c.hour_ist == "10:00"][0]
        assert np.isclose(crop_sum_q50, end_pt.q50_kg, atol=0.05)


def test_end_to_end_daily_publish_and_ml_client() -> None:
    tomorrow = date.today() + timedelta(days=1)
    res = run_daily(delivery_date=tomorrow)
    assert res["price_bands"] == 55
    assert res["demand_forecasts"] == 50

    client = MLClient()
    live_prices = client.get_price_bands(tomorrow, hub_id="hub_blr_main")
    assert live_prices["is_stale"] is False
    assert len(live_prices["items"]) == 11

    # Missing future date triggers stale price fallback and hides demand
    far_future = date.today() + timedelta(days=60)
    stale_prices = client.get_price_bands(far_future, hub_id="hub_blr_main")
    assert stale_prices["is_stale"] is True
    assert len(stale_prices["items"]) == 11

    missing_demand = client.get_demand_dashboard(far_future, hub_id="hub_blr_main")
    assert missing_demand["is_available"] is False
    assert missing_demand["forecasts"] == []