"""
Driver and dispatch router.

Driver routes   : /driver/me/*  (role=driver)
Admin routes    : /admin/drivers/*, /admin/assign, /admin/trips/*  (role=admin)
Shared lifecycle: /trips/{id}/*  (driver or admin)
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole, TripStatus
from app.schemas.trip import (
    TripSummary, TripDetail, TripStopOut,
    AssignTripIn, DriverAvailableOut,
    ArriveStopIn, ReceiptIn, ReceiptOut,
    DeliverStopIn, SkipStopIn, HubReceiveIn,
    LocationPingIn,
)
from app.services import trip_service

router = APIRouter(tags=["Dispatch & Driver"])

# ─────────────────────────── DRIVER ENDPOINTS ────────────────────────────────

@router.get("/driver/me/trips", response_model=List[TripSummary])
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER))
):
    trips = trip_service.get_driver_trips(db, current_user.id)
    result = []
    for t in trips:
        s = TripSummary(
            id=t.id, type=t.type, status=t.status,
            driver_id=t.driver_id, vehicle_id=t.vehicle_id,
            origin_hub_id=t.origin_hub_id, dest_hub_id=t.dest_hub_id,
            planned_start=t.planned_start, started_at=t.started_at,
            ended_at=t.ended_at, planned_km=t.planned_km,
            planned_minutes=t.planned_minutes, created_at=t.created_at,
            stop_count=len(t.stops)
        )
        result.append(s)
    return result


@router.get("/driver/me/trips/{trip_id}", response_model=TripDetail)
def get_my_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER))
):
    trip = trip_service.get_trip_or_404(db, trip_id)
    trip_service.assert_driver_owns_trip(trip, current_user.id)
    return _trip_to_detail(trip)


@router.post("/driver/location", status_code=status.HTTP_204_NO_CONTENT)
def post_location(
    payload: LocationPingIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER))
):
    trip_service.record_location_ping(
        db,
        trip_id=payload.trip_id,
        driver_id=current_user.id,
        lat=payload.lat,
        lng=payload.lng,
        speed_kmh=payload.speed_kmh,
        heading=payload.heading,
        accuracy_m=payload.accuracy_m,
        client_ts=payload.ts,
    )


# ─────────────────────────── ADMIN ENDPOINTS ─────────────────────────────────

@router.get("/admin/drivers/available", response_model=List[DriverAvailableOut])
def list_available_drivers(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN))
):
    return trip_service.list_available_drivers(db)


@router.post("/admin/assign", response_model=TripDetail, status_code=status.HTTP_201_CREATED)
def assign_trip(
    payload: AssignTripIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    trip = trip_service.create_and_assign_trip(
        db,
        admin_user_id=current_user.id,
        driver_user_id=payload.driver_user_id,
        vehicle_id=payload.vehicle_id,
        trip_type=payload.type,
        origin_hub_id=payload.origin_hub_id,
        dest_hub_id=payload.dest_hub_id,
        planned_start=payload.planned_start,
        planned_km=payload.planned_km,
        planned_minutes=payload.planned_minutes,
        stops_data=payload.stops,
    )
    return _trip_to_detail(trip)


@router.get("/admin/trips/{trip_id}", response_model=TripDetail)
def admin_get_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN))
):
    trip = trip_service.get_trip_or_404(db, trip_id)
    return _trip_to_detail(trip)


@router.post("/admin/trips/{trip_id}/hub-receive", status_code=status.HTTP_201_CREATED)
def hub_receive(
    trip_id: uuid.UUID,
    hub_id: uuid.UUID,
    payload: HubReceiveIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HUB_STAFF, UserRole.ADMIN))
):
    receipt = trip_service.hub_receive(
        db,
        trip_id=trip_id,
        hub_id=hub_id,
        crop_id=payload.crop_id,
        kg_hub=payload.kg_hub,
        kg_driver=payload.kg_driver,
        grade_a_kg=payload.grade_a_kg,
        grade_b_kg=payload.grade_b_kg,
        reject_kg=payload.reject_kg,
        actor=current_user,
    )
    return {"id": str(receipt.id), "kg_hub": float(receipt.kg_hub)}


# ───────────────────────── TRIP LIFECYCLE (shared) ───────────────────────────

@router.post("/trips/{trip_id}/acknowledge", response_model=TripSummary)
def acknowledge_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = trip_service.transition_trip(db, trip_id, TripStatus.ACKNOWLEDGED, current_user)
    return _trip_to_summary(trip)


@router.post("/trips/{trip_id}/start", response_model=TripSummary)
def start_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = trip_service.transition_trip(db, trip_id, TripStatus.STARTED, current_user)
    return _trip_to_summary(trip)


@router.post("/trips/{trip_id}/reached-hub", response_model=TripSummary)
def reached_hub(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = trip_service.transition_trip(db, trip_id, TripStatus.AT_HUB, current_user)
    return _trip_to_summary(trip)


@router.post("/trips/{trip_id}/return", response_model=TripSummary)
def return_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = trip_service.transition_trip(db, trip_id, TripStatus.RETURNED, current_user)
    return _trip_to_summary(trip)


@router.post("/trips/{trip_id}/close", response_model=TripSummary)
def close_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = trip_service.transition_trip(db, trip_id, TripStatus.CLOSED, current_user)
    return _trip_to_summary(trip)


# ───────────────────────── STOP LIFECYCLE ────────────────────────────────────

@router.post("/trips/{trip_id}/stops/{stop_id}/arrive", response_model=TripStopOut)
def arrive_stop(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    payload: ArriveStopIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stop = trip_service.arrive_stop(
        db, trip_id, stop_id,
        lat=payload.lat, lng=payload.lng,
        actor=current_user,
        admin_override=payload.admin_override,
        override_reason=payload.override_reason,
    )
    return _stop_to_out(stop)


@router.post("/trips/{trip_id}/stops/{stop_id}/receipt", response_model=ReceiptOut, status_code=status.HTTP_201_CREATED)
def receipt_stop(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    payload: ReceiptIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receipt, is_dup = trip_service.record_receipt(
        db, trip_id, stop_id,
        crop_id=payload.crop_id,
        kg_received=payload.kg_received,
        client_event_id=payload.client_event_id,
        actor=current_user,
        grade=payload.grade,
        listing_id=payload.listing_id,
        farmer_confirmed=payload.farmer_confirmed,
        photo_url=payload.photo_url,
    )
    return ReceiptOut(
        id=receipt.id,
        trip_stop_id=receipt.trip_stop_id,
        crop_id=receipt.crop_id,
        kg_received=float(receipt.kg_received),
        grade=receipt.grade,
        farmer_confirmed=receipt.farmer_confirmed,
        client_event_id=receipt.client_event_id,
        recorded_at=receipt.recorded_at,
        duplicate=is_dup,
    )


@router.post("/trips/{trip_id}/stops/{stop_id}/deliver", response_model=TripStopOut)
def deliver_stop(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    payload: DeliverStopIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stop = trip_service.deliver_stop(
        db, trip_id, stop_id,
        delivered_kg=payload.delivered_kg,
        rejected_kg=payload.rejected_kg,
        reject_reason=payload.reject_reason,
        actor=current_user,
    )
    return _stop_to_out(stop)


@router.post("/trips/{trip_id}/stops/{stop_id}/skip", response_model=TripStopOut)
def skip_stop(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    payload: SkipStopIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stop = trip_service.skip_stop(
        db, trip_id, stop_id,
        reason=payload.reason,
        actor=current_user,
    )
    return _stop_to_out(stop)


# ─────────────────────────── Helpers ─────────────────────────────────────────

def _trip_to_summary(trip) -> TripSummary:
    return TripSummary(
        id=trip.id, type=trip.type, status=trip.status,
        driver_id=trip.driver_id, vehicle_id=trip.vehicle_id,
        origin_hub_id=trip.origin_hub_id, dest_hub_id=trip.dest_hub_id,
        planned_start=trip.planned_start, started_at=trip.started_at,
        ended_at=trip.ended_at, planned_km=trip.planned_km,
        planned_minutes=trip.planned_minutes, created_at=trip.created_at,
        stop_count=len(trip.stops) if trip.stops else 0,
    )


def _trip_to_detail(trip) -> TripDetail:
    return TripDetail(
        id=trip.id, type=trip.type, status=trip.status,
        driver_id=trip.driver_id, vehicle_id=trip.vehicle_id,
        origin_hub_id=trip.origin_hub_id, dest_hub_id=trip.dest_hub_id,
        planned_start=trip.planned_start, started_at=trip.started_at,
        ended_at=trip.ended_at, planned_km=trip.planned_km,
        planned_minutes=trip.planned_minutes, created_at=trip.created_at,
        stop_count=len(trip.stops) if trip.stops else 0,
        stops=[_stop_to_out(s) for s in (trip.stops or [])],
    )


def _stop_to_out(stop) -> TripStopOut:
    return TripStopOut(
        id=stop.id, seq=stop.seq, type=stop.type, status=stop.status,
        farmer_id=stop.farmer_id, buyer_order_id=stop.buyer_order_id,
        hub_id=stop.hub_id, location=stop.location,
        eta=stop.eta, arrived_at=stop.arrived_at,
        completed_at=stop.completed_at, skip_reason=stop.skip_reason,
    )
