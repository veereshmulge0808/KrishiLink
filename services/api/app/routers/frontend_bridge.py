"""
Frontend Compatibility Bridge
==============================
The Vite frontend (agritransit origin) calls these legacy paths:

  POST /api/auth/login            → email+password login (map to OTP mock flow)
  POST /api/auth/register         → register new user
  GET  /api/farmer/stats          → farmer dashboard stats
  GET  /api/farmer/produce        → farmer's listings
  GET  /api/farmer/orders         → farmer's pickup orders (trips)
  GET  /api/v1/commodities        → crop catalog
  POST /api/farmer/produce/post   → create listing
  GET  /api/buyer/catalog         → available produce catalog
  GET  /api/buyer/orders          → buyer's orders
  POST /api/buyer/orders          → place order
  GET  /api/logistics/stats       → logistics/driver stats
  GET  /api/logistics/marketplace → open shipments
  GET  /api/logistics/my-trips    → driver's assigned trips
  GET  /api/logistics/fleet       → fleet vehicles
  POST /api/logistics/shipments/{id}/accept   → driver accepts a trip
  POST /api/logistics/shipments/{id}/milestone → update trip status
  POST /api/logistics/shipments/{id}/telemetry → GPS ping

All routes mount under prefix "" (bare /api/...) since vite.config.js
already proxies /api → http://127.0.0.1:8000, so FastAPI sees /api/...
"""
import uuid
from datetime import date, datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.models.user import User, Farmer, Buyer, Driver, Vehicle
from app.models.listing import FarmerListing
from app.models.crop import Crop
from app.models.order import Order, OrderItem
from app.models.trip import Trip, TripStop
from app.models.stock import StockLedger
from app.models.hub import Hub
from app.models.enums import (
    UserRole, ListingStatus, TripStatus, StopType, TripType,
    OrderStatus, StopStatus
)

router = APIRouter(tags=["Frontend Bridge"])

# ─── Shared helper ────────────────────────────────────────────────────────────

def _now_utc():
    return datetime.now(timezone.utc)


# ─── Auth: email+password → token (dev convenience) ──────────────────────────

class LoginIn(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class RegisterIn(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "FARMER"
    password: Optional[str] = None


def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "phone": user.phone,
        "name": user.name,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "email": getattr(user, "email", None),
        "zone": "Bengaluru",
    }


def _make_token_response(user: User) -> dict:
    token = create_access_token(user_id=user.id, role=user.role)
    return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(user)}


DEMO_USERS = {
    "farmer@agriflow.io":    UserRole.FARMER,
    "buyer@agriflow.io":     UserRole.BUYER,
    "logistics@agriflow.io": UserRole.DRIVER,
    "admin@agriflow.io":     UserRole.ADMIN,
    "hubstaff@agriflow.io":  UserRole.HUB_STAFF,
}


