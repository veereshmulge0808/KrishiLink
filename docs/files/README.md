# 🌾 Farmer Logistics Platform

> A community-built logistics platform that connects **smallholder farmers** (1–2 acres, vegetables and fruits) with **bulk buyers** in Bengaluru through a network of **village mini hubs** and a **central Bengaluru hub**, with admin-controlled dispatch, live tracking and ML-assisted price and demand forecasting.

**Status:** Planning / pre-prototype
**Pilot scope:** Bengaluru + surrounding vegetable-growing villages (Karnataka)
**Scale-up path:** more hubs across Karnataka once the pilot is profitable

---

## 1. The problem

| Who | Pain today |
|---|---|
| Smallholder farmer | High transport cost for small loads, forced to sell to middlemen at low prices, price volatility, losses from spoilage |
| Bulk buyer (restaurants, caterers, hostels, wholesalers, retailers) | Unreliable supply, inconsistent quality, price swings, no tracking |
| Both | No transparent, low-effort digital channel that works for low-literacy, Kannada-speaking users |

## 2. The solution in one paragraph

Farmers tell us (in a very simple app) what they have ready. Buyers order next-day quantities in a Blinkit-style app. The **admin team** (office control tower) looks at supply, demand and hub stock, **assigns drivers** to optimised routes, and tracks every trip live. Drivers collect produce from farms (or from village mini hubs), bring it to the **Bengaluru main hub**, where it is sorted and dispatched to buyers by morning. Mini hubs share a simple **three-state stock status** (🔴 Out / 🟡 Low / 🟢 Sufficient) and request stock from each other so there are no shortages. ML models give a **price range** and **demand forecast**; the business avoids price risk with order-first procurement and a commission model.

## 3. Network model (Idea 2 from the team notebook)

```
Farmers ──► Village Mini Hubs ──► BENGALURU MAIN HUB ──► City Mini Hubs ──► Bulk Buyers
                  ▲   ◄──── lateral stock transfers between hubs ────►   ▲
                  └───────────── Admin control tower (all hubs) ─────────┘
```

## 4. The four dashboards

| Dashboard | User | Core job |
|---|---|---|
| **Buyer** | Restaurants, caterers, wholesalers | Search → quantity → order; live driver map + ETA + call |
| **Farmer** | Smallholder & large farmers | Set minimum-kg threshold, say what's ready, see driver coming, call |
| **Driver** | Assigned by admin | Follow route map, enter vegetable + kg received, update trip status |
| **Admin** | Office team | Control hubs, stock status, transfers, assign drivers, monitor trips, pricing, payments |

## 5. Documentation map

Read in this order:

| # | File | What it covers | Main audience |
|---|---|---|---|
| 1 | [`docs/01_BUSINESS_PLAN.md`](docs/01_BUSINESS_PLAN.md) | Business model, unit economics, investment, vehicles, hubs, volatility strategy, compliance, go-to-market | Everyone, founders |
| 2 | [`docs/02_WORKFLOWS.md`](docs/02_WORKFLOWS.md) | End-to-end daily operations, per-actor flows, state machines, business rules, exceptions | Everyone |
| 3 | [`docs/03_ARCHITECTURE.md`](docs/03_ARCHITECTURE.md) | System design, tech stack, realtime tracking, security, deployment | Engineers |
| 4 | [`docs/04_DATABASE_SCHEMA.md`](docs/04_DATABASE_SCHEMA.md) | PostgreSQL/PostGIS schema (DDL) | Backend, ML |
| 5 | [`docs/05_API_SPEC.md`](docs/05_API_SPEC.md) | REST + WebSocket contracts | Backend, Frontend |
| 6 | [`docs/06_ML_PLAN.md`](docs/06_ML_PLAN.md) | Price, demand, procurement, stock, rebalancing, ETA, LLM, MLOps | ML lead |
| 7 | [`docs/07_ROUTING_AND_OPTIMIZATION.md`](docs/07_ROUTING_AND_OPTIMIZATION.md) | Vehicle routing, clustering, hub placement, re-optimisation | Backend, ML |
| 8 | [`docs/08_FRONTEND.md`](docs/08_FRONTEND.md) | Folder structure, screens, components, realtime, offline | Frontend |
| 9 | [`docs/09_OPERATIONS_SOP.md`](docs/09_OPERATIONS_SOP.md) | Hub, driver, farmer, buyer, payment standard procedures | Ops team |
| 10 | [`docs/10_ROADMAP_TEAM.md`](docs/10_ROADMAP_TEAM.md) | Team roles, sprints, pilot plan, KPIs, risks, open decisions | Everyone |

