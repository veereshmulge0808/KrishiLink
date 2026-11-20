"""Step 2: Strict no-lookahead feature engineering (6:00 PM Day t cutoff)."""

from __future__ import annotations

from datetime import date
from typing import List

import numpy as np
import pandas as pd

from ml.config import ACTIVE_TRAINABLE_CROPS, DATA_PROCESSED_DIR, HUBS

# Explicit feature lists (never rely on prefix-matching that can leak string IDs)
PRICE_FEATURE_COLS: List[str] = [
    "crop_cat",
    "price_lag_1",
    "price_lag_2",
    "price_lag_7",
    "price_lag_14",
    "price_mean_7",
    "price_std_30",
    "arrival_lag_1",
    "arrival_mean_7",
    "rain_lag_7d",
    "rain_lag_14d",
    "temp_mean_lag_7d",
    "forecast_rain_mm",
    "forecast_temp_mean_c",
    "dow",
    "month",
    "is_weekend",
    "is_festival",
    "demand_flag",
]

DEMAND_FEATURE_COLS: List[str] = [
    "hub_cat",
    "crop_cat",
    "req_lag_1",
    "req_lag_7",
    "req_lag_14",
    "req_lag_21",
    "req_mean_7",
    "req_mean_14",
    "req_std_14",
    "forecast_rain_mm",
    "forecast_temp_mean_c",
    "dow",
    "month",
    "is_weekend",
    "is_festival",
    "demand_flag",
]

_CROP_CATEGORIES = sorted(ACTIVE_TRAINABLE_CROPS)
_HUB_CATEGORIES = sorted(HUBS.keys())


def _merge_weather_and_calendar(
    df: pd.DataFrame,
    date_col: str,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
) -> pd.DataFrame:
    """Attach lagged weather (<= Day t), forecast weather (Day t+1), and calendar flags."""
    w = weather.sort_values("date").copy()
    # Shifted weather lags so Day t+1 only sees rainfall/temp observed up to Day t
    w["rain_lag_7d"] = w["rainfall_mm"].shift(1).rolling(7, min_periods=1).sum()
    w["rain_lag_14d"] = w["rainfall_mm"].shift(1).rolling(14, min_periods=1).sum()
    w["temp_mean_lag_7d"] = w["temp_mean_c"].shift(1).rolling(7, min_periods=1).mean()
    w = w.rename(
        columns={
            "rainfall_mm": "forecast_rain_mm",
            "temp_mean_c": "forecast_temp_mean_c",
        }
    )

    out = df.merge(
        w[
            [
                "date",
                "rain_lag_7d",
                "rain_lag_14d",
                "temp_mean_lag_7d",
                "forecast_rain_mm",
                "forecast_temp_mean_c",
            ]
        ],
        left_on=date_col,
        right_on="date",
        how="left",
        suffixes=("", "_w"),
    )
    if "date_w" in out.columns:
        out = out.drop(columns=["date_w"])
    if date_col != "date" and "date" in out.columns:
        out = out.drop(columns=["date"])

    if not holidays.empty:
        h = holidays[["date", "is_festival", "demand_flag"]].copy()
        out = out.merge(h, left_on=date_col, right_on="date", how="left", suffixes=("", "_h"))
        if "date_h" in out.columns:
            out = out.drop(columns=["date_h"])
        if date_col != "date" and "date" in out.columns:
            out = out.drop(columns=["date"])
    else:
        out["is_festival"] = 0
        out["demand_flag"] = 0

    out["is_festival"] = out["is_festival"].fillna(0).astype(int)
    out["demand_flag"] = out["demand_flag"].fillna(0).astype(int)
    out["dow"] = out[date_col].dt.day_of_week.astype(int)
    out["month"] = out[date_col].dt.month.astype(int)
    out["is_weekend"] = out["dow"].isin([5, 6]).astype(int)
    return out


def build_price_features(
    market_prices: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    drop_target_na: bool = True,
) -> pd.DataFrame:
    """
    Build no-lookahead features for the Price Range model.

    Row date represents `delivery_date` (Day t+1). All price/arrival lags are shifted
    by >= 1 day so they strictly reflect values known by 6:00 PM on Day t.
    """
    df = market_prices.sort_values(["crop_id", "date"]).copy()

    # Mask extreme outliers when computing historical lags so spikes don't corrupt features
    clean_price = df["modal_inr_per_kg"].where(~df["is_outlier"], np.nan)
    df["_clean_price"] = clean_price

    grp_price = df.groupby("crop_id")["_clean_price"]
    grp_arr = df.groupby("crop_id")["arrival_kg"]

    for lag in (1, 2, 7, 14):
        df[f"price_lag_{lag}"] = grp_price.shift(lag)

    df["price_mean_7"] = grp_price.transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())
    df["price_std_30"] = grp_price.transform(lambda s: s.shift(1).rolling(30, min_periods=7).std())

    df["arrival_lag_1"] = grp_arr.shift(1)
    df["arrival_mean_7"] = grp_arr.transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())

    df = _merge_weather_and_calendar(df, "date", weather, holidays)
    df["crop_cat"] = pd.Categorical(df["crop_id"], categories=_CROP_CATEGORIES)
    df = df.drop(columns=["_clean_price"])

    if drop_target_na:
        df = df[df["modal_inr_per_kg"].notna() & (~df["is_outlier"])].copy()
        df = df.dropna(subset=["price_lag_1", "price_lag_7", "price_mean_7"]).copy()

    return df.reset_index(drop=True)


