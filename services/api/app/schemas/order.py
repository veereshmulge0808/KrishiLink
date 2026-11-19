import uuid
from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import OrderStatus, PaymentMode


class OrderItemCreate(BaseModel):
    crop_id: uuid.UUID
    qty_kg: float = Field(..., gt=0)


class OrderCreate(BaseModel):
    delivery_date: date
    delivery_hub_id: Optional[uuid.UUID] = None
    slot_start: Optional[time] = None
    slot_end: Optional[time] = None
    payment_mode: PaymentMode = PaymentMode.PREPAID
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    crop_id: uuid.UUID
    crop_name: Optional[str] = None
    qty_kg: float
    confirmed_kg: Optional[float] = None
    delivered_kg: Optional[float] = None
    rejected_kg: float = 0.0
    price_per_kg_locked: Optional[int] = None  # paise
    note: Optional[str] = None
    substitute_suggestions: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    delivery_hub_id: Optional[uuid.UUID] = None
    delivery_date: date
    slot_start: Optional[time] = None
    slot_end: Optional[time] = None
    status: OrderStatus
    subtotal: Optional[int] = None  # paise
    delivery_fee: Optional[int] = 0  # paise
    total: Optional[int] = None  # paise
    payment_mode: PaymentMode
    created_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OrderTrackingResponse(BaseModel):
    order_id: uuid.UUID
    status: OrderStatus
    driver: Optional[dict] = None  # {"name": "...", "vehicle_no": "..."}
    vehicle: Optional[dict] = None  # {"lat": ..., "lng": ..., "heading": ...}
    destination: Optional[dict] = None
    eta_minutes: Optional[int] = None
    route_polyline: Optional[str] = None


class DeliveryItemReport(BaseModel):
    crop_id: uuid.UUID
    received_kg: float = Field(..., ge=0)
    rejected_kg: float = Field(default=0.0, ge=0)
    reason: Optional[str] = None
    photo_url: Optional[str] = None


class ConfirmDeliveryRequest(BaseModel):
    otp: Optional[str] = None
    items: List[DeliveryItemReport] = []
