import uuid
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.stock import HubStockStatus, HubStockStatusHistory, StockLedger
from app.models.hub import Hub
from app.models.crop import Crop
from app.models.enums import StockStatus, LedgerReason
from app.core.exceptions import NotFoundException


def get_hub_physical_stock(db: Session, hub_id: uuid.UUID, crop_id: uuid.UUID) -> float:
    """
    Calculates the actual physical stock kg of a crop at a hub
    from the immutable stock_ledger.
    """
    result = db.query(func.coalesce(func.sum(StockLedger.delta_kg), 0.0)).filter(
        StockLedger.hub_id == hub_id,
        StockLedger.crop_id == crop_id
    ).scalar()
    return float(result)


def update_hub_stock_status(
    db: Session,
    hub_id: uuid.UUID,
    crop_id: uuid.UUID,
    status: StockStatus,
    set_by_user_id: Optional[uuid.UUID] = None,
    source: str = "manual"
) -> HubStockStatus:
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise NotFoundException("Hub", hub_id)
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise NotFoundException("Crop", crop_id)

    record = db.query(HubStockStatus).filter(
        HubStockStatus.hub_id == hub_id,
        HubStockStatus.crop_id == crop_id
    ).first()

    old_status = record.status if record else None

    if not record:
        record = HubStockStatus(
            hub_id=hub_id,
            crop_id=crop_id,
            status=status,
            set_by=set_by_user_id
        )
        db.add(record)
    else:
        record.status = status
        record.set_by = set_by_user_id

    # Record history audit
    history = HubStockStatusHistory(
        hub_id=hub_id,
        crop_id=crop_id,
        old_status=old_status,
        new_status=status,
        source=source,
        set_by=set_by_user_id
    )
    db.add(history)
    db.commit()
    db.refresh(record)
    return record


def record_ledger_transaction(
    db: Session,
    hub_id: uuid.UUID,
    crop_id: uuid.UUID,
    delta_kg: float,
    reason: LedgerReason,
    created_by: Optional[uuid.UUID] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[uuid.UUID] = None
) -> StockLedger:
    ledger_entry = StockLedger(
        hub_id=hub_id,
        crop_id=crop_id,
        delta_kg=delta_kg,
        reason=reason,
        ref_type=ref_type,
        ref_id=ref_id,
        created_by=created_by
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)
    return ledger_entry


def get_stock_matrix_data(db: Session) -> Dict:
    crops = db.query(Crop).filter(Crop.active == True).order_by(Crop.name_en).all()
    hubs = db.query(Hub).filter(Hub.active == True).order_by(Hub.name).all()

    # Pre-fetch existing stock statuses
    status_records = db.query(HubStockStatus).all()
    status_map = {(s.hub_id, s.crop_id): s for s in status_records}

    hub_rows = []
    for h in hubs:
        cells = []
        for c in crops:
            s_rec = status_map.get((h.id, c.id))
            status = s_rec.status if s_rec else StockStatus.OUT
            suggested = s_rec.suggested if s_rec else None
            set_by_name = str(s_rec.set_by) if s_rec and s_rec.set_by else None
            set_at = s_rec.set_at if s_rec else None

            cells.append({
                "crop_id": c.id,
                "crop_name": c.name_en,
                "status": status,
                "suggested": suggested,
                "set_by": set_by_name,
                "set_at": set_at
            })
        hub_rows.append({
            "id": h.id,
            "name": h.name,
            "type": h.type,
            "cells": cells
        })

    return {
        "crops": [{"id": c.id, "name": c.name_en, "name_kn": c.name_kn} for c in crops],
        "hubs": hub_rows
    }
