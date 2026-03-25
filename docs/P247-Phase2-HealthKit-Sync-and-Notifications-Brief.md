# P247 Phase 2: HealthKit Sync, Push Notifications & AI Coaching Agent

**Version:** 1.1
**Date:** 23 March 2026
**Author:** Myles Bruggeling, Founder
**Status:** Ready for iOS development team
**Depends on:** P247 iOS App (Phase 1), P247 Backend API (live at app.p247.io)

---

## 0. Implementation Decisions (Q&A Log)

The following decisions were made on 23 March 2026 in response to the iOS development team's pre-implementation questions. These are binding for Phase 2 development.

### HealthKit Permissions
- **Request during onboarding AND in Profile/Settings.** Onboarding shows an explanation screen ("P247 reads your health data to generate personalised recovery and training insights"). If the user skips, show a persistent banner on Home ("Connect Apple Health to get your daily brief"). Profile/Settings has a toggle to grant later. The app must work without HealthKit (Apple requirement), so the fallback path exists regardless.

### First-Launch Backfill
- **Start automatically, show inline progress.** After HealthKit permission is granted, immediately begin the 14-day backfill. Show a lightweight progress indicator inline on the Home screen ("Syncing 14 days of health data... 6/14"), not a blocking modal. User can browse the app while backfill runs. Each day is a separate POST. If it fails partway, pick up where it left off on next sync.

### Sync Endpoint Readiness
- **`POST /sync/healthkit` is live on production.** It accepts payloads and returns `{"status": "accepted"}`. Currently stores raw JSON in SQLite. Backend processing into daily-metrics format (so briefs update from native sync data) will be built in parallel. iOS team should build against the Phase 2 payload schema in this document. Test against production to verify accepted responses.

### Sync Timestamps
- **Backend is canonical, device caches locally.** The device caches its own last-sync timestamp for determining which HealthKit samples to query. The backend is the source of truth. `GET /sync/status` will return `{"last_healthkit_sync": "2026-03-23T07:00:00Z", ...}`. If the device's local timestamp is ahead of backend's, re-sync that window (data was lost in transit).

### Device Token Endpoint
- **`POST /users/me/device-token` is not yet live.** Will be built within days. iOS team should build the APNs registration flow and call this endpoint. It will 404 until deployed, then start working. Do not block on this.

### Notification Preferences UI
- **Build the Settings UI now with local defaults.** Toggle switches for each notification type (morning brief, health alerts, coaching, weekly summary, sync warnings) plus time picker for morning brief delivery. Store locally on device. When backend prefs endpoints go live, sync local state to backend on save. UI ships immediately, backend integration is a drop-in later.

### Coach Tab Timing
- **Ship HealthKit + notifications first. Coach tab comes after.** Two tabs for now (Today + Profile). Add Coach as third tab in a follow-up release once HealthKit sync and notifications are stable. The coaching agent needs reliable data flowing before it can say anything useful.

### Agent Message Types
- **Text only for MVP.** Ship plain text messaging first. Card rendering (mini charts, metric highlights) adds significant iOS complexity. Get the conversation loop working with text. Cards come in a point release once text flow is solid.

### Safety / Prompt Filtering
- **Backend handles all safety, not the client.** Do not block or filter prompts client-side. Send everything to the backend. The agent's system prompt includes guardrails (no medical diagnosis, no supplement prescriptions). The agent responds appropriately to medical questions ("I'm not a doctor, but here's what your data shows. Talk to your GP."). If harder blocks are needed, they're added server-side without requiring an app update.

### HAE Transition
- **No in-app messaging about HAE.** Most future users will never have used HAE. Beta testers who did will be notified via Slack/Telegram when it's time to switch. The app presents HealthKit sync as the default data path. If both HAE and native sync run simultaneously, the backend deduplicates.

---

## 1. What This Phase Delivers

Phase 1 proved the data pipeline works: Health Auto Export (HAE) pushes Apple Health data to the backend, the backend generates structured briefs, the iOS app renders them. It works, but it requires a third-party app (HAE, $4.99) sitting between Apple Health and P247.