@router.post("/api/auth/login")
def bridge_login(payload: LoginIn, db: Session = Depends(get_db)):
    identifier = (payload.email or payload.phone or "").lower().strip()
    # Look up by phone first, then match demo accounts
    user = db.query(User).filter(User.phone == identifier).first()
    if not user and identifier in DEMO_USERS:
        # Auto-create demo user on first login
        role = DEMO_USERS[identifier]
        user = User(phone=identifier, name=identifier.split("@")[0].title(), role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        # Create profile
        if role == UserRole.FARMER:
            db.add(Farmer(user_id=user.id, village="Demo Village", district="Bengaluru", approved=True))
        elif role == UserRole.BUYER:
            db.add(Buyer(user_id=user.id, business_name="Demo Buyer", approved=True))
        elif role == UserRole.DRIVER:
            v = db.query(Vehicle).first()
            db.add(Driver(user_id=user.id, licence_no="DEMO001", vehicle_id=v.id if v else None, on_duty=True))
        db.commit()
        db.refresh(user)
    if not user:
        # Create a new user with phone
        role = UserRole.FARMER
        user = User(phone=identifier or "+910000000000", name="New User", role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return _make_token_response(user)


@router.post("/api/auth/register")
def bridge_register(payload: RegisterIn, db: Session = Depends(get_db)):
    identifier = (payload.email or payload.phone or "").lower().strip()
    role_map = {
        "FARMER": UserRole.FARMER, "farmer": UserRole.FARMER,
        "BUYER": UserRole.BUYER, "buyer": UserRole.BUYER,
        "LOGISTICS": UserRole.DRIVER, "logistics": UserRole.DRIVER,
        "DRIVER": UserRole.DRIVER, "driver": UserRole.DRIVER,
    }
    role = role_map.get(payload.role, UserRole.FARMER)
    user = User(phone=identifier or "+910000000001", name=payload.name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    if role == UserRole.FARMER:
        db.add(Farmer(user_id=user.id, village="", district="", approved=False))
    elif role == UserRole.BUYER:
        db.add(Buyer(user_id=user.id, business_name=payload.name, approved=False))
    db.commit()
    return _make_token_response(user)


# ─── Farmer Bridge ────────────────────────────────────────────────────────────

@router.get("/api/farmer/stats")
def farmer_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listings = db.query(FarmerListing).filter(FarmerListing.farmer_id == current_user.id).all()
    active = [l for l in listings if l.status in (ListingStatus.ELIGIBLE, ListingStatus.SCHEDULED)]
    trips = db.query(Trip).filter(Trip.driver_id == current_user.id).all() if current_user.role == UserRole.DRIVER else []
    return {
        "total_listings": len(listings),
        "active_listings": len(active),
        "total_trips": len(trips),
        "pending_payment": 0,
        "earnings_this_month": 0,
    }


@router.get("/api/farmer/produce")
def farmer_produce(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listings = db.query(FarmerListing).filter(FarmerListing.farmer_id == current_user.id).all()
    result = []
    for l in listings:
        crop = db.query(Crop).filter(Crop.id == l.crop_id).first()
        result.append({
            "id": str(l.id),
            "crop_name": crop.name_en if crop else "Unknown",
            "category": crop.category if crop else "",
            "declared_qty": float(l.declared_kg),
            "available_qty": float(l.available_kg) if l.available_kg else float(l.declared_kg),
            "price_per_kg": float(l.asking_price_per_kg) if l.asking_price_per_kg else 0.0,
            "quality_grade": l.grade.value if l.grade else "Grade A",
            "harvest_date": str(l.harvest_date),
            "status": l.status.value,
            "image_url": crop.image_url if crop else None,
        })
    return result


@router.get("/api/farmer/orders")
def farmer_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns scheduled pickups from trips as 'orders' for farmer view."""
    stops = (
        db.query(TripStop)
        .filter(TripStop.farmer_id == current_user.id)
        .all()
    )
    result = []
    for s in stops:
        trip = db.query(Trip).filter(Trip.id == s.trip_id).first()
        result.append({
            "id": str(s.id),
            "trip_id": str(s.trip_id),
            "status": s.status.value,
            "trip_status": trip.status.value if trip else "UNKNOWN",
            "eta": s.eta.isoformat() if s.eta else None,
            "arrived_at": s.arrived_at.isoformat() if s.arrived_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        })
    return result


@router.post("/api/farmer/produce/post")
def farmer_post_produce(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new farmer listing from the frontend form."""
    crop_name = payload.get("crop_name", "Tomato")
    crop = db.query(Crop).filter(Crop.name_en == crop_name).first()
    if not crop:
        crop = Crop(slug=crop_name.lower(), name_en=crop_name, name_kn=crop_name, category=payload.get("category", "other"), active=True)
        db.add(crop)
        db.flush()

    from app.models.enums import Grade
    grade_str = payload.get("quality_grade", "Grade A")
    grade_map = {"Grade A": Grade.A, "Grade B": Grade.B, "Reject": Grade.REJECT}
    grade = grade_map.get(grade_str, Grade.A)

    listing = FarmerListing(
        farmer_id=current_user.id,
        crop_id=crop.id,
        declared_kg=float(payload.get("declared_qty", 100)),
        asking_price_per_kg=int(float(payload.get("price_per_kg", 0)) * 100),
        grade=grade,
        harvest_date=date.fromisoformat(payload.get("harvest_date", str(date.today()))),
        status=ListingStatus.DRAFT,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return {"id": str(listing.id), "status": listing.status.value, "message": "Listing created"}


@router.get("/api/v1/commodities")
def commodities(db: Session = Depends(get_db)):
    crops = db.query(Crop).filter(Crop.active == True).all()
    return [{"id": str(c.id), "name": c.name_en, "category": c.category, "slug": c.slug} for c in crops]


# ─── Buyer Bridge ─────────────────────────────────────────────────────────────

@router.get("/api/buyer/catalog")
def buyer_catalog(
    category: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    quality_grade: Optional[str] = Query(None),
    crop_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(FarmerListing).filter(
        FarmerListing.status.in_([ListingStatus.ELIGIBLE, ListingStatus.DRAFT])
    )
    if crop_name:
        q = q.join(Crop).filter(Crop.name_en.ilike(f"%{crop_name}%"))
    listings = q.all()
    result = []
    for l in listings:
        crop = db.query(Crop).filter(Crop.id == l.crop_id).first()
        farmer = db.query(Farmer).filter(Farmer.user_id == l.farmer_id).first()
        result.append({
            "id": str(l.id),
            "crop_id": str(l.crop_id),
            "crop_name": crop.name_en if crop else "Unknown",
            "category": crop.category if crop else "",
            "available_qty": float(l.available_kg or l.declared_kg),
            "price_per_kg": float(l.asking_price_per_kg or 0) / 100.0,
            "quality_grade": l.grade.value if l.grade else "A",
            "harvest_date": str(l.harvest_date),
            "zone": farmer.district if farmer else "Bengaluru",
            "image_url": crop.image_url if crop else None,
            "listing_id": str(l.id),
        })
    return result


@router.get("/api/buyer/orders")
def buyer_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.buyer_id == current_user.id).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        items = []
        for item in o.items:
            crop = db.query(Crop).filter(Crop.id == item.crop_id).first()
            items.append({
                "crop_name": crop.name_en if crop else "Unknown",
                "qty_kg": float(item.qty_kg),
                "price_per_kg": float(item.price_per_kg_locked or 0) / 100.0,
            })
        result.append({
            "id": str(o.id),
            "status": o.status.value,
            "delivery_date": str(o.delivery_date),
            "total": float(o.total or 0) / 100.0,
            "items": items,
        })
    return result


class BuyerOrderIn(BaseModel):
    listing_id: str
    qty_kg: float
    delivery_date: str
    delivery_address: Optional[str] = None


@router.post("/api/buyer/orders")
def place_buyer_order(
    payload: BuyerOrderIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(FarmerListing).filter(FarmerListing.id == uuid.UUID(payload.listing_id)).first()
    if not listing:
        return {"error": "Listing not found"}, 404
    crop = db.query(Crop).filter(Crop.id == listing.crop_id).first()
    price_paise = int(listing.asking_price_per_kg or 0)
    total_paise = int(payload.qty_kg * price_paise)
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.id).first()

    order = Order(
        buyer_id=current_user.id,
        delivery_date=date.fromisoformat(payload.delivery_date),
        status=OrderStatus.PLACED,
        subtotal=total_paise,
        total=total_paise,
        delivery_hub_id=buyer.delivery_hub_id if buyer else None,
    )
    db.add(order)
    db.flush()
    item = OrderItem(
        order_id=order.id,
        crop_id=listing.crop_id,
        qty_kg=payload.qty_kg,
        price_per_kg_locked=price_paise,
    )
    db.add(item)
    db.commit()
    db.refresh(order)
    return {
        "id": str(order.id),
        "status": order.status.value,
        "total": float(order.total) / 100.0,
        "crop_name": crop.name_en if crop else "Unknown",
        "qty_kg": payload.qty_kg,
    }


# ─── Logistics / Driver Bridge ────────────────────────────────────────────────

@router.get("/api/logistics/stats")
def logistics_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.active == True).all()
    total_capacity = sum(float(v.capacity_kg) for v in vehicles)
    active_trips = db.query(Trip).filter(Trip.status == TripStatus.STARTED).count()
    completed = db.query(Trip).filter(Trip.status == TripStatus.CLOSED).count()
    # Open listings (potential marketplace items)
    open_listings = db.query(FarmerListing).filter(FarmerListing.status == ListingStatus.ELIGIBLE).count()
    return {
        "fleet_vehicles_count": len(vehicles),
        "total_payload_capacity_kg": total_capacity,
        "active_deliveries": active_trips,
        "completed_deliveries": completed,
        "pending_shipment_requests": open_listings,
    }


@router.get("/api/logistics/marketplace")
def logistics_marketplace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return eligible listings as 'shipment requests' for driver marketplace."""
    listings = db.query(FarmerListing).filter(FarmerListing.status == ListingStatus.ELIGIBLE).limit(20).all()
    result = []
    for l in listings:
        crop = db.query(Crop).filter(Crop.id == l.crop_id).first()
        farmer = db.query(Farmer).filter(Farmer.user_id == l.farmer_id).first()
        farmer_user = db.query(User).filter(User.id == l.farmer_id).first()
        result.append({
            "id": str(l.id),
            "crop_name": crop.name_en if crop else "Unknown",
            "qty_kg": float(l.declared_kg),
            "pickup_location": farmer.village if farmer else "Unknown",
            "pickup_lat": (farmer.location or {}).get("lat", 12.9) if farmer else 12.9,
            "pickup_lng": (farmer.location or {}).get("lng", 77.5) if farmer else 77.5,
            "farmer_name": farmer_user.name if farmer_user else "Farmer",
            "farmer_phone": farmer_user.phone if farmer_user else "",
            "harvest_date": str(l.harvest_date),
            "status": l.status.value,
        })
    return result


@router.get("/api/logistics/my-trips")
def logistics_my_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.driver_id == current_user.id).order_by(Trip.created_at.desc()).all()
    result = []
    for t in trips:
        stops = []
        for s in t.stops:
            stops.append({
                "id": str(s.id),
                "seq": s.seq,
                "type": s.type.value,
                "status": s.status.value,
                "eta": s.eta.isoformat() if s.eta else None,
            })
        result.append({
            "id": str(t.id),
            "type": t.type.value,
            "status": t.status.value,
            "planned_start": t.planned_start.isoformat() if t.planned_start else None,
            "started_at": t.started_at.isoformat() if t.started_at else None,
            "stop_count": len(t.stops),
            "stops": stops,
            "current_lat": 12.9716,
            "current_lng": 77.5946,
        })
    return result


@router.get("/api/logistics/fleet")
def logistics_fleet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).filter(Vehicle.active == True).all()
    return [
        {
            "id": str(v.id),
            "reg_no": v.reg_no,
            "type": v.type,
            "capacity_kg": float(v.capacity_kg),
        }
        for v in vehicles
    ]


class AcceptShipmentIn(BaseModel):
    vehicle_id: Optional[str] = None


@router.post("/api/logistics/shipments/{shipment_id}/accept")
def accept_shipment(
    shipment_id: str,
    payload: AcceptShipmentIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Driver accepts a listing/shipment → creates a minimal trip."""
    listing = db.query(FarmerListing).filter(FarmerListing.id == uuid.UUID(shipment_id)).first()
    if not listing:
        return {"error": "Shipment not found"}

    vehicle_id = None
    if payload.vehicle_id:
        v = db.query(Vehicle).filter(Vehicle.reg_no == payload.vehicle_id).first()
        if v:
            vehicle_id = v.id

    if not vehicle_id:
        v = db.query(Vehicle).first()
        vehicle_id = v.id if v else None

    if not vehicle_id:
        return {"error": "No vehicle available"}

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        driver = Driver(user_id=current_user.id, vehicle_id=vehicle_id, on_duty=True)
        db.add(driver)
        db.flush()

    trip = Trip(
        type=TripType.FIRST_MILE,
        status=TripStatus.ASSIGNED,
        driver_id=current_user.id,
        vehicle_id=vehicle_id,
        assigned_by=current_user.id,
    )
    db.add(trip)
    db.flush()

    stop = TripStop(
        trip_id=trip.id,
        seq=0,
        type=StopType.PICKUP,
        status=StopStatus.PLANNED,
        farmer_id=listing.farmer_id,
    )
    db.add(stop)
    listing.status = ListingStatus.SCHEDULED
    db.commit()
    return {"trip_id": str(trip.id), "message": "Shipment accepted"}


class MilestoneIn(BaseModel):
    milestone: str


MILESTONE_STATUS_MAP = {
    "ACKNOWLEDGED": TripStatus.ACKNOWLEDGED,
    "STARTED": TripStatus.STARTED,
    "AT_HUB": TripStatus.AT_HUB,
    "RETURNED": TripStatus.RETURNED,
    "CLOSED": TripStatus.CLOSED,
}


@router.post("/api/logistics/shipments/{trip_id}/milestone")
def milestone_update(
    trip_id: str,
    payload: MilestoneIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == uuid.UUID(trip_id)).first()
    if not trip:
        return {"error": "Trip not found"}
    new_status = MILESTONE_STATUS_MAP.get(payload.milestone.upper())
    if new_status:
        trip.status = new_status
        if new_status == TripStatus.STARTED:
            trip.started_at = _now_utc()
        db.commit()
        db.refresh(trip)
    return {"shipment": {"id": str(trip.id), "status": trip.status.value}}


class TelemetryIn(BaseModel):
    current_lat: float
    current_lng: float
    ambient_temp_c: Optional[float] = None
    eta_minutes: Optional[int] = None


@router.post("/api/logistics/shipments/{trip_id}/telemetry")
def telemetry_update(
    trip_id: str,
    payload: TelemetryIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == uuid.UUID(trip_id)).first()
    if not trip:
        return {"error": "Trip not found"}
    from app.models.trip import LocationPing
    ping = LocationPing(
        trip_id=trip.id,
        ts=_now_utc(),
        driver_id=current_user.id,
        location={"lat": payload.current_lat, "lng": payload.current_lng},
    )
    db.add(ping)
    db.commit()
    return {"shipment": {"id": str(trip.id), "current_lat": payload.current_lat, "current_lng": payload.current_lng}}
