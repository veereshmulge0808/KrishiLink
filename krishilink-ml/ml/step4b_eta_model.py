"""Step 4b: Travel-Time (ETA) traffic multiplier model with promotion gate."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error

RAW_LEGS_PATH = Path("data/raw/trip_legs.csv")
ARTIFACT_PATH = Path("artifacts/eta_model.joblib")
PUBLISHED_PROFILE_PATH = Path("artifacts/published/eta_zone_profile.json")

ZONES = [
    "bengaluru_central",
    "bengaluru_east",
    "bengaluru_south",
    "bengaluru_north",
    "kolar_corridor",
    "chikkaballapur_corridor",
]
ROUTE_KINDS = ["pickup", "delivery", "transfer"]


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    out["hour"] = df["hour"].astype(int)
    out["hour_sin"] = np.sin(2 * np.pi * out["hour"] / 24.0)
    out["hour_cos"] = np.cos(2 * np.pi * out["hour"] / 24.0)
    out["day_of_week"] = df["day_of_week"].astype(int)
    out["is_weekend"] = df["is_weekend"].astype(int)
    out["distance_km"] = df["distance_km"].astype(float)
    out["osrm_base_minutes"] = df["osrm_base_minutes"].astype(float)
    out["rainfall_mm"] = df["rainfall_mm"].astype(float)
    out["is_raining"] = (out["rainfall_mm"] > 1.0).astype(int)

    for z in ZONES:
        out[f"zone_{z}"] = (df["zone_id"] == z).astype(int)
    for rk in ROUTE_KINDS:
        out[f"kind_{rk}"] = (df["route_kind"] == rk).astype(int)
    return out


def _fit_v1_baseline(train_df: pd.DataFrame) -> dict[str, Any]:
    grouped = (
        train_df.groupby(["zone_id", "hour", "is_weekend"])["traffic_multiplier"]
        .agg(p50="median", p90=lambda s: float(np.quantile(s, 0.90)))
        .reset_index()
    )
    lookup = {
        (row.zone_id, int(row.hour), int(row.is_weekend)): (float(row.p50), float(row.p90))
        for row in grouped.itertuples(index=False)
    }
    global_p50 = float(train_df["traffic_multiplier"].median())
    global_p90 = float(train_df["traffic_multiplier"].quantile(0.90))
    return {"lookup": lookup, "global_p50": global_p50, "global_p90": global_p90}


def _predict_v1_baseline(baseline: dict[str, Any], df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    lookup = baseline["lookup"]
    gp50, gp90 = baseline["global_p50"], baseline["global_p90"]
    p50_list, p90_list = [], []
    for row in df.itertuples(index=False):
        m50, m90 = lookup.get((row.zone_id, int(row.hour), int(row.is_weekend)), (gp50, gp90))
        p50_list.append(m50)
        p90_list.append(m90)
    return np.array(p50_list), np.array(p90_list)


def train_eta_model(legs_path: Path = RAW_LEGS_PATH) -> dict[str, Any]:
    if not legs_path.exists():
        raise FileNotFoundError(f"Missing {legs_path}. Run scripts.generate_eta_data first.")

    df = pd.read_csv(legs_path)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Strict time-based 80/20 split (no future leakage)
    cutoff_idx = int(len(df) * 0.80)
    train_df = df.iloc[:cutoff_idx].copy()
    val_df = df.iloc[cutoff_idx:].copy()

    # 1. v1 Baseline
    v1_baseline = _fit_v1_baseline(train_df)
    v1_mult_p50, _ = _predict_v1_baseline(v1_baseline, val_df)
    v1_pred_min = val_df["osrm_base_minutes"].values * v1_mult_p50
    v1_mae_min = float(mean_absolute_error(val_df["actual_minutes"].values, v1_pred_min))

    # 2. v2 LightGBM (P50 expected + P90 conservative deadline buffer)
    X_train = _build_features(train_df)
    y_train = train_df["traffic_multiplier"].values
    X_val = _build_features(val_df)

    model_p50 = lgb.LGBMRegressor(
        objective="regression_l1",
        n_estimators=250,
        learning_rate=0.04,
        num_leaves=31,
        random_state=42,
        verbose=-1,
    )
    model_p50.fit(X_train, y_train)

    model_p90 = lgb.LGBMRegressor(
        objective="quantile",
        alpha=0.90,
        n_estimators=250,
        learning_rate=0.04,
        num_leaves=31,
        random_state=42,
        verbose=-1,
    )
    model_p90.fit(X_train, y_train)

    v2_mult_p50 = np.clip(model_p50.predict(X_val), 0.85, 3.0)
    v2_mult_p90 = np.maximum(v2_mult_p50, np.clip(model_p90.predict(X_val), 0.85, 3.2))
    v2_pred_min = val_df["osrm_base_minutes"].values * v2_mult_p50
    v2_mae_min = float(mean_absolute_error(val_df["actual_minutes"].values, v2_pred_min))
    v2_p90_coverage = float(np.mean(val_df["actual_minutes"].values <= val_df["osrm_base_minutes"].values * v2_mult_p90))

    # Promotion gate
    if v2_mae_min < v1_mae_min:
        active_model = "v2_lightgbm"
        method = "ml_corrected"
    else:
        active_model = "v1_zone_hour_baseline"
        method = "baseline"

    version = f"eta_{active_model}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}"
    artifact = {
        "model_version": version,
        "active_model": active_model,
        "method": method,
        "feature_columns": list(X_train.columns),
        "v1_baseline": v1_baseline,
        "model_p50": model_p50,
        "model_p90": model_p90,
        "metrics": {
            "v1_val_mae_minutes": round(v1_mae_min, 3),
            "v2_val_mae_minutes": round(v2_mae_min, 3),
            "v2_p90_on_time_coverage": round(v2_p90_coverage, 4),
            "train_rows": len(train_df),
            "val_rows": len(val_df),
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, ARTIFACT_PATH)

    # Publish hourly traffic multiplier profile for OR-Tools & Admin dashboards
    _publish_zone_profile(artifact)

    print(f"[INFO] ETA Model trained -> Active: {active_model} ({method})")
    print(f"       v1 Baseline MAE: {v1_mae_min:.2f} min | v2 LightGBM MAE: {v2_mae_min:.2f} min | P90 Coverage: {v2_p90_coverage:.1%}")
    return artifact


def predict_eta(
    osrm_base_minutes: float,
    distance_km: float,
    zone_id: str,
    hour: int,
    day_of_week: int = 1,
    route_kind: str = "delivery",
    rainfall_mm: float = 0.0,
    artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if artifact is None:
        artifact = joblib.load(ARTIFACT_PATH)

    safe_zone = zone_id if zone_id in ZONES else "bengaluru_central"
    safe_kind = route_kind if route_kind in ROUTE_KINDS else "delivery"
    is_weekend = int(day_of_week >= 5)

    row = pd.DataFrame([{
        "hour": int(hour) % 24,
        "day_of_week": int(day_of_week) % 7,
        "is_weekend": is_weekend,
        "zone_id": safe_zone,
        "route_kind": safe_kind,
        "distance_km": float(distance_km),
        "osrm_base_minutes": float(osrm_base_minutes),
        "rainfall_mm": float(rainfall_mm),
    }])

    if artifact["active_model"] == "v2_lightgbm":
        X = _build_features(row)[artifact["feature_columns"]]
        m50 = float(np.clip(artifact["model_p50"].predict(X)[0], 0.85, 3.0))
        m90 = float(max(m50, np.clip(artifact["model_p90"].predict(X)[0], 0.85, 3.2)))
    else:
        p50_arr, p90_arr = _predict_v1_baseline(artifact["v1_baseline"], row)
        m50, m90 = float(p50_arr[0]), float(p90_arr[0])

    return {
        "zone_id": safe_zone,
        "hour": int(hour) % 24,
        "osrm_base_minutes": round(float(osrm_base_minutes), 2),
        "traffic_multiplier_p50": round(m50, 3),
        "traffic_multiplier_p90": round(m90, 3),
        "eta_minutes": round(float(osrm_base_minutes) * m50, 1),
        "eta_p90_minutes": round(float(osrm_base_minutes) * m90, 1),
        "method": artifact["method"],
        "model_version": artifact["model_version"],
    }


def _publish_zone_profile(artifact: dict[str, Any]) -> None:
    profile = []
    for zone in ZONES:
        for hour in range(4, 13):
            dry = predict_eta(30.0, 15.0, zone, hour, day_of_week=2, rainfall_mm=0.0, artifact=artifact)
            rain = predict_eta(30.0, 15.0, zone, hour, day_of_week=2, rainfall_mm=15.0, artifact=artifact)
            profile.append({
                "zone_id": zone,
                "hour": f"{hour:02d}:00",
                "dry_multiplier": dry["traffic_multiplier_p50"],
                "rain_multiplier": rain["traffic_multiplier_p50"],
                "p90_dry_multiplier": dry["traffic_multiplier_p90"],
            })

    payload = {
        "model_version": artifact["model_version"],
        "active_model": artifact["active_model"],
        "method": artifact["method"],
        "metrics": artifact["metrics"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "zone_hourly_profile": profile,
    }
    PUBLISHED_PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLISHED_PROFILE_PATH.write_text(json.dumps(payload, indent=2))


if __name__ == "__main__":
    train_eta_model()