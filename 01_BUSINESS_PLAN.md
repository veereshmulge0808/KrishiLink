# 01 — Business Plan

> All numbers are **illustrative planning assumptions**. Replace with real quotes from vehicle dealers/rental operators, landlords, APMC traders, and a CA before spending money.

---

## 1. Vision and mission

**Vision:** Every small farmer in Karnataka can sell fresh produce at a fair price without losing money on transport or middlemen.
**Mission (pilot):** Build a reliable, tech-enabled farm-to-bulk-buyer logistics network around Bengaluru that is profitable per kg, with low waste and transparent pricing.

## 2. Problem and opportunity

- Smallholders (1–2 acres) produce small, scattered quantities; **a vehicle per farm is uneconomical**.
- Prices of vegetables and fruits are **highly volatile** (demand, weather, season, festivals).
- Produce is **perishable**: unsold stock = direct loss.
- Bulk buyers (restaurants, caterers, hostels, hotels, retailers, wholesalers) want **consistent quantity, quality, timing** and **one point of contact**.
- Opportunity: **aggregate** small loads → share vehicles → deliver early morning → earn a thin margin per kg at volume.

## 3. Customers and value proposition

| Segment | Needs | What we offer |
|---|---|---|
| Smallholder farmer | Pickup from farm/village, fair price, quick payment, zero hassle | Pickup/aggregation, price range visibility, next-day payout, Kannada simple app |
| Large farmer | Reliable outlet for surplus | Same channel, larger volumes, priority routes |
| Bulk buyer | Daily supply, tracking, predictable price band, one app | Blinkit-like ordering, live tracking, quality grading, standing orders |
| Community / FPO | Collective bargaining | Partnership, data, shared hub use |

**Positioning:** a **community-first logistics network**, not just a marketplace. We own the physical movement and the hub operations.

## 4. Business model

### 4.1 Operating model (pilot): consignment + order-first
1. Buyers place orders for next day. Demand is known before collection.
2. We collect against orders + small buffer (10–15%).
3. Farmer is paid **realised price − commission − logistics share**.
4. Company earns commission + delivery fee; **does not take large inventory/price risk**.

### 4.2 Later model: fixed-price procurement (only after ML + working capital are ready)
- Buy at an agreed price for the day (using forecast band), resell to buyers. Higher margin potential, higher risk.

### 4.3 Revenue streams
| Stream | Description | Starting assumption |
|---|---|---|
| Commission | % on value of produce sold | 6–10% |
| Delivery fee | Per kg or per order to buyer | ₹1–2/kg |
| Premium services | Guaranteed slot, graded/packed produce, standing orders | Later |
| Input marketplace | Crates, seeds, fertiliser via hubs | Later |
| Data/insights | Price/demand reports | Later |
| Financing | Small advances to farmers | Later, needs licence/partner |

## 5. Unit economics (worked, illustrative)

**Assumptions**
- Average buyer price `P` = ₹30/kg; commission `c` = 8% (₹2.4/kg); delivery fee ₹1.5/kg → revenue ₹3.9/kg.
- Variable cost: packing ₹0.5/kg; wastage 3% of value = ₹0.9/kg → ₹1.4/kg.
- **Contribution per kg = 3.9 − 1.4 = ₹2.5/kg.**
- Fixed daily cost (pilot): 2 rented pickups ₹5,000 + 6 staff/drivers ₹5,400 + hub rent ₹1,000 + tech/phone ₹300 = **₹11,700/day**.

**Break-even volume** = 11,700 / 2.5 ≈ **4,700 kg/day (≈ 4.7 tonnes)**.

**Sensitivity of break-even (kg/day)**

| Commission → | 6% | 8% | 10% |
|---|---|---|---|
| Wastage 5% | 9,000 | 6,160 | 4,680 |
| Wastage 3% | 6,160 | 4,680 | 3,770 |
| Wastage 1% | 4,680 | 3,770 | 3,160 |

**Takeaways**
1. Volume and wastage drive profitability; fixed costs must stay lean.
2. A pilot below ~3–5 tonnes/day will likely **run at a loss**. Budget for it as a learning cost.
3. Improve contribution through higher-value crops, better packing, standing orders (low wastage), and fuller vehicles.

> Build a Google Sheet with the above formula, three scenarios (pessimistic/base/optimistic), and update weekly with real data.

## 6. Hub network plan

