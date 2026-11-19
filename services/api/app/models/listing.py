import uuid
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, Boolean, Date, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, utc_now
from app.models.enums import ListingStatus, Grade


class FarmerListing(Base):
    __tablename__ = "farmer_listings"
    __table_args__ = (
        UniqueConstraint("farmer_id", "crop_id", "listing_date", name="uq_farmer_crop_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("farmers.user_id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    est_kg: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    ready_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ready_by: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ListingStatus] = mapped_column(SAEnum(ListingStatus, name="listing_status", native_enum=False), default=ListingStatus.DRAFT, nullable=False, index=True)
    min_kg_applied: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="listings")
    crop: Mapped["Crop"] = relationship("Crop")
    receipts: Mapped[List["PickupReceipt"]] = relationship("PickupReceipt", back_populates="listing")


class PickupReceipt(Base):
    __tablename__ = "pickup_receipts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    trip_stop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("trip_stops.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("farmer_listings.id", ondelete="SET NULL"), nullable=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    kg_received: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    grade: Mapped[Optional[Grade]] = mapped_column(SAEnum(Grade, name="grade", native_enum=False), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    farmer_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    client_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, unique=True, nullable=True, index=True)  # idempotency
    recorded_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    listing: Mapped[Optional["FarmerListing"]] = relationship("FarmerListing", back_populates="receipts")
    crop: Mapped["Crop"] = relationship("Crop")
    stop: Mapped["TripStop"] = relationship("TripStop", back_populates="receipts")
