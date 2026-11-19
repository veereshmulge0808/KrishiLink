# 07 — Routing & Optimization

Covers: how vehicles are routed, how stops are clustered, how hubs are placed, how re-planning works, and how we measure it.

---

## 1. Problem types in this project

| # | Problem | Shape | Method |
|---|---|---|---|
| A | **First mile**: farms → village hub | Many pickups, one depot, capacity, time windows | CVRPTW (collection only) |
| B | **Middle mile**: village hubs → main hub | Few stops, big vehicles | Small VRP / manual with check |
| C | **Last mile**: main/city hub → buyers | Many deliveries, time slots, capacity | CVRPTW (delivery only) |
| D | **Inter-hub transfers** | Point-to-point, urgent | Assignment + shortest path |
| E | **Hub placement** | Where to put village/city hubs | p-median / k-means + capacity |
| F | **Re-optimisation** | Breakdown, no-show, new urgent order | Incremental re-solve |

All three of A, B, C feed the same routing service.

## 2. Inputs

| Input | Source |
|---|---|
| Stops (lat/lng, kg, service time, time window) | `farmer_listings`, `orders`, `transfer_requests` |
| Depots (hub locations) | `hubs` |
| Vehicles (capacity, shift, start/end hub, cost/km) | `vehicles`, `drivers` |
| Travel time/distance matrix | OSRM (OpenStreetMap, Karnataka extract) |
| Constraints | `settings` (min payload, max stops, max route duration) |
| Time-of-day multipliers | learned from GPS later |

## 3. Distance matrix
- Self-host **OSRM** with Karnataka (or South India) OSM extract; `table` service gives N×N durations/distances.
- Fallbacks: Google Distance Matrix / Mapbox Matrix API (paid), haversine × road factor (1.3) if routing is down.
- Cache matrix per day (stops change little); symmetric assumption is **not** safe in cities, use directed matrix.
- Service time per stop: 8–12 min farm (weigh + handover), 10–15 min buyer (unload + OTP).

## 4. Algorithm pipeline (daily, first mile)

```
1. Select ELIGIBLE listings for date D (threshold passed, cutoff closed)
2. Group by farmer location (one stop per farmer; sum kg across crops)
3. Assign to nearest village hub (depot) — or let optimiser choose among hubs
4. Cluster (optional pre-step): DBSCAN/k-means inside each hub catchment to limit problem size
5. Build time/distance matrix (OSRM)
6. Solve CVRPTW with OR-Tools: minimise distance/time + vehicle fixed cost + dropped-stop penalty
7. Post-process: enforce min payload, merge tiny routes, compute ETAs, polylines
8. Present to admin (map + table). Admin edits → "Assign" creates trips
9. Log plan vs actual for learning
```

### Objective
```
minimise  Σ (distance_km × cost_per_km) + Σ (vehicle_used × fixed_cost) + Σ (dropped_kg × drop_penalty)
subject to: capacity, time windows (farmer ready_from..ready_by), route duration ≤ shift, stops ≤ max_stops
```
Make dropping a stop **possible but expensive**, so the solver doesn't fail when capacity is short; unassigned stops are reported to the admin.

### Minimum payload / threshold logic
- Farmer-level threshold: eligibility filter (step 1).
- Route-level minimum payload: after solving, if route load < `min_payload_kg`, try merging with a neighbouring route; if impossible, flag "uneconomical" for admin decision (run anyway / postpone / ask farmer to drop at hub).

## 5. OR-Tools sketch (collection routes, capacity + time windows)

```python
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def solve_first_mile(time_matrix, demands, vehicle_caps, time_windows, service_times,
                     depot=0, max_route_min=240, drop_penalty=100000):
    n = len(time_matrix); m = len(vehicle_caps)
    manager = pywrapcp.RoutingIndexManager(n, m, depot)
    routing = pywrapcp.RoutingModel(manager)

    # Travel + service time
    def time_cb(i, j):
        a, b = manager.IndexToNode(i), manager.IndexToNode(j)
        return int(time_matrix[a][b] + service_times[a])
    t_idx = routing.RegisterTransitCallback(time_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(t_idx)

    # Capacity (kg collected accumulates)
    def dem_cb(i): return int(demands[manager.IndexToNode(i)])
    d_idx = routing.RegisterUnaryTransitCallback(dem_cb)
    routing.AddDimensionWithVehicleCapacity(d_idx, 0, [int(c) for c in vehicle_caps], True, "Load")

    # Time windows
    routing.AddDimension(t_idx, 30, max_route_min, False, "Time")   # 30 min slack
    time_dim = routing.GetDimensionOrDie("Time")
    for node, (lo, hi) in enumerate(time_windows):
        if node == depot: continue
        time_dim.CumulVar(manager.NodeToIndex(node)).SetRange(lo, hi)

    # Allow dropping stops with a penalty
    for node in range(1, n):
        routing.AddDisjunction([manager.NodeToIndex(node)], drop_penalty)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.seconds = 20
    solution = routing.SolveWithParameters(params)
    return manager, routing, solution
```
Notes:
- Units must be **integers** (minutes, kg).
- For **last mile** use the same model with deliveries as negative/loaded-at-start demands (vehicle starts loaded, `fix_start_cumul_to_zero=False` variant) and buyer slot windows.
- For multiple depots, give each vehicle its own start/end index.
- Use `GUIDED_LOCAL_SEARCH` with a short time limit (10–30 s) for interactive use.

