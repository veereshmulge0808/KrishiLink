import pytest
from app.models.enums import StockStatus, LedgerReason
from app.schemas.hub import HubStockStatusUpdate, StockAdjustmentCreate
from app.routers.hubs import (
    api_list_hubs, api_update_stock_button,
    api_get_hub_stock_status, api_get_stock_matrix,
    api_hub_weigh_in, api_stock_adjust
)
from app.services.stock_service import get_hub_physical_stock


def test_hubs_stock_matrix_and_buttons(db_session, seed_data):
    admin_user = seed_data["admin_user"]
    main_hub = seed_data["main_hub"]
    tomato = seed_data["tomato"]

    # 1. List hubs
    hubs = api_list_hubs(db=db_session)
    assert hubs["total"] >= 2

    # 2. Update stock button for Tomato at Main Hub to LOW
    updated_btn = api_update_stock_button(
        id=main_hub.id,
        crop_id=tomato.id,
        data=HubStockStatusUpdate(status=StockStatus.LOW),
        current_user=admin_user,
        db=db_session
    )
    assert updated_btn.status == StockStatus.LOW

    # 3. View hub stock status
    status_resp = api_get_hub_stock_status(id=main_hub.id, db=db_session)
    tomato_status = next(s for s in status_resp["items"] if s["crop_id"] == tomato.id)
    assert tomato_status["status"] == StockStatus.LOW

    # 4. View stock matrix
    matrix = api_get_stock_matrix(current_user=admin_user, db=db_session)
    assert len(matrix["hubs"]) >= 2
    assert len(matrix["crops"]) >= 2

    # 5. Record hub weigh-in receipt (driver brought 200 kg, hub weighed 198 kg -> physical stock increased)
    weigh_resp = api_hub_weigh_in(
        id=main_hub.id,
        crop_id=tomato.id,
        kg_hub=198.0,
        kg_driver=200.0,
        grade_a_kg=180.0,
        grade_b_kg=18.0,
        current_user=admin_user,
        db=db_session
    )
    assert weigh_resp["variance_pct"] == -1.0
    assert get_hub_physical_stock(db_session, main_hub.id, tomato.id) == 198.0

    # 6. Record stock adjustment (wastage 8 kg)
    adjust_resp = api_stock_adjust(
        id=main_hub.id,
        data=StockAdjustmentCreate(
            crop_id=tomato.id,
            delta_kg=-8.0,
            reason=LedgerReason.WASTAGE,
            notes="Spoilage"
        ),
        current_user=admin_user,
        db=db_session
    )
    assert adjust_resp["new_physical_stock_kg"] == 190.0
