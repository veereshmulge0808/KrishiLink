import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.hub import Hub
from app.models.crop import Crop
from app.models.trip import HubReceipt
from app.models.stock import HubStockStatus
from app.models.enums import UserRole, StockStatus, LedgerReason
from app.schemas.hub import (
    HubCreate, HubResponse, HubStockStatusResponse,
    HubStockStatusUpdate, StockMatrixResponse, StockAdjustmentCreate
)
from app.core.dependencies import require_roles, get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.services.stock_service import (
    update_hub_stock_status, record_ledger_transaction,
    get_stock_matrix_data, get_hub_physical_stock
)
from app.models.user import User

router = APIRouter(prefix="/hubs", tags=["Hubs & Stock"])


@router.get("", response_model=dict)
def api_list_hubs(db: Session = Depends(get_db)):
    hubs = db.query(Hub).filter(Hub.active == True).order_by(Hub.name).all()
    items = []
    for h in hubs:
        loc = h.location or {}
        items.append({
            "id": h.id,
            "name": h.name,
            "type": h.type,
            "parent_hub_id": h.parent_hub_id,
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "address": h.address,
            "capacity_kg": float(h.capacity_kg) if h.capacity_kg else None,
            "has_cold_room": h.has_cold_room,
            "active": h.active
        })
    return {"items": items, "total": len(items)}


@router.post("", response_model=HubResponse, status_code=status.HTTP_201_CREATED)
def api_create_hub(
    data: HubCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    hub = Hub(
        name=data.name,
        type=data.type,
        parent_hub_id=data.parent_hub_id,
        location={"lat": data.lat, "lng": data.lng} if data.lat and data.lng else None,
        address=data.address,
        capacity_kg=data.capacity_kg,
        has_cold_room=data.has_cold_room,
        active=data.active
    )
    db.add(hub)
    db.commit()
    db.refresh(hub)
    loc = hub.location or {}
    return HubResponse(
        id=hub.id,
        name=hub.name,
        type=hub.type,
        parent_hub_id=hub.parent_hub_id,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        address=hub.address,
        capacity_kg=float(hub.capacity_kg) if hub.capacity_kg else None,
        has_cold_room=hub.has_cold_room,
        active=hub.active
    )


@router.get("/stock-matrix", response_model=StockMatrixResponse)
def api_get_stock_matrix(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_STAFF)),
    db: Session = Depends(get_db)
):
    matrix_data = get_stock_matrix_data(db)
    return matrix_data


@router.get("/{id}", response_model=HubResponse)
def api_get_hub(id: uuid.UUID, db: Session = Depends(get_db)):
    hub = db.query(Hub).filter(Hub.id == id).first()
    if not hub:
        raise NotFoundException("Hub", id)
    loc = hub.location or {}
    return HubResponse(
        id=hub.id,
        name=hub.name,
        type=hub.type,
        parent_hub_id=hub.parent_hub_id,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        address=hub.address,
        capacity_kg=float(hub.capacity_kg) if hub.capacity_kg else None,
        has_cold_room=hub.has_cold_room,
        active=hub.active
    )


@router.get("/{id}/stock-status", response_model=dict)
def api_get_hub_stock_status(id: uuid.UUID, db: Session = Depends(get_db)):
    hub = db.query(Hub).filter(Hub.id == id).first()
    if not hub:
        raise NotFoundException("Hub", id)

    statuses = db.query(HubStockStatus).filter(HubStockStatus.hub_id == id).all()
    items = []
    for s in statuses:
        crop = db.query(Crop).filter(Crop.id == s.crop_id).first()
        physical_kg = get_hub_physical_stock(db, id, s.crop_id)
        items.append({
            "hub_id": s.hub_id,
            "crop_id": s.crop_id,
            "crop_name": crop.name_en if crop else None,
            "status": s.status,
            "suggested": s.suggested,
            "physical_stock_kg": physical_kg,
            "set_by": s.set_by,
            "set_at": s.set_at
        })
    return {"hub_id": id, "items": items}


@router.put("/{id}/stock-status/{crop_id}", response_model=HubStockStatusResponse)
def api_update_stock_button(
    id: uuid.UUID,
    crop_id: uuid.UUID,
    data: HubStockStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HUB_STAFF)),
    db: Session = Depends(get_db)
):
    record = update_hub_stock_status(
        db=db,
        hub_id=id,
        crop_id=crop_id,
        status=data.status,
        set_by_user_id=current_user.id
    )
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    return HubStockStatusResponse(
        hub_id=record.hub_id,
        crop_id=record.crop_id,
        crop_name=crop.name_en if crop else None,
        status=record.status,
        suggested=record.suggested,
        set_by=record.set_by,
        set_at=record.set_at
    )


@router.post("/{id}/receipts")
def api_hub_weigh_in(
    id: uuid.UUID,
    crop_id: uuid.UUID,
    kg_hub: float,
    kg_driver: Optional[float] = None,
    trip_id: Optional[uuid.UUID] = None,
    grade_a_kg: float = 0.0,
    grade_b_kg: float = 0.0,
    reject_kg: float = 0.0,
    current_user: User = Depends(require_roles(UserRole.HUB_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    hub = db.query(Hub).filter(Hub.id == id).first()
    if not hub:
        raise NotFoundException("Hub", id)

    # Calculate weight variance
    variance_pct = None
    if kg_driver and kg_driver > 0:
        variance_pct = round(((kg_hub - kg_driver) / kg_driver) * 100, 2)

    receipt = HubReceipt(
        trip_id=trip_id,
        hub_id=id,
        crop_id=crop_id,
        kg_driver=kg_driver,
        kg_hub=kg_hub,
        grade_a_kg=grade_a_kg,
        grade_b_kg=grade_b_kg,
        reject_kg=reject_kg,
        recorded_by=current_user.id
    )
    db.add(receipt)

    # Physically increase available hub inventory in ledger
    record_ledger_transaction(
        db=db,
        hub_id=id,
        crop_id=crop_id,
        delta_kg=kg_hub,
        reason=LedgerReason.PICKUP,
        created_by=current_user.id,
        ref_type="hub_receipt",
        ref_id=receipt.id
    )

    db.commit()
    return {
        "message": "Hub weigh-in recorded and stock ledger updated",
        "receipt_id": receipt.id,
        "kg_hub": kg_hub,
        "variance_pct": variance_pct
    }


@router.post("/{id}/stock-adjust")
def api_stock_adjust(
    id: uuid.UUID,
    data: StockAdjustmentCreate,
    current_user: User = Depends(require_roles(UserRole.HUB_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    hub = db.query(Hub).filter(Hub.id == id).first()
    if not hub:
        raise NotFoundException("Hub", id)

    entry = record_ledger_transaction(
        db=db,
        hub_id=id,
        crop_id=data.crop_id,
        delta_kg=data.delta_kg,
        reason=data.reason,
        created_by=current_user.id,
        ref_type="adjustment"
    )

    new_stock = get_hub_physical_stock(db, id, data.crop_id)
    return {
        "message": "Stock adjustment recorded in ledger",
        "delta_kg": data.delta_kg,
        "new_physical_stock_kg": new_stock
    }
