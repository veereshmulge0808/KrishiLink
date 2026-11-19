import pytest
from datetime import date, timedelta
from app.schemas.farmer import (
    FarmerThresholdUpdate, CropThresholdItem,
    FarmerListingCreate, FarmerListingUpdate
)
from app.routers.farmers import (
    update_thresholds, get_thresholds,
    submit_listing, get_farmer_listings,
    edit_listing, cancel_listing
)
from app.models.enums import ListingStatus


def test_farmer_threshold_and_listing_eligibility(db_session, seed_data):
    farmer_user = seed_data["farmer_user"]
    tomato_id = seed_data["tomato"].id
    onion_id = seed_data["onion"].id
    target_date = date.today() + timedelta(days=2)

    # 1. Update thresholds: default 25 kg, Onion override 60 kg
    update_thresholds(
        data=FarmerThresholdUpdate(
            default_min_kg=25.0,
            per_crop=[CropThresholdItem(crop_id=onion_id, min_kg=60.0)]
        ),
        current_user=farmer_user,
        db=db_session
    )

    thresholds = get_thresholds(current_user=farmer_user, db=db_session)
    assert thresholds["default_min_kg"] == 25.0
    assert len(thresholds["per_crop"]) == 1
    assert thresholds["per_crop"][0]["min_kg"] == 60.0

    # 2. Submit Tomato listing: 30 kg (>= 25 kg default) -> ELIGIBLE
    tomato_listing = submit_listing(
        data=FarmerListingCreate(
            crop_id=tomato_id,
            est_kg=30.0,
            listing_date=target_date
        ),
        current_user=farmer_user,
        db=db_session
    )
    assert tomato_listing.status == ListingStatus.ELIGIBLE
    assert tomato_listing.min_kg_applied == 25.0

    # 3. Submit Onion listing: 40 kg (< 60 kg override) -> INELIGIBLE
    onion_listing = submit_listing(
        data=FarmerListingCreate(
            crop_id=onion_id,
            est_kg=40.0,
            listing_date=target_date
        ),
        current_user=farmer_user,
        db=db_session
    )
    assert onion_listing.status == ListingStatus.INELIGIBLE
    assert onion_listing.min_kg_applied == 60.0

    # 4. View farmer's listings
    listings_resp = get_farmer_listings(date=target_date, current_user=farmer_user, db=db_session)
    assert listings_resp["total"] == 2

    # 5. Cancel the onion listing
    cancel_resp = cancel_listing(id=onion_listing.id, current_user=farmer_user, db=db_session)
    assert cancel_resp["message"] == "Listing cancelled successfully"
