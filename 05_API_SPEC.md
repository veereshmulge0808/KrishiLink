# 05 — API Specification (REST + WebSocket)

Base URL: `/api/v1`. JSON everywhere. Auth: `Authorization: Bearer <JWT>` (or httpOnly cookie for web). Times in ISO-8601 UTC. Money in **paise** (integers). Weights in **kg** (decimal).

---

## 1. Conventions

### Error format
```json
{ "error": { "code": "THRESHOLD_NOT_MET", "message": "Quantity below minimum for pickup", "details": {"min_kg": 20} } }
```
Common codes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `CUTOFF_PASSED`, `THRESHOLD_NOT_MET`, `OUT_OF_STOCK`, `INVALID_STATE`, `RATE_LIMITED`.

### Pagination
`?page=1&page_size=25` → `{ "items": [...], "page": 1, "page_size": 25, "total": 134 }`

### Idempotency
Mutating requests from offline-capable clients include `client_event_id` (UUID) or header `Idempotency-Key`. Replays return the original result.

### Roles
`buyer`, `farmer`, `driver`, `hub_staff`, `admin`. Each endpoint lists allowed roles.

---

## 2. Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/otp/request` | `{ "phone": "+919876543210" }` | Rate limited; returns `{ "request_id": "..." }` |
| POST | `/auth/otp/verify` | `{ "request_id": "...", "otp": "123456" }` | Returns tokens + user |
| POST | `/auth/refresh` | `{ "refresh_token": "..." }` | |
| POST | `/auth/logout` | | |
| GET | `/me` | | Current user + role profile |

```json
// POST /auth/otp/verify → 200
{ "access_token": "…", "refresh_token": "…",
  "user": { "id": "u1", "role": "farmer", "name": "Ramesh", "language": "kn", "needs_onboarding": false } }
```

## 3. Catalog and prices (buyer, farmer, admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/crops?query=tom&category=fruit_veg&organic=false` | Search; includes today's price range |
| GET | `/crops/{id}` | Detail + `min_order_kg` |
| GET | `/prices/today` | Published ranges per crop |

```json
// GET /crops?query=tomato
{ "items": [ { "id":"c1","name_en":"Tomato","name_kn":"ಟೊಮೆಟೊ","category":"fruit_veg","unit":"kg",
  "min_order_kg":10,"price":{"low":2200,"high":3000,"currency":"INR_PAISE_PER_KG","date":"2026-11-20"},
  "availability":"SUFFICIENT" } ] }
```
`availability` is derived from the delivery hub's stock status (buyers see in-stock/limited/out-of-stock, not kg).

## 4. Farmer endpoints (role: farmer)

| Method | Path | Body / Notes |
|---|---|---|
| PUT | `/farmers/me/threshold` | `{ "default_min_kg": 30, "per_crop": [{"crop_id":"c1","min_kg":50}] }` |
| GET | `/farmers/me/listings?date=` | |
| POST | `/farmers/me/listings` | `{ "crop_id":"c1","est_kg":200,"ready_by":"2026-11-20T05:30:00Z","listing_date":"2026-11-20" }` |
| PUT | `/farmers/me/listings/{id}` | Edit until cutoff |
| DELETE | `/farmers/me/listings/{id}` | Cancel |
| GET | `/farmers/me/pickup` | Current assigned pickup + driver + ETA |
| GET | `/farmers/me/payments` | History |

```json
// POST /farmers/me/listings → 201
{ "id":"l1","status":"ELIGIBLE","min_kg_applied":30,"message_kn":"…","cutoff_at":"2026-11-19T12:30:00Z" }
// if below threshold → 200 with status "INELIGIBLE" and reason "THRESHOLD_NOT_MET"
```

## 5. Buyer endpoints (role: buyer)

| Method | Path | Notes |
|---|---|---|
| POST | `/orders` | Create order |
| GET | `/orders?status=` | List |
| GET | `/orders/{id}` | Detail |
| POST | `/orders/{id}/cancel` | Before cutoff |
| GET | `/orders/{id}/tracking` | Snapshot: driver, vehicle, location, ETA, status |
| POST | `/orders/{id}/confirm-delivery` | `{ "otp":"…", "items":[{"crop_id":"c1","received_kg":48,"rejected_kg":2,"reason":"wilted","photo_url":"…"}] }` |
| POST | `/calls/masked` | `{ "order_id":"o1","target":"driver" }` |

```json
// POST /orders
{ "delivery_date":"2026-11-20","slot":"07:00-08:00","payment_mode":"PREPAID",
  "items":[{"crop_id":"c1","qty_kg":50},{"crop_id":"c2","qty_kg":25}] }
// 201
{ "id":"o1","status":"CONFIRMED","items":[
   {"crop_id":"c1","qty_kg":50,"confirmed_kg":50,"price_per_kg_locked":2800},
   {"crop_id":"c2","qty_kg":25,"confirmed_kg":15,"note":"PARTIAL","substitute_suggestions":["c7"]}],
  "total": 183000 }
```

