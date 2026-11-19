import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.crop import Crop
from app.models.pricing import PublishedPrice
from app.models.enums import StockStatus
from app.schemas.crop import CropResponse, CropCatalogItem, CropPriceRange
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="", tags=["Catalog & Prices"])


@router.get("/crops", response_model=dict)
def list_crops(
    query: Optional[str] = Query(None, description="Search term for crop name"),
    category: Optional[str] = Query(None, description="leafy, root, fruit_veg, fruit"),
    organic: Optional[bool] = Query(None, description="Filter organic vs regular"),
    db: Session = Depends(get_db)
):
    q = db.query(Crop).filter(Crop.active == True)
    if query:
        pattern = f"%{query}%"
        q = q.filter(or_(Crop.name_en.ilike(pattern), Crop.name_kn.ilike(pattern), Crop.slug.ilike(pattern)))
    if category:
        q = q.filter(Crop.category == category)
    if organic is not None:
        q = q.filter(Crop.is_organic == organic)

    crops = q.order_by(Crop.name_en).all()

    # Pre-fetch today's published prices
    today = date.today()
    prices = db.query(PublishedPrice).filter(PublishedPrice.date == today).all()
    price_map = {p.crop_id: p for p in prices}

    items = []
    for c in crops:
        p = price_map.get(c.id)
        if p:
            price_info = {
                "low": int(p.low * 100),
                "high": int(p.high * 100),
                "reference": int(p.reference * 100),
                "currency": "INR_PAISE_PER_KG",
                "date": str(today)
            }
        else:
            # Baseline price band if no model forecast published today
            price_info = {
                "low": 2000,
                "high": 3000,
                "reference": 2500,
                "currency": "INR_PAISE_PER_KG",
                "date": str(today)
            }

        items.append({
            "id": c.id,
            "slug": c.slug,
            "name_en": c.name_en,
            "name_kn": c.name_kn,
            "category": c.category,
            "is_organic": c.is_organic,
            "unit": c.unit,
            "shelf_life_hours": c.shelf_life_hours,
            "perishability": c.perishability,
            "min_order_kg": float(c.min_order_kg),
            "default_min_kg": float(c.default_min_kg),
            "icon_url": c.icon_url,
            "active": c.active,
            "price": price_info,
            "availability": StockStatus.SUFFICIENT.value
        })

    return {"items": items, "total": len(items)}


@router.get("/crops/{id}", response_model=CropResponse)
def get_crop_detail(id: uuid.UUID, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise NotFoundException("Crop", id)
    return crop


@router.get("/prices/today", response_model=dict)
def get_today_prices(db: Session = Depends(get_db)):
    today = date.today()
    prices = db.query(PublishedPrice).filter(PublishedPrice.date == today).all()
    return {
        "date": str(today),
        "items": [
            {
                "crop_id": p.crop_id,
                "low": int(p.low * 100),
                "high": int(p.high * 100),
                "reference": int(p.reference * 100),
                "currency": "INR_PAISE_PER_KG",
                "overridden": p.overridden
            }
            for p in prices
        ]
    }
