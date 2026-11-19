import pytest
from datetime import date
from app.schemas.farmer import FarmerListingCreate
from app.schemas.admin import AdminSettingsUpdate
from app.routers.farmers import submit_listing
from app.routers.admin import (
    api_admin_overview, api_dispatch_pool,
    api_admin_map_live, api_get_settings, api_update_settings
)


def test_admin_control_tower_and_dispatch(db_session, seed_data):
    admin_user = seed_data["admin_user"]
    farmer_user = seed_data["farmer_user"]
    tomato_id = seed_data["tomato"].id
    today = date.today()

    # 1. Create an eligible farmer listing for today
    submit_listing(
        data=FarmerListingCreate(
            crop_id=tomato_id,
            est_kg=150.0,
            listing_date=today
        ),
        current_user=farmer_user,
        db=db_session
    )

    # 2. View dispatch pool
    pool = api_dispatch_pool(date=today, current_user=admin_user, db=db_session)
    assert len(pool["pending_pickups"]) >= 1
    assert pool["pending_pickups"][0]["est_kg"] == 150.0

    # 3. Overview KPIs
    overview = api_admin_overview(current_user=admin_user, db=db_session)
    assert overview.hubs_count >= 2

    # 4. Live map snapshot
    map_live = api_admin_map_live(current_user=admin_user, db=db_session)
    assert len(map_live["hubs"]) >= 2

    # 5. Settings GET and PUT
    settings_data = api_get_settings(current_user=admin_user, db=db_session)
    assert "listing_cutoff_time" in settings_data.settings

    updated_settings = api_update_settings(
        data=AdminSettingsUpdate(settings={"listing_cutoff_time": "17:30", "default_farmer_threshold_kg": 25.0}),
        current_user=admin_user,
        db=db_session
    )
    assert updated_settings.settings["listing_cutoff_time"] == "17:30"
