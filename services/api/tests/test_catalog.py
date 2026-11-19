import pytest
from app.routers.catalog import list_crops, get_crop_detail, get_today_prices
from app.core.exceptions import NotFoundException


def test_crops_catalog_and_price_bands(db_session, seed_data):
    # 1. List crops
    crops_result = list_crops(query=None, category=None, organic=None, db=db_session)
    assert crops_result["total"] >= 2
    slugs = [c["slug"] for c in crops_result["items"]]
    assert "tomato" in slugs
    assert "onion" in slugs

    # Tomato published price check
    tomato_item = next(c for c in crops_result["items"] if c["slug"] == "tomato")
    assert tomato_item["price"]["low"] == 2200  # paise
    assert tomato_item["price"]["high"] == 3000
    assert tomato_item["price"]["reference"] == 2600

    # 2. Search query filter
    query_result = list_crops(query="onion", category=None, organic=None, db=db_session)
    assert query_result["total"] == 1
    assert query_result["items"][0]["slug"] == "onion"

    # 3. Crop detail
    tomato = seed_data["tomato"]
    detail = get_crop_detail(id=tomato.id, db=db_session)
    assert detail.slug == "tomato"
    assert float(detail.min_order_kg) == 10.0


def test_today_prices_endpoint(db_session, seed_data):
    prices = get_today_prices(db=db_session)
    assert len(prices["items"]) >= 1
    assert prices["items"][0]["reference"] == 2600
