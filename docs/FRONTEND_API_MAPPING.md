# KrishiLink — Frontend-to-Backend API Contract Matrix

This contract maps every screen, component, and interaction in the four KrishiLink Next.js PWA dashboards (`Buyer`, `Farmer`, `Driver`, `Admin`) to their corresponding FastAPI backend endpoints.

---

## 1. Global Conventions

- **Base URL**: `/api/v1`
- **Authentication**: `Authorization: Bearer <JWT>`
- **Errors**: Standard envelope:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable explanation",
      "details": {}
    }
  }
  ```
- **Monetary Values**: All money amounts exchanged over API are **integers in paise** (₹ 1.00 = 100 paise).
- **Weights**: All quantities are **decimal/float in kg**.
- **Pagination**: `?page=1&page_size=25` → `{ "items": [...], "page": 1, "page_size": 25, "total": 100 }`

---

## 2. Authentication & User Profile (All Dashboards)

| Screen / UI Component | Action / Event | HTTP Method | API Path | Request Body | Response Payload | Allowed Roles |
|---|---|---|---|---|---|---|
| `(auth)/login` (Phone Entry) | Submit Phone Number | `POST` | `/api/v1/auth/otp/request` | `{"phone": "+919876543210"}` | `{"request_id": "req_...", "message": "OTP sent"}` | Public |
| `(auth)/verify` (OTP Verification) | Submit 6-digit OTP | `POST` | `/api/v1/auth/otp/verify` | `{"request_id": "req_...", "otp": "123456"}` | `{"access_token": "...", "refresh_token": "...", "user": {...}}` | Public |
| Auth Refresh | Automatic token refresh | `POST` | `/api/v1/auth/refresh` | `{"refresh_token": "..."}` | `{"access_token": "...", "refresh_token": "..."}` | All authenticated |
| App Shell / Navigation | Load Current User Profile & Role | `GET` | `/api/v1/me` | None | `{"id": "...", "phone": "...", "role": "buyer", "name": "...", "profile": {...}}` | All authenticated |
| User Settings | Update name / language preference | `PUT` | `/api/v1/me` | `{"name": "Ramesh", "language": "kn"}` | User object | All authenticated |

---

## 3. Buyer Dashboard (`/buyer/*`)

| Screen / Interaction | Description | HTTP Method | API Path | Parameters / Body | Notes |
|---|---|---|---|---|---|
| `/buyer` (Catalog Home) | Search & filter crops | `GET` | `/api/v1/crops` | `?query=tom&category=fruit_veg&is_organic=false` | Returns crop items with today's locked/forecast price range and `availability` status (`SUFFICIENT`, `LOW`, `OUT`) |
| `/buyer/crop/[id]` | Crop detail modal/page | `GET` | `/api/v1/crops/{id}` | Path: `id` | Includes minimum order kg (`min_order_kg`), shelf life, perishability score |
| `/buyer` (Prices Banner) | View today's published price bands | `GET` | `/api/v1/prices/today` | None | Range (low, high, reference) per crop |
| `/buyer/checkout` | Place next-day bulk order | `POST` | `/api/v1/orders` | `{"delivery_date": "2026-11-20", "delivery_hub_id": "...", "slot_start": "07:00", "slot_end": "08:00", "payment_mode": "PREPAID", "items": [{"crop_id": "...", "qty_kg": 50}]}` | Idempotent via `Idempotency-Key` header; locks unit price; verifies capacity and min order |
| `/buyer/orders` | View past and active orders | `GET` | `/api/v1/orders` | `?status=CONFIRMED&page=1` | Filter by status |
| `/buyer/orders/[id]` | Detailed order summary | `GET` | `/api/v1/orders/{id}` | Path: `id` | Shows ordered vs confirmed vs delivered kg |
| `/buyer/orders/[id]` (Cancel) | Cancel order before cutoff | `POST` | `/api/v1/orders/{id}/cancel` | Path: `id` | Enforces D-1 20:00 cutoff |
| `/buyer/orders/[id]` (Tracking) | Live delivery tracking | `GET` | `/api/v1/orders/{id}/tracking` | Path: `id` | Driver name, vehicle reg no, current lat/lng, ETA minutes, polyline |
| `/buyer/orders/[id]` (Delivery) | Confirm delivery & report issues | `POST` | `/api/v1/orders/{id}/confirm-delivery` | `{"otp": "...", "items": [{"crop_id": "...", "received_kg": 48.0, "rejected_kg": 2.0, "reason": "wilted", "photo_url": "..."}]}` | Updates order items, records rejections for audit |
| `CallButton` Component | Masked call to assigned driver | `POST` | `/api/v1/calls/masked` | `{"order_id": "...", "target": "driver"}` | Initiates virtual bridge without exposing real phone numbers |
| Live Tracking WebSocket | Real-time vehicle location updates | `WS` | `/api/v1/ws?channel=trip:{trip_id}` | WS Subscribe | Pushes `{type: "location", lat, lng, speed, eta}` |

---

## 4. Farmer Dashboard (`/farmer/*`)

| Screen / Interaction | Description | HTTP Method | API Path | Parameters / Body | Notes |
|---|---|---|---|---|---|
| `/farmer` (Onboarding/Profile) | Complete farmer registration | `PUT` | `/api/v1/farmers/me` | `{"village": "Kolar Old", "taluk": "Kolar", "district": "Kolar", "lat": 13.136, "lng": 78.129, "land_acres": 2.5, "default_min_kg": 25.0, "upi_id": "farmer@upi"}` | Links nearest village hub |
| `/farmer/threshold` | View threshold configuration | `GET` | `/api/v1/farmers/me/threshold` | None | Default threshold + per-crop overrides |
| `/farmer/threshold` | Update threshold settings | `PUT` | `/api/v1/farmers/me/threshold` | `{"default_min_kg": 30.0, "per_crop": [{"crop_id": "...", "min_kg": 50.0}]}` | Prevents uneconomical first-mile dispatch |
| `/farmer` ("What I have today") | Submit harvest listing | `POST` | `/api/v1/farmers/me/listings` | `{"crop_id": "...", "est_kg": 150.0, "ready_by": "2026-11-20T05:30:00Z", "listing_date": "2026-11-20"}` | Checks threshold. If `< min_kg`, returns `INELIGIBLE` (`THRESHOLD_NOT_MET`). If `>= min_kg`, returns `ELIGIBLE`. |
| `/farmer` (Today's Listings) | View submitted harvest listings | `GET` | `/api/v1/farmers/me/listings` | `?date=2026-11-20` | Returns today's listings, eligibility status, assigned driver if scheduled |
| `/farmer` (Edit Listing) | Modify quantity before cutoff | `PUT` | `/api/v1/farmers/me/listings/{id}` | `{"est_kg": 180.0, "ready_by": "..."}` | Allowed only before D-1 18:00 cutoff |
| `/farmer` (Cancel Listing) | Withdraw harvest declaration | `DELETE` | `/api/v1/farmers/me/listings/{id}` | Path: `id` | Allowed only before cutoff |
| `/farmer/pickup` | Driver approach & ETA map | `GET` | `/api/v1/farmers/me/pickup` | None | Active trip, vehicle location, ETA, driver contact |
| `/farmer/payments` | Payout history & settlements | `GET` | `/api/v1/farmers/me/payments` | None | Accepted kg, realised price, net payout after commission & logistics |
| `CallButton` Component | Masked call to assigned driver | `POST` | `/api/v1/calls/masked` | `{"trip_id": "...", "target": "driver"}` | Privacy-preserving phone bridge |

---

## 5. Driver Dashboard (`/driver/*`)

| Screen / Interaction | Description | HTTP Method | API Path | Parameters / Body | Notes |
|---|---|---|---|---|---|
| `/driver` (Trip List) | View today's assigned trips | `GET` | `/api/v1/driver/me/trips` | `?date=today` | Returns `FIRST_MILE`, `MIDDLE_MILE`, `LAST_MILE`, `TRANSFER` trips |
| `/driver/trip/[id]` | Full route map & manifest | `GET` | `/api/v1/driver/me/trips/{id}` | Path: `id` | Sequence of stops, farmer/buyer locations, planned route polyline |
| `/driver/trip/[id]` (Acknowledge) | Confirm receipt of dispatch | `POST` | `/api/v1/trips/{id}/acknowledge` | None | Sets trip status `ACKNOWLEDGED` |
| `/driver/trip/[id]` (Start) | Depart for first stop | `POST` | `/api/v1/trips/{id}/start` | None | Sets trip status `STARTED` |
| `/driver/trip/[id]/stop/[sid]` | Mark arrival at farm/hub | `POST` | `/api/v1/trips/{id}/stops/{sid}/arrive` | `{"lat": 13.14, "lng": 78.13, "client_event_id": "..."}` | 150m geofence validation |
| `/driver/trip/[id]/stop/[sid]` (Receipt) | Record pickup weights | `POST` | `/api/v1/trips/{id}/stops/{sid}/receipt` | `{"client_event_id": "...", "lines": [{"crop_id": "...", "kg_received": 120.0, "grade": "A", "photo_url": "..."}], "farmer_confirmed": true}` | Offline idempotent receipt. Updates stop to `COMPLETED`. |
| `/driver/trip/[id]/stop/[sid]` (Deliver) | Record delivery confirmation | `POST` | `/api/v1/trips/{id}/stops/{sid}/deliver` | `{"client_event_id": "...", "buyer_confirmed": true}` | Delivers bulk items to buyer |
| `/driver/trip/[id]/stop/[sid]` (Skip) | Mark no-show / unavailable | `POST` | `/api/v1/trips/{id}/stops/{sid}/skip` | `{"reason": "FARMER_UNAVAILABLE"}` | Dwell time & call check |
| `/driver/trip/[id]` (Hub Arrival) | Arrived at main/village hub | `POST` | `/api/v1/trips/{id}/reached-hub` | None | Triggers hub weigh-in stage |
| `/driver/trip/[id]` (Return) | Return to home base / depot | `POST` | `/api/v1/trips/{id}/return` | None | Trip status `RETURNED` |
| `/driver/trip/[id]` (Incident) | Report breakdown/delay | `POST` | `/api/v1/trips/{id}/incident` | `{"type": "BREAKDOWN", "notes": "Flat tire on NH75"}` | Alerts admin control tower |
| Background GPS Ping Queue | Batch upload location pings | `POST` | `/api/v1/driver/location` | `{"trip_id": "...", "pings": [{"ts": "...", "lat": 13.1, "lng": 78.1, "speed_kmh": 35.0, "heading": 90, "accuracy_m": 8.0}]}` | Batched 5-10s interval; processed asynchronously via Redis |

---

## 6. Admin Control Tower Dashboard (`/admin/*`)

| Screen / UI Component | Action / Event | HTTP Method | API Path | Parameters / Body | Notes |
|---|---|---|---|---|---|
| `/admin` (Control Tower) | Overall operational metrics | `GET` | `/api/v1/admin/overview` | `?date=today` | Active orders, total kg collected, active trips, alerts |
| `/admin` (KPI Reports) | Daily KPIs & margins | `GET` | `/api/v1/admin/reports/daily` | `?date=2026-11-20` | On-time delivery %, wastage %, fill rate, contribution/kg |
| `/admin` (Live Map) | Global fleet snapshot | `GET` | `/api/v1/admin/map/live` | None | All vehicles, current coords, hubs, active trips |
| `/admin/hubs` | Hubs list & capacity | `GET` | `/api/v1/hubs` | None | Village, city, and main hub network details |
| `/admin/hubs` (Stock Matrix) | Three-state stock grid (hubs × crops) | `GET` | `/api/v1/hubs/stock-matrix` | None | Matrix of `OUT`, `LOW`, `SUFFICIENT` with system suggestion chips |
| `/admin/hubs/[id]` (Stock Status) | Set 3-state stock button | `PUT` | `/api/v1/hubs/{id}/stock-status/{crop_id}` | `{"status": "LOW"}` | Records user audit; broadcasts update |
| `/admin/hubs/[id]` (Weigh-In) | Record hub gross weigh-in | `POST` | `/api/v1/hubs/{id}/receipts` | `{"trip_id": "...", "crop_id": "...", "kg_hub": 450.0, "grade_a_kg": 400.0, "grade_b_kg": 50.0, "reject_kg": 0.0}` | Updates `stock_ledger` (`PICKUP`). Computes driver vs hub variance. |
| `/admin/hubs/[id]` (Adjustment) | Record wastage or audit delta | `POST` | `/api/v1/hubs/{id}/stock-adjust` | `{"crop_id": "...", "delta_kg": -15.0, "reason": "WASTAGE", "notes": "Spoilage"}` | Direct `stock_ledger` debit |
| `/admin/transfers` | View inter-hub transfer board | `GET` | `/api/v1/transfers` | `?status=REQUESTED` | Pipeline: `REQUESTED → APPROVED → ASSIGNED → IN_TRANSIT → RECEIVED` |
| `/admin/transfers` (Create) | Request inter-hub rebalancing | `POST` | `/api/v1/transfers` | `{"from_hub_id": "...", "to_hub_id": "...", "crop_id": "...", "requested_kg": 200.0}` | Move stock from donor (SUFFICIENT) to requester |
| `/admin/transfers` (Suggestions) | ML suggested transfers | `GET` | `/api/v1/transfers/suggestions` | None | Evaluates hub deficits and nearest surplus hubs |
| `/admin/transfers/[id]/approve` | Approve transfer request | `POST` | `/api/v1/transfers/{id}/approve` | None | Sets status to `APPROVED` |
| `/admin/transfers/[id]/assign` | Assign driver to transfer | `POST` | `/api/v1/transfers/{id}/assign` | `{"driver_id": "...", "vehicle_id": "...", "planned_start": "..."}` | Generates `TRANSFER` trip |
| `/admin/dispatch` (Pool) | Pending collection & delivery stops | `GET` | `/api/v1/admin/dispatch/pool` | `?date=2026-11-20` | Eligible farmer listings + confirmed buyer orders |
| `/admin/dispatch` (Optimize) | Request OR-Tools CVRPTW solver | `POST` | `/api/v1/admin/routes/optimize` | `{"date": "2026-11-20", "scope": "FIRST_MILE", "hub_id": "...", "vehicles": [{"vehicle_id": "...", "capacity_kg": 1000.0}]}` | Proposes optimized routes, polylines, ETAs |
| `/admin/dispatch` (Assign) | Confirm routes & create trips | `POST` | `/api/v1/admin/assign` | `{"routes": [{"vehicle_id": "...", "driver_id": "...", "stops": [...]}]}` | Atomic trip and stop generation; notifies drivers |
| `/admin/trips` | Trip monitoring table | `GET` | `/api/v1/admin/trips` | `?status=STARTED&date=2026-11-20` | Real-time status and ETA progress |
| `/admin/trips/[id]` | Full trip audit | `GET` | `/api/v1/admin/trips/{id}` | Path: `id` | Receipts, weigh-in variance, driver pings, incidents |
| `/admin/trips/[id]/reassign` | Reassign stops after breakdown | `POST` | `/api/v1/admin/trips/{id}/reassign` | `{"target_driver_id": "...", "stop_ids": [...]}` | Transfers remaining stops to backup vehicle |
| `/admin/pricing` (Forecast) | Review ML price forecasts | `GET` | `/api/v1/admin/pricing/forecast` | `?date=2026-11-20` | LightGBM quantile regression outputs (p10, p50, p90) |
| `/admin/pricing` (Publish) | Publish official price ranges | `POST` | `/api/v1/admin/pricing/publish` | `{"date": "2026-11-20", "items": [{"crop_id": "...", "low": 2200, "high": 3000, "reference": 2600}]}` | Publishes to farmers and buyers |
| `/admin/orders` | Order management | `GET` | `/api/v1/admin/orders` | `?date=2026-11-20&status=PLACED` | Shows allocation status |
| `/admin/orders/[id]/allocate` | Allocate stock or substitute | `POST` | `/api/v1/admin/orders/{id}/allocate` | `{"allocations": [{"crop_id": "...", "confirmed_kg": 40.0}]}` | Pro-rata or standing customer allocation |
| `/admin/settlements` | Review farmer payouts | `GET` | `/api/v1/admin/settlements` | `?date=2026-11-20` | Computed net payouts |
| `/admin/settlements/[id]/approve` | Approve daily settlement | `POST` | `/api/v1/admin/settlements/{id}/approve` | None | Validates ledger balance |
| `/admin/payouts/run` | Execute bank/UPI payouts | `POST` | `/api/v1/admin/payouts/run` | `{"settle_date": "2026-11-20"}` | Triggers payment rails |
| `/admin/settings` | Operational thresholds & cutoffs | `GET` / `PUT` | `/api/v1/admin/settings` | `{"listing_cutoff_time": "18:00", "order_cutoff_time": "20:00", "default_farmer_threshold_kg": 20.0, "variance_tolerance_pct": 2.0}` | Updates platform settings |
