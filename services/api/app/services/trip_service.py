"""
Trip service — business logic for driver dispatch, state transitions,
geofence checks, receipt idempotency, and stock ledger updates.

All public methods accept a SQLAlchemy Session and return ORM objects or
raise KrishiLinkException subclasses. No async I/O here.
"""
import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from app.models.enums import (
    TripStatus, StopStatus, StopType, LedgerReason, Grade, UserRole
)
from app.models.trip import Trip, TripStop, LocationPing, HubReceipt
from app.models.listing import PickupReceipt
from app.models.stock import StockLedger, HubStockStatus
from app.models.user import Driver, Vehicle, User
from app.models.order import Order, OrderItem
from app.core.exceptions import (
    NotFoundException, ConflictException, ForbiddenException,
    BusinessRuleException
)

GEOFENCE_RADIUS_M = 150.0
MAX_SPEED_KMH = 150.0

# ── Allowed state transitions ─────────────────────────────────────────────────
TRIP_TRANSITIONS = {
    TripStatus.ASSIGNED:     [TripStatus.ACKNOWLEDGED, TripStatus.CANCELLED],
    TripStatus.ACKNOWLEDGED: [TripStatus.STARTED,     TripStatus.CANCELLED],
    TripStatus.STARTED:      [TripStatus.AT_HUB,      TripStatus.RETURNED, TripStatus.INCIDENT],
    TripStatus.AT_HUB:       [TripStatus.RETURNED,    TripStatus.CLOSED],
    TripStatus.RETURNED:     [TripStatus.CLOSED],
}

STOP_TRANSITIONS = {
    StopStatus.PLANNED:     [StopStatus.EN_ROUTE, StopStatus.ARRIVED, StopStatus.SKIPPED],
    StopStatus.EN_ROUTE:    [StopStatus.ARRIVED,  StopStatus.SKIPPED],
    StopStatus.ARRIVED:     [StopStatus.IN_PROGRESS, StopStatus.SKIPPED],
    StopStatus.IN_PROGRESS: [StopStatus.COMPLETED, StopStatus.SKIPPED],
}


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in metres between two WGS84 points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _assert_trip_transition(trip: Trip, to: TripStatus) -> None:
    allowed = TRIP_TRANSITIONS.get(trip.status, [])
    if to not in allowed:
        raise BusinessRuleException(
            f"Trip {trip.id}: cannot transition {trip.status} → {to}. "
            f"Allowed: {[s.value for s in allowed]}"
        )


def _assert_stop_transition(stop: TripStop, to: StopStatus) -> None:
    allowed = STOP_TRANSITIONS.get(stop.status, [])
    if to not in allowed:
        raise BusinessRuleException(
            f"Stop {stop.id}: cannot transition {stop.status} → {to}. "
            f"Allowed: {[s.value for s in allowed]}"
        )


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ── Trip Queries ──────────────────────────────────────────────────────────────

def get_driver_trips(db: Session, driver_user_id: uuid.UUID) -> List[Trip]:
    return (
        db.query(Trip)
        .filter(Trip.driver_id == driver_user_id)
        .order_by(Trip.created_at.desc())
        .all()
    )


def get_trip_or_404(db: Session, trip_id: uuid.UUID) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise NotFoundException("Trip", trip_id)
    return trip


def get_stop_or_404(db: Session, trip_id: uuid.UUID, stop_id: uuid.UUID) -> TripStop:
    stop = db.query(TripStop).filter(
        TripStop.trip_id == trip_id,
        TripStop.id == stop_id
    ).first()
    if not stop:
        raise NotFoundException("TripStop", stop_id)
    return stop


def assert_driver_owns_trip(trip: Trip, driver_user_id: uuid.UUID) -> None:
    if trip.driver_id != driver_user_id:
        raise ForbiddenException("You are not assigned to this trip")


# ── Admin: Available Drivers ──────────────────────────────────────────────────

