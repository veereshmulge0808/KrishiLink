"""Step 5: Validate ML outputs and publish to JSON snapshots and PostgreSQL."""

from __future__ import annotations

from datetime import date, datetime, timezone
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from ml.config import ARTIFACTS_DIR
from ml.schemas import DemandCurvePoint, DemandForecastRecord, PriceBandRecord

logger = logging.getLogger("krishilink.publish")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PUBLISHED_DIR = ARTIFACTS_DIR / "published"
PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)


def _dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, default=str)


def publish_to_json(
    delivery_date: date,
    price_bands: List[PriceBandRecord],
    demand_forecasts: List[DemandForecastRecord],
    demand_curves: List[DemandCurvePoint],
    run_meta: Optional[Dict[str, Any]] = None,
) -> Path:
    """Write validated JSON snapshots for a delivery date and update `latest/`."""
    # Re-validate via Pydantic serialization
    price_payload = [r.model_dump(mode="json") for r in price_bands]
    demand_payload = [r.model_dump(mode="json") for r in demand_forecasts]
    curve_payload = [r.model_dump(mode="json") for r in demand_curves]

    summary = {
        "delivery_date": delivery_date.isoformat(),
        "published_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "price_bands": len(price_payload),
            "demand_forecasts": len(demand_payload),
            "demand_curve_points": len(curve_payload),
        },
        "meta": run_meta or {},
    }

    for folder in (PUBLISHED_DIR / delivery_date.isoformat(), PUBLISHED_DIR / "latest"):
        _dump_json(folder / "price_bands.json", price_payload)
        _dump_json(folder / "demand_forecasts.json", demand_payload)
        _dump_json(folder / "demand_curves.json", curve_payload)
        _dump_json(folder / "run_summary.json", summary)

    logger.info("Published JSON snapshots to %s", PUBLISHED_DIR / delivery_date.isoformat())
    return PUBLISHED_DIR / delivery_date.isoformat()


