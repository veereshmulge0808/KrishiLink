# 06 — ML Plan (part of the Farmer Logistics docs set; see ../README.md)

Owner: ML lead. Goal: make the business **lose less money** (price risk, wastage, shortages, late trips). Keep models simple, measurable, and shippable before fancy.

---

## 0. Model portfolio & priority

| # | Model | Output | Needs own data? | Priority |
|---|---|---|---|---|
| 1 | **Price range forecaster** | p10 / p50 / p90 ₹/kg per crop for tomorrow | No (public mandi data) | **P0** |
| 2 | **Demand forecaster** | kg per hub per crop per day (with quantiles) | Cold start; needs your orders | **P0** |
| 3 | **Procurement recommender** | kg to collect tomorrow (newsvendor) | Uses 1 + 2 | **P0** |
| 4 | **Stock status suggester** | OUT/LOW/SUFFICIENT from ledger + forecast | Rule-based first | P1 |
| 5 | **Inter-hub rebalancing** | which hub sends how many kg to which | Uses 2 + stock | P1 |
| 6 | **Route optimisation** | stop order, vehicle assignment | Not ML (OR-Tools) | P0 (shared w/ backend) |
| 7 | **ETA model** | corrected arrival time | Needs GPS history | P2 |
| 8 | **Supply/arrival forecaster** | expected harvest availability per village | Partly public | P2 |
| 9 | **Quality grading (CV)** | A/B/reject from photo | Needs images | P3 |
| 10 | **Anomaly detection** | weight variance, fraud, delays | Your ledger | P2 |
| 11 | **LLM layer** | Kannada listing parsing, admin assistant, daily brief | No training | P1 |

---

## 1. Data sources (verify availability and licences)

**Prices & arrivals**
- **Agmarknet** (Govt. of India) daily mandi price + arrivals — also exposed via data.gov.in APIs. Pull Bengaluru-area mandis (e.g., Bangalore/Yeshwanthpur, Kolar, Chikkaballapur, Ramanagara, etc. — check exact market names in the dataset).
- **KSAMB / Raitamitra** (Karnataka agri marketing) and **eNAM** for additional price points.
- Optional: HOPCOMS retail price lists, Kisan/other APIs.

**Weather**
- **Open-Meteo** (free historical + forecast), or IMD data. Collect for source districts (Kolar, Chikkaballapur…) **and** Bengaluru.
- Features: rainfall (mm), rain-days, max/min temp, humidity, lagged and rolling, **forecast** for tomorrow.

**Calendar**
- Day of week, month, festival/holiday (Indian + Karnataka: Ugadi, Dasara, Diwali, Ganesh Chaturthi, Sankranti…), wedding-season flags, school/college term (hostel demand), IPL/event days for restaurants (optional).

**Your own data (gold, start logging from Day 1)**
- Orders (qty per buyer per crop per day), stock ledger, listings, prices at which you bought/sold, rejections, wastage, trip times, GPS pings.

> Rule: **log everything from the prototype** even if the dashboard doesn't use it. Your future models depend on it.

---

## 2. Model 1 — Price range forecaster

**Why a range:** notebook says prices are volatile; farmers and buyers need a band, not a point.

**Target:** modal (and min/max) price per crop per market for day `t+1`.

**Features**
- Lags of price: 1, 2, 3, 7, 14, 28 days; rolling mean/std (7, 14, 30), price momentum.
- Arrivals (quantity) lags and rolling; arrival change vs 7-day mean.
- Weather: rain last 1–7 days in source districts, forecast rain tomorrow, temperature.
- Calendar: dow, month, festival flags, days-to-festival.
- Crop attributes: perishability class, seasonality index.
- Cross-crop signals: tomato price vs onion/potato (substitution), if useful.

**Models (build in this order)**
1. Baselines: **naive** (yesterday), **seasonal naive** (same weekday last week), moving average.
2. **LightGBM quantile regression** (objective `quantile`, alphas 0.1/0.5/0.9) — one global model across crops with crop as categorical, or one per crop for the top ~15 crops.
3. Optional: **Prophet/SARIMAX** per crop as a feature or benchmark; **conformal prediction** on top of the median model to guarantee interval coverage.
4. Later: temporal deep models (TFT / N-BEATS) only if you have lots of data and baselines are beaten clearly.

**Validation**: **walk-forward (rolling-origin) CV** — never random split. Hold out the last 3–6 months.
**Metrics**: **pinball loss** (per quantile), **interval coverage** (target ≈ 80% for p10–p90), **MAPE/MAE of p50**, interval width, and "directional accuracy" for up/down. Compare against baselines per crop.

**Business metric**: % days the realised sale price fell inside the quoted band; ₹ saved vs naive.

**Output API**
```json
GET /ml/price-range?crop=tomato&date=2026-11-20&market=bengaluru
{ "crop":"tomato","date":"2026-11-20","p10":18,"p50":24,"p90":34,"unit":"INR/kg","confidence":"medium","model_version":"pr_v3" }
```

**Starter code sketch**
```python
import lightgbm as lgb, numpy as np, pandas as pd

def make_features(df):
    df = df.sort_values(["crop","date"])
    g = df.groupby("crop")["modal_price"]
    for l in (1,2,3,7,14,28):
        df[f"lag_{l}"] = g.shift(l)
    for w in (7,14,30):
        df[f"roll_mean_{w}"] = g.shift(1).rolling(w).mean().reset_index(0,drop=True)
        df[f"roll_std_{w}"]  = g.shift(1).rolling(w).std().reset_index(0,drop=True)
    df["dow"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    return df

QUANTS = {0.1:"p10", 0.5:"p50", 0.9:"p90"}
models = {}
for q,name in QUANTS.items():
    m = lgb.LGBMRegressor(objective="quantile", alpha=q, n_estimators=600,
                          learning_rate=0.03, num_leaves=31, subsample=0.8, colsample_bytree=0.8)
    m.fit(X_train, y_train, categorical_feature=["crop"])
    models[name] = m
# post-process: enforce monotonic p10<=p50<=p90 by sorting predictions per row
```

---

## 3. Model 2 — Demand forecaster

**Cold start reality:** you have no order history at the beginning. Plan in stages:

| Stage | Method |
|---|---|
| Day 0–2 weeks | **Buyer-declared standing needs** (ask each restaurant/wholesaler weekly kg per crop) + rule: `demand = declared × weekday factor` |
| 2 weeks–3 months | **Moving average + weekday seasonality** (ETS/Holt-Winters), per hub/crop, with shrinkage to category average for sparse items |
| 3+ months | **LightGBM** (Poisson/Tweedie or quantile) with features below |
| Later | **Hierarchical forecasting** (reconcile buyer → hub → city totals), intermittent-demand methods (Croston/TSB) for slow crops |

**Features**: weekday, weekly lag (t-7, t-14), rolling means, price (high price reduces demand), weather (rain reduces restaurant footfall / affects leafy demand), festival/holiday, month, number of active buyers, promotions.

**Outputs**: q10 / q50 / q90 kg per hub per crop per day.
**Metrics**: WAPE, pinball loss, bias, **fill-rate simulation** (would the forecast have avoided stockouts/wastage?).

**Use**: tells admin "expect higher demand Saturday/Monday" (notebook: weekly cycle) so they pre-stock.

---

## 4. Model 3 — Procurement recommender (newsvendor)

Perishables → classic **newsvendor** problem.

```
Cu = underage cost  = lost margin per kg if we are short  (≈ sell_price − buy_cost + goodwill penalty)
Co = overage cost   = loss per kg if unsold               (≈ buy_cost + handling − salvage_price)
critical_ratio = Cu / (Cu + Co)
Q* = F_demand^-1(critical_ratio)    # take that quantile of the demand forecast
Q_to_collect = max(0, Q* + safety_buffer − current_stock_available)
```
- Use the **demand quantiles** (q10/q50/q90, interpolate) to pick the quantile at the critical ratio.
- Crops with short life (leafy greens) → high `Co` → procure closer to confirmed orders. Hardy crops (onion, potato) → can hold.
- Output goes to admin as **"Suggested collection: X kg from Hub A, Y kg from Hub B"**, which feeds the route planner.

---

## 5. Model 4 — Stock status (three buttons) suggester

Human buttons: 🔴 OUT, 🟡 LOW, 🟢 SUFFICIENT.
System computes `days_of_cover = stock_kg / q50_demand_kg_per_day` and **suggests** a status:
```
OUT: stock_kg <= ε
LOW: days_of_cover < τ_low (default 1.0; tune per crop)
SUFFICIENT: otherwise
```
- Show suggestion next to the button; log disagreements (human vs system) to improve thresholds.
- Optional ML: classifier predicting "will stock-out before next replenishment" (features: stock, forecast, replenishment schedule) once there is data.

---

## 6. Model 5 — Inter-hub rebalancing

When hub A is LOW/OUT and others are SUFFICIENT:
- Candidates: hubs with surplus = `stock − expected_demand_until_next_replenishment`.
- Solve a small **transportation LP / greedy**: minimise `transfer_cost + shortage_penalty` subject to donor surplus, vehicle capacity, and time windows (freshness).
- Output: `{from_hub, to_hub, crop, kg, urgency}` → admin approves → becomes a **transfer task** → driver assigned.
- Tools: `scipy.optimize.linprog` or `pulp`/OR-Tools.

---

## 7. Routing (shared with backend)

Not ML but your team will need it:
- **OR-Tools VRP with time windows**, capacities, minimum payload; distance matrix from OSRM.
- ML adds: **ETA correction model** (Model 7): predict `actual_minutes / osrm_minutes` ratio using hour of day, day of week, weather, road segment type, vehicle type; trained from GPS pings.
- Use corrected travel-time matrix to re-solve routes; this reduces late deliveries.

---

## 8. Model 8 — Supply/arrival forecaster (later)
- Estimate how much each village will supply: crop calendar (sowing → harvest), rainfall, farmer listing history, reliability score.
- Output: expected kg per village per crop for the next 3–7 days → helps vehicle planning, and warns of gluts (when to push sales or add processing buyer).

---

## 9. Model 9 — Quality grading (computer vision, optional later)
- Phone photo at pickup/hub → class {A, B, reject} (tomato ripeness, bruising, leaf wilting).
- Start: collect photos with labels from hub staff for 1–2 months. Fine-tune a small CNN/**MobileNetV3 / EfficientNet-B0**; deploy on-device (TFLite) or server.
- Metric: per-class F1, confusion matrix; keep human override.

---

## 10. Model 10 — Anomaly detection
- Driver kg vs hub kg variance (z-score by driver/crop), unusual price entries, route deviation, trip delay prediction.
- Simple statistical rules first; Isolation Forest later.

---

## 11. LLM layer (reasoning/"features to be refined" in notebook)

Use an LLM (e.g., Claude via API) behind your backend, **with strict tool/schema boundaries**:
1. **Farmer voice/text listing in Kannada** → structured JSON `{crop, kg, ready_by}` (farmer says "ಇವತ್ತು 200 ಕೆಜಿ ಟೊಮೆಟೊ ಇದೆ"). Confirm back to the farmer before saving.
2. **Admin daily brief**: "Tomato likely to rise 15–25% tomorrow (heavy rain in Kolar); Hub South LOW on beans; suggested transfer…". Generated from model outputs, not invented.
3. **Natural-language admin queries** ("which hubs are low on onion?") → mapped to SQL/API calls via tool use (read-only).
4. **Explanations**: why the price band is wide today (volatility, rain, festival).
Guardrails: LLM never writes to DB directly without confirmation; numeric answers come from the models/DB, not generated from memory; log all prompts/responses.

---

## 12. Pipeline & MLOps

```
Agmarknet / Weather / Calendar ──ingest (daily cron/Celery)──► raw tables
                                   │
                         feature builder (SQL/pandas)
                                   │
        training job (weekly) ──► MLflow (metrics, params, artifacts, registry)
                                   │
        batch inference (daily 4 pm) ──► price_forecasts, demand_forecasts tables
                                   │
                         FastAPI ML service (/ml/*) ──► Core backend & dashboards
                                   │
        monitoring: forecast vs actual, drift, coverage, data freshness alerts
```
- **Batch-first** (daily forecasts) — real-time inference is unnecessary at the start.
- Version every model (`pr_v1`, `dem_v1`), keep **shadow mode** before showing predictions to users.
- Data quality checks: missing days in Agmarknet, outliers (unit errors), duplicates; forward-fill carefully and flag.
- Retrain: price weekly, demand weekly, ETA monthly. Alert if coverage of p10–p90 drops below ~70% for a week.
- Repo layout:
```
services/ml/
  data/ (ingest scripts)        features/        models/{price,demand,eta}/
  train/                        inference/       api/ (FastAPI)
  notebooks/                    tests/           mlflow/ (local tracking)
```

---

## 13. Suggested 12-week ML timeline

| Weeks | Tasks |
|---|---|
| 1–2 | Pull Agmarknet history (2–5 years), weather, calendar; EDA; choose top crops (tomato, onion, potato, beans, carrot, cabbage, cauliflower, brinjal, green chilli, capsicum, leafy greens…) |
| 3–4 | Baselines + LightGBM quantile price model; walk-forward CV; coverage tuning; first `/ml/price-range` endpoint |
| 5–6 | Demand v0 (declared + weekday seasonality), newsvendor recommender, stock-status rules |
| 7–8 | Integrate with admin dashboard (price band, demand view, procurement suggestion); start logging pilot data |
| 9–10 | Rebalancing optimiser, anomaly rules, LLM listing-parser + daily brief |
| 11–12 | Evaluate in shadow mode with live pilot; retrain with own data; ETA model design |

---

## 14. Risks specific to ML
- **Sparse/dirty public data** (missing days, wrong units) → strong validation, fall back to baselines.
- **No own demand data initially** → rely on declared demand; don't overpromise accuracy.
- **Regime shifts** (festival, floods, strikes) → wide intervals, human override.
- **Overfitting to a few crops** → report per-crop metrics; don't average away failures.
- **Feedback loops** (your pricing influences demand) → track, but ignore at small scale.

---

## 15. Questions I need from you (ML lead)
1. How many years of price history can you access, and for which exact mandis?
2. Which 10–15 crops go into the pilot?
3. Do you have any buyer who can share past purchase volumes (restaurants/hostels)?
4. Do you want me to provide **ready-to-run notebooks** next (data ingestion → features → LightGBM quantile → evaluation)? Say which model to start with.
