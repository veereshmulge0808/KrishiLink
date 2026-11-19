import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, Integer, Float, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, TimestampMixin, utc_now
from app.models.enums import TripType, TripStatus, StopType, StopStatus, TransferStatus
from app.models.types import GeoPoint


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    type: Mapped[TripType] = mapped_column(SAEnum(TripType, name="trip_type", native_enum=False), nullable=False)
    status: Mapped[TripStatus] = mapped_column(SAEnum(TripStatus, name="trip_status", native_enum=False), default=TripStatus.ASSIGNED, nullable=False, index=True)
    driver_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("drivers.user_id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    origin_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    dest_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    assigned_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    planned_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    planned_km: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    planned_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    driver: Mapped["Driver"] = relationship("Driver", back_populates="trips")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle")
    origin_hub: Mapped[Optional["Hub"]] = relationship("Hub", foreign_keys=[origin_hub_id])
    dest_hub: Mapped[Optional["Hub"]] = relationship("Hub", foreign_keys=[dest_hub_id])
    assigner: Mapped["User"] = relationship("User", foreign_keys=[assigned_by])
    stops: Mapped[List["TripStop"]] = relationship("TripStop", back_populates="trip", order_by="TripStop.seq", cascade="all, delete-orphan")


class TripStop(Base):
    __tablename__ = "trip_stops"
    __table_args__ = (
        UniqueConstraint("trip_id", "seq", name="uq_trip_seq"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    seq: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[StopType] = mapped_column(SAEnum(StopType, name="stop_type", native_enum=False), nullable=False)
    status: Mapped[StopStatus] = mapped_column(SAEnum(StopStatus, name="stop_status", native_enum=False), default=StopStatus.PLANNED, nullable=False)
    farmer_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("farmers.user_id", ondelete="SET NULL"), nullable=True)
    buyer_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    location: Mapped[Optional[dict]] = mapped_column(GeoPoint, nullable=True)
    eta: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    skip_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="stops")
    receipts: Mapped[List["PickupReceipt"]] = relationship("PickupReceipt", back_populates="stop")


class HubReceipt(Base):
    __tablename__ = "hub_receipts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    kg_driver: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    kg_hub: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False)
    grade_a_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), default=0.0, nullable=True)
    grade_b_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), default=0.0, nullable=True)
    reject_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), default=0.0, nullable=True)
    recorded_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class LocationPing(Base):
    __tablename__ = "location_pings"

    trip_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    driver_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    location: Mapped[Optional[dict]] = mapped_column(GeoPoint, nullable=True)
    speed_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    heading: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class TransferRequest(Base, TimestampMixin):
    __tablename__ = "transfer_requests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    from_hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False)
    to_hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    requested_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    sent_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    received_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[TransferStatus] = mapped_column(SAEnum(TransferStatus, name="transfer_status", native_enum=False), default=TransferStatus.SUGGESTED, nullable=False)
    trip_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    requested_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
