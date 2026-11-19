# 09 — Operations: Standard Operating Procedures (SOPs)

Practical, on-the-ground procedures for the physical network. Adjust after the first pilot week. Quality thresholds below are **starting points**; calibrate with buyers.

---

## 1. Roles on the ground

| Role | Key duties |
|---|---|
| Ops admin (office) | Assign drivers, monitor trips, handle exceptions, close the day |
| Hub manager (main hub) | Receiving, sorting, packing, stock status, hub safety, staff |
| Village hub keeper | Aggregation, weighing, crate handling, farmer support |
| Driver | Safe driving, accurate weighing/recording, customer courtesy |
| Field agent | Farmer onboarding, trust-building, app help, dispute first-response |
| Quality checker | Grading, rejects, photos, claims review |
| Accounts | Settlements, payouts, invoices, credit follow-up |

## 2. Equipment checklist

| Item | Where | Notes |
|---|---|---|
| Certified weighing scales (platform + hanging/portable) | All hubs, each pickup vehicle | Calibrate/seal; legal metrology compliance |
| Crates (ventilated plastic) | All | Colour-code by crop/grade; wash daily |
| Tarpaulins/shade nets | Village hubs, vehicles | Protect from sun/rain |
| Smartphones with data + power banks | Drivers, hub staff | App + GPS |
| Thermometer/hygrometer | Main hub, cold room | Log twice daily |
| Cold room (optional) | Main hub | 1–2 day holding only |
| Hand trolley/pallet jack | Hubs | Reduce handling damage |
| First-aid kit, fire extinguisher | Hubs, vehicles | Safety |
| Packing: liners, labels, markers/QR stickers | Main hub | Order labels |
| Spare scale weights | Main hub | Calibration checks |

## 3. Farmer onboarding SOP

1. Field agent visits with phone; explains: pickup, weighing, payout timeline, commission, rejection policy.
2. Capture: name, phone, village, **GPS pin standing at the farm gate**, crops, usual quantities, UPI ID.
3. Verify UPI with a ₹1 test or name match (via payment provider).
4. Set **minimum threshold** together; explain "below this, driver won't come".
5. Install app/PWA; do a mock listing together; show the pickup screen and call button.
6. Add farmer to nearest village hub.
7. Give a simple Kannada card: cutoff time (6 pm), how to list, helpline number.
8. First-pickup follow-up call after 24 h.

**Trust rules:** weigh in front of the farmer; show kg on the phone; farmer confirms; pay on time. Handle every dispute within 24 h.

## 4. Buyer onboarding SOP

1. Sales visit; understand weekly needs per crop, quality expectations, slots.
2. KYC: business name, contact, address pin, GSTIN if available.
3. Payment mode: **prepaid** for first 2 weeks; credit only after review.
4. Trial order; collect feedback next day.
5. Explain rejection process (report at delivery, photo within 30 min).
6. Offer standing order schedule.

## 5. Daily operations checklist

### Evening (D-1)
- [ ] Price range published and sanity-checked
- [ ] Farmer listings reviewed; ineligible/low listings handled
- [ ] Orders reviewed; allocation/substitutions decided
- [ ] Hub stock statuses (🔴🟡🟢) reviewed; transfers created
- [ ] Routes generated, edited, **drivers assigned**
- [ ] Driver briefing sent (start time, stops, hub, special notes)
- [ ] Vehicles fuelled/checked; crates counted and loaded
- [ ] Staff roster confirmed for hubs

### Early morning (D)
- [ ] Driver check-in (start trip) by planned time
- [ ] Monitor first pickups; call if no movement after 10 min of planned start
- [ ] Village hub receives, weighs, crates; trucks depart
- [ ] Main hub receives, weighs, sorts, packs per order
- [ ] Cold room loaded as needed; temperature logged
- [ ] Last-mile loading verified against manifest
- [ ] Deliveries tracked; delays communicated

