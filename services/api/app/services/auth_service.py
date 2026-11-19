import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, Farmer, Buyer
from app.models.enums import UserRole
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import KrishiLinkException, UnauthenticatedException

# In-memory OTP store for development/testing: {request_id: {"phone": ..., "otp": ..., "role": ..., "expires_at": ...}}
_otp_store: Dict[str, dict] = {}


def request_otp(phone: str, role: Optional[UserRole] = UserRole.BUYER) -> Tuple[str, str]:
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    otp = settings.MOCK_OTP_CODE if settings.MOCK_OTP else str(uuid.uuid4().int % 900000 + 100000)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

    _otp_store[request_id] = {
        "phone": phone.strip(),
        "otp": otp,
        "role": role or UserRole.BUYER,
        "expires_at": expires_at,
    }
    return request_id, otp


def verify_otp(db: Session, request_id: str, otp: str) -> Tuple[str, str, User, bool]:
    record = _otp_store.get(request_id)
    if not record:
        raise KrishiLinkException(
            status_code=400,
            code="INVALID_OTP",
            message="Invalid or expired OTP request. Please request a new OTP."
        )

    if datetime.now(timezone.utc) > record["expires_at"]:
        _otp_store.pop(request_id, None)
        raise KrishiLinkException(
            status_code=400,
            code="OTP_EXPIRED",
            message="OTP has expired. Please request a new OTP."
        )

    if record["otp"] != otp.strip():
        raise KrishiLinkException(
            status_code=400,
            code="INVALID_OTP",
            message="The OTP entered is incorrect."
        )

    # Valid OTP - consume it
    phone = record["phone"]
    requested_role = record["role"]
    _otp_store.pop(request_id, None)

    # Check if user exists
    user = db.query(User).filter(User.phone == phone).first()
    needs_onboarding = False

    if not user:
        needs_onboarding = True
        user = User(
            phone=phone,
            role=requested_role,
            language="kn",
            is_active=True,
            last_login_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.flush()

        # Create associated role stub
        if requested_role == UserRole.FARMER:
            farmer = Farmer(user_id=user.id, default_min_kg=settings.DEFAULT_FARMER_THRESHOLD_KG)
            db.add(farmer)
        elif requested_role == UserRole.BUYER:
            buyer = Buyer(user_id=user.id, business_name=f"Buyer {phone[-4:]}")
            db.add(buyer)
        db.commit()
        db.refresh(user)
    else:
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    return access_token, refresh_token, user, needs_onboarding


def refresh_user_token(db: Session, refresh_token: str) -> Tuple[str, str]:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthenticatedException("Invalid refresh token")
        user_id = uuid.UUID(user_id_str)
    except Exception as e:
        raise UnauthenticatedException(f"Token refresh failed: {str(e)}")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthenticatedException("User inactive or not found")

    new_access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id, user.role)
    return new_access, new_refresh
