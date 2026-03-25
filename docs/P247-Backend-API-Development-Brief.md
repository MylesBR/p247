# P247 Cloud API & Backend — Development Brief

**Version:** 1.2  
**Date:** 25 March 2026  
**Author:** Myles Bruggeling, Founder  
**Status:** Core brief endpoints live on production (app.p247.io)  
**Companion documents:** P247 iOS App Development Brief (v1.1), P247 Phase 2 Brief (HealthKit Sync, Notifications & AI Agent)

---

## 1. Overview

P247 is a decision system for serious endurance athletes. Not a dashboard. Not an analytics layer. A closed-loop system that predicts, recommends one decision per day, tracks whether the athlete followed it, and learns from the outcome.

The core loop: **Predict → Decide → Act → Measure → Learn.**

The cloud backend is the brain of the system. It ingests data from the iOS app and third-party wearable APIs, runs a two-layer analysis pipeline (statistical/ML detection, then LLM interpretation), generates a single daily decision with confidence scoring, tracks athlete responses, and feeds outcomes back into the model. Everything is served to the app via a REST API.

**This document briefs the development of the P247 cloud API and backend services.** The iOS app is a thin client. All data processing, cross-referencing, prediction logic, decision generation, and learning lives here.

---

## 2. What the Backend Does

### 2.1 Data Ingestion

Receives health and fitness data from two pathways:

**Pathway 1: iOS App Push**
The app collects HealthKit data and subjective check-ins, then pushes them to the API in batches.

**Pathway 2: Server-Side Wearable Polling**
The backend holds OAuth2 tokens for Garmin, Whoop, Strava, and Oura. It pulls data directly from provider APIs on a schedule. The app never talks to these APIs directly.

| Source | Ingestion Method | Frequency | Data |
|---|---|---|---|
| Apple Health (via app) | App pushes to `/sync/healthkit` | On change + every 4h fallback | HRV, resting HR, sleep stages, steps, active energy, workouts, respiratory rate, SpO2 |
| Strava | Server polls Strava API | Webhook (real-time) + hourly poll | Activities, heart rate zones, pace/power, elevation, training log |
| Garmin Connect | Server polls Garmin Health API | Every 15 min (push via Garmin Health API webhooks preferred) | Training load, Body Battery, sleep score, stress, Pulse Ox, VO2 Max |
| Whoop | Server polls Whoop API | Every 15 min | Recovery score, strain, HRV, sleep performance |
| Oura | Server polls Oura API | Every 15 min | Readiness, sleep staging, HRV trends, temperature deviation |
| Subjective check-in (via app) | App pushes to `/sync/checkin` | Once daily | Feel (1-10), soreness map, sleep quality, nutrition, notes |
| Body composition (via app) | App pushes to `/sync/bodycomp` | On entry | Weight, SMM, body fat %, visceral fat, segmental data |

### 2.2 Data Normalisation

Raw data from different providers uses different scales, units, and granularity. The backend normalises everything into a unified internal schema before analysis.

**Normalisation requirements:**
- **Heart rate:** BPM, consistent zone calculation across providers (Garmin zones ≠ Whoop zones)
- **HRV:** RMSSD in ms (Garmin gives average, Whoop gives RMSSD, Oura gives nightly average). Normalise to a common metric and surface provider-specific values where relevant.
- **Sleep:** Map all providers to a common staging model (awake, light, deep, REM) with durations. Handle overlapping sleep data (e.g., Oura ring + Apple Watch both reporting).
- **Training load:** Convert provider-specific load metrics into a unified acute/chronic load model (CTL/ATL/TSB or TRIMP-based). Keep provider-native metrics (Garmin load, Whoop strain) stored separately for display.
- **Timestamps:** All stored in UTC. Convert to athlete's local timezone for display.
- **Units:** Metric internally. Support display in metric or imperial per athlete preference.
- **Deduplication:** Same workout reported by HealthKit and Strava should be identified and merged, not double-counted. Match on timestamp + activity type + duration within tolerance.

### 2.3 Analysis Engine

This is the core intellectual property. The analysis engine runs nightly (and on-demand for significant data events) to produce the daily brief.

**Analysis components:**

**Two-Layer Analysis Architecture**

The analysis engine separates detection from interpretation:

- **Detection Layer (Statistical/ML):** Runs pattern recognition, anomaly detection, and trend analysis across normalised data. Outputs structured signals with confidence scores. No natural language. Pure data.
- **Interpretation Layer (LLM):** Takes detection layer outputs, athlete context, and history. Generates the daily decision with reasoning in natural language. The LLM interprets; it does not detect.

This separation means the detection layer can be tested, validated, and improved independently of the LLM. It also means the LLM never hallucinates patterns that don't exist in the data.

**5 Named Prediction Primitives**

Every prediction the system makes maps to one of five named types:

| Primitive | What It Detects | Risk Level |
|---|---|---|
| **Fatigue Spillover Risk** | Training load from Day N will impair performance on Day N+1/N+2. Looks at session intensity, eccentric loading, sport type, and recovery window. | High = modify tomorrow's plan |
| **Performance Suppression Window** | Converging signals (sleep debt + HRV decline + load accumulation) predict a 2-5 day window where performance will be suppressed regardless of effort. | High = reduce intensity for the window |
| **Fueling Mismatch** | Caloric or macronutrient intake is misaligned with training demands. Detects protein shortfalls on high-load days, carb insufficiency before key sessions, chronic energy deficit. | Medium = adjust nutrition today |
| **Load Accumulation Risk** | ATL/CTL ratio trending toward injury zone (>1.3). Monotony increasing. Weekly load exceeding safe ramp rate (>10% week-over-week). | High = reduce volume this week |
| **Recovery Instability** | Recovery markers (HRV, sleep quality, resting HR) are not stabilising between sessions. The athlete is not recovering at the rate their training plan assumes. | Medium/High = extend recovery |

Each prediction includes a confidence level (High/Medium/Low) based on data completeness, baseline history, and signal strength. The confidence level is surfaced to the athlete alongside the decision.

**Risk as a First-Class Concept**

Risk is not buried inside a composite score. Every daily decision explicitly states the risk being managed: "The primary risk today is Fatigue Spillover from yesterday's heavy session. Confidence: High." The athlete sees the risk name, the confidence, and the reasoning.

**Readiness Signal**
Cross-references HRV trend (not single-day), sleep quality (objective + subjective), training load balance (acute vs chronic), soreness/pain reports, and recovery scores. Outputs a single clear signal: Push / Train Smart / Recover. Not a composite score. A decision.

**Training Load Management**
Calculates acute training load (ATL, 7-day), chronic training load (CTL, 42-day), and training stress balance (TSB). Uses a unified model that accepts inputs from all providers. Detects load spikes (ATL/CTL ratio > 1.3 = injury risk zone). Accounts for sport type when weighting load (running load ≠ rowing load on the body).

**Sleep Analysis**
Combines objective sleep data (wearable stages) with subjective feel. Tracks sleep debt over rolling 7/14-day windows. Flags consistent issues: fragmented sleep, insufficient deep sleep, early waking patterns.

