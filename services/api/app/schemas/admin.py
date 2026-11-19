import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AdminOverviewResponse(BaseModel):
    active_orders: int
    total_kg_ordered: float
    total_kg_collected: float
    active_trips: int
    hubs_count: int
    critical_alerts: List[Dict[str, Any]] = []


class SettingItem(BaseModel):
    key: str
    value: Any


class AdminSettingsResponse(BaseModel):
    settings: Dict[str, Any]


class AdminSettingsUpdate(BaseModel):
    settings: Dict[str, Any]