def list_available_drivers(db: Session) -> list:
    """Return drivers with no STARTED or AT_HUB trips right now."""
    busy_driver_ids = (
        db.query(Trip.driver_id)
        .filter(Trip.status.in_([TripStatus.STARTED, TripStatus.AT_HUB]))
        .all()
    )
    busy_set = {row[0] for row in busy_driver_ids}

    drivers = db.query(Driver).all()
    result = []
    for d in drivers:
        u = db.query(User).filter(User.id == d.user_id).first()
        v = db.query(Vehicle).filter(Vehicle.id == d.vehicle_id).first() if d.vehicle_id else None
        active_trips = db.query(Trip).filter(
            Trip.driver_id == d.user_id,
            Trip.status.in_([TripStatus.ASSIGNED, TripStatus.ACKNOWLEDGED, TripStatus.STARTED, TripStatus.AT_HUB])
        ).count()
        result.append({
            "user_id": d.user_id,
            "name": u.name if u else "",
            "phone": u.phone if u else "",
            "licence_no": d.licence_no,
            "on_duty": d.user_id not in busy_set,
            "vehicle_reg": v.reg_no if v else None,
            "vehicle_capacity_kg": float(v.capacity_kg) if v else None,
            "active_trips": active_trips,
        })
    return result


# ── Admin: Create & Assign Trip ───────────────────────────────────────────────

def create_and_assign_trip(
    db: Session,
    *,
    admin_user_id: uuid.UUID,
    driver_user_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    trip_type,
    origin_hub_id: Optional[uuid.UUID] = None,
    dest_hub_id: Optional[uuid.UUID] = None,
    planned_start: Optional[datetime] = None,
    planned_km: Optional[float] = None,
    planned_minutes: Optional[int] = None,
    stops_data: List[dict] = None,
) -> Trip:
    # Validate driver exists
    driver = db.query(Driver).filter(Driver.user_id == driver_user_id).first()
    if not driver:
        raise NotFoundException("Driver", driver_user_id)

    # Validate vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.active == True).first()
    if not vehicle:
        raise NotFoundException("Vehicle", vehicle_id)

    # Prevent overlap: driver must not have STARTED or AT_HUB trips
    overlap = db.query(Trip).filter(
        Trip.driver_id == driver_user_id,
        Trip.status.in_([TripStatus.STARTED, TripStatus.AT_HUB])
    ).first()
    if overlap:
        raise ConflictException(f"Driver already has an active trip: {overlap.id}")

    # Prevent same vehicle on two active trips
    vehicle_overlap = db.query(Trip).filter(
        Trip.vehicle_id == vehicle_id,
        Trip.status.in_([TripStatus.STARTED, TripStatus.AT_HUB])
    ).first()
    if vehicle_overlap:
        raise ConflictException(f"Vehicle already in use on trip: {vehicle_overlap.id}")

    trip = Trip(
        type=trip_type,
        status=TripStatus.ASSIGNED,
        driver_id=driver_user_id,
        vehicle_id=vehicle_id,
        origin_hub_id=origin_hub_id,
        dest_hub_id=dest_hub_id,
        assigned_by=admin_user_id,
        planned_start=planned_start,
        planned_km=planned_km,
        planned_minutes=planned_minutes,
    )
    db.add(trip)
    db.flush()  # get trip.id

    # Create stops
    for seq, stop_def in enumerate(stops_data or []):
        stop = TripStop(
            trip_id=trip.id,
            seq=seq,
            type=StopType(stop_def.get("type", StopType.PICKUP.value)),
            status=StopStatus.PLANNED,
            farmer_id=stop_def.get("farmer_id"),
            buyer_order_id=stop_def.get("buyer_order_id"),
            hub_id=stop_def.get("hub_id"),
            location=stop_def.get("location"),
            eta=stop_def.get("eta"),
        )
        db.add(stop)

    db.commit()
    db.refresh(trip)
    return trip


# ── Trip Lifecycle ────────────────────────────────────────────────────────────

def transition_trip(db: Session, trip_id: uuid.UUID, to: TripStatus, actor: User) -> Trip:
    trip = get_trip_or_404(db, trip_id)

    # Drivers can only change their own trips; admins can change any
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)

    _assert_trip_transition(trip, to)
    trip.status = to
    now = _now_utc()
    if to == TripStatus.STARTED:
        trip.started_at = now
    elif to in (TripStatus.RETURNED, TripStatus.CLOSED):
        if trip.ended_at is None:
            trip.ended_at = now
    db.commit()
    db.refresh(trip)
    return trip


