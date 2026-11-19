import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Buyer
from app.models.enums import UserRole
from app.schemas.buyer import BuyerProfileUpdate, BuyerProfileResponse
from app.core.dependencies import require_roles
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/buyers/me", tags=["Buyer"])


@router.get("", response_model=BuyerProfileResponse)
def get_buyer_profile(
    current_user: User = Depends(require_roles(UserRole.BUYER)),
    db: Session = Depends(get_db)
):
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.id).first()
    if not buyer:
        buyer = Buyer(user_id=current_user.id, business_name=f"Buyer {current_user.phone[-4:]}")
        db.add(buyer)
        db.commit()
        db.refresh(buyer)

    loc = buyer.location or {}
    return BuyerProfileResponse(
        user_id=buyer.user_id,
        business_name=buyer.business_name,
        business_type=buyer.business_type,
        gstin=buyer.gstin,
        address=buyer.address,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        delivery_hub_id=buyer.delivery_hub_id,
        credit_limit=buyer.credit_limit,
        credit_days=buyer.credit_days,
        approved=buyer.approved
    )


@router.put("", response_model=BuyerProfileResponse)
def update_buyer_profile(
    data: BuyerProfileUpdate,
    current_user: User = Depends(require_roles(UserRole.BUYER)),
    db: Session = Depends(get_db)
):
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.id).first()
    if not buyer:
        buyer = Buyer(user_id=current_user.id, business_name=data.business_name)
        db.add(buyer)

    buyer.business_name = data.business_name
    if data.business_type is not None:
        buyer.business_type = data.business_type
    if data.gstin is not None:
        buyer.gstin = data.gstin
    if data.address is not None:
        buyer.address = data.address
    if data.lat is not None and data.lng is not None:
        buyer.location = {"lat": data.lat, "lng": data.lng}
    if data.delivery_hub_id is not None:
        buyer.delivery_hub_id = data.delivery_hub_id

    db.commit()
    db.refresh(buyer)

    loc = buyer.location or {}
    return BuyerProfileResponse(
        user_id=buyer.user_id,
        business_name=buyer.business_name,
        business_type=buyer.business_type,
        gstin=buyer.gstin,
        address=buyer.address,
        lat=loc.get("lat"),
        lng=loc.get("lng"),
        delivery_hub_id=buyer.delivery_hub_id,
        credit_limit=buyer.credit_limit,
        credit_days=buyer.credit_days,
        approved=buyer.approved
    )