## 6. Tech stack at a glance

| Layer | Choice |
|---|---|
| Frontend | Next.js (React + TypeScript) PWA, Tailwind, shadcn/ui, MapLibre GL |
| Backend | Python FastAPI, Celery, WebSockets |
| Database | PostgreSQL + PostGIS, Redis |
| Routing | OR-Tools + OSRM (OpenStreetMap) |
| ML | scikit-learn, LightGBM, Prophet/statsmodels, MLflow |
| Integrations | OTP/SMS/WhatsApp, masked calling, Razorpay/Cashfree, FCM, Open-Meteo, Agmarknet |
| Infra | Docker, AWS (ap-south-1) or similar, GitHub Actions |

## 7. Proposed repository structure

```
farmer-logistics/
├─ README.md
├─ docs/                      # this documentation set
├─ apps/
│  └─ web/                    # Next.js PWA (4 dashboards)  → see docs/08_FRONTEND.md
├─ services/
│  ├─ api/                    # FastAPI core backend        → docs/03, 04, 05
│  ├─ routing/                # OR-Tools + OSRM wrapper     → docs/07
│  └─ ml/                     # models + ML API             → docs/06
├─ infra/                     # docker-compose, terraform, CI
├─ data/                      # seed data, sample datasets (not committed if large)
└─ scripts/                   # ingest, seed, utilities
```

## 8. Key product decisions (current)

1. **Admin assigns drivers**; drivers do not browse/accept requests.
2. **Stock status uses three buttons** (Out / Low / Sufficient) for humans; exact kg is still recorded in a ledger in the background.
3. **Order-first procurement**: collect mostly against confirmed next-day orders (+ small buffer).
4. **Commission/consignment model** for the pilot, so the company carries little price risk.
5. **Hire vehicles first, buy later** after utilisation is proven.
6. **Kannada-first, icon-based farmer UI**; masked calling for contact.
7. **Price shown as a range** (ML p10–p90) because vegetable prices are volatile.

## 9. Glossary

| Term | Meaning |
|---|---|
| Mini hub | Small collection/staging point (village side or city side) |
| Main hub | Bengaluru central hub; sorting, storage, dispatch, admin control |
| First / middle / last mile | Farm→village hub / village hub→main hub / hub→buyer |
| Threshold | Minimum kg a farmer must have for a driver to be assigned |
| Stock status | 🔴 OUT, 🟡 LOW, 🟢 SUFFICIENT per hub per crop |
| Transfer | Inter-hub movement of stock to fix a shortage |
| Newsvendor | Method to choose procurement quantity under uncertain demand |
| VRP/CVRPTW | Vehicle Routing Problem (Capacitated, with Time Windows) |
| Masked call | Phone call routed through a provider so real numbers stay hidden |
| Agmarknet | Government mandi price and arrivals data |

## 10. Working agreements

- **Branching:** `main` (stable), `develop`, feature branches `feat/<area>-<short-name>`.
- **PRs:** at least one review; link the doc section being implemented.
- **Docs are source of truth:** change the doc in the same PR when behaviour changes.
- **Naming:** DB tables `snake_case` plural; API paths `kebab-case`; TS types `PascalCase`.
- **Language:** all UI text via i18n keys (`en`, `kn`).
- **Data:** log everything from day one (orders, stock, trips, GPS); ML depends on it.

## 11. Disclaimers

- Rupee amounts, subsidy schemes, regulations and vendor capabilities in these docs are **planning assumptions**. Verify with dealers, advisors (CA/lawyer), and official sources before spending money.
- Licences (APMC, FSSAI, GST, vehicle permits) must be confirmed with a qualified professional.

## 12. Next steps

1. Team reviews `10_ROADMAP_TEAM.md` → resolve **open decisions** (§ "Decision log").
2. Fill the budget template in `01_BUSINESS_PLAN.md` with real quotes.
3. Start Sprint 1: monorepo, auth, schema, design system.
4. ML lead starts data ingestion for the price model (`06_ML_PLAN.md` §13).
