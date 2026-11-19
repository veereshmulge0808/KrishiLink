"""
Authentication service.

OTP flow:
  - request_otp: issues a single-use OTP per request_id; expiring, rate-limited
  - verify_otp:  validates OTP (single-use, consuming on first correct attempt)
  - Brute-force protection: max OTP_MAX_ATTEMPTS wrong attempts per request_id
  - Rate limiting: OTP_RATE_LIMIT_WINDOW_S per phone before another request is allowed

Role integrity:
  - Role is set at account creation from the OTP request; never accepted from API callers
  - Existing users keep their DB role regardless of what the OTP request claims
  - ADMIN / SUPER_ADMIN roles can ONLY be assigned manually in the database, never via API
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, Farmer, Buyer
from app.models.enums import UserRole
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import KrishiLinkException, UnauthenticatedException

# In-memory OTP store (single-process dev/test only; use Redis in production).
# Structure: {request_id: {phone, otp, role, expires_at, attempts, used}}
_otp_store: Dict[str, dict] = {}

# Per-phone rate limiting: {phone: last_request_at}
_otp_rate: Dict[str, datetime] = {}

# Privileged roles that can NEVER be assigned via the OTP API
_PROTECTED_ROLES = {UserRole.ADMIN, UserRole.SUPER_ADMIN}


def _safe_role(requested_role: Optional[UserRole]) -> UserRole:
    """Strip any attempt to self-assign a privileged role through the API."""
    if requested_role in _PROTECTED_ROLES:
        return UserRole.FARMER  # silently downgrade
    return requested_role or UserRole.BUYER


def request_otp(phone: str, role: Optional[UserRole] = UserRole.BUYER) -> Tuple[str, str]:
    phone = phone.strip()
    now = datetime.now(timezone.utc)

    # Rate-limit: one OTP per phone per OTP_RATE_LIMIT_WINDOW_S
    last = _otp_rate.get(phone)
    if last:
        elapsed = (now - last).total_seconds()
        if elapsed < settings.OTP_RATE_LIMIT_WINDOW_S:
            wait = int(settings.OTP_RATE_LIMIT_WINDOW_S - elapsed)
            raise KrishiLinkException(
                status_code=429,
                code="OTP_RATE_LIMITED",
                message=f"Too many OTP requests. Please wait {wait} seconds.",
                details={"retry_after_seconds": wait},
            )

    _otp_rate[phone] = now

    request_id = f"req_{uuid.uuid4().hex[:16]}"
    otp = settings.MOCK_OTP_CODE if settings.MOCK_OTP else _generate_otp()
    expires_at = now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

    # Strip privileged roles before storing
    safe_role = _safe_role(role)

    _otp_store[request_id] = {
        "phone": phone,
        "otp": otp,
        "role": safe_role,
        "expires_at": expires_at,
        "attempts": 0,
        "used": False,
    }
    return request_id, otp


def _generate_otp() -> str:
    import secrets
    return str(secrets.randbelow(900000) + 100000)


def verify_otp(db: Session, request_id: str, otp: str) -> Tuple[str, str, User, bool]:
    record = _otp_store.get(request_id)
    now = datetime.now(timezone.utc)

    if not record:
        raise KrishiLinkException(
            status_code=400,
            code="INVALID_OTP_REQUEST",
            message="Invalid or expired OTP request. Please request a new OTP.",
        )

    # Already used (single-use enforcement)
    if record.get("used"):
        raise KrishiLinkException(
            status_code=400,
            code="OTP_ALREADY_USED",
            message="This OTP has already been used. Please request a new OTP.",
        )

    # Expiry check
    if now > record["expires_at"]:
        _otp_store.pop(request_id, None)
        raise KrishiLinkException(
            status_code=400,
            code="OTP_EXPIRED",
            message=f"OTP has expired (valid for {settings.OTP_EXPIRY_SECONDS}s). Please request a new OTP.",
        )

    # Brute-force protection
    record["attempts"] += 1
    if record["attempts"] > settings.OTP_MAX_ATTEMPTS:
        _otp_store.pop(request_id, None)
        raise KrishiLinkException(
            status_code=429,
            code="OTP_TOO_MANY_ATTEMPTS",
            message="Too many incorrect OTP attempts. Please request a new OTP.",
        )

    # Constant-time comparison to prevent timing attacks
    import hmac
    if not hmac.compare_digest(record["otp"], otp.strip()):
        remaining = settings.OTP_MAX_ATTEMPTS - record["attempts"]
        raise KrishiLinkException(
            status_code=400,
            code="INVALID_OTP",
            message=f"The OTP entered is incorrect. {remaining} attempts remaining.",
            details={"attempts_remaining": remaining},
        )

    # Mark used before any DB work (prevents replay on exception)
    record["used"] = True
    phone = record["phone"]
    requested_role = record["role"]  # already stripped of privileged roles

    # Look up or create user
    user = db.query(User).filter(User.phone == phone).first()
    needs_onboarding = False

    if not user:
        needs_onboarding = True
        user = User(
            phone=phone,
            role=requested_role,  # role set once at registration; never overwritten
            language="kn",
            is_active=True,
            last_login_at=now,
        )
        db.add(user)
        db.flush()

        # Create role stub
        if requested_role == UserRole.FARMER:
            db.add(Farmer(user_id=user.id, default_min_kg=settings.DEFAULT_FARMER_THRESHOLD_KG))
        elif requested_role == UserRole.BUYER:
            db.add(Buyer(user_id=user.id, business_name=f"Buyer {phone[-4:]}"))
        db.commit()
        db.refresh(user)
    else:
        # NEVER update role from API — existing role is authoritative
        user.last_login_at = now
        db.commit()
        db.refresh(user)

    # Clean up store after successful auth
    _otp_store.pop(request_id, None)

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
