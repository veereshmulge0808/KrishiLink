import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import ListingStatus


class CropThresholdItem(BaseModel):
    crop_id: uuid.UUID
    min_kg: float = Field(..., gt=0)


class FarmerThresholdUpdate(BaseModel):
    default_min_kg: float = Field(..., gt=0, description="Default farmer threshold in kg")
    per_crop: Optional[List[CropThresholdItem]] = Field(default=[], description="Per-crop overrides")


class FarmerProfileUpdate(BaseModel):
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    nearest_hub_id: Optional[uuid.UUID] = None
    land_acres: Optional[float] = None
    default_min_kg: Optional[float] = 20.0
    upi_id: Optional[str] = None


class FarmerProfileResponse(BaseModel):
    user_id: uuid.UUID
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    nearest_hub_id: Optional[uuid.UUID] = None
    land_acres: Optional[float] = None
    default_min_kg: float = 20.0
    upi_id: Optional[str] = None
    reliability_score: float = 5.0
    approved: bool = False
    crop_thresholds: List[CropThresholdItem] = []

    model_config = ConfigDict(from_attributes=True)


class FarmerListingCreate(BaseModel):
    crop_id: uuid.UUID
    est_kg: float = Field(..., gt=0, description="Estimated kg ready for harvest")
    listing_date: date = Field(..., description="Target collection date")
    ready_from: Optional[datetime] = None
    ready_by: Optional[datetime] = None


class FarmerListingUpdate(BaseModel):
    est_kg: float = Field(..., gt=0)
    ready_by: Optional[datetime] = None


class FarmerListingResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    crop_id: uuid.UUID
    crop_name: Optional[str] = None
    listing_date: date
    est_kg: float
    ready_from: Optional[datetime] = None
    ready_by: Optional[datetime] = None
    status: ListingStatus
    min_kg_applied: Optional[float] = None
    created_at: datetime
    message_kn: Optional[str] = None
    cutoff_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
