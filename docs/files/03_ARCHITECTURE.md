# 03 — System Architecture

---

## 1. Goals and constraints

| Goal | Implication |
|---|---|
| Works for low-literacy farmers on cheap phones and weak networks | PWA, small bundles, offline queue, Kannada, SMS/WhatsApp fallback |
| Admin must see everything live | Realtime pipeline (WebSockets + Redis) |
| Small student team, small budget | Monolith-first backend, managed services, open-source maps/routing |
| ML must plug in cleanly | Separate ML service with batch outputs written to tables |
| Scale later to more hubs/districts | Hub-centric data model, stateless API, queue-based jobs |

## 2. High-level architecture

```
 ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
 │ Buyer PWA  │ │ Farmer PWA │ │ Driver PWA │ │ Admin Web  │      (one Next.js app, 4 role areas)
 └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
       └──────────────┴───────┬──────┴──────────────┘
                              │ HTTPS / WSS
                      ┌───────▼────────┐
                      │ Reverse proxy  │  (Nginx/Caddy/ALB, TLS, rate limit)
                      └───────┬────────┘
        ┌─────────────────────┼───────────────────────────┐
        │                     │                           │
 ┌──────▼───────┐     ┌───────▼────────┐         ┌────────▼────────┐
 │ Core API     │     │ Realtime GW    │         │ ML Service      │
 │ FastAPI      │     │ WebSocket      │         │ FastAPI         │
 │ (auth, orders│     │ (tracking,     │         │ (price, demand, │
 │ trips, hubs, │     │ stock events,  │         │ procurement)    │
 │ payments)    │     │ alerts)        │         └────────┬────────┘
 └──────┬───────┘     └───────┬────────┘                  │
        │                     │                           │
        │              ┌──────▼──────┐             ┌──────▼───────┐
        │              │   Redis     │◄────────────┤ Celery beat/ │
        │              │ pub/sub,    │             │ workers      │
        │              │ geo, cache  │             │ (jobs)       │
        │              └─────────────┘             └──────┬───────┘
        │                                                 │
 ┌──────▼──────────────────────────────┐   ┌──────────────▼──────────────┐
 │ PostgreSQL + PostGIS (+ TimescaleDB │   │ Routing Service             │
 │ optional for pings)                 │   │ OR-Tools + OSRM             │
 └──────┬──────────────────────────────┘   └─────────────────────────────┘
        │
 ┌──────▼───────┐   External: Maps tiles, OTP/SMS/WhatsApp, Masked calling,
 │ Object store │   Payments (Razorpay/Cashfree), FCM, Open-Meteo, Agmarknet,
 │ (S3/MinIO)   │   Sentry
 └──────────────┘
```

## 3. Components

### 3.1 Frontend (`apps/web`)
- Next.js App Router PWA; role route groups `(buyer)`, `(farmer)`, `(driver)`, `(admin)`.
- Details in `08_FRONTEND.md`.

### 3.2 Core API (`services/api`)
- **FastAPI** + SQLAlchemy 2 + Alembic migrations + Pydantic v2.
- Modules (each with `router.py`, `service.py`, `models.py`, `schemas.py`):
  `auth, users, farmers, buyers, drivers, vehicles, hubs, crops, listings, orders, stock, transfers, dispatch, trips, tracking, pricing, payments, notifications, reports, admin`.
- Monolith first; modules are clean boundaries for future splitting.
- OpenAPI spec auto-generated → TypeScript types for frontend.

### 3.3 Realtime gateway
- Same FastAPI app (WebSocket routes) initially; separate process when load grows.
- Driver pings → API → Redis (`GEOADD`, last-known location per vehicle, pub/sub channel per trip) → WS fan-out to subscribers.
- Persist pings to DB in batches (every few seconds) for history/ML.

### 3.4 ML service (`services/ml`)
- Batch jobs: ingest data → features → train → forecast → write `price_forecasts`, `demand_forecasts`.
- Online endpoints: `/ml/price-range`, `/ml/demand`, `/ml/procurement`, `/ml/transfer-suggestions`.
- MLflow for experiments/registry. See `06_ML_PLAN.md`.

