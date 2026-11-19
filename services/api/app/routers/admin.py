import uuid
from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, Farmer
from app.models.hub import Hub
from app.models.crop import Crop
from app.models.order import Order, OrderItem
from app.models.listing import FarmerListing
from app.models.trip import Trip, TripStop
from app.models.platform import Setting
from app.models.enums import UserRole, OrderStatus, ListingStatus, TripStatus
from app.schemas.admin import AdminOverviewResponse, AdminSettingsResponse, AdminSettingsUpdate
from app.core.dependencies import require_roles

router = APIRouter(prefix="/admin", tags=["Admin Control Tower"])


@router.get("/overview", response_model=AdminOverviewResponse)
def api_admin_overview(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    today = date.today()

    active_orders_count = db.query(Order).filter(
        Order.status.in_([OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY])
    ).count()

    total_kg_ordered = db.query(func.coalesce(func.sum(OrderItem.qty_kg), 0.0)).join(Order).filter(
        Order.status != OrderStatus.CANCELLED
    ).scalar()

    total_kg_collected = db.query(func.coalesce(func.sum(FarmerListing.est_kg), 0.0)).filter(
        FarmerListing.status == ListingStatus.COLLECTED
    ).scalar()

    active_trips_count = db.query(Trip).filter(
        Trip.status.in_([TripStatus.ASSIGNED, TripStatus.ACKNOWLEDGED, TripStatus.STARTED])
    ).count()

    hubs_count = db.query(Hub).filter(Hub.active == True).count()

    return AdminOverviewResponse(
        active_orders=active_orders_count,
        total_kg_ordered=float(total_kg_ordered),
        total_kg_collected=float(total_kg_collected),
        active_trips=active_trips_count,
        hubs_count=hubs_count,
        critical_alerts=[]
    )


@router.get("/dispatch/pool", response_model=dict)
def api_dispatch_pool(
    date: Optional[date] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    target_date = date or date.today()

    # Eligible listings ready for collection
    listings = db.query(FarmerListing).filter(
        FarmerListing.listing_date == target_date,
        FarmerListing.status == ListingStatus.ELIGIBLE
    ).all()

    pickup_stops = []
    for l in listings:
        farmer = db.query(Farmer).filter(Farmer.user_id == l.farmer_id).first()
        crop = db.query(Crop).filter(Crop.id == l.crop_id).first()
        loc = farmer.location if farmer else {}
        pickup_stops.append({
            "listing_id": l.id,
            "farmer_id": l.farmer_id,
            "crop_id": l.crop_id,
            "crop_name": crop.name_en if crop else None,
            "est_kg": float(l.est_kg),
            "village": farmer.village if farmer else None,
            "location": loc,
            "ready_by": l.ready_by
        })

    # Orders needing last-mile delivery
    orders = db.query(Order).filter(
        Order.delivery_date == target_date,
        Order.status.in_([OrderStatus.PLACED, OrderStatus.CONFIRMED])
    ).all()

    delivery_stops = []
    for o in orders:
        delivery_stops.append({
            "order_id": o.id,
            "buyer_id": o.buyer_id,
            "delivery_hub_id": o.delivery_hub_id,
            "status": o.status,
            "item_count": len(o.items)
        })

    return {
        "date": str(target_date),
        "pending_pickups": pickup_stops,
        "pending_deliveries": delivery_stops
    }


@router.get("/orders", response_model=dict)
def api_admin_orders(
    date: Optional[date] = Query(None),
    status: Optional[OrderStatus] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    q = db.query(Order)
    if date:
        q = q.filter(Order.delivery_date == date)
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).all()

    items = []
    for o in orders:
        items.append({
            "id": o.id,
            "buyer_id": o.buyer_id,
            "delivery_date": str(o.delivery_date),
            "status": o.status,
            "total_paise": o.total,
            "item_count": len(o.items),
            "created_at": o.created_at
        })
    return {"items": items, "total": len(items)}


@router.get("/trips", response_model=dict)
def api_admin_trips(
    status: Optional[TripStatus] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    q = db.query(Trip)
    if status:
        q = q.filter(Trip.status == status)
    trips = q.order_by(Trip.created_at.desc()).all()

    items = []
    for t in trips:
        items.append({
            "id": t.id,
            "type": t.type,
            "status": t.status,
            "driver_id": t.driver_id,
            "vehicle_id": t.vehicle_id,
            "origin_hub_id": t.origin_hub_id,
            "dest_hub_id": t.dest_hub_id,
            "planned_km": float(t.planned_km) if t.planned_km else None,
            "stop_count": len(t.stops),
            "created_at": t.created_at
        })
    return {"items": items, "total": len(items)}


@router.get("/map/live", response_model=dict)
def api_admin_map_live(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    hubs = db.query(Hub).filter(Hub.active == True).all()
    hub_markers = []
    for h in hubs:
        loc = h.location or {}
        hub_markers.append({
            "id": h.id,
            "name": h.name,
            "type": h.type,
            "lat": loc.get("lat"),
            "lng": loc.get("lng")
        })

    active_trips = db.query(Trip).filter(
        Trip.status.in_([TripStatus.ASSIGNED, TripStatus.STARTED])
    ).all()
    vehicles = []
    for t in active_trips:
        v = t.vehicle
        vehicles.append({
            "trip_id": t.id,
            "vehicle_id": t.vehicle_id,
            "reg_no": v.reg_no if v else "",
            "lat": 12.9716,
            "lng": 77.5946,
            "heading": 0
        })

    return {
        "hubs": hub_markers,
        "vehicles": vehicles
    }


@router.get("/settings", response_model=AdminSettingsResponse)
def api_get_settings(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    settings_records = db.query(Setting).all()
    data = {s.key: s.value for s in settings_records}
    # Provide defaults if not yet populated
    if "listing_cutoff_time" not in data:
        data["listing_cutoff_time"] = "18:00"
    if "order_cutoff_time" not in data:
        data["order_cutoff_time"] = "20:00"
    if "default_farmer_threshold_kg" not in data:
        data["default_farmer_threshold_kg"] = 20.0
    if "variance_tolerance_pct" not in data:
        data["variance_tolerance_pct"] = 2.0

    return AdminSettingsResponse(settings=data)


@router.put("/settings", response_model=AdminSettingsResponse)
def api_update_settings(
    data: AdminSettingsUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    for k, v in data.settings.items():
        rec = db.query(Setting).filter(Setting.key == k).first()
        if not rec:
            rec = Setting(key=k, value=v, updated_by=current_user.id)
            db.add(rec)
        else:
            rec.value = v
            rec.updated_by = current_user.id
    db.commit()
    return api_get_settings(current_user=current_user, db=db)
