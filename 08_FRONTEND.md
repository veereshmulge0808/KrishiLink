# 08 — Frontend Specification (part of the Farmer Logistics docs set; see ../README.md)

One **Next.js (App Router, TypeScript) PWA** serving four role-based dashboards: **Buyer, Farmer, Driver, Admin**.
Goals: simple, familiar (Blinkit-like for buyers), Kannada-first for farmers, mobile-first for buyer/farmer/driver, desktop-first for admin.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), React, TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| State/data | TanStack Query (server state), Zustand (UI/local state) |
| Forms | React Hook Form + Zod |
| Maps | MapLibre GL JS (+ OSM tiles) — swap to Google/Mapbox via `MapProvider` abstraction |
| Realtime | Native WebSocket client (reconnecting) for tracking/stock updates |
| i18n | `next-intl` (en, kn; extendable to hi, te, ta) |
| PWA | `next-pwa` / Workbox: installable, offline queue for driver |
| Icons | lucide-react + custom crop icon set |
| Charts (admin) | Recharts |
| Testing | Vitest + React Testing Library, Playwright (E2E) |
| Lint/format | ESLint, Prettier, Husky |

---

## 2. Folder structure

```
apps/web/
├─ public/
│  ├─ icons/crops/          # tomato.svg, onion.svg, ...
│  ├─ locales/              # (optional static)
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx           # phone entry
│  │  │  └─ verify/page.tsx          # OTP
│  │  ├─ (buyer)/buyer/
│  │  │  ├─ layout.tsx               # bottom nav: Home, Cart, Orders, Account
│  │  │  ├─ page.tsx                 # catalog home + search
│  │  │  ├─ crop/[id]/page.tsx       # crop detail + qty selector
│  │  │  ├─ cart/page.tsx
│  │  │  ├─ checkout/page.tsx        # slot + confirm
│  │  │  ├─ orders/page.tsx
│  │  │  ├─ orders/[id]/page.tsx     # live tracking, ETA, call
│  │  │  └─ account/page.tsx
│  │  ├─ (farmer)/farmer/
│  │  │  ├─ layout.tsx               # 3 tabs: Today, Pickup, Money
│  │  │  ├─ page.tsx                 # "What I have today" icon grid
│  │  │  ├─ threshold/page.tsx
│  │  │  ├─ pickup/page.tsx          # driver map + ETA + call
│  │  │  └─ payments/page.tsx
│  │  ├─ (driver)/driver/
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx                 # today's assigned trip(s)
│  │  │  ├─ trip/[id]/page.tsx       # full-screen route map + stop sheet
│  │  │  ├─ trip/[id]/stop/[sid]/page.tsx  # receipt entry (crop + kg)
│  │  │  └─ history/page.tsx
│  │  ├─ (admin)/admin/
│  │  │  ├─ layout.tsx               # sidebar + topbar
│  │  │  ├─ page.tsx                 # control tower (live map + KPIs)
│  │  │  ├─ hubs/page.tsx            # hub network + stock buttons
│  │  │  ├─ hubs/[id]/page.tsx
│  │  │  ├─ transfers/page.tsx       # inter-hub requests
│  │  │  ├─ dispatch/page.tsx        # assign drivers
│  │  │  ├─ trips/page.tsx           # monitoring
│  │  │  ├─ trips/[id]/page.tsx
│  │  │  ├─ orders/page.tsx
│  │  │  ├─ farmers/page.tsx
│  │  │  ├─ buyers/page.tsx
│  │  │  ├─ drivers/page.tsx         # drivers + vehicles
│  │  │  ├─ pricing/page.tsx         # ML price range, overrides
│  │  │  ├─ forecasts/page.tsx       # demand + procurement suggestions
│  │  │  ├─ payments/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ api/                        # only thin BFF routes if needed
│  │  ├─ layout.tsx                  # root: providers, i18n, fonts
│  │  └─ middleware.ts               # role guard + redirects
│  │
│  ├─ components/
│  │  ├─ ui/                         # shadcn primitives (button, card, sheet…)
│  │  ├─ common/                     # AppShell, BottomNav, Sidebar, EmptyState, LanguageSwitch
│  │  ├─ map/
│  │  │  ├─ MapProvider.tsx          # abstraction over MapLibre/Google
│  │  │  ├─ LiveMap.tsx              # markers + route polyline + follow mode
│  │  │  ├─ VehicleMarker.tsx
│  │  │  ├─ RoutePolyline.tsx
│  │  │  ├─ StopMarker.tsx           # pickup/hub/delivery, highlighted big
│  │  │  └─ EtaBadge.tsx
│  │  ├─ crop/                       # CropCard, CropIcon, CropGrid, QuantityStepper, PriceRangeBadge
│  │  ├─ stock/                      # StockStatusButtons (OUT/LOW/OK), StockBadge, HubStockMatrix
│  │  ├─ trip/                       # TripTimeline, StopCard, ReceiptForm, StatusStepper
│  │  ├─ call/                       # CallButton (masked call trigger)
│  │  ├─ admin/                      # KpiCard, DataTable, AssignDriverPanel, TransferRequestCard
│  │  └─ forms/                      # PhoneInput, OtpInput, KgInput
│  │
│  ├─ features/                      # business logic per domain (hooks + api)
│  │  ├─ auth/        {api.ts, hooks.ts, types.ts}
│  │  ├─ catalog/
│  │  ├─ orders/
│  │  ├─ listings/    # farmer listings
│  │  ├─ trips/
│  │  ├─ hubs/
│  │  ├─ transfers/
│  │  ├─ tracking/    # useLiveLocation, useEta
│  │  ├─ pricing/
│  │  └─ payments/
│  │
│  ├─ lib/
│  │  ├─ api-client.ts               # fetch wrapper, auth header, error mapping
│  │  ├─ ws-client.ts                # reconnecting WebSocket
│  │  ├─ geo.ts                      # distance, bbox helpers
│  │  ├─ format.ts                   # ₹, kg, time
│  │  ├─ offline-queue.ts            # IndexedDB queue (driver receipts, pings)
│  │  └─ constants.ts                # status enums
│  │
│  ├─ i18n/
│  │  ├─ en.json
│  │  ├─ kn.json
│  │  └─ request.ts
│  ├─ stores/                        # zustand: authStore, cartStore, uiStore
│  ├─ types/                         # shared TS types (mirror backend schemas)
│  └─ styles/globals.css
├─ tests/
├─ next.config.js
├─ tailwind.config.ts
└─ package.json
```

