import uuid
from typing import Optional
from sqlalchemy import String, Boolean, Numeric, Integer, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid
from app.models.base import Base


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(80), nullable=False)
    name_kn: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # leafy, root, fruit_veg, fruit
    is_organic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    unit: Mapped[str] = mapped_column(String(10), default="kg", nullable=False)
    shelf_life_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    perishability: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)  # 1 to 5
    min_order_kg: Mapped[float] = mapped_column(Numeric(8, 2), default=10.0, nullable=False)
    default_min_kg: Mapped[float] = mapped_column(Numeric(8, 2), default=20.0, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
