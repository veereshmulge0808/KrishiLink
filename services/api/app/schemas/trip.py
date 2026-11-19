"""Trip, stop, and dispatch Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import TripType, TripStatus, StopType, StopStatus, Grade


# ─── Trip Stop ───────────────────────────────────────────────────────────────

class StopLocationIn(BaseModel):
    lat: float
    lng: float


class TripStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    seq: int
    type: StopType
    status: StopStatus
    farmer_id: Optional[uuid.UUID] = None
    buyer_order_id: Optional[uuid.UUID] = None
    hub_id: Optional[uuid.UUID] = None
    location: Optional[dict] = None
    eta: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    skip_reason: Optional[str] = None


# ─── Trip Summary ─────────────────────────────────────────────────────────────

class TripSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: TripType
    status: TripStatus
    driver_id: uuid.UUID
    vehicle_id: uuid.UUID
    origin_hub_id: Optional[uuid.UUID] = None
    dest_hub_id: Optional[uuid.UUID] = None
    planned_start: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    planned_km: Optional[float] = None
    planned_minutes: Optional[int] = None
    created_at: datetime
    stop_count: int = 0


class TripDetail(TripSummary):
    stops: List[TripStopOut] = []


# ─── Admin Assign ─────────────────────────────────────────────────────────────

class AssignTripIn(BaseModel):
    driver_user_id: uuid.UUID
    vehicle_id: uuid.UUID
    type: TripType = TripType.FIRST_MILE
    origin_hub_id: Optional[uuid.UUID] = None
    dest_hub_id: Optional[uuid.UUID] = None
    planned_start: Optional[datetime] = None
    planned_km: Optional[float] = None
    planned_minutes: Optional[int] = None
    # At least one stop must be provided for meaningful trips
    stops: List[dict] = Field(default_factory=list)


class DriverAvailableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    name: str
    phone: str
    licence_no: Optional[str] = None
    on_duty: bool
    vehicle_reg: Optional[str] = None
    vehicle_capacity_kg: Optional[float] = None
    active_trips: int = 0


# ─── Stop Actions ─────────────────────────────────────────────────────────────

class ArriveStopIn(BaseModel):
    lat: float
    lng: float
    admin_override: bool = False
    override_reason: Optional[str] = None


class ReceiptIn(BaseModel):
    crop_id: uuid.UUID
    kg_received: float = Field(gt=0)
    grade: Optional[Grade] = None
    listing_id: Optional[uuid.UUID] = None
    farmer_confirmed: bool = False
    photo_url: Optional[str] = None
    client_event_id: uuid.UUID  # idempotency


class ReceiptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_stop_id: uuid.UUID
    crop_id: uuid.UUID
    kg_received: float
    grade: Optional[Grade] = None
    farmer_confirmed: bool
    client_event_id: uuid.UUID
    recorded_at: datetime
    duplicate: bool = False  # True if already existed


class DeliverStopIn(BaseModel):
    delivered_kg: float = Field(ge=0)
    rejected_kg: float = Field(default=0.0, ge=0)
    reject_reason: Optional[str] = None


class SkipStopIn(BaseModel):
    reason: str = Field(min_length=3)


# ─── Hub Receipt ─────────────────────────────────────────────────────────────

class HubReceiveIn(BaseModel):
    crop_id: uuid.UUID
    kg_hub: float = Field(gt=0)
    kg_driver: Optional[float] = None
    grade_a_kg: float = 0.0
    grade_b_kg: float = 0.0
    reject_kg: float = 0.0


# ─── Location Ping ───────────────────────────────────────────────────────────

class LocationPingIn(BaseModel):
    trip_id: uuid.UUID
    lat: float
    lng: float
    speed_kmh: Optional[float] = None
    heading: Optional[float] = None
    accuracy_m: Optional[float] = None
    ts: Optional[datetime] = None  # client timestamp; server validates

    @field_validator("speed_kmh")
    @classmethod
    def speed_cap(cls, v):
        if v is not None and v > 150:
            raise ValueError("speed_kmh exceeds maximum believable value (150 km/h)")
        return v
