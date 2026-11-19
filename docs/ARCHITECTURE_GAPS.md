# KrishiLink — Architecture Gaps & Specification Audit

This document compares the current repository state against `04_DATABASE_SCHEMA.md`, `05_API_SPEC.md`, and the architectural directives of the KrishiLink platform. It highlights legacy discrepancies from the predecessor AgriFlow model, identifies conflicting field assumptions, schema relationships, authentication boundaries, and logs unresolved business decisions.

---

## 1. Repository Audit Summary

### 1.1 Initial Workspace State
Prior to this implementation:
- The repository contained only the documentation set in `docs/` (`01_BUSINESS_PLAN.md` through `10_ROADMAP_TEAM.md` and `README.md`).
- No backend code, models, migrations, or tests had been established.
- The frontend specification (`08_FRONTEND.md`) exists in the documentation set targeting a Next.js App Router PWA with 4 role-based dashboards (`(buyer)`, `(farmer)`, `(driver)`, `(admin)`).

---

## 2. AgriFlow Legacy vs. KrishiLink Architecture

The previous AgriFlow specification contained critical architectural patterns that contradict the reality of smallholder aggregation in Karnataka. KrishiLink corrects these:

| Architectural Area | AgriFlow Legacy Pattern | KrishiLink Target Architecture | Resolution in KrishiLink Backend |
|---|---|---|---|
| **Procurement & Inventory Risk** | Speculative buying; farmer listings treated as immediately sellable inventory. | **Order-First Consignment**: demand is confirmed D-1 by 20:00; collection matches orders + 10-15% buffer. | Farmer listings (`farmer_listings`) are strictly supply forecasts. Available hub stock is derived solely from physical weigh-ins in `stock_ledger`. Orders cannot sell phantom inventory. |
| **Stock Visibility** | Exact kg balances displayed across all apps. | **Decoupled 3-Button Status**: Humans see 🔴 OUT, 🟡 LOW, 🟢 SUFFICIENT. The underlying ledger records exact grams/kg. | `hub_stock_status` table manages the 3-state enum. `stock_ledger` maintains immutable audit deltas. System calculates suggested status from days of cover. |
| **Driver Dispatch** | Open marketplace (Uber/Dunzo model) where drivers browse and accept orders. | **Admin-Assigned Dispatch**: Central control tower bundles pickups/deliveries via CVRPTW and assigns specific driver + vehicle. | Drivers cannot self-assign. Trips are created by admin (`assigned_by` foreign key) and tied to `vehicles` and `drivers`. |
| **Pricing Model** | Fixed single daily price or static price tags. | **Dynamic Price Range (p10–p90)** with locked price at order confirmation. | ML models forecast p10, p50, p90. Admin publishes `published_prices`. Orders lock `price_per_kg_locked` at confirmation. |
| **Farmer Thresholds** | Flat minimum order or no threshold, causing uneconomical stops. | **Configurable Two-Tier Threshold**: Per-farmer default (`default_min_kg`) + per-crop override (`farmer_crop_thresholds`), plus route minimum payload. | Listings below threshold are automatically flagged `INELIGIBLE` (`THRESHOLD_NOT_MET`) and excluded from dispatch solver. |
| **Financial Accounting** | Floating point currency, single-entry wallet balance. | **Double-Entry Ledger in Paise**: Integer amounts in paise; immutable ledger entries (`ledger_entries`) with debit/credit balance. | Zero floating-point rounding errors. Payouts follow: `accepted_kg × realised_price × (1 - commission) - logistics_share`. |

---

## 3. Detailed Schema & API Discrepancies Identified

