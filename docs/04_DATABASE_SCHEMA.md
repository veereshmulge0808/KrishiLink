# 04 — Database Schema (PostgreSQL + PostGIS)

Conventions: `snake_case`, plural table names, `id` as UUID (or bigint), `created_at/updated_at` timestamps (UTC), soft-delete via `deleted_at` where needed. Money in **paise** (integer) to avoid float errors; weights in **grams** or `numeric(12,3)` kg. Below uses kg numeric for readability.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## 1. Enums

```sql
CREATE TYPE user_role AS ENUM ('buyer','farmer','driver','hub_staff','admin','super_admin');
CREATE TYPE hub_type AS ENUM ('main','village','city');
CREATE TYPE stock_status AS ENUM ('OUT','LOW','SUFFICIENT');
CREATE TYPE listing_status AS ENUM ('DRAFT','INELIGIBLE','ELIGIBLE','SCHEDULED','COLLECTED','CANCELLED','EXPIRED');
CREATE TYPE order_status AS ENUM ('PLACED','CONFIRMED','PARTIAL','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
CREATE TYPE trip_type AS ENUM ('FIRST_MILE','MIDDLE_MILE','LAST_MILE','TRANSFER');
CREATE TYPE trip_status AS ENUM ('ASSIGNED','ACKNOWLEDGED','STARTED','AT_HUB','RETURNED','CLOSED','CANCELLED','INCIDENT');
CREATE TYPE stop_type AS ENUM ('PICKUP','HUB','DELIVERY');
CREATE TYPE stop_status AS ENUM ('PLANNED','EN_ROUTE','ARRIVED','IN_PROGRESS','COMPLETED','SKIPPED');
CREATE TYPE transfer_status AS ENUM ('SUGGESTED','REQUESTED','APPROVED','ASSIGNED','IN_TRANSIT','RECEIVED','REJECTED','CANCELLED');
CREATE TYPE grade AS ENUM ('A','B','REJECT');
CREATE TYPE ledger_reason AS ENUM ('PICKUP','TRANSFER_IN','TRANSFER_OUT','SALE','WASTAGE','ADJUSTMENT','RETURN');
CREATE TYPE payment_direction AS ENUM ('IN','OUT');
CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');
```

## 2. Identity and parties

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         varchar(15) UNIQUE NOT NULL,
  role          user_role NOT NULL,
  name          varchar(120),
  language      varchar(5) DEFAULT 'kn',
  is_active     boolean DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE farmers (
  user_id           uuid PRIMARY KEY REFERENCES users(id),
  village           varchar(120),
  taluk             varchar(120),
  district          varchar(120),
  location          geography(Point,4326) NOT NULL,
  nearest_hub_id    uuid,                       -- FK added after hubs
  land_acres        numeric(6,2),
  default_min_kg    numeric(8,2) DEFAULT 20,    -- threshold
  upi_id            varchar(80),
  bank_account_ref  varchar(80),                -- tokenised ref, never raw numbers
  reliability_score numeric(4,2) DEFAULT 5.0,
  approved          boolean DEFAULT false
);

CREATE TABLE farmer_crop_thresholds (
  farmer_id uuid REFERENCES farmers(user_id),
  crop_id   uuid,
  min_kg    numeric(8,2) NOT NULL,
  PRIMARY KEY (farmer_id, crop_id)
);

CREATE TABLE buyers (
  user_id        uuid PRIMARY KEY REFERENCES users(id),
  business_name  varchar(160) NOT NULL,
  business_type  varchar(40),                   -- restaurant, caterer, hostel, wholesaler...
  gstin          varchar(15),
  address        text,
  location       geography(Point,4326) NOT NULL,
  delivery_hub_id uuid,
  credit_limit   bigint DEFAULT 0,              -- paise
  credit_days    int DEFAULT 0,
  approved       boolean DEFAULT false
);

CREATE TABLE vehicles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no        varchar(20) UNIQUE NOT NULL,
  type          varchar(40),
  capacity_kg   numeric(8,2) NOT NULL,
  ownership     varchar(10) CHECK (ownership IN ('own','rent')),
  active        boolean DEFAULT true
);

