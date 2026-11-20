"""Step 3: Price Range Model (P10/P50/P90) with conformal calibration & promotion gate."""

from __future__ import annotations

from datetime import date, datetime, timezone
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd

from ml.config import (
    ACTIVE_ALL_CROPS,
    ACTIVE_TRAINABLE_CROPS,
    ARTIFACTS_DIR,
    CROPS,
    HUBS,
    ORGANIC_PREMIUM_PCT,
    PUBLISH_TRIM_PCT,
    QUANTILES,
    TARGET_COVERAGE_MAX,
    TARGET_COVERAGE_MIN,
)
from ml.schemas import PriceBandRecord, SparklinePoint
from ml.step2_features import (
    PRICE_FEATURE_COLS,
    build_price_features,
    build_price_inference_rows,
)

logger = logging.getLogger("krishilink.price_model")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PRICE_ARTIFACT_PATH = ARTIFACTS_DIR / "price_model.joblib"


# ---------------------------------------------------------------------------
# Metrics & Helpers
# ---------------------------------------------------------------------------
def pinball_loss(y_true: np.ndarray, y_pred: np.ndarray, q: float) -> float:
    err = y_true - y_pred
    return float(np.mean(np.maximum(q * err, (q - 1.0) * err)))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1e-6)
    return float(np.mean(np.abs(y_true - y_pred) / denom) * 100.0)


def band_coverage(y_true: np.ndarray, p10: np.ndarray, p90: np.ndarray) -> float:
    return float(np.mean((y_true >= p10) & (y_true <= p90)))


def enforce_monotonic_prices(arr: np.ndarray) -> np.ndarray:
    """Ensure 1.0 <= p10 <= p50 <= p90 row-wise."""
    clipped = np.maximum(arr, 1.0)
    return np.sort(clipped, axis=1)


def compute_published_target(p10: float, p50: float, p90: float) -> Tuple[int, int]:
    """Deterministic inward trim from [P10, P90] toward P50, rounded to whole INR."""
    low_raw = p10 + PUBLISH_TRIM_PCT * (p50 - p10)
    high_raw = p90 - PUBLISH_TRIM_PCT * (p90 - p50)
    mid = max(1, int(round(p50)))
    pub_low = max(1, min(int(round(low_raw)), mid))
    pub_high = max(mid, int(round(high_raw)))
    return pub_low, pub_high


# ---------------------------------------------------------------------------
# Baseline: Seasonal Naive (same weekday last week) + Empirical Residual Quantiles
# ---------------------------------------------------------------------------
def _baseline_point_pred(df: pd.DataFrame) -> np.ndarray:
    pred = df["price_lag_7"].fillna(df["price_mean_7"]).fillna(df["price_lag_1"])
    return pred.to_numpy(dtype=float)


def fit_price_baseline(train_df: pd.DataFrame) -> Dict[str, Tuple[float, float]]:
    """Compute per-crop empirical 10th/90th residual offsets around seasonal naive."""
    base_pred = _baseline_point_pred(train_df)
    residuals = train_df["modal_inr_per_kg"].to_numpy(dtype=float) - base_pred
    tmp = pd.DataFrame({"crop_id": train_df["crop_id"].values, "resid": residuals})

    offsets: Dict[str, Tuple[float, float]] = {}
    global_q10 = float(np.quantile(residuals, 0.10))
    global_q90 = float(np.quantile(residuals, 0.90))
    offsets["__global__"] = (global_q10, global_q90)

    for crop_id, g in tmp.groupby("crop_id"):
        if len(g) >= 20:
            offsets[str(crop_id)] = (
                float(np.quantile(g["resid"], 0.10)),
                float(np.quantile(g["resid"], 0.90)),
            )
        else:
            offsets[str(crop_id)] = (global_q10, global_q90)
    return offsets


def predict_price_baseline(
    df: pd.DataFrame, baseline_offsets: Dict[str, Tuple[float, float]]
) -> np.ndarray:
    p50 = _baseline_point_pred(df)
    p10 = np.empty_like(p50)
    p90 = np.empty_like(p50)
    default_lo, default_hi = baseline_offsets["__global__"]

    for i, crop_id in enumerate(df["crop_id"].astype(str).values):
        lo, hi = baseline_offsets.get(crop_id, (default_lo, default_hi))
        p10[i] = p50[i] + lo
        p90[i] = p50[i] + hi

    return enforce_monotonic_prices(np.column_stack([p10, p50, p90]))


