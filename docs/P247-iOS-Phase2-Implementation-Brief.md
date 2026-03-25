# P247 iOS: Phase 2 Implementation Brief

**Date:** 25 March 2026  
**For:** iOS Development Team  
**From:** Myles Bruggeling, Founder  
**Status:** Backend ready. iOS work required.  
**Production API:** `https://app.p247.io`  
**Auth:** `x-api-key` header on all requests

---

## What This Covers

Four features the iOS app needs. Backend is live and tested for all of them. The app just needs to wire in.

---

## 1. HealthKit Native Sync (Replace Health Auto Export)

Currently the app relies on a third-party app (Health Auto Export) to get Apple Health data to the backend. This needs to go. The P247 app should read HealthKit directly and push data to our API.

### Drop-in Code

`HealthKitManager.swift` is written and ready: `p247/ios/HealthKitSync/HealthKitManager.swift`

It handles:
- Permission requests for all 35+ HealthKit types P247 uses
- Background observer queries (iOS wakes the app when new data arrives)
- BGTaskScheduler fallback sync every 2-4 hours
- 14-day backfill on first launch with inline progress
- Daily aggregation (raw samples → one summary per day)
- Deduplication

### What You Need To Do

1. **Add `HealthKitManager.swift` to the Xcode project**
2. **Add capabilities:** HealthKit, Background Modes (Background fetch, Background processing)
3. **Add Info.plist usage descriptions** for every HealthKit type (Apple rejects without these)
4. **Call `HealthKitManager.shared.requestAuthorization()`** during onboarding
5. **Show backfill progress** inline on the Home screen ("Syncing 14 days of health data... 6/14")
6. **Register background tasks** in `AppDelegate` / `@main` App struct

### API Endpoint

**`POST /sync/healthkit`** (live, tested)

