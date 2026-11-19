# 10 — Roadmap, Team, Pilot Plan, KPIs & Decisions

---

## 1. Team roles (suggested split for a student/community team)

| Role | Owner (fill in) | Responsibilities |
|---|---|---|
| Product & business lead | | Business model, pricing, buyer/farmer partnerships, funding, compliance |
| Operations lead | | Hubs, drivers, SOPs, pilot execution |
| Backend lead | | Core API, DB, realtime, payments, integrations |
| Frontend lead | | Four dashboards, PWA, maps, i18n |
| **ML lead (you)** | | Price/demand/procurement models, stock suggestions, rebalancing, ETA, LLM features, MLOps |
| Routing/optimisation | (backend + ML) | OSRM, OR-Tools, hub placement |
| UI/UX designer | | Design system, farmer-friendly flows, Kannada UX |
| QA / DevOps | (shared) | CI/CD, testing, monitoring, deployment |

**Collaboration rhythm**
- Weekly planning (30 min) + mid-week sync (15 min) + demo Friday.
- One board (GitHub Projects/Trello/Notion) with Sprint, Backlog, Blocked.
- Docs updated with every behaviour change.

## 2. Phases and milestones

| Phase | Weeks | Goal | Exit criteria |
|---|---|---|---|
| 0. Discovery & setup | 0–2 | Validate need, finalise decisions, setup repo/accounts | 10+ farmer and 5+ buyer interviews; decision log §8 resolved; vendor applications started |
| 1. MVP build | 2–10 | Four dashboards + core flows + basic routing + ML v0 | End-to-end flow works on staging with test data |
| 2. Dry-run | 10–12 | Operational rehearsal | Pilot-week test plan passed (see `09_OPERATIONS_SOP.md` §15) |
| 3. Pilot | 12–24 | Run real orders with 20–40 farmers, 5–10 buyers | On-time ≥ 90%, wastage ≤ 5%, positive learning on margin |
| 4. Optimise | 24–40 | ML in production, route tuning, cost cuts, credit | Contribution/kg > 0; forecast metrics stable |
| 5. Scale | 40+ | More hubs/districts | Replicable playbook, funding secured |

## 3. Sprint plan (MVP build, 2-week sprints)

| Sprint | Backend | Frontend | ML | Ops/Business |
|---|---|---|---|---|
| S1 | Repo, auth (OTP/JWT), RBAC, schema v1, crops/hubs seed | Next.js scaffold, design tokens, i18n, auth screens | Data ingestion (Agmarknet, weather), EDA | Interviews, choose pilot villages/buyers, entity/licence research |
| S2 | Farmers/buyers/listings/orders APIs, settings | Farmer listing+threshold, buyer catalog/cart/order | Baselines for price; feature pipeline | Vendor onboarding (SMS, payments, calling), hub candidates |
| S3 | Hubs, stock status, ledger, transfers | Admin hubs matrix (3 buttons), transfers board | LightGBM quantile price model v1 | Quotes: vehicles, scales, crates; budget sheet |
| S4 | Dispatch, trips, stops, receipts | Admin dispatch UI, driver trip + receipt screens | Price API + backtests; demand v0 (declared) | Driver/hub staff recruitment plan, SOP drafts |
| S5 | WS tracking, ETA, masked calling, notifications | Live maps for buyer/farmer/admin, call buttons | Procurement recommender; stock suggestion rules | Training materials (Kannada) |
| S6 | Routing service (OR-Tools+OSRM), optimize API | Route preview/edit UI | Integrate forecasts into admin; shadow mode | Dry-run planning |
| S7 | Settlements, payouts (test), reports | Payments screens, admin reports/KPI | Rebalancing suggestions; anomaly rules | Pilot-week execution |
| S8 | Hardening, perf, security review, backups | PWA/offline polish, accessibility, E2E tests | LLM listing parser + daily brief | Go/No-go review |

## 4. Definition of Done (feature level)
- Meets acceptance criteria in the relevant doc section.
- Unit/integration tests pass; critical path has E2E test.
- Works on low-end Android + slow 3G profile (frontend).
- Kannada + English strings present.
- Logging/metrics added; errors handled with user-friendly messages.
- Documentation updated; migration scripts included.
- Security checks: authZ, input validation, rate limits.

## 5. KPIs and dashboards

| Area | KPI | Target (initial) |
|---|---|---|
| Supply | Active farmers/week, listing-to-pickup conversion | ≥ 70% conversion |
| Demand | Active buyers/week, repeat rate, avg order kg | Repeat ≥ 70% |
| Operations | On-time pickup, on-time delivery | ≥ 90% |
| Quality | Rejection %, buyer complaint rate | Reject ≤ 5% |
| Waste | Wastage % of kg handled | ≤ 5% |
| Fill rate | Delivered / ordered | ≥ 92% |
| Efficiency | km/kg, vehicle utilisation | Utilisation ≥ 65% |
| Finance | Contribution/kg, days sales outstanding, farmer payout time | Contribution > 0 by month 4; payout ≤ 24 h |
| ML | Price-band coverage (target ~80%), p50 MAPE, demand WAPE, stock-status agreement | Track weekly |
| Network | Hub stock-outs per week, transfers completed on time | Decrease trend |
| Trust | Farmer NPS, buyer NPS | Positive and rising |

## 6. Testing strategy

| Layer | Tests |
|---|---|
| Backend | pytest unit + API integration; state-machine tests (trip, order, transfer); idempotency tests |
| DB | Migration tests; constraints; sample data seeds |
| Frontend | Vitest/RTL components; Playwright E2E for 4 core journeys (list → order → assign → pickup → deliver) |
| Routing | Synthetic instances, constraint checks, regression on benchmark set |
| ML | Walk-forward backtests, data quality tests, drift monitors, shadow mode before exposure |
| Load | Simulate 50 vehicles pinging every 5–10 s; 200 WS clients |
| Field | Weak-network tests, GPS drift, battery drain, outdoor readability |
| Security | Auth tests, OWASP checks, dependency scanning |

**Critical E2E journey:** Farmer lists → buyer orders → admin sees pool → assigns driver → driver picks up and enters kg → hub receives → delivery → buyer confirms → settlement draft.

## 7. Risk and dependency tracker

| Item | Dependency/lead time | Mitigation |
|---|---|---|
| SMS DLT registration | Weeks | Apply in Sprint 1; use WhatsApp/email dev fallbacks |
| Payment gateway KYC and payouts activation | Weeks | Start early; use test mode; manual UPI for pilot if delayed |
| Masked calling provider onboarding | Weeks | Start early; fallback `tel:` with admin number |
| Agmarknet data gaps/API changes | Unknown | Cache raw data; multiple sources; baselines |
| Driver GPS reliability in PWA | Technical | Foreground mode + wake lock; plan native app |
| Licences (APMC/FSSAI/GST) | Weeks | Consult advisor in Phase 0; partner with licensed entity |
| Funding/working capital | Time | Pilot small; prepaid buyers; scheme research |
| Team availability (exams/semester) | Schedule | Buffer sprints, clear owners, handover notes |

## 8. Decision log (resolve early; record outcome and date)

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Minimum threshold meaning | 3 kg (notebook) vs per-farmer 20–50 kg + route min payload | Use per-farmer min + route min payload; tune from pilot data | Open |
| D2 | Business model | Consignment vs fixed-price | Consignment for pilot | Open |
| D3 | Legal structure/licences | Pvt Ltd / FPO partner / Section 8 | Consult CA; partner with licensed entity for pilot | Open |
| D4 | Pilot villages and hub sites | Kolar, Chikkaballapur, Doddaballapur, Hoskote… | Choose where team has contacts; ≥ 20 farmers within 10 km | Open |
| D5 | Vehicles | Hire vs buy | Hire first | Open |
| D6 | Maps stack | MapLibre+OSRM vs Google | MapLibre+OSRM; abstraction layer for swap | Open |
| D7 | Driver app | PWA vs native | PWA for prototype, native for production | Open |
| D8 | Payments | Prepaid only vs credit | Prepaid first; credit after 2–4 weeks | Open |
| D9 | Organic vs inorganic | Separate SKUs/prices | Separate SKUs; certification rules needed | Open |
| D10 | Stock button semantics | Thresholds per crop | Days-of-cover rule; tune per crop | Open |
| D11 | Who can change stock status | Hub staff vs admin | Hub staff for own hub; admin all; everything logged | Open |
| D12 | Cutoff times | 18:00/20:00 | Test in pilot; adjust to farm routines | Open |
| D13 | Data ownership/privacy policy | Consent text, retention | Draft with advisor before pilot | Open |
| D14 | Hosting | VM vs managed | VM + managed DB when funds allow | Open |

## 9. Open questions for the team
1. Which crops make up the first 10–15 SKUs?
2. Do we have commitments from buyers (names, volumes)?
3. Who owns each village relationship (a person who knows the farmers)?
4. What is the total starting budget and runway?
5. Is the college or any incubator able to provide space, mentorship, or legal support?
6. How will quality disputes be arbitrated fairly (farmer vs buyer)?
7. What happens to unsold stock (secondary buyers, processing, donation)?
8. Who is on-call during early-morning operations?

## 10. Communication and reporting
- **Daily:** ops WhatsApp group (summary at close: kg, delays, issues).
- **Weekly:** operations review (see `09_OPERATIONS_SOP.md` §16) + product/engineering demo.
- **Monthly:** metrics pack and decision log review; share learnings with farmer community.

## 11. Post-pilot expansion checklist
- [ ] Contribution/kg positive 4+ consecutive weeks
- [ ] Wastage ≤ 5%, on-time ≥ 90% sustained
- [ ] Playbook documented (hub setup kit, hiring, training)
- [ ] ML models stable with monitoring
- [ ] Working capital and funding plan for next hubs
- [ ] Compliance in place for new districts
- [ ] Hub-in-a-box template: equipment list, layout, staffing, SOPs, software config
