import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.crop import Crop
from app.models.trip import Trip, TripStop
from app.models.enums import UserRole, OrderStatus, TripStatus
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderItemResponse,
    OrderTrackingResponse, ConfirmDeliveryRequest
)
from app.core.dependencies import require_roles, get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException, CutoffPassedException
from app.services.order_service import create_buyer_order

router = APIRouter(prefix="", tags=["Orders"])


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def api_create_order(
    data: OrderCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(require_roles(UserRole.BUYER)),
    db: Session = Depends(get_db)
):
    key_str = idempotency_key if isinstance(idempotency_key, str) else None
    order = create_buyer_order(
        db=db,
        buyer_id=current_user.id,
        data=data,
        idempotency_key=key_str
    )

    items_resp = []
    for oi in order.items:
        crop = db.query(Crop).filter(Crop.id == oi.crop_id).first()
        items_resp.append(OrderItemResponse(
            id=oi.id,
            crop_id=oi.crop_id,
            crop_name=crop.name_en if crop else None,
            qty_kg=float(oi.qty_kg),
            confirmed_kg=float(oi.confirmed_kg) if oi.confirmed_kg is not None else None,
            delivered_kg=float(oi.delivered_kg) if oi.delivered_kg is not None else None,
            rejected_kg=float(oi.rejected_kg),
            price_per_kg_locked=oi.price_per_kg_locked
        ))

    return OrderResponse(
        id=order.id,
        buyer_id=order.buyer_id,
        delivery_hub_id=order.delivery_hub_id,
        delivery_date=order.delivery_date,
        slot_start=order.slot_start,
        slot_end=order.slot_end,
        status=order.status,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        total=order.total,
        payment_mode=order.payment_mode,
        created_at=order.created_at,
        items=items_resp
    )


@router.get("/orders", response_model=dict)
def api_list_orders(
    status: Optional[OrderStatus] = Query(None),
    current_user: User = Depends(require_roles(UserRole.BUYER)),
    db: Session = Depends(get_db)
):
    q = db.query(Order).filter(Order.buyer_id == current_user.id)
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).all()

    items = []
    for o in orders:
        items.append({
            "id": o.id,
            "delivery_date": str(o.delivery_date),
            "status": o.status,
            "total_paise": o.total,
            "item_count": len(o.items),
            "created_at": o.created_at
        })
    return {"items": items, "total": len(items)}


@router.get("/orders/{id}", response_model=OrderResponse)
def api_get_order(
    id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise NotFoundException("Order", id)

    # Row level access: if buyer, must be own order
    if current_user.role == UserRole.BUYER and order.buyer_id != current_user.id:
        raise ForbiddenException("Access to this order is forbidden")

    items_resp = []
    for oi in order.items:
        crop = db.query(Crop).filter(Crop.id == oi.crop_id).first()
        items_resp.append(OrderItemResponse(
            id=oi.id,
            crop_id=oi.crop_id,
            crop_name=crop.name_en if crop else None,
            qty_kg=float(oi.qty_kg),
            confirmed_kg=float(oi.confirmed_kg) if oi.confirmed_kg is not None else None,
            delivered_kg=float(oi.delivered_kg) if oi.delivered_kg is not None else None,
            rejected_kg=float(oi.rejected_kg),
            price_per_kg_locked=oi.price_per_kg_locked
        ))

    return OrderResponse(
        id=order.id,
        buyer_id=order.buyer_id,
        delivery_hub_id=order.delivery_hub_id,
        delivery_date=order.delivery_date,
        slot_start=order.slot_start,
        slot_end=order.slot_end,
        status=order.status,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        total=order.total,
        payment_mode=order.payment_mode,
        created_at=order.created_at,
        items=items_resp
    )


@router.post("/orders/{id}/cancel")
def api_cancel_order(
    id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.BUYER)),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id, Order.buyer_id == current_user.id).first()
    if not order:
        raise NotFoundException("Order", id)

    if order.status in [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED]:
        raise ForbiddenException(f"Cannot cancel order in status '{order.status}'")

    order.status = OrderStatus.CANCELLED
    db.commit()
    return {"message": "Order cancelled successfully", "order_id": order.id}


@router.get("/orders/{id}/tracking", response_model=OrderTrackingResponse)
def api_track_order(
    id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise NotFoundException("Order", id)

    if current_user.role == UserRole.BUYER and order.buyer_id != current_user.id:
        raise ForbiddenException("Access to this order tracking is forbidden")

    stop = db.query(TripStop).join(Trip).filter(TripStop.buyer_order_id == id).first()
    driver_info = None
    vehicle_info = None
    eta_mins = None

    if stop and stop.trip:
        trip = stop.trip
        if trip.driver and trip.driver.user:
            driver_info = {
                "name": trip.driver.user.name or "Assigned Driver",
                "phone": trip.driver.user.phone
            }
        if trip.vehicle:
            vehicle_info = {
                "reg_no": trip.vehicle.reg_no,
                "lat": 12.9131,
                "lng": 77.6101,
                "heading": 90
            }
        eta_mins = 15

    return OrderTrackingResponse(
        order_id=order.id,
        status=order.status,
        driver=driver_info,
        vehicle=vehicle_info,
        eta_minutes=eta_mins
    )


@router.post("/orders/{id}/confirm-delivery")
def api_confirm_delivery(
    id: uuid.UUID,
    data: ConfirmDeliveryRequest,
    current_user: User = Depends(require_roles(UserRole.BUYER, UserRole.DRIVER)),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise NotFoundException("Order", id)

    order.status = OrderStatus.DELIVERED

    # Update received/rejected kg on items
    for item_report in data.items:
        oi = db.query(OrderItem).filter(
            OrderItem.order_id == id,
            OrderItem.crop_id == item_report.crop_id
        ).first()
        if oi:
            oi.delivered_kg = item_report.received_kg
            oi.rejected_kg = item_report.rejected_kg
            oi.reject_reason = item_report.reason

    db.commit()
    return {"message": "Delivery confirmed successfully", "order_id": order.id, "status": order.status}


@router.post("/calls/masked")
def api_masked_call(
    order_id: Optional[uuid.UUID] = None,
    trip_id: Optional[uuid.UUID] = None,
    target: str = "driver",
    current_user: User = Depends(get_current_user)
):
    # Masked call bridge placeholder connecting user to target without revealing real phone numbers
    return {
        "status": "INITIATED",
        "bridge_number": "+918040001122",
        "message": "Connecting call via KrishiLink privacy bridge..."
    }
