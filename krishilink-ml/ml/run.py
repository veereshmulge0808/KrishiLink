"""CLI entry point for KrishiLink ML pipelines (--daily and --weekly)."""

from __future__ import annotations

import argparse
from datetime import date, timedelta
import logging
from typing import Dict, Any

from ml.step1_ingest import run_ingest
from ml.step3_price_model import PRICE_ARTIFACT_PATH, predict_price_bands, train_price_model
from ml.step4_demand_model import DEMAND_ARTIFACT_PATH, predict_demand_and_curves, train_demand_model
from ml.step5_publish import publish_to_json, publish_to_postgres

logger = logging.getLogger("krishilink.run")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_weekly(db_url: str | None = None) -> Dict[str, Any]:
    """Sunday 11 PM job: ingest latest data, retrain both models, evaluate promotion gates."""
    bundle = run_ingest(db_url=db_url, save_processed=True)
    price_art = train_price_model(bundle.market_prices, bundle.weather, bundle.holidays)
    demand_art = train_demand_model(bundle.orders, bundle.weather, bundle.holidays)
    result = {
        "price_version": price_art["model_version"],
        "price_metrics": price_art["metrics"],
        "demand_version": demand_art["model_version"],
        "demand_metrics": demand_art["metrics"],
    }
    logger.info("Weekly retrain complete: %s", result)
    return result


def run_daily(delivery_date: date | None = None, db_url: str | None = None) -> Dict[str, Any]:
    """Daily 6 PM job: generate & publish next-day price bands, demand forecasts, and curves."""
    target_date = delivery_date or (date.today() + timedelta(days=1))
    as_of = target_date - timedelta(days=1)

    bundle = run_ingest(as_of_date=as_of, db_url=db_url, save_processed=True)

    # Auto-bootstrap artifacts if not yet trained
    if not PRICE_ARTIFACT_PATH.exists():
        train_price_model(bundle.market_prices, bundle.weather, bundle.holidays)
    if not DEMAND_ARTIFACT_PATH.exists():
        train_demand_model(bundle.orders, bundle.weather, bundle.holidays)

    price_bands = predict_price_bands(
        bundle.market_prices, bundle.weather, bundle.holidays, target_date
    )
    demand_forecasts, demand_curves = predict_demand_and_curves(
        bundle.orders, bundle.weather, bundle.holidays, target_date
    )

    meta = {"as_of_date": as_of.isoformat(), "quality_report": bundle.quality_report}
    out_dir = publish_to_json(target_date, price_bands, demand_forecasts, demand_curves, meta)

    if db_url:
        publish_to_postgres(db_url, target_date, price_bands, demand_forecasts, demand_curves, meta)

    return {
        "delivery_date": target_date.isoformat(),
        "published_dir": str(out_dir),
        "price_bands": len(price_bands),
        "demand_forecasts": len(demand_forecasts),
        "demand_curve_points": len(demand_curves),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="KrishiLink ML Pipeline Runner")
    parser.add_argument("--weekly", action="store_true", help="Run weekly model retraining")
    parser.add_argument("--daily", action="store_true", help="Run daily 6 PM inference & publish")
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="Target delivery date YYYY-MM-DD (default: tomorrow)",
    )
    parser.add_argument("--db-url", type=str, default=None, help="Optional PostgreSQL SQLAlchemy URL")
    args = parser.parse_args()

    if not args.weekly and not args.daily:
        parser.error("Specify at least one of --weekly or --daily")

    if args.weekly:
        run_weekly(db_url=args.db_url)

    if args.daily:
        target = date.fromisoformat(args.date) if args.date else None
        res = run_daily(delivery_date=target, db_url=args.db_url)
        print(f"Daily publish succeeded: {res}")


if __name__ == "__main__":
    main()