### 6.1 Types and responsibilities
| Hub | Responsibilities | Minimum facilities |
|---|---|---|
| Village mini hub | Aggregate farm loads, weigh, crate, basic sort | Shed/shade, weighing scale, crates, tarps, drinking water, basic security |
| Bengaluru main hub | Receive, sort, grade, pack per order, short cold storage, dispatch, admin office | Covered area, floor drainage, scales, crates, small cold room, office desk, power backup |
| City mini hub | Staging near buyer clusters, last-mile starts | Small rented unit, scales, crates |

### 6.2 Location selection criteria
- **Village hubs:** farmer density within 5–10 km radius, road quality, existing market/shed, mobile network, willing local partner.
- **Main hub:** near ring roads/NH, close to APMC/market yard (Yeshwanthpur/Singena Agrahara area options — verify), 24×7 truck access, reasonable rent.
- **City hubs:** near clusters of restaurants/hostels (e.g., HSR, Koramangala, Whitefield, Jayanagar, Malleshwaram — validate with actual buyer list).
- Use the **p-median / k-means** method in `07_ROUTING_AND_OPTIMIZATION.md` to test candidate locations with real farmer/buyer coordinates.

### 6.3 Build vs rent
- **Pilot: rent or partner** (existing market traders, godowns, FPO sheds). No construction.
- Consider build/own only after 6+ months of proven throughput.

## 7. Vehicle plan

### 7.1 Vehicle classes
| Class | Typical use | Payload (typical) |
|---|---|---|
| Small 3-wheeler / mini pickup | Narrow village roads, short first-mile | 0.5–0.75 t |
| Small commercial pickup (Tata Ace/Bolero-class) | First/last mile, mixed loads | 0.75–1.5 t |
| 1.5–3 t light truck | Middle mile village hub → main hub | 1.5–3 t |

### 7.2 Hire vs buy decision
```
Hire cost/month  = trips × cost_per_trip  (or fixed monthly rate incl. driver)
Own cost/month   = EMI + insurance + permit + maintenance + driver + fuel + idle-time cost
Buy only if: utilisation > 65–70% of days AND loan-servicing comfortably < hire cost
```
- Start with hire (monthly contracts with 2–3 operators, plus on-call backup).
- Consider **EV small cargo vehicles** later if charging and range fit routes.
- Insurance: goods-in-transit, vehicle, driver accident cover.

### 7.3 Fleet sizing (starter)
- Per cluster: 1 pickup × 2 trips/morning = ~1.5–3 t/morning.
- Start with **2 first-mile vehicles + 1 middle-mile vehicle + 1 last-mile/backup**.

## 8. Initial investment plan (phased)

### Phase 0 — Validate (weeks 0–6) — minimal cash
- Hire vehicles per trip; no purchases; no construction.
- Prototype app + WhatsApp fallback; manual ops sheets.
- Onboard 20–40 farmers, 5–10 buyers.
- **Exit criteria:** repeat orders, <8% wastage, on-time ≥ 85%, understand real costs/kg.

### Phase 1 — Pilot (months 2–6)
- 1 main hub (rented), 2 village hubs, 2 city hubs.
- Add scales, crates, a modular cold room **only if wastage data justifies**.
- Lease/buy 1–2 vehicles if utilisation >65%.
- Paid drivers + hub staff.

### Phase 2 — Scale (months 6–18)
- More village hubs/routes, standing contracts, ML-driven procurement, buyer credit, farmer-finance partnerships.

### Budget template (fill with real quotes)
| Head | One-time (₹) | Monthly (₹) | Notes |
|---|---|---|---|
| Hub rent + deposit | | | main + village + city |
| Weighing scales (certified) | | | |
| Crates, tarps, packing | | | |
| Cold room (optional) | | | modular, power backup |
| Vehicles hire/EMI | | | |
| Fuel, tolls, maintenance | | | |
| Drivers + hub staff | | | |
| Tech (cloud, maps, SMS, calling) | | | |
| Insurance, licences, legal | | | |
| Marketing/onboarding events | | | |
| Wastage buffer | | | |
| **Working capital** | | | `daily purchase × payment-gap days` |

### Working capital rule of thumb
Farmers paid next day; buyers pay in 0–7 days. If daily procurement = ₹1,00,000 and gap = 5 days → ~₹5,00,000 tied up. Reduce via **prepaid** for new buyers and **credit limits** for vetted ones.

## 9. Funding options (research & verify)
- Founder/team funds, college incubation cell, mentors.
- Government support: NHB, MIDH, **Agriculture Infrastructure Fund** (interest subvention for post-harvest infra), NABARD, Karnataka agri-startup programs, eNAM, FPO promotion schemes — **check current eligibility and process**.
- Startup grants/challenges (state startup cells, agri-tech competitions).
- Angel/seed after pilot metrics (kg/day, margin/kg, retention).

