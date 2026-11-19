import uuid
import pytest
from datetime import date, timedelta
from app.schemas.buyer import BuyerProfileUpdate
from app.schemas.order import OrderCreate, OrderItemCreate
from app.routers.buyers import update_buyer_profile, get_buyer_profile
from app.routers.orders import api_create_order, api_get_order, api_cancel_order
from app.models.enums import OrderStatus, PaymentMode
from app.core.exceptions import KrishiLinkException


def test_buyer_profile_and_orders(db_session, seed_data):
    buyer_user = seed_data["buyer_user"]
    tomato_id = seed_data["tomato"].id
    main_hub_id = seed_data["main_hub"].id
    target_date = date.today() + timedelta(days=2)

    # Seed published price for target_date
    from app.models.pricing import PublishedPrice
    db_session.add(PublishedPrice(
        date=target_date,
        crop_id=tomato_id,
        low=22.0,
        high=30.0,
        reference=26.0,
        published_by=seed_data["admin_user"].id
    ))
    db_session.commit()

    # 1. Update buyer profile
    profile = update_buyer_profile(
        data=BuyerProfileUpdate(
            business_name="Royal Treat Restaurant",
            business_type="restaurant",
            address="Koramangala 5th Block",
            lat=12.9352,
            lng=77.6245,
            delivery_hub_id=main_hub_id
        ),
        current_user=buyer_user,
        db=db_session
    )
    assert profile.business_name == "Royal Treat Restaurant"

    # 2. Try placing order with quantity below crop minimum (Tomato min is 10 kg, requesting 5 kg) -> raises exception
    with pytest.raises(KrishiLinkException) as exc_info:
        api_create_order(
            data=OrderCreate(
                delivery_date=target_date,
                delivery_hub_id=main_hub_id,
                payment_mode=PaymentMode.PREPAID,
                items=[OrderItemCreate(crop_id=tomato_id, qty_kg=5.0)]
            ),
            current_user=buyer_user,
            db=db_session
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"]["code"] == "MIN_ORDER_QTY_NOT_MET"

    # 3. Create valid order with idempotency key
    idempotency_key = f"key_{uuid.uuid4().hex}"
    order = api_create_order(
        data=OrderCreate(
            delivery_date=target_date,
            delivery_hub_id=main_hub_id,
            payment_mode=PaymentMode.PREPAID,
            items=[OrderItemCreate(crop_id=tomato_id, qty_kg=20.0)]
        ),
        idempotency_key=idempotency_key,
        current_user=buyer_user,
        db=db_session
    )
    assert order.status == OrderStatus.PLACED
    assert order.items[0].price_per_kg_locked == 2600

    # 4. Replay order with same idempotency key -> returns same order
    replay = api_create_order(
        data=OrderCreate(
            delivery_date=target_date,
            delivery_hub_id=main_hub_id,
            payment_mode=PaymentMode.PREPAID,
            items=[OrderItemCreate(crop_id=tomato_id, qty_kg=20.0)]
        ),
        idempotency_key=idempotency_key,
        current_user=buyer_user,
        db=db_session
    )
    assert replay.id == order.id

    # 5. Get order detail
    fetched = api_get_order(id=order.id, current_user=buyer_user, db=db_session)
    assert fetched.id == order.id

    # 6. Cancel order
    cancelled = api_cancel_order(id=order.id, current_user=buyer_user, db=db_session)
    assert cancelled["message"] == "Order cancelled successfully"