Phase 2 removes that dependency. The P247 iOS app reads HealthKit directly, pushes data to the backend itself, receives push notifications when the daily decision is ready, and communicates with a personal AI coaching agent. Briefs now deliver one primary decision per day with a named prediction type, confidence level (High/Medium/Low), and reasoning. The athlete responds (followed/modified/ignored) and the system learns from the outcome.

**Three deliverables:**
1. Native HealthKit integration (replace HAE)
2. Push notifications (brief delivery, alerts, coaching messages)
3. AI coaching agent channel (per-user agent, in-app messaging)

---

## 2. HealthKit Integration

### 2.1 Why Native Over HAE

| | HAE (current) | Native HealthKit (target) |
|---|---|---|
| Cost to user | $4.99 one-time | Free (built into P247) |
| Setup friction | Download HAE → configure export → set server URL → enable automations | Grant HealthKit permission during P247 onboarding |
| Background sync | Relies on iOS Shortcuts/automations (unreliable, breaks on OS updates) | Native HealthKit observer queries (Apple-supported, reliable) |
| Data freshness | Every 1-6 hours depending on automation settings | Near real-time via observer callbacks |
| Workout data | Sends summary only | Full access to workout route, splits, HR zones, samples |
| Control | No control over data format, versioning, or field naming | Full control over what we read and how we send it |
| App Store | N/A | Required for a real product (can't ship telling users to buy another app) |

### 2.2 HealthKit Data Types to Request

Request only what P247 uses. Apple rejects apps that request data types they don't clearly need.

**Read permissions (HKObjectType):**

| Category | HealthKit Identifier | P247 Field | Aggregation |
|---|---|---|---|
| **Heart** | HKQuantityTypeIdentifierHeartRateVariabilitySDNN | hrv | Daily average (ms) |
| | HKQuantityTypeIdentifierRestingHeartRate | resting_hr | Daily average (bpm) |
| | HKQuantityTypeIdentifierHeartRate | heart_rate_samples | Min/max/avg per day |
| | HKQuantityTypeIdentifierCardioRecovery | cardio_recovery_bpm | Latest reading |
| | HKQuantityTypeIdentifierVO2Max | vo2max | Latest reading (mL/min/kg) |
| **Sleep** | HKCategoryTypeIdentifierSleepAnalysis | sleep_hours, sleep_core, sleep_deep, sleep_rem, sleep_awake | Sum durations by stage per night |
| | HKQuantityTypeIdentifierAppleSleepingWristTemperature | apple_sleeping_wrist_temperature | Nightly average (°C) |
| **Respiratory** | HKQuantityTypeIdentifierRespiratoryRate | respiratory_rate | Daily average (breaths/min) |
| | HKQuantityTypeIdentifierOxygenSaturation | blood_oxygen_saturation | Daily average (%) |
| **Activity** | HKQuantityTypeIdentifierStepCount | step_count | Daily sum |
| | HKQuantityTypeIdentifierDistanceWalkingRunning | distance_km | Daily sum (km) |
| | HKQuantityTypeIdentifierActiveEnergyBurned | active_calories | Daily sum (kcal) |
| | HKQuantityTypeIdentifierBasalEnergyBurned | basal_calories | Daily sum (kcal) |
| | HKQuantityTypeIdentifierAppleExerciseTime | exercise_min | Daily sum (min) |
| | HKQuantityTypeIdentifierFlightsClimbed | flights_climbed | Daily sum |
| | HKQuantityTypeIdentifierTimeInDaylight | daylight_min | Daily sum (min) |
| **Running** | HKQuantityTypeIdentifierRunningSpeed | running_speed_kmh | Workout average |
| | HKQuantityTypeIdentifierRunningPower | running_power_w | Workout average |
| | HKQuantityTypeIdentifierRunningStrideLength | running_stride_m | Workout average |
| | HKQuantityTypeIdentifierRunningVerticalOscillation | running_oscillation_cm | Workout average |
| | HKQuantityTypeIdentifierRunningGroundContactTime | running_ground_contact_time | Workout average (ms) |
| **Nutrition** | HKQuantityTypeIdentifierDietaryProtein | protein_g | Daily sum (g) |
| | HKQuantityTypeIdentifierDietaryCarbohydrates | carbs_g | Daily sum (g) |
| | HKQuantityTypeIdentifierDietaryFatTotal | total_fat | Daily sum (g) |
| | HKQuantityTypeIdentifierDietaryFiber | fiber_g | Daily sum (g) |
| | HKQuantityTypeIdentifierDietaryEnergyConsumed | dietary_energy_kj | Daily sum (kcal) |
| | HKQuantityTypeIdentifierDietarySugar | sugar_g | Daily sum (g) |
| | HKQuantityTypeIdentifierDietaryPotassium | potassium_mg | Daily sum (mg) |
| | HKQuantityTypeIdentifierDietaryCholesterol | cholesterol | Daily sum (mg) |
| | HKQuantityTypeIdentifierNumberOfAlcoholicBeverages | alcohol_drinks | Daily sum |
| **Body** | HKQuantityTypeIdentifierBodyMass | weight_kg | Latest reading |
| | HKQuantityTypeIdentifierBodyFatPercentage | body_fat_pct | Latest reading |
| | HKQuantityTypeIdentifierLeanBodyMass | lean_body_mass | Latest reading |
| **Walking** | HKQuantityTypeIdentifierWalkingSpeed | walking_speed_kmh | Daily average |
| **Workouts** | HKWorkoutType | workouts[] | Full workout objects |

**No write permissions needed in Phase 2.** P247 is read-only from HealthKit.

### 2.3 Background Sync Architecture

```
┌──────────────────────────────────────────────────────┐
│                  iOS App (P247)                       │
│                                                       │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ HealthKit        │    │ Sync Manager             │  │
│  │ Observer Queries  │───▶│                          │  │
│  │ (background)     │    │ • Batch by date           │  │
│  └─────────────────┘    │ • Aggregate per rules     │  │
│                          │ • Deduplicate             │  │
│  ┌─────────────────┐    │ • Queue for upload        │  │
│  │ Manual Sync      │───▶│                          │  │
│  │ (pull-to-refresh)│    └──────────┬──────────────┘  │
│  └─────────────────┘               │                  │
│                                     │ HTTPS POST      │
│  ┌─────────────────┐               │                  │
│  │ Periodic Sync    │───────────────┘                  │
│  │ (BGTaskScheduler │                                  │
│  │  every 2-4 hours)│                                  │
│  └─────────────────┘                                   │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │  POST /sync/healthkit     │
            │  app.p247.io              │
            │  Header: x-api-key        │
            └──────────────────────────┘
```

**Three sync triggers:**

1. **Observer queries (primary).** Register `HKObserverQuery` for each data type. iOS wakes the app in the background when new samples arrive. The app reads new samples since last sync, batches them, and POSTs to the backend. This is the Apple-recommended approach and is reliable across OS updates.

2. **BGTaskScheduler (fallback).** Register a `BGAppRefreshTask` that fires every 2-4 hours. On wake, query HealthKit for any samples since the last successful sync timestamp. This catches anything the observer missed (rare, but it happens).

3. **Manual sync (user-initiated).** Pull-to-refresh on the home screen or a sync button in settings. Queries HealthKit for the last 7 days and re-uploads everything. Useful for initial setup and debugging.

4. **First-launch backfill.** Triggered automatically after HealthKit permission is granted. Queries HealthKit for the last 14 days, sends one POST per day. Shows inline progress on the Home screen ("Syncing 14 days of health data... 6/14"). Non-blocking (user can browse while it runs). Resumes from last successful day if interrupted.

### 2.4 Sync Payload Format

The app should aggregate HealthKit samples into daily summaries before sending. Don't send raw samples (too many, too large). One POST per day of data.

**POST `/sync/healthkit`**

```json
{
  "date": "2026-03-23",
  "timezone": "Australia/Sydney",
  "device_sync_timestamp": "2026-03-23T07:00:00+11:00",
  "metrics": {
    "hrv": 32,
    "resting_hr": 57,
    "heart_rate_samples": { "avg": 72, "min": 45, "max": 165, "count": 1440 },
    "step_count": 8432,
    "distance_km": 6.2,
    "active_calories": 520,
    "basal_calories": 1854,
    "exercise_min": 45,
    "vo2max": 39.7,
    "daylight_min": 35,
    "respiratory_rate": 18,
    "blood_oxygen_saturation": 97,
    "protein_g": 145,
    "carbs_g": 280,
    "total_fat": 65,
    "fiber_g": 22,
    "dietary_energy_kj": 2100,
    "sugar_g": 45,
    "walking_speed_kmh": 5.2,
    "cardio_recovery_bpm": 25,
    "apple_sleeping_wrist_temperature": 36.3,
    "alcohol_drinks": 0
  },
  "sleep": {
    "total_hours": 7.2,
    "core_hours": 4.8,
    "deep_hours": 0.9,
    "rem_hours": 1.5,
    "awake_hours": 0.3,
    "in_bed_start": "2026-03-22T22:15:00+11:00",
    "in_bed_end": "2026-03-23T05:45:00+11:00",
    "source": "Apple Watch"
  },
  "workouts": [
    {
      "type": "FunctionalStrengthTraining",
      "start": "2026-03-23T06:00:00+11:00",
      "end": "2026-03-23T06:55:00+11:00",
      "duration_seconds": 3300,
      "energy_kcal": 420,
      "avg_heart_rate": 145,
      "max_heart_rate": 172,
      "distance_m": null,
      "source": "Apple Watch"
    }
  ],
  "running_mechanics": {
    "running_speed_kmh": 10.2,
    "running_power_w": 285,
    "running_stride_m": 1.12,
    "running_oscillation_cm": 8.2,
    "running_ground_contact_time": 248
  }
}
```

**Important implementation notes:**

- **Sleep date attribution.** Apple Health stamps sleep by wake-up date. Monday night's sleep is stored under Tuesday. The backend handles this already (merges next day's sleep into the activity date). The app should send sleep under the wake-up date and let the backend handle the merge logic.
- **Energy units.** HealthKit returns active/basal energy in kilocalories (kcal). HAE was sending kilojoules (kJ) and the backend was converting. The app should send kcal directly. The backend field `dietary_energy_kj` is misnamed but actually stores kcal. Send the kcal value as-is.
- **Deduplication.** If the user also has Strava, the same workout may appear in both HealthKit and Strava data. The backend already deduplicates (matches on timestamp + type + duration within tolerance). The app doesn't need to worry about this.
- **Backfill on first launch.** When the user first grants HealthKit access, backfill the last 14 days of data. Send one POST per day. This gives the backend enough data to generate trends immediately.