**Conventions**
- Route groups `(buyer)`, `(farmer)`, etc. keep layouts separate. `middleware.ts` redirects by role.
- Business logic in `features/*`, presentational stuff in `components/*`.
- Types generated from backend OpenAPI (`openapi-typescript`) so frontend/backend stay in sync.
- All text via i18n keys; no hard-coded strings.

---

## 3. Shared enums (single source in `lib/constants.ts`)

```ts
export type StockStatus = 'OUT' | 'LOW' | 'SUFFICIENT';
export type TripStatus =
  'ASSIGNED'|'ACKNOWLEDGED'|'STARTED'|'ARRIVED_STOP'|'PICKED'|'DELIVERED'|'AT_HUB'|'RETURNED'|'CLOSED'|'CANCELLED';
export type StopType = 'PICKUP'|'HUB'|'DELIVERY';
export type OrderStatus = 'PLACED'|'CONFIRMED'|'ASSIGNED'|'OUT_FOR_DELIVERY'|'DELIVERED'|'CANCELLED';
export type Role = 'buyer'|'farmer'|'driver'|'admin'|'hub_staff';
```
Stock colors: OUT = red, LOW = amber, SUFFICIENT = green. Always pair with **icon + text** (not color alone).

---

## 4. Design system

- **Look**: clean, rounded cards, lots of whitespace, one primary green, high contrast. Buyer ≈ Blinkit-like grid; admin ≈ Linear/Stripe-style dashboard.
- **Tokens**: primary `#16A34A`, accent `#F59E0B`, danger `#DC2626`, neutral grays; radius 12–16px; 8px spacing grid.
- **Typography**: Inter + Noto Sans Kannada; min body size 16px (farmer/driver 18px), large tap targets (≥ 48px).
- **Farmer UI rules**: icons over text, max 3 actions per screen, Kannada default, optional voice input, confirmation screens with big ✅/❌.
- **Driver UI rules**: big buttons, sunlight-readable contrast, one primary action at the bottom, works one-handed.
- **Accessibility**: labels, focus states, aria on map controls, reduced motion option.
- **Loading/empty/error states** for every screen (use skeletons).

