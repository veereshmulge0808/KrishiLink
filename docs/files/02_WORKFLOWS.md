# 02 — End-to-End Workflows

This is the operational "story" of the platform: who does what, when, what the system does, and what can go wrong.

---

## 1. Actors

| Actor | Where | Responsibility |
|---|---|---|
| Farmer | Farm / village | Declares available produce, sets minimum threshold, hands produce to driver |
| Buyer | Restaurant/wholesaler/etc. | Orders quantity, receives delivery, pays |
| Driver | Vehicle | Executes admin-assigned trips; records kg received/delivered |
| Hub staff | Mini/main hub | Receive, weigh, sort, grade, pack, update stock status |
| Admin (ops) | Office/main hub | Control tower: assigns drivers, resolves exceptions, manages hubs, prices, payments |
| System | Backend + ML | Forecasts, route suggestions, notifications, ledger, tracking |

## 2. Master daily timeline (target; validate in pilot)

| Time | Event | Owner |
|---|---|---|
| D-1 16:00 | Price ranges published (ML + admin review) | Admin/ML |
| D-1 by 18:00 | Farmers list what is ready (cutoff) | Farmer |
| D-1 by 20:00 | Buyers place orders (cutoff) | Buyer |
| D-1 20:00–21:00 | Supply/demand reconciliation, stock status review, transfer decisions | Admin |
| D-1 21:00–22:00 | Route plan generated, reviewed, **drivers assigned** | Admin |
| D-1 22:00 | Drivers and farmers notified (push/SMS/WhatsApp) | System |
| D 03:30–06:30 | First-mile pickups | Driver |
| D 06:00–07:30 | Middle mile: village hub → main hub (when applicable) | Driver |
| D 07:00–08:30 | Receive, weigh, sort, grade, pack per order | Hub staff |
| D 08:00–10:00 | Last-mile delivery | Driver |
| D 10:00–12:00 | Close day: confirmations, returns, variance review | Admin |
| D+1 | Farmer payout, buyer invoicing/collection | System/Admin |

> The notebook target is "complete by 9:00 am, max 10:00 am". The timetable above is deliberately tight: test with a trial week and adjust cutoffs.

## 3. Onboarding workflows

### 3.1 Farmer onboarding
1. Field agent or farmer enters phone → OTP verification.
2. Language selection (Kannada default).
3. Capture: name, village, **location pin** (GPS or map drop), nearest hub (auto-suggest), crops commonly grown, land size (optional), bank/UPI for payout (verified).
4. Set default **minimum threshold** (kg) (admin recommends a default).
5. Short voice/visual tutorial.
6. Admin approves account (KYC light).

### 3.2 Buyer onboarding
1. Phone OTP → business name, type, GSTIN (optional), delivery address + pin.
2. Preferred delivery slot(s), typical weekly needs (feeds ML cold start).
3. Payment mode: prepaid (default) or credit application.
4. Admin approval + assignment to nearest delivery hub.

### 3.3 Driver onboarding (admin creates)
1. Admin creates driver: name, phone, licence, vehicle assignment.
2. Driver installs PWA/app, logs in by OTP.
3. Test trip with dummy route; confirm GPS + receipt entry.

### 3.4 Hub onboarding
1. Admin creates hub (type, location, parent hub, capacity, staff).
2. Initial stock status per crop (default OUT).
3. Staff accounts and roles.

## 4. Farmer workflow ("What I have today")

```
Open app → pick crop icon(s) → enter approx kg → choose ready-by time → Submit
   ↓
Validation: kg ≥ crop threshold?
   ├─ NO  → "Too small for a pickup today" (listing saved as ineligible; may be merged by admin)
   └─ YES → Listing = ELIGIBLE → appears in admin dispatch pool
   ↓
After assignment: Pickup screen shows driver map + ETA + call
   ↓
At pickup: driver weighs, enters kg, farmer confirms (tap/OTP)
   ↓
Next day: payout notification
```

**Rules**
- Cutoff for listing: configurable (default 18:00 D-1). Edits allowed until cutoff.
- **Threshold**: per-farmer default + optional per-crop override. System also applies a **route-level minimum payload** (admin setting) for dispatch economics.
- Under-supply at pickup: actual weighed kg prevails; no penalty for first offence, reliability score updated.
- No-show by farmer: driver marks "farmer not available" after waiting X min (default 10) and calling twice.

## 5. Buyer workflow (Blinkit-style)

```
Search/browse crops → add quantity (kg or crate) → choose delivery slot
→ review price range & locked price rule → place order (prepaid/credit)
→ order CONFIRMED (or PARTIAL/SUBSTITUTE flagged)
→ OUT_FOR_DELIVERY: live map + ETA + masked call
→ DELIVERED: confirm quantity/quality (OTP or tap), raise issue if needed
```

**Rules**
- Cutoff for next-day orders: default 20:00 D-1; same-day orders only if stock status = SUFFICIENT at serving hub.
- **Minimum order quantity** per crop (e.g., 10 kg) configurable.
- **Price handling**: buyer sees p10–p90 range and a **locked price at order confirmation** (rule: price = min(forecast p90, hub reference price at confirm)); changes beyond p90 need admin approval and buyer notification.
- **Allocation**: if supply < orders, allocate by priority: standing buyers → earlier order time → larger/credit-worthy → pro-rata. Offer **substitutes** (similar crop) or partial fill.
- **Rejection window**: buyer reports issues at delivery (photo + reason). Admin decides credit/replace.

## 6. Admin daily workflow

1. **Morning/evening dashboard review**: orders, supply listings, hub stock status, forecasts.
2. **Reconcile** demand vs supply per crop; confirm procurement suggestions from ML.
3. **Check hub stock buttons** (🔴/🟡/🟢) — review system suggestions vs staff-set.
4. **Handle transfers** (see §8).
5. **Generate routes** → review → adjust → **assign driver + vehicle** per trip.
6. **Monitor trips live**: started, reached farm, picked, at hub, delivering, returned.
7. **Handle exceptions** (delays, breakdown, shortfall, rejection).
8. **Close day**: verify variances, confirm deliveries, approve settlements.
9. **Publish next-day price ranges** (accept ML or override with reason).

## 7. Dispatch and trip workflow (admin-assigned)

```
Admin selects pending pickups/deliveries → system proposes clusters/routes
→ Admin edits (reorder/merge/split) → picks driver + vehicle → CONFIRM
→ Backend creates trip + stops → pushes to driver app (WS + FCM) → notifies farmers/buyers
```

### 7.1 Trip state machine
```
ASSIGNED ─► ACKNOWLEDGED(optional) ─► STARTED ─► (per stop) ARRIVED_STOP ─► PICKED/DELIVERED
   │                                                      │
   │                                                      └─► next stop … ─► AT_HUB ─► RETURNED ─► CLOSED
   └─► CANCELLED (admin)       any state ─► INCIDENT (breakdown, accident) ─► REASSIGNED
```

### 7.2 Stop state machine
`PLANNED → EN_ROUTE → ARRIVED → IN_PROGRESS (weighing/handover) → COMPLETED | SKIPPED(reason)`

### 7.3 Driver steps at a farm
1. Press **Arrived** (geofence 150 m check; admin override allowed).
2. Weigh produce on portable scale (or farm scale).
3. Enter **crop + kg** (multiple lines allowed), grade (A/B), optional photo.
4. Farmer confirms (tap/OTP/SMS).
5. Press **Picked**; navigate to next stop.

### 7.4 Driver steps at hub
1. Press **Reached hub** → hub staff weigh again → hub kg recorded.
2. **Variance = hub kg − driver kg**; flagged if |variance| > 2% (configurable).
3. Stock ledger updated; hub stock status suggestion recalculated.

### 7.5 Last mile
1. Load per orders (packing list from admin/hub).
2. Start trip; buyer sees live map + ETA.
3. At buyer: unload, buyer confirms qty (OTP/tap), record rejections.
4. Return to hub; admin marks **CLOSED**.

### 7.6 Live tracking and admin visibility
- Driver app sends GPS every 5–10 s (batched when offline).
- Admin map shows every vehicle with trip status, ETA delta (planned vs predicted), and alerts if stopped > N minutes or off-route.
- "Reached destination" auto-detected by geofence; "Returned" when vehicle re-enters hub geofence.

## 8. Hub stock status and inter-hub transfers

### 8.1 Three-button stock status (per hub, per crop)
| Status | Meaning | Default rule (days of cover) |
|---|---|---|
| 🔴 OUT | No sellable stock | stock ≈ 0 |
| 🟡 LOW | Will run out soon | < 1 day |
| 🟢 SUFFICIENT | Enough for forecast demand | ≥ 1 day (≥ 1.5 for perishables) |

- Staff press the button; the **ledger-based suggestion** appears next to it. Disagreements are logged.
- Status change events broadcast to admin dashboard and to other hubs' views.

### 8.2 Transfer (inter-hub request) flow
```
Hub A marks crop LOW/OUT  → system creates a SUGGESTED request
→ lists hubs with 🟢 for that crop (nearest first, with ETA)
→ Admin (or hub manager if permitted) selects donor hub + kg
→ Donor hub confirms availability (or auto-confirms if 🟢)
→ Admin assigns driver/vehicle → transfer trip
→ Receiving hub confirms kg → ledger moves stock → statuses update
```
Transfer states: `SUGGESTED → REQUESTED → APPROVED → ASSIGNED → IN_TRANSIT → RECEIVED | REJECTED | CANCELLED`.

**Rules**
- Donor must stay ≥ LOW after transfer (don't create a new shortage) unless admin overrides.
- Perishability limit: don't transfer leafy greens across long distances (> X hours).
- Cost check: transfer allowed if shortage penalty > transfer cost.

## 9. Hub receiving, sorting, packing

1. Receive load → weigh each crop crate/lot → record hub kg.
2. Quality check: visual grade A/B/reject (see SOP), photo for rejects.
3. Sort into crates by crop and grade.
4. Create **pick list per order** (system-generated) → pack, label with order ID.
5. Move chilled items to cold room if applicable.
6. Update stock ledger and stock status buttons.
7. Handover to last-mile driver with signed manifest.

## 10. Settlement workflow

**Farmer payout**
1. After hub verification, system computes: `accepted_kg × realised_price × (1 − commission) − logistics_share`.
2. Admin reviews exceptions (variance, rejections).
3. Payout initiated (UPI/bank) on D+1; farmer gets notification and statement.

**Buyer billing**
1. Delivery confirmation → invoice generated.
2. Prepaid: reconcile. Credit: due date reminders, ageing.
3. Adjustments for rejections (credit note).

**Ledger** is double-entry (see `04_DATABASE_SCHEMA.md`): farmer payable, buyer receivable, commission income, logistics income, wastage expense.

## 11. Exception handling playbook

| Exception | Detection | Immediate action | System support |
|---|---|---|---|
| Farmer under-supplies | Weighed kg < listed | Record actual; adjust orders; notify buyer; substitute | Auto re-allocation suggestion |
| Farmer not available | Driver marks no-show | Skip stop; try nearest backup farmer | Reliability score update |
| Vehicle breakdown | Driver taps Incident or GPS stall | Admin reassigns remaining stops to nearest driver | "Reassign stops" tool |
| Delay vs ETA | Predicted ETA > slot | Notify buyers; reprioritise stops | Delay alerts |
| Weight variance > tolerance | Hub vs driver kg | Admin investigates; photos; recheck | Variance report |
| Buyer rejection | Buyer marks issue | Photo review; replace/credit; log wastage | Claim workflow |
| Stock-out at hub | Status OUT/ledger 0 | Transfer or substitute | Transfer suggestion |
| Price spike beyond band | Reference price > p90 | Admin approval; notify buyers | Price alert |
| App/network outage | No pings | Call driver; WhatsApp fallback | Offline queue + SMS |
| Payment failure | Gateway callback | Retry; manual payout | Retry queue |

## 12. Notification matrix

| Event | Farmer | Buyer | Driver | Admin | Channel |
|---|---|---|---|---|---|
| Price range published | ✔ | ✔ |  |  | Push/SMS |
| Listing accepted/ineligible | ✔ |  |  |  | Push |
| Order confirmed/partial | | ✔ |  | ✔ | Push |
| Driver assigned | ✔ | ✔ | ✔ |  | Push + SMS |
| Driver arriving (≤10 min) | ✔ | ✔ |  |  | Push |
| Pickup completed | ✔ |  |  | ✔ | Push |
| Out for delivery | | ✔ |  | ✔ | Push |
| Delivered | | ✔ |  | ✔ | Push |
| Payout done | ✔ |  |  |  | Push + SMS |
| Stock LOW/OUT | | | | ✔ (+ other hubs) | Dashboard + push |
| Delay/incident | | ✔ | ✔ | ✔ | Push |

## 13. Business rules summary (configurable in admin settings)

| Rule | Default |
|---|---|
| Listing cutoff | 18:00 D-1 |
| Order cutoff | 20:00 D-1 |
| Farmer min threshold | admin default per crop (notebook mention: 3 kg; recommended higher, decide) |
| Route min payload | e.g., 150 kg (tune by cost) |
| Variance tolerance | 2% |
| Geofence for arrival | 150 m |
| Farmer no-show wait | 10 min, 2 calls |
| Buffer on procurement | 10–15% |
| Min order qty | per crop |
| Max stop dwell time | 10–15 min |
| Credit limit | per buyer |
