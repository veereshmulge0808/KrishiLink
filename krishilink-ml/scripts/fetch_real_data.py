"""Fetch real Bengaluru historical weather + 2-day forecast from Open-Meteo."""

from __future__ import annotations

from datetime import date, timedelta
import pandas as pd
import requests

from ml.config import DATA_RAW_DIR, HUBS


def fetch_open_meteo_bengaluru(days_back: int = 730) -> pd.DataFrame:
    hub = HUBS["hub_blr_main"]
    end_hist = date.today() - timedelta(days=1)
    start_hist = end_hist - timedelta(days=days_back)

    # 1. Historical archive
    hist_url = "https://archive-api.open-meteo.com/v1/archive"
    hist_params = {
        "latitude": hub.lat,
        "longitude": hub.lon,
        "start_date": start_hist.isoformat(),
        "end_date": end_hist.isoformat(),
        "daily": "precipitation_sum,temperature_2m_min,temperature_2m_max,temperature_2m_mean",
        "timezone": "Asia/Kolkata",
    }
    r_hist = requests.get(hist_url, params=hist_params, timeout=30)
    r_hist.raise_for_status()
    d_hist = r_hist.json()["daily"]

    df_hist = pd.DataFrame(
        {
            "location_id": "bengaluru",
            "date": d_hist["time"],
            "rainfall_mm": d_hist["precipitation_sum"],
            "temp_min_c": d_hist["temperature_2m_min"],
            "temp_max_c": d_hist["temperature_2m_max"],
            "temp_mean_c": d_hist["temperature_2m_mean"],
        }
    )

    # 2. Today + next-day forecast
    fc_url = "https://api.open-meteo.com/v1/forecast"
    fc_params = {
        "latitude": hub.lat,
        "longitude": hub.lon,
        "forecast_days": 3,
        "daily": "precipitation_sum,temperature_2m_min,temperature_2m_max,temperature_2m_mean",
        "timezone": "Asia/Kolkata",
    }
    r_fc = requests.get(fc_url, params=fc_params, timeout=30)
    r_fc.raise_for_status()
    d_fc = r_fc.json()["daily"]

    df_fc = pd.DataFrame(
        {
            "location_id": "bengaluru",
            "date": d_fc["time"],
            "rainfall_mm": d_fc["precipitation_sum"],
            "temp_min_c": d_fc["temperature_2m_min"],
            "temp_max_c": d_fc["temperature_2m_max"],
            "temp_mean_c": d_fc["temperature_2m_mean"],
        }
    )

    df = (
        pd.concat([df_hist, df_fc], ignore_index=True)
        .drop_duplicates(subset=["date"], keep="last")
        .sort_values("date")
        .reset_index(drop=True)
    )
    out_path = DATA_RAW_DIR / "weather_daily.csv"
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} real Open-Meteo weather rows to {out_path}")
    return df


if __name__ == "__main__":
    fetch_open_meteo_bengaluru()