### 2.5 Backend Changes Required

The current `/sync/healthkit` endpoint stores raw payloads in SQLite. For Phase 2, it needs to:

1. **Parse the structured payload** into `daily-metrics.json` format (same as HAE does today)
2. **Merge into the existing data store** (so briefs continue working)
3. **Trigger brief regeneration** if the data changes today's or yesterday's metrics
4. **Return sync status** including last sync timestamp and any warnings

This is a backend workstream that can run in parallel with the iOS HealthKit work.

### 2.6 Transition Plan (HAE to Native)

| Step | Action |
|---|---|
| 1 | Ship P247 app with HealthKit sync enabled |
| 2 | Both HAE and native sync run in parallel (backend deduplicates) |
| 3 | Validate 7 days of native sync data matches HAE data |
| 4 | Disable HAE automation on test device |
| 5 | Monitor for 3 days to confirm no data gaps |
| 6 | Update onboarding to remove HAE instructions |
| 7 | HAE remains as optional fallback for users who prefer it |

---

## 3. Push Notifications

### 3.1 Notification Types

| Type | When | Content | Priority |
|---|---|---|---|
| **Morning Brief** | Daily at athlete's preferred time (default 5:30am local) | "🟡 Reduce intensity today. Fatigue Spillover Risk (High confidence). HRV down 15%, sleep fragmented." | Normal |
| **Health Alert** | When analysis engine detects a flag | "HRV down 4 consecutive days. Consider a recovery day." | High |
| **Coaching Message** | When the AI agent has something to say | "Your deep sleep improved 40% this week. The magnesium and earlier bedtime are working." | Normal |
| **Weekly Summary** | Sunday evening | "This week: avg recovery 68, 5 training sessions, CTL +3. You're on track for Hyrox." | Low |
| **Sync Warning** | 24h with no HealthKit data received | "Haven't received health data in 24 hours. Open P247 to sync." | Normal |