CREATE TABLE drivers (
  user_id       uuid PRIMARY KEY REFERENCES users(id),
  licence_no    varchar(30),
  vehicle_id    uuid REFERENCES vehicles(id),
  home_hub_id   uuid,
  on_duty       boolean DEFAULT false
);
```

## 3. Hubs and crops

```sql
CREATE TABLE hubs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(120) NOT NULL,
  type          hub_type NOT NULL,
  parent_hub_id uuid REFERENCES hubs(id),       -- village/city -> main
  location      geography(Point,4326) NOT NULL,
  address       text,
  capacity_kg   numeric(10,2),
  has_cold_room boolean DEFAULT false,
  active        boolean DEFAULT true
);
ALTER TABLE farmers ADD FOREIGN KEY (nearest_hub_id) REFERENCES hubs(id);
ALTER TABLE buyers  ADD FOREIGN KEY (delivery_hub_id) REFERENCES hubs(id);
ALTER TABLE drivers ADD FOREIGN KEY (home_hub_id) REFERENCES hubs(id);

CREATE TABLE hub_staff (
  user_id uuid REFERENCES users(id),
  hub_id  uuid REFERENCES hubs(id),
  PRIMARY KEY (user_id, hub_id)
);

CREATE TABLE crops (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               varchar(60) UNIQUE NOT NULL,
  name_en            varchar(80) NOT NULL,
  name_kn            varchar(80),
  category           varchar(40),               -- leafy, root, fruit_veg, fruit
  is_organic         boolean DEFAULT false,     -- separate SKU/price when true
  unit               varchar(10) DEFAULT 'kg',
  shelf_life_hours   int,
  perishability      smallint,                  -- 1 (hardy) .. 5 (very perishable)
  min_order_kg       numeric(8,2) DEFAULT 10,
  default_min_kg     numeric(8,2) DEFAULT 20,
  icon_url           text,
  active             boolean DEFAULT true
);
ALTER TABLE farmer_crop_thresholds ADD FOREIGN KEY (crop_id) REFERENCES crops(id);
```

## 4. Stock (three-button status + ledger)

```sql
-- Human-facing status (the three buttons)
CREATE TABLE hub_stock_status (
  hub_id      uuid REFERENCES hubs(id),
  crop_id     uuid REFERENCES crops(id),
  status      stock_status NOT NULL DEFAULT 'OUT',
  suggested   stock_status,                      -- system suggestion
  set_by      uuid REFERENCES users(id),
  set_at      timestamptz DEFAULT now(),
  PRIMARY KEY (hub_id, crop_id)
);

CREATE TABLE hub_stock_status_history (
  id        bigserial PRIMARY KEY,
  hub_id    uuid, crop_id uuid,
  old_status stock_status, new_status stock_status,
  source    varchar(10),                         -- 'manual' | 'system'
  set_by    uuid, at timestamptz DEFAULT now()
);

-- Quantity truth (hidden behind buttons)
CREATE TABLE stock_ledger (
  id        bigserial PRIMARY KEY,
  hub_id    uuid NOT NULL REFERENCES hubs(id),
  crop_id   uuid NOT NULL REFERENCES crops(id),
  delta_kg  numeric(12,3) NOT NULL,              -- + in, - out
  reason    ledger_reason NOT NULL,
  ref_type  varchar(30), ref_id uuid,            -- receipt, order, transfer...
  grade     grade,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON stock_ledger (hub_id, crop_id, created_at);

CREATE VIEW hub_stock_current AS
SELECT hub_id, crop_id, SUM(delta_kg) AS stock_kg
FROM stock_ledger GROUP BY hub_id, crop_id;
```

## 5. Supply: listings and pickups

```sql
CREATE TABLE farmer_listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id    uuid NOT NULL REFERENCES farmers(user_id),
  crop_id      uuid NOT NULL REFERENCES crops(id),
  listing_date date NOT NULL,                    -- collection day
  est_kg       numeric(8,2) NOT NULL,
  ready_from   timestamptz, ready_by timestamptz,
  status       listing_status DEFAULT 'DRAFT',
  min_kg_applied numeric(8,2),                   -- threshold used for eligibility
  created_at   timestamptz DEFAULT now(),
  UNIQUE (farmer_id, crop_id, listing_date)
);

