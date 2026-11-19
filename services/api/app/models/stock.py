import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, BigInteger, Integer, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, utc_now
from app.models.enums import StockStatus, LedgerReason, Grade


class HubStockStatus(Base):
    __tablename__ = "hub_stock_status"

    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), primary_key=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[StockStatus] = mapped_column(SAEnum(StockStatus, name="stock_status", native_enum=False), default=StockStatus.OUT, nullable=False)
    suggested: Mapped[Optional[StockStatus]] = mapped_column(SAEnum(StockStatus, name="stock_status_suggested", native_enum=False), nullable=True)
    set_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    set_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    hub: Mapped["Hub"] = relationship("Hub", back_populates="stock_statuses")
    crop: Mapped["Crop"] = relationship("Crop")
    setter: Mapped[Optional["User"]] = relationship("User")


class HubStockStatusHistory(Base):
    __tablename__ = "hub_stock_status_history"

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    old_status: Mapped[Optional[StockStatus]] = mapped_column(SAEnum(StockStatus, name="stock_status_old", native_enum=False), nullable=True)
    new_status: Mapped[StockStatus] = mapped_column(SAEnum(StockStatus, name="stock_status_new", native_enum=False), nullable=False)
    source: Mapped[str] = mapped_column(String(10), default="manual", nullable=False)  # manual | system
    set_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    hub_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    delta_kg: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)  # + in, - out
    reason: Mapped[LedgerReason] = mapped_column(SAEnum(LedgerReason, name="ledger_reason", native_enum=False), nullable=False)
    ref_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # receipt, order, transfer...
    ref_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    grade: Mapped[Optional[Grade]] = mapped_column(SAEnum(Grade, name="grade", native_enum=False), nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    hub: Mapped["Hub"] = relationship("Hub")
    crop: Mapped["Crop"] = relationship("Crop")
