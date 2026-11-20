"""FastAPI adapter (`backend/app/ml_client/`) for reading ML predictions with safe fallbacks."""

from __future__ import annotations

from datetime import date
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from ml.step5_publish import PUBLISHED_DIR


class MLClient:
    """Reads published ML outputs (JSON mode for prototype, PostgreSQL when db_url is provided)."""

    def __init__(self, published_dir: Path = PUBLISHED_DIR) -> None:
        self.published_dir = published_dir

    def _load_json(self, path: Path) -> Optional[List[Dict[str, Any]]]:
        if not path.exists():
            return None
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def get_price_bands(
        self, delivery_date: date, hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Return price bands for `delivery_date`.
        Per BACKEND.md failure handling: if target date is missing, serve the last valid
        band with `is_stale = True`.
        """
        target_file = self.published_dir / delivery_date.isoformat() / "price_bands.json"
        rows = self._load_json(target_file)
        is_stale = False

        if rows is None:
            fallback_file = self.published_dir / "latest" / "price_bands.json"
            rows = self._load_json(fallback_file) or []
            is_stale = True

        if hub_id:
            rows = [r for r in rows if r["hub_id"] == hub_id]

        return {
            "delivery_date": delivery_date.isoformat(),
            "is_stale": is_stale,
            "items": rows,
        }

    def get_demand_dashboard(
        self, delivery_date: date, hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Return per-hub demand forecasts and reconciled 04:00-10:00 IST hourly curve.
        Per BACKEND.md failure handling: if ML outputs for the date are missing, hide
        demand suggestions (`is_available = False`).
        """
        day_dir = self.published_dir / delivery_date.isoformat()
        forecasts = self._load_json(day_dir / "demand_forecasts.json")
        curves = self._load_json(day_dir / "demand_curves.json")

        if forecasts is None or curves is None:
            return {
                "delivery_date": delivery_date.isoformat(),
                "is_available": False,
                "forecasts": [],
                "curve_points": [],
            }

        # Hide cold-start rows from procurement suggestions
        visible_forecasts = [f for f in forecasts if not f.get("is_cold_start", False)]
        if hub_id:
            visible_forecasts = [f for f in visible_forecasts if f["hub_id"] == hub_id]
            curves = [c for c in curves if c["hub_id"] == hub_id]

        return {
            "delivery_date": delivery_date.isoformat(),
            "is_available": True,
            "forecasts": visible_forecasts,
            "curve_points": curves,
        }


def compute_stockout_prevention_pct(db_url: str, delivery_date: date) -> float:
    """
    Non-ML backend KPI: percentage of requested order volume fulfilled without stockout
    after deterministic 7:15 PM lateral transfers.
    """
    from sqlalchemy import create_engine, text

    engine = create_engine(db_url)
    query = text(
        """
        SELECT
            COALESCE(SUM(ol.requested_kg), 0) AS total_requested_kg,
            COALESCE(SUM(ol.confirmed_kg), 0) AS total_confirmed_kg
        FROM order_lines ol
        JOIN orders o ON o.id = ol.order_id
        WHERE o.delivery_date = :d
          AND o.status NOT IN ('draft', 'cancelled', 'expired')
        """
    )
    with engine.connect() as conn:
        row = conn.execute(query, {"d": delivery_date}).mappings().first()
    if not row or float(row["total_requested_kg"]) <= 0:
        return 100.0
    return round(min(100.0, (float(row["total_confirmed_kg"]) / float(row["total_requested_kg"])) * 100.0), 1)