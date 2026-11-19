import uuid
import jwt
from typing import List, Optional
from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthenticatedException, ForbiddenException
from app.models.user import User
from app.models.enums import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_token_from_header(auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> str:
    if not auth or not auth.credentials:
        raise UnauthenticatedException("Missing Bearer Authorization header")
    return auth.credentials


def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_token(token, expected_type="access")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthenticatedException("Malformed token payload")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError) as e:
        raise UnauthenticatedException(str(e))

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthenticatedException("User not found or inactive")
    return user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory to check if the current user has one of the allowed roles.
    SUPER_ADMIN is granted universal access across all role-protected endpoints.
    """
    role_values = {r.value if isinstance(r, UserRole) else r for r in allowed_roles}
    role_values.add(UserRole.SUPER_ADMIN.value)

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_str = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if user_role_str not in role_values:
            raise ForbiddenException(
                f"Role '{user_role_str}' is not authorized. Allowed roles: {list(role_values)}"
            )
        return current_user

    return role_checker
