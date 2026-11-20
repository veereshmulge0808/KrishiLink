"""Fetch real Bengaluru historical mandi prices directly via the Agmarknet REST API."""

from datetime import date, timedelta
from pathlib import Path
import pandas as pd
from agmarknet import Agmarknet

OUT_PATH = Path("data/raw/agmarknet_prices.csv")
BACKUP_PATH = Path("data/raw_synthetic_backup/agmarknet_prices.csv")

# Active KrishiLink vegetables (Agmarknet commodity names)
COMMODITIES = [
    "Tomato",
    "Onion",
    "Potato",
    "Carrot",
    "Beans",
    "Cabbage",
    "Cauliflower",
    "Brinjal",
    "Green Chilli",
    "Capsicum",
]


def main() -> None:
    api = Agmarknet()
    end_dt = date.today()
    start_dt = end_dt - timedelta(days=730)  # 2 full years of history

    frames = []
    for crop in COMMODITIES:
        try:
            print(f"Fetching {crop} (Karnataka / Bangalore)...")
            df = api.report(
                start=start_dt.isoformat(),
                end=end_dt.isoformat(),
                commodity=crop,
                state="Karnataka",
                district="Bengaluru",
                data_type="price",
                progress=True,
            )
            if df is not None and not df.empty:
                print(f"  -> {len(df)} rows fetched for {crop}")
                frames.append(df)
            else:
                print(f"  -> 0 rows returned for {crop}")
        except Exception as exc:
            print(f"  -> Skipped {crop}: {exc}")

    if not frames:
        raise RuntimeError("No rows fetched from Agmarknet API.")

    raw = pd.concat(frames, ignore_index=True)

    # Standardize SDK columns to the Agmarknet CSV schema expected by step1_ingest.py
    rename_map = {
        "arrival_date": "Arrival_Date",
        "state_name": "State",
        "district_name": "District",
        "market_name": "Market",
        "cmdt_name": "Commodity",
        "variety_name": "Variety",
        "grade_name": "Grade",
        "min_price": "Min_x0020_Price",
        "max_price": "Max_x0020_Price",
        "model_price": "Modal_x0020_Price",
        "unit_name_price": "Unit",
    }
    raw = raw.rename(columns={k: v for k, v in rename_map.items() if k in raw.columns})

    raw.to_csv(OUT_PATH, index=False)
    print(f"\nSaved {len(raw)} total real price rows to {OUT_PATH}")
    print("Columns:", list(raw.columns))
    print(raw.head(3))


if __name__ == "__main__":
    main()