# ---------------------------------------------------------------------------
# Training, Conformal Calibration & Promotion Gate
# ---------------------------------------------------------------------------
def train_price_model(
    market_prices: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    save_path: Path | None = None,
) -> Dict[str, Any]:
    """
    Train LightGBM quantile models (P10/P50/P90), apply split conformal calibration,
    evaluate against seasonal-naive baseline on held-out time split, and save artifact.
    """
    feat_df = build_price_features(market_prices, weather, holidays, drop_target_na=True)
    feat_df = feat_df.sort_values("date").reset_index(drop=True)

    unique_dates = np.sort(feat_df["date"].unique())
    if len(unique_dates) < 90:
        raise ValueError(f"Need at least 90 days of price history, found {len(unique_dates)}")

    # Time-ordered 70% train / 15% conformal calibration / 15% evaluation test split
    n_dates = len(unique_dates)
    train_end = unique_dates[int(n_dates * 0.70)]
    cal_end = unique_dates[int(n_dates * 0.85)]

    train_df = feat_df[feat_df["date"] <= train_end].copy()
    cal_df = feat_df[(feat_df["date"] > train_end) & (feat_df["date"] <= cal_end)].copy()
    test_df = feat_df[feat_df["date"] > cal_end].copy()

    # 1. Fit & evaluate baseline
    baseline_offsets = fit_price_baseline(pd.concat([train_df, cal_df], ignore_index=True))
    base_test_preds = predict_price_baseline(test_df, baseline_offsets)
    y_test = test_df["modal_inr_per_kg"].to_numpy(dtype=float)

    base_mae = mae(y_test, base_test_preds[:, 1])
    base_pinball = float(
        np.mean([pinball_loss(y_test, base_test_preds[:, idx], q) for idx, q in enumerate(QUANTILES)])
    )
    base_cov = band_coverage(y_test, base_test_preds[:, 0], base_test_preds[:, 2])

    # 2. Fit LightGBM quantile regressors on train split
    X_train = train_df[PRICE_FEATURE_COLS]
    y_train = train_df["modal_inr_per_kg"].to_numpy(dtype=float)
    X_cal = cal_df[PRICE_FEATURE_COLS]
    y_cal = cal_df["modal_inr_per_kg"].to_numpy(dtype=float)
    X_test = test_df[PRICE_FEATURE_COLS]

    lgbm_models: Dict[float, lgb.LGBMRegressor] = {}
    for q in QUANTILES:
        model = lgb.LGBMRegressor(
            objective="quantile",
            alpha=q,
            n_estimators=400,
            learning_rate=0.04,
            num_leaves=31,
            min_child_samples=20,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=-1,
        )
        model.fit(X_train, y_train, categorical_feature=["crop_cat"])
        lgbm_models[q] = model

    # 3. Split conformal calibration (CQR) targeting ~85% coverage (inside [80%, 95%])
    cal_raw = enforce_monotonic_prices(
        np.column_stack([lgbm_models[q].predict(X_cal) for q in QUANTILES])
    )
    conformity_scores = np.maximum(cal_raw[:, 0] - y_cal, y_cal - cal_raw[:, 2])
    alpha_target = 0.14  # Targets ~86% empirical P10-P90 coverage
    n_cal = len(conformity_scores)
    q_level = min(1.0, np.ceil((n_cal + 1) * (1.0 - alpha_target)) / n_cal)
    conformal_delta = float(np.quantile(conformity_scores, q_level))

    # 4. Evaluate calibrated LightGBM on held-out test split
    test_raw = enforce_monotonic_prices(
        np.column_stack([lgbm_models[q].predict(X_test) for q in QUANTILES])
    )
    test_cal = enforce_monotonic_prices(
        np.column_stack(
            [
                test_raw[:, 0] - conformal_delta,
                test_raw[:, 1],
                test_raw[:, 2] + conformal_delta,
            ]
        )
    )

    lgbm_mae = mae(y_test, test_cal[:, 1])
    lgbm_mape = mape(y_test, test_cal[:, 1])
    lgbm_pinball = float(
        np.mean([pinball_loss(y_test, test_cal[:, idx], q) for idx, q in enumerate(QUANTILES)])
    )
    lgbm_cov = band_coverage(y_test, test_cal[:, 0], test_cal[:, 2])

    # 5. Promotion gate: LightGBM goes live ONLY if it beats baseline & meets coverage bounds
    passes_accuracy = (lgbm_mae <= base_mae) and (lgbm_pinball <= base_pinball)
    passes_coverage = TARGET_COVERAGE_MIN <= lgbm_cov <= TARGET_COVERAGE_MAX
    use_lgbm = bool(passes_accuracy and passes_coverage)

    # 6. Measure real per-crop coverage (replaces hardcoded 92% badge)
    active_preds = test_cal if use_lgbm else base_test_preds
    eval_cov_df = pd.DataFrame(
        {
            "crop_id": test_df["crop_id"].values,
            "covered": (y_test >= active_preds[:, 0]) & (y_test <= active_preds[:, 2]),
        }
    )
    model_wide_cov_pct = round(float(eval_cov_df["covered"].mean() * 100.0), 1)
    per_crop_coverage_pct: Dict[str, float] = {}
    for crop_id, g in eval_cov_df.groupby("crop_id"):
        if len(g) >= 15:
            per_crop_coverage_pct[str(crop_id)] = round(float(g["covered"].mean() * 100.0), 1)
        else:
            per_crop_coverage_pct[str(crop_id)] = model_wide_cov_pct

    # 7. Refit final LightGBM models on train + cal + test (full history) if promoted
    final_models: Dict[float, lgb.LGBMRegressor] = {}
    if use_lgbm:
        X_full = feat_df[PRICE_FEATURE_COLS]
        y_full = feat_df["modal_inr_per_kg"].to_numpy(dtype=float)
        for q in QUANTILES:
            m = lgb.LGBMRegressor(
                objective="quantile",
                alpha=q,
                n_estimators=400,
                learning_rate=0.04,
                num_leaves=31,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbosity=-1,
            )
            m.fit(X_full, y_full, categorical_feature=["crop_cat"])
            final_models[q] = m
    else:
        final_models = lgbm_models

    version = f"price_{'lgbm' if use_lgbm else 'baseline'}_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    artifact = {
        "model_version": version,
        "use_lgbm": use_lgbm,
        "lgbm_models": final_models,
        "conformal_delta": conformal_delta,
        "baseline_offsets": baseline_offsets,
        "model_wide_coverage_pct": model_wide_cov_pct,
        "per_crop_coverage_pct": per_crop_coverage_pct,
        "metrics": {
            "baseline_mae": round(base_mae, 3),
            "baseline_pinball": round(base_pinball, 3),
            "baseline_coverage": round(base_cov, 4),
            "lgbm_mae": round(lgbm_mae, 3),
            "lgbm_mape_pct": round(lgbm_mape, 2),
            "lgbm_pinball": round(lgbm_pinball, 3),
            "lgbm_coverage": round(lgbm_cov, 4),
            "conformal_delta": round(conformal_delta, 3),
            "promoted_lgbm": use_lgbm,
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    out_path = save_path or PRICE_ARTIFACT_PATH
    joblib.dump(artifact, out_path)
    logger.info("Price model trained & saved (%s): %s", version, artifact["metrics"])
    return artifact


# ---------------------------------------------------------------------------
# Daily 6 PM Inference
# ---------------------------------------------------------------------------
def _build_sparkline(
    market_prices: pd.DataFrame,
    crop_id: str,
    delivery_date: date,
    tomorrow_p50: float,
    hub_offset: float,
    scale_mult: float = 1.0,
) -> List[SparklinePoint]:
    """Trailing 6 observed days + tomorrow's P50 (7 points total)."""
    target_ts = pd.Timestamp(delivery_date)
    hist = (
        market_prices[
            (market_prices["crop_id"] == crop_id)
            & (market_prices["date"] < target_ts)
            & (market_prices["modal_inr_per_kg"].notna())
        ]
        .sort_values("date")
        .tail(6)
    )
    points: List[SparklinePoint] = []
    for _, row in hist.iterrows():
        val = max(1.0, (float(row["modal_inr_per_kg"]) + hub_offset) * scale_mult)
        points.append(
            SparklinePoint(date=pd.Timestamp(row["date"]).date(), p50_inr_per_kg=round(val, 2))
        )
    points.append(SparklinePoint(date=delivery_date, p50_inr_per_kg=round(tomorrow_p50, 2)))
    return points


def predict_price_bands(
    market_prices: pd.DataFrame,
    weather: pd.DataFrame,
    holidays: pd.DataFrame,
    delivery_date: date,
    artifact: Optional[Dict[str, Any]] = None,
    hub_offsets_override: Optional[Dict[Tuple[str, str], float]] = None,
) -> List[PriceBandRecord]:
    """Generate validated next-day PriceBandRecords for all active crops & hubs."""
    art = artifact or joblib.load(PRICE_ARTIFACT_PATH)
    inf_df = build_price_inference_rows(market_prices, weather, holidays, delivery_date)

    use_lgbm: bool = art["use_lgbm"]
    if use_lgbm:
        raw = enforce_monotonic_prices(
            np.column_stack([art["lgbm_models"][q].predict(inf_df[PRICE_FEATURE_COLS]) for q in QUANTILES])
        )
        delta = float(art["conformal_delta"])
        preds = enforce_monotonic_prices(
            np.column_stack([raw[:, 0] - delta, raw[:, 1], raw[:, 2] + delta])
        )
    else:
        preds = predict_price_baseline(inf_df, art["baseline_offsets"])

    base_map: Dict[str, Tuple[float, float, float]] = {
        str(crop_id): (float(preds[i, 0]), float(preds[i, 1]), float(preds[i, 2]))
        for i, crop_id in enumerate(inf_df["crop_id"].values)
    }

    now_utc = datetime.now(timezone.utc)
    records: List[PriceBandRecord] = []

    for hub_id, hub_cfg in HUBS.items():
        for crop_id in ACTIVE_ALL_CROPS:
            crop_cfg = CROPS[crop_id]
            offset = (
                hub_offsets_override.get((hub_id, crop_id), hub_cfg.default_price_offset_inr)
                if hub_offsets_override
                else hub_cfg.default_price_offset_inr
            )

            if crop_cfg.is_organic_derived and crop_cfg.base_crop_id:
                b10, b50, b90 = base_map[crop_cfg.base_crop_id]
                mult = 1.0 + ORGANIC_PREMIUM_PCT
                p10 = round(max(1.0, (b10 + offset) * mult), 2)
                p50 = round(max(p10, (b50 + offset) * mult), 2)
                p90 = round(max(p50, (b90 + offset) * mult), 2)
                pricing_mode = "derived_premium"
                cov_pct = art["per_crop_coverage_pct"].get(
                    crop_cfg.base_crop_id, art["model_wide_coverage_pct"]
                )
                spark = _build_sparkline(
                    market_prices, crop_cfg.base_crop_id, delivery_date, p50, offset, scale_mult=mult
                )
            else:
                b10, b50, b90 = base_map[crop_id]
                p10 = round(max(1.0, b10 + offset), 2)
                p50 = round(max(p10, b50 + offset), 2)
                p90 = round(max(p50, b90 + offset), 2)
                pricing_mode = "ml_default" if use_lgbm else "baseline_fallback"
                cov_pct = art["per_crop_coverage_pct"].get(crop_id, art["model_wide_coverage_pct"])
                spark = _build_sparkline(market_prices, crop_id, delivery_date, p50, offset)

            pub_low, pub_high = compute_published_target(p10, p50, p90)
            records.append(
                PriceBandRecord(
                    crop_id=crop_id,
                    crop_name_en=crop_cfg.name_en,
                    crop_name_kn=crop_cfg.name_kn,
                    hub_id=hub_id,
                    delivery_date=delivery_date,
                    p10=p10,
                    p50=p50,
                    p90=p90,
                    published_low=pub_low,
                    published_high=pub_high,
                    coverage_pct=cov_pct,
                    pricing_mode=pricing_mode,
                    is_fallback=(not use_lgbm),
                    sparkline_7d=spark,
                    model_version=art["model_version"],
                    generated_at=now_utc,
                )
            )

    return records


if __name__ == "__main__":
    from datetime import timedelta
    from ml.step1_ingest import run_ingest

    bundle = run_ingest()
    art = train_price_model(bundle.market_prices, bundle.weather, bundle.holidays)
    tomorrow = date.today() + timedelta(days=1)
    bands = predict_price_bands(bundle.market_prices, bundle.weather, bundle.holidays, tomorrow, art)
    print(f"Generated {len(bands)} price band records for {tomorrow}")
    for rec in [b for b in bands if b.hub_id == "hub_blr_main"][:4]:
        print(
            f"  {rec.crop_name_en:18s} | ML: ₹{rec.p10:.1f}–{rec.p90:.1f} (P50 ₹{rec.p50:.1f}) | "
            f"Published: ₹{rec.published_low}–{rec.published_high} | Coverage: {rec.coverage_pct}% | {rec.pricing_mode}"
        )