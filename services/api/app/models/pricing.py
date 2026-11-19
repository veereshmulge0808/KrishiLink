import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, Date, DateTime, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, utc_now


class MarketPrice(Base):
    __tablename__ = "market_prices"
    __table_args__ = (
        PrimaryKeyConstraint("date", "market", "crop_id"),
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    market: Mapped[str] = mapped_column(String(80), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    min_price: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    max_price: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    modal_price: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    arrivals_qtl: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class WeatherDaily(Base):
    __tablename__ = "weather_daily"
    __table_args__ = (
        PrimaryKeyConstraint("date", "location_key", "is_forecast"),
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    location_key: Mapped[str] = mapped_column(String(60), nullable=False)
    rain_mm: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    tmax: Mapped[Optional[float]] = mapped_column(Numeric(4, 1), nullable=True)
    tmin: Mapped[Optional[float]] = mapped_column(Numeric(4, 1), nullable=True)
    humidity: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    is_forecast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class PriceForecast(Base):
    __tablename__ = "price_forecasts"
    __table_args__ = (
        PrimaryKeyConstraint("date", "crop_id", "market", "model_version"),
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    market: Mapped[str] = mapped_column(String(80), nullable=False)
    p10: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    p50: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    p90: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    __table_args__ = (
        PrimaryKeyConstraint("date", "hub_id", "crop_id", "model_version"),
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    q10: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    q50: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    q90: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class PublishedPrice(Base):
    __tablename__ = "published_prices"
    __table_args__ = (
        PrimaryKeyConstraint("date", "crop_id"),
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    low: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)  # in ₹ or paise formatted
    high: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    reference: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    overridden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    override_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    published_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    crop: Mapped["Crop"] = relationship("Crop")