### 3.5 Routing service (`services/routing`)
- Wraps OR-Tools; talks to OSRM for distance/time matrices.
- Input: stops, vehicles, constraints. Output: ordered routes, ETAs. See `07_ROUTING_AND_OPTIMIZATION.md`.

### 3.6 Background jobs (Celery)
| Job | Schedule |
|---|---|
| Ingest Agmarknet + weather | Daily early morning |
| Generate price/demand forecasts | Daily ~15:00 |
| Cutoff processors (listings, orders) | 18:00 / 20:00 |
| Route suggestion generation | On demand + 21:00 |
| Stock status suggestion refresh | Every 15 min |
| Settlement calculation | Daily after close |
| Payout dispatch/retries | Daily morning |
| Reminders (credit due, no-ack) | Hourly |

## 4. Technology choices and alternatives

| Concern | Pick | Alternatives | Why |
|---|---|---|---|
| Frontend | Next.js + TS | Vite/React, Flutter Web | SSR/PWA ecosystem, single app for roles |
| Backend | FastAPI | Django REST, NestJS | Python shared with ML, async, OpenAPI |
| DB | PostgreSQL + PostGIS | MySQL, MongoDB | Relational + geo queries are core |
| Time-series pings | Postgres partitions (or TimescaleDB) | InfluxDB | Keep stack small |
| Cache/realtime | Redis | NATS, Kafka | Simple and sufficient |
| Jobs | Celery + Redis | RQ, Dramatiq, Airflow | Familiar; Airflow later for ML pipelines |
| Maps | MapLibre + OSM tiles (self/hosted provider) | Google Maps, Mapbox | Cost control; abstraction allows swap |
| Routing | OR-Tools + OSRM | Google Routes, GraphHopper, VROOM | Free, strong VRP solver |
| Auth | OTP + JWT | Firebase Auth, Auth0 | Phone-first users |
| Calling | Exotel/Knowlarity/Twilio masked calling | Direct `tel:` | Privacy + "live number that works" |
| Payments | Razorpay/Cashfree | PayU, Stripe (limited in India) | UPI, payouts |
| Push | FCM (+ SMS/WhatsApp) | OneSignal | Reach on Android |
| Storage | S3 (or MinIO) | Cloudinary | Photos, invoices |
| Observability | Sentry + Prometheus/Grafana | Datadog | Free tiers |

## 5. Realtime tracking design

1. Driver app collects GPS (every 5–10 s moving, 30 s idle) with accuracy/speed/heading.
2. Batch send `POST /driver/location` (array) or WS message; offline → IndexedDB queue.
3. API validates (driver ↔ active trip), updates Redis:
   - `vehicle:{id}:loc` (hash/JSON) + `GEOADD vehicles:live`.
   - Publishes to `trip:{id}` channel.
4. WS gateway forwards to subscribed clients (buyer/farmer see only their own trip; admin sees all).
5. Worker writes pings to `location_pings` in batches.
6. **ETA**: initial from routing; updated by OSRM duration from current position to next stop × correction factor (ML later); pushed with each update (throttled to every ~15 s).
7. **Geofences**: arrival (150 m of stop) triggers `ARRIVED_SUGGESTED`; hub geofence for "returned".
8. **Privacy**: buyers/farmers only see the vehicle when trip is active; location history is not exposed.

## 6. Masked calling
- User taps Call → `POST /calls/masked {trip_id, target}` → provider creates a bridge between caller and callee using virtual number.
- Fallback: `tel:` link to a support/admin number if provider fails.
- Log call metadata (not audio) for disputes.

## 7. Offline-first strategy
- Driver app: IndexedDB queue for receipts, status transitions, pings; idempotency keys (`client_event_id`) so retries are safe.
- Farmer app: draft listing offline, sync later; SMS-based fallback ("TOMATO 200") handled by backend webhook (optional).
- Server accepts **late events** with client timestamps; uses server time for ordering conflicts.

