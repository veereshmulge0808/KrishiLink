"""Standalone VRPTW routing engine: OSRM + live ML ETA model + Google OR-Tools."""

from __future__ import annotations

import math
from typing import Any

import joblib
import requests
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from ml.step4b_eta_model import ARTIFACT_PATH as ETA_ARTIFACT_PATH, predict_eta

OSRM_BASE_URL = "https://router.project-osrm.org"


def _hhmm_to_min(hhmm: str) -> int:
    h, m = hhmm.strip().split(":")
    return int(h) * 60 + int(m)


def _min_to_hhmm(minutes: int) -> str:
    minutes = max(0, int(round(minutes)))
    return f"{(minutes // 60) % 24:02d}:{minutes % 60:02d}"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a)) * 1.35  # 1.35x road-winding factor


def _get_osrm_matrices(coords: list[tuple[float, float]]) -> tuple[list[list[float]], list[list[float]], str]:
    """Return (distance_km_matrix, osrm_base_minutes_matrix, source_label)."""
    coord_str = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in coords)
    url = f"{OSRM_BASE_URL}/table/v1/driving/{coord_str}"
    try:
        resp = requests.get(url, params={"annotations": "duration,distance"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                dist_km = [[round((d or 0.0) / 1000.0, 2) for d in row] for row in data["distances"]]
                dur_min = [[round((t or 0.0) / 60.0, 2) for t in row] for row in data["durations"]]
                return dist_km, dur_min, "osrm_public"
    except Exception:
        pass

    # Automatic Haversine fallback if offline or rate-limited
    n = len(coords)
    dist_km = [[0.0] * n for _ in range(n)]
    dur_min = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                d = _haversine_km(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
                dist_km[i][j] = round(d, 2)
                dur_min[i][j] = round((d / 32.0) * 60.0, 2)
    return dist_km, dur_min, "haversine_fallback"


def _get_route_geometry(coords: list[tuple[float, float]]) -> list[list[float]]:
    """Fetch GeoJSON [lon, lat] road polyline from OSRM for map rendering."""
    if len(coords) < 2:
        return [[lon, lat] for lat, lon in coords]
    coord_str = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in coords)
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coord_str}"
    try:
        resp = requests.get(url, params={"overview": "full", "geometries": "geojson"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                return data["routes"][0]["geometry"]["coordinates"]
    except Exception:
        pass
    return [[lon, lat] for lat, lon in coords]


def solve_vrptw(
    hub: dict[str, Any],
    stops: list[dict[str, Any]],
    vehicles: list[dict[str, Any]],
    route_kind: str = "delivery",
    departure_time: str = "06:30",
    zone_id: str = "bengaluru_central",
    day_of_week: int = 2,
    rainfall_mm: float = 0.0,
    use_p90_buffer: bool = True,
) -> dict[str, Any]:
    """Solve multi-vehicle VRPTW with OSRM distances and ML ETA traffic adjustment."""
    if not stops or not vehicles:
        return {"status": "empty", "routes": [], "unassigned_stops": []}

    dep_min = _hhmm_to_min(departure_time)
    dep_hour = dep_min // 60

    # Node 0 = Hub depot; Nodes 1..N = Stops
    all_nodes = [hub] + stops
    coords = [(float(n["lat"]), float(n["lon"])) for n in all_nodes]
    dist_km_mat, osrm_min_mat, osrm_source = _get_osrm_matrices(coords)

    # Load live ETA artifact once
    eta_artifact = joblib.load(ETA_ARTIFACT_PATH) if ETA_ARTIFACT_PATH.exists() else None
    eta_method = eta_artifact["method"] if eta_artifact else "osrm_raw"

    # Build ML-adjusted travel-time matrix (integer minutes for OR-Tools)
    n = len(all_nodes)
    time_mat = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            base_m = max(1.0, osrm_min_mat[i][j])
            d_km = max(0.2, dist_km_mat[i][j])
            if eta_artifact is not None:
                pred = predict_eta(
                    osrm_base_minutes=base_m,
                    distance_km=d_km,
                    zone_id=zone_id,
                    hour=dep_hour,
                    day_of_week=day_of_week,
                    route_kind=route_kind,
                    rainfall_mm=rainfall_mm,
                    artifact=eta_artifact,
                )
                adj_m = pred["eta_p90_minutes"] if use_p90_buffer else pred["eta_minutes"]
            else:
                adj_m = base_m
            time_mat[i][j] = max(1, int(round(adj_m)))

    # Demands (kg) & service times (minutes)
    demands = [0] + [int(round(float(s.get("demand_kg", 0)))) for s in stops]
    service_times = [0] + [int(s.get("service_minutes", 10)) for s in stops]

    # Time windows relative to departure_time (minutes)
    # Depot window: 0 to 360 min (6 hours max shift)
    time_windows = [(0, 360)]
    for s in stops:
        w_start = max(0, _hhmm_to_min(s.get("window_start", departure_time)) - dep_min)
        w_end = max(w_start + 15, _hhmm_to_min(s.get("window_end", "10:00")) - dep_min)
        time_windows.append((w_start, w_end))

    vehicle_caps = [int(round(float(v.get("capacity_kg", 1000)))) for v in vehicles]

    # OR-Tools VRPTW setup
    manager = pywrapcp.RoutingIndexManager(n, len(vehicles), 0)
    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_mat[from_node][to_node] + service_times[from_node]

    transit_cb_idx = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb_idx)

    # Capacity constraint (kg)
    def demand_callback(from_index: int) -> int:
        return demands[manager.IndexToNode(from_index)]

    demand_cb_idx = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_cb_idx,
        0,
        vehicle_caps,
        True,
        "Capacity",
    )

    # Time Window constraint
    routing.AddDimension(
        transit_cb_idx,
        60,   # allow up to 60 min waiting if driver arrives early
        360,  # max 6-hour route duration
        False,
        "Time",
    )
    time_dim = routing.GetDimensionOrDie("Time")
    for node_idx, (start_t, end_t) in enumerate(time_windows):
        index = manager.NodeToIndex(node_idx)
        time_dim.CumulVar(index).SetRange(start_t, end_t)

    # Allow dropping stops with a high penalty instead of failing the entire run
    for node_idx in range(1, n):
        routing.AddDisjunction([manager.NodeToIndex(node_idx)], 100_000)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.seconds = 5

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return {
            "status": "infeasible",
            "osrm_source": osrm_source,
            "eta_method": eta_method,
            "routes": [],
            "unassigned_stops": [s["id"] for s in stops],
        }

    solved_routes = []
    assigned_node_ids = set()

    for v_idx, veh in enumerate(vehicles):
        index = routing.Start(v_idx)
        route_nodes = []
        total_km = 0.0
        total_kg = 0

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            next_index = solution.Value(routing.NextVar(index))
            next_node = manager.IndexToNode(next_index)

            if node != 0:
                assigned_node_ids.add(node)
                arr_min = dep_min + solution.Min(time_dim.CumulVar(index))
                stop_obj = stops[node - 1]
                total_kg += demands[node]
                route_nodes.append({
                    "sequence": len(route_nodes) + 1,
                    "stop_id": stop_obj["id"],
                    "name": stop_obj.get("name", stop_obj["id"]),
                    "lat": stop_obj["lat"],
                    "lon": stop_obj["lon"],
                    "demand_kg": demands[node],
                    "eta": _min_to_hhmm(arr_min),
                    "window": f"{stop_obj.get('window_start', departure_time)}–{stop_obj.get('window_end', '10:00')}",
                })

            total_km += dist_km_mat[node][next_node]
            index = next_index

        if route_nodes:
            end_min = dep_min + solution.Min(time_dim.CumulVar(index))
            seq_coords = [(float(hub["lat"]), float(hub["lon"]))] + [
                (float(rn["lat"]), float(rn["lon"])) for rn in route_nodes
            ] + [(float(hub["lat"]), float(hub["lon"]))]

            solved_routes.append({
                "vehicle_id": veh["id"],
                "capacity_kg": vehicle_caps[v_idx],
                "total_load_kg": total_kg,
                "utilization_pct": round((total_kg / max(1, vehicle_caps[v_idx])) * 100, 1),
                "planned_km": round(total_km, 2),
                "planned_minutes": end_min - dep_min,
                "departure_time": departure_time,
                "return_time": _min_to_hhmm(end_min),
                "stops": route_nodes,
                "geometry": _get_route_geometry(seq_coords),
            })

    unassigned = [stops[i - 1]["id"] for i in range(1, n) if i not in assigned_node_ids]

    return {
        "status": "optimal" if not unassigned else "partial",
        "route_kind": route_kind,
        "hub_id": hub.get("id", "bengaluru_main"),
        "osrm_source": osrm_source,
        "eta_method": eta_method,
        "use_p90_buffer": use_p90_buffer,
        "vehicles_used": len(solved_routes),
        "unassigned_stops": unassigned,
        "routes": solved_routes,
    }