```json
{
  "date": "2026-03-25",
  "timezone": "Australia/Sydney",
  "device_sync_timestamp": "2026-03-25T07:00:00+11:00",
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
    "water_ml": 2400,
    "potassium_mg": 3500,
    "walking_speed_kmh": 5.2,
    "apple_sleeping_wrist_temperature": 36.3,
    "alcohol_drinks": 0
  },
  "sleep": {
    "total_hours": 7.2,
    "core_hours": 4.8,
    "deep_hours": 0.9,
    "rem_hours": 1.5,
    "awake_hours": 0.3,
    "in_bed_start": "2026-03-24T22:15:00+11:00",
    "in_bed_end": "2026-03-25T05:45:00+11:00",
    "source": "Apple Watch"
  },
  "workouts": [
    {
      "type": "FunctionalStrengthTraining",
      "start": "2026-03-25T06:00:00+11:00",
      "end": "2026-03-25T06:55:00+11:00",
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

**Response:** `{"status": "accepted", "user": "...", "received_at": "...", "records": 1}`

### Important Notes

- Send one POST per day of data, not raw samples
- Energy units: send kcal (the field name `dietary_energy_kj` is a legacy misnomer, it expects kcal)
- Sleep: attribute to wake-up date (Monday night's sleep = Tuesday's POST)
- The app must work without HealthKit permission (Apple requirement). Show a banner prompting to connect.
- Backfill: 14 days on first permission grant, one POST per day, resume if interrupted

### Verify Sync Is Working

`GET /sync/stats` returns counts per data type:
```json
{"user": "...", "healthkit_syncs": 14, "checkins": 0, "body_compositions": 0}
```

`GET /sync/status` returns last sync timestamps:
```json
{"last_healthkit_sync": "2026-03-25T07:00:00Z", "last_checkin": null, "last_bodycomp": null}
```

**Estimate:** 2-3 days to integrate HealthKitManager.swift + test on device.

---

## 2. Coach Image Attachments

The Coach tab currently drops images silently. When an athlete attaches a photo, the app puts the filename as text ("Attached image: photo-2026-03-24.jpg") instead of sending the actual image data. The coach never sees the image and hallucinates a response.

### What You Need To Do

1. **Add image picker** to the Coach message composer (camera + photo library)
2. **On image selection:**
   - Resize to max 1024px on longest edge
   - Convert HEIC to JPEG
   - Base64 encode the result
3. **Send in the `images` array** of the POST request (NOT as text in `content`)
4. **Display image thumbnails** in conversation history (tap to view full size)

### API: `POST /agent/messages` (updated, live)

```json
{
  "content": "Here's today's workout",
  "images": [
    {
      "data": "<base64-encoded JPEG, no data: prefix>",
      "mime_type": "image/jpeg",
      "filename": "workout.jpg"
    }
  ]
}
```

### Validation (enforced server-side, enforce client-side too)

- Max **4 images** per message
- Max **5MB** per image (decoded size)
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- HEIC is auto-converted to JPEG server-side as a safety net

### Response

Same as text-only, plus `images` array on the user message:

```json
{
  "user_message": {
    "id": "msg_35",
    "role": "user",
    "content": "Here's today's workout",
    "type": "text",
    "read": true,
    "timestamp": "2026-03-25T00:00:00Z",
    "images": ["images/1_abc123def456.jpg"]
  },
  "agent_message": {
    "id": "msg_36",
    "role": "agent",
    "content": "Mixed modal session today...",
    "type": "text",
    "read": false,
    "timestamp": "2026-03-25T00:00:05Z"
  }
}
```

### Conversation History

`GET /agent/messages` now returns `images` on messages that had attachments. Display these as thumbnails in the chat view.

### Critical

**Do NOT put the filename or "Attached image:" text into the `content` field.** That's the current bug. The image data must go in the `images` array as base64. The `content` field should only contain the athlete's typed text (or empty string if they just sent a photo with no caption).

**Estimate:** 1-2 days for image picker + compression. 1 day for thumbnail display in history.

---

## 3. Hydration Display

The brief nutrition section now returns `water_ml`. Display it alongside the existing nutrition metrics.

### Brief Response (nutrition block)

```json
"nutrition": {
  "calories": 2278,
  "protein_g": 146,
  "carbs_g": 283,
  "fat_g": 16,
  "fiber_g": 30,
  "water_ml": 2400
}
```

`water_ml` will be `null` until the data pipeline is connected (pending HAE config change or native HealthKit sync). The UI should handle null gracefully (hide or show "No data").

**Estimate:** 30 minutes.

---

## 4. Push Notifications (Blocked)

Push notification delivery requires an APNs `.p8` signing key from the Apple Developer account. The backend endpoints are ready:

- `POST /users/me/device-token` (live) — register the device token
- `PUT /users/me/notification-preferences` (live) — set preferences
- `GET /users/me/notification-preferences` (live) — get preferences

**iOS side to build:**
1. Request notification permission during onboarding
2. Register for remote notifications
3. Send device token to `POST /users/me/device-token` with `{"token": "...", "platform": "ios"}`
4. Build notification preferences screen in Settings (toggles for: morning brief, health alerts, coaching messages, weekly summary, sync warnings + time picker for morning brief)
5. Implement `UNUserNotificationCenter` delegate for foreground handling
6. Notification tap opens relevant brief

**Blocked until:** APNs `.p8` key is generated from Apple Developer account and configured on the backend.

**Estimate:** 1 week (once `.p8` key is available).

---

## 5. Strava Activity Feed

Activities are now synced from Strava into the P247 database. The iOS app can display an activity feed.

### Endpoints (all live)

| Method | Endpoint | Description |
|---|---|---|
| `POST /activities/sync` | Trigger a sync from Strava (incremental, deduplicates) |
| `GET /activities/?limit=20&offset=0&type=Run` | List activities, newest first. Paginated. Filterable by type. |
| `GET /activities/{strava_id}` | Single activity detail |
| `GET /activities/summary/weekly` | 7-day summary: count, distance, time, type breakdown |

### Activity types returned

`Run`, `Ride`, `Swim`, `Walk`, `WeightTraining`, `Workout`, `Hike`, `TrailRun`, `VirtualRun`, etc.

### Response fields per activity

`id`, `name`, `type`, `sport_type`, `start_date`, `start_date_local`, `elapsed_time_seconds`, `moving_time_seconds`, `moving_time_display` (human readable, e.g. "1h 08m"), `distance_m`, `distance_km`, `elevation_gain_m`, `average_speed_ms`, `max_speed_ms`, `average_heartrate`, `max_heartrate`, `calories`, `average_watts`, `suffer_score`, `has_heartrate`, `pace` (calculated for runs, e.g. "6:34/km").

### What to build

1. **Activity feed screen** showing recent activities (name, type, time, distance, HR, pace)
2. **Pull-to-refresh** calls `POST /activities/sync` then reloads the list
3. **Activity detail view** with full enriched data (see Section 5.1 below)
4. **Weekly summary card** on the home screen or activity tab

### 5.1 Activity Detail View (Enriched — Backend Live)

`GET /activities/{strava_id}` now returns Apple Fitness-level detail. The backend runs enrichment on first view (fetches Strava streams, calculates zones/TRIMP/effort, generates AI summary) and caches everything.

**Sections to render (conditional by activity type, see `P247-Activity-Detail-Enrichment-Spec.md` for full matrix):**

| Section | Data field | Chart type |
|---|---|---|
| AI Summary | `summary` | Text paragraph |
| Body Regions | `body_regions` | Tag pills (strength/workout only) |
| Heart Rate | `heart_rate.samples` | Bar chart, color by zone |
| HR Zones | `heart_rate.zones` | Horizontal stacked bars (6 zones) |
| HR Zone Context | `heart_rate.zones_context` | Text |
| Effort | `effort.score`, `effort.label`, `effort.comparison` | Score dial (0-10) |
| Training Load | `training_load.trimp_exp` | Gauge |
| Training Load Focus | `training_load.focus` | Stacked bar (anaerobic/high/low aerobic) |
| Training Load Effect | `training_load.effect` | Before/after gauges |
| Intensity | `intensity.percentage`, `intensity.label` | Progress bar |
| Speed/Pace | `speed.samples` | Bar chart (runs/rides) |
| Elevation | `elevation.samples` | Area chart (runs/rides/walks) |
| Route Map | `route.coordinates` | MapKit polyline |
| Power | `power.samples` | Line chart (if data exists) |
| HR Recovery | `heart_rate.recovery` | Line chart + rating badge |
| METs | `mets` | Single value display |

Use **Swift Charts** for all time-series. HR chart bars should be color-coded by zone (see spec for zone boundary calculations).

**Estimate:** 2 weeks for full detail view with charts, map, and all conditional sections.

**Full spec:** `p247/docs/P247-Activity-Detail-Enrichment-Spec.md`

---

## Priority Order

| # | Feature | Effort | Blocked? |
|---|---|---|---|
| 1 | HealthKit native sync | 2-3 days | No |
| 2 | Plan tab (Events → Plan) | 3-4 days | No |
| 3 | Coach image attachments | 2-3 days | No |
| 4 | Strava activity feed (list + sync) | 2-3 days | No |
| 5 | Activity detail view (enriched, charts, map) | 2 weeks | No |
| 6 | Hydration display | 30 min | No |
| 7 | Push notifications | 1 week | Yes (APNs `.p8` key) |

Items 1-6 can start immediately. All backend work is complete.

---

## 4. Plan Tab (Events → Plan)

The "Events" tab becomes "Plan". It's a unified daily action feed showing completed workouts, coach-suggested sessions, scheduled events, and recovery alerts in one chronological view.

**This is a full feature spec. See `P247-Plan-Tab-iOS-Brief.md` for the complete implementation brief** including card layouts, SwiftUI wireframes, design tokens, merge logic, exercise checkbox behaviour, and empty state.

### Summary of what's needed

1. Rename Events tab to "Plan", change icon to clipboard (SF Symbol: `list.clipboard`)
2. Build 4 card types: CompletedWorkoutCard, CoachSuggestionCard, RecoveryAlertCard, EventCard
3. Build the Plan feed view with "Completed" / "Now" marker / "Up Next" sections
4. Integrate `GET /plan/today` (new) + merge with existing `GET /events/`
5. Exercise checkboxes + start/complete workout flow
6. Handle `plan_item` in `POST /agent/messages` response (badge Plan tab, show toast)

### Key endpoints

```
GET  /plan/today              → today's plan items
GET  /plan/history?days=7     → historical view
POST /plan/                   → create plan item
POST /plan/{item_id}/start    → mark as in-progress
POST /plan/{item_id}/complete → mark done + exercise completion data
DELETE /plan/{item_id}        → dismiss (soft delete)
```

### Coach auto-generation

When the athlete asks the coach for a workout suggestion, the coach automatically creates a plan item. The `POST /agent/messages` response now includes an optional `plan_item` field:

```json
{
  "user_message": {...},
  "agent_message": {...},
  "plan_item": {
    "id": "plan_2",
    "type": "coach_suggestion",
    "title": "PM Session: Pull + Mobility"
  }
}
```

When `plan_item` is present, show a toast ("Added to Plan ✨") and/or badge the Plan tab.

**Estimate:** 3-4 days.

---

## Reference Documents

- `p247/ios/HealthKitSync/HealthKitManager.swift` — drop-in HealthKit sync code
- `p247/ios/HealthKitSync/README.md` — integration guide
- `p247/docs/P247-Plan-Tab-iOS-Brief.md` — full Plan tab iOS implementation spec
- `p247/docs/P247-Coach-Image-Support-and-Prompt-Rewrite.md` — full image support spec (includes plan item auto-generation)
- `p247/docs/P247-Strava-Connect-iOS-Brief.md` — Strava OAuth (already implemented, for reference)
- `p247/docs/P247-Phase2-HealthKit-Sync-and-Notifications-Brief.md` — full Phase 2 architecture

---

## Questions?

Ping Myles in #p247-backend-app.
