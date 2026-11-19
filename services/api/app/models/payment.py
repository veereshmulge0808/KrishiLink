import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Numeric, BigInteger, Integer, Date, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.models.base import Base, utc_now
from app.models.enums import PaymentDirection, PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    party_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    direction: Mapped[PaymentDirection] = mapped_column(SAEnum(PaymentDirection, name="payment_direction", native_enum=False), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)  # paise
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.PENDING, nullable=False)
    gateway_ref: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    settlement_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    party: Mapped["User"] = relationship("User")


class Settlement(Base):
    __tablename__ = "settlements"
    __table_args__ = (
        UniqueConstraint("farmer_id", "settle_date", name="uq_farmer_settle_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("farmers.user_id", ondelete="CASCADE"), nullable=False, index=True)
    settle_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    accepted_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gross: Mapped[int] = mapped_column(BigInteger, nullable=False)  # paise
    commission: Mapped[int] = mapped_column(BigInteger, nullable=False)  # paise
    logistics_share: Mapped[int] = mapped_column(BigInteger, nullable=False)  # paise
    net: Mapped[int] = mapped_column(BigInteger, nullable=False)  # paise
    status: Mapped[str] = mapped_column(String(15), default="DRAFT", nullable=False)  # DRAFT, APPROVED, PAID
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    farmer: Mapped["Farmer"] = relationship("Farmer")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    txn_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    account: Mapped[str] = mapped_column(String(40), nullable=False, index=True)  # farmer_payable, buyer_receivable...
    party_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    debit: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)  # paise
    credit: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)  # paise
    ref_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    ref_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
