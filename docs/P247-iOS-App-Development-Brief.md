# P247 iOS App — Development Brief

**Version:** 1.2  
**Date:** 25 March 2026  
**Author:** Myles Bruggeling, Founder  
**Status:** Phase 1 live, Phase 2 in planning  
**Companion documents:** P247 Backend API Development Brief (v1.1), P247 Phase 2 Brief (HealthKit Sync, Notifications & AI Agent)

---

## 1. Overview

P247 is a decision system for serious endurance athletes (Hyrox, Ironman, marathon, cycling). The core value proposition: cross-reference data from multiple wearables, nutrition, body composition, and subjective feel into one primary decision per day, delivered with confidence scoring and reasoning. The athlete responds (followed, modified, or ignored), and the system learns from the outcome.

The core loop: **Predict → Decide → Act → Measure → Learn.**

**This document briefs the development of the P247 iOS app (iPhone).** The app is the primary data collection layer, the decision delivery surface, and the athlete's daily touchpoint. All analysis, prediction, and decision generation lives in the cloud. The app collects, syncs, presents, and captures the athlete's response.

---

## 2. What the App Does

### 2.1 Data Collection (Primary Function)

The app aggregates health and fitness data from multiple sources and pushes it to the P247 cloud API. The athlete connects their accounts once during onboarding. Data syncs automatically in the background from that point forward.

**Data sources (priority order):**

| Source | Integration Method | Data Collected |
|---|---|---|
| **Apple Health (HealthKit)** | Native iOS SDK | HRV, resting heart rate, sleep stages, steps, active energy, workouts, body measurements, respiratory rate, blood oxygen |
| **Garmin Connect** | OAuth2 API (Health API / Wellness API) | Training load, Body Battery, sleep score, stress, Pulse Ox, activity details, VO2 Max estimate |
| **Whoop** | OAuth2 API | Recovery score, strain, HRV, sleep performance, journal entries |
| **Strava** | OAuth2 API | Activities (type, duration, distance, pace/power, heart rate zones, elevation), training log |
| **Oura** | OAuth2 API | Readiness score, sleep staging, HRV trends, temperature deviation, activity score |
| **MyFitnessPal / nutrition** | OAuth2 API (or manual entry) | Daily macros (protein, carbs, fat), total calories, meal timing, water intake (mL) |
| **InBody / body composition** | Manual entry (photo capture of scan, or typed values) | Weight, skeletal muscle mass, body fat %, visceral fat, segmental lean analysis |

**HealthKit is the foundation.** Most wearables already write to Apple Health, so even without direct API integration, the app captures a baseline from HealthKit. Direct API integrations (Garmin, Whoop, Strava, Oura) provide richer, device-specific data that HealthKit doesn't expose (e.g., Whoop strain score, Garmin Body Battery, training load breakdowns).

### 2.2 Daily Performance Brief (Primary Output)

Every morning, the P247 cloud generates a personalised performance brief based on the athlete's synced data. The app displays this brief.

