from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.auth import (
    OtpRequest, OtpRequestResponse, OtpVerify,
    RefreshTokenRequest, TokenResponse, UserResponse, UserUpdate
)
from app.services.auth_service import request_otp, verify_otp, refresh_user_token
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="", tags=["Auth"])


@router.post("/auth/otp/request", response_model=OtpRequestResponse)
def api_request_otp(data: OtpRequest):
    req_id, otp = request_otp(data.phone, data.role)
    return OtpRequestResponse(
        request_id=req_id,
        message=f"OTP sent to {data.phone}",
        mock_otp=otp if settings.MOCK_OTP else None
    )


@router.post("/auth/otp/verify", response_model=TokenResponse)
def api_verify_otp(data: OtpVerify, db: Session = Depends(get_db)):
    access_token, refresh_token, user, needs_onboarding = verify_otp(db, data.request_id, data.otp)
    user_resp = UserResponse(
        id=user.id,
        phone=user.phone,
        role=user.role,
        name=user.name,
        language=user.language,
        is_active=user.is_active,
        needs_onboarding=needs_onboarding
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_resp
    )


@router.post("/auth/refresh")
def api_refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    new_access, new_refresh = refresh_user_token(db, data.refresh_token)
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@router.post("/auth/logout")
def api_logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def api_get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def api_update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name is not None:
        current_user.name = data.name
    if data.language is not None:
        current_user.language = data.language
    db.commit()
    db.refresh(current_user)
    return current_user