CREATE TABLE pickup_receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_stop_id  uuid NOT NULL,                   -- FK below
  listing_id    uuid REFERENCES farmer_listings(id),
  crop_id       uuid NOT NULL REFERENCES crops(id),
  kg_received   numeric(8,2) NOT NULL,
  grade         grade,
  photo_url     text,
  farmer_confirmed boolean DEFAULT false,
  client_event_id uuid UNIQUE,                   -- idempotency for offline retries
  recorded_by   uuid REFERENCES users(id),
  recorded_at   timestamptz DEFAULT now()
);
```

## 6. Demand: orders

```sql
CREATE TABLE orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id       uuid NOT NULL REFERENCES buyers(user_id),
  delivery_hub_id uuid REFERENCES hubs(id),
  delivery_date  date NOT NULL,
  slot_start     time, slot_end time,
  status         order_status DEFAULT 'PLACED',
  subtotal       bigint, delivery_fee bigint, total bigint,   -- paise
  payment_mode   varchar(10) CHECK (payment_mode IN ('PREPAID','CREDIT')),
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES orders(id),
  crop_id        uuid NOT NULL REFERENCES crops(id),
  qty_kg         numeric(8,2) NOT NULL,
  confirmed_kg   numeric(8,2),
  delivered_kg   numeric(8,2),
  rejected_kg    numeric(8,2) DEFAULT 0,
  price_per_kg_locked bigint,                    -- paise
  reject_reason  text
);
```

## 7. Logistics: trips, stops, tracking

```sql
CREATE TABLE trips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          trip_type NOT NULL,
  status        trip_status DEFAULT 'ASSIGNED',
  driver_id     uuid NOT NULL REFERENCES drivers(user_id),
  vehicle_id    uuid NOT NULL REFERENCES vehicles(id),
  origin_hub_id uuid REFERENCES hubs(id),
  dest_hub_id   uuid REFERENCES hubs(id),
  assigned_by   uuid NOT NULL REFERENCES users(id),     -- admin
  planned_start timestamptz,
  started_at    timestamptz, ended_at timestamptz,
  planned_route geography(LineString,4326),
  planned_km    numeric(8,2), planned_minutes int,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE trip_stops (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seq          int NOT NULL,
  type         stop_type NOT NULL,
  status       stop_status DEFAULT 'PLANNED',
  farmer_id    uuid REFERENCES farmers(user_id),
  buyer_order_id uuid REFERENCES orders(id),
  hub_id       uuid REFERENCES hubs(id),
  location     geography(Point,4326) NOT NULL,
  eta          timestamptz, arrived_at timestamptz, completed_at timestamptz,
  skip_reason  text,
  UNIQUE (trip_id, seq)
);
ALTER TABLE pickup_receipts ADD FOREIGN KEY (trip_stop_id) REFERENCES trip_stops(id);

CREATE TABLE hub_receipts (            -- weigh-in at hub (variance check)
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    uuid REFERENCES trips(id),
  hub_id     uuid REFERENCES hubs(id),
  crop_id    uuid REFERENCES crops(id),
  kg_driver  numeric(10,3), kg_hub numeric(10,3),
  variance_pct numeric(6,2) GENERATED ALWAYS AS
     (CASE WHEN kg_driver > 0 THEN (kg_hub-kg_driver)/kg_driver*100 END) STORED,
  grade_a_kg numeric(10,3), grade_b_kg numeric(10,3), reject_kg numeric(10,3),
  recorded_by uuid REFERENCES users(id), recorded_at timestamptz DEFAULT now()
);

CREATE TABLE location_pings (          -- partition by day in production
  trip_id    uuid, driver_id uuid,
  ts         timestamptz NOT NULL,
  location   geography(Point,4326) NOT NULL,
  speed_kmh  real, heading real, accuracy_m real,
  PRIMARY KEY (trip_id, ts)
);
CREATE INDEX ON location_pings USING gist (location);

CREATE TABLE transfer_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_hub_id  uuid NOT NULL REFERENCES hubs(id),   -- donor
  to_hub_id    uuid NOT NULL REFERENCES hubs(id),   -- requester
  crop_id      uuid NOT NULL REFERENCES crops(id),
  requested_kg numeric(10,2), sent_kg numeric(10,2), received_kg numeric(10,2),
  status       transfer_status DEFAULT 'SUGGESTED',
  trip_id      uuid REFERENCES trips(id),
  requested_by uuid REFERENCES users(id),
  approved_by  uuid REFERENCES users(id),
  created_at   timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
```

## 8. Pricing and ML outputs

```sql
CREATE TABLE market_prices (           -- raw Agmarknet etc.
  date date, market varchar(80), crop_id uuid REFERENCES crops(id),
  min_price numeric(8,2), max_price numeric(8,2), modal_price numeric(8,2),
  arrivals_qtl numeric(12,2), source varchar(30),
  PRIMARY KEY (date, market, crop_id)
);

CREATE TABLE weather_daily (
  date date, location_key varchar(60),
  rain_mm numeric(6,2), tmax numeric(4,1), tmin numeric(4,1), humidity numeric(5,2),
  is_forecast boolean DEFAULT false,
  PRIMARY KEY (date, location_key, is_forecast)
);

CREATE TABLE price_forecasts (
  date date, crop_id uuid, market varchar(80),
  p10 numeric(8,2), p50 numeric(8,2), p90 numeric(8,2),
  model_version varchar(30), created_at timestamptz DEFAULT now(),
  PRIMARY KEY (date, crop_id, market, model_version)
);