## 6. Mixed-crop and quality constraints
- Capacity is weight-based at first. Add **volume** (crates) as a second dimension when relevant.
- Perishability: put perishable pickups earlier; enforce max "time in vehicle" for leafy greens (e.g., ≤ 3 h) via a time-in-vehicle dimension or soft penalty.
- Do not mix certain crops (strong smell, organic vs inorganic): separate compartments/crates or separate trips for **organic** produce.

## 7. Middle mile (village hub → main hub)
- Usually 1–2 vehicles per village hub; schedule by cutoffs (collect by 06:00, depart 06:15, arrive ≤ 07:30).
- Can combine multiple village hubs on one truck route if lanes align (Kolar + Chikkaballapur along NH).
- Validate vehicle capacity against hub totals; if over capacity, split or add a vehicle.

## 8. Last mile
- Group orders by delivery hub (city mini hub) and time slot.
- Respect buyer **slot windows** and per-stop service time.
- Order stops to reduce lateness: weighted penalty for slot violation (soft windows).
- Show ETA to buyers; recompute as the driver progresses.

## 9. Inter-hub transfers (problem D)
```
for each requesting hub (LOW/OUT crop):
    candidates = hubs with SUFFICIENT status (and ledger kg > needed + safety)
    score = shortage_penalty_avoided − (distance_cost + freshness_loss + donor_risk)
    choose best donor(s), split across donors if needed
→ create transfer request → admin approves → assign nearest available vehicle
```
- Prefer piggybacking on routes already scheduled (empty return legs, middle-mile trucks).
- Use `scipy.optimize.linprog`/PuLP when multiple hubs and crops compete for limited vehicles.

## 10. Hub placement (problem E)

**Data:** farmer locations (weighted by expected kg), buyer locations (weighted by order volume), candidate sites.

**Approach**
1. Run **weighted k-means** (k = 2…8) on farmer coordinates → candidate village hub centres.
2. Snap centres to **real candidate sites** (existing sheds, godowns, FPO centres).
3. Solve **p-median** (minimise Σ weight × road_distance) or **capacitated facility location** with OR-Tools/PuLP using OSRM distances.
4. Evaluate: average first-mile km/kg, farthest farmer distance, hub utilisation, cost.
5. Repeat for city hubs using buyer coordinates; for the main hub, test candidates against both flows.

**Decision metrics:** cost/kg, % farmers within 10 km of a hub, % buyers within 45 min of a hub, rent/availability.

## 11. Re-optimisation (problem F)

| Trigger | Action |
|---|---|
| Vehicle breakdown | Freeze completed stops; re-solve remaining stops with available vehicles; admin confirms |
| Farmer cancels/no-show | Remove stop; re-solve tail of route; if load below min payload, consider merge |
| New urgent order | Insert stop at cheapest feasible position (cheapest insertion) |
| Big delay | Re-solve with updated travel times; notify affected buyers |
| Driver unavailable | Reassign trip to next driver; update notifications |

Implementation: keep a **fixed prefix** (visited stops) and optimise the **remaining suffix** (OR-Tools with start at current location and `SetFixedCostOfVehicle`/vehicle start index = current position node).

## 12. ETA computation
1. Base ETA = OSRM duration from current position to next stop.
2. Corrected ETA = base × `eta_correction(hour, dow, weather, road class)` (ML model later, see `06_ML_PLAN.md`).
3. Add remaining service time for current stop.
4. Throttle updates; show ranges ("12–16 min") to avoid jitter.

## 13. Map presentation
- Draw planned route polyline (OSRM geometry), actual breadcrumb trail (pings), vehicle marker with heading.
- Highlight **farmer pickup** and **buyer destination** stops big (as in the notebook), hubs as larger icons.
- Admin map layers: vehicles, farmers (eligible/ineligible), hubs (colour by stock summary), buyers, alerts.

## 14. Evaluation metrics

| Metric | Why |
|---|---|
| Total km, km/kg, km per stop | Cost efficiency |
| Vehicle utilisation (% capacity) | Fleet sizing |
| On-time pickup/delivery % | Service quality |
| Route duration vs plan (error min) | Planner accuracy |
| Dropped/unassigned stops | Capacity gaps |
| Replan count/day | Stability |
| Cost per kg moved | Business health |
| Admin edit rate (changes to suggested routes) | Trust in optimiser |

**Benchmarks:** compare against (a) manual routing by admin, (b) nearest-neighbour baseline, (c) previous day's plan.

## 15. Testing the router
- **Synthetic generator**: random farmers around Kolar/Doddaballapur with weights; verify constraints are satisfied.
- Unit tests: capacity never exceeded, time windows respected, all stops assigned or listed unassigned.
- **Replay tests**: replay a day with real pings, compare predicted vs actual durations.
- Property tests: adding a vehicle never worsens total cost; removing a stop never increases cost.

## 16. Implementation steps
1. Docker OSRM with Karnataka extract; test `table` + `route` endpoints.
2. `services/routing`: FastAPI endpoint `/optimize` (JSON in/out), wraps OR-Tools.
3. Integrate with core API `/admin/routes/optimize`.
4. Admin UI: map preview, drag reorder → re-evaluate times locally (`/routing/evaluate`).
5. Add re-optimisation endpoint using current vehicle positions.
6. Collect plan-vs-actual data → feed ETA model.