---

## 5. Screens per role

### 5.1 Buyer (mobile-first)

```
┌──────────────────────────────┐
│ 📍 Delivery: HSR Layout  ▾    │
│ 🔍 Search vegetables…         │
│ [Leafy][Roots][Fruit-veg]… ← chips
├──────────────────────────────┤
│ [🍅 Tomato]  [🧅 Onion]       │
│ ₹22–30/kg    ₹28–34/kg        │
│ [ - 25kg + ] [ - 50kg + ]     │
│ [Add]        [Add]            │
├──────────────────────────────┤
│ 🛒 Cart · 2 items · ₹2,450  → │
└──────────────────────────────┘
 Home | Cart | Orders | Account
```
- **Home**: search, category chips, crop grid (CropCard with price-range badge, stepper, min order qty).
- **Crop detail**: price band + "why" hint, qty, organic/regular toggle (separate price ranges).
- **Cart/Checkout**: quantity list, delivery slot picker, address, pay (UPI/credit), confirm.
- **Order tracking**: map (driver dot, route, destination), **ETA badge**, driver name + vehicle no., **Call button** (masked), status stepper.
- Nothing else — no extra clutter.

### 5.2 Farmer (Kannada-first, minimal)

```
Tab 1: ಇವತ್ತು (Today)           Tab 2: ಪಿಕಪ್ (Pickup)        Tab 3: ಹಣ (Money)
┌─────────────────────────┐    ┌─────────────────────┐    ┌───────────────┐
│ 🍅  🧅  🥔  🥕  🌶️  🥬   │    │ [ map: driver → me ]│    │ Today ₹4,200  │
│ tap a crop → enter kg   │    │ Arrives in 18 min   │    │ Paid ✅ / Due  │
│ ready by: [6:00 am ▾]   │    │ [📞 Call driver]    │    └───────────────┘
│ [✅ Submit]              │    └─────────────────────┘
└─────────────────────────┘
 Threshold: "Don't send vehicle if less than [__] kg"
```
- **Threshold screen**: single number input (default from admin), optional per-crop override; explains in one sentence.
- **Today**: crop icon grid → kg input (numpad) → ready-by → submit. Edit/cancel before cutoff.
- **Pickup**: map with driver coming, ETA, **Call** button. Status text: "Driver assigned / on the way / arrived / picked".
- **Payments**: simple list.

### 5.3 Driver (mobile)
- **Trip list (today)**: cards with trip type (First mile / Middle mile / Last mile / Transfer), number of stops, start time.
- **Trip screen**: full-screen map, route polyline, **live vehicle position**, next stop card at bottom (name, address, ETA, distance), **Navigate** (deep link to Google Maps) + **Call**.
- **Status stepper buttons**: `Start trip → Arrived → Picked up → Next → Reached hub → Returned`.
- **Receipt form (pickup stop)**: crop selector, **kg input**, add another line, grade (A/B), optional photo, farmer confirmation (OTP/tap), Save. Works offline (queued).
- **Delivery stop**: confirm delivered kg, buyer OTP/photo, rejection reason.
- Background GPS: PWA foreground with wake-lock for prototype; plan React Native/Expo app for production.

### 5.4 Admin (desktop-first)

**Layout**: left sidebar (Control Tower, Hubs, Transfers, Dispatch, Trips, Orders, Farmers, Buyers, Drivers, Pricing, Forecasts, Payments, Settings), top bar (date, search, alerts).

1. **Control Tower** — KPI cards (orders today, kg collected, on-time %, wastage %), **live map** (vehicles, hubs, farmers, buyers), alerts feed (delays, LOW/OUT, variance).
2. **Hubs** — network graph/list. **Stock matrix**:
```
                 Tomato   Onion   Beans   Carrot  ...
Main Hub         [🔴][🟡][🟢]  ← three-button control (selected state highlighted)
Hub North        ...
Village Kolar    ...
```
   Each cell = `StockStatusButtons` (OUT / LOW / SUFFICIENT) with last-updated + who. Shows system **suggestion** chip. Click a LOW/OUT cell → "Request from…" listing hubs marked SUFFICIENT.