CREATE TABLE demand_forecasts (
  date date, hub_id uuid, crop_id uuid,
  q10 numeric(10,2), q50 numeric(10,2), q90 numeric(10,2),
  model_version varchar(30), created_at timestamptz DEFAULT now(),
  PRIMARY KEY (date, hub_id, crop_id, model_version)
);

CREATE TABLE published_prices (        -- what users actually see (after admin review)
  date date, crop_id uuid, low numeric(8,2), high numeric(8,2),
  reference numeric(8,2), overridden boolean DEFAULT false,
  override_reason text, published_by uuid, published_at timestamptz DEFAULT now(),
  PRIMARY KEY (date, crop_id)
);
```

## 9. Money

```sql
CREATE TABLE payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   uuid NOT NULL REFERENCES users(id),     -- farmer or buyer
  direction  payment_direction NOT NULL,
  amount     bigint NOT NULL,                         -- paise
  status     payment_status DEFAULT 'PENDING',
  gateway_ref varchar(80), order_id uuid, settlement_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE settlements (            -- per farmer per day
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(user_id), settle_date date,
  accepted_kg numeric(10,2), gross bigint, commission bigint, logistics_share bigint, net bigint,
  status varchar(15) DEFAULT 'DRAFT', approved_by uuid, paid_at timestamptz,
  UNIQUE (farmer_id, settle_date)
);

CREATE TABLE ledger_entries (         -- double-entry accounting
  id bigserial PRIMARY KEY, txn_id uuid NOT NULL,
  account varchar(40) NOT NULL,       -- farmer_payable, buyer_receivable, commission_income, wastage_expense...
  party_id uuid, debit bigint DEFAULT 0, credit bigint DEFAULT 0,
  ref_type varchar(30), ref_id uuid, created_at timestamptz DEFAULT now()
);
```

## 10. Platform tables

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
  channel varchar(10), template varchar(60), payload jsonb, status varchar(10), created_at timestamptz DEFAULT now()
);
CREATE TABLE events (id bigserial PRIMARY KEY, type varchar(60), entity_id uuid, payload jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE audit_log (id bigserial PRIMARY KEY, user_id uuid, action varchar(60), entity varchar(40), entity_id uuid, before jsonb, after jsonb, ip inet, created_at timestamptz DEFAULT now());
CREATE TABLE settings (key varchar(60) PRIMARY KEY, value jsonb, updated_by uuid, updated_at timestamptz DEFAULT now());
CREATE TABLE incidents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), trip_id uuid, type varchar(30), notes text, reported_by uuid, resolved boolean DEFAULT false, created_at timestamptz DEFAULT now());
```

## 11. Useful indexes and queries

```sql
CREATE INDEX farmers_loc_gix  ON farmers  USING gist (location);
CREATE INDEX buyers_loc_gix   ON buyers   USING gist (location);
CREATE INDEX hubs_loc_gix     ON hubs     USING gist (location);
CREATE INDEX listings_date_ix ON farmer_listings (listing_date, status);
CREATE INDEX orders_date_ix   ON orders (delivery_date, status);
CREATE INDEX trips_driver_ix  ON trips (driver_id, status);

-- Nearest hub to a farmer
SELECT h.id FROM hubs h WHERE h.type='village' AND h.active
ORDER BY h.location <-> (SELECT location FROM farmers WHERE user_id = :fid) LIMIT 1;

-- Hubs that are SUFFICIENT for a crop, nearest to a requesting hub
SELECT s.hub_id, ST_Distance(h.location, rh.location)/1000 AS km
FROM hub_stock_status s
JOIN hubs h  ON h.id = s.hub_id
JOIN hubs rh ON rh.id = :requesting_hub
WHERE s.crop_id = :crop AND s.status = 'SUFFICIENT' AND s.hub_id <> :requesting_hub
ORDER BY km LIMIT 5;

-- Days of cover (for status suggestion)
SELECT c.hub_id, c.crop_id, c.stock_kg / NULLIF(d.q50,0) AS days_of_cover
FROM hub_stock_current c
JOIN demand_forecasts d ON d.hub_id=c.hub_id AND d.crop_id=c.crop_id AND d.date = current_date;
```

## 12. Data retention
| Data | Keep |
|---|---|
| location_pings | raw 90 days, then downsample (keep trip summaries/ML aggregates) |
| audit_log, ledger, payments | 7+ years (accounting/legal guidance, verify) |
| notifications | 6 months |
| Photos | 12 months (disputes), then archive |
