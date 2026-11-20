"""Step 1: Data ingestion, unit standardisation, cleaning, and quality logging."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
import logging
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd

from ml.config import (
    ACTIVE_TRAINABLE_CROPS,
    AGMARKNET_COLUMN_MAP,
    AGMARKNET_CROP_MAP,
    CROPS,
    DATA_PROCESSED_DIR,
    DATA_RAW_DIR,
    HUBS,
)

logger = logging.getLogger("krishilink.ingest")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


@dataclass
class IngestBundle:
    market_prices: pd.DataFrame
    weather: pd.DataFrame
    holidays: pd.DataFrame
    orders: pd.DataFrame
    quality_report: Dict[str, Dict[str, int]] = field(default_factory=dict)


def _standardise_crop_name(raw_name: object) -> Optional[str]:
    if pd.isna(raw_name):
        return None
    key = str(raw_name).strip().lower()
    if key in AGMARKNET_CROP_MAP:
        return AGMARKNET_CROP_MAP[key]
    # Fallback: match by substring for messy Agmarknet variants (e.g., "Tomato - Local")
    for pattern, crop_id in AGMARKNET_CROP_MAP.items():
        if pattern in key:
            return crop_id
    return None


def ingest_market_prices(
    csv_path: Path | None = None,
    as_of_date: date | None = None,
    price_unit: str = "quintal",
) -> tuple[pd.DataFrame, Dict[str, int]]:
    """Load, standardise, deduplicate, and clean Agmarknet / data.gov.in price CSV."""
    path = csv_path or (DATA_RAW_DIR / "agmarknet_prices.csv")
    df = pd.read_csv(path)
    stats: Dict[str, int] = {"raw_rows": len(df)}

    # Rename known Agmarknet columns if present
    rename_map = {k: v for k, v in AGMARKNET_COLUMN_MAP.items() if k in df.columns}
    df = df.rename(columns=rename_map)

    required = {"market_name", "raw_crop_name", "date", "modal_price_raw"}
    missing_cols = required - set(df.columns)
    if missing_cols:
        raise ValueError(f"Market CSV missing required columns: {sorted(missing_cols)}")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    bad_dates = int(df["date"].isna().sum())
    df = df.dropna(subset=["date"]).copy()
    stats["dropped_bad_dates"] = bad_dates

    # Reject future timestamps relative to as_of_date (or today)
    cutoff_ts = pd.Timestamp(as_of_date or date.today())
    future_mask = df["date"] > cutoff_ts
    stats["dropped_future_rows"] = int(future_mask.sum())
    df = df.loc[~future_mask].copy()

    # Standardise crop names and keep active trainable v1 crops
    df["crop_id"] = df["raw_crop_name"].map(_standardise_crop_name)
    unmapped = int(df["crop_id"].isna().sum())
    df = df[df["crop_id"].isin(ACTIVE_TRAINABLE_CROPS)].copy()
    stats["dropped_unmapped_or_inactive_crops"] = unmapped

    # Convert prices to INR/kg (Agmarknet reports INR/quintal = 100 kg)
    divisor = 100.0 if price_unit.lower() == "quintal" else 1.0
    for raw_col, out_col in [
        ("min_price_raw", "min_inr_per_kg"),
        ("max_price_raw", "max_inr_per_kg"),
        ("modal_price_raw", "modal_inr_per_kg"),
    ]:
        if raw_col in df.columns:
            df[out_col] = pd.to_numeric(df[raw_col], errors="coerce") / divisor
        else:
            df[out_col] = np.nan
    df["unit_original"] = f"INR/{price_unit}"

    # Convert arrivals (Tonnes -> kg)
    if "arrival_raw" in df.columns:
        df["arrival_kg"] = pd.to_numeric(df["arrival_raw"], errors="coerce") * 1000.0
    else:
        df["arrival_kg"] = np.nan

    # Drop impossible / non-positive modal prices
    non_pos = int((df["modal_inr_per_kg"].isna() | (df["modal_inr_per_kg"] <= 0)).sum())
    df = df[df["modal_inr_per_kg"] > 0].copy()
    stats["dropped_non_positive_prices"] = non_pos

    # Deduplicate on (source, market_id, crop_id, date) keeping latest row
    df["source"] = "agmarknet"
    df["market_id"] = df["market_name"].astype(str).str.strip().str.lower().str.replace(" ", "_")
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["source", "market_id", "crop_id", "date"], keep="last")
    stats["dropped_duplicates"] = before_dedup - len(df)

    # Aggregate across Bengaluru markets per (crop_id, date) using median modal price & sum arrivals
    agg = (
        df.groupby(["crop_id", "date"], as_index=False)
        .agg(
            min_inr_per_kg=("min_inr_per_kg", "median"),
            max_inr_per_kg=("max_inr_per_kg", "median"),
            modal_inr_per_kg=("modal_inr_per_kg", "median"),
            arrival_kg=("arrival_kg", "sum"),
            unit_original=("unit_original", "first"),
        )
        .sort_values(["crop_id", "date"])
        .reset_index(drop=True)
    )

   # Flag plausible-range violations and statistical IQR outliers (exclude extreme spikes from training)
    agg["is_outlier"] = False
    for crop_id, idx in agg.groupby("crop_id").groups.items():
        cfg = CROPS[crop_id]
        s = agg.loc[idx, "modal_inr_per_kg"]
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = max(q3 - q1, 1.0)
        iqr_flag = (s < (q1 - 3.0 * iqr)) | (s > (q3 + 3.0 * iqr))
        bounds_flag = (s < cfg.min_plausible_inr_kg) | (s > cfg.max_plausible_inr_kg)
        agg.loc[idx, "is_outlier"] = iqr_flag | bounds_flag

    # Reindex to a complete daily calendar per crop so missing dates remain NaN (no blind forward-fill)
    full_frames = []
    if not agg.empty:
        min_d, max_d = agg["date"].min(), agg["date"].max()
        all_dates = pd.date_range(min_d, max_d, freq="D")
        for crop_id, g in agg.groupby("crop_id"):
            reindexed = g.set_index("date").reindex(all_dates)
            reindexed.index.name = "date"
            reindexed["crop_id"] = crop_id
            reindexed["is_outlier"] = reindexed["is_outlier"].fillna(False).astype(bool)
            full_frames.append(reindexed.reset_index())
        out = pd.concat(full_frames, ignore_index=True)
    else:
        out = agg

    stats["clean_rows"] = len(out)
    stats["missing_price_days"] = int(out["modal_inr_per_kg"].isna().sum())
    logger.info("Market prices ingested: %s", stats)
    return out, stats


def ingest_weather(csv_path: Path | None = None) -> tuple[pd.DataFrame, Dict[str, int]]:
    """Load daily weather history and forecast."""
    path = csv_path or (DATA_RAW_DIR / "weather_daily.csv")
    df = pd.read_csv(path)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).copy()
    for col in ("rainfall_mm", "temp_min_c", "temp_max_c", "temp_mean_c"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.drop_duplicates(subset=["date"], keep="last").sort_values("date").reset_index(drop=True)
    stats = {"clean_rows": len(df)}
    logger.info("Weather ingested: %s", stats)
    return df, stats


def ingest_holidays(csv_path: Path | None = None) -> tuple[pd.DataFrame, Dict[str, int]]:
    """Load Karnataka holiday & festival reference table."""
    path = csv_path or (DATA_RAW_DIR / "holidays.csv")
    if not path.exists():
        return pd.DataFrame(columns=["date", "name", "is_festival", "demand_flag"]), {"clean_rows": 0}
    df = pd.read_csv(path)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"], keep="last")
    df["is_festival"] = df["is_festival"].fillna(0).astype(int)
    df["demand_flag"] = df["demand_flag"].fillna(0).astype(int)
    stats = {"clean_rows": len(df)}
    logger.info("Holidays ingested: %s", stats)
    return df, stats


def ingest_orders(
    csv_path: Path | None = None,
    db_url: str | None = None,
    as_of_date: date | None = None,
) -> tuple[pd.DataFrame, Dict[str, int]]:
    """Load daily per-hub, per-crop orders (requested_kg) from PostgreSQL or CSV."""
    if db_url:
        from sqlalchemy import create_engine, text

        engine = create_engine(db_url)
        query = text(
            """
            SELECT
                b.home_hub_id AS hub_id,
                ol.crop_id,
                o.delivery_date,
                SUM(ol.requested_kg) AS requested_kg,
                SUM(COALESCE(ol.confirmed_kg, 0)) AS confirmed_kg
            FROM order_lines ol
            JOIN orders o ON o.id = ol.order_id
            JOIN buyers b ON b.user_id = o.buyer_id
            WHERE o.status NOT IN ('draft', 'expired', 'cancelled')
            GROUP BY b.home_hub_id, ol.crop_id, o.delivery_date
            """
        )
        df = pd.read_sql(query, engine)
    else:
        path = csv_path or (DATA_RAW_DIR / "orders_daily.csv")
        df = pd.read_csv(path)

    stats: Dict[str, int] = {"raw_rows": len(df)}
    df["delivery_date"] = pd.to_datetime(df["delivery_date"], errors="coerce")
    df = df.dropna(subset=["delivery_date"]).copy()

    # Reject unknown hub IDs and inactive crops
    valid_hubs = set(HUBS.keys())
    unknown_hubs = int((~df["hub_id"].isin(valid_hubs)).sum())
    df = df[df["hub_id"].isin(valid_hubs) & df["crop_id"].isin(ACTIVE_TRAINABLE_CROPS)].copy()
    stats["dropped_unknown_hub_or_inactive_crop"] = unknown_hubs

    # Enforce cutoff: exclude future deliveries beyond as_of_date when loading historical training data
    if as_of_date is not None:
        df = df[df["delivery_date"] <= pd.Timestamp(as_of_date)].copy()

    df["requested_kg"] = pd.to_numeric(df["requested_kg"], errors="coerce")
    df["confirmed_kg"] = pd.to_numeric(df.get("confirmed_kg", np.nan), errors="coerce")
    df = df[df["requested_kg"] >= 0].copy()

    df = (
        df.groupby(["hub_id", "crop_id", "delivery_date"], as_index=False)
        .agg(requested_kg=("requested_kg", "sum"), confirmed_kg=("confirmed_kg", "sum"))
        .sort_values(["hub_id", "crop_id", "delivery_date"])
        .reset_index(drop=True)
    )
    stats["clean_rows"] = len(df)
    logger.info("Orders ingested: %s", stats)
    return df, stats


def run_ingest(
    as_of_date: date | None = None,
    db_url: str | None = None,
    save_processed: bool = True,
) -> IngestBundle:
    """Run all ingestion steps and optionally persist cleaned CSVs."""
    prices, p_stats = ingest_market_prices(as_of_date=as_of_date)
    weather, w_stats = ingest_weather()
    holidays, h_stats = ingest_holidays()
    orders, o_stats = ingest_orders(db_url=db_url, as_of_date=as_of_date)

    if save_processed:
        prices.to_csv(DATA_PROCESSED_DIR / "market_prices_clean.csv", index=False)
        weather.to_csv(DATA_PROCESSED_DIR / "weather_clean.csv", index=False)
        holidays.to_csv(DATA_PROCESSED_DIR / "holidays_clean.csv", index=False)
        orders.to_csv(DATA_PROCESSED_DIR / "orders_clean.csv", index=False)

    return IngestBundle(
        market_prices=prices,
        weather=weather,
        holidays=holidays,
        orders=orders,
        quality_report={
            "market_prices": p_stats,
            "weather": w_stats,
            "holidays": h_stats,
            "orders": o_stats,
        },
    )


if __name__ == "__main__":
    run_ingest()