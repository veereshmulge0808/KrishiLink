"""
Driver & Dispatch test suite — 10 scenarios from Phase 2 task spec.
Tests call service functions directly (no HTTP test client) for
Windows sandbox reliability (no loopback sockets needed).
"""
import uuid
import pytest

from app.models.enums import (
    TripType, TripStatus, StopType, StopStatus, UserRole, Grade
)
from app.models.trip import Trip, TripStop
from app.services import trip_service
from app.core.exceptions import (
    ForbiddenException, BusinessRuleException, ConflictException
)
from tests.conftest import make_auth_headers, TestingSessionLocal


# ── Helper ────────────────────────────────────────────────────────────────────

def _make_trip(db, seed, *, extra_stop=False):
    """Create an assigned trip for the driver in seed_data."""
    stops = [
        {"type": StopType.PICKUP.value, "farmer_id": seed["farmer_user"].id,
         "location": {"lat": 13.136, "lng": 78.129}},
        {"type": StopType.HUB.value, "hub_id": seed["village_hub"].id,
         "location": {"lat": 13.14, "lng": 78.13}},
    ]
    if extra_stop:
        stops.append({"type": StopType.DELIVERY.value})
    return trip_service.create_and_assign_trip(
        db,
        admin_user_id=seed["admin_user"].id,
        driver_user_id=seed["driver_user"].id,
        vehicle_id=seed["vehicle"].id,
        trip_type=TripType.FIRST_MILE,
        origin_hub_id=seed["village_hub"].id,
        dest_hub_id=seed["main_hub"].id,
        stops_data=stops,
    )


# ── Scenario 1: Admin creates and assigns a trip ──────────────────────────────

def test_admin_creates_trip(db_session, seed_data):
    """Admin creates trip; trip is ASSIGNED with correct driver."""
    trip = _make_trip(db_session, seed_data)
    assert trip.status == TripStatus.ASSIGNED
    assert trip.driver_id == seed_data["driver_user"].id
    assert len(trip.stops) == 2


# ── Scenario 2: Driver sees only their own trips ──────────────────────────────

def test_driver_sees_only_own_trips(db_session, seed_data):
    """Driver query returns only own trips; second driver sees empty list."""
    _make_trip(db_session, seed_data)

    # Create a second driver
    from app.models.user import User, Driver, Vehicle
    other_u = User(phone="+910000009999", role=UserRole.DRIVER, name="Other Driver")
    db_session.add(other_u)
    db_session.flush()
    v2 = Vehicle(reg_no="KA99ZZ9999", capacity_kg=800.0, active=True)
    db_session.add(v2)
    db_session.flush()
    other_d = Driver(user_id=other_u.id, licence_no="OTHER001", vehicle_id=v2.id, on_duty=True)
    db_session.add(other_d)
    db_session.commit()

    my_trips = trip_service.get_driver_trips(db_session, seed_data["driver_user"].id)
    other_trips = trip_service.get_driver_trips(db_session, other_u.id)
    assert len(my_trips) == 1
    assert len(other_trips) == 0


# ── Scenario 3: Driver acknowledges and starts a trip ────────────────────────

def test_driver_acknowledges_and_starts(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]

    t2 = trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    assert t2.status == TripStatus.ACKNOWLEDGED

    t3 = trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)
    assert t3.status == TripStatus.STARTED
    assert t3.started_at is not None


# ── Scenario 4: Driver records pickup receipt ─────────────────────────────────

def test_driver_records_receipt(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]

    trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)

    pickup_stop = trip.stops[0]  # seq=0 is PICKUP
    # Arrive at stop (no geofence: stop has location, we pass matching coords)
    trip_service.arrive_stop(
        db_session, trip.id, pickup_stop.id,
        lat=13.136, lng=78.129,
        actor=driver,
    )

    event_id = uuid.uuid4()
    receipt, is_dup = trip_service.record_receipt(
        db_session, trip.id, pickup_stop.id,
        crop_id=seed_data["tomato"].id,
        kg_received=120.0,
        client_event_id=event_id,
        actor=driver,
        grade=Grade.A,
        farmer_confirmed=True,
    )
    assert receipt.kg_received == 120.0
    assert receipt.farmer_confirmed is True
    assert receipt.grade == Grade.A
    assert is_dup is False


# ── Scenario 5: Duplicate receipt does not double-count ──────────────────────

def test_duplicate_receipt_idempotent(db_session, seed_data):
    """Sending the same client_event_id twice returns existing receipt."""
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]

    trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)

    pickup_stop = trip.stops[0]
    trip_service.arrive_stop(db_session, trip.id, pickup_stop.id, lat=13.136, lng=78.129, actor=driver)

    event_id = uuid.uuid4()
    r1, d1 = trip_service.record_receipt(
        db_session, trip.id, pickup_stop.id,
        crop_id=seed_data["tomato"].id,
        kg_received=80.0,
        client_event_id=event_id,
        actor=driver,
    )
    r2, d2 = trip_service.record_receipt(
        db_session, trip.id, pickup_stop.id,
        crop_id=seed_data["tomato"].id,
        kg_received=999.0,  # different amount — should be ignored
        client_event_id=event_id,
        actor=driver,
    )
    assert r1.id == r2.id        # same DB row
    assert r2.kg_received == 80.0  # original value unchanged
    assert d2 is True            # flagged as duplicate

    # Only one receipt in DB
    from app.models.listing import PickupReceipt
    count = db_session.query(PickupReceipt).filter(
        PickupReceipt.trip_stop_id == pickup_stop.id
    ).count()
    assert count == 1


