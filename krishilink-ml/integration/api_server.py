"""Lightweight local FastAPI server exposing KrishiLink ML predictions to the Vite frontend."""

from __future__ import annotations

from datetime import date, timedelta
import json
from typing import Any, Dict, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from integration.ml_client import MLClient
from ml.run import run_daily
from ml.step5_publish import PUBLISHED_DIR

from pydantic import BaseModel, Field
from ml.step4b_eta_model import predict_eta, ARTIFACT_PATH as ETA_ARTIFACT_PATH, PUBLISHED_PROFILE_PATH as ETA_PROFILE_PATH
import joblib, json

from routing.vrptw_solver import solve_vrptw

app = FastAPI(title="KrishiLink Local ML API", version="0.1.0")

# Allow local Vite dev server (default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MLClient()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/pricing/bands")
def get_pricing_bands(
    delivery_date: Optional[date] = Query(default=None, alias="date"),
    hub_id: Optional[str] = Query(default="hub_blr_main"),
) -> Dict[str, Any]:
    target = delivery_date or (date.today() + timedelta(days=1))
    return client.get_price_bands(target, hub_id=hub_id)


@app.get("/api/v1/demand/dashboard")
def get_demand_dashboard(
    delivery_date: Optional[date] = Query(default=None, alias="date"),
    hub_id: Optional[str] = Query(default=None),
) -> Dict[str, Any]:
    target = delivery_date or (date.today() + timedelta(days=1))
    data = client.get_demand_dashboard(target, hub_id=hub_id)

    # Attach latest model metrics (coverage & WAPE) for the KPI cards
    metrics = {}
    summary_path = PUBLISHED_DIR / "latest" / "run_summary.json"
    if summary_path.exists():
        with summary_path.open("r", encoding="utf-8") as f:
            metrics = json.load(f)
    data["summary"] = metrics
    return data


@app.post("/api/v1/ml/refresh")
def trigger_daily_refresh(
    delivery_date: Optional[date] = Query(default=None, alias="date"),
) -> Dict[str, Any]:
    """On-demand trigger to run the daily 6 PM inference pipeline locally."""
    target = delivery_date or (date.today() + timedelta(days=1))
    return run_daily(delivery_date=target)

class ETARequest(BaseModel):
    osrm_base_minutes: float = Field(..., gt=0)
    distance_km: float = Field(..., gt=0)
    zone_id: str = "bengaluru_central"
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(1, ge=0, le=6)
    route_kind: str = "delivery"
    rainfall_mm: float = Field(0.0, ge=0)


class ETAMatrixRequest(BaseModel):
    legs: list[ETARequest]


_ETA_ARTIFACT_CACHE = None


def _get_eta_artifact():
    global _ETA_ARTIFACT_CACHE
    if _ETA_ARTIFACT_CACHE is None and ETA_ARTIFACT_PATH.exists():
        _ETA_ARTIFACT_CACHE = joblib.load(ETA_ARTIFACT_PATH)
    return _ETA_ARTIFACT_CACHE


@app.post("/api/v1/ml/eta/predict")
def api_predict_eta(req: ETARequest):
    """Single-leg ETA prediction for live Buyer/Farmer tracking."""
    artifact = _get_eta_artifact()
    if artifact is None:
        return {"error": "ETA model not trained yet. Run: python -m ml.step4b_eta_model"}
    return predict_eta(
        osrm_base_minutes=req.osrm_base_minutes,
        distance_km=req.distance_km,
        zone_id=req.zone_id,
        hour=req.hour,
        day_of_week=req.day_of_week,
        route_kind=req.route_kind,
        rainfall_mm=req.rainfall_mm,
        artifact=artifact,
    )


@app.post("/api/v1/ml/eta/matrix")
def api_predict_eta_matrix(req: ETAMatrixRequest):
    """Batch ETA predictions for OR-Tools VRPTW routing matrices."""
    artifact = _get_eta_artifact()
    if artifact is None:
        return {"error": "ETA model not trained yet."}
    results = [
        predict_eta(
            osrm_base_minutes=leg.osrm_base_minutes,
            distance_km=leg.distance_km,
            zone_id=leg.zone_id,
            hour=leg.hour,
            day_of_week=leg.day_of_week,
            route_kind=leg.route_kind,
            rainfall_mm=leg.rainfall_mm,
            artifact=artifact,
        )
        for leg in req.legs
    ]
    return {"count": len(results), "legs": results}


@app.get("/api/v1/ml/eta/profile")
def api_eta_profile():
    """Published Bengaluru zone x hour traffic multipliers (dry vs rain)."""
    if not ETA_PROFILE_PATH.exists():
        return {"error": "ETA profile not found."}
    return json.loads(ETA_PROFILE_PATH.read_text())

class LocationNode(BaseModel):
    id: str
    name: str | None = None
    lat: float
    lon: float


class RouteStopInput(LocationNode):
    demand_kg: float = Field(..., ge=0)
    window_start: str = "07:00"
    window_end: str = "09:00"
    service_minutes: int = 10


class VehicleInput(BaseModel):
    id: str
    capacity_kg: float = Field(1000.0, gt=0)


class OptimizeRouteRequest(BaseModel):
    hub: LocationNode
    stops: list[RouteStopInput]
    vehicles: list[VehicleInput]
    route_kind: str = "delivery"
    departure_time: str = "06:30"
    zone_id: str = "bengaluru_central"
    day_of_week: int = Field(2, ge=0, le=6)
    rainfall_mm: float = Field(0.0, ge=0)
    use_p90_buffer: bool = True


@app.post("/api/v1/routing/optimize")
def api_optimize_routes(req: OptimizeRouteRequest):
    """Solve VRPTW using OSRM road distances + live ML ETA model + Google OR-Tools."""
    return solve_vrptw(
        hub=req.hub.model_dump(),
        stops=[s.model_dump() for s in req.stops],
        vehicles=[v.model_dump() for v in req.vehicles],
        route_kind=req.route_kind,
        departure_time=req.departure_time,
        zone_id=req.zone_id,
        day_of_week=req.day_of_week,
        rainfall_mm=req.rainfall_mm,
        use_p90_buffer=req.use_p90_buffer,
    )