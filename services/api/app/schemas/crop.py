import uuid
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import StockStatus


class CropBase(BaseModel):
    slug: str
    name_en: str
    name_kn: Optional[str] = None
    category: Optional[str] = "fruit_veg"
    is_organic: bool = False
    unit: str = "kg"
    shelf_life_hours: Optional[int] = None
    perishability: Optional[int] = Field(default=3, ge=1, le=5)
    min_order_kg: float = 10.0
    default_min_kg: float = 20.0
    icon_url: Optional[str] = None
    active: bool = True


class CropCreate(CropBase):
    pass


class CropResponse(CropBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class CropPriceRange(BaseModel):
    low: int  # paise
    high: int  # paise
    reference: int  # paise
    currency: str = "INR_PAISE_PER_KG"
    date: str


class CropCatalogItem(CropResponse):
    price: Optional[CropPriceRange] = None
    availability: StockStatus = StockStatus.SUFFICIENT