### Close (late morning)
- [ ] All stops completed/skipped with reasons
- [ ] Variance report reviewed (driver vs hub kg)
- [ ] Rejections/claims logged
- [ ] Wastage recorded in ledger
- [ ] Stock statuses updated
- [ ] Day report: kg in/out, on-time %, wastage %, margin estimate

## 6. Driver SOP

**Before trip**
- Check vehicle (tyres, fuel, lights), carry scale, crates, ID, charged phone, power bank.
- Open app → confirm today's trip and stop list.

**At farm**
1. Press **Arrived** within the geofence; greet; call if farmer not visible.
2. Weigh each crop separately (tare crates); read weight aloud to farmer.
3. Do a quick visual grade; reject obviously damaged (agree with farmer, record separately).
4. Enter crop, kg, grade in the app; get farmer confirmation.
5. Load carefully (heavy at bottom, leafy on top/ventilated crates); cover from sun.
6. Press **Picked**; proceed.

**Waiting rule:** wait up to 10 min and call twice; then mark "Farmer unavailable" and tell admin.

**Driving:** follow traffic rules; no phone use while driving; report incidents immediately via app/call.

**At hub:** park at designated bay, press **Reached hub**, assist unloading, witness hub weigh-in, sign/confirm variance note.

**Last mile:** deliver per manifest, present items, get buyer OTP/confirmation, record rejections with photo, never negotiate prices (refer to admin).

**Prohibited:** carrying personal goods, unauthorised stops, cash dealings (unless an approved COD process exists), skipping weighing.

## 7. Village hub SOP

1. Open hub 30 min before first truck/farmer drop.
2. Weigh incoming lots on the platform scale; record per farmer (app or paper fallback → entered by evening).
3. Sort by crop and grade; place in labelled crates; keep leafy greens shaded and wet-cloth covered if needed.
4. Update stock status buttons if relevant to the village hub.
5. Load middle-mile truck; verify manifest totals.
6. Clean hub area, wash crates, dispose rejects properly (compost/feed arrangement).

## 8. Main hub receiving and packing SOP

1. **Receive:** truck arrives → verify trip ID, seal/manifest, time → unload.
2. **Weigh:** weigh crop lots; record `kg_hub`; app calculates variance vs driver kg.
3. **Variance policy:** within ±2% OK; over 2% → recheck, photo, note, admin alert.
4. **Quality grading:** see §9 standards; photograph rejects.
5. **Store:** non-cold crops on racks (off the floor); cold-chain crops in cold room (if available) immediately.
6. **Pick & pack:** system prints/shows pick list per order; weigh packed quantity (±1% tolerance), label with order ID, buyer, crop, weight, time.
7. **Dispatch:** load by delivery sequence (last stop loaded first); sign manifest with driver.
8. **Update ledger and stock status** (staff press 🔴/🟡/🟢; compare with system suggestion).
9. **End of day:** reconcile stock; record wastage with reason codes.

## 9. Quality grading standards (draft)

| Grade | Definition (example for tomato) | Handling |
|---|---|---|
| A | Uniform size, firm, no cracks/bruises, correct ripeness | Premium buyers, full price |
| B | Minor blemishes, mixed size, slightly over/under-ripe | Cost-sensitive buyers, discount |
| REJECT | Rotten, cracked/leaking, severe damage, pests | Not paid / reduced pay; waste or secondary use |

- Write crop-specific cards with **photos** for tomato, onion, potato, carrot, beans, cabbage, cauliflower, brinjal, chilli, capsicum, leafy greens.
- Calibrate grading with 2–3 pilot buyers; publish the accepted tolerance (e.g., reject ≤ 5%).
- Organic produce: separate storage, labels, documentation; don't claim "organic" without proof/certification.

## 10. Cold chain and shelf-life guidelines (starter)

