"""Prefect flow wrappers for KrishiLink scheduled ML jobs (BACKEND.md Section 4)."""

from __future__ import annotations

from datetime import date, timedelta
import os

from ml.run import run_daily, run_weekly
from ml.step1_ingest import run_ingest

try:
    from prefect import flow, task  # type: ignore[import-not-found]
except ImportError:  # Allows importing without Prefect installed locally
    def flow(name: str = ""):
        return lambda fn: fn
    def task(name: str = ""):
        return lambda fn: fn


@task(name="daily_ml_inference")
def daily_inference_task(target_date: date, db_url: str | None) -> dict:
    return run_daily(delivery_date=target_date, db_url=db_url)


@flow(name="krishilink-daily-6pm-ml")
def daily_6pm_ml_flow(target_date: date | None = None) -> dict:
    """Scheduled daily at 18:05 IST (immediately after 6 PM order/listing cutoff)."""
    db_url = os.getenv("DATABASE_URL")
    return daily_inference_task(target_date or (date.today() + timedelta(days=1)), db_url)


@flow(name="krishilink-daily-1130pm-snapshot")
def daily_1130pm_snapshot_flow() -> dict:
    """Scheduled daily at 23:30 IST to persist cleaned daily actuals."""
    db_url = os.getenv("DATABASE_URL")
    bundle = run_ingest(as_of_date=date.today(), db_url=db_url, save_processed=True)
    return bundle.quality_report


@flow(name="krishilink-sunday-11pm-retrain")
def weekly_retrain_flow() -> dict:
    """Scheduled Sundays at 23:00 IST for rolling retraining & promotion gating."""
    db_url = os.getenv("DATABASE_URL")
    return run_weekly(db_url=db_url)