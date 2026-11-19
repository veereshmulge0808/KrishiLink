import pytest
import uuid
from app.models.enums import UserRole
from app.schemas.auth import OtpRequest, OtpVerify, RefreshTokenRequest, UserUpdate
from app.routers.auth import api_request_otp, api_verify_otp, api_refresh_token, api_get_me, api_update_me
from app.core.exceptions import KrishiLinkException, ForbiddenException
from app.core.dependencies import require_roles
from app.core.security import decode_token


def test_otp_flow_and_me(db_session, seed_data):
    # 1. Request OTP
    req_resp = api_request_otp(OtpRequest(phone="+919876543210", role=UserRole.BUYER))
    assert req_resp.request_id.startswith("req_")
    assert req_resp.mock_otp == "123456"

    # 2. Verify with invalid OTP -> raises KrishiLinkException with INVALID_OTP
    with pytest.raises(KrishiLinkException) as exc_info:
        api_verify_otp(OtpVerify(request_id=req_resp.request_id, otp="999999"), db=db_session)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"]["code"] == "INVALID_OTP"

    # 3. Verify with valid OTP -> returns access_token, refresh_token, and user
    token_resp = api_verify_otp(OtpVerify(request_id=req_resp.request_id, otp="123456"), db=db_session)
    assert token_resp.access_token is not None
    assert token_resp.refresh_token is not None
    assert token_resp.user.phone == "+919876543210"
    assert token_resp.user.role == UserRole.BUYER

    # 4. Token decode validation
    payload = decode_token(token_resp.access_token, expected_type="access")
    assert payload["sub"] == str(token_resp.user.id)
    assert payload["role"] == "buyer"

    # 5. Token refresh
    refresh_resp = api_refresh_token(RefreshTokenRequest(refresh_token=token_resp.refresh_token), db=db_session)
    assert "access_token" in refresh_resp
    assert "refresh_token" in refresh_resp


def test_role_authorization_boundaries(seed_data):
    buyer_user = seed_data["buyer_user"]
    admin_user = seed_data["admin_user"]
    super_admin_user = seed_data["super_admin_user"]

    admin_checker = require_roles(UserRole.ADMIN)

    # 1. Buyer attempting admin action -> raises ForbiddenException
    with pytest.raises(ForbiddenException):
        admin_checker(current_user=buyer_user)

    # 2. Admin attempting admin action -> succeeds
    assert admin_checker(current_user=admin_user) == admin_user

    # 3. Super Admin universal access -> succeeds
    assert admin_checker(current_user=super_admin_user) == super_admin_user
