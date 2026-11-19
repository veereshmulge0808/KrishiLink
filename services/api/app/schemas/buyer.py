import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BuyerProfileUpdate(BaseModel):
    business_name: str
    business_type: Optional[str] = None  # restaurant, caterer, hostel, wholesaler
    gstin: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    delivery_hub_id: Optional[uuid.UUID] = None


class BuyerProfileResponse(BaseModel):
    user_id: uuid.UUID
    business_name: str
    business_type: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    delivery_hub_id: Optional[uuid.UUID] = None
    credit_limit: int = 0
    credit_days: int = 0
    approved: bool = False

    model_config = ConfigDict(from_attributes=True)
