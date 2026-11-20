"""Generate 2 years of realistic synthetic Bengaluru data for pipeline testing."""

from __future__ import annotations

from datetime import date, timedelta
import numpy as np
import pandas as pd  # type: ignore[import-not-found,import-untyped]

from ml.config import (
    ACTIVE_TRAINABLE_CROPS,
    DATA_RAW_DIR,
    HUBS,
)

BASE_PRICES_INR_KG = {
    "tomato": 26.0,
    "onion": 31.0,
    "potato": 26.0,
    "carrot": 39.0,
    "french_beans": 47.0,
    "cabbage": 20.0,
    "cauliflower": 31.0,
    "brinjal": 30.0,
    "green_chilli": 58.0,
    "capsicum": 52.0,
}

HUB_DEMAND_SCALE = {
    "hub_blr_main": 1.00,
    "hub_hsr": 0.45,
    "hub_whitefield": 0.35,
    "hub_kolar": 0.25,
    "hub_chikkaballapur": 0.20,
}

CROP_DEMAND_BASE_KG = {
    "tomato": 350.0,
    "onion": 300.0,
    "potato": 250.0,
    "carrot": 120.0,
    "french_beans": 90.0,
    "cabbage": 110.0,
    "cauliflower": 95.0,
    "brinjal": 80.0,
    "green_chilli": 45.0,
    "capsicum": 60.0,
}

def generate_all(n_days: int = 730, end_date: date | None = None, seed: int = 42) -> None:
    rng = np.random.default_rng(seed)
    end_dt = end_date or date.today()
    dates = [end_dt - timedelta(days=n_days - 1 - i) for i in range(n_days)]

    # 1. Holidays (Karnataka major demand-driving festivals)
    holiday_rows = []
    for d in dates:
        is_fest = (d.month, d.day) in {
            (1, 14),   # Makara Sankranti
            (3, 30),   # Ugadi (approx)
            (8, 27),   # Ganesh Chaturthi (approx)
            (10, 12),  # Dasara (approx)
            (11, 1),   # Kannada Rajyotsava / Diwali window
        }
        if is_fest:
            holiday_rows.append(
                {"date": d.isoformat(), "name": "Karnataka Festival", "is_festival": 1, "demand_flag": 1}
            )
    pd.DataFrame(holiday_rows).to_csv(DATA_RAW_DIR / "holidays.csv", index=False)
    fest_dates = {r["date"] for r in holiday_rows}

    # 2. Daily Bengaluru Weather (monsoon Jun-Sep higher rain)
    weather_rows = []
    for d in dates:
        monsoon = 1.0 if 6 <= d.month <= 9 else 0.15
        rain = float(max(0.0, rng.gamma(shape=1.5, scale=8.0 * monsoon) - 1.0))
        t_mean = float(24.0 + 3.5 * np.sin(2 * np.pi * (d.timetuple().tm_yday - 60) / 365.0) + rng.normal(0, 1.2))
        weather_rows.append(
            {
                "location_id": "bengaluru",
                "date": d.isoformat(),
                "rainfall_mm": round(rain, 2),
                "temp_min_c": round(t_mean - 4.5, 2),
                "temp_max_c": round(t_mean + 4.5, 2),
                "temp_mean_c": round(t_mean, 2),
            }
        )
    weather_df = pd.DataFrame(weather_rows)
    weather_df.to_csv(DATA_RAW_DIR / "weather_daily.csv", index=False)
    rain_map = dict(zip(weather_df["date"], weather_df["rainfall_mm"]))

    # 3. Raw Agmarknet-style Mandi Prices (stored in INR/quintal to test unit conversion)
    price_rows = []
    for crop_id in ACTIVE_TRAINABLE_CROPS:
        base = BASE_PRICES_INR_KG[crop_id]
        level = base
        for i, d in enumerate(dates):
            d_str = d.isoformat()
            seasonal = 0.12 * base * np.sin(2 * np.pi * d.timetuple().tm_yday / 365.0)
            rain_shock = 0.08 * rain_map[d_str] if crop_id in {"tomato", "french_beans", "green_chilli"} else 0.02 * rain_map[d_str]
            fest_boost = 0.10 * base if d_str in fest_dates else 0.0
            level = 0.85 * level + 0.15 * (base + seasonal) + rng.normal(0, 0.04 * base)
            modal_kg = max(4.0, level + rain_shock + fest_boost)
            min_kg = max(2.0, modal_kg * rng.uniform(0.84, 0.92))
            max_kg = modal_kg * rng.uniform(1.08, 1.18)
            arrival_tonnes = max(1.0, rng.normal(45.0, 10.0) - 0.3 * rain_map[d_str])

            price_rows.append(
                {
                    "State": "Karnataka",
                    "District": "Bangalore",
                    "Market": "Yeshwanthpur APMC",
                    "Commodity": crop_id.replace("_", " ").title(),
                    "Variety": "Local",
                    "Arrival_Date": d_str,
                    "Min Price": round(min_kg * 100.0, 2),      # INR / quintal
                    "Max Price": round(max_kg * 100.0, 2),      # INR / quintal
                    "Modal Price": round(modal_kg * 100.0, 2),  # INR / quintal
                    "Arrivals (Tonnes)": round(arrival_tonnes, 2),
                }
            )
    pd.DataFrame(price_rows).to_csv(DATA_RAW_DIR / "agmarknet_prices.csv", index=False)

    # 4. Internal Orders (requested_kg vs supply-capped confirmed_kg)
    order_rows = []
    for hub_id in HUBS:
        h_scale = HUB_DEMAND_SCALE[hub_id]
        for crop_id in ACTIVE_TRAINABLE_CROPS:
            c_base = CROP_DEMAND_BASE_KG[crop_id] * h_scale
            for d in dates:
                d_str = d.isoformat()
                dow_mult = 1.22 if d.weekday() in (4, 5) else (0.88 if d.weekday() == 6 else 1.0)
                fest_mult = 1.30 if d_str in fest_dates else 1.0
                rain_mult = 0.94 if rain_map[d_str] > 12.0 else 1.0
                requested = max(5.0, c_base * dow_mult * fest_mult * rain_mult * rng.normal(1.0, 0.10))
                # Confirmed kg is sometimes capped by supply (demonstrates why we train on requested_kg)
                confirmed = requested * (rng.uniform(0.82, 0.95) if rng.random() < 0.25 else 1.0)
                order_rows.append(
                    {
                        "hub_id": hub_id,
                        "crop_id": crop_id,
                        "delivery_date": d_str,
                        "requested_kg": round(requested, 2),
                        "confirmed_kg": round(confirmed, 2),
                    }
                )
    pd.DataFrame(order_rows).to_csv(DATA_RAW_DIR / "orders_daily.csv", index=False)
    print(f"Synthetic datasets written to {DATA_RAW_DIR}")


if __name__ == "__main__":
    generate_all()