## 10. Price volatility strategy

| Tactic | How |
|---|---|
| Order-first buying | Collect against confirmed orders + 10–15% buffer |
| Consignment payout | Farmer share depends on realised price; we avoid inventory price risk |
| Price bands | Show p10–p90 forecast to farmers/buyers; lock price at order confirm for standing buyers |
| Forward/standing orders | Weekly contracts with restaurants/hostels/caterers |
| Fast-turn inventory | Sell leafy/ripe first; cold room max 1–2 days |
| Grading | A-grade to premium buyers, B-grade to low-end/processors/discount |
| Buyer diversification | No buyer > 25–30% of volume |
| Seasonal planning | Use ML + crop calendars to anticipate gluts/shortages |
| Price floor (later) | Minimum guaranteed price only when forecast confidence is high |

## 11. Pricing and payments

- **Buyer price** = hub reference price (market price + our fee). Show as a **range** with locked price at order confirmation (rules in `02_WORKFLOWS.md`).
- **Farmer payout** = accepted kg × realised price × (1 − commission) − logistics share.
- Payment rails: UPI/netbanking via Razorpay or Cashfree; **payouts next day** after hub weight verification.
- Keep a **double-entry ledger** (see `04_DATABASE_SCHEMA.md`).
- Buyer credit: only after KYC, trial orders, credit limit and ageing monitoring.

## 12. Go-to-market

**Farmers**
- Partner with FPOs, Raitha Samparka Kendras, KVKs, agri colleges, gram panchayats, existing farmer WhatsApp groups.
- Field agent at each village hub for onboarding (phone number, location pin, crops).
- Demonstrate **first payout** quickly; word of mouth is the main channel.

**Buyers**
- Walk-in sales to restaurants, caterers, hostel messes, PG kitchens, small supermarkets, hotels.
- Offer trial week with quality guarantee and replacement for rejected goods.
- Standing-order discounts.

**Trust building:** weigh publicly, show weight on app, quick payment, photo of graded produce, clear rejection policy.

**Competitive landscape (research):** existing agri supply-chain startups and traditional commission agents/mandi traders. Study their pricing, geographies, and pain points; differentiate on **community, small-farmer inclusion, transparency, admin-managed hub network**.

## 13. Compliance checklist (verify with advisor)

| Area | Items |
|---|---|
| Entity | Company/LLP/FPO/Section 8 structure, MSME/Udyam |
| Trade | APMC Act applicability and licences in Karnataka |
| Food safety | FSSAI registration (storage/handling) |
| Tax | GST registration/exemptions for unprocessed produce, TDS on payouts, invoicing |
| Vehicles | Goods carriage permit, fitness, insurance, driver licences |
| Labour | Shops & Establishments, ESI/PF thresholds, contract labour rules |
| Data/privacy | DPDP Act basics: consent, purpose, retention, deletion |
| Weights | Legal metrology: calibrated scales |

## 14. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Price crash, unsold stock | Med | High | Order-first, consignment, diversify buyers |
| 2 | Wastage from delays/heat | High | High | Early pickup, crates, shade, short cycle, cold room, grading |
| 3 | Farmer under-supply/no-show | High | Med | Threshold, reliability score, buffer farmers |
| 4 | Driver absence/breakdown | Med | Med | Backup vehicle, quick reassign |
| 5 | Buyer payment delays | Med | High | Prepaid/credit limits, ageing alerts |
| 6 | Weight disputes/fraud | Med | Med | Scales at both ends, photos, variance flags |
| 7 | Low digital literacy | High | Med | Kannada, icons, voice, field agents |
| 8 | Network issues | High | Med | Offline queue, SMS/WhatsApp fallback |
| 9 | Regulatory surprises | Low–Med | High | Early legal check, partner with FPO/licensed trader |
| 10 | Volume too low to break even | High | High | Focus on density, standing orders, cut fixed costs |
| 11 | Team bandwidth (students) | High | High | Scope ruthlessly, clear owners, weekly review |

## 15. Success metrics (pilot)

| Metric | Target (initial) |
|---|---|
| Daily volume | ≥ 1 t by month 2, ≥ 3–5 t by month 6 |
| On-time delivery | ≥ 90% |
| Wastage | ≤ 5% |
| Fill rate (delivered/ordered) | ≥ 92% |
| Farmer payout time | ≤ 24 h |
| Farmer net price vs local alternative | + positive uplift (measure) |
| Buyer repeat rate (weekly) | ≥ 70% |
| Contribution/kg | > 0 by month 4 |
| Price-band coverage | ~80% of days within quoted band |
