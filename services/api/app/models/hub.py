import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base
from app.models.enums import HubType
from app.models.types import GeoPoint


class Hub(Base):
    __tablename__ = "hubs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[HubType] = mapped_column(SAEnum(HubType, name="hub_type", native_enum=False), nullable=False)
    parent_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    location: Mapped[Optional[dict]] = mapped_column(GeoPoint, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    capacity_kg: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    has_cold_room: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    parent_hub: Mapped[Optional["Hub"]] = relationship("Hub", remote_side=[id])
    stock_statuses: Mapped[List["HubStockStatus"]] = relationship("HubStockStatus", back_populates="hub")
    staff_members: Mapped[List["HubStaff"]] = relationship("HubStaff", back_populates="hub")


class HubStaff(Base):
    __tablename__ = "hub_staff"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), primary_key=True)

    user: Mapped["User"] = relationship("User")
    hub: Mapped["Hub"] = relationship("Hub", back_populates="staff_members")