```json
// GET /orders/o1/tracking
{ "status":"OUT_FOR_DELIVERY",
  "driver":{"name":"Suresh","vehicle_no":"KA01AB1234"},
  "vehicle":{"lat":12.9131,"lng":77.6101,"heading":90,"updated_at":"2026-11-20T07:42:10Z"},
  "destination":{"lat":12.9116,"lng":77.6389},
  "eta_minutes":14,"route_polyline":"<encoded>" }
```

## 6. Driver endpoints (role: driver)

| Method | Path | Notes |
|---|---|---|
| GET | `/driver/me/trips?date=today` | Assigned trips |
| GET | `/driver/me/trips/{id}` | Stops, route polyline, manifest |
| POST | `/trips/{id}/acknowledge` | Optional |
| POST | `/trips/{id}/start` | |
| POST | `/trips/{id}/stops/{sid}/arrive` | `{ "lat":..,"lng":.. , "client_event_id":".." }` |
| POST | `/trips/{id}/stops/{sid}/receipt` | Pickup: lines of crop + kg |
| POST | `/trips/{id}/stops/{sid}/deliver` | Delivery confirmation |
| POST | `/trips/{id}/stops/{sid}/skip` | `{ "reason":"FARMER_UNAVAILABLE" }` |
| POST | `/trips/{id}/reached-hub` | |
| POST | `/trips/{id}/return` | |
| POST | `/trips/{id}/incident` | `{ "type":"BREAKDOWN","notes":"…" }` |
| POST | `/driver/location` | Batched pings |

```json
// POST /trips/t1/stops/s2/receipt
{ "client_event_id":"7d9…",
  "lines":[ {"crop_id":"c1","kg_received":120.5,"grade":"A"},
            {"crop_id":"c3","kg_received":40,"grade":"B","photo_url":"…"} ],
  "farmer_confirmation":{"method":"TAP"} }
// 201
{ "stop_status":"COMPLETED","receipts":[{"id":"r1"},{"id":"r2"}],"next_stop_id":"s3" }
```

```json
// POST /driver/location
{ "trip_id":"t1","pings":[
  {"ts":"2026-11-20T04:12:05Z","lat":13.1010,"lng":77.5900,"speed_kmh":32,"heading":170,"accuracy_m":8},
  {"ts":"2026-11-20T04:12:15Z","lat":13.0998,"lng":77.5905,"speed_kmh":30,"heading":171,"accuracy_m":9} ] }
// 202 { "accepted": 2 }
```

## 7. Hub endpoints (role: hub_staff, admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/hubs` | All hubs + summary |
| GET | `/hubs/{id}` | Detail |
| GET | `/hubs/{id}/stock-status` | Three-state per crop (+ suggestion) |
| PUT | `/hubs/{id}/stock-status/{crop_id}` | `{ "status":"LOW" }` (hub_staff for own hub; admin any) |
| GET | `/hubs/stock-matrix` | Admin: hubs × crops matrix |
| POST | `/hubs/{id}/receipts` | Hub weigh-in: kg per crop/grade for a trip |
| POST | `/hubs/{id}/stock-adjust` | Wastage/adjustment (admin/hub staff) |

```json
// GET /hubs/stock-matrix
{ "crops":[{"id":"c1","name":"Tomato"},{"id":"c2","name":"Onion"}],
  "hubs":[ {"id":"h1","name":"Main Hub","cells":[
      {"crop_id":"c1","status":"SUFFICIENT","suggested":"SUFFICIENT","set_by":"Anita","set_at":"…"},
      {"crop_id":"c2","status":"LOW","suggested":"OUT","set_by":"Anita","set_at":"…"} ]} ] }
```

## 8. Transfers (admin, hub_staff)

| Method | Path | Notes |
|---|---|---|
| GET | `/transfers?status=` | |
| POST | `/transfers` | `{ "to_hub_id":"h2","from_hub_id":"h1","crop_id":"c2","requested_kg":300 }` |
| GET | `/transfers/suggestions` | System-generated candidates (donor ranking, ETA, cost) |
| POST | `/transfers/{id}/approve` | admin |
| POST | `/transfers/{id}/assign` | `{ "driver_id":"d1","vehicle_id":"v1","planned_start":"…" }` → creates TRANSFER trip |
| POST | `/transfers/{id}/receive` | `{ "received_kg": 290 }` |
| POST | `/transfers/{id}/reject` | donor refuses with reason |

## 9. Dispatch and trips (admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dispatch/pool?date=` | Eligible pickups + deliveries/transfers needing assignment |
| POST | `/admin/routes/optimize` | Suggest routes (see below) |
| POST | `/admin/assign` | Create trip(s) from plan |
| PUT | `/admin/trips/{id}` | Reorder stops, change driver/vehicle |
| POST | `/admin/trips/{id}/reassign` | Reassign remaining stops after incident |
| GET | `/admin/trips?status=&date=` | Monitoring list |
| GET | `/admin/trips/{id}` | Full detail: stops, receipts, variance, pings |
| GET | `/admin/map/live` | Vehicles, hubs, active stops snapshot |
| GET | `/admin/drivers/available?date=` | Free drivers + vehicle capacity |