# ── Stop Lifecycle ────────────────────────────────────────────────────────────

def arrive_stop(
    db: Session,
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    lat: float,
    lng: float,
    actor: User,
    admin_override: bool = False,
    override_reason: Optional[str] = None,
) -> TripStop:
    trip = get_trip_or_404(db, trip_id)
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)

    stop = get_stop_or_404(db, trip_id, stop_id)
    _assert_stop_transition(stop, StopStatus.ARRIVED)

    # Geofence check
    if stop.location:
        stop_lat = stop.location.get("lat", 0.0)
        stop_lng = stop.location.get("lng", 0.0)
        dist = _haversine_m(lat, lng, stop_lat, stop_lng)
        if dist > GEOFENCE_RADIUS_M:
            if not admin_override:
                raise BusinessRuleException(
                    f"Driver is {dist:.0f}m from stop (max {GEOFENCE_RADIUS_M}m). "
                    "Use admin_override=true with an override_reason for GPS failures."
                )
            # Audited override — log it in skip_reason as audit note (best-effort)
            stop.skip_reason = f"[GPS_OVERRIDE] dist={dist:.0f}m reason={override_reason or 'unspecified'}"

    stop.status = StopStatus.ARRIVED
    stop.arrived_at = _now_utc()
    db.commit()
    db.refresh(stop)
    return stop


def record_receipt(
    db: Session,
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    crop_id: uuid.UUID,
    kg_received: float,
    client_event_id: uuid.UUID,
    actor: User,
    grade: Optional[Grade] = None,
    listing_id: Optional[uuid.UUID] = None,
    farmer_confirmed: bool = False,
    photo_url: Optional[str] = None,
) -> tuple[PickupReceipt, bool]:
    """
    Returns (receipt, is_duplicate).
    Idempotent: if client_event_id already exists, returns the existing record.
    Does NOT credit hub inventory — that happens on hub_receive.
    """
    trip = get_trip_or_404(db, trip_id)
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)

    stop = get_stop_or_404(db, trip_id, stop_id)
    if stop.type not in (StopType.PICKUP,):
        raise BusinessRuleException("Receipt can only be recorded at PICKUP stops")

    # Idempotency check
    existing = db.query(PickupReceipt).filter(
        PickupReceipt.client_event_id == client_event_id
    ).first()
    if existing:
        return existing, True

    # Advance stop to IN_PROGRESS if still ARRIVED
    if stop.status == StopStatus.ARRIVED:
        stop.status = StopStatus.IN_PROGRESS

    receipt = PickupReceipt(
        trip_stop_id=stop_id,
        listing_id=listing_id,
        crop_id=crop_id,
        kg_received=kg_received,
        grade=grade,
        farmer_confirmed=farmer_confirmed,
        photo_url=photo_url,
        client_event_id=client_event_id,
        recorded_by=actor.id,
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt, False


def complete_stop(db: Session, trip_id: uuid.UUID, stop_id: uuid.UUID, actor: User) -> TripStop:
    trip = get_trip_or_404(db, trip_id)
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)
    stop = get_stop_or_404(db, trip_id, stop_id)
    _assert_stop_transition(stop, StopStatus.COMPLETED)
    stop.status = StopStatus.COMPLETED
    stop.completed_at = _now_utc()
    db.commit()
    db.refresh(stop)
    return stop


def deliver_stop(
    db: Session,
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    delivered_kg: float,
    rejected_kg: float,
    reject_reason: Optional[str],
    actor: User,
) -> TripStop:
    trip = get_trip_or_404(db, trip_id)
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)
    stop = get_stop_or_404(db, trip_id, stop_id)
    if stop.type != StopType.DELIVERY:
        raise BusinessRuleException("deliver can only be called on DELIVERY stops")

    _assert_stop_transition(stop, StopStatus.COMPLETED)

    # Update the linked order item
    if stop.buyer_order_id:
        order = db.query(Order).filter(Order.id == stop.buyer_order_id).first()
        if order:
            for item in order.items:
                # Update first item (single-crop orders typical; adjust for multi-crop if needed)
                if item.delivered_kg is None:
                    item.delivered_kg = delivered_kg
                    item.rejected_kg = rejected_kg
                    item.reject_reason = reject_reason
                    break

    stop.status = StopStatus.COMPLETED
    stop.completed_at = _now_utc()
    db.commit()
    db.refresh(stop)
    return stop