### 3.2 Implementation

**Server-side (APNs):**
- Backend stores device token (registered during app launch)
- Brief generation cron runs at 4:00am per-user timezone
- After brief is generated and stored, send push via APNs
- Use `mutable-content: 1` for rich notifications (the app can modify the notification content using a Notification Service Extension)

**iOS-side:**
- Request notification permission during onboarding (explain value: "Get your morning brief delivered as a notification")
- Register for remote notifications, send device token to `POST /users/me/device-token`
- Implement `UNUserNotificationCenter` delegate for foreground handling
- Notification tap opens the app to the relevant brief

**New backend endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/me/device-token` | Register APNs device token |
| PUT | `/users/me/notification-preferences` | Set notification types and timing |
| GET | `/users/me/notification-preferences` | Get current preferences |

### 3.3 Notification Preferences (stored per user)

```json
{
  "morning_brief_enabled": true,
  "morning_brief_time": "05:30",
  "health_alerts_enabled": true,
  "coaching_messages_enabled": true,
  "weekly_summary_enabled": true,
  "sync_warnings_enabled": true
}
```

---

## 4. AI Coaching Agent Architecture

### 4.1 The Decision: Per-User Agent vs Shared Agent

**Recommendation: Per-user agent instance, shared model.**

This means each athlete gets their own agent that maintains its own conversation history, memory, and context. But they all run the same underlying model and system prompt. Here's why:

**Why per-user (not shared):**

| Concern | Per-User Agent | Shared Agent |
|---|---|---|
| **Privacy** | Each agent only sees its own athlete's data. Zero cross-contamination risk. | Requires strict data isolation at the prompt level. One bug and athlete A sees athlete B's blood pressure. |
| **Context window** | Full context budget for one athlete's history, trends, and conversation. | Context split across multiple athletes. Quality degrades as user count grows. |
| **Personalisation** | Agent learns individual patterns over time: "This athlete always trains fasted", "Their HRV drops after alcohol." | Generic coaching that treats every athlete the same. |
| **Conversation history** | Clean, continuous thread. "Last week you mentioned your knee was sore. How's it feeling?" | Impossible to maintain meaningful conversation continuity across athletes. |
| **Cost** | Higher (one context per user). But at early scale (<1000 users) this is negligible. | Lower per-request cost but worse outcomes. |

**Why not fully independent agents:**
- All agents share the same system prompt (P247 coaching persona, sport science knowledge, safety guidelines)
- All agents use the same analysis engine (recovery scoring, training load, flag generation)
- Agent "memory" is structured data (athlete profile + health history), not free-form text
- The LLM call is stateless: agent context is reconstructed from the database on each request

**Architecture:**

```
┌────────────────────────────────────────────────────┐
│                   P247 Backend                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │            Agent Orchestrator                  │  │
│  │                                                │  │
│  │  athlete_123 ──▶ Agent(context=athlete_123)    │  │
│  │  athlete_456 ──▶ Agent(context=athlete_456)    │  │
│  │  athlete_789 ──▶ Agent(context=athlete_789)    │  │
│  │                                                │  │
│  │  Shared:                                       │  │
│  │   • System prompt (coaching persona)           │  │
│  │   • Analysis engine (recovery, load, flags)    │  │
│  │   • Sport science knowledge base               │  │
│  │   • Safety guardrails                           │  │
│  │                                                │  │
│  │  Per-user:                                     │  │
│  │   • Athlete profile (age, weight, goals, events)│  │
│  │   • Health history (last 30 days of metrics)    │  │
│  │   • Conversation history (last 20 messages)     │  │
│  │   • Learned preferences and patterns            │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 4.2 Agent Capabilities