```json
// POST /admin/routes/optimize
{ "date":"2026-11-20","scope":"FIRST_MILE","hub_id":"h_kolar",
  "vehicles":[{"vehicle_id":"v1","capacity_kg":1000,"shift_start":"03:30","shift_end":"07:00"}],
  "constraints":{"min_payload_kg":150,"max_stops":8} }
// 200
{ "routes":[ { "vehicle_id":"v1","total_kg":820,"distance_km":46.2,"duration_min":118,
    "stops":[{"seq":1,"farmer_id":"f12","kg":300,"eta":"03:50"},{"seq":2,"farmer_id":"f7","kg":280,"eta":"04:15"},
             {"seq":3,"farmer_id":"f3","kg":240,"eta":"04:40"},{"seq":4,"hub_id":"h_kolar","eta":"05:30"}],
    "polyline":"<encoded>" } ],
  "unassigned":[{"farmer_id":"f9","reason":"BELOW_MIN_PAYLOAD"}] }

// POST /admin/assign  (after edits)
{ "routes":[ { "vehicle_id":"v1","driver_id":"d4","stops":[…] } ] }
// 201 { "trips":[{"id":"t1","status":"ASSIGNED"}] }
```

## 10. Admin: orders, pricing, people, money

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/orders?date=&status=` | |
| POST | `/admin/orders/{id}/allocate` | Manual allocation/substitution |
| GET | `/admin/pricing/forecast?date=` | ML p10/p50/p90 per crop |
| POST | `/admin/pricing/publish` | `{ "date":"…","items":[{"crop_id":"c1","low":2200,"high":3000,"override_reason":null}] }` |
| GET | `/admin/forecasts/demand?date=&hub_id=` | Demand + suggested procurement |
| CRUD | `/admin/farmers`, `/admin/buyers`, `/admin/drivers`, `/admin/vehicles`, `/admin/hubs`, `/admin/crops` | |
| GET | `/admin/settlements?date=` | Farmer settlements |
| POST | `/admin/settlements/{id}/approve` | |
| POST | `/admin/payouts/run` | Trigger payouts |
| GET | `/admin/reports/daily?date=` | KPIs |
| GET/PUT | `/admin/settings` | Cutoffs, thresholds, tolerances |

## 11. ML endpoints (internal + admin-facing)

| Method | Path | Notes |
|---|---|---|
| GET | `/ml/price-range?crop=&date=&market=` | p10/p50/p90 + confidence |
| GET | `/ml/demand?hub=&crop=&date=` | q10/q50/q90 |
| GET | `/ml/procurement?hub=&date=` | Suggested kg per crop |
| GET | `/ml/stock-suggestion?hub=` | Suggested OUT/LOW/SUFFICIENT per crop |
| GET | `/ml/transfer-suggestions` | Ranked donor→receiver moves |
| POST | `/ml/llm/parse-listing` | Kannada/English text → structured listing (requires confirmation) |
| GET | `/ml/llm/daily-brief?date=` | Admin summary from model outputs |

## 12. WebSocket

Connect: `wss://…/ws?token=<JWT>`; then subscribe.

```json
// client → server
{ "action":"subscribe","channel":"trip:t1" }
{ "action":"subscribe","channel":"admin:live" }
{ "action":"subscribe","channel":"driver:d4" }
```

| Channel | Allowed | Events |
|---|---|---|
| `trip:{id}` | buyer/farmer on that trip, admin | `location`, `eta`, `status` |
| `admin:live` | admin, hub_staff (scoped) | `vehicle_location`, `trip_status`, `stock_status`, `transfer`, `alert` |
| `driver:{id}` | that driver | `assignment`, `trip_update`, `message` |
| `hub:{id}` | hub staff, admin | `stock_status`, `incoming_trip`, `transfer` |

```json
// server → client examples
{ "channel":"trip:t1","type":"location","data":{"lat":12.91,"lng":77.61,"heading":90,"speed_kmh":28,"ts":"…"} }
{ "channel":"trip:t1","type":"eta","data":{"minutes":14,"next_stop_id":"s5"} }
{ "channel":"admin:live","type":"stock_status","data":{"hub_id":"h2","crop_id":"c1","old":"SUFFICIENT","new":"LOW","by":"Anita"} }
{ "channel":"driver:d4","type":"assignment","data":{"trip_id":"t9","type":"FIRST_MILE","start":"03:30"} }
```
Heartbeat every 25 s (`ping`/`pong`); client auto-reconnects with backoff and re-subscribes.

## 13. Webhooks (incoming)

| Path | Source | Verification |
|---|---|---|
| `/webhooks/payments` | Razorpay/Cashfree | Signature header |
| `/webhooks/calls` | Masking provider | Shared secret |
| `/webhooks/sms-inbound` | SMS provider | Token |
| `/webhooks/whatsapp` | WhatsApp BSP | Signature |

## 14. Versioning and docs
- Prefix `/api/v1`; breaking changes → `/v2`.
- OpenAPI served at `/docs` (Swagger) and `/openapi.json`; frontend generates types from it.