def publish_to_postgres(
    db_url: str,
    delivery_date: date,
    price_bands: List[PriceBandRecord],
    demand_forecasts: List[DemandForecastRecord],
    demand_curves: List[DemandCurvePoint],
    run_meta: Optional[Dict[str, Any]] = None,
) -> None:
    """Idempotently upsert validated ML predictions into PostgreSQL."""
    from sqlalchemy import create_engine, text

    engine = create_engine(db_url)
    now_utc = datetime.now(timezone.utc)

    with engine.begin() as conn:
        # 1. Price bands (upsert on hub_id, crop_id, delivery_date)
        price_sql = text(
            """
            INSERT INTO price_bands (
                hub_id, crop_id, delivery_date, p10, p50, p90,
                published_low, published_high, coverage_pct, pricing_mode,
                is_fallback, is_overridden, override_low, override_high,
                override_reason, sparkline_7d, model_version, created_at
            ) VALUES (
                :hub_id, :crop_id, :delivery_date, :p10, :p50, :p90,
                :published_low, :published_high, :coverage_pct, :pricing_mode,
                :is_fallback, :is_overridden, :override_low, :override_high,
                :override_reason, CAST(:sparkline_7d AS JSONB), :model_version, :created_at
            )
            ON CONFLICT (hub_id, crop_id, delivery_date) DO UPDATE SET
                p10 = EXCLUDED.p10,
                p50 = EXCLUDED.p50,
                p90 = EXCLUDED.p90,
                published_low = CASE WHEN price_bands.is_overridden THEN price_bands.published_low ELSE EXCLUDED.published_low END,
                published_high = CASE WHEN price_bands.is_overridden THEN price_bands.published_high ELSE EXCLUDED.published_high END,
                coverage_pct = EXCLUDED.coverage_pct,
                pricing_mode = EXCLUDED.pricing_mode,
                is_fallback = EXCLUDED.is_fallback,
                sparkline_7d = EXCLUDED.sparkline_7d,
                model_version = EXCLUDED.model_version,
                created_at = EXCLUDED.created_at
            """
        )
        for r in price_bands:
            conn.execute(
                price_sql,
                {
                    "hub_id": r.hub_id,
                    "crop_id": r.crop_id,
                    "delivery_date": r.delivery_date,
                    "p10": r.p10,
                    "p50": r.p50,
                    "p90": r.p90,
                    "published_low": r.published_low,
                    "published_high": r.published_high,
                    "coverage_pct": r.coverage_pct,
                    "pricing_mode": r.pricing_mode,
                    "is_fallback": r.is_fallback,
                    "is_overridden": r.is_overridden,
                    "override_low": r.override_low,
                    "override_high": r.override_high,
                    "override_reason": r.override_reason,
                    "sparkline_7d": json.dumps([p.model_dump(mode="json") for p in r.sparkline_7d]),
                    "model_version": r.model_version,
                    "created_at": r.generated_at,
                },
            )

        # 2. Demand forecasts (upsert on hub_id, crop_id, delivery_date)
        demand_sql = text(
            """
            INSERT INTO demand_forecasts (
                hub_id, crop_id, delivery_date, q10_kg, q50_kg, q90_kg,
                buffer_lambda, suggested_procurement_kg, is_cold_start,
                model_type, model_version, created_at
            ) VALUES (
                :hub_id, :crop_id, :delivery_date, :q10_kg, :q50_kg, :q90_kg,
                :buffer_lambda, :suggested_procurement_kg, :is_cold_start,
                :model_type, :model_version, :created_at
            )
            ON CONFLICT (hub_id, crop_id, delivery_date) DO UPDATE SET
                q10_kg = EXCLUDED.q10_kg,
                q50_kg = EXCLUDED.q50_kg,
                q90_kg = EXCLUDED.q90_kg,
                buffer_lambda = EXCLUDED.buffer_lambda,
                suggested_procurement_kg = EXCLUDED.suggested_procurement_kg,
                is_cold_start = EXCLUDED.is_cold_start,
                model_type = EXCLUDED.model_type,
                model_version = EXCLUDED.model_version,
                created_at = EXCLUDED.created_at
            """
        )
        for d in demand_forecasts:
            conn.execute(
                demand_sql,
                {
                    "hub_id": d.hub_id,
                    "crop_id": d.crop_id,
                    "delivery_date": d.delivery_date,
                    "q10_kg": d.q10_kg,
                    "q50_kg": d.q50_kg,
                    "q90_kg": d.q90_kg,
                    "buffer_lambda": d.buffer_lambda,
                    "suggested_procurement_kg": d.suggested_procurement_kg,
                    "is_cold_start": d.is_cold_start,
                    "model_type": d.model_type,
                    "model_version": d.model_version,
                    "created_at": d.generated_at,
                },
            )

        # 3. Reconciled hourly curve points (upsert on hub_id, delivery_date, hour_ist)
        curve_sql = text(
            """
            INSERT INTO demand_curve_points (
                hub_id, delivery_date, hour_ist, q10_kg, q50_kg, q90_kg, created_at
            ) VALUES (
                :hub_id, :delivery_date, :hour_ist, :q10_kg, :q50_kg, :q90_kg, :created_at
            )
            ON CONFLICT (hub_id, delivery_date, hour_ist) DO UPDATE SET
                q10_kg = EXCLUDED.q10_kg,
                q50_kg = EXCLUDED.q50_kg,
                q90_kg = EXCLUDED.q90_kg,
                created_at = EXCLUDED.created_at
            """
        )
        for c in demand_curves:
            conn.execute(
                curve_sql,
                {
                    "hub_id": c.hub_id,
                    "delivery_date": c.delivery_date,
                    "hour_ist": c.hour_ist,
                    "q10_kg": c.q10_kg,
                    "q50_kg": c.q50_kg,
                    "q90_kg": c.q90_kg,
                    "created_at": now_utc,
                },
            )

        # 4. Audit entry in model_runs
        conn.execute(
            text(
                """
                INSERT INTO model_runs (model_name, run_type, status, metrics, started_at, finished_at)
                VALUES (:model_name, :run_type, :status, CAST(:metrics AS JSONB), :started_at, :finished_at)
                """
            ),
            {
                "model_name": "price_and_demand",
                "run_type": "predict",
                "status": "success",
                "metrics": json.dumps(
                    {
                        "delivery_date": delivery_date.isoformat(),
                        "price_bands": len(price_bands),
                        "demand_forecasts": len(demand_forecasts),
                        "meta": run_meta or {},
                    }
                ),
                "started_at": now_utc,
                "finished_at": now_utc,
            },
        )
    logger.info("Upserted ML predictions to PostgreSQL for %s", delivery_date)