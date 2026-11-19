import uuid
from datetime import date, time, datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, BigInteger, Date, Time, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, utc_now
from app.models.enums import OrderStatus, PaymentMode


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("buyers.user_id", ondelete="CASCADE"), nullable=False, index=True)
    delivery_hub_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True, index=True)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    slot_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    slot_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name="order_status", native_enum=False), default=OrderStatus.PLACED, nullable=False, index=True)
    subtotal: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # paise
    delivery_fee: Mapped[Optional[int]] = mapped_column(BigInteger, default=0, nullable=True)  # paise
    total: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # paise
    payment_mode: Mapped[PaymentMode] = mapped_column(SAEnum(PaymentMode, name="payment_mode", native_enum=False), default=PaymentMode.PREPAID, nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    buyer: Mapped["Buyer"] = relationship("Buyer", back_populates="orders")
    delivery_hub: Mapped[Optional["Hub"]] = relationship("Hub")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    qty_kg: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    confirmed_kg: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    delivered_kg: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    rejected_kg: Mapped[float] = mapped_column(Numeric(8, 2), default=0.0, nullable=False)
    price_per_kg_locked: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # paise
    reject_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    crop: Mapped["Crop"] = relationship("Crop")