The agent is NOT a generic chatbot. It's a specialist performance coach with access to the athlete's data.

**What the agent can do:**
- Answer questions about the athlete's own data: "How did I sleep last week?" "What's my HRV trend?"
- Explain brief recommendations: "Why are you telling me to take it easy today?"
- Provide coaching context: "Should I do my long run tomorrow or Wednesday?"
- Proactively reach out with insights (via push notification): "Your protein has been below target 4 of the last 5 days."
- Adjust recommendations based on conversation: Athlete says "I'm feeling great despite the low HRV" → agent factors subjective feel into the recommendation

**What the agent cannot do:**
- Diagnose medical conditions
- Prescribe supplements or medication
- Access another athlete's data
- Override safety guardrails (e.g., recommending training on critical recovery)

### 4.3 In-App Messaging

The app needs a messaging interface for the agent channel. This is not a full chat platform. It's a focused coaching conversation.

**UI:**
- Tab bar item: "Coach" (or integrated into the Brief view as an expandable section)
- Simple message list: agent messages (left-aligned) and athlete messages (right-aligned)
- Text input with send button
- Messages persist across app launches (stored on backend)
- Agent messages can include structured data (mini charts, metric cards) via a custom message type

**API endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/agent/messages` | Get conversation history (paginated) |
| POST | `/agent/messages` | Send a message to the agent, get response |
| GET | `/agent/messages/unread` | Get count of unread agent messages |
| POST | `/agent/messages/read` | Mark messages as read |

**Message schema:**

```json
{
  "id": "msg_abc123",
  "role": "agent",
  "content": "Your deep sleep improved 40% this week compared to last. The magnesium supplementation and earlier bedtime are clearly working. Keep this routine locked in.",
  "timestamp": "2026-03-23T05:30:00+11:00",
  "type": "text",
  "read": false
}
```

For structured content (mini charts, metric highlights), use `type: "card"` with a `card` object:

```json
{
  "id": "msg_def456",
  "role": "agent",
  "content": "Here's your sleep trend this week:",
  "type": "card",
  "card": {
    "title": "Sleep This Week",
    "data": [
      { "date": "2026-03-17", "value": 6.2, "label": "Mon" },
      { "date": "2026-03-18", "value": 7.1, "label": "Tue" },
      { "date": "2026-03-19", "value": 5.8, "label": "Wed" }
    ],
    "unit": "hours",
    "target": 7.5
  },
  "timestamp": "2026-03-23T05:30:00+11:00",
  "read": false
}
```

### 4.4 Agent Message Triggers

The agent doesn't just respond to user messages. It proactively sends insights:

| Trigger | Example Message |
|---|---|
| Brief generated (daily) | "Morning. Today's decision: Push intensity if the program calls for it. Fatigue Spillover Risk is low (High confidence). HRV bounced back, sleep was solid." |
| Pattern detected | "I've noticed your deep sleep drops below 30 min every time you log alcohol. Last 4 instances confirm this pattern." |
| Goal milestone | "100 days to Hyrox. You're in Phase 1 (Aerobic Base). CTL is tracking to plan." |
| Data gap | "No nutrition data logged for 3 days. Tracking protein is important for your muscle mass goals." |
| Weekly reflection | "This week: 5 sessions, recovery averaged 65, sleep averaged 6.4h. The sleep is the bottleneck. Everything else is solid." |

### 4.5 Cost Considerations at Scale

| Users | Agent calls/day (1 proactive + avg 2 user msgs) | Est. monthly cost (Claude Sonnet) |
|---|---|---|
| 10 (beta) | 30 | ~$5 |
| 100 | 300 | ~$50 |
| 1,000 | 3,000 | ~$500 |
| 10,000 | 30,000 | ~$5,000 |

This is manageable. The agent call includes ~2K tokens of athlete context + ~500 tokens of conversation history + ~200 tokens of response. At Sonnet pricing (~$3/M input, $15/M output), each call costs roughly $0.005.

For cost control:
- Cache the daily brief context (generated once, reused for all agent calls that day)
- Limit conversation history to last 20 messages
- Use a cheaper model (Haiku) for simple Q&A, Sonnet for coaching insights
- Rate limit to 10 user-initiated messages per day (prevents abuse)

---

## 5. Implementation Priority

| Priority | Feature | Effort | Dependency | Status |
|---|---|---|---|---|
| 1 | HealthKit observer queries + background sync | iOS: 2-3 weeks | Backend `/sync/healthkit` processing (parallel) | ✅ `HealthKitManager.swift` written (drop-in). Backend endpoint ready. Needs integration into app + testing. |
| 2 | Backfill (14 days on first launch) | iOS: 2-3 days | HealthKit sync working | ✅ Built into HealthKitManager. Auto-triggers after permission with inline progress. |
| 3 | Notification preferences UI in Settings | iOS: 2-3 days | None (local storage first) | ✅ Backend endpoints live (`PUT/GET /users/me/notification-preferences`) |
| 4 | Push notification registration + morning brief delivery | iOS: 1 week, Backend: 1 week | APNs `.p8` key | ⏳ Device token endpoint live; APNs sending needs `.p8` key |
| 5 | Agent messaging UI (text only) | iOS: 1 week | Backend agent endpoints | ✅ All backend endpoints live, iOS Coach tab connected |
| 6 | Proactive agent messages + notifications | Backend: 1-2 weeks | Push notifications working | ✅ Backend can inject proactive messages (weekly reports, pattern alerts) |
| 7 | Structured agent cards (mini charts) | iOS: 1 week | Agent messaging working | ⏳ Text-only for now per MVP decision |
| 8 | Agent memory + feedback | Backend | Agent messaging working | ✅ Live (`/agent/memory`, `/agent/messages/{id}/feedback`) |
| 9 | Profile management from app | iOS + Backend | None | ✅ `PUT /users/me` live, `GET /sync/status` live |

**Phase 2a (HealthKit sync + notifications):** Items 1-4. HealthKitManager.swift written and ready to integrate. Remaining: drop into Xcode project, test on device, APNs `.p8` key for push delivery.
**Phase 2b (Coach tab + agent):** Items 5-9. ✅ All backend work complete. iOS Coach tab connected and working. Personality calibration live.
**Remaining iOS work:** Integrate HealthKitManager.swift into app build (~2-3 days), APNs delivery (~1 week), agent card rendering (future).

**Reference implementations:**
- HealthKit sync: `p247/ios/HealthKitSync/HealthKitManager.swift` + `README.md`
- Strava Connect: `p247/docs/P247-Strava-Connect-iOS-Brief.md`

---

## 6. Coach Personality & Athlete Onboarding

### 6.1 The Problem

Every athlete is different. A 25-year-old CrossFit competitor wants a coach who pushes hard and talks like a drill sergeant. A 52-year-old dad training for his first Hyrox wants encouragement and practical advice that fits around a busy life. A GLP-1 patient rebuilding their relationship with exercise needs gentle, non-judgmental guidance.

A one-size-fits-all coach tone will alienate most users. P247's differentiator is that the coach adapts to the athlete, not the other way around.

### 6.2 Coach Personality Calibration (Onboarding Flow)

During onboarding (after HealthKit permission, before the first brief), the app asks 3-4 quick questions that shape the coach's personality. These are stored in the athlete's profile and injected into the agent's system prompt.

**Question 1: Coaching style preference**

"How do you like your coaching?"

- 🔥 **Push me hard.** I want to be challenged. Don't sugarcoat it.
- ⚖️ **Balanced.** Honest but encouraging. Tell me what I need to hear.
- 🌱 **Supportive.** I'm building a habit. Encouragement matters more than metrics.

**Question 2: Experience level**

"How long have you been training seriously?"

- 🆕 Less than a year
- 📈 1-3 years
- 💪 3+ years

**Question 3: What matters most right now?**

- 🏁 I have a specific event/race I'm training for
- 📊 I want to understand my body better
- 🔄 I'm rebuilding after injury/illness/time off
- ⚡ I want to perform at my best every day

**Question 4 (optional): Anything I should know?**

Free text. "I have bad knees." "I train fasted." "I hate running but I'm doing Hyrox anyway." This goes straight into athlete memory.

### 6.3 How Personality Shapes the Coach

The answers map to a personality modifier that's prepended to the system prompt:

**Push me hard:**
> "This athlete wants direct, no-nonsense coaching. They respond well to being challenged. Call out bad habits directly. Use language like 'that's not good enough for your goals' and 'you're leaving performance on the table.' They don't need hand-holding."

**Balanced (default):**
> "This athlete wants honest, warm coaching. Lead with what's going well, then address what needs work. Frame challenges as opportunities. Use 'we' and 'let's' language. Be a trusted partner, not a drill sergeant."

**Supportive:**
> "This athlete is building habits and confidence. Celebrate every win, no matter how small. Never use words like 'behind', 'failing', or 'not enough.' Frame everything positively: 'you showed up today, that's what matters' and 'small steps compound.' Be patient and encouraging."

Experience level adjusts the technical depth:

- **< 1 year:** Explain concepts. Don't assume they know what HRV, CTL, or Zone 2 means. Use analogies.
- **1-3 years:** Can handle data and some jargon. Explain less common terms but don't over-simplify.
- **3+ years:** Talk peer-to-peer. Use technical terms freely. They want the nuance.

### 6.4 Backend Implementation

Store personality preferences in the user profile:

```json
{
  "coaching_style": "balanced",
  "experience_level": "advanced",
  "primary_goal": "event",
  "onboarding_notes": "Bad knees, trains fasted, hates running"
}
```

New endpoint:

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/users/me/coaching-preferences` | Set coaching style, experience, goal |
| GET | `/users/me/coaching-preferences` | Get current coaching preferences |

