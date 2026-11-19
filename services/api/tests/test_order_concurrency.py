import pytest
from datetime import date
from app.models.enums import PaymentMode, OrderStatus, ListingStatus
from app.schemas.farmer import FarmerListingCreate
from app.schemas.order import OrderCreate, OrderItemCreate
from app.routers.farmers import submit_listing
from app.routers.hubs import api_hub_weigh_in
from app.routers.orders import api_create_order
from app.core.exceptions import OutOfStockException


def test_safe_atomic_inventory_and_concurrency(db_session, seed_data):
    admin_user = seed_data["admin_user"]
    buyer_user = seed_data["buyer_user"]
    farmer_user = seed_data["farmer_user"]

    tomato_id = seed_data["tomato"].id
    main_hub_id = seed_data["main_hub"].id
    today = date.today()

    # Step 1: Farmer declares 500 kg in harvest listing
    listing = submit_listing(
        data=FarmerListingCreate(
            crop_id=tomato_id,
            est_kg=500.0,
            listing_date=today
        ),
        current_user=farmer_user,
        db=db_session
    )
    assert listing.status == ListingStatus.ELIGIBLE

    # Step 2: VERIFY uncollected farmer estimate is NOT treated as physical hub stock
    # Hub has 0 kg physically in the ledger. Attempting a same-day order must FAIL with OUT_OF_STOCK!
    with pytest.raises(OutOfStockException) as exc_info:
        api_create_order(
            data=OrderCreate(
                delivery_date=today,
                delivery_hub_id=main_hub_id,
                payment_mode=PaymentMode.PREPAID,
                items=[OrderItemCreate(crop_id=tomato_id, qty_kg=20.0)]
            ),
            current_user=buyer_user,
            db=db_session
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"]["code"] == "OUT_OF_STOCK"
    assert exc_info.value.detail["error"]["details"]["available_kg"] == 0.0

    # Step 3: Physical stock arrives at hub (weigh-in receipt of exactly 50 kg)
    api_hub_weigh_in(
        id=main_hub_id,
        crop_id=tomato_id,
        kg_hub=50.0,
        kg_driver=50.0,
        current_user=admin_user,
        db=db_session
    )

    # Step 4: First buyer places same-day order for 30 kg -> SUCCEEDS (leaving 20 kg in ledger)
    order1 = api_create_order(
        data=OrderCreate(
            delivery_date=today,
            delivery_hub_id=main_hub_id,
            payment_mode=PaymentMode.PREPAID,
            items=[OrderItemCreate(crop_id=tomato_id, qty_kg=30.0)]
        ),
        current_user=buyer_user,
        db=db_session
    )
    assert order1.status == OrderStatus.CONFIRMED

    # Step 5: Second buyer attempts to order 30 kg when only 20 kg remains -> REJECTED (no oversell)
    with pytest.raises(OutOfStockException) as exc_info2:
        api_create_order(
            data=OrderCreate(
                delivery_date=today,
                delivery_hub_id=main_hub_id,
                payment_mode=PaymentMode.PREPAID,
                items=[OrderItemCreate(crop_id=tomato_id, qty_kg=30.0)]
            ),
            current_user=buyer_user,
            db=db_session
        )
    assert exc_info2.value.detail["error"]["code"] == "OUT_OF_STOCK"
    assert exc_info2.value.detail["error"]["details"]["available_kg"] == 20.0

    # Step 6: Third buyer orders exactly remaining 20 kg -> SUCCEEDS (depleting to 0 kg)
    order3 = api_create_order(
        data=OrderCreate(
            delivery_date=today,
            delivery_hub_id=main_hub_id,
            payment_mode=PaymentMode.PREPAID,
            items=[OrderItemCreate(crop_id=tomato_id, qty_kg=20.0)]
        ),
        current_user=buyer_user,
        db=db_session
    )
    assert order3.status == OrderStatus.CONFIRMED

    # Step 7: Final attempt for even 10 kg -> REJECTED (0 kg remaining)
    with pytest.raises(OutOfStockException) as exc_info3:
        api_create_order(
            data=OrderCreate(
                delivery_date=today,
                delivery_hub_id=main_hub_id,
                payment_mode=PaymentMode.PREPAID,
                items=[OrderItemCreate(crop_id=tomato_id, qty_kg=10.0)]
            ),
            current_user=buyer_user,
            db=db_session
        )
    assert exc_info3.value.detail["error"]["code"] == "OUT_OF_STOCK"
    assert exc_info3.value.detail["error"]["details"]["available_kg"] == 0.0
