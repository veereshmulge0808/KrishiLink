"""Pydantic v2 data contracts for KrishiLink ML outputs."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class SparklinePoint(BaseModel):
    date: date
    p50_inr_per_kg: float = Field(ge=0.0)


class PriceBandRecord(BaseModel):
    crop_id: str
    crop_name_en: str
    crop_name_kn: str
    hub_id: str
    delivery_date: date

    # Raw calibrated ML band (INR/kg)
    p10: float = Field(ge=0.0)
    p50: float = Field(ge=0.0)
    p90: float = Field(ge=0.0)

    # Deterministic published target (whole INR/kg)
    published_low: int = Field(ge=0)
    published_high: int = Field(ge=0)

    # Measured rolling coverage (replaces hardcoded 92% Confidence)
    coverage_pct: float = Field(ge=0.0, le=100.0)
    pricing_mode: Literal["ml_default", "derived_premium", "baseline_fallback"]
    is_fallback: bool = False

    # Optional admin override fields
    is_overridden: bool = False
    override_low: Optional[int] = None
    override_high: Optional[int] = None
    override_reason: Optional[str] = None

    # Trailing 7-day P50 sparkline
    sparkline_7d: List[SparklinePoint] = Field(default_factory=list)
    model_version: str
    generated_at: datetime

    @model_validator(mode="after")
    def validate_ordering(self) -> "PriceBandRecord":
        if not (self.p10 <= self.p50 <= self.p90):
            raise ValueError(f"Price quantiles out of order: {self.p10}, {self.p50}, {self.p90}")
        if self.published_low > self.published_high:
            raise ValueError(
                f"Published target inverted: {self.published_low} > {self.published_high}"
            )
        return self


class DemandForecastRecord(BaseModel):
    hub_id: str
    hub_name_en: str
    crop_id: str
    crop_name_en: str
    delivery_date: date

    q10_kg: float = Field(ge=0.0)
    q50_kg: float = Field(ge=0.0)
    q90_kg: float = Field(ge=0.0)
    buffer_lambda: float = Field(ge=0.0, le=1.0)
    suggested_procurement_kg: float = Field(ge=0.0)

    is_cold_start: bool = False
    model_type: Literal["v1_baseline", "v2_lgbm"]
    model_version: str
    generated_at: datetime

    @model_validator(mode="after")
    def validate_quantiles(self) -> "DemandForecastRecord":
        if not (self.q10_kg <= self.q50_kg <= self.q90_kg):
            raise ValueError(
                f"Demand quantiles out of order: {self.q10_kg}, {self.q50_kg}, {self.q90_kg}"
            )
        return self


class DemandCurvePoint(BaseModel):
    hub_id: str
    delivery_date: date
    hour_ist: str  # "04:00" .. "10:00"
    q10_kg: float = Field(ge=0.0)
    q50_kg: float = Field(ge=0.0)
    q90_kg: float = Field(ge=0.0)

    @model_validator(mode="after")
    def validate_quantiles(self) -> "DemandCurvePoint":
        if not (self.q10_kg <= self.q50_kg <= self.q90_kg):
            raise ValueError(
                f"Curve quantiles out of order at {self.hour_ist}: "
                f"{self.q10_kg}, {self.q50_kg}, {self.q90_kg}"
            )
        return self