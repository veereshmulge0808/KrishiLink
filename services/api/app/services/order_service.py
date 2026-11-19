import uuid
from datetime import date, datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.order import Order, OrderItem
from app.models.user import Buyer
from app.models.crop import Crop
from app.models.hub import Hub
from app.models.pricing import PublishedPrice
from app.models.stock import StockLedger
from app.models.enums import OrderStatus, PaymentMode, LedgerReason
from app.schemas.order import OrderCreate
from app.services.stock_service import get_hub_physical_stock
from app.core.exceptions import NotFoundException, OutOfStockException, CutoffPassedException, KrishiLinkException


def get_locked_price_paise(db: Session, crop_id: uuid.UUID, target_date: date) -> int:
    """
    Returns locked price in paise (integer) for an item.
    Rules: min(forecast p90, hub reference price). If published price exists, use reference.
    Fallback: baseline 2500 paise (₹25.00/kg).
    """
    published = db.query(PublishedPrice).filter(
        PublishedPrice.crop_id == crop_id,
        PublishedPrice.date == target_date
    ).first()

    if published and published.reference > 0:
        return int(round(published.reference * 100))
    return 2500  # Default ₹25.00/kg in paise


def create_buyer_order(
    db: Session,
    buyer_id: uuid.UUID,
    data: OrderCreate,
    idempotency_key: Optional[str] = None
) -> Order:
    # 1. Idempotency check
    if idempotency_key:
        existing = db.query(Order).filter(Order.idempotency_key == idempotency_key).first()
        if existing:
            return existing

    buyer = db.query(Buyer).filter(Buyer.user_id == buyer_id).first()
    if not buyer:
        raise NotFoundException("Buyer profile", buyer_id)

    delivery_hub_id = data.delivery_hub_id or buyer.delivery_hub_id
    if delivery_hub_id:
        hub = db.query(Hub).filter(Hub.id == delivery_hub_id).first()
        if not hub:
            raise NotFoundException("Delivery Hub", delivery_hub_id)

    today = date.today()
    is_same_day = data.delivery_date == today

    # 2. Cutoff validation for next-day orders
    if data.delivery_date > today:
        now_utc = datetime.now(timezone.utc)
        # Order cutoff is D-1 20:00 IST (UTC 14:30)
        cutoff_dt = datetime(
            data.delivery_date.year, data.delivery_date.month, data.delivery_date.day,
            14, 30, tzinfo=timezone.utc
        ) - timedelta(days=1)
        if now_utc > cutoff_dt:
            raise CutoffPassedException(
                cutoff_time=f"D-1 {settings.ORDER_CUTOFF_HOUR_IST}:00 IST",
                action="placing next-day orders"
            )

    order_id = uuid.uuid4()
    total_qty = 0.0
    subtotal_paise = 0
    order_items: List[OrderItem] = []

    # 3. Item processing & atomic physical stock verification
    for item_data in data.items:
        crop = db.query(Crop).filter(Crop.id == item_data.crop_id, Crop.active == True).first()
        if not crop:
            raise NotFoundException("Crop", item_data.crop_id)

        if item_data.qty_kg < crop.min_order_kg:
            raise KrishiLinkException(
                status_code=400,
                code="MIN_ORDER_QTY_NOT_MET",
                message=f"Minimum order for {crop.name_en} is {crop.min_order_kg} kg (requested: {item_data.qty_kg} kg)",
                details={"crop": crop.name_en, "min_order_kg": crop.min_order_kg}
            )

        # For same-day orders, verify actual physical stock in the serving hub
        if is_same_day:
            if not delivery_hub_id:
                raise KrishiLinkException(
                    status_code=400,
                    code="HUB_REQUIRED",
                    message="Delivery hub must be specified for same-day delivery stock checks"
                )
            physical_stock = get_hub_physical_stock(db, delivery_hub_id, crop.id)
            if physical_stock < item_data.qty_kg:
                raise OutOfStockException(
                    crop_name=crop.name_en,
                    available_kg=physical_stock,
                    requested_kg=item_data.qty_kg
                )

        price_locked = get_locked_price_paise(db, crop.id, data.delivery_date)
        item_subtotal = int(round(price_locked * item_data.qty_kg))
        subtotal_paise += item_subtotal
        total_qty += item_data.qty_kg

        order_item = OrderItem(
            order_id=order_id,
            crop_id=crop.id,
            qty_kg=item_data.qty_kg,
            confirmed_kg=item_data.qty_kg,
            price_per_kg_locked=price_locked
        )
        order_items.append(order_item)

    # Delivery fee calculation (e.g. ₹1.5/kg in paise -> 150 paise/kg)
    delivery_fee_paise = int(round(total_qty * 150))
    total_paise = subtotal_paise + delivery_fee_paise

    initial_status = OrderStatus.CONFIRMED if is_same_day else OrderStatus.PLACED

    order = Order(
        id=order_id,
        buyer_id=buyer_id,
        delivery_hub_id=delivery_hub_id,
        delivery_date=data.delivery_date,
        slot_start=data.slot_start,
        slot_end=data.slot_end,
        status=initial_status,
        subtotal=subtotal_paise,
        delivery_fee=delivery_fee_paise,
        total=total_paise,
        payment_mode=data.payment_mode,
        idempotency_key=idempotency_key
    )

    db.add(order)
    for oi in order_items:
        db.add(oi)

    # For same-day orders, immediately record the stock deduction in the ledger
    if is_same_day and delivery_hub_id:
        for item_data in data.items:
            ledger_entry = StockLedger(
                hub_id=delivery_hub_id,
                crop_id=item_data.crop_id,
                delta_kg=-item_data.qty_kg,
                reason=LedgerReason.SALE,
                ref_type="order",
                ref_id=order_id
            )
            db.add(ledger_entry)

    db.commit()
    db.refresh(order)
    return order