The agent router loads these preferences and prepends the appropriate personality modifier to the system prompt before each call. The coaching knowledge base stays the same. Only the communication style changes.

### 6.5 First Coach Message

After onboarding, the coach sends a welcome message that matches the selected personality. This is the athlete's first impression.

**Push me hard + advanced + event:**
> "Right. I've got your data. Let me tell you where you stand. Your body comp is solid but your aerobic engine needs work, and your sleep is costing you. I'll be straight with you because that's what you asked for. We've got 14 weeks to get you race-ready. Let's get to it."

**Balanced + intermediate + understand body:**
> "Hey, welcome to P247. I've had a look at your health data and there's some really interesting stuff in here. Over the next few days I'll start building a picture of your patterns and what's working well. Feel free to ask me anything about your numbers. I'm here to help you make sense of it all."

**Supportive + beginner + rebuilding:**
> "Welcome! I'm really glad you're here. The fact that you've started tracking your health data is a huge step, and I'm going to help you understand what it all means. There's no pressure and no judgment. We'll take it at your pace. If you ever have a question, just ask. That's what I'm here for."

### 6.6 Coach Can Adapt Over Time

Personality isn't locked at onboarding. The coach should evolve:

- If an athlete consistently gives thumbs-down to soft coaching, the system can suggest: "Would you like me to be more direct with my feedback?"
- If a "push me hard" athlete starts showing signs of burnout (declining HRV, missed sessions), the coach should temporarily soften without being asked.
- Athletes can change their preference any time from Settings.

This is Phase 3 territory but the data model should support it from the start.

---

## 7. App Store Review Considerations

Apple reviews HealthKit apps carefully. Key requirements:

1. **Privacy policy** must explain exactly what health data is collected and how it's used
2. **HealthKit usage descriptions** in Info.plist must clearly explain why each data type is needed (e.g., "P247 reads your heart rate variability to assess daily recovery and generate personalised training recommendations")
3. **No HealthKit data in iCloud backup** (Apple requirement)
4. **No sharing HealthKit data with third parties** for advertising or data brokering
5. **Must work without HealthKit** (graceful degradation if user denies permission)
6. **Background processing** must be declared in capabilities and justified

---

## 7. Summary

Phase 2 transforms P247 from "a nice dashboard that needs a third-party app" into "a complete athlete intelligence platform." The athlete installs one app, grants HealthKit permission, and gets personalised daily briefs with an AI coach that knows their data. No setup friction, no HAE dependency, no manual syncing.

The per-user agent architecture ensures privacy and personalisation from day one, while keeping infrastructure costs predictable. As the user base grows, the shared model + per-user context approach scales linearly, not exponentially.