**Brief contents:**
- **One Primary Decision** — Prominently displayed. The single most important thing the athlete needs to know today. Example: "Reduce intensity today. Fatigue spillover risk from yesterday's session." This is the hero element of the entire app.
- **Confidence Indicator** — High (green), Medium (amber), Low (grey). Displayed alongside the decision. Athletes should understand how certain the system is.
- **Prediction Type** — Named prediction primitive: Fatigue Spillover Risk, Performance Suppression Window, Fueling Mismatch, Load Accumulation Risk, or Recovery Instability. Gives the athlete a mental model for what the system detected.
- **Reasoning ("Why this matters")** — 2-3 sentences explaining the data behind the decision. Specific numbers, specific patterns. Not generic advice.
- **Response Buttons** — Three options: Followed / Modified / Ignored. The athlete taps one at the end of the day (or next morning). This is first-class data that feeds back into the learning loop.
- **Readiness signal** — Single clear indicator: ready to push, train smart, or recover. Not a number. A decision.
- **Key metrics summary** — HRV trend (not today's number), sleep quality, training load (acute vs chronic), recovery status
- **Adaptation tracker** — How the athlete's body is responding to training over the past 7/14/30 days
- **Event countdown** — Days to target event, periodisation phase, taper/build context
- **Emerging Patterns** — Low-confidence cross-domain signals framed as "Early signal." These are patterns the system is still building confidence on. Example: "Early signal: your deep sleep drops on nights following afternoon caffeine (3 of 5 instances)." Visually distinct from the primary decision.
- **Flags/alerts** — Anything unusual: HRV trend dropping 3+ days, sleep debt accumulating, training load spike, protein consistently under target, low hydration

### 2.3 Subjective Input (Athlete's Daily Check-In)

The app collects a quick daily input from the athlete (30 seconds max). This is critical data that no wearable captures.

**Daily check-in fields:**
- **How do you feel?** — Slider: 1 (terrible) to 10 (great)
- **Soreness/pain** — Body map tap (select muscle groups), severity (mild/moderate/severe)
- **Sleep quality** — Subjective: "Slept well" / "Woke up tired" / "Broken sleep" (3 options, one tap)
- **Nutrition yesterday** — Quick: "Hit targets" / "Under-ate" / "Over-ate" (one tap)
- **Notes** — Optional free text ("left knee flared during lunges", "skipped dinner")

This subjective data feeds into the analysis engine alongside objective wearable data.

### 2.4 Activity & Workout Logging

Athletes can view synced activities from Strava/Garmin/Apple Health. The app does NOT need to be a workout tracker (Strava and Garmin do this well). But it should:

- Display synced workouts with P247's interpretation ("This session added significant quad load. Recovery recommendation adjusted.")
- Allow manual tagging of workouts the athlete wants P247 to pay attention to
- Support manual workout entry for activities not captured by wearables (e.g., rehab exercises, physio sessions, body comp scans)

### 2.5 Body Composition Tracking

- Manual entry of InBody/DEXA/scale results (weight, SMM, body fat %, visceral fat)
- Photo capture of scan printout (future: OCR extraction)
- Trend visualisation over time
- Connection to training and nutrition data ("SMM dropped 1.2kg over 6 weeks while training volume increased 15%. Protein intake averaged 1.4g/kg, below recommended 1.8g/kg for your goals.")

---

## 3. User Experience

### 3.1 Onboarding Flow

1. **Sign up** — Email + password (or Apple Sign In)
2. **Connect data sources** — Step through each integration: Apple Health (required), then optional: Garmin, Whoop, Strava, Oura, MyFitnessPal
3. **Athlete profile** — Sport (Hyrox/Ironman/marathon/cycling/hybrid), training frequency, current event + date, key goals
4. **Body composition baseline** — Enter latest scan or skip
5. **First brief** — Delivered next morning after 24h of data collection

**Target: onboarding complete in under 5 minutes.**

**Model Confidence Evolution Display:**
After onboarding, the app should display a subtle progress indicator showing the system's personalisation level. This sets expectations that early predictions may be less precise and gets more accurate over time.

| Stage | Days of Data | Display |
|---|---|---|
| Learning Baseline | 0-14 days | "Learning your patterns" with a progress bar showing days collected |
| Personalised | 15-60 days | "Personalised to you" with a checkmark |
| Deep Personalisation | 60+ days with decision feedback | "Deeply personalised" with a double checkmark |

This indicator appears on the Home/Today screen (small, non-intrusive) and in the Profile/Settings screen (expanded view with explanation). The key message: the more you respond to decisions (followed/modified/ignored), the faster the system learns your patterns.

### 3.2 Daily Flow (How the Athlete Uses the App)

1. **Morning:** Push notification with brief summary. Open app, read full brief (60 seconds). Complete daily check-in (30 seconds).
2. **Post-session:** Activity syncs automatically. App shows P247's interpretation of the session.
3. **Weekly:** Review adaptation trends, body comp progress, training load balance.

### 3.3 Core Screens

| Screen | Purpose |
|---|---|
| **Home / Today** | Morning brief, readiness signal, today's recommendation, daily check-in prompt |
| **Brief (expanded)** | Full daily brief with all metrics, flags, and context |
| **Brief History** | Swipeable date picker showing past briefs with summary cards |
| **Coach** | AI coaching agent messaging (Phase 2) |
| **Plan** | Unified daily action feed: completed workouts, coach-suggested sessions, scheduled events, recovery alerts. Replaces the old "Events" tab. See `P247-Plan-Tab-iOS-Brief.md` for full spec. |
| **Trends** | 7/14/30-day charts: HRV trend, training load (CTL/ATL/TSB equivalent), sleep, body comp |
| **Activity Feed** | Synced workouts with P247 interpretation notes |
| **Body Comp** | Manual entry + trend charts for weight, SMM, body fat % |
| **Profile / Settings** | Connected devices, athlete profile, event details, notification preferences |

### 3.4 Design Direction

- Clean, minimal, dark UI (athlete/performance aesthetic, not clinical)
- Information hierarchy: the daily decision is the hero. Everything else supports it.
- No dashboard overload. One screen, one decision. Depth available if they want it.
- Confidence colours: High = green, Medium = amber, Low = grey. Consistent across all surfaces.
- Fast. The app should open and show the brief in under 2 seconds.

---

## 4. Technical Architecture

### 4.1 High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   iOS App        │────▶│   P247 Cloud API  │────▶│  Analysis Engine    │
│ (Swift or ObjC)  │◀────│   (REST + Push)   │◀────│  (AI/ML synthesis)  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
        │                        │
        │ HealthKit              │ OAuth2
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Apple Health    │     │  Garmin / Whoop / │
│                  │     │  Strava / Oura    │
└─────────────────┘     └──────────────────┘
```

**Key principle:** The iOS app is a thin client. It collects data, sends it to the cloud, and displays the brief. All intelligence, cross-referencing, and recommendation generation happens server-side. This keeps the app simple and allows us to iterate on the analysis engine without app updates.

### 4.2 iOS App Tech Stack (Recommended)

- **Language:** Swift or Objective-C (no language restriction; team should propose based on their strengths and the best fit for HealthKit/SwiftUI integration)
- **UI:** SwiftUI preferred (modern, faster to build, good for the screen count we need), though UIKit is acceptable if using Objective-C
- **Minimum iOS version:** iOS 17+ (HealthKit improvements, StandbyMode widget support)
- **HealthKit:** Background delivery for automatic data sync
- **Push notifications:** APNs for morning brief delivery
- **Networking:** REST API calls to P247 cloud
- **Auth:** JWT tokens, Apple Sign In, email/password
- **Local storage:** Core Data or SwiftData for offline brief caching
- **Charts:** Swift Charts (native) for trend visualisation

### 4.3 Cloud API (Separate Brief — Noted Here for Context)

The cloud API is a separate workstream. For the iOS brief, the development team needs to know:

- **API format:** RESTful JSON
- **Auth:** OAuth2 / JWT
- **Key endpoints the app will call:**

  **Briefs (✅ all live on production):**
  - `GET /briefs/today` — fetch today's morning brief ✅ **LIVE**
  - `GET /briefs/history?days=7` — fetch recent brief summaries ✅ **LIVE**
  - `GET /briefs/{YYYY-MM-DD}` — fetch brief for a specific date ✅ **LIVE**

  **Data sync (endpoints exist, processing needs Phase 2 work):**
  - `POST /sync/healthkit` — push HealthKit data batch (stores raw, Phase 2: process into daily-metrics)
  - `POST /sync/checkin` — push daily subjective check-in
  - `POST /sync/bodycomp` — push body composition entry

  **Phase 2 (not yet implemented):**
  - `POST /users/me/device-token` — register APNs device token for push notifications
  - `PUT /users/me/notification-preferences` — set notification types and timing
  - `GET /agent/messages` — AI coaching agent conversation history (includes `images` array when present)
  - `POST /agent/messages` — send message to AI coach with optional image attachments (see Section 4.6)
  - `GET /trends/{period}` — fetch trend data (7d/14d/30d)
  - `POST /connect/{provider}` — initiate OAuth2 flow for Garmin/Whoop/Strava/Oura
  
  > **Production base URL:** `https://app.p247.io` (FastAPI, auth via `x-api-key` header). Brief endpoints return full structured JSON with recovery score, metrics, coaching, events. See Backend API Development Brief for complete response schema.
  >
  > **Phase 2 brief:** See `P247-Phase2-HealthKit-Sync-and-Notifications-Brief.md` for native HealthKit sync, push notifications, and AI coaching agent architecture.
- **Wearable API integrations (Garmin, Whoop, Strava, Oura):** Handled server-side via OAuth2. The app initiates the OAuth flow, the cloud stores tokens and pulls data directly from provider APIs. The app does NOT call Garmin/Whoop/Strava APIs directly.

### 4.4 Background Sync

- **HealthKit background delivery:** The app registers for HealthKit observer queries. When new data arrives (workout complete, sleep logged, HRV reading), iOS wakes the app in the background to push data to the cloud.
- **Periodic sync:** Fallback sync every 4 hours to catch anything background delivery missed.
- **Manual sync:** Pull-to-refresh on the home screen forces an immediate sync.

### 4.5 Push Notifications

- **Morning brief:** Delivered daily at athlete's preferred time (default: 5:30am local). Server generates brief, sends push with summary. App opens to full brief.
- **Alerts:** Sent when the analysis engine flags something (e.g., "HRV trending down 4 consecutive days").
- **Weekly summary:** Optional push with weekly adaptation review.

### 4.6 Coach Image Attachments (25 March 2026)

The AI coaching agent now supports image analysis (workout whiteboards, Apple Watch screenshots, gym programming boards, Strava screenshots). The backend is live and ready to receive images. The iOS app needs the following changes:

**What the app must do when the athlete attaches a photo in the Coach tab:**

1. **Image picker:** Add a camera/gallery button to the Coach message composer. Support both camera capture and photo library selection.
2. **Compression:** Resize to max 1024px on the longest edge (keeps payload under 5MB, still readable for OCR/vision).
3. **HEIC conversion:** Convert HEIC to JPEG before sending. The backend also converts as a safety net, but doing it client-side reduces upload size.
4. **Base64 encode** the compressed JPEG.
5. **Send in the `images` array** of the `POST /agent/messages` request body.

**Request schema:**
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

**Constraints (enforced by backend, app should also enforce client-side):**
- Max 4 images per message
- Max 5MB per image (decoded)
- Allowed types: JPEG, PNG, WebP, HEIC
- No `data:` URI prefix on the base64 string

**Display in conversation history:**
- `GET /agent/messages` returns an `images` array (list of server-side paths) on messages that had images
- App should display image thumbnails inline in the chat bubble
- Tapping a thumbnail should open the full image

**Critical:** The app must NOT embed the image filename as text in the `content` field (e.g., "Attached image: photo-2026-03-24.jpg"). This is the current behaviour and it means the coach never sees the actual image, causing hallucinated responses. The image data must go in the `images` array.

See `P247-Coach-Image-Support-and-Prompt-Rewrite.md` for the full spec including edge cases, testing checklist, and cost impact.

---

## 5. Data Privacy & Compliance

- All health data is sensitive. **HTTPS only. Encrypted at rest.**
- Apple HealthKit has strict review guidelines. The app must:
  - Request only the HealthKit data types it actually uses
  - Clearly explain to the user why each data type is needed
  - Never share HealthKit data with third parties for advertising
  - Include a privacy policy accessible from the app
- **GDPR compliance** (if we expand beyond Australia): data export, deletion on request
- **Australian Privacy Act compliance:** clear consent, data retention policy, breach notification process

---

## 6. MVP Scope (Phase 1)

For the first release, ship the minimum that delivers the core value: data in, brief out.

### In Scope (Phase 1) — Status as of 23 March 2026

- [ ] Apple Health (HealthKit) integration — full background sync → **moved to Phase 2** (see Phase 2 brief); currently using HAE as bridge
- [x] Daily performance brief display — **DONE.** App connected to production `GET /briefs/today`, rendering real personalised data (recovery score, metrics, coaching, events)
- [x] Brief history — **DONE.** `GET /briefs/history` and `GET /briefs/{date}` live, app supports date picker to browse past briefs
- [x] One third-party integration: **Strava** — **DONE.** Server-side polling active (418+ activities synced), OAuth flow implemented
- [x] Body composition display — **DONE.** `body_composition` field in brief response shows InBody scan data
- [x] 7-day trends — **DONE.** `trends_7d` in brief response (avg sleep, HRV, RHR)
- [x] Recovery breakdown — **DONE.** Six-component scoring (sleep, HRV, RHR, load, deep sleep, fragmentation)
- [x] Coaching insights — **DONE.** Coaching array with typed, actionable insights
- [x] Event countdown with training phase — **DONE.** Hyrox + half marathon with phase detection
- [x] API key authentication — **DONE.** `x-api-key` header auth on all endpoints
- [ ] Hydration display — **TODO.** Backend now returns `water_ml` in `metrics.nutrition` of the brief response. iOS app needs to display this in the nutrition section of the brief. Data source: MyFitnessPal → Apple Health → HAE → backend. Requires HAE to export `dietary_water` (currently not configured).
- [ ] Daily subjective check-in (feel, soreness, sleep, nutrition, notes)
- [ ] Athlete profile + event setup (editable from app)
- [ ] Apple Sign In + email auth (currently API key only)
- [ ] Settings screen (connected devices, notification time, profile)

### Phase 2 (see `P247-Phase2-HealthKit-Sync-and-Notifications-Brief.md`)

- [x] Native HealthKit sync — **DONE.** Drop-in `HealthKitManager.swift` written (`p247/ios/HealthKitSync/`). Reads 35+ HealthKit types, background observer queries, BGTaskScheduler fallback, 14-day backfill on first launch. Backend `/sync/healthkit` ready to receive.
- [x] Push notification preferences — **DONE.** `POST /users/me/device-token`, `PUT/GET /users/me/notification-preferences` all live
- [ ] Push notification delivery — needs APNs `.p8` signing key from Apple Developer account
- [x] AI coaching agent — **DONE.** All endpoints live (`/agent/messages`, `/agent/messages/unread`, `/agent/messages/read`, `/agent/messages/{id}/feedback`). Powered by Claude Sonnet with coaching knowledge base + 14 days of athlete data.
- [x] Agent memory — **DONE.** Per-user learned facts (`/agent/memory`). Coach remembers corrections and patterns across sessions.
- [ ] Coach image attachments — **BACKEND READY, iOS TODO.** Backend accepts images via `POST /agent/messages` (see Section 4.6). iOS app needs: image picker in Coach tab, compression/HEIC conversion, thumbnail display in conversation history. See `P247-Coach-Image-Support-and-Prompt-Rewrite.md`.
- [ ] Plan tab — **BACKEND READY, iOS TODO.** "Events" tab renamed to "Plan". Unified daily action feed with completed workouts, coach workout suggestions, scheduled events, and recovery alerts. Coach auto-generates plan items when prescribing exercises. All 6 backend endpoints live (`/plan/today`, `/plan/history`, create, start, complete, dismiss). See `P247-Plan-Tab-iOS-Brief.md` for full iOS spec with card layouts, merge logic, and implementation order.
- [x] Profile management — **DONE.** `PUT /users/me` for sport, height, weight, DOB, target event.
- [x] Sync status — **DONE.** `GET /sync/status` returns canonical timestamps.
- [x] Strava Connect — **DONE.** Full OAuth flow live (`/connections/strava/initiate`, `/callback`, disconnect, refresh). See `P247-Strava-Connect-iOS-Brief.md`.
- [x] Backfill 14 days on first launch — **DONE.** Built into `HealthKitManager.swift`, auto-triggers after permission, inline progress indicator.

### Phase 3+

- Garmin Connect API integration
- Whoop API integration
- Oura API integration
- MyFitnessPal / nutrition API integration
- Apple Watch companion app
- Widgets (home screen, StandBy, Lock Screen)
- Social features (compare with training partners)
- Coach/athlete shared view
- Android app
- InBody scan OCR (photo to data)
- In-app workout recording

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Onboarding completion | >80% of signups complete onboarding |
| Daily brief open rate | >60% of active users open their brief daily |
| Daily check-in completion | >40% of active users complete check-in daily |
| Data sync reliability | >95% of HealthKit data synced within 1 hour |
| App Store rating | 4.5+ stars |
| Retention (30-day) | >50% of beta users still active at day 30 |

---

## 8. Timeline Estimate (Developer Team to Confirm)

| Phase | Duration | Deliverable |
|---|---|---|
| **Design** | 2 weeks | Wireframes + UI design for all MVP screens |
| **Core app build** | 4-6 weeks | HealthKit sync, auth, profile, check-in, brief display, notifications |
| **Strava integration** | 1 week | OAuth2 flow + activity sync |
| **Cloud API integration** | 2 weeks | All endpoint connections, error handling, offline caching |
| **QA + TestFlight** | 2 weeks | Internal testing, beta tester group via TestFlight |
| **App Store submission** | 1 week | Review, compliance, launch |

**Estimated total: 10-14 weeks from kickoff to App Store.**

*Note: This assumes the cloud API is being built in parallel by a separate team/workstream. If the API is not ready, the app can be built against mock endpoints and connected later.*

---

## 9. Open Questions for Development Team

1. **SwiftUI vs UIKit? Swift vs Objective-C?** SwiftUI + Swift recommended for speed, but we're open to Objective-C or UIKit if the team has stronger experience there or sees technical reasons to prefer it.
2. **Cloud infrastructure preference?** (AWS / GCP / Vercel / Supabase) — affects API design decisions.
3. **HealthKit data granularity:** Do we sync every heart rate sample, or daily aggregates? Tradeoff: granularity vs data volume vs battery impact.
4. **Offline support:** How much functionality should work without internet? Minimum: cached last brief + check-in queued for sync.
5. **TestFlight beta timeline:** Can we get a TestFlight build to early-access signups within 8 weeks?

---

## 10. Reference Materials

- **Website:** https://p247.io
- **Blog (product positioning):** https://p247.io/blog/
- **Athlete landing page:** https://p247.io/athletes/
- **GLP-1 landing page:** https://p247.io/glp-1/
- **Beta tester one-pager:** Available on request
- **Competitor landscape:** Whoop (recovery), Garmin Connect (training), TrainingPeaks (load management), Oura (sleep/readiness). None do cross-source synthesis.

---

**Contact:** myles@p247.io

---

*P247 — One decision per day. Learn from every outcome.*