def build_price_inference_rows(
    market_prices: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    delivery_date: date,
) -> pd.DataFrame:
    """
    Construct next-day (Day t+1) feature rows using strictly observations <= Day t.
    """
    target_ts = pd.Timestamp(delivery_date)
    cutoff_ts = target_ts - pd.Timedelta(days=1)

    hist = market_prices[market_prices["date"] <= cutoff_ts].copy()
    scaffold = pd.DataFrame(
        {
            "crop_id": ACTIVE_TRAINABLE_CROPS,
            "date": target_ts,
            "min_inr_per_kg": np.nan,
            "max_inr_per_kg": np.nan,
            "modal_inr_per_kg": np.nan,
            "arrival_kg": np.nan,
            "unit_original": "INR/quintal",
            "is_outlier": False,
        }
    )
    combined = pd.concat([hist, scaffold], ignore_index=True)
    feats = build_price_features(combined, weather, holidays, drop_target_na=False)
    return feats[feats["date"] == target_ts].reset_index(drop=True)


def build_demand_features(
    orders: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    drop_target_na: bool = True,
) -> pd.DataFrame:
    """
    Build no-lookahead per-hub, per-crop demand features.

    Target is ALWAYS `requested_kg` (never supply-capped `confirmed_kg`).
    """
    df = orders.sort_values(["hub_id", "crop_id", "delivery_date"]).copy()

    # Reindex to a full daily grid per (hub_id, crop_id) so lags represent true calendar days
    frames = []
    if not df.empty:
        min_d, max_d = df["delivery_date"].min(), df["delivery_date"].max()
        all_dates = pd.date_range(min_d, max_d, freq="D")
        for (hub_id, crop_id), g in df.groupby(["hub_id", "crop_id"]):
            r = g.set_index("delivery_date").reindex(all_dates)
            r.index.name = "delivery_date"
            r["hub_id"] = hub_id
            r["crop_id"] = crop_id
            frames.append(r.reset_index())
        df = pd.concat(frames, ignore_index=True)

    grp = df.groupby(["hub_id", "crop_id"])["requested_kg"]
    for lag in (1, 7, 14, 21):
        df[f"req_lag_{lag}"] = grp.shift(lag)

    df["req_mean_7"] = grp.transform(lambda s: s.shift(1).rolling(7, min_periods=2).mean())
    df["req_mean_14"] = grp.transform(lambda s: s.shift(1).rolling(14, min_periods=3).mean())
    df["req_std_14"] = grp.transform(lambda s: s.shift(1).rolling(14, min_periods=3).std())

    df = _merge_weather_and_calendar(df, "delivery_date", weather, holidays)
    df["hub_cat"] = pd.Categorical(df["hub_id"], categories=_HUB_CATEGORIES)
    df["crop_cat"] = pd.Categorical(df["crop_id"], categories=_CROP_CATEGORIES)

    if drop_target_na:
        df = df[df["requested_kg"].notna()].copy()
        df = df.dropna(subset=["req_lag_7", "req_mean_7"]).copy()

    return df.reset_index(drop=True)


def build_demand_inference_rows(
    orders: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    delivery_date: date,
) -> pd.DataFrame:
    """
    Construct next-day (Day t+1) demand feature rows for all (hub, active_crop) pairs
    using strictly order history <= Day t.
    """
    target_ts = pd.Timestamp(delivery_date)
    cutoff_ts = target_ts - pd.Timedelta(days=1)

    hist = orders[orders["delivery_date"] <= cutoff_ts].copy()
    scaffold_rows = [
        {
            "hub_id": hub_id,
            "crop_id": crop_id,
            "delivery_date": target_ts,
            "requested_kg": np.nan,
            "confirmed_kg": np.nan,
        }
        for hub_id in HUBS
        for crop_id in ACTIVE_TRAINABLE_CROPS
    ]
    combined = pd.concat([hist, pd.DataFrame(scaffold_rows)], ignore_index=True)
    feats = build_demand_features(combined, weather, holidays, drop_target_na=False)
    return feats[feats["delivery_date"] == target_ts].reset_index(drop=True)


if __name__ == "__main__":
    from ml.step1_ingest import run_ingest

    bundle = run_ingest()
    p_feats = build_price_features(bundle.market_prices, bundle.weather, bundle.holidays)
    d_feats = build_demand_features(bundle.orders, bundle.weather, bundle.holidays)
    p_feats.to_parquet(DATA_PROCESSED_DIR / "price_features.parquet", index=False) if False else None
    print(f"Price features shape:  {p_feats.shape} | cols: {len(PRICE_FEATURE_COLS)}")
    print(f"Demand features shape: {d_feats.shape} | cols: {len(DEMAND_FEATURE_COLS)}")