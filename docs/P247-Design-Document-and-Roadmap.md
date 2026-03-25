# P247 — Design Document & Architecture Roadmap

**Version:** 1.0
**Date:** 25 March 2026
**Author:** Myles Bruggeling, Founder
**Status:** Living document for roadmap discussion

---

## Table of Contents

0. [The Product Test](#0-the-product-test)
1. [Product Vision](#1-product-vision)
1.5. [Prediction Primitives](#15-prediction-primitives)
2. [Market Position](#2-market-position)
3. [Current State (What Exists Today)](#3-current-state)
4. [System Architecture](#4-system-architecture)
5. [Core Product Components](#5-core-product-components)
6. [Data Pipeline](#6-data-pipeline)
7. [AI Engine](#7-ai-engine)
8. [iOS App](#8-ios-app)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Business Model & Monetisation](#10-business-model--monetisation)
11. [Roadmap](#11-roadmap)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Open Decisions](#13-open-decisions)
14. [Reference Documents](#14-reference-documents)

---

## 0. The Product Test

> Every day, the user should either make a different decision than they would have, or feel more confident in the one they made. If that's not happening, nothing else matters.

Everything in this document serves this test or gets cut. Every feature, every integration, every prediction primitive exists to help an athlete make a better decision today. If a capability does not contribute to that outcome, it does not belong in the product.

---

## 1. Product Vision

### What P247 Is

A performance intelligence platform for serious endurance athletes. P247 reads across all of an athlete's existing data sources (Garmin, Whoop, Oura, Strava, Apple Health, nutrition logs, body composition scans) and surfaces the patterns that predict problems BEFORE they show up in a recovery score.

### The One-Liner

> "Your devices tell you what happened. P247 predicts how your body will respond to today's training and tells you what to do about it."

### What P247 Is NOT

- Not another dashboard (athletes already have too many)
- Not a training plan generator (TrainingPeaks, TrainerRoad own this)
- Not a generalist AI coach (athletedata.health already owns this positioning)
- Not a zone calculator or workout tracker

### What P247 IS

**A decision system that learns how your body responds to training, recovery, and fuel.** Cross-device synthesis, prospective pattern detection, and plain-language interpretation of what multi-source health data actually means for today's training decision.

### Core Belief

> Performance is not limited by effort. It is limited by the body's capacity to absorb effort.

Most athletes who plateau are under-recovered, under-fuelled on the days that matter, or accumulating fatigue faster than they dissipate it. P247 finds which of these is true for a specific athlete, right now, in the context of their specific goal.

### Core Product Loop

**Predict → Decide → Act → Measure → Learn**

| Stage | What Happens |
|---|---|
| **Predict** | System analyses multi-source data and generates predictions about how the athlete's body will respond to today's planned training. |
| **Decide** | System presents one primary decision for today with confidence level and reasoning. |
| **Act** | Athlete acts on the recommendation: follows it, modifies it, or ignores it. |
| **Measure** | System observes the outcome through RPE, performance data, and recovery response. |
| **Learn** | Model updates based on prediction accuracy and decision quality. The system gets better at predicting this specific athlete over time. |

This loop is the product. Every feature either feeds data into this loop, improves a stage of this loop, or presents the output of this loop to the athlete.

---

## 1.5 Prediction Primitives

These are the named, user-facing prediction types that P247 surfaces. They are product primitives, not internal categories. Athletes should recognise them by name and expect to see them when conditions warrant.

| Prediction | What It Detects | Required Inputs | Lookahead | Example Output |
|---|---|---|---|---|
| **Fatigue Spillover Risk** | Accumulated fatigue likely to impact performance | HRV trend (3+ days), sleep debt, acute training load | 24-48h | "You are carrying 3 days of unresolved fatigue. If you do threshold work today, expected performance drop is ~8-12%." |
| **Performance Suppression Window** | Period where training stimulus will yield diminished returns | CTL/ATL ratio, HRV baseline shift, sleep quality trend | 48-72h | "Your body is in a suppression window. High-intensity work in the next 48h will cost more recovery than it builds fitness." |
| **Fueling Mismatch** | Nutrition inadequate for planned/recent training | Calorie intake vs expenditure, protein per high-load day, carb timing | Same day | "Yesterday was your highest load day this week. Protein intake was 40% below your target. Recovery will be slower." |
| **Load Accumulation Risk** | Training load building faster than adaptation can absorb | ATL/CTL ratio >1.3, monotony score, consecutive high-load days | 5-7 days | "Training load has exceeded your chronic baseline by 35% for 4 consecutive days. Injury risk is elevated." |
| **Recovery Instability** | Recovery patterns becoming erratic or trending down | HRV coefficient of variation, RHR trend, sleep fragmentation trend | 7-14 days | "Your HRV has been unusually variable for 8 days. This pattern has preceded performance dips in your history." |

These predictions are user-facing, named, and repeatable. Athletes should recognise them by name and expect to see them when conditions warrant.

---

## 2. Market Position

### Competitive Landscape

| Category | Players | What They Do | P247 Differentiation |
|---|---|---|---|
| **Device-native apps** | Garmin Connect, Whoop, Oura | Single-device dashboards with proprietary scores | P247 sees ALL devices, not just one. Cross-device correlation is the core capability. |
| **Training plan platforms** | TrainingPeaks, TrainerRoad, TriDot | Structured plans with analytics (TSS, CTL, zones) | Plan-centric, not recovery-centric. P247 answers "should you train today?" not "what should you train?" |
| **AI coach startups** | athletedata.health (Soma), Athlytic | AI interpretation layers | Generalist positioning. P247 is specialist: recovery intelligence + predictive patterns. |
| **Analytics overlays** | fitIQ | Deep single-device visualisation (Whoop only) | Single device, no AI, charts without interpretation. $3/mo ceiling. |
| **DIY approaches** | Spreadsheets, multi-app manual cross-referencing | Athletes build their own systems | Takes 12-18 months to learn. Fails under stress. P247 automates what the best athletes do manually. |

### Three User Archetypes

| Archetype | Size | Description | What P247 Gives Them |
|---|---|---|---|
| **Frustrated Data Collector** | ~60% | Has devices, looks at data, doesn't change behaviour. Eventually concludes the data is "for entertainment." | The interpretation they're missing. Turn passive data consumption into active decisions. |
| **Override Athlete** | ~25% | Checks the score every morning, then ignores it and goes by feel. Has learned the score is often wrong. | Validation of their instinct, plus patterns they can't see (12-day HRV drift, cumulative load they felt but couldn't quantify). |
| **Pattern Builder** | ~15% | Technically sophisticated. Has figured out cross-metric patterns on their own. May have built their own tools. | Automation of what they do manually. Early adopters and beta testers. |

### Key Differentiators

1. **Cross-device synthesis** (not locked to one wearable ecosystem)
2. **Predictive, not reactive** (pattern detection before the crash, not explanation after)
3. **Specialist focus** (recovery intelligence, not generalist coaching)
4. **Strength + cardio synthesis** (most competitors are cardio-only)
5. **Direct Garmin integration** (main competitor athletedata.health doesn't have this)
6. **Decision system, not dashboard** (one decision per day, with a learning loop that improves over time)
7. **Risk as first-class concept** (injury risk, burnout risk, performance suppression surfaced proactively)

---

## 3. Current State (What Exists Today)

### 3.1 Backend API (app.p247.io)

**Stack:** Python / FastAPI / SQLite / Uvicorn
**Location:** /opt/p247-backend on home server (Tailscale: 100.66.36.81)
**Domain:** app.p247.io (Cloudflare)
**Total live endpoints:** 42+

| Category | Status | Endpoints |
|---|---|---|
| **Authentication** | ✅ Live | API key auth (x-api-key header) on all endpoints |
| **User Profile** | ✅ Live | GET/PUT /users/me, coaching preferences, notification preferences |
| **Daily Briefs** | ✅ Live | GET /briefs/today, /briefs/history, /briefs/{date} |
| **AI Coaching Agent** | ✅ Live | GET/POST /agent/messages, unread count, read receipts, feedback, image support |
| **Agent Memory** | ✅ Live | GET/POST/DELETE /agent/memory (per-user learned facts) |
| **Strava OAuth** | ✅ Live | Full OAuth flow (initiate, callback, refresh, disconnect) |
| **Activity Sync** | ✅ Live | POST /activities/sync, GET /activities/, GET /activities/{id} (enriched), weekly summary |
| **HealthKit Sync** | ✅ Live (stores raw) | POST /sync/healthkit, GET /sync/status, GET /sync/stats |
| **Check-in / Body Comp** | ✅ Live (stores raw) | POST /sync/checkin, POST /sync/bodycomp |
| **Wearable Connections** | ✅ Live (Strava only) | GET /connections/, per-provider OAuth endpoints |
| **Plan Tab** | ✅ Live | GET /plan/today, /plan/history, POST create/start/complete/dismiss |
| **Goals** | ✅ Live | GET/PUT /goals/ (body comp, training, nutrition targets) |
| **Metrics History** | ✅ Live | GET /metrics/history?days=30&metrics=hrv,sleep_hours (time-series with stats) |
| **Admin Dashboard** | ✅ Live | Per-athlete model assignment, token tracking, impersonation, activity log |
| **Push Notifications** | ⬜ Blocked | Device token registration exists; APNs delivery needs .p8 signing key |

### 3.2 Mission Control (Personal Dashboard)

**Stack:** Node.js / Express / HTML/JS frontend
**Location:** /home/james/.openclaw/workspace/mission-control/ (port 8765 + Next.js on port 3000)
**Purpose:** Myles's personal health dashboard, HAE data receiver

**Separate from P247 backend.** Mission Control is the personal prototype. P247 backend is the product. Mission Control receives data from Health Auto Export (HAE), generates briefs using that data, and serves Myles's personal dashboard. P247 backend will receive data from the iOS app directly via HealthKit.

### 3.3 iOS App

**Status:** Phase 1 functional, connecting to production endpoints
**Language:** Swift/SwiftUI
**What works:**
- Brief display (recovery score, metrics, coaching, events)
- Brief history with date picker
- Coach tab with messaging (text only, image support pending)
- Strava connect flow
- Body composition display
- 7-day trends
- Event countdown with training phase

**What's pending:**
- Native HealthKit sync (code written, needs dropping into Xcode project)
- Push notification delivery (needs APNs .p8 key)
- Coach image attachments (backend ready, iOS needs image picker + display)
- Plan tab (backend ready, iOS needs card UI)
- Hydration display (backend returns water_ml, iOS needs rendering)
- Apple Sign In + email auth (currently API key only)
- Check-in UI

### 3.4 Content & Marketing

- **Website:** p247.io (Jekyll, GitHub Pages)
- **Blog:** 25+ SEO posts published (daily cadence since 5 March)
- **Landing pages:** 4 live (homepage, early-access, GLP-1, athletes)
- **HubSpot:** Forms on all 4 pages, 6 nurture emails drafted
- **GA4 + Search Console:** Connected, baseline established
- **Reddit campaign:** Stage 1 gate passed (23/20 qualifying conversations)
- **Strava Club:** Created, post cadence defined

### 3.5 Database State (as of 25 March 2026)

- 1 user (Myles)
- 422 Strava activities synced
- 20 agent messages
- 0 HealthKit syncs (iOS app hasn't shipped native sync yet)
- 1 check-in, 1 body comp entry
- All health data currently flows through HAE -> Mission Control, not through P247 backend

### 3.6 Observability

- Grafana Alloy v1.14.1 shipping node metrics, app metrics, systemd logs to Grafana Cloud
- Mission Control /metrics endpoint: 30+ health/fitness Prometheus gauges
- Prometheus remote write to Grafana Cloud
- Loki log shipping to Grafana Cloud

---

## 4. System Architecture

### 4.1 Current Architecture (Prototype)

```
┌──────────────────┐
│   Health Auto     │──── Apple Health data ────┐
│   Export (HAE)    │                            │
│   (iOS, $4.99)   │                            ▼
└──────────────────┘                   ┌─────────────────┐
                                       │ Mission Control  │
                                       │ (Node.js :8765)  │
                                       │                  │
                                       │ Personal dash    │
                                       │ HAE receiver     │
                                       │ Brief generation │
                                       └────────┬────────┘
                                                │
                                         reads health data
                                                │
┌──────────────────┐                   ┌────────▼────────┐
│   iOS App         │◄── REST API ────►│  P247 Backend    │
│   (Swift/SwiftUI) │                  │  (FastAPI :8000) │
│                   │                  │                  │
│   Briefs, Coach,  │                  │  app.p247.io     │
│   Activities,     │                  │  42+ endpoints   │
│   Strava, Plan    │                  │  Claude Sonnet   │
└──────────────────┘                   │  SQLite          │
        │                              └────────┬────────┘
        │ OAuth2                                │
        ▼                                       │ OAuth2
┌──────────────────┐                            ▼
│   Apple Health    │                   ┌──────────────────┐
│   (HealthKit)     │                   │  Strava API       │
└──────────────────┘                   │  (422 activities) │
                                       └──────────────────┘
```

### 4.2 Target Architecture (Production)

```
                    ┌─────────────────────────────────────┐
                    │          iOS App (thin client)        │
                    │   HealthKit ◄───► Apple Health        │
                    └──────────────┬──────────────────────┘
                                   │ HTTPS
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  Ingress (nginx/Traefik) + TLS       │
                    └──────────────┬──────────────────────┘
                                   │
              ─────────────────────┼──── Kubernetes Cluster ─────────────
              │                    │                                     │
              │     ┌──────────────▼──────────────────┐                 │
              │     │       API Service (HPA)          │                 │
              │     │   Auth, Sync, Briefs, Coach,     │                 │
              │     │   Activities, Trends, Plan       │                 │
              │     └──┬──────────┬───────────┬───────┘                 │
              │        │          │           │                          │
              │   ┌────▼────┐ ┌──▼────┐ ┌────▼──────┐                  │
              │   │Postgres │ │ Redis │ │   S3/GCS  │                  │
              │   │(managed)│ │       │ │  (images, │                  │
              │   │         │ │       │ │  exports) │                  │
              │   └─────────┘ └───────┘ └───────────┘                  │
              │        │                                                │
              │   ┌────▼────────────────────────────────┐               │
              │   │     Worker Pods                      │               │
              │   │                                      │               │
              │   │  ┌────────────┐  ┌────────────────┐ │               │
              │   │  │Data Poller │  │Brief Generator │ │               │
              │   │  │(CronJob)   │  │(CronJob, per   │ │               │
              │   │  │            │  │ athlete TZ)    │ │               │
              │   │  └────────────┘  └────────────────┘ │               │
              │   │                                      │               │
              │   │  ┌────────────┐  ┌────────────────┐ │               │
              │   │  │Normaliser  │  │Push Notifier   │ │               │
              │   │  │(queue)     │  │(queue)         │ │               │
              │   │  └────────────┘  └────────────────┘ │               │
              │   └──────────────────────────────────────┘               │
              │        │                                                │
              │   ┌────▼────────────────────────────────┐               │
              │   │     Analysis Engine                  │               │
              │   │                                      │               │
              │   │  Readiness · Training Load · Sleep   │               │
              │   │  Body Comp · Adaptation · Flags      │               │
              │   │  LLM Brief Generation (Claude/GPT)   │               │
              │   └──────────────────────────────────────┘               │
              │                                                         │
              │   ┌──────────────────────────────────────┐              │
              │   │  Webhook Receivers                    │              │
              │   │  Strava · Garmin · Whoop · Oura      │              │
              │   └──────────────────────────────────────┘              │
              │                                                         │
              ──────────────────────────────────────────────────────────
                         │              │              │
                   ┌─────▼───┐   ┌──────▼───┐  ┌──────▼───┐
                   │ Strava  │   │ Garmin   │  │ Whoop /  │
                   │ API     │   │ Health   │  │ Oura API │
                   │         │   │ API      │  │          │
                   └─────────┘   └──────────┘  └──────────┘
```

### 4.3 Key Architectural Principles

1. **iOS app is a thin client.** All intelligence, analysis, and recommendation logic lives server-side. App collects, syncs, and displays.
2. **Backend handles all wearable API integrations.** The app never calls Strava/Garmin/Whoop directly. Server holds OAuth tokens, pulls data, normalises it.
3. **Containerised from day one.** Every component is a Docker container. Kubernetes for orchestration. No bare metal application code.
4. **Separate data stores per concern.** Postgres for relational data, Redis for caching/queues, S3 for images/exports. Time-series extension (TimescaleDB) if health sample volume warrants it.
5. **Observability built in.** Prometheus metrics, structured JSON logs, OpenTelemetry traces. Grafana Cloud for dashboards and alerting.

---

## 5. Core Product Components

### 5.1 Daily Performance Brief

The primary product output. Generated nightly per athlete's timezone.

**Structure:**
- Readiness signal: Push (🟢 ≥75) / Train Smart (🟡 ≥60) / Easy (🟠 ≥45) / Recover (🔴 <45)
- Recovery score (0-100) with 6-component breakdown (sleep 25%, HRV 20%, fragmentation 20%, deep sleep 15%, RHR 10%, load 10%)
- Key metrics: sleep, vitals, activity, nutrition, training
- 7-day trends (avg sleep, HRV, RHR)
- Body composition (latest scan)
- Event countdown with periodisation phase
- **One primary decision for the day** (the single most important thing)
- **Supporting context** (max 1 additional insight, only if genuinely relevant)
- **Confidence level on primary decision** (High / Medium / Low with different UI treatment)
- **Reasoning: "Why this matters today"** with source data references

The system must always choose the single most important decision for today. Not top 3, not top 2. One primary. Everything else is subordinate.

**Generation pipeline:**
1. Scheduler fires per athlete (configured time minus 90 min)
2. Normaliser processes raw data
3. Deduplicator merges overlapping records
4. Analysis engine runs all components
5. LLM generates natural language brief from analysis outputs
6. Brief stored in database
7. Push notification sent at athlete's preferred time

#### Emerging Patterns (Low Confidence)

Cross-domain correlations surfaced before full confidence is established. These are framed as "Early signal (learning)" to set user expectations appropriately.

**Example:** "Early signal: poor sleep + intensity may be impacting your HRV more than expected (low confidence, 3 weeks of data)"

**Purpose:** Shows the system is learning from day 1 without overpromising. Users see the system actively building their personal model, which builds trust and retention even when the system is too new to make high-confidence predictions.

### 5.2 AI Coaching Agent

Per-user AI agent powered by Claude Sonnet. Each athlete gets a personal coach that:
- Has full 14-day health data context
- Maintains conversation history (last 20 messages)
- Learns and remembers per-user facts (persistent memory)
- Calibrates tone based on coaching preferences (push/balanced/supportive)
- Supports image analysis (workout whiteboards, watch screenshots, gym boards)
- Follows a comprehensive coaching knowledge base covering recovery science, training load management, nutrition, body composition, Hyrox-specific training, running mechanics

**Tone rules:** Warm conversational prose. No markdown formatting. Lead with encouragement. Use "we" and "let's". Every flag gets a fix, never list problems without solutions. Write like texting your coach, not a lab report.

**Safety:** Backend handles all guardrails. No medical diagnosis, no supplement prescriptions. System prompt enforces appropriate boundaries.

### 5.3 Activity Feed (Strava Integration)

422 activities synced from Strava. Each activity gets AI-powered enrichment:
- AI-generated summary (Claude Sonnet, cached)
- Effort score (0-10 with historical comparison)
- 6-zone HR breakdown (Apple Fitness model)
- TRIMP calculation
- Training load effect (CTL/ATL before and after)
- Body region inference
- MET estimation
- HR recovery rating (2-min post-workout, 5-tier scale)
- Time-series samples: HR, speed, elevation, power, cadence (downsampled to 200 points)
- GPS route coordinates (downsampled to 300 points)

### 5.4 Plan Tab

Unified daily action feed replacing the old Events tab:
- Completed workouts (auto-populated from activity sync)
- Coach-suggested sessions (auto-created when coach prescribes exercises)
- Scheduled events
- Recovery alerts
- Start/complete/dismiss workflow per item

### 5.5 Goals & Metrics History

- Per-athlete goals: body comp targets, weekly training targets, nutrition targets, custom JSON
- Metrics history API: time-series data with stats (latest/avg/min/max) over configurable periods
- 30-day trend modals for every vital metric

### 5.6 Body Composition Tracking

- Manual entry of InBody/DEXA/scale results
- Trend visualisation over time
- Correlation with training load and nutrition data
- Future: OCR from scan photo

---

## 6. Data Pipeline

### 6.1 Data Sources & Ingestion

| Source | Method | Frequency | Status |
|---|---|---|---|
| **Apple Health (via HealthKit)** | iOS app pushes to /sync/healthkit | On change + 4h fallback | Code written, not deployed |
| **Apple Health (via HAE)** | HAE pushes to Mission Control | Real-time on change | ✅ Active (bridge) |
| **Strava** | Server-side OAuth + polling | On demand (webhook planned) | ✅ Live, 422 activities |
| **Garmin Connect** | Server-side OAuth1.0a + push | Every 15 min (webhooks preferred) | ⬜ Phase 2 |
| **Whoop** | Server-side OAuth2 + webhook | Every 15 min | ⬜ Phase 2 |
| **Oura** | Server-side OAuth2 + webhook | Every 15 min | ⬜ Phase 2 |
| **Subjective check-in** | iOS app pushes to /sync/checkin | Once daily | ✅ Endpoint live |
| **Body composition** | iOS app pushes to /sync/bodycomp | On entry | ✅ Endpoint live |
| **User Decisions** | Backend tracks follow/ignore/modify on recommendations | On each brief interaction | ✅ Design ready |

User decisions are a primary data source, equal in importance to physiological inputs. Whether an athlete followed, modified, or ignored a recommendation is signal that feeds directly into personalisation and model accuracy.

### 6.2 Data Normalisation

Raw data from different providers uses different scales, units, and granularity. The normalisation layer converts everything into a unified internal schema:

- **Heart rate:** BPM, unified zone calculation across providers
- **HRV:** RMSSD in ms (Garmin gives average, Whoop gives RMSSD, Oura gives nightly average)
- **Sleep:** Common staging model (awake, light, deep, REM) with interval merging for overlapping segments
- **Training load:** Unified acute/chronic load model (CTL/ATL/TSB), with sport-specific multipliers
- **Timestamps:** UTC internally, athlete's local timezone for display
- **Deduplication:** Same workout from HealthKit and Strava identified and merged (timestamp + activity type + duration tolerance)

Cross-device data normalisation is a core product challenge, not a pipeline detail. The differences between how Oura measures HRV (nightly average), Whoop measures HRV (RMSSD during sleep), and Garmin measures HRV (varied timing) are significant enough to produce contradictory readiness signals from the same physiological state. Solving this reliably is part of the product's intellectual property.

### 6.3 Analysis Engine

The core intellectual property. Six analysis components:

| Component | What It Does |
|---|---|
| **Readiness Signal** | Cross-references HRV trend, sleep quality, training load balance, soreness, recovery scores. Outputs a decision (Push/Train Smart/Easy/Recover), not a composite score. |
| **Training Load Management** | ATL (7-day), CTL (42-day), TSB. Detects load spikes (ATL/CTL > 1.3 = injury risk). Sport-type weighting. Monotony tracking. |
| **Sleep Analysis** | Combines objective wearable data with subjective feel. Rolling 7/14-day sleep debt. Flags fragmented sleep, insufficient deep sleep, early waking patterns. |
| **Body Composition Tracking** | Weight, SMM, body fat % trends. Correlates with training load and nutrition. Flags muscle loss during training volume increases. |
| **Adaptation Tracking** | 30/60/90 day trends. Fitness trend (CTL direction), RHR trend, HRV baseline shift, pace/power at given HR. |
| **Flag Generation** | Automated alerts: HRV trending down 3+ days, sleep debt >5h/7d, load spike, missed check-ins, protein under target, body fat trending up with static SMM, elevated RHR. |
| **Risk Scoring** | Short-term risk score (injury, burnout, missed session) and long-term trend risk. Risk is a first-class concept, not a derivative of readiness. |
| **Decision Quality Evaluation** | Tracks prediction accuracy AND whether the decision improved outcomes. Four scenarios: followed+good, followed+bad, ignored+good, ignored+bad. Each teaches the model. |

#### Temporal Modeling

The analysis engine operates across multiple time horizons simultaneously:

- **Rolling windows:** 7-day acute, 42-day chronic, and custom windows per metric. These form the basis of load management (ATL/CTL) and trend detection.
- **Decay functions:** Recent data is weighted more heavily than older data. A poor night's sleep 2 days ago matters more than one 10 days ago. Decay rates are tuned per metric type.
- **Cumulative load modeling:** Not just current load, but accumulated load over time with dissipation rates. An athlete who has been at 90% capacity for 3 weeks is in a different state than one who spiked to 90% yesterday.
- **Lagging vs leading indicators:** HRV and RHR are lagging indicators (they reflect what already happened). Training load, sleep quality, and fueling are leading indicators (they predict what will happen). The system weights leading indicators for predictions and uses lagging indicators for validation.

---

## 7. AI Engine

### 7.1 Architecture: Detection and Interpretation Layers

The AI engine has two explicitly separated layers:

**A. Detection Layer**
Statistical and ML models, time-series analysis, pattern recognition, anomaly detection. This layer processes raw normalised data and produces structured signals with confidence scores. It identifies when a prediction primitive (Section 1.5) should fire, calculates risk scores, and detects cross-metric correlations. Detection outputs are deterministic given the same inputs and are fully testable.

**B. Interpretation Layer**
LLM translates detection layer outputs into human language. Adds context, explains reasoning, suggests action. The interpretation layer never generates insights independently. It is always grounded in detection layer outputs. If the detection layer does not flag something, the interpretation layer does not surface it.

This separation is critical: detection must be reproducible and testable; interpretation must be natural and personal. A bug in detection is a data science problem. A bug in interpretation is a prompt engineering problem. Keeping them separate means each can be improved, tested, and debugged independently.

### 7.2 LLM Usage

| Function | Model | Trigger | Cost per Call |
|---|---|---|---|
| **Daily brief generation** | Claude Sonnet / GPT-4.1 | Once per athlete per day | ~$0.01-0.03 |
| **AI coaching agent** | Claude Sonnet | On athlete message | ~$0.02-0.05 |
| **Activity enrichment** | Claude Sonnet | On first activity detail view (cached) | ~$0.01-0.02 |

### 7.3 Insight Philosophy (Five Performance Levers, Priority Order)

1. **Recovery Capacity** (foundation; if the athlete can't recover, nothing else matters)
2. **Nutritional Timing and Adequacy** (day-specific fuelling, not daily averages)
3. **Training Load Distribution** (excess high-intensity clustering, Zone 2 deficiency)
4. **Event-Specific Readiness** (all advice anchored to a specific outcome with a date)
5. **Progressive Adaptation** (long-arc improvement signal across weeks)

### 7.4 Insight Quality Test

Every insight must pass three checks:
1. **Is it specific?** References actual numbers from the athlete's data.
2. **Is it cross-referenced?** Connects at least two data streams.
3. **Is it actionable?** Tells the athlete what to do today or this week.

### 7.5 Anti-Staleness Design (The Week 5 Problem)

Insight variety mechanism to prevent repetition:
- **Weeks 1-2:** Establish baseline, surface obvious gaps
- **Weeks 3-4:** Trend analysis (improving, stuck)
- **Weeks 5-8:** Predictive signals (where is this heading?)
- **Race/event prep weeks:** Race-specific briefings (gear, pacing, nutrition strategy, taper)

### 7.6 Model Confidence Evolution

The system communicates its confidence in personalisation transparently, creating a sense of progression as it learns:

| Phase | Timeline | Confidence | What the User Sees |
|---|---|---|---|
| **Learning your baseline** | Week 1-2 | Low | Insights are population-level with personal data overlay. System is establishing norms. |
| **Building your profile** | Week 3-6 | Moderate | Emerging personal patterns surface. Predictions reference the athlete's own history. |
| **Personalised** | Month 2-3 | High | Cross-domain patterns active. System references multi-week trends and personal baselines. |
| **Deep personalisation** | Month 3+ | Very high | Full learning loop active. Prediction accuracy is tracked and reported. System catches patterns specific to this athlete. |

This manages expectations and creates a sense of progression. Users understand why early insights are simpler and can see the system getting smarter over time. It also provides a natural retention mechanism: leaving at week 2 means losing a system that was just starting to learn you.

---

## 8. iOS App

### 8.1 Tech Stack

- **Language:** Swift / SwiftUI
- **Min iOS:** 17+
- **Auth:** JWT (access + refresh), Apple Sign In, email/password
- **Local storage:** Core Data or SwiftData (offline brief caching)
- **Charts:** Swift Charts (native)
- **Push:** APNs

### 8.2 Screen Map

| Screen | Purpose | Status |
|---|---|---|
| **Home / Today** | Morning brief, readiness signal, daily check-in prompt | ✅ Live |
| **Brief History** | Swipeable date picker, past briefs with summary cards | ✅ Live |
| **Coach** | AI coaching agent messaging | ✅ Text live, images pending |
| **Plan** | Daily action feed (workouts, suggestions, events, alerts) | Backend ready, iOS pending |
| **Trends** | 7/14/30-day charts: HRV, training load, sleep, body comp | Partial (7-day in brief) |
| **Activity Feed** | Synced workouts with enriched detail | ✅ Live |
| **Body Comp** | Manual entry + trend charts | Display live, entry pending |
| **Profile / Settings** | Connections, profile, events, notifications | Partial |

### 8.3 Design Direction

- Clean, minimal, dark UI (athlete/performance aesthetic)
- Information hierarchy: the brief is the hero, everything else supports it
- No dashboard overload. One screen, one decision.
- App open to brief in under 2 seconds

---

## 9. Infrastructure & Deployment

### 9.1 Current (Prototype)

| Component | Where | Details |
|---|---|---|
| P247 Backend | Home server (Tailscale) | FastAPI, SQLite, /opt/p247-backend |
| Mission Control | Same server | Node.js, port 8765 + Next.js port 3000 |
| Domain | Cloudflare | app.p247.io, p247.io |
| Website | GitHub Pages | Jekyll, p247.io/blog |
| Observability | Grafana Cloud | Alloy shipping metrics + logs |

### 9.2 Target (Production)

| Component | Technology | Notes |
|---|---|---|
| **Compute** | Kubernetes (EKS or GKE) | All services containerised |
| **Database** | PostgreSQL 16+ (managed: RDS or Cloud SQL) | TimescaleDB extension if volume warrants |
| **Cache / Queue** | Redis (managed: ElastiCache or Memorystore) | Session cache, rate limiting, job queue |
| **Object Storage** | S3 or GCS | Images, data exports, backups |
| **Background Jobs** | Celery (Python) or BullMQ (Node) | Polling, brief generation, push |
| **Ingress** | nginx-ingress or Traefik | TLS via cert-manager + Let's Encrypt |
| **CI/CD** | GitHub Actions + ArgoCD/Flux | Dev -> staging -> production |
| **Container Registry** | ECR or Artifact Registry | Tagged with git SHA + semver |
| **Monitoring** | Grafana Cloud | Dogfooding founder's expertise |
| **Region** | ap-southeast-2 (Sydney) | Australia-first. Multi-region later. |

### 9.3 Environments

| Environment | Purpose |
|---|---|
| **dev** | Single-node cluster or local (minikube/kind) |
| **staging** | Mirrors production topology, integration testing with iOS |
| **production** | Multi-node cluster, managed DB, autoscaling |

---

## 10. Business Model & Monetisation

### 10.1 Validation Status

| Stage | Status | Result |
|---|---|---|
| **Stage 1: Find the Pain** | ✅ Complete | Gate passed: 23/20 qualifying conversations confirming data-without-insight frustration |
| **Stage 2: Free Manual Audit** | ⬜ Not started | 5 athletes, 1-week free analysis. Fill from gym first, then Reddit. |
| **Stage 3: Charge From Day 1** | ⬜ Not started | 5 strangers, $49 for 4 weeks. No free trials. |
| **Stage 4: Event Package Test** | ⬜ Not started | $199 flat for 8-12 week Hyrox/marathon prep. |

### 10.2 Pricing Hypothesis

| Tier | Price | What's Included |
|---|---|---|
| **Free** | $0 | Basic brief (readiness signal only), activity sync, manual entry |
| **Premium** | ~$10-15/month | Full daily brief, AI coaching agent, all integrations, trends, plan tab, goals |
| **Group/Team** | ~$5/seat/month | Coach dashboard, multi-athlete view, team analytics |

*Pricing not validated yet. Will be tested during Stage 3.*

### 10.3 Revenue Scenarios

| Athletes | Monthly Price | MRR | ARR |
|---|---|---|---|
| 100 | $12 | $1,200 | $14,400 |
| 500 | $12 | $6,000 | $72,000 |
| 1,000 | $12 | $12,000 | $144,000 |
| 5,000 | $12 | $60,000 | $720,000 |
| 8,334 | $12 | $100,000 | $1,000,000 |

**$1M ARR target requires ~8,300 athletes at $12/month.**

### 10.4 Unit Economics (Estimated)

| Cost | Per Athlete/Month | Notes |
|---|---|---|
| LLM (briefs + coach) | ~$1.50-3.00 | 30 briefs + ~20 coach messages |
| Infrastructure | ~$0.50-1.00 | Kubernetes, DB, storage (at scale) |
| Wearable API costs | ~$0.00 | Free tier APIs |
| **Total COGS** | **~$2.00-4.00** | |
| **Gross margin** | **~67-83%** | At $12/month |

---

## 11. Roadmap

### Phase 1: Foundation (CURRENT — Complete)
*Timeline: Jan-Mar 2026 (done)*

| Deliverable | Status |
|---|---|
| Backend API with 42+ endpoints | ✅ |
| AI coaching agent (Claude Sonnet) | ✅ |
| Strava integration (OAuth + 422 activities) | ✅ |
| Activity enrichment (AI summary, HR zones, TRIMP, effort score) | ✅ |
| Admin dashboard (model assignment, token tracking, impersonation) | ✅ |
| Plan tab API | ✅ |
| Goals & metrics history API | ✅ |
| iOS app Phase 1 (briefs, coach, activities, Strava) | ✅ |
| Website + 4 landing pages | ✅ |
| Blog SEO sprint (25+ posts) | ✅ |
| GA4 + Search Console + HubSpot | ✅ |
| Reddit Stage 1 validation (23/20) | ✅ |
| Grafana Cloud observability | ✅ |

---

### Phase 2: Close the Loop (NEXT — Q2 2026)
*Timeline: April-June 2026*
*Goal: Get real athletes using the product end-to-end*

| Priority | Deliverable | Effort | Dependency |
|---|---|---|---|
| **P0** | Native HealthKit sync in iOS app | 2-3 days | Swift code written, needs Xcode integration |
| **P0** | HealthKit data processing (raw -> daily-metrics format) | 1 week | Backend, closes the data loop |
| **P0** | APNs push notification delivery | 3 days | Needs .p8 signing key from Apple Developer |
| **P0** | Apple Sign In + email/password auth | 1 week | Replace API key auth for real users |
| **P1** | Daily check-in UI in iOS app | 3 days | |
| **P1** | Coach image attachments in iOS | 2-3 days | Backend ready |
| **P1** | Plan tab UI in iOS | 3-5 days | Backend ready |
| **P1** | Hydration display in iOS | 30 min | Backend returns water_ml |
| **P1** | Profile/Settings screen completion | 3 days | |
| **P1** | Strava webhook (real-time activity sync) | 2 days | Replaces manual POST /activities/sync |
| **P2** | Full trend screens (14/30/90 day charts) | 1 week | |
| **P2** | Body comp manual entry UI | 2 days | |
| **P2** | Offline caching (cached brief + queued check-in) | 3 days | |
| **P2** | HTTP -> HTTPS redirect (Cloudflare) | 5 min | |
| **P2** | SSH key for GitHub on backend box | 10 min | |

**Phase 2 exit criteria:** Francesca (beta tester #1) using the app daily with native HealthKit sync, receiving push notification briefs, chatting with the coach. No HAE dependency.

---

### Phase 3: Validate & Charge (Q2-Q3 2026)
*Timeline: May-July 2026*
*Goal: Run validation Stages 2-4 with real product*

| Priority | Deliverable | Effort | Notes |
|---|---|---|---|
| **P0** | Stage 2: Free manual audit (5 athletes, 1 week) | 2 weeks | Gym sourcing first, then Reddit |
| **P0** | Stage 3: Paid cohort ($49, 5 strangers, 4 weeks) | 4 weeks | No free trials, no discounts |
| **P0** | TestFlight distribution | 1 day | Get app to beta testers |
| **P1** | Stripe subscription integration | 1 week | In-app purchase or web checkout |
| **P1** | Onboarding flow (connect sources, profile, first brief) | 1 week | Under 5 minutes target |
| **P1** | Stage 4: Event package test ($199, Hyrox prep) | 8-12 weeks | Parallel with Stage 3 |
| **P2** | Privacy policy + App Store compliance | 2 days | Required for public TestFlight/App Store |
| **P2** | Track B: Extended retention test (6-8 weeks) | 6-8 weeks | 2-3 Stage 3 participants |

**Phase 3 exit criteria:** Clear signal on subscription vs event package model. At least 3/5 paid participants retained. Revenue model validated.

---

### Phase 4: Wearable Expansion (Q3-Q4 2026)
*Timeline: July-October 2026*
*Goal: Multi-device support (the actual moat)*

| Priority | Deliverable | Effort | Notes |
|---|---|---|---|
| **P0** | Garmin Connect integration (OAuth1.0a + Health API) | 3 weeks | Requires partner application (2-4 week approval) |
| **P0** | Cross-device data normalisation engine | 2 weeks | HRV, sleep, training load across providers |
| **P0** | Deduplication engine (HealthKit + Strava + Garmin overlap) | 1 week | |
| **P1** | Whoop integration (OAuth2 + webhook) | 2 weeks | |
| **P1** | Oura integration (OAuth2 + webhook) | 2 weeks | |
| **P2** | MyFitnessPal / nutrition API integration | 1 week | |
| **P2** | Cross-device readiness algorithm (multi-source input) | 2 weeks | This is the IP |

**Phase 4 exit criteria:** At least 3 wearable ecosystems integrated. Briefs incorporate data from multiple devices for the same athlete. Deduplication working reliably.

---

### Phase 5: Scale (Q4 2026 - Q1 2027)
*Timeline: October 2026 - March 2027*
*Goal: Production infrastructure, App Store launch*

| Priority | Deliverable | Effort | Notes |
|---|---|---|---|
| **P0** | Migrate from SQLite to PostgreSQL | 1 week | |
| **P0** | Containerise all services (Docker) | 1 week | |
| **P0** | Kubernetes deployment (EKS or GKE) | 2 weeks | Helm charts, CI/CD, environments |
| **P0** | App Store submission + launch | 2 weeks | Review, compliance |
| **P1** | Background job infrastructure (Celery/BullMQ) | 1 week | Brief generation, polling, push |
| **P1** | Multi-athlete brief generation (timezone-aware CronJob) | 1 week | |
| **P1** | Rate limiting + abuse prevention | 3 days | |
| **P2** | Web dashboard (athlete view) | 4 weeks | |
| **P2** | Coach/team shared access | 3 weeks | B2B expansion |
| **P2** | Apple Watch companion app | 4 weeks | |
| **P2** | Widgets (Home Screen, StandBy, Lock Screen) | 2 weeks | |

---

### Phase 6: Growth & Intelligence (2027+)
*Long-term vision*

| Deliverable | Notes |
|---|---|
| Advanced ML models (replace rule-based readiness with trained model) | Requires sufficient athlete data |
| Predictive injury risk model | The ultimate moat |
| Social features (training partner comparison) | Engagement + retention |
| Android app | Market expansion |
| B2B: Gym/coach platform ($5/seat) | Recurring revenue at scale |
| InBody scan OCR (photo to data) | Remove manual entry friction |
| Gamification (streaks, badges, achievements) | Retention mechanism (fitIQ already doing this) |
| Data export API (GDPR compliance) | Required for EU expansion |
| Multi-region deployment (US/EU) | Data residency compliance |
| In-app workout recording | Only if it makes strategic sense |

---

## 12. Risks & Mitigations

### Product Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Insight quality not good enough** | Fatal | Medium | Manual validation (Stages 2-3) before building automation. If insights don't change behaviour, iterate before scaling. |
| **Week 5 staleness** | High (churn) | Medium | Anti-staleness design in insight engine. Narrative continuity across briefs. Insight type changes over time. |
| **Apple Health Coach (rumoured 2026)** | High | Low-Medium | Apple won't integrate Garmin or Whoop. Multi-device thesis holds. |
| **Whoop/Garmin adding AI interpretation** | Medium | Medium | They only see their own data. Cross-device correlation is the moat. |
| **athletedata.health gaining traction** | Medium | Medium | Specialist positioning + direct Garmin + predictive focus vs their generalist approach. |
| **Wearable API access revoked** | High | Low | Diversify integrations. HealthKit as baseline fallback. |

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **LLM cost at scale** | Medium | Low | ~$2-4/athlete/month. Margin healthy at $12/month. Cache aggressively. Use cheaper models for lower-value calls. |
| **Garmin Health API approval delay** | Medium | Medium | Apply early (Phase 3). Build against mock data. |
| **HealthKit background sync reliability** | Medium | Medium | BGTaskScheduler fallback, manual pull-to-refresh, 4h periodic sync. |
| **SQLite scaling limits** | High | High | Planned migration to PostgreSQL in Phase 5. Don't delay past 100 athletes. |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Can't find enough paying athletes** | Fatal | Medium | Validation plan specifically tests this (Stages 3-4). Red light = iterate or pivot before building. |
| **Churn after initial plateau break** | High | Unknown | Track B (6-8 week extension) specifically tests retention signal. |
| **Founder bandwidth** | High | High | Full-time Grafana job + Commit-IT + P247 + family. Prioritise ruthlessly. |

---

## 13. Open Decisions

| Decision | Options | Recommendation | Notes |
|---|---|---|---|
| **Backend language for production** | Python (FastAPI) vs TypeScript (Node/Hono) | Keep Python (FastAPI). Already built, strong ML/data ecosystem. | Team preference should override if strong Node experience. |
| **Cloud provider** | AWS (EKS) vs GCP (GKE) | GKE if Grafana expertise is a factor; EKS if team prefers AWS. | Either works. Decide based on team experience. |
| **Database** | PostgreSQL vs PostgreSQL + TimescaleDB | Start with plain PostgreSQL. Add TimescaleDB if health_samples exceeds 10M rows. | Don't over-engineer upfront. |
| **Subscription vs event packages** | Monthly sub vs fixed-term prep packages vs both | Validate both in Stage 3 and 4. Don't decide until data exists. | This is the most important business model question. |
| **Pricing** | $10/mo vs $12/mo vs $15/mo | Test $12/mo (competitive with Whoop subscription). | $3/mo (fitIQ) is too low. $15/mo needs strong differentiation. |
| **HealthKit data granularity** | Every sample vs daily aggregates | Store raw, compute aggregates. Storage is cheap. Losing granularity is irreversible. | |
| **LLM provider** | OpenAI vs Anthropic | Currently Claude Sonnet. Test both during brief generation dev. | Cost difference negligible at MVP scale. |
| **API spec** | OpenAPI 3.1 (spec-first vs code-generated) | Code-generated from FastAPI (automatic). | Already happening with FastAPI. |
| **iOS development approach** | In-house vs outsource vs hybrid | Current: outsourced iOS team. Maintain as long as velocity is good. | |

---

## 14. Reference Documents

| Document | Location | Purpose |
|---|---|---|
| Backend API Brief | p247/docs/P247-Backend-API-Development-Brief.md | Full API spec with all 42+ endpoints |
| iOS App Brief | p247/docs/P247-iOS-App-Development-Brief.md | iOS development spec |
| Phase 2 Brief | p247/docs/P247-Phase2-HealthKit-Sync-and-Notifications-Brief.md | HealthKit, push, coaching agent |
| Activity Enrichment Spec | p247/docs/P247-Activity-Detail-Enrichment-Spec.md | AI-enriched activity detail schema |
| Coach Image Support | p247/docs/P247-Coach-Image-Support-and-Prompt-Rewrite.md | Vision support for coaching agent |
| Plan Tab Brief | p247/docs/P247-Plan-Tab-iOS-Brief.md | Plan tab iOS implementation spec |
| Strava Connect Brief | p247/docs/P247-Strava-Connect-iOS-Brief.md | Strava OAuth iOS implementation |
| Competitive Landscape | knowledge/projects/health-fitness-saas/COMPETITIVE_LANDSCAPE.md | Market analysis |
| Validation Plan | knowledge/projects/health-fitness-saas/FITNESS_VALIDATION_PLAN.md | 4-stage validation methodology |
| Marketing Plan | knowledge/projects/health-fitness-saas/FITNESS_MARKETING_PLAN.md | Organic marketing strategy |
| Insight Philosophy | knowledge/projects/health-fitness-saas/FITNESS_INSIGHT_PHILOSOPHY.md | How insights are generated |
| Content Calendar | knowledge/projects/p247-content-calendar.md | Blog publishing schedule |

---

## Summary: Where We Are & What's Next

**Built:** Backend with 42+ live endpoints, AI coaching agent, Strava integration (422 activities), activity enrichment, plan tab API, admin dashboard, iOS app Phase 1, website with 25+ blog posts, SEO infrastructure, Reddit validation (Stage 1 passed).

**Immediate next step (Phase 2):** Close the data loop. HealthKit native sync, push notifications, auth, check-in UI. Get Francesca using the full product daily without HAE.

**Critical path to revenue:** Phase 2 (close the loop) -> Phase 3 (validate & charge). The entire business depends on the Stage 2-3 validation results. Everything after that is conditional on those results.

**The question this roadmap needs to answer:** Can P247 consistently make athletes change their daily decision or feel more confident in the one they made? That's the product test. Everything else is execution detail.

---

*P247 — The intelligence layer between raw data and peak performance.*