## 8. Security and privacy

| Area | Measures |
|---|---|
| AuthN | OTP login, short-lived access token + refresh token, device binding optional |
| AuthZ | RBAC (buyer, farmer, driver, hub_staff, admin, super_admin) + row-level checks (own orders/trips) |
| Transport | HTTPS/WSS only, HSTS |
| API protection | Rate limits per IP/phone (OTP abuse), request validation, CORS allowlist |
| Data protection | Encrypt secrets (env/secret manager), DB encryption at rest, backups with restore tests |
| PII | Minimise; mask phone numbers in UI where not needed; access logs for admin views |
| Payments | Tokenised via provider; never store card/bank secrets; verify webhooks by signature |
| Audit | `audit_log` for sensitive actions (assign driver, price override, payout, status override) |
| Compliance | DPDP basics: consent at signup, purpose limitation, deletion request flow |
| Abuse | Idempotency keys on mutating calls, anomaly alerts (weight variance, repeated cancellations) |

## 9. Deployment

### Environments
`local (docker-compose)` → `staging` → `production`.

### Minimal prototype infra
- 1 VM (or small container service): API + ML + Celery + Redis + Postgres/PostGIS via Docker Compose, or managed Postgres.
- Object storage bucket.
- Domain + TLS (Caddy/Nginx or cloud LB).
- Region: **ap-south-1 (Mumbai)** or similar for latency.

### Docker Compose services
`web`, `api`, `worker`, `beat`, `ml`, `routing`, `osrm`, `postgres`, `redis`, `minio` (optional), `nginx`.

### CI/CD (GitHub Actions)
- On PR: lint (ruff, eslint), type-check (mypy, tsc), tests (pytest, vitest), build.
- On merge to `develop`: deploy staging; on tag: deploy production.
- DB migrations via Alembic in release step; rollback plan.

### Backups & DR
- Daily DB snapshot + WAL; weekly restore test.
- Object storage versioning.

## 10. Observability
- Structured JSON logs with request IDs.
- Sentry for frontend/backend errors.
- Metrics: request latency, WS connections, ping rate, job durations, queue depth, forecast freshness.
- Business dashboards (Metabase/Grafana) over read replica: kg/day, on-time %, wastage, margin.
- Alerts: no pings from active trip > 3 min, job failures, payment failures, DB disk.

## 11. Scalability path

| Stage | Pattern |
|---|---|
| Pilot (≤ 50 farmers, ≤ 20 buyers, ≤ 10 vehicles) | Single VM, monolith |
| Growth (hundreds of farmers, 50+ vehicles) | Managed Postgres, separate WS gateway, autoscaled API, Redis managed |
| Multi-district | Region-aware hubs, tenant-ish partitioning by hub/region, dedicated routing workers, data warehouse for ML |

Design habits that make scaling easy now: stateless API, idempotent jobs, hub-centric foreign keys, config in DB, event log for important changes.

## 12. Event model (internal)

Emit domain events to a table (`events`) and Redis pub/sub for subscribers:

`listing.created`, `order.placed`, `order.confirmed`, `trip.assigned`, `trip.started`, `stop.arrived`, `receipt.recorded`, `hub.stock_status_changed`, `transfer.requested`, `delivery.completed`, `payment.settled`, `forecast.published`.

Consumers: notifications, analytics, ML feature builder, audit.

## 13. Third-party integration notes

| Integration | Notes |
|---|---|
| Agmarknet / data.gov.in | API key, rate limits, data gaps; cache raw responses |
| Open-Meteo | No key for basic usage; check terms |
| OTP/SMS | DLT registration is required for SMS in India; plan lead time |
| WhatsApp Business | Template approval needed |
| Masked calling | KYC, number procurement lead time |
| Payments | Business KYC and onboarding lead time; payouts need extra activation |
| Maps | Tile usage limits; check licensing before heavy use |

> Several of these have **onboarding lead times (weeks)**. Start applications early, in parallel with development.
