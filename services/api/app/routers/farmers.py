import uuid
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Farmer, FarmerCropThreshold
from app.models.listing import FarmerListing
from app.models.crop import Crop
from app.models.trip import Trip, TripStop
from app.models.payment import Settlement
from app.models.enums import UserRole, ListingStatus, TripStatus
from app.schemas.farmer import (
    FarmerProfileUpdate, FarmerProfileResponse,
    FarmerThresholdUpdate, CropThresholdItem,
    FarmerListingCreate, FarmerListingUpdate, FarmerListingResponse
)
from app.core.dependencies import require_roles
from app.core.exceptions import NotFoundException, ForbiddenException, CutoffPassedException
from app.services.listing_service import create_or_update_listing, check_cutoff_passed, get_applicable_threshold

router = APIRouter(prefix="/farmers/me", tags=["Farmer"])


@router.get("", response_model=FarmerProfileResponse)
def get_farmer_profile(
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        farmer = Farmer(user_id=current_user.id)
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

    thresholds = db.query(FarmerCropThreshold).filter(FarmerCropThreshold.farmer_id == current_user.id).all()
    loc = farmer.location or {}
    return FarmerProfileResponse(
        user_id=farmer.user_id,
        village=farmer.village,
        taluk=farmer.taluk,
        district=farmer.district,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        nearest_hub_id=farmer.nearest_hub_id,
        land_acres=float(farmer.land_acres) if farmer.land_acres else None,
        default_min_kg=float(farmer.default_min_kg),
        upi_id=farmer.upi_id,
        reliability_score=float(farmer.reliability_score),
        approved=farmer.approved,
        crop_thresholds=[CropThresholdItem(crop_id=t.crop_id, min_kg=float(t.min_kg)) for t in thresholds]
    )


@router.put("", response_model=FarmerProfileResponse)
def update_farmer_profile(
    data: FarmerProfileUpdate,
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        farmer = Farmer(user_id=current_user.id)
        db.add(farmer)

    if data.village is not None:
        farmer.village = data.village
    if data.taluk is not None:
        farmer.taluk = data.taluk
    if data.district is not None:
        farmer.district = data.district
    if data.lat is not None and data.lng is not None:
        farmer.location = {"lat": data.lat, "lng": data.lng}
    if data.nearest_hub_id is not None:
        farmer.nearest_hub_id = data.nearest_hub_id
    if data.land_acres is not None:
        farmer.land_acres = data.land_acres
    if data.default_min_kg is not None:
        farmer.default_min_kg = data.default_min_kg
    if data.upi_id is not None:
        farmer.upi_id = data.upi_id

    db.commit()
    db.refresh(farmer)

    thresholds = db.query(FarmerCropThreshold).filter(FarmerCropThreshold.farmer_id == current_user.id).all()
    loc = farmer.location or {}
    return FarmerProfileResponse(
        user_id=farmer.user_id,
        village=farmer.village,
        taluk=farmer.taluk,
        district=farmer.district,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        nearest_hub_id=farmer.nearest_hub_id,
        land_acres=float(farmer.land_acres) if farmer.land_acres else None,
        default_min_kg=float(farmer.default_min_kg),
        upi_id=farmer.upi_id,
        reliability_score=float(farmer.reliability_score),
        approved=farmer.approved,
        crop_thresholds=[CropThresholdItem(crop_id=t.crop_id, min_kg=float(t.min_kg)) for t in thresholds]
    )


@router.get("/threshold", response_model=dict)
def get_thresholds(
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    default_min = float(farmer.default_min_kg) if farmer else 20.0
    thresholds = db.query(FarmerCropThreshold).filter(FarmerCropThreshold.farmer_id == current_user.id).all()

    return {
        "default_min_kg": default_min,
        "per_crop": [{"crop_id": t.crop_id, "min_kg": float(t.min_kg)} for t in thresholds]
    }


@router.put("/threshold", response_model=dict)
def update_thresholds(
    data: FarmerThresholdUpdate,
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        farmer = Farmer(user_id=current_user.id)
        db.add(farmer)

    farmer.default_min_kg = data.default_min_kg

    # Delete existing crop thresholds and insert new overrides
    db.query(FarmerCropThreshold).filter(FarmerCropThreshold.farmer_id == current_user.id).delete()
    if data.per_crop:
        for item in data.per_crop:
            t = FarmerCropThreshold(
                farmer_id=current_user.id,
                crop_id=item.crop_id,
                min_kg=item.min_kg
            )
            db.add(t)

    db.commit()
    return {"message": "Thresholds updated successfully", "default_min_kg": data.default_min_kg}


@router.post("/listings", response_model=FarmerListingResponse, status_code=status.HTTP_201_CREATED)
def submit_listing(
    data: FarmerListingCreate,
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    listing = create_or_update_listing(
        db=db,
        farmer_id=current_user.id,
        crop_id=data.crop_id,
        listing_date=data.listing_date,
        est_kg=data.est_kg,
        ready_from=data.ready_from,
        ready_by=data.ready_by,
        enforce_cutoff=False  # Allow flexible creation in pilot; enforcement checked in service
    )

    crop = db.query(Crop).filter(Crop.id == data.crop_id).first()
    msg_kn = "ಪಿಕಪ್‌ಗೆ ಅರ್ಹವಾಗಿದೆ" if listing.status == ListingStatus.ELIGIBLE else "ಕನಿಷ್ಠ ತೂಕಕ್ಕಿಂತ ಕಡಿಮೆಯಿದೆ"

    return FarmerListingResponse(
        id=listing.id,
        farmer_id=listing.farmer_id,
        crop_id=listing.crop_id,
        crop_name=crop.name_en if crop else None,
        listing_date=listing.listing_date,
        est_kg=float(listing.est_kg),
        ready_from=listing.ready_from,
        ready_by=listing.ready_by,
        status=listing.status,
        min_kg_applied=float(listing.min_kg_applied) if listing.min_kg_applied else None,
        created_at=listing.created_at,
        message_kn=msg_kn
    )


@router.get("/listings", response_model=dict)
def get_farmer_listings(
    date: Optional[date] = Query(None),
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    q = db.query(FarmerListing).filter(FarmerListing.farmer_id == current_user.id)
    if date:
        q = q.filter(FarmerListing.listing_date == date)
    listings = q.order_by(FarmerListing.listing_date.desc()).all()

    items = []
    for l in listings:
        crop = db.query(Crop).filter(Crop.id == l.crop_id).first()
        items.append({
            "id": l.id,
            "farmer_id": l.farmer_id,
            "crop_id": l.crop_id,
            "crop_name": crop.name_en if crop else None,
            "listing_date": l.listing_date,
            "est_kg": float(l.est_kg),
            "ready_from": l.ready_from,
            "ready_by": l.ready_by,
            "status": l.status,
            "min_kg_applied": float(l.min_kg_applied) if l.min_kg_applied else None,
            "created_at": l.created_at
        })

    return {"items": items, "total": len(items)}


@router.put("/listings/{id}", response_model=FarmerListingResponse)
def edit_listing(
    id: uuid.UUID,
    data: FarmerListingUpdate,
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    listing = db.query(FarmerListing).filter(
        FarmerListing.id == id,
        FarmerListing.farmer_id == current_user.id
    ).first()
    if not listing:
        raise NotFoundException("Listing", id)

    if check_cutoff_passed(listing.listing_date):
        raise CutoffPassedException(cutoff_time="D-1 18:00 IST", action="editing listing")

    min_kg = get_applicable_threshold(db, current_user.id, listing.crop_id)
    listing.est_kg = data.est_kg
    if data.ready_by is not None:
        listing.ready_by = data.ready_by
    listing.status = ListingStatus.ELIGIBLE if data.est_kg >= min_kg else ListingStatus.INELIGIBLE
    listing.min_kg_applied = min_kg

    db.commit()
    db.refresh(listing)

    crop = db.query(Crop).filter(Crop.id == listing.crop_id).first()
    return FarmerListingResponse(
        id=listing.id,
        farmer_id=listing.farmer_id,
        crop_id=listing.crop_id,
        crop_name=crop.name_en if crop else None,
        listing_date=listing.listing_date,
        est_kg=float(listing.est_kg),
        ready_from=listing.ready_from,
        ready_by=listing.ready_by,
        status=listing.status,
        min_kg_applied=float(listing.min_kg_applied) if listing.min_kg_applied else None,
        created_at=listing.created_at
    )


@router.delete("/listings/{id}")
def cancel_listing(
    id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    listing = db.query(FarmerListing).filter(
        FarmerListing.id == id,
        FarmerListing.farmer_id == current_user.id
    ).first()
    if not listing:
        raise NotFoundException("Listing", id)

    if check_cutoff_passed(listing.listing_date):
        raise CutoffPassedException(cutoff_time="D-1 18:00 IST", action="cancelling listing")

    listing.status = ListingStatus.CANCELLED
    db.commit()
    return {"message": "Listing cancelled successfully"}


@router.get("/pickup", response_model=dict)
def get_current_pickup(
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    # Find active trip stop for this farmer
    stop = db.query(TripStop).join(Trip).filter(
        TripStop.farmer_id == current_user.id,
        Trip.status.in_([TripStatus.ASSIGNED, TripStatus.STARTED, TripStatus.ACKNOWLEDGED])
    ).first()

    if not stop:
        return {"status": "NO_ACTIVE_PICKUP", "message": "No active pickup assigned for today"}

    trip = stop.trip
    driver = trip.driver.user if trip.driver else None
    vehicle = trip.vehicle

    return {
        "status": stop.status,
        "trip_id": trip.id,
        "stop_id": stop.id,
        "driver": {"name": driver.name if driver else "Assigned Driver", "phone": driver.phone if driver else ""},
        "vehicle": {"reg_no": vehicle.reg_no if vehicle else "", "type": vehicle.type if vehicle else ""},
        "eta": stop.eta
    }


@router.get("/payments", response_model=dict)
def get_farmer_payments(
    current_user: User = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db)
):
    settlements = db.query(Settlement).filter(
        Settlement.farmer_id == current_user.id
    ).order_by(Settlement.settle_date.desc()).all()

    return {
        "items": [
            {
                "id": s.id,
                "settle_date": str(s.settle_date),
                "accepted_kg": float(s.accepted_kg),
                "gross_paise": s.gross,
                "commission_paise": s.commission,
                "logistics_share_paise": s.logistics_share,
                "net_paise": s.net,
                "status": s.status,
                "paid_at": s.paid_at
            }
            for s in settlements
        ],
        "total": len(settlements)
    }
