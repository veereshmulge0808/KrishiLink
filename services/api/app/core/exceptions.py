from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class KrishiLinkException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={"error": {"code": code, "message": message, "details": details or {}}},
            headers=headers,
        )


class UnauthenticatedException(KrishiLinkException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHENTICATED",
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(KrishiLinkException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
        )


class NotFoundException(KrishiLinkException):
    def __init__(self, resource: str, resource_id: Any = None):
        msg = f"{resource} not found" if resource_id is None else f"{resource} with id '{resource_id}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=msg,
        )


class ThresholdNotMetException(KrishiLinkException):
    def __init__(self, min_kg: float, actual_kg: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="THRESHOLD_NOT_MET",
            message=f"Quantity ({actual_kg} kg) is below the minimum threshold ({min_kg} kg) for pickup",
            details={"min_kg": min_kg, "actual_kg": actual_kg},
        )


class CutoffPassedException(KrishiLinkException):
    def __init__(self, cutoff_time: str, action: str = "modifications"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="CUTOFF_PASSED",
            message=f"The cutoff time ({cutoff_time}) has passed. No further {action} are allowed for this date.",
            details={"cutoff_time": cutoff_time},
        )


class OutOfStockException(KrishiLinkException):
    def __init__(self, crop_name: str, available_kg: float, requested_kg: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="OUT_OF_STOCK",
            message=f"Insufficient physical stock for {crop_name}. Requested: {requested_kg} kg, Available: {available_kg} kg.",
            details={"crop": crop_name, "available_kg": available_kg, "requested_kg": requested_kg},
        )


class InvalidStateException(KrishiLinkException):
    def __init__(self, current_state: str, allowed_states: list):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="INVALID_STATE",
            message=f"Action not permitted in current state '{current_state}'. Allowed states: {allowed_states}",
            details={"current_state": current_state, "allowed_states": allowed_states},
        )
