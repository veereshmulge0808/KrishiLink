import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import HubType, StockStatus, LedgerReason


class HubBase(BaseModel):
    name: str
    type: HubType
    parent_hub_id: Optional[uuid.UUID] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    capacity_kg: Optional[float] = None
    has_cold_room: bool = False
    active: bool = True


class HubCreate(HubBase):
    pass


class HubResponse(HubBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class HubStockStatusResponse(BaseModel):
    hub_id: uuid.UUID
    crop_id: uuid.UUID
    crop_name: Optional[str] = None
    status: StockStatus
    suggested: Optional[StockStatus] = None
    set_by: Optional[uuid.UUID] = None
    set_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HubStockStatusUpdate(BaseModel):
    status: StockStatus


class StockMatrixCell(BaseModel):
    crop_id: uuid.UUID
    crop_name: str
    status: StockStatus
    suggested: Optional[StockStatus] = None
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class HubStockMatrixRow(BaseModel):
    id: uuid.UUID
    name: str
    type: HubType
    cells: List[StockMatrixCell]


class StockMatrixResponse(BaseModel):
    crops: List[dict]
    hubs: List[HubStockMatrixRow]


class StockAdjustmentCreate(BaseModel):
    crop_id: uuid.UUID
    delta_kg: float = Field(..., description="+ for increase, - for decrease/wastage")
    reason: LedgerReason = LedgerReason.ADJUSTMENT
    notes: Optional[str] = None
