import uuid
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User, Farmer, Buyer, Driver, Vehicle
from app.models.hub import Hub, HubStaff
from app.models.crop import Crop
from app.models.pricing import PublishedPrice
from app.models.enums import UserRole, HubType, StockStatus
from app.core.security import create_access_token

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_tables():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def make_auth_headers(user: User) -> dict:
    token = create_access_token(user_id=user.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_data(db_session):
    # 1. Crops
    tomato = Crop(
        slug="tomato",
        name_en="Tomato",
        name_kn="ಟೊಮೆಟೊ",
        category="fruit_veg",
        min_order_kg=10.0,
        default_min_kg=20.0,
        active=True
    )
    onion = Crop(
        slug="onion",
        name_en="Onion",
        name_kn="ಈರುಳ್ಳಿ",
        category="root",
        min_order_kg=25.0,
        default_min_kg=50.0,
        active=True
    )
    db_session.add_all([tomato, onion])
    db_session.flush()

    # 2. Hubs
    village_hub = Hub(
        name="Kolar Village Mini Hub",
        type=HubType.VILLAGE,
        location={"lat": 13.136, "lng": 78.129},
        address="Kolar Main Road",
        capacity_kg=5000.0,
        active=True
    )
    main_hub = Hub(
        name="Bengaluru Central Main Hub",
        type=HubType.MAIN,
        location={"lat": 12.9716, "lng": 77.5946},
        address="Singena Agrahara",
        capacity_kg=25000.0,
        has_cold_room=True,
        active=True
    )
    db_session.add_all([village_hub, main_hub])
    db_session.flush()

    # 3. Users for each role
    buyer_u = User(phone="+919800000001", role=UserRole.BUYER, name="Hotel Anand")
    farmer_u = User(phone="+919800000002", role=UserRole.FARMER, name="Ramesh Gowda")
    driver_u = User(phone="+919800000003", role=UserRole.DRIVER, name="Suresh Kumar")
    hub_staff_u = User(phone="+919800000004", role=UserRole.HUB_STAFF, name="Anita Ops")
    admin_u = User(phone="+919800000005", role=UserRole.ADMIN, name="Admin Priya")
    super_admin_u = User(phone="+919800000006", role=UserRole.SUPER_ADMIN, name="Super Controller")

    db_session.add_all([buyer_u, farmer_u, driver_u, hub_staff_u, admin_u, super_admin_u])
    db_session.flush()

    # 4. Profiles
    farmer_p = Farmer(
        user_id=farmer_u.id,
        village="Kolar Old",
        taluk="Kolar",
        district="Kolar",
        nearest_hub_id=village_hub.id,
        default_min_kg=20.0,
        upi_id="ramesh@upi",
        approved=True
    )
    buyer_p = Buyer(
        user_id=buyer_u.id,
        business_name="Hotel Anand",
        business_type="restaurant",
        address="HSR Layout Sector 1",
        delivery_hub_id=main_hub.id,
        approved=True
    )
    vehicle = Vehicle(
        reg_no="KA01AB1234",
        type="Tata Ace",
        capacity_kg=1000.0,
        active=True
    )
    db_session.add_all([farmer_p, buyer_p, vehicle])
    db_session.flush()

    driver_p = Driver(
        user_id=driver_u.id,
        licence_no="KA0120220001234",
        vehicle_id=vehicle.id,
        home_hub_id=village_hub.id,
        on_duty=True
    )
    hub_staff_p = HubStaff(user_id=hub_staff_u.id, hub_id=main_hub.id)
    db_session.add_all([driver_p, hub_staff_p])

    # Published price for today
    today = date.today()
    pub_price = PublishedPrice(
        date=today,
        crop_id=tomato.id,
        low=22.0,
        high=30.0,
        reference=26.0,
        published_by=admin_u.id
    )
    db_session.add(pub_price)

    db_session.commit()

    return {
        "tomato": tomato,
        "onion": onion,
        "village_hub": village_hub,
        "main_hub": main_hub,
        "buyer_user": buyer_u,
        "farmer_user": farmer_u,
        "driver_user": driver_u,
        "hub_staff_user": hub_staff_u,
        "admin_user": admin_u,
        "super_admin_user": super_admin_u,
        "vehicle": vehicle
    }