3. **Transfers** — requests board (Requested → Approved → Assigned → In transit → Received).
4. **Dispatch (assign drivers)** — left: pending pickups/deliveries list; center: map with suggested clusters/routes; right: driver + vehicle selector, capacity bar, **Assign** button → backend pushes to driver app. Drag to reorder stops.
5. **Trips** — table + timeline: assigned / en route / reached / picked / returned; delay badges; open trip → map + stop log + receipts + variance.
6. **Pricing** — ML p10/p50/p90 per crop, admin override with reason, publish to farmers/buyers.
7. **Forecasts** — demand per hub/crop, suggested procurement (kg), accuracy charts.
8. **Orders/Farmers/Buyers/Drivers/Payments** — standard data tables with filters, export CSV.
- Make **bulk actions** and keyboard shortcuts for ops speed; keep it clean, not cluttered.

---

## 6. Key components (props sketch)

```tsx
<StockStatusButtons value={'LOW'} onChange={(s)=>...} disabled={!canEdit} suggested={'SUFFICIENT'} />
<LiveMap vehicles={[{id, lat, lng, heading}]} stops={Stop[]} route={LatLng[]} highlight={['farmer','buyer']} follow />
<EtaBadge minutes={18} updatedAt={ts} />
<CallButton tripId={id} target="driver" />     // calls POST /calls/masked → provider bridges both numbers
<QuantityStepper min={minOrderKg} step={5} value={q} onChange={setQ} />
<ReceiptForm stopId={sid} crops={crops} onSubmit={queueOrSend} />
<AssignDriverPanel pending={tasks} drivers={drivers} onAssign={...} />
```

---

## 7. Realtime & data flow

- **WebSocket channels**
  - `/ws/tracking/{tripId}` → `{lat,lng,speed,eta,status}` (buyer/farmer/admin subscribe)
  - `/ws/admin/live` → vehicle positions, stock status changes, new requests, alerts
  - `/ws/driver/{driverId}` → new assignments (push also via FCM)
- **Driver location**: batch pings every 5–10 s; offline queue in IndexedDB, flush when online.
- **Optimistic UI** for stock buttons; rollback on error; broadcast to other admins.
- **Caching**: TanStack Query with sensible `staleTime` (catalog 5 min, price range until cutoff, tracking real-time).

---

## 8. Auth, roles, guards
- Phone OTP → JWT (httpOnly cookie) + role claim.
- `middleware.ts`: unauthenticated → `/login`; role mismatch → role's home.
- Hide admin-only actions in UI **and** enforce on API.
- Session idle timeout for admin; remember device for farmers/drivers.

---

## 9. Offline & low-bandwidth
- Service worker caches shell + crop icons + last route.
- Driver: queue receipts/status changes; show "Pending sync" badge.
- Farmer: submit listing offline → sync later; SMS/WhatsApp fallback from backend.
- Compress images before upload; lazy-load maps; avoid heavy libraries on farmer routes.

---

## 10. Environment variables
```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_MAP_STYLE_URL=        # MapLibre style / tiles
NEXT_PUBLIC_DEFAULT_CENTER=77.5946,12.9716   # Bengaluru
NEXT_PUBLIC_DEFAULT_LOCALE=kn
```

---

## 11. Build order (frontend)
1. Scaffold, Tailwind/shadcn, i18n, auth + role routing, API client.
2. Design system + shared components (CropCard, StockStatusButtons, LiveMap shell).
3. Farmer flow (listing + threshold) and Buyer flow (catalog → order).
4. Admin hubs + stock buttons + transfers.
5. Admin dispatch + driver trip screens + receipt entry.
6. Live tracking (WS), ETA, masked call.
7. Pricing/forecast screens (consume `/ml/*`).
8. PWA/offline, performance, accessibility, E2E tests.

## 12. Definition of done (per screen)
- Works at 360px width (buyer/farmer/driver) and ≥1280px (admin).
- Kannada + English strings present.
- Loading, empty, error states handled.
- Role guard verified.
- Lighthouse PWA/performance ≥ 85 on mobile.