### 3.1 Uncollected Farmer Listings vs. Physical Hub Inventory
* **Gap Identified**: Treating uncollected farmer listing kg (`est_kg`) as available stock for buyer fulfillment causes immediate stock-outs and delivery failures.
* **Resolution**: 
  - `farmer_listings.est_kg` is an estimate used exclusively by the route optimization solver (`POST /admin/routes/optimize`).
  - Buyer orders for same-day delivery are validated exclusively against `hub_stock_current` (the sum of `stock_ledger.delta_kg`).
  - When produce arrives at a hub, a `hub_receipts` record is created, and an entry with `reason='PICKUP'` is posted to `stock_ledger`. Only then does physical stock increase.

### 3.2 Role Hierarchy & Authorization Boundaries
* **Gap Identified**: Early drafts conflated `admin` and `hub_staff` permissions, and did not account for `super_admin`.
* **Resolution**:
  - `super_admin`: Full system control, role assignment, platform configuration.
  - `admin`: Office control tower; manages dispatch, route optimization, transfers, pricing publication, settlements, and global monitoring.
  - `hub_staff`: Scoped strictly to their assigned hub (`hub_staff` join table). Can adjust stock status and record weigh-in receipts for their hub only.
  - `driver`: Can only view assigned trips and post receipts/locations for active trips.
  - `farmer` & `buyer`: Strict row-level isolation via user session tokens (`farmers.user_id = current_user.id`, `buyers.user_id = current_user.id`).

### 3.3 Money and Weight Units
* **Discrepancy**: Some frontend sketches showed rupees (₹) and decimal currency.
* **Resolution**:
  - **All monetary fields in DB and API are integers in paise** (`subtotal`, `delivery_fee`, `total`, `credit_limit`, `gross`, `net`, `commission`, `price_per_kg_locked`). Frontend formatters convert paise to ₹ (divide by 100).
  - **All weights in DB and API are numeric/float in kilograms (kg)** (`est_kg`, `kg_received`, `qty_kg`, `capacity_kg`, `delta_kg`).

### 3.4 Spatial Data Types & Cross-Environment Testing
* **Gap Identified**: PostGIS `geography(Point, 4326)` is required in production for accurate geodesic distance and nearest-hub queries (`ST_Distance`), but breaks local unit testing on standard lightweight SQLite test runners.
* **Resolution**:
  - Implemented a custom SQLAlchemy type (`GeoPoint`) that maps to PostGIS `geography(Point, 4326)` on PostgreSQL, and fallback serializable GeoJSON / WKT coordinate tuple on SQLite.
  - Alembic migrations explicitly generate native PostgreSQL PostGIS DDL with spatial GiST indexes.

### 3.5 Offline Synchronization & Idempotency
* **Gap Identified**: Mobile networks in rural Mandya/Kolar drop frequently. Drivers recording pickup receipts or buyers confirming orders offline may submit duplicate requests upon reconnecting.
* **Resolution**:
  - `client_event_id` (UUID) is enforced on pickup receipts (`pickup_receipts.client_event_id UNIQUE`).
  - An `Idempotency-Key` header mechanism is implemented for order creation and state transitions. Replays return the original response without duplicate ledger entries or duplicate orders.

---

## 4. Unresolved Business Decisions & Operational Blockers

1. **Farmer Threshold Default**:
   - The team notebook mentioned 3 kg; operational economics suggest a 20–30 kg default to prevent prohibitive pickup costs.
   - *Current Backend Default*: Set to 20.0 kg (`farmers.default_min_kg`), configurable per crop in `farmer_crop_thresholds` and globally in `settings`.

2. **Listing & Order Cutoff Timers**:
   - Master timeline sets Farmer listing cutoff at D-1 18:00 IST and Buyer order cutoff at D-1 20:00 IST.
   - *Current Implementation*: Cutoff checks are parameterizable via the `settings` table and enforced in `listing_service` and `order_service`.

3. **External Telecom & Payment Gateways**:
   - SMS DLT registration and Masked Calling (Exotel/Knowlarity) require business verification lead time.
   - *Current Backend Fallback*: Secure mock/development OTP verification mode (`MOCK_OTP=true`) for instant testing; masked calling returns direct support bridge metadata when provider credentials are unconfigured.