| Category | Typical handling | Max hold at hub (aim) |
|---|---|---|
| Leafy greens | Shade, damp cloth/liner, cold room if possible | < 24 h |
| Tomato (ripe) | Cool, ventilated, avoid stacking high | 1–2 days |
| Roots (onion, potato) | Dry, ventilated, not near moisture | Several days (stock-able) |
| Beans, capsicum, brinjal | Cool, ventilated | 1–2 days |
| Fruits | Per fruit; avoid ethylene mixing | Varies |

Log temperature/humidity for cold room; first-in-first-out (FIFO) with labels showing receipt time.

## 11. Payments SOP

**Farmer**
1. Next-morning settlement run: system lists farmers with accepted kg, price, deductions.
2. Accounts verifies exceptions (variance, rejects, disputes).
3. Approve → payout via gateway → notification + statement.
4. Failed payout → retry, call farmer, manual fix within 24 h.

**Buyer**
- Prepaid: confirm payment before dispatch.
- Credit: invoice on delivery; reminders at due-3, due, due+3; stop supply beyond limit.

**Cash handling:** avoid cash; if unavoidable, double-count, two-person rule, deposit daily, log in ledger.

## 12. Incident and complaint handling

| Incident | Owner | Time to respond | Steps |
|---|---|---|---|
| Vehicle breakdown | Ops admin | Immediate | Move load to nearest vehicle, notify buyers/farmers, update trip |
| Accident/injury | Ops admin + manager | Immediate | Safety first, medical help, insurance, report |
| Quality rejection | Quality checker + admin | Same day | Review photos, decide replace/credit, update farmer payout rule |
| Weight dispute (farmer) | Field agent | 24 h | Re-weigh evidence, photos, explain; adjust if error |
| Late delivery | Ops admin | Real time | Call buyer, offer alternatives, log cause |
| Payment failure | Accounts | 24 h | Retry, manual transfer, communicate |
| Theft/fraud suspicion | Hub manager | Same day | Preserve evidence, suspend access, investigate |

Keep an **incident log** (date, type, cause, action, cost) and review weekly to find patterns.

## 12.1 Escalation matrix
1. Driver/hub staff → Ops admin (phone).
2. Ops admin → Operations lead/founder (unresolved > 30 min or financial impact > threshold).
3. Legal/safety events → founder + advisor immediately.

## 13. Training plan

| Group | Content | Duration |
|---|---|---|
| Drivers | App use, weighing, grading basics, safety, customer behaviour | 1 day + 2 supervised trips |
| Hub staff | Receiving, sorting, FIFO, packing, stock buttons, hygiene | 1–2 days |
| Field agents | Onboarding script, trust, payouts explanation, basic troubleshooting | 1 day |
| Admin/ops | Dashboard, dispatch, exceptions, reports | 2 days + shadowing |

Provide **Kannada pocket guides** and short videos; run a weekly 20-minute huddle.

## 14. Hygiene and safety
- Hand washing, clean crates, no eating in sorting area, covered food storage.
- Pest control at hubs; waste bins; drainage maintained.
- Heat protection for staff; PPE for lifting; first-aid training.
- Vehicle cleanliness; no mixing with chemicals/fuel.

## 15. Pilot-week test plan (before going live)

| Day | Test |
|---|---|
| 1–2 | Dry run with dummy orders: app flows, routes, weighing, receipts |
| 3 | Pickup run with 5 friendly farmers; measure timing per stop |
| 4 | Full chain to 2 trial buyers; measure on-time and quality |
| 5 | Review variance, wastage, payments; fix process gaps |
| 6–7 | Repeat with more farmers/buyers; tune cutoffs and thresholds |

Record: time per stop, kg per vehicle, fuel/km, cost/kg, grade mix, rejection %, farmer/buyer feedback.

## 16. Weekly operations review (template)
- Volumes (kg in/out), wastage %, on-time %, fill rate
- Cost/kg and contribution/kg
- Top 5 incidents and fixes
- Farmer/buyer NPS or feedback highlights
- Stock status accuracy (manual vs system)
- Forecast accuracy (price coverage, demand WAPE)
- Next-week actions with owners
