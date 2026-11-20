"""Central configuration for KrishiLink ML pipelines."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = BASE_DIR / "data" / "raw"
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

for _d in (DATA_RAW_DIR, DATA_PROCESSED_DIR, ARTIFACTS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Locked Operational & Business Rules
# ---------------------------------------------------------------------------
CUTOFF_HOUR_IST: int = 18  # 6:00 PM IST previous-day order & listing cutoff
QUANTILES: List[float] = [0.10, 0.50, 0.90]

# Fix 1: Deterministic Published Target rule (inward trim toward P50)
PUBLISH_TRIM_PCT: float = 0.08  # 8% inward trim from P10/P90 toward P50

# Fix 2: Real measured P10-P90 coverage target (replaces hardcoded 92% badge)
TARGET_COVERAGE_MIN: float = 0.80
TARGET_COVERAGE_MAX: float = 0.95
COVERAGE_WINDOW_DAYS: int = 30

# Fix 3: Strict order-first default procurement buffer (0.0 = no speculative buying)
# Formula: suggested_procurement_kg = q50 + buffer_lambda * (q90 - q50)
DEFAULT_PROCUREMENT_BUFFER_LAMBDA: float = 0.0

# Fix 4: Reconciled hourly cumulative demand profile (04:00 to 10:00 IST)
# Must be monotonically non-decreasing and end at 1.00 so hub curve == sum of crops.
DEMAND_CURVE_HOURS_IST: List[str] = [
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
]
DEFAULT_HOURLY_CUMULATIVE_PROFILE: Dict[str, float] = {
    "04:00": 0.10,  # Early farm pickup & hub intake start
    "05:00": 0.25,
    "06:00": 0.45,  # Mini-hub sorting complete
    "07:00": 0.68,  # Delivery window opens (7-9 AM)
    "08:00": 0.86,
    "09:00": 0.96,  # Primary delivery target
    "10:00": 1.00,  # Hard delivery cutoff
}

# Fix 5: Organic pricing rule (until >= 60 days of real organic mandi/order data exist)
ORGANIC_PREMIUM_PCT: float = 0.35  # +35% over conventional Tomato band

# Demand model cold-start & promotion thresholds
MIN_DEMAND_HISTORY_DAYS: int = 14
MIN_PRICE_HISTORY_DAYS: int = 90


# ---------------------------------------------------------------------------
# Peer Hub Network (equal hubs, no central-only schema assumptions)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class HubConfig:
    hub_id: str
    name_en: str
    lat: float
    lon: float
    default_price_offset_inr: float = 0.0


HUBS: Dict[str, HubConfig] = {
    "hub_blr_main": HubConfig("hub_blr_main", "Bengaluru Main Hub", 12.9716, 77.5946, 0.0),
    "hub_hsr": HubConfig("hub_hsr", "HSR Layout Mini Hub", 12.9121, 77.6446, 0.5),
    "hub_whitefield": HubConfig("hub_whitefield", "Whitefield Mini Hub", 12.9698, 77.7500, 0.5),
    "hub_kolar": HubConfig("hub_kolar", "Kolar Mini Hub", 13.1362, 78.1292, -1.0),
    "hub_chikkaballapur": HubConfig(
        "hub_chikkaballapur", "Chikkaballapur Mini Hub", 13.4355, 77.7315, -1.0
    ),
}


# ---------------------------------------------------------------------------
# Crop Catalogue (10 durable v1 crops + derived Organic Tomato; Coriander disabled)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class CropConfig:
    crop_id: str
    name_en: str
    name_kn: str
    category: str
    is_active: bool = True
    is_organic_derived: bool = False
    base_crop_id: str | None = None
    buffer_lambda: float = DEFAULT_PROCUREMENT_BUFFER_LAMBDA
    min_plausible_inr_kg: float = 2.0
    max_plausible_inr_kg: float = 300.0


CROPS: Dict[str, CropConfig] = {
    "tomato": CropConfig("tomato", "Tomato", "ಟೊಮೆಟೊ", "fruit_vegetable"),
    "tomato_organic": CropConfig(
        "tomato_organic",
        "Tomato (Organic)",
        "ಟೊಮೆಟೊ (ಸಾವಯವ)",
        "fruit_vegetable",
        is_active=True,
        is_organic_derived=True,
        base_crop_id="tomato",
    ),
    "onion": CropConfig("onion", "Onion", "ಈರುಳ್ಳಿ", "bulb"),
    "potato": CropConfig("potato", "Potato", "ಆಲೂಗಡ್ಡೆ", "root"),
    "carrot": CropConfig("carrot", "Carrot", "ಗಜ್ಜರಿ", "root"),
    "french_beans": CropConfig("french_beans", "French Beans", "ಬೀನ್ಸ್", "fruit_vegetable"),
    "cabbage": CropConfig("cabbage", "Cabbage", "ಎಲೆಕೋಸು", "other"),
    "cauliflower": CropConfig("cauliflower", "Cauliflower", "ಹೂಕೋಸು", "other"),
    "brinjal": CropConfig("brinjal", "Brinjal (Eggplant)", "ಬದನೆಕಾಯಿ", "fruit_vegetable"),
    "green_chilli": CropConfig("green_chilli", "Green Chilli", "ಹಸಿರು ಮೆಣಸಿನಕಾಯಿ", "fruit_vegetable"),
    "capsicum": CropConfig("capsicum", "Capsicum (Bell Pepper)", "ದೊಡ್ಡ ಮೆಣಸಿನಕಾಯಿ", "fruit_vegetable"),
    # Deferred in v1 due to 1-2 day spoilage
    "coriander_leaves": CropConfig(
        "coriander_leaves", "Coriander Leaves", "ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು", "leafy", is_active=False
    ),
}

ACTIVE_TRAINABLE_CROPS: List[str] = [
    cid for cid, cfg in CROPS.items() if cfg.is_active and not cfg.is_organic_derived
]
ACTIVE_ALL_CROPS: List[str] = [cid for cid, cfg in CROPS.items() if cfg.is_active]

# Raw Agmarknet / data.gov.in commodity string -> canonical crop_id
AGMARKNET_CROP_MAP: Dict[str, str] = {
    "tomato": "tomato",
    "tomato (local)": "tomato",
    "tomato (hybrid)": "tomato",
    "onion": "onion",
    "onion (big)": "onion",
    "onion (small)": "onion",
    "potato": "potato",
    "carrot": "carrot",
    "french beans (frasbean)": "french_beans",
    "beans": "french_beans",
    "french beans": "french_beans",
    "cabbage": "cabbage",
    "cauliflower": "cauliflower",
    "brinjal": "brinjal",
    "green chilli": "green_chilli",
    "chilli green": "green_chilli",
    "capsicum": "capsicum",
}

# Expected Agmarknet CSV columns (verify against your first real CSV download)
AGMARKNET_COLUMN_MAP: Dict[str, str] = {
    "State": "state",
    "District": "district",
    "Market": "market_name",
    "Commodity": "raw_crop_name",
    "Variety": "variety",
    "Arrival_Date": "date",
    "Min Price": "min_price_raw",
    "Max Price": "max_price_raw",
    "Modal Price": "modal_price_raw",
    "Arrivals (Tonnes)": "arrival_raw",
}