**Body Composition Tracking**
Trends weight, SMM, body fat % over time. Correlates with training load and nutrition data. Flags concerning patterns: "SMM dropped 1.2kg over 6 weeks while training volume increased 15%. Protein intake averaged 1.4g/kg, below the 1.8g/kg target for your goals."

**Adaptation Tracking**
Monitors long-term trends (30/60/90 day) to assess whether the athlete is improving, plateauing, or regressing. Metrics: fitness trend (CTL direction), resting HR trend, HRV baseline shift, pace/power at given HR, body composition trajectory.

**Event Countdown & Periodisation Context**
Uses the athlete's target event and date to contextualise everything. "12 weeks out from Hyrox. Current CTL is 65, target race-day CTL is 80-90. You're on track." Adjusts recommendations based on training phase (base, build, peak, taper).

**Flag Generation**
Automated alerts when the engine detects:
- HRV trending down 3+ consecutive days
- Sleep debt exceeding 5 hours over 7 days
- Training load spike (ATL/CTL > 1.3)
- Missed check-ins (no subjective data for 3+ days)
- Protein consistently below target
- Body fat trending up while SMM is static or dropping
- Resting heart rate elevated 5+ BPM above 7-day baseline

### 2.4 Daily Brief Generation

Runs nightly (configurable per athlete's timezone, default 4:00am local).

**Process:**
1. Pull all data received since last brief generation
2. Run normalisation on new data
3. Execute Detection Layer: run all analysis components, generate prediction primitives with confidence scores
4. Execute Interpretation Layer: LLM takes detection outputs + athlete context + decision history, generates one primary decision with reasoning
5. Store brief in database (including prediction type, confidence level, and reasoning)
6. Send push notification via APNs (containing the single primary decision)

**Brief structure (what the API returns):**

> **Status:** ✅ Implemented. Live at `GET /brief/today`, `GET /brief/{date}`, `GET /brief/history` on Mission Control (port 8765). No auth required (internal network only).

```json
{
  "date": "2026-03-22",
  "headline": "Train Smart",
  "readiness": "train_smart",
  "readiness_summary": "Recovery is adequate. Train as planned but listen to your body. Drop intensity if fatigue builds mid-session.",
  "recovery_score": 68,
  "recovery_breakdown": {
    "sleep": 89,
    "hrv": 53,
    "rhr": 66,
    "load": 100,
    "deep_sleep": 70,
    "fragmentation": 40
  },
  "body": "🟡 Train Smart\n\nRecovery score: 68/100\n...(human-readable brief text)...",
  "generated_at": "2026-03-23T02:56:05.378Z",
  "metrics": {
    "sleep": {
      "total_hours": 6.69,
      "core_hours": 5.13,
      "deep_hours": 0.56,
      "rem_hours": 1.0,
      "awake_hours": 0.63,
      "wrist_temp": 36.28,
      "respiratory_rate": 18,
      "spo2": 97
    },
    "vitals": {
      "hrv": 32,
      "resting_hr": 57,
      "vo2max": null
    },
    "activity": {
      "steps": 3829,
      "active_calories": 357,
      "exercise_min": 8,
      "distance_km": 2.96,
      "daylight_min": 45
    },
    "nutrition": {
      "calories": 5445,
      "protein_g": 203,
      "carbs_g": 507,
      "fat_g": 79,
      "fiber_g": 34,
      "water_ml": 2400
    },
    "training": {
      "total_load": 0,
      "activities": [
        {
          "name": "Morning Run",
          "type": "Run",
          "duration_min": 45,
          "distance_km": 7.2,
          "avg_hr": 155,
          "max_hr": 172,
          "load": 90,
          "pace": "6:15/km"
        }
      ]
    }
  },
  "trends_7d": {
    "avg_sleep": 5.8,
    "avg_hrv": 26,
    "avg_rhr": 54
  },
  "body_composition": {
    "date": "2026-02-24",
    "weight_kg": 79.6,
    "smm_kg": 39.1,
    "body_fat_pct": 13.7,
    "score": 91,
    "visceral_fat": 4
  },
  "event": {
    "name": "Partner Hyrox",
    "date": "2026-07-01T00:00:00",
    "days_away": 100,
    "phase": "Aerobic Base",
    "phase_number": 1,
    "focus": "Zone 2 work, strength maintenance, running volume build",
    "type": "Hyrox"
  },
  "secondary_event": {
    "name": "Half Marathon",
    "date": "2026-08-23",
    "days_away": 153,
    "target": "Sub 1:45"
  },
  "decision": {
    "primary": "Reduce intensity today. Your body is still processing yesterday's session.",
    "prediction_type": "fatigue_spillover_risk",
    "confidence": "high",
    "reasoning": "Yesterday's strength session included heavy eccentric loading. HRV is 15% below your 7-day baseline and sleep fragmentation was elevated. Training hard today carries a high risk of compounding fatigue into tomorrow's planned long run.",
    "risk": "Fatigue Spillover Risk"
  },
  "coaching": [
    { "type": "caution", "icon": "⚠️", "message": "Sleep disrupted: 38min awake during the night.", "confidence": "high" },
    { "type": "good", "icon": "📈", "message": "HRV above baseline: 32ms vs 26ms avg. Good recovery window.", "confidence": "high" },
    { "type": "good", "icon": "✅", "message": "Protein on point: 203g (target 159g).", "confidence": "high" }
  ],
  "emerging_patterns": [
    { "signal": "Your deep sleep drops below 30 min on nights following afternoon caffeine. 3 of last 5 instances confirm this.", "confidence": "low", "label": "Early signal" }
  ]
}
```

**Readiness values:** `push` (🟢 ≥75), `train_smart` (🟡 ≥60), `easy` (🟠 ≥45), `recover` (🔴 <45)

**Recovery breakdown components:** Each scored 0-100, weighted into `recovery_score`:
- `sleep` (25%): total hours vs 7.5h target
- `hrv` (20%): current HRV vs 60ms baseline
- `rhr` (10%): resting heart rate (lower = better)
- `load` (10%): previous day's training load impact
- `deep_sleep` (15%): deep sleep duration quality
- `fragmentation` (20%): time awake during sleep (less = better)

**Coaching types:** `warning` (red, action required), `caution` (yellow, attention), `good` (green, on track), `info` (neutral, awareness)

**History endpoint (`GET /brief/history`):**
```json
{
  "briefs": [
    { "date": "2026-03-22", "sleep_hours": 6.69, "hrv": 32, "resting_hr": 57, "recovery_estimate": 67 },
    { "date": "2026-03-21", "sleep_hours": 6.08, "hrv": 26, "resting_hr": 54, "recovery_estimate": 60 }
  ]
}
```
Returns last 14 days of summary data for the Brief History card.

---

## 3. API Design

### 3.1 General Principles

- RESTful JSON over HTTPS
- Versioned: `/api/v1/...`
- Authentication: JWT (access + refresh tokens)
- Rate limiting: per-user, per-endpoint
- Pagination: cursor-based for list endpoints
- Error responses: consistent schema with error codes and human-readable messages
- All timestamps: ISO 8601, UTC

### 3.2 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account (email + password) |
| POST | `/api/v1/auth/login` | Email/password login, returns JWT pair |
| POST | `/api/v1/auth/apple` | Apple Sign In token exchange |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| POST | `/api/v1/auth/forgot-password` | Trigger password reset email |
| POST | `/api/v1/auth/reset-password` | Complete password reset |

### 3.3 Athlete Profile Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/profile` | Get athlete profile |
| PUT | `/api/v1/profile` | Update profile (sport, goals, event, preferences) |
| PUT | `/api/v1/profile/notification-preferences` | Update notification timing and types |
| DELETE | `/api/v1/profile` | Delete account + all data (GDPR / privacy compliance) |

### 3.4 Data Sync Endpoints (App to Cloud)

> **Status:** Endpoints exist on production (`/sync/*`), currently store raw payloads. Phase 2 adds processing into daily-metrics format. See Phase 2 brief for updated HealthKit payload schema.

| Method | Endpoint | Status | Description |
|---|---|---|---|
| POST | `/sync/healthkit` | ✅ Live (stores raw) | Push batch of HealthKit samples |
| POST | `/sync/checkin` | ✅ Live (stores raw) | Push daily subjective check-in |
| POST | `/sync/bodycomp` | ✅ Live (stores raw) | Push body composition entry |
| GET | `/sync/stats` | ✅ Live | Get sync counts per data type |

**HealthKit batch payload:**
```json
{
  "samples": [
    {
      "type": "heart_rate_variability",
      "value": 62.3,
      "unit": "ms",
      "start": "2026-03-20T03:12:00Z",
      "end": "2026-03-20T03:12:00Z",
      "source": "apple_watch"
    }
  ],
  "workouts": [
    {
      "type": "running",
      "start": "2026-03-20T06:00:00Z",
      "end": "2026-03-20T06:45:00Z",
      "distance_m": 7200,
      "energy_kcal": 520,
      "avg_heart_rate": 155,
      "source": "apple_watch"
    }
  ],
  "device_sync_timestamp": "2026-03-20T07:00:00Z"
}
```

### 3.5 Brief Endpoints

> **Status:** ✅ Implemented on Mission Control (port 8765). Currently served without `/api/v1` prefix and without auth (internal network). Will move behind auth + versioned prefix when the production API is built.

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/brief/today` | ✅ Live | Get today's generated brief (full JSON with recovery, metrics, coaching) |
| GET | `/brief/history` | ✅ Live | List last 14 days of brief summaries |
| GET | `/brief/{date}` | ✅ Live | Get brief for a specific date (YYYY-MM-DD) |

### 3.6 Decision Tracking Endpoints

The athlete's response to each daily decision is first-class data. This closes the learning loop: the system predicts, the athlete decides, and the outcome feeds back into future predictions.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/briefs/{id}/response` | Record athlete's response to today's decision |
| GET | `/api/v1/briefs/{id}/response` | Get the athlete's response for a specific brief |
| GET | `/api/v1/metrics/decision-quality` | Decision quality metrics over time |

**Decision response payload (`POST /briefs/{id}/response`):**
```json
{
  "action": "followed",
  "rpe": 6,
  "outcome_notes": "Kept it easy as suggested. Felt much better by evening.",
  "responded_at": "2026-03-22T18:30:00Z"
}
```

**`action` values:** `followed` (did what the brief recommended), `modified` (adjusted the recommendation), `ignored` (did something different). All three are valid inputs. There is no "wrong" answer. The system learns from all of them.

**Optional fields:**
- `rpe` (1-10): Rate of perceived exertion for the day's session
- `outcome_notes`: Free text on how the day went

**Decision quality metrics (`GET /metrics/decision-quality`):**
```json
{
  "period": "30d",
  "total_decisions": 28,
  "responses_recorded": 24,
  "response_rate": 0.86,
  "action_breakdown": {
    "followed": 16,
    "modified": 5,
    "ignored": 3
  },
  "prediction_accuracy": {
    "high_confidence_correct": 0.82,
    "medium_confidence_correct": 0.65,
    "low_confidence_correct": 0.41
  },
  "model_confidence_level": "personalised",
  "days_of_data": 45
}
```

**Model Confidence Evolution:** The system's confidence in its own predictions improves over time as it accumulates athlete-specific data and decision feedback:

| Stage | Data Requirement | Label |
|---|---|---|
| Learning Baseline | 0-14 days of data | "Learning your patterns" |
| Personalised | 15-60 days + decision feedback | "Personalised to you" |
| Deep Personalisation | 60+ days + consistent decision feedback | "Deeply personalised" |

The model confidence level is returned in decision quality metrics and displayed in the app so athletes understand why early predictions may be less precise.

### 3.7 Trends & Analytics Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/trends/hrv?period=7d` | HRV trend data (7d, 14d, 30d, 90d) |
| GET | `/api/v1/trends/training-load?period=30d` | ATL, CTL, TSB over time |
| GET | `/api/v1/trends/sleep?period=14d` | Sleep duration, quality, debt |
| GET | `/api/v1/trends/bodycomp?period=90d` | Weight, SMM, body fat % over time |
| GET | `/api/v1/trends/adaptation?period=30d` | Composite adaptation metrics |

### 3.8 Activity Endpoints — ✅ Strava Activities Live

| Method | Endpoint | Status | Description |
|---|---|---|---|
| POST | `/activities/sync` | ✅ Live | Fetch latest activities from Strava API. Incremental sync (only new since last sync). Auto-refreshes expired tokens. Deduplicates by strava_id. |
| GET | `/activities/?limit=20&offset=0&type=Run` | ✅ Live | List synced activities (paginated, filterable by type). Newest first. |
| GET | `/activities/{strava_id}` | ✅ Live | **Enriched** activity detail: AI summary, 6-zone HR breakdown, TRIMP, effort score (0-10), training load effect (CTL/ATL), intensity, body regions, METs, HR recovery rating, GPS coordinates, time-series samples (HR, speed, elevation, power, cadence). Streams fetched from Strava on first view and cached. |
| GET | `/activities/summary/weekly` | ✅ Live | 7-day summary: count, distance, time, calories, type breakdown |
| POST | `/api/v1/activities/manual` | ⬜ Planned | Log a manual activity (rehab, physio, etc.) |

**List response includes:** name, type, sport_type, start date (UTC + local), elapsed/moving time (seconds + human display), distance (m + km), elevation, speed, heart rate (avg/max), calories, watts, suffer score, pace (calculated for running activities, e.g. "6:34/km").

**Detail response adds (enrichment, 25 March 2026):** AI-generated summary (Claude Sonnet, cached), effort score (0-10 with historical comparison), 6-zone HR breakdown (Apple Fitness model: Resting through Maximum, using global max HR across all activities), TRIMP, training load focus (anaerobic/high aerobic/low aerobic), training load effect (long term/short term before and after), intensity (% of max HR), HR recovery (2-min post-workout with 5-tier rating), body region inference, MET estimation, HR/speed/elevation/power/cadence time-series samples (downsampled to 200 points), GPS route coordinates (downsampled to 300 points). See `P247-Activity-Detail-Enrichment-Spec.md` for the full schema.

**Initial sync (25 March 2026):** 422 activities pulled from Strava into P247 database.

**Example response (`GET /activities/?limit=1`):**
```json
{
  "activities": [
    {
      "id": 17845742948,
      "name": "Morning Workout",
      "type": "Workout",
      "sport_type": "Workout",
      "start_date": "2026-03-24T19:00:47",
      "start_date_local": "2026-03-25T06:00:47Z",
      "elapsed_time_seconds": 1614,
      "moving_time_seconds": 1614,
      "moving_time_display": "26m 54s",
      "distance_m": 0.0,
      "distance_km": 0,
      "elevation_gain_m": 0.0,
      "average_heartrate": 133.0,
      "max_heartrate": 144.0,
      "suffer_score": 31,
      "has_heartrate": true,
      "pace": null
    }
  ],
  "total": 422,
  "limit": 1,
  "offset": 0
}
```

**Weekly summary response (`GET /activities/summary/weekly`):**
```json
{
  "period": "7d",
  "activity_count": 11,
  "total_distance_km": 27.1,
  "total_time_hours": 8.6,
  "total_calories": 0,
  "activity_types": {"Workout": 2, "Ride": 1, "Run": 3, "WeightTraining": 4, "Walk": 1}
}
```

**Future:** Strava webhook handler for real-time activity sync (eliminates need for manual `POST /activities/sync`).

### 3.9 Wearable Connection Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/connections` | List connected providers and status |
| POST | `/api/v1/connections/{provider}/initiate` | Start OAuth2 flow, returns redirect URL |
| POST | `/api/v1/connections/{provider}/callback` | OAuth2 callback, stores tokens |
| DELETE | `/api/v1/connections/{provider}` | Disconnect a provider, revoke tokens |

Supported providers: `strava`, `garmin`, `whoop`, `oura`, `myfitnesspal`

### 3.10 Webhook Endpoints (Provider to P247)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/webhooks/strava` | Strava webhook for new activities |
| POST | `/api/v1/webhooks/garmin` | Garmin Health API push notifications |
| POST | `/api/v1/webhooks/whoop` | Whoop webhook events |
| POST | `/api/v1/webhooks/oura` | Oura webhook events |

Each webhook endpoint validates the provider's signature/verification token before processing.

### 3.11 User Profile & Notifications — ✅ All Live

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ Live | Get full profile (includes notification prefs, device token status) |
| PUT | `/users/me` | ✅ Live | Update profile (name, timezone, sport, height, weight, DOB, target event) |
| POST | `/users/me/device-token` | ✅ Live | Register APNs device token (`{"token": "...", "platform": "ios"}`) |
| PUT | `/users/me/notification-preferences` | ✅ Live | Set notification types and timing |
| GET | `/users/me/notification-preferences` | ✅ Live | Get current notification preferences |
| PUT | `/users/me/coaching-preferences` | ✅ Live | Set coaching style, experience level, goal, onboarding notes |
| GET | `/users/me/coaching-preferences` | ✅ Live | Get current coaching personality preferences |

Coaching preferences shape the agent's tone per call. Three styles (push/balanced/supportive), three experience levels (beginner/intermediate/advanced), four goal types (event/understand/rebuilding/perform), plus free-text onboarding notes.

### 3.12 AI Coaching Agent — ✅ All Live

Powered by Claude Sonnet with a comprehensive coaching knowledge base (recovery science, training load management, nutrition, Hyrox-specific training, running mechanics). Each athlete gets a per-user agent with 14 days of health data context, conversation history (last 20 messages), persistent athlete memory, and personality calibration based on coaching preferences.

**Vision support (25 March 2026):** The coach can now see images. Athletes can attach up to 4 images per message (workout whiteboards, watch screenshots, gym programming boards). Images are passed to Claude as multimodal vision blocks. The system prompt enforces image-grounded responses: the coach must state what it sees before coaching on it, and never hallucinate exercises. See `P247-Coach-Image-Support-and-Prompt-Rewrite.md` for the full spec.

**Messaging:**

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/agent/messages?limit=50` | ✅ Live | Get conversation history (newest last, includes `images` array if present) |
| POST | `/agent/messages` | ✅ Live | Send message to coach with optional images (`{"content": "...", "images": [...]}`) |
| GET | `/agent/messages/unread` | ✅ Live | Get count of unread agent messages |
| POST | `/agent/messages/read` | ✅ Live | Mark all agent messages as read |
| POST | `/agent/messages/{id}/feedback` | ✅ Live | Thumbs up/down (`{"feedback": "up\|down", "note": "..."}`) |

**Image attachment schema (for `POST /agent/messages`):**
```json
{
  "content": "Here's today's workout",
  "images": [
    {
      "data": "<base64-encoded image, no data: prefix>",
      "mime_type": "image/jpeg",
      "filename": "workout.jpg"
    }
  ]
}
```

**Image validation rules:**
- Max 4 images per message
- Max 5MB per image (base64 decoded size)
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- HEIC images are auto-converted to JPEG server-side
- Images stored to disk (`/data/images/`), not as base64 in the database
- Conversation history returns image paths in the `images` field but does not re-send base64

**Athlete Memory (coach learns over time):**

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/agent/memory` | ✅ Live | List learned facts about this athlete |
| POST | `/agent/memory` | ✅ Live | Add a fact (`{"fact": "...", "source": "conversation"}`) |
| DELETE | `/agent/memory/{id}` | ✅ Live | Remove a memory entry |

Memory is automatically injected into the coach's context. Negative feedback with notes auto-creates correction memories.

### 3.13 Sync Status — ✅ Live

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/sync/status` | ✅ Live | Canonical last-sync timestamps per data source |
| GET | `/sync/stats` | ✅ Live | Total sync counts per data type |

`/sync/status` response:
```json
{
  "last_healthkit_sync": "2026-03-23T07:00:00Z",
  "last_checkin": "2026-03-22T07:38:05Z",
  "last_bodycomp": "2026-03-22T07:38:05Z"
}
```
The device should cache its own last-sync timestamp locally but trust the backend as canonical. If device timestamp is ahead of backend, re-sync that window.

### 3.14 Wearable Connections — ✅ Strava Live

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/connections/` | ✅ Live | List all providers with connection status (Strava, Garmin, Whoop, Oura) |
| POST | `/connections/strava/initiate` | ✅ Live | Returns Strava OAuth authorize URL for the app to open |
| POST | `/connections/strava/callback` | ✅ Live | Exchange auth code for tokens, store per-user |
| DELETE | `/connections/strava` | ✅ Live | Disconnect Strava, revoke token |
| POST | `/connections/strava/refresh` | ✅ Live | Refresh expired access token |

See `P247-Strava-Connect-iOS-Brief.md` for full iOS implementation guide with Swift code and OAuth flow.

### 3.15 Security Configuration (as of 23 March 2026)

| Control | Status | Details |
|---|---|---|
| **Authentication** | ✅ | All endpoints require `x-api-key` header (except `/health` and `/`) |
| **SQL injection** | ✅ | SQLAlchemy parameterised queries, tested with injection payloads |
| **CORS** | ✅ | Locked to `app.p247.io`, `p247.io`, `www.p247.io` only |
| **TLS** | ✅ | HTTPS via Cloudflare (should enable "Always Use HTTPS" in Cloudflare dashboard) |
| **Input validation** | ✅ | Message length capped at 2000 chars, empty messages rejected, date format validated, image uploads: mime type whitelist, 5MB size limit, max 4 per message, base64 integrity check |
| **File permissions** | ✅ | `.env` and `p247.db` set to 600 (owner-only read/write) |
| **API keys in logs** | ✅ | Not logged by uvicorn |
| **Admin endpoints** | ✅ | Require admin password header |
| **User creation** | ✅ | Requires admin secret (prevents open registration) |
| **XSS** | ✅ | JSON API only, no HTML rendering server-side. iOS app should sanitise display. |
| **Agent safety** | ✅ | System prompt guardrails (no medical diagnosis, no supplement prescriptions) |

**Outstanding:**
- HTTP (non-TLS) still returns 200 instead of redirecting to HTTPS. Fix: enable "Always Use HTTPS" in Cloudflare dashboard.
- APNs push notification sending requires `.p8` signing key from Apple Developer account (not yet configured).

### 3.16 Plan Tab (Daily Action Feed) — ✅ All Live (25 March 2026)

Unified daily feed combining completed workouts, coach-generated workout suggestions, and recovery alerts. The "Events" tab becomes "Plan" in the iOS app. Scheduled events (from `/events/`) are merged client-side.

| Method | Endpoint | Status | Description |
|---|---|---|---|
| GET | `/plan/today` | ✅ Live | Get today's plan items (coach suggestions, recovery alerts, completed workouts) |
| GET | `/plan/history?days=7` | ✅ Live | Get plan items for the last N days, grouped by date |
| POST | `/plan/` | ✅ Live | Create a plan item (used by coach or manually) |
| POST | `/plan/{item_id}/start` | ✅ Live | Mark item as in-progress (athlete tapped Start Workout) |
| POST | `/plan/{item_id}/complete` | ✅ Live | Mark item as completed, with optional exercise completion data |
| DELETE | `/plan/{item_id}` | ✅ Live | Dismiss/remove a plan item (soft delete) |

**Plan item types:** `coach_suggestion`, `recovery_alert`, `completed_workout`

**Plan item statuses:** `pending`, `active`, `completed`, `dismissed`

**Create plan item request:**
```json
{
  "item_type": "coach_suggestion",
  "title": "PM Session: Pull + Mobility",
  "subtitle": "Complements this morning's push-dominant class.",
  "coach_note": "Based on your 6am workout image. Avoids front squats (patella rehab).",
  "time": "~16:30",
  "estimated_duration_min": 35,
  "priority": null,
  "exercises": [
    {"name": "Barbell Rows", "sets": "4", "reps": "8-10", "rest": "90s", "muscle_group": "Back"},
    {"name": "Pull-ups", "sets": "3", "reps": "AMRAP", "rest": "90s", "muscle_group": "Lats"}
  ]
}
```

**Complete plan item request:**
```json
{
  "completed_exercises": [
    {"name": "Barbell Rows", "completed": true},
    {"name": "Pull-ups", "completed": true}
  ],
  "notes": "Felt good, added extra set of rows"
}
```

**GET /plan/today response:**
```json
{
  "date": "2026-03-25",
  "items": [
    {
      "id": "plan_1",
      "type": "coach_suggestion",
      "title": "PM Session: Pull + Mobility",
      "subtitle": "Complements this morning's push-dominant class.",
      "coach_note": "Based on your 6am workout image.",
      "time": "~16:30",
      "estimated_duration_min": 35,
      "status": "pending",
      "priority": null,
      "exercises": [...],
      "stats": null,
      "completion_data": null,
      "created_at": "2026-03-25T03:20:04Z"
    }
  ]
}
```

**iOS merge logic:** Call both `GET /plan/today` and `GET /events/` (filtered to today), then sort chronologically. Events go in the timeline by their `event_date`. Plan items go by their `time` field. Items without a time sort by priority (recovery alerts first) then creation time.

---

## 4. Technical Architecture

### 4.1 High-Level System Design

All services run as containers orchestrated by Kubernetes. No bare metal, no VMs running application code directly.

```
                    ┌─────────────────────────────────┐
                    │         iOS App (thin client)     │
                    └──────────┬──────────────────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────────────────┐
                    │    Ingress Controller (nginx /    │
                    │    Traefik) + TLS termination     │
                    └──────────┬──────────────────────┘
                               │
              ─────────────────┼──── Kubernetes Cluster ────────────────
              │                │                                       │
              │     ┌──────────▼──────────────────────┐               │
              │     │    API Service (Deployment)       │               │
              │     │    replicas: 2+ (HPA)             │               │
              │     │    (auth, sync, brief, trends)    │               │
              │     └──┬───────────┬──────────────┬───┘               │
              │        │           │              │                    │
              │  ┌─────▼───┐ ┌────▼─────┐ ┌─────▼────────┐          │
              │  │ Postgres │ │  Redis    │ │ Object Store │          │
              │  │ (managed │ │ (cluster  │ │ (S3 / GCS)   │          │
              │  │  or pod) │ │  or pod)  │ │              │          │
              │  └──────────┘ └──────────┘ └──────────────┘          │
              │        │                                               │
              │  ┌─────▼────────────────────────────────┐             │
              │  │   Worker Pods (Deployment)             │             │
              │  │                                        │             │
              │  │  ┌──────────────┐  ┌────────────────┐ │             │
              │  │  │ Data Poller   │  │ Brief Generator │ │             │
              │  │  │ (CronJob or   │  │ (CronJob,       │ │             │
              │  │  │  long-running) │  │  per-athlete)   │ │             │
              │  │  └──────────────┘  └────────────────┘ │             │
              │  │                                        │             │
              │  │  ┌──────────────┐  ┌────────────────┐ │             │
              │  │  │ Normaliser    │  │ Push Notifier   │ │             │
              │  │  │ (queue worker)│  │ (queue worker)  │ │             │
              │  │  └──────────────┘  └────────────────┘ │             │
              │  └────────────────────────────────────────┘             │
              │        │                                               │
              │  ┌─────▼────────────────────────────────┐             │
              │  │   Analysis Engine (Pod / Service)      │             │
              │  │                                        │             │
              │  │  Readiness · Training Load · Sleep     │             │
              │  │  Body Comp · Adaptation · Flags        │             │
              │  │  LLM Brief Generation (OpenAI/Claude)  │             │
              │  └────────────────────────────────────────┘             │
              │                                                        │
              ──────────────────────────────────────────────────────────
```

### 4.2 Container & Infrastructure Requirements

**Every component is a container.** No exceptions.

| Component | Container Strategy |
|---|---|
| API Service | Docker image, Kubernetes Deployment with HPA (auto-scale on CPU/request count) |
| Background Workers (Poller, Normaliser, Push) | Kubernetes Deployments (long-running queue consumers) |
| Brief Generator | Kubernetes CronJob (fires per timezone cohort) |
| PostgreSQL | Managed service preferred (RDS / Cloud SQL) for backups and failover. Containerised option for dev/staging. |
| Redis | Managed service (ElastiCache / Memorystore) or StatefulSet for dev/staging |
| Ingress | nginx-ingress or Traefik, TLS via cert-manager + Let's Encrypt |

**Infrastructure as Code:** All Kubernetes manifests managed via Helm charts. Environment promotion: dev → staging → production via CI/CD pipeline (GitHub Actions + ArgoCD or Flux).

**Container registry:** ECR (AWS) or Artifact Registry (GCP). Images tagged with git SHA + semantic version.

**Environments:**
- `dev` — single-node cluster or local (minikube/kind), used during development
- `staging` — mirrors production topology, used for integration testing with iOS app
- `production` — multi-node cluster, managed database, autoscaling enabled

**Observability:** Each container exports metrics (Prometheus format), structured JSON logs, and traces (OpenTelemetry). Grafana Cloud for dashboards and alerting.

### 4.3 Recommended Tech Stack

| Component | Recommendation | Rationale |
|---|---|---|
| **Language** | Python (FastAPI) or TypeScript (Node.js / Hono) | FastAPI: excellent for data-heavy services, strong typing, async, great ecosystem for ML/data. Node: if team prefers JS across the stack. |
| **Database** | PostgreSQL 16+ | Relational for athlete profiles, health data, briefs. JSONB columns for flexible wearable data schemas. TimescaleDB extension for time-series health data if volume warrants it. |
| **Cache / Queue** | Redis | Session cache, rate limiting, job queue (Bull/BullMQ for Node, Celery/RQ for Python) |
| **Background Jobs** | Celery (Python) or BullMQ (Node) | Scheduled polling, brief generation, push notifications |
| **Object Storage** | S3 or GCS | Backups, data exports, body comp scan images |
| **Auth** | JWT (access + refresh) | Standard. Access token: 15 min. Refresh token: 30 days. |
| **Push Notifications** | APNs via Firebase Cloud Messaging or direct APNs | FCM simplifies cross-platform later; direct APNs is fine for iOS-only MVP |
| **LLM (Brief Generation)** | OpenAI GPT-4.1 or Claude Sonnet | Structured prompt with athlete context + analysis outputs. Model generates natural language brief. |
| **Containers** | Docker + Kubernetes (EKS / GKE) | All services containerised from day one. K8s for orchestration, scaling, and deployment. Helm charts for environment management. |
| **Hosting** | AWS (EKS) or GCP (GKE) | Container-native cloud. Team's preference on provider. |
| **CI/CD** | GitHub Actions | Standard |
| **Monitoring** | Grafana Cloud (free tier) | Metrics, logs, traces. Dogfooding the founder's expertise. |

### 4.4 Database Schema (Key Tables)

```
athletes
├── id (UUID)
├── email
├── password_hash
├── apple_id
├── name
├── sport (enum: hyrox, ironman, marathon, cycling, hybrid)
├── training_frequency
├── target_event_name
├── target_event_date
├── timezone
├── unit_preference (metric/imperial)
├── notification_time (default 05:30)
├── created_at
└── updated_at

connections
├── id (UUID)
├── athlete_id (FK)
├── provider (enum: strava, garmin, whoop, oura, myfitnesspal)
├── access_token (encrypted)
├── refresh_token (encrypted)
├── token_expires_at
├── last_sync_at
├── status (active/expired/revoked)
└── created_at

health_samples
├── id (UUID)
├── athlete_id (FK)
├── type (enum: hrv, resting_hr, sleep, steps, active_energy, spo2, respiratory_rate, ...)
├── value (numeric)
├── unit (text)
├── start_time (timestamptz)
├── end_time (timestamptz)
├── source (enum: apple_health, garmin, whoop, oura, strava, manual)
├── raw_data (JSONB — provider-specific fields)
├── normalised (boolean)
└── created_at

workouts
├── id (UUID)
├── athlete_id (FK)
├── type (enum: running, cycling, rowing, strength, hyrox, swimming, ...)
├── start_time (timestamptz)
├── end_time (timestamptz)
├── duration_seconds
├── distance_m
├── energy_kcal
├── avg_heart_rate
├── max_heart_rate
├── hr_zones (JSONB)
├── source (enum)
├── external_id (provider activity ID for dedup)
├── p247_interpretation (text — generated by analysis engine)
├── training_load_contribution (numeric)
├── raw_data (JSONB)
└── created_at

checkins
├── id (UUID)
├── athlete_id (FK)
├── date (date)
├── feel_score (1-10)
├── soreness (JSONB — body map regions + severity)
├── sleep_quality (enum: good, tired, broken)
├── nutrition (enum: hit_targets, under_ate, over_ate)
├── notes (text)
└── created_at

body_comp
├── id (UUID)
├── athlete_id (FK)
├── date (date)
├── weight_kg
├── smm_kg
├── body_fat_pct
├── visceral_fat_level
├── segmental_data (JSONB)
├── source (enum: inbody, dexa, scale, manual)
└── created_at

briefs
├── id (UUID)
├── athlete_id (FK)
├── date (date)
├── readiness (enum: push, train_smart, recover)
├── prediction_type (enum: fatigue_spillover_risk, performance_suppression_window, fueling_mismatch, load_accumulation_risk, recovery_instability)
├── confidence (enum: high, medium, low)
├── decision_text (text — the one primary decision)
├── reasoning (text — why this decision matters)
├── content (JSONB — full structured brief)
├── generated_at (timestamptz)
├── push_sent_at (timestamptz)
└── created_at

decision_responses
├── id (UUID)
├── brief_id (FK → briefs)
├── athlete_id (FK)
├── action (enum: followed, modified, ignored)
├── rpe (integer, 1-10, nullable)
├── outcome_notes (text, nullable)
├── responded_at (timestamptz)
└── created_at

training_load_daily
├── id (UUID)
├── athlete_id (FK)
├── date (date)
├── atl (numeric — acute, 7-day)
├── ctl (numeric — chronic, 42-day)
├── tsb (numeric — balance)
├── daily_load (numeric)
├── sport_breakdown (JSONB)
└── created_at
```

### 4.5 Data Flow (End to End)

**Morning brief generation (nightly job):**

1. **Scheduler** fires per athlete at their configured time minus 90 minutes (e.g., 4:00am for a 5:30am notification)
2. **Normaliser** processes any raw data not yet normalised
3. **Deduplicator** identifies and merges overlapping records (HealthKit workout + Strava activity)
4. **Analysis engine** runs all components (readiness, load, sleep, body comp, adaptation, flags)
5. **Brief generator** takes analysis outputs + athlete profile + recent history, sends structured prompt to LLM
6. **LLM** returns natural language brief
7. **Storage** saves brief to database
8. **Push notifier** sends APNs notification at athlete's preferred time

**Real-time data sync (HealthKit push from app):**

1. App pushes batch to `/sync/healthkit`
2. API validates, deduplicates, stores raw samples
3. Background job queued: normalise new samples
4. If significant event (workout completed), trigger on-demand analysis update
5. Next brief generation includes this data

**Webhook (Strava new activity):**

1. Strava sends webhook to `/webhooks/strava`
2. API validates webhook signature
3. Fetches full activity data from Strava API using stored tokens
4. Stores, normalises, generates P247 interpretation
5. Pushes updated activity to app (via push notification or next app sync)

---

## 5. Wearable Integrations (Detail)

### 5.1 Strava (MVP — Phase 1) — ✅ Live

- **Auth:** OAuth2 — ✅ Live (initiate, callback, refresh, disconnect)
- **Activity sync:** ✅ Live (`POST /activities/sync`). Incremental fetch from Strava API, deduplication by strava_id, auto token refresh. 422 activities synced as of 25 March 2026.
- **Activity listing:** ✅ Live (`GET /activities/`, `GET /activities/{id}`, `GET /activities/summary/weekly`)
- **Webhooks:** ⬜ Planned. Strava Webhook Events API for real-time activity notifications.
- **Polling fallback:** ⬜ Planned. Hourly poll of `/athlete/activities` for anything webhooks missed.
- **Data pulled:** Activities (type, distance, time, HR, power, pace, splits, elevation), athlete zones
- **Rate limits:** 100 requests/15 min, 1000/day per app. Batch requests. Cache aggressively.
- **Docs:** https://developers.strava.com/

### 5.2 Garmin Connect (Phase 2)

- **Auth:** OAuth1.0a (Garmin Health API)
- **Push:** Garmin supports push notifications to a registered endpoint (preferred over polling)
- **Data pulled:** Daily summaries (steps, stress, Body Battery, sleep), activities (HR zones, training effect, VO2 Max), epoch summaries
- **Access:** Requires Garmin Health API partner application (approval process, 2-4 weeks)
- **Rate limits:** Generous once approved. Respect push cadence.
- **Docs:** https://developer.garmin.com/health-api/

### 5.3 Whoop (Phase 2)

- **Auth:** OAuth2
- **Data pulled:** Cycles (strain, recovery, sleep), workouts, physiological data (HRV, RHR, SpO2, skin temp)
- **Webhooks:** Supported for recovery and workout events
- **Access:** Requires Whoop Developer API application
- **Rate limits:** 100 requests/min
- **Docs:** https://developer.whoop.com/

### 5.4 Oura (Phase 2)

- **Auth:** OAuth2
- **Data pulled:** Daily readiness, sleep (staging, efficiency, latency), activity, heart rate, temperature deviation
- **Webhooks:** Available via subscription model
- **Access:** Oura Developer Portal, requires application
- **Rate limits:** Standard OAuth rate limits
- **Docs:** https://cloud.ouraring.com/v2/docs

---

## 6. Analysis Engine (Technical Detail)

### 6.1 Training Load Model

Uses a modified Banister impulse-response model:

- **Daily load** = sum of session loads (weighted by sport type and intensity)
- **Session load:** heart rate based (TRIMP) when HR data available; RPE-based fallback for sessions without HR
- **ATL** (Acute Training Load) = exponentially weighted moving average, 7-day time constant
- **CTL** (Chronic Training Load) = exponentially weighted moving average, 42-day time constant
- **TSB** (Training Stress Balance) = CTL minus ATL
- **Monotony** = daily load mean / daily load SD over 7 days (high monotony = overtraining risk)
- **Strain** = weekly load × monotony

Sport-type weighting: running produces more musculoskeletal load per TRIMP than rowing or cycling. The model applies sport-specific multipliers to account for this.

### 6.2 Readiness Algorithm

Readiness is NOT a simple composite score. It's a decision tree:

```
IF hrv_trend (3d) declining AND sleep_debt > 3h AND soreness reported:
    → RECOVER

IF hrv_trend stable AND sleep_quality good AND TSB > -10:
    → PUSH (with sport-specific caveat if soreness present)

ELSE:
    → TRAIN SMART (modified session recommendation)
```

The actual implementation should be more nuanced, but the principle is: multiple converging signals, not a weighted average. The LLM receives the signal and supporting data to generate the natural language recommendation with specifics.

### 6.3 LLM Integration (Interpretation Layer)

**Approach:** Structured prompt engineering, not fine-tuning (for MVP). The LLM is the Interpretation Layer only. It does not detect patterns. It receives structured detection outputs and translates them into a single daily decision with reasoning.

**Prompt structure:**
1. System prompt: "You are a sports science decision system for a serious endurance athlete. Generate one primary decision for today with confidence level and reasoning."
2. Athlete profile context (sport, goals, event, known injuries)
3. Detection layer outputs (prediction primitives with confidence scores, readiness signal, metrics, flags, trends)
4. Recent check-in data (subjective feel, soreness, notes)
5. Decision history (last 7 days of decisions + athlete responses: followed/modified/ignored + outcomes)
6. Output format specification: one primary decision, prediction type, confidence (High/Medium/Low), reasoning ("Why this matters"), plus supporting coaching insights each with their own confidence level

**Model selection:** GPT-4.1 or Claude Sonnet. Cost per brief is minimal (one call per athlete per day, ~500-1000 tokens output).

**Decision history feedback loop:** The LLM receives the athlete's recent decision responses. If an athlete consistently ignores a certain prediction type and outcomes are fine, the model should adjust its weighting. If an athlete follows a recommendation and reports positive outcomes, the model reinforces that pattern. This is the "Learn" step of the core loop.

**Guardrails:**
- Never provide medical advice. Flag concerning patterns and recommend professional consultation.
- Recommendations must be sport-specific and account for known injuries/limitations.
- Every insight must include a confidence level (High/Medium/Low). If data is sparse (new user, missed syncs), confidence must be Low and the brief must say so explicitly rather than guessing.
- Low-confidence cross-domain signals should be surfaced as "Emerging Patterns" with "Early signal" framing, not presented as confident recommendations.

---

## 7. Security & Compliance

### 7.1 Data Security

- **Encryption in transit:** TLS 1.3 on all endpoints
- **Encryption at rest:** AES-256 for database, encrypted columns for OAuth tokens
- **OAuth token storage:** Encrypted at rest, never logged, never returned in API responses
- **JWT secrets:** Rotated quarterly, stored in secrets manager (AWS Secrets Manager / GCP Secret Manager)
- **HealthKit data:** Apple requires that HealthKit data is never stored in iCloud or transmitted unencrypted. Server-side storage must comply.

### 7.2 Privacy Compliance

- **Australian Privacy Act:** Clear consent during onboarding. Data retention policy. Breach notification within 30 days.
- **GDPR (future-proofing):** Right to access (`GET /profile/export`), right to deletion (`DELETE /profile`), data portability (JSON export), consent records stored.
- **Apple App Store guidelines:** HealthKit data must not be shared with third parties for advertising or sold. Privacy policy must be accessible from within the app.

### 7.3 API Security

- Rate limiting per user (Redis-backed)
- Input validation on all endpoints (strict typing, max payload sizes)
- SQL injection prevention (parameterised queries / ORM)
- Webhook signature verification for all provider webhooks
- CORS: locked to app bundle ID and web domain
- No PII in logs

---

## 8. Scalability Considerations

MVP will serve hundreds of athletes. Design for thousands without re-architecture.

- **API pods:** Stateless, horizontally scaled via Kubernetes HPA. Add replicas as traffic grows.
- **Worker pods:** Queue-based, independently scalable. Scale pollers and normalisers separately from brief generators.
- **Database:** PostgreSQL handles this comfortably. Partition `health_samples` by athlete_id + month if query performance degrades. Managed DB (RDS/Cloud SQL) for automated backups and failover.
- **Time-series data:** If health sample volume becomes significant (>10M rows), evaluate TimescaleDB extension or move time-series data to a dedicated store.
- **Brief generation:** One LLM call per athlete per day. At 1000 athletes, that's 1000 API calls spread over a few hours. Not a bottleneck.
- **Container scaling:** Kubernetes handles the orchestration. Define resource requests/limits per pod, set HPA targets, and the cluster scales up and down automatically.

---

## 9. MVP Scope (Phase 1)

### In Scope

- [ ] Auth (email/password + Apple Sign In, JWT)
- [ ] Athlete profile CRUD
- [ ] HealthKit data ingestion endpoint (`/sync/healthkit`)
- [ ] Subjective check-in endpoint (`/sync/checkin`)
- [ ] Body composition endpoint (`/sync/bodycomp`)
- [ ] Data normalisation pipeline (HealthKit + Strava)
- [x] Strava OAuth2 integration + activity sync — **DONE.** OAuth flow live, `POST /activities/sync` fetches from Strava API, 422 activities synced. Webhook for real-time push TBD.
- [ ] Training load calculation (ATL/CTL/TSB)
- [ ] Readiness algorithm (basic decision tree)
- [ ] Daily brief generation (LLM-powered)
- [ ] Brief endpoints (today, history)
- [ ] Trend endpoints (HRV, training load, sleep, body comp)
- [x] Activity list — **DONE.** `GET /activities/` (paginated, filterable), `GET /activities/{id}`, `GET /activities/summary/weekly`. P247 interpretation TBD.
- [ ] Push notifications (APNs for morning brief + alerts)
- [ ] Deduplication (HealthKit + Strava overlap)
- [ ] Basic monitoring and logging

### Out of Scope (Phase 2+)

- Garmin Connect integration
- Whoop integration
- Oura integration
- MyFitnessPal / nutrition API integration
- Advanced ML models (replace rule-based readiness with trained model)
- Coach/athlete shared access (multi-tenancy)
- Web dashboard
- Data export API
- Billing / subscription management (Stripe)
- Android push support

---

## 10. Timeline Estimate (Developer Team to Confirm)

| Phase | Duration | Deliverable |
|---|---|---|
| **Infrastructure setup** | 1-2 weeks | Kubernetes cluster, Helm charts, CI/CD pipeline (GitHub Actions + ArgoCD), container registry, managed DB + Redis, dev/staging/prod environments |
| **Core API + auth** | 2 weeks | Auth flow, profile CRUD, all sync endpoints accepting data |
| **Data pipeline** | 2 weeks | Normalisation, deduplication, HealthKit ingestion, storage |
| **Strava integration** | 1 week | OAuth2 flow, webhook, activity sync + normalisation |
| **Analysis engine** | 3 weeks | Training load, readiness, sleep analysis, adaptation, flags |
| **Brief generation** | 1 week | LLM integration, prompt engineering, brief storage + retrieval |
| **Trends + activities API** | 1 week | All trend endpoints, activity list with interpretation |
| **Push notifications** | 1 week | APNs integration, morning brief delivery, alert triggers |
| **QA + integration testing** | 2 weeks | End-to-end testing with iOS app, load testing, security review |

**Estimated total: 12 to 16 weeks from kickoff.**

*Note: This runs in parallel with iOS app development. The teams should agree on API contracts (OpenAPI spec) in week 1 so the app team can build against mock responses immediately.*

---

## 11. Open Questions for Development Team

1. **Python or Node?** FastAPI (Python) is strong for data processing and has better ML/data science ecosystem if we build custom models later. Node/TypeScript works if the team prefers a unified JS stack with the potential web dashboard. Team should decide based on their strengths.
2. **Cloud provider?** AWS (EKS) or GCP (GKE) for the Kubernetes cluster. What does the team have experience with?
3. **HealthKit data granularity:** Store every sample (heart rate every 5 min) or daily aggregates? Recommend: store raw, compute aggregates. Storage is cheap. Losing granularity is irreversible.
4. **LLM provider:** OpenAI or Anthropic? Cost difference is negligible at MVP scale. Quality difference is testable during brief generation development.
5. **Multi-region:** Australia-first (ap-southeast-2). When do we need US/EU presence? Not MVP, but data residency matters for GDPR. Kubernetes makes multi-region expansion straightforward when the time comes.
6. **API spec format:** OpenAPI 3.1 recommended. Should be generated from code or written spec-first?

---

## 12. Coordination with iOS App Team

Both workstreams need to be in sync. Key coordination points:

| Week | Milestone | Dependency |
|---|---|---|
| 1 | API contract agreed (OpenAPI spec) | Both teams review and sign off |
| 1 | Auth flow working | iOS team needs this to build login |
| 3 | Sync endpoints accepting data | iOS team needs to test HealthKit push |
| 5 | Brief endpoint returning data | iOS team needs to build brief display |
| 6 | Strava OAuth flow working | iOS team needs to test connection flow |
| 8 | Trend endpoints returning data | iOS team needs to build charts |
| 10 | Push notifications working | iOS team needs to test notification handling |
| 12+ | Integration testing | Both teams test end-to-end |

---

## 13. Reference Materials

- **iOS App Brief:** P247-iOS-App-Development-Brief.md (companion document)
- **Website:** https://p247.io
- **Strava API Docs:** https://developers.strava.com/
- **Garmin Health API:** https://developer.garmin.com/health-api/
- **Whoop Developer API:** https://developer.whoop.com/
- **Oura API:** https://cloud.ouraring.com/v2/docs
- **Apple HealthKit:** https://developer.apple.com/documentation/healthkit
- **APNs:** https://developer.apple.com/documentation/usernotifications

---

**Contact:** myles@p247.io

---

*P247 — One decision per day. Learn from every outcome.*
