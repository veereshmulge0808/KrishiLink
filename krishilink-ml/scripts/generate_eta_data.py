"""Generate realistic Bengaluru trip-leg timing logs joined with real Open-Meteo weather."""

from pathlib import Path
import numpy as np
import pandas as pd

RAW_DIR = Path("data/raw")
WEATHER_PATH = RAW_DIR / "weather_daily.csv"
OUT_PATH = RAW_DIR / "trip_legs.csv"

# Bengaluru hub zones and village feeder corridors
ZONES = {
    "bengaluru_central": 1.15,        # Yeshwanthpur / KR Market
    "bengaluru_east": 1.25,           # Whitefield / ORR
    "bengaluru_south": 1.20,          # HSR Layout / Electronic City
    "bengaluru_north": 1.08,          # Yelahanka / Hebbal
    "kolar_corridor": 0.98,           # Hoskote / Kolar highway
    "chikkaballapur_corridor": 0.96,  # Doddaballapur / Chikkaballapur
}

ROUTE_KINDS = ["pickup", "delivery", "transfer"]

# Realistic Bengaluru hourly congestion profile (04:00 to 12:00 IST operations window)
HOURLY_BASE_MULT = {
    4: 0.95,
    5: 0.98,
    6: 1.08,
    7: 1.25,
    8: 1.52,
    9: 1.72,   # Peak Bengaluru morning rush
    10: 1.58,
    11: 1.38,
    12: 1.28,
}


def generate_eta_logs(n_legs_per_day: int = 24, seed: int = 42) -> None:
    rng = np.random.default_rng(seed)

    if not WEATHER_PATH.exists():
        raise FileNotFoundError(f"Missing {WEATHER_PATH}. Run scripts.fetch_real_data first.")

    weather = pd.read_csv(WEATHER_PATH)
    date_col = "date" if "date" in weather.columns else weather.columns[1]
    rain_col = "rainfall_mm" if "rainfall_mm" in weather.columns else weather.columns[2]

    weather[date_col] = pd.to_datetime(weather[date_col])
    # Use historical dates up to today for training logs
    today = pd.Timestamp.today().normalize()
    weather = weather[weather[date_col] <= today].sort_values(date_col).tail(365)

    zone_names = list(ZONES.keys())
    hours = list(HOURLY_BASE_MULT.keys())
    rows = []

    for _, wrow in weather.iterrows():
        dt = wrow[date_col]
        dow = int(dt.dayofweek)
        is_weekend = int(dow >= 5)
        rain_mm = float(wrow[rain_col]) if pd.notna(wrow[rain_col]) else 0.0

        for _ in range(n_legs_per_day):
            zone = rng.choice(zone_names)
            route_kind = rng.choice(ROUTE_KINDS, p=[0.45, 0.40, 0.15])

            # Pickups cluster 4-6 AM, deliveries 7-10 AM, transfers 6-8 AM
            if route_kind == "pickup":
                hour = int(rng.choice([4, 5, 6], p=[0.40, 0.40, 0.20]))
                dist_km = float(rng.uniform(4.0, 22.0))
            elif route_kind == "delivery":
                hour = int(rng.choice([7, 8, 9, 10], p=[0.30, 0.35, 0.25, 0.10]))
                dist_km = float(rng.uniform(3.0, 18.0))
            else:
                hour = int(rng.choice([6, 7, 8], p=[0.40, 0.40, 0.20]))
                dist_km = float(rng.uniform(15.0, 45.0))

            # OSRM free-flow baseline (~35 km/h city, ~48 km/h highway corridors)
            base_speed_kmh = 48.0 if "corridor" in zone else 34.0
            osrm_minutes = round((dist_km / base_speed_kmh) * 60.0, 2)

            # True traffic multiplier
            mult = HOURLY_BASE_MULT[hour] * ZONES[zone]

            # Weekends have noticeably lighter morning rush in Bengaluru
            if is_weekend and hour >= 7:
                mult *= 0.82

            # Rain impact: heavier slowdown in city zones than open highways
            if rain_mm > 1.0:
                rain_factor = min(0.40, 0.04 * np.log1p(rain_mm) * (1.8 if "corridor" not in zone else 1.0))
                mult *= (1.0 + rain_factor)

            # Realistic trip-to-trip noise (signals, loading friction)
            noise = rng.normal(0.0, 0.09)
            actual_mult = float(np.clip(mult + noise, 0.85, 2.80))
            actual_minutes = round(osrm_minutes * actual_mult, 2)

            rows.append({
                "date": dt.strftime("%Y-%m-%d"),
                "hour": hour,
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "zone_id": zone,
                "route_kind": route_kind,
                "distance_km": round(dist_km, 2),
                "osrm_base_minutes": osrm_minutes,
                "rainfall_mm": round(rain_mm, 2),
                "actual_minutes": actual_minutes,
                "traffic_multiplier": round(actual_mult, 4),
            })

    df = pd.DataFrame(rows)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"Saved {len(df)} realistic Bengaluru trip legs to {OUT_PATH}")
    print(df.head(3))


if __name__ == "__main__":
    generate_eta_logs()