import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.listing import FarmerListing
from app.models.user import Farmer, FarmerCropThreshold
from app.models.crop import Crop
from app.models.enums import ListingStatus
from app.core.exceptions import NotFoundException, ThresholdNotMetException, CutoffPassedException, KrishiLinkException


def get_applicable_threshold(db: Session, farmer_id: uuid.UUID, crop_id: uuid.UUID) -> float:
    # 1. Per-crop override for this farmer
    threshold_rec = db.query(FarmerCropThreshold).filter(
        FarmerCropThreshold.farmer_id == farmer_id,
        FarmerCropThreshold.crop_id == crop_id
    ).first()
    if threshold_rec and threshold_rec.min_kg > 0:
        return float(threshold_rec.min_kg)

    # 2. Farmer's default threshold
    farmer = db.query(Farmer).filter(Farmer.user_id == farmer_id).first()
    if farmer and farmer.default_min_kg > 0:
        return float(farmer.default_min_kg)

    # 3. Crop's default threshold
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if crop and crop.default_min_kg > 0:
        return float(crop.default_min_kg)

    return float(settings.DEFAULT_FARMER_THRESHOLD_KG)


def check_cutoff_passed(listing_date: date) -> bool:
    """
    Cutoff is D-1 at 18:00 IST (UTC 12:30).
    If target date is today or in the past, or D-1 cutoff has passed.
    """
    now_utc = datetime.now(timezone.utc)
    # Target date collection cutoff is D-1 18:00 IST
    # Convert listing_date D to D-1 12:30 UTC
    cutoff_datetime = datetime(
        listing_date.year, listing_date.month, listing_date.day,
        12, 30, tzinfo=timezone.utc
    ) - timedelta(days=1)

    return now_utc > cutoff_datetime


def create_or_update_listing(
    db: Session,
    farmer_id: uuid.UUID,
    crop_id: uuid.UUID,
    listing_date: date,
    est_kg: float,
    ready_from: Optional[datetime] = None,
    ready_by: Optional[datetime] = None,
    enforce_cutoff: bool = True
) -> FarmerListing:
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.active == True).first()
    if not crop:
        raise NotFoundException("Crop", crop_id)

    if enforce_cutoff and check_cutoff_passed(listing_date):
        raise CutoffPassedException(
            cutoff_time=f"D-1 {settings.LISTING_CUTOFF_HOUR_IST}:00 IST",
            action="new listings or edits"
        )

    min_kg = get_applicable_threshold(db, farmer_id, crop_id)

    # Check eligibility against threshold
    if est_kg >= min_kg:
        status = ListingStatus.ELIGIBLE
    else:
        status = ListingStatus.INELIGIBLE

    # Check if a listing already exists for (farmer_id, crop_id, listing_date)
    listing = db.query(FarmerListing).filter(
        FarmerListing.farmer_id == farmer_id,
        FarmerListing.crop_id == crop_id,
        FarmerListing.listing_date == listing_date
    ).first()

    if listing:
        listing.est_kg = est_kg
        listing.ready_from = ready_from
        listing.ready_by = ready_by
        listing.status = status
        listing.min_kg_applied = min_kg
    else:
        listing = FarmerListing(
            farmer_id=farmer_id,
            crop_id=crop_id,
            listing_date=listing_date,
            est_kg=est_kg,
            ready_from=ready_from,
            ready_by=ready_by,
            status=status,
            min_kg_applied=min_kg
        )
        db.add(listing)

    db.commit()
    db.refresh(listing)
    return listing
