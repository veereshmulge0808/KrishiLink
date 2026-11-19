import uuid
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import UserRole


class OtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number with country code, e.g. +919876543210")
    role: Optional[UserRole] = Field(default=UserRole.BUYER, description="Role if user is new")


class OtpRequestResponse(BaseModel):
    request_id: str
    message: str
    mock_otp: Optional[str] = None  # Returned only in dev / test mode


class OtpVerify(BaseModel):
    request_id: str
    otp: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    phone: str
    role: UserRole
    name: Optional[str] = None
    language: str = "kn"
    is_active: bool = True
    needs_onboarding: bool = False

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
