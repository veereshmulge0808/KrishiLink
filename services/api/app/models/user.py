import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, BigInteger, Integer, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, TimestampMixin, utc_now
from app.models.enums import UserRole, VehicleOwnership
from app.models.types import GeoPoint


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role", native_enum=False), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="kn", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    farmer_profile: Mapped[Optional["Farmer"]] = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile: Mapped[Optional["Buyer"]] = relationship("Buyer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    driver_profile: Mapped[Optional["Driver"]] = relationship("Driver", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Farmer(Base):
    __tablename__ = "farmers"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    village: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    taluk: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    location: Mapped[Optional[dict]] = mapped_column(GeoPoint, nullable=True)
    nearest_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    land_acres: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    default_min_kg: Mapped[float] = mapped_column(Numeric(8, 2), default=20.0, nullable=False)
    upi_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    bank_account_ref: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    reliability_score: Mapped[float] = mapped_column(Numeric(4, 2), default=5.0, nullable=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="farmer_profile")
    nearest_hub: Mapped[Optional["Hub"]] = relationship("Hub", foreign_keys=[nearest_hub_id])
    crop_thresholds: Mapped[List["FarmerCropThreshold"]] = relationship("FarmerCropThreshold", back_populates="farmer", cascade="all, delete-orphan")
    listings: Mapped[List["FarmerListing"]] = relationship("FarmerListing", back_populates="farmer")


class FarmerCropThreshold(Base):
    __tablename__ = "farmer_crop_thresholds"

    farmer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("farmers.user_id", ondelete="CASCADE"), primary_key=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), primary_key=True)
    min_kg: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)

    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="crop_thresholds")
    crop: Mapped["Crop"] = relationship("Crop")


class Buyer(Base):
    __tablename__ = "buyers"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name: Mapped[str] = mapped_column(String(160), nullable=False)
    business_type: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[dict]] = mapped_column(GeoPoint, nullable=True)
    delivery_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    credit_limit: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)  # paise
    credit_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="buyer_profile")
    delivery_hub: Mapped[Optional["Hub"]] = relationship("Hub", foreign_keys=[delivery_hub_id])
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="buyer")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reg_no: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    capacity_kg: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    ownership: Mapped[VehicleOwnership] = mapped_column(SAEnum(VehicleOwnership, name="vehicle_ownership", native_enum=False), default=VehicleOwnership.RENT, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Driver(Base):
    __tablename__ = "drivers"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    licence_no: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    vehicle_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    home_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    on_duty: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="driver_profile")
    vehicle: Mapped[Optional["Vehicle"]] = relationship("Vehicle")
    home_hub: Mapped[Optional["Hub"]] = relationship("Hub", foreign_keys=[home_hub_id])
    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="driver")