# ── Scenario 6: Hub receiving creates correct inventory movement ──────────────

def test_hub_receive_credits_stock_ledger(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]
    admin = seed_data["admin_user"]

    trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.AT_HUB, driver)

    hub_id = seed_data["main_hub"].id
    crop_id = seed_data["tomato"].id

    from app.models.stock import StockLedger
    before = db_session.query(StockLedger).filter(
        StockLedger.hub_id == hub_id,
        StockLedger.crop_id == crop_id,
    ).count()

    receipt = trip_service.hub_receive(
        db_session,
        trip_id=trip.id,
        hub_id=hub_id,
        crop_id=crop_id,
        kg_hub=200.0,
        kg_driver=195.0,
        grade_a_kg=180.0,
        grade_b_kg=15.0,
        reject_kg=5.0,
        actor=admin,
    )

    after = db_session.query(StockLedger).filter(
        StockLedger.hub_id == hub_id,
        StockLedger.crop_id == crop_id,
    ).count()

    assert receipt.kg_hub == 200.0
    assert after == before + 1

    # Delta is positive (stock in)
    latest = db_session.query(StockLedger).filter(
        StockLedger.hub_id == hub_id,
        StockLedger.crop_id == crop_id,
    ).order_by(StockLedger.id.desc()).first()
    assert float(latest.delta_kg) == 200.0


# ── Scenario 7: Duplicate hub receipt is rejected ────────────────────────────

def test_duplicate_hub_receipt_rejected(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]
    admin = seed_data["admin_user"]

    trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.AT_HUB, driver)

    kwargs = dict(
        trip_id=trip.id,
        hub_id=seed_data["main_hub"].id,
        crop_id=seed_data["tomato"].id,
        kg_hub=100.0,
        kg_driver=98.0,
        grade_a_kg=90.0,
        grade_b_kg=8.0,
        reject_kg=2.0,
        actor=admin,
    )
    trip_service.hub_receive(db_session, **kwargs)
    with pytest.raises(ConflictException):
        trip_service.hub_receive(db_session, **kwargs)


# ── Scenario 8: Invalid trip transitions are rejected ────────────────────────

def test_invalid_trip_transition_rejected(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]

    # Cannot go ASSIGNED → AT_HUB (must go via ACKNOWLEDGED, STARTED)
    with pytest.raises(BusinessRuleException):
        trip_service.transition_trip(db_session, trip.id, TripStatus.AT_HUB, driver)

    # Cannot close an ASSIGNED trip
    with pytest.raises(BusinessRuleException):
        trip_service.transition_trip(db_session, trip.id, TripStatus.CLOSED, driver)


# ── Scenario 9: Unauthorized driver cannot touch another's trip ───────────────

def test_unauthorized_driver_cannot_touch_trip(db_session, seed_data):
    trip = _make_trip(db_session, seed_data)

    # Create a different driver user (no Driver profile needed — just fake the user)
    from app.models.user import User
    intruder = User(phone="+910000007777", role=UserRole.DRIVER, name="Intruder")
    db_session.add(intruder)
    db_session.commit()

    with pytest.raises(ForbiddenException):
        trip_service.assert_driver_owns_trip(trip, intruder.id)

    with pytest.raises(ForbiddenException):
        trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, intruder)


# ── Scenario 10: Assign same driver to overlapping active trip is blocked ─────

def test_driver_overlap_blocked(db_session, seed_data):
    """Cannot assign driver to new trip while they have a STARTED trip."""
    trip = _make_trip(db_session, seed_data)
    driver = seed_data["driver_user"]

    # Advance to STARTED
    trip_service.transition_trip(db_session, trip.id, TripStatus.ACKNOWLEDGED, driver)
    trip_service.transition_trip(db_session, trip.id, TripStatus.STARTED, driver)

    # Attempt second assignment for same driver (different vehicle not needed
    # — the overlap check fires on driver first)
    from app.models.user import Vehicle
    v2 = Vehicle(reg_no="KA01XY9999", capacity_kg=800.0, active=True)
    db_session.add(v2)
    db_session.commit()

    with pytest.raises(ConflictException):
        trip_service.create_and_assign_trip(
            db_session,
            admin_user_id=seed_data["admin_user"].id,
            driver_user_id=seed_data["driver_user"].id,
            vehicle_id=v2.id,
            trip_type=TripType.FIRST_MILE,
            stops_data=[],
        )