def skip_stop(db: Session, trip_id: uuid.UUID, stop_id: uuid.UUID, reason: str, actor: User) -> TripStop:
    trip = get_trip_or_404(db, trip_id)
    if actor.role == UserRole.DRIVER:
        assert_driver_owns_trip(trip, actor.id)
    stop = get_stop_or_404(db, trip_id, stop_id)
    if stop.status == StopStatus.COMPLETED:
        raise BusinessRuleException("Cannot skip an already completed stop")
    stop.status = StopStatus.SKIPPED
    stop.skip_reason = reason
    db.commit()
    db.refresh(stop)
    return stop


# ── Hub Receive (credits physical inventory) ──────────────────────────────────

def hub_receive(
    db: Session,
    trip_id: uuid.UUID,
    hub_id: uuid.UUID,
    crop_id: uuid.UUID,
    kg_hub: float,
    kg_driver: Optional[float],
    grade_a_kg: float,
    grade_b_kg: float,
    reject_kg: float,
    actor: User,
) -> HubReceipt:
    """
    Records actual hub-weighed quantity and credits StockLedger.
    Only called after physical verification at hub — this is the only
    moment hub inventory is credited.
    """
    trip = get_trip_or_404(db, trip_id)
    if trip.status not in (TripStatus.AT_HUB, TripStatus.STARTED):
        raise BusinessRuleException(
            "Hub receive is only valid when trip is STARTED or AT_HUB"
        )

    # Duplicate guard: same trip+crop
    already = db.query(HubReceipt).filter(
        HubReceipt.trip_id == trip_id,
        HubReceipt.crop_id == crop_id
    ).first()
    if already:
        raise ConflictException(
            f"Hub receipt for crop {crop_id} on trip {trip_id} already recorded"
        )

    receipt = HubReceipt(
        trip_id=trip_id,
        hub_id=hub_id,
        crop_id=crop_id,
        kg_driver=kg_driver,
        kg_hub=kg_hub,
        grade_a_kg=grade_a_kg,
        grade_b_kg=grade_b_kg,
        reject_kg=reject_kg,
        recorded_by=actor.id,
    )
    db.add(receipt)

    # Credit stock ledger
    ledger = StockLedger(
        hub_id=hub_id,
        crop_id=crop_id,
        delta_kg=float(kg_hub),
        reason=LedgerReason.PICKUP,
        ref_type="hub_receipt",
        ref_id=receipt.id,
        created_by=actor.id,
    )
    db.add(ledger)
    db.commit()
    db.refresh(receipt)
    return receipt


# ── Location Tracking ─────────────────────────────────────────────────────────

def record_location_ping(
    db: Session,
    trip_id: uuid.UUID,
    driver_id: uuid.UUID,
    lat: float,
    lng: float,
    speed_kmh: Optional[float],
    heading: Optional[float],
    accuracy_m: Optional[float],
    client_ts: Optional[datetime],
) -> None:
    now = _now_utc()
    # Reject future timestamps (>30s ahead)
    if client_ts and (client_ts.replace(tzinfo=timezone.utc) - now).total_seconds() > 30:
        raise BusinessRuleException("Location timestamp is in the future")
    # Flag impossible speeds (already validated in schema, but double-check)
    if speed_kmh is not None and speed_kmh > MAX_SPEED_KMH:
        raise BusinessRuleException(f"speed_kmh {speed_kmh} exceeds maximum {MAX_SPEED_KMH}")

    ping = LocationPing(
        trip_id=trip_id,
        ts=client_ts or now,
        driver_id=driver_id,
        location={"lat": lat, "lng": lng},
        speed_kmh=speed_kmh,
        heading=heading,
        accuracy_m=accuracy_m,
    )
    db.add(ping)
    db.commit()
