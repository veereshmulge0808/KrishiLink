"""Step 4: Per-Hub Demand Model (Q10/Q50/Q90 on requested_kg) + reconciled hourly curve."""

from __future__ import annotations

from datetime import date, datetime, timezone
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd

from ml.config import (
    ARTIFACTS_DIR,
    CROPS,
    DEFAULT_HOURLY_CUMULATIVE_PROFILE,
    DEMAND_CURVE_HOURS_IST,
    HUBS,
    MIN_DEMAND_HISTORY_DAYS,
    QUANTILES,
)
from ml.schemas import DemandCurvePoint, DemandForecastRecord
from ml.step2_features import (
    DEMAND_FEATURE_COLS,
    build_demand_features,
    build_demand_inference_rows,
)

logger = logging.getLogger("krishilink.demand_model")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DEMAND_ARTIFACT_PATH = ARTIFACTS_DIR / "demand_model.joblib"


# ---------------------------------------------------------------------------
# Metrics & Helpers
# ---------------------------------------------------------------------------
def wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Weighted Absolute Percentage Error = sum(|y - y_hat|) / sum(y)."""
    denom = float(np.sum(np.abs(y_true)))
    if denom <= 1e-6:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / denom)


def enforce_monotonic_demand(arr: np.ndarray) -> np.ndarray:
    """Ensure 0.0 <= q10 <= q50 <= q90 row-wise."""
    return np.sort(np.maximum(arr, 0.0), axis=1)


# ---------------------------------------------------------------------------
# v1 Cold-Start Baseline: Same-Weekday Empirical Quantiles per (hub, crop)
# ---------------------------------------------------------------------------
def fit_demand_v1_baseline(orders: pd.DataFrame) -> Dict[str, Any]:
    """Compute empirical (q10, q50, q90) per (hub_id, crop_id, dow) and history counts."""
    df = orders.copy()
    df["dow"] = pd.to_datetime(df["delivery_date"]).dt.day_of_week

    by_dow: Dict[Tuple[str, str, int], Tuple[float, float, float]] = {}
    by_pair: Dict[Tuple[str, str], Tuple[float, float, float]] = {}
    history_counts: Dict[Tuple[str, str], int] = {}

    for (hub_id, crop_id), g in df.groupby(["hub_id", "crop_id"]):
        vals = g["requested_kg"].dropna().to_numpy(dtype=float)
        key = (str(hub_id), str(crop_id))
        history_counts[key] = int(len(vals))
        if len(vals) > 0:
            by_pair[key] = (
                float(np.quantile(vals, 0.10)),
                float(np.quantile(vals, 0.50)),
                float(np.quantile(vals, 0.90)),
            )
            for dow, dg in g.groupby("dow"):
                dvals = dg["requested_kg"].dropna().to_numpy(dtype=float)
                if len(dvals) >= 3:
                    by_dow[(str(hub_id), str(crop_id), int(dow))] = (
                        float(np.quantile(dvals, 0.10)),
                        float(np.quantile(dvals, 0.50)),
                        float(np.quantile(dvals, 0.90)),
                    )

    return {
        "by_dow": by_dow,
        "by_pair": by_pair,
        "history_counts": history_counts,
    }


def predict_demand_v1_baseline(df: pd.DataFrame, v1_stats: Dict[str, Any]) -> np.ndarray:
    by_dow = v1_stats["by_dow"]
    by_pair = v1_stats["by_pair"]
    out = np.zeros((len(df), 3), dtype=float)

    for i, row in enumerate(df.itertuples(index=False)):
        hub_id = str(row.hub_id)
        crop_id = str(row.crop_id)
        dow = int(row.dow)
        if (hub_id, crop_id, dow) in by_dow:
            out[i] = by_dow[(hub_id, crop_id, dow)]
        elif (hub_id, crop_id) in by_pair:
            out[i] = by_pair[(hub_id, crop_id)]
        else:
            out[i] = (0.0, 0.0, 0.0)

    return enforce_monotonic_demand(out)


# ---------------------------------------------------------------------------
# Training & v1 -> v2 Promotion Gate
# ---------------------------------------------------------------------------
def train_demand_model(
    orders: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    save_path: Path | None = None,
) -> Dict[str, Any]:
    """
    Train v1 weekday baseline and v2 LightGBM Q10/Q50/Q90 on `requested_kg`.
    Promote v2 ONLY when it beats v1 on held-out WAPE.
    """
    feat_df = build_demand_features(orders, weather, holidays, drop_target_na=True)
    feat_df = feat_df.sort_values("delivery_date").reset_index(drop=True)

    unique_dates = np.sort(feat_df["delivery_date"].unique())
    v1_full = fit_demand_v1_baseline(orders)

    # If insufficient history for ML, stay safely on v1 baseline
    if len(unique_dates) < 45:
        version = f"demand_v1_baseline_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
        artifact = {
            "model_version": version,
            "use_v2_lgbm": False,
            "v1_stats": v1_full,
            "lgbm_models": None,
            "metrics": {"v1_wape": None, "v2_wape": None, "promoted_v2": False},
            "trained_at": datetime.now(timezone.utc).isoformat(),
        }
        joblib.dump(artifact, save_path or DEMAND_ARTIFACT_PATH)
        logger.info("Demand history < 45 days; staying on v1 baseline (%s)", version)
        return artifact

    split_date = unique_dates[int(len(unique_dates) * 0.80)]
    train_df = feat_df[feat_df["delivery_date"] <= split_date].copy()
    test_df = feat_df[feat_df["delivery_date"] > split_date].copy()

    # 1. Fit & evaluate v1 baseline on train/test split
    train_orders = orders[orders["delivery_date"] <= split_date]
    v1_train_stats = fit_demand_v1_baseline(train_orders)
    v1_test_preds = predict_demand_v1_baseline(test_df, v1_train_stats)
    y_test = test_df["requested_kg"].to_numpy(dtype=float)
    v1_wape = wape(y_test, v1_test_preds[:, 1])

    # 2. Fit & evaluate v2 LightGBM quantile models on `requested_kg`
    X_train = train_df[DEMAND_FEATURE_COLS]
    y_train = train_df["requested_kg"].to_numpy(dtype=float)
    X_test = test_df[DEMAND_FEATURE_COLS]

    lgbm_models: Dict[float, lgb.LGBMRegressor] = {}
    for q in QUANTILES:
        model = lgb.LGBMRegressor(
            objective="quantile",
            alpha=q,
            n_estimators=400,
            learning_rate=0.04,
            num_leaves=31,
            min_child_samples=20,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=-1,
        )
        model.fit(X_train, y_train, categorical_feature=["hub_cat", "crop_cat"])
        lgbm_models[q] = model

    v2_test_preds = enforce_monotonic_demand(
        np.column_stack([lgbm_models[q].predict(X_test) for q in QUANTILES])
    )
    v2_wape = wape(y_test, v2_test_preds[:, 1])
    use_v2 = bool(v2_wape < v1_wape)

    # 3. Refit v2 on full history if promoted
    final_models: Optional[Dict[float, lgb.LGBMRegressor]] = None
    if use_v2:
        X_full = feat_df[DEMAND_FEATURE_COLS]
        y_full = feat_df["requested_kg"].to_numpy(dtype=float)
        final_models = {}
        for q in QUANTILES:
            m = lgb.LGBMRegressor(
                objective="quantile",
                alpha=q,
                n_estimators=400,
                learning_rate=0.04,
                num_leaves=31,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbosity=-1,
            )
            m.fit(X_full, y_full, categorical_feature=["hub_cat", "crop_cat"])
            final_models[q] = m

    version = f"demand_{'v2_lgbm' if use_v2 else 'v1_baseline'}_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    artifact = {
        "model_version": version,
        "use_v2_lgbm": use_v2,
        "v1_stats": v1_full,
        "lgbm_models": final_models,
        "metrics": {
            "v1_wape": round(v1_wape, 4),
            "v2_wape": round(v2_wape, 4),
            "v1_wape_pct": round(v1_wape * 100.0, 2),
            "v2_wape_pct": round(v2_wape * 100.0, 2),
            "promoted_v2": use_v2,
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    out_path = save_path or DEMAND_ARTIFACT_PATH
    joblib.dump(artifact, out_path)
    logger.info("Demand model trained & saved (%s): %s", version, artifact["metrics"])
    return artifact


# ---------------------------------------------------------------------------
# Daily 6 PM Inference + Reconciled Hourly Curve
# ---------------------------------------------------------------------------
def predict_demand_and_curves(
    orders: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    delivery_date: date,
    artifact: Optional[Dict[str, Any]] = None,
) -> Tuple[List[DemandForecastRecord], List[DemandCurvePoint]]:
    """
    Generate per-(hub, crop) demand forecasts and reconciled 04:00–10:00 IST
    hub-level cumulative curves (hub 10:00 total == exact sum of its crop rows).
    """
    art = artifact or joblib.load(DEMAND_ARTIFACT_PATH)
    inf_df = build_demand_inference_rows(orders, weather, holidays, delivery_date)

    use_v2: bool = bool(art["use_v2_lgbm"] and art["lgbm_models"] is not None)
    v1_preds = predict_demand_v1_baseline(inf_df, art["v1_stats"])
    if use_v2:
        v2_preds = enforce_monotonic_demand(
            np.column_stack([art["lgbm_models"][q].predict(inf_df[DEMAND_FEATURE_COLS]) for q in QUANTILES])
        )
    else:
        v2_preds = v1_preds

    history_counts: Dict[Tuple[str, str], int] = art["v1_stats"]["history_counts"]
    now_utc = datetime.now(timezone.utc)
    forecasts: List[DemandForecastRecord] = []

    for i, row in enumerate(inf_df.itertuples(index=False)):
        hub_id = str(row.hub_id)
        crop_id = str(row.crop_id)
        crop_cfg = CROPS[crop_id]
        hub_cfg = HUBS[hub_id]

        hist_days = history_counts.get((hub_id, crop_id), 0)
        is_cold_start = hist_days < MIN_DEMAND_HISTORY_DAYS

        # Cold-start pairs fall back to v1 stats (or 0 if unseen) rather than extrapolating with LightGBM
        if is_cold_start or not use_v2:
            q10, q50, q90 = v1_preds[i]
            model_type = "v1_baseline"
        else:
            q10, q50, q90 = v2_preds[i]
            model_type = "v2_lgbm"

        q10_r, q50_r, q90_r = round(float(q10), 2), round(float(q50), 2), round(float(q90), 2)
        lam = crop_cfg.buffer_lambda
        suggested = round(q50_r + lam * (q90_r - q50_r), 2)

        forecasts.append(
            DemandForecastRecord(
                hub_id=hub_id,
                hub_name_en=hub_cfg.name_en,
                crop_id=crop_id,
                crop_name_en=crop_cfg.name_en,
                delivery_date=delivery_date,
                q10_kg=q10_r,
                q50_kg=q50_r,
                q90_kg=q90_r,
                buffer_lambda=lam,
                suggested_procurement_kg=suggested,
                is_cold_start=is_cold_start,
                model_type=model_type,
                model_version=art["model_version"],
                generated_at=now_utc,
            )
        )

    # Reconciled hub-level cumulative curves (04:00 to 10:00 IST)
    # Hub totals are summed strictly from the emitted crop-level forecasts.
    curve_points: List[DemandCurvePoint] = []
    for hub_id in HUBS:
        hub_rows = [f for f in forecasts if f.hub_id == hub_id and not f.is_cold_start]
        tot_q10 = sum(r.q10_kg for r in hub_rows)
        tot_q50 = sum(r.q50_kg for r in hub_rows)
        tot_q90 = sum(r.q90_kg for r in hub_rows)

        for hr in DEMAND_CURVE_HOURS_IST:
            frac = DEFAULT_HOURLY_CUMULATIVE_PROFILE[hr]
            curve_points.append(
                DemandCurvePoint(
                    hub_id=hub_id,
                    delivery_date=delivery_date,
                    hour_ist=hr,
                    q10_kg=round(tot_q10 * frac, 2),
                    q50_kg=round(tot_q50 * frac, 2),
                    q90_kg=round(tot_q90 * frac, 2),
                )
            )

    return forecasts, curve_points


if __name__ == "__main__":
    from datetime import timedelta
    from ml.step1_ingest import run_ingest

    bundle = run_ingest()
    art = train_demand_model(bundle.orders, bundle.weather, bundle.holidays)
    tomorrow = date.today() + timedelta(days=1)
    forecasts, curves = predict_demand_and_curves(
        bundle.orders, bundle.weather, bundle.holidays, tomorrow, art
    )
    print(f"Generated {len(forecasts)} demand forecasts and {len(curves)} curve points for {tomorrow}")
    blr_sum = sum(f.q50_kg for f in forecasts if f.hub_id == "hub_blr_main")
    blr_10am = [c for c in curves if c.hub_id == "hub_blr_main" and c.hour_ist == "10:00"][0]
    print(f"Reconciliation check (Bengaluru Main Hub): sum(crops Q50)={blr_sum:.2f} kg | curve@10:00 Q50={blr_10am.q50_kg:.2f} kg")