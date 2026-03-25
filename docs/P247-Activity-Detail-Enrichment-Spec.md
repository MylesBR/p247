# P247 Activity Detail: Enrichment Spec

**Date:** 25 March 2026  
**Author:** James (via Myles Bruggeling)  
**Status:** Backend complete ✅ — iOS pending  
**Reference:** Apple Fitness workout detail views (strength workout + bike ride screenshots, 25 March 2026)  
**Depends on:** Strava activity sync (✅ live), HealthKit native sync (iOS pending)

---

## 1. Goal

Make P247 activity detail screens match or exceed Apple Fitness quality. Currently our `GET /activities/{id}` returns a flat summary (name, type, duration, distance, avg/max HR, calories). Apple Fitness shows time-series charts, zone breakdowns, effort scores, training load effects, route maps, and AI-generated summaries. We need to close this gap.

---

## 2. Data Sources

Three data sources feed the enriched activity detail:

| Source | What it provides | How we get it |
|---|---|---|
| **Strava Summary API** (current) | Name, type, duration, distance, avg/max HR, elevation, calories, watts, suffer score | ✅ Already fetched via `GET /api/v3/athlete/activities` |
| **Strava Streams API** (new) | Heart rate samples, speed/pace samples, altitude samples, cadence, watts, GPS coordinates, temperature | `GET /api/v3/activities/{id}/streams?keys=heartrate,velocity_smooth,altitude,cadence,watts,latlng,temp&key_type=time` |
| **HealthKit** (via iOS sync) | HR recovery (2-min post-workout), HRV around workout, VO2 Max, running mechanics (ground contact, stride, oscillation, power) | Pushed via `POST /sync/healthkit` with workout-level data |

**Strava Streams API rate limit note:** Same pool as other Strava calls (100 req/15 min, 1000/day). Fetch streams once per activity on first detail view request, then cache. Don't fetch streams during bulk sync.

---

## 3. Enriched Activity Response Schema

### 3.1 `GET /activities/{strava_id}` (updated response)

```json
{
  "id": 17845742948,
  "name": "Morning Workout",
  "type": "Workout",
  "sport_type": "Workout",
  "start_date": "2026-03-24T19:00:47+00:00",
  "start_date_local": "2026-03-25T06:00:47",
  "elapsed_time_seconds": 1614,
  "moving_time_seconds": 1614,
  "moving_time_display": "26m 54s",
  "distance_m": 0.0,
  "distance_km": 0.0,
  "elevation_gain_m": 0.0,
  "average_speed_ms": 0.0,
  "max_speed_ms": 0.0,
  "average_heartrate": 133.0,
  "max_heartrate": 144.0,
  "calories": 280,
  "average_watts": null,
  "suffer_score": 31,
  "has_heartrate": true,
  "pace": null,

  "summary": "Strength and conditioning session, 27 minutes at moderate intensity. Average HR 133 sitting mostly in Zone 2-3, peaking at 144. Solid effort for a non-cardio session. This fits well in your current aerobic base phase for Hyrox prep.",

  "effort": {
    "score": 4.39,
    "max": 10,
    "label": "Challenging",
    "personal_average": 3.15,
    "comparison": "This Effort was 39.4% higher than your average of 3.15 for Running."
  },

  "heart_rate": {
    "average": 133,
    "max": 144,
    "zones": [
      {"zone": 0, "name": "Resting",    "seconds": 0,    "minutes_display": "0min",   "percentage": 0},
      {"zone": 1, "name": "Very Light", "seconds": 0,    "minutes_display": "<1min",  "percentage": 1},
      {"zone": 2, "name": "Light",      "seconds": 60,   "minutes_display": "1min",   "percentage": 5},
      {"zone": 3, "name": "Moderate",   "seconds": 1200, "minutes_display": "20min",  "percentage": 67},
      {"zone": 4, "name": "Hard",       "seconds": 420,  "minutes_display": "7min",   "percentage": 27},
      {"zone": 5, "name": "Maximum",    "seconds": 0,    "minutes_display": "0min",   "percentage": 0}
    ],
    "zones_context": "The majority of your workout was spent in the Hard Zone. Training in this manner will increase your aerobic performance capacity.",
    "zones_note": "Zones are based on your Max Heart Rate during the past 30 days of 175.",
    "samples": {
      "time": [0, 5, 10, 15, 20],
      "heartrate": [85, 110, 128, 135, 140]
    },
    "recovery": {
      "bpm_drop_2min": 5,
      "start_bpm": 146,
      "end_bpm": 141,
      "rating": "Poor",
      "rating_scale": {"poor": [0, 12], "average": [12, 24], "good": [24, 36], "excellent": [36, 48], "superior": [48, 999]},
      "samples": {
        "time": [0, 15, 30, 45, 60, 75, 90, 105, 120],
        "heartrate": [146, 146, 145, 145, 144, 143, 142, 140, 141]
      }
    }
  },

  "training_load": {
    "trimp_exp": 68,
    "trimp_max": 183,
    "intensity": 0.44,
    "intensity_label": "Medium",
    "focus": {
      "anaerobic": {"value": 18, "percentage": 26},
      "high_aerobic": {"value": 46, "percentage": 67},
      "low_aerobic": {"value": 4, "percentage": 5}
    },
    "effect": {
      "long_term_before": 47,
      "long_term_after": 50,
      "short_term_before": 42,
      "short_term_after": 59,
      "description": "This workout increased your Long Term Fitness by 3 and increased your Short Term Fitness by 17."
    }
  },

  "speed": {
    "average_kmh": null,
    "max_kmh": null,
    "pace_avg": null,
    "pace_best": null,
    "samples": null
  },

  "elevation": {
    "gain_m": 0.0,
    "loss_m": 0.0,
    "max_m": null,
    "min_m": null,
    "samples": null
  },

  "power": {
    "average_watts": null,
    "max_watts": null,
    "normalized_power": null,
    "samples": null
  },

  "route": {
    "has_gps": false,
    "polyline": null,
    "start_latlng": null,
    "end_latlng": null
  },

  "run_stats": {
    "distance_km": 6.19,
    "cadence_spm": 161,
    "pace_display": "6m 34s"
  },

  "running_mechanics": {
    "ground_contact_time_ms": null,
    "stride_length_m": null,
    "vertical_oscillation_cm": null,
    "running_power_w": null
  },

  "running_power": {
    "average_watts": 207,
    "max_watts": 301,
    "samples": {
      "time": [0, 5, 10],
      "watts": [200, 210, 195]
    }
  },

  "mets": 9.34,

  "body_regions": ["upper", "core"],

  "hrv_effect": {
    "pre_workout_hrv": 42,
    "post_workout_hrv": 26,
    "change_ms": -4,
    "description": "Post-workout HRV decrease of -4 ms",
    "samples": {
      "time_labels": ["5am", "6am", "7am", "8am", "12pm", "2pm", "5pm", "7pm"],
      "hrv": [20, 35, 42, 28, 26, 32, 31, 30, 26]
    }
  },

  "cardio_fitness": {
    "vo2max": 40.0,
    "rating": "good",
    "rating_scale": {"poor": [0, 30], "average": [30, 35], "good": [35, 41], "excellent": [41, 46]},
    "personalized_note": "This scale is personalized to you based on your sex and age of 53."
  },

  "notes": null
}
```

### 3.2 Field Descriptions

**`summary`** (string): AI-generated natural language summary of the workout. Generated once on first detail view, cached. Uses the coach LLM with activity data + athlete context. 2-3 sentences max.

**`effort`** (object): Effort score 1-10 (decimal, e.g. 4.39), derived from:
- Relative heart rate intensity (avg HR / max HR)
- Duration
- TRIMP
- Comparison to athlete's historical average for that activity type (e.g. "39.4% higher than your average of 3.15 for Running")
- Labels: Very Light / Light / Easy / Moderate / Challenging / Hard / Very Hard / Maximum

**`heart_rate.zones`** (array): Time spent in each HR zone. 6 zones matching Apple Fitness (Resting 0, Very Light 1, Light 2, Moderate 3, Hard 4, Maximum 5). Zones based on athlete's max HR from the past 30 days of data (Apple's approach), or 220 - age as fallback. Each zone shows time in minutes + percentage. Include contextual text: "The majority of your workout was spent in the Hard Zone. Training in this manner will increase your aerobic performance capacity."

**`heart_rate.samples`** (object): Time-series arrays for charting. `time` in seconds from start, `heartrate` in bpm. Downsampled to ~1 point per 5-10 seconds for reasonable payload size.

**`heart_rate.recovery`** (object): HR drop 1 and 2 minutes after workout ends. Source: HealthKit `cardioRecoveryBPM` or calculated from HR samples if the tail extends past workout end. Rating: Excellent (>30bpm), Good (20-30), Below Average (12-20), Poor (<12).

**`training_load.trimp`** (int): Training Impulse. Calculated from HR zone time using Banister formula: `TRIMP = Σ(time_in_zone × zone_coefficient)`. Zone coefficients: Z1=1.0, Z2=1.5, Z3=2.0, Z4=3.0, Z5=4.0.

**`training_load.intensity`** (float 0-1): Average HR as fraction of max HR.

**`training_load.focus`** (object): Training load split by energy system. Derived from zone distribution: Z1-Z2 = low aerobic, Z3-Z4 = high aerobic, Z5 = anaerobic.

**`training_load.effect`** (object): CTL/ATL/TSB before and after this workout. Shows the training load impact on the athlete's fitness/fatigue balance.

**`speed.samples`** / **`elevation.samples`** / **`power.samples`** (object): Same format as HR samples. `time` array + value array. For charting.

**`route`** (object): GPS data if available. `polyline` is an encoded polyline string for map rendering (same format Strava provides). Running and cycling activities typically have GPS; gym workouts don't.

**`mets`** (float): Metabolic Equivalent. Estimated from activity type + intensity. Standard MET tables: walking ~3.5, cycling ~6-8, running ~8-12, weight training ~5-6.

**`body_regions`** (array): Which body regions this workout targeted. For strength/workout types, inferred from activity name and type. Values: `"upper"`, `"lower"`, `"core"`, `"full_body"`, `"cardio"`. For cardio activities: `["cardio", "lower"]`.

---

## 4. Backend Implementation

### 4.1 Strava Streams Fetch

Add a function to fetch and cache activity streams:

```python
STREAM_KEYS = "heartrate,velocity_smooth,altitude,cadence,watts,latlng,temp,time"

async def fetch_activity_streams(access_token: str, activity_id: int) -> dict:
    """Fetch detailed streams for a Strava activity."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"https://www.strava.com/api/v3/activities/{activity_id}/streams",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"keys": STREAM_KEYS, "key_type": "time"},
        )
    if resp.status_code == 200:
        return resp.json()
    return None
```

**When to fetch:** On first `GET /activities/{id}` request if streams aren't cached. Store in a `streams_data` JSON column on the StravaActivity model. Don't fetch during bulk sync (rate limit).

### 4.2 HR Zone Calculation

```python
def calculate_hr_zones(hr_samples: list[int], time_samples: list[int], max_hr: int) -> list[dict]:
    """Calculate time in each HR zone from samples."""
    zone_boundaries = [
        (0, int(max_hr * 0.6)),       # Zone 1: Recovery
        (int(max_hr * 0.6), int(max_hr * 0.7)),  # Zone 2: Aerobic
        (int(max_hr * 0.7), int(max_hr * 0.8)),  # Zone 3: Tempo
        (int(max_hr * 0.8), int(max_hr * 0.9)),  # Zone 4: Threshold
        (int(max_hr * 0.9), 999),      # Zone 5: Anaerobic
    ]
    # Count seconds in each zone based on time gaps between samples
    ...
```

**Max HR source (priority order):**
1. Athlete profile (if manually set)
2. Highest HR ever recorded across all activities
3. Formula: 220 - age

### 4.3 TRIMP Calculation

```python
def calculate_trimp(zone_seconds: list[int]) -> int:
    """Calculate Training Impulse from zone durations."""
    coefficients = [1.0, 1.5, 2.0, 3.0, 4.0]
    trimp = sum(
        (seconds / 60) * coeff
        for seconds, coeff in zip(zone_seconds, coefficients)
    )
    return round(trimp)
```

### 4.4 Effort Score

```python
def calculate_effort(trimp: int, duration_min: int, intensity: float, avg_for_type: float) -> dict:
    """Calculate effort score 1-10."""
    # Normalize TRIMP to 1-10 scale based on activity duration
    raw = (trimp / max(duration_min, 1)) * intensity * 10
    score = min(10, max(1, round(raw)))
    
    labels = {1: "Very Light", 2: "Light", 3: "Light", 4: "Easy",
              5: "Moderate", 6: "Moderate", 7: "Hard", 8: "Hard",
              9: "Very Hard", 10: "Maximum"}
    
    return {
        "score": score,
        "max": 10,
        "label": labels[score],
        "comparison": f"{'Above' if score > avg_for_type else 'Below'} your average for this activity type ({avg_for_type:.1f})"
    }
```

### 4.5 AI Summary Generation

On first detail view, call the coach LLM with a focused prompt:

```python
SUMMARY_PROMPT = """Generate a 2-3 sentence workout summary for this athlete's activity.
Include: what type of session it was, intensity level, key metrics, and how it fits their current training goals.
Write in plain text, no formatting. Sound like a coach reviewing the session."""
```

Cache the summary in a `summary` column on the activity. Don't regenerate unless data changes.

### 4.6 Body Region Inference

```python
BODY_REGION_MAP = {
    "Run": ["cardio", "lower"],
    "TrailRun": ["cardio", "lower"],
    "VirtualRun": ["cardio", "lower"],
    "Ride": ["cardio", "lower"],
    "VirtualRide": ["cardio", "lower"],
    "Swim": ["cardio", "upper", "core"],
    "Walk": ["cardio", "lower"],
    "Hike": ["cardio", "lower"],
    "WeightTraining": ["full_body"],  # Refine from name if possible
    "Workout": ["full_body"],          # Refine from name if possible
    "Rowing": ["cardio", "upper", "core"],
    "Yoga": ["full_body", "core"],
    "CrossFit": ["full_body"],
}

def infer_body_regions(activity_type: str, activity_name: str) -> list[str]:
    """Infer body regions from activity type and name."""
    regions = BODY_REGION_MAP.get(activity_type, ["full_body"])
    
    # Refine for weight training based on name keywords
    name_lower = activity_name.lower()
    if any(kw in name_lower for kw in ["upper", "push", "pull", "chest", "back", "shoulder", "arm"]):
        regions = ["upper"]
    elif any(kw in name_lower for kw in ["lower", "leg", "squat", "deadlift", "lunge"]):
        regions = ["lower"]
    elif any(kw in name_lower for kw in ["core", "abs", "plank"]):
        regions = ["core"]
    
    return regions
```

### 4.7 MET Estimation

```python
MET_TABLE = {
    "Run": 9.8,
    "TrailRun": 10.5,
    "Ride": 7.5,
    "VirtualRide": 6.8,
    "Swim": 8.0,
    "Walk": 3.5,
    "Hike": 5.3,
    "WeightTraining": 5.0,
    "Workout": 6.0,
    "Rowing": 7.0,
    "Yoga": 3.0,
    "CrossFit": 8.0,
    "Elliptical": 5.0,
}

def estimate_mets(activity_type: str, intensity: float = 0.5) -> float:
    """Estimate METs for an activity, adjusted by intensity."""
    base = MET_TABLE.get(activity_type, 5.0)
    return round(base * (0.7 + 0.6 * intensity), 1)
```

---

## 5. Database Changes

Add columns to `strava_activities`:

```sql
ALTER TABLE strava_activities ADD COLUMN streams_data TEXT;      -- JSON: cached Strava streams
ALTER TABLE strava_activities ADD COLUMN summary TEXT;            -- AI-generated summary
ALTER TABLE strava_activities ADD COLUMN hr_zones TEXT;           -- JSON: calculated zone breakdown
ALTER TABLE strava_activities ADD COLUMN trimp INTEGER;           -- Calculated TRIMP
ALTER TABLE strava_activities ADD COLUMN effort_score INTEGER;    -- 1-10
ALTER TABLE strava_activities ADD COLUMN body_regions TEXT;       -- JSON: ["upper", "core"]
ALTER TABLE strava_activities ADD COLUMN mets FLOAT;             -- Estimated METs
ALTER TABLE strava_activities ADD COLUMN route_polyline TEXT;     -- Encoded polyline for map
```

---

## 6. iOS Implementation

### 6.1 Activity Detail Screen Layout

Based on Apple Fitness reference screenshots:

```
┌──────────────────────────────────┐
│ ← Back                          │
│                                  │
│ 🏋️ Morning Workout               │
│ 27 min · 280 Cal · 6.2 METs    │
│ Wed 25 Mar 2026, 6:00 AM        │
│                                  │
│ "Strength and conditioning       │
│  session, 27 minutes at moderate │
│  intensity..."                   │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Body Regions               │  │
│ │ [Upper] [Core]             │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Heart Rate          133 avg│  │
│ │ ▅▆▇▇█▇▆▇█▇▇▆▅▆▇█▇▆▅▄    │  │
│ │ Zone bar: Z1 Z2 Z3 Z4     │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Effort              5/10   │  │
│ │ ●●●●●○○○○○  Moderate      │  │
│ │ Slightly above avg (4.2)   │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Training Load              │  │
│ │ TRIMP: 42                  │  │
│ │ Focus: ▓▓▓▓░░ High Aerobic │  │
│ │ CTL: 52 → 53  ATL: 68 → 70│  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ HR Training Zones          │  │
│ │ Z5 Anaerobic    ░░  0%    │  │
│ │ Z4 Threshold    ▓░  7%    │  │
│ │ Z3 Tempo        ▓▓▓ 48%   │  │
│ │ Z2 Aerobic      ▓▓░ 33%   │  │
│ │ Z1 Recovery     ▓░  11%   │  │
│ └────────────────────────────┘  │
│                                  │
│ ── For Ride/Run only ──         │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Speed / Pace chart         │  │
│ │ ▃▅▆▇▅▃▅▇▆▅▃▄▅▆▇▅▃        │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Elevation Profile          │  │
│ │ ╱╲_╱╲__╱╲                  │  │
│ │ ↑ 71m gained               │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Route Map                  │  │
│ │ [MapKit with polyline]     │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ HR Recovery                │  │
│ │ -28 bpm in 2 min (Good)    │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Cardio Fitness (VO2 Max)   │  │
│ │ 39.7 mL/min/kg             │  │
│ │ Above Average for age 52   │  │
│ └────────────────────────────┘  │
│                                  │
│ Notes: [editable text field]     │
└──────────────────────────────────┘
```

### 6.2 Conditional Sections

Not all sections show for all activity types:

| Section | Workout | Run | Ride | Walk | Swim |
|---|---|---|---|---|---|
| AI Summary | ✅ | ✅ | ✅ | ✅ | ✅ |
| Body Regions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Heart Rate chart | ✅ | ✅ | ✅ | ✅ | ✅ |
| Effort | ✅ | ✅ | ✅ | ✅ | ✅ |
| Training Load Effect | ✅ | ✅ | ✅ | ❌ | ✅ |
| Training Load Focus | ✅ | ✅ | ✅ | ❌ | ✅ |
| Intensity | ✅ | ✅ | ✅ | ❌ | ✅ |
| HR Zones (6-zone) | ✅ | ✅ | ✅ | ✅ | ✅ |
| HR Recovery (chart + rating scale) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Speed/Pace chart | ❌ | ✅ | ✅ | ❌ | ✅ |
| Running Power chart | ❌ | ✅ | ❌ | ❌ | ❌ |
| Run Stats (distance, cadence, pace) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Route Map | ❌ | ✅ | ✅ | ✅ | ❌ |
| Elevation profile | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cardio Fitness (VO2 Max + rating) | ❌ | ✅ | ✅ | ❌ | ❌ |
| Training Effect on HRV (chart) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Power | ❌ | ✅* | ✅* | ❌ | ❌ |
| Running Mechanics | ❌ | ✅ | ❌ | ❌ | ❌ |

*Power only shown if data exists (requires power meter or Apple Watch running power)

### 6.3 Charts

Use **Swift Charts** (native, iOS 16+) for all time-series visualisations:

- **HR chart:** Bar chart, color-coded by zone (Z1=grey, Z2=blue, Z3=green, Z4=yellow, Z5=red)
- **Speed chart:** Bar chart with optional HR overlay toggle
- **Elevation:** Area/line chart, filled below
- **Zone breakdown:** Horizontal stacked bar

All charts should support horizontal scrolling for longer activities and pinch-to-zoom.

---

## 7. Implementation Order

| # | Task | Effort | Status |
|---|---|---|---|
| 1 | DB schema changes (add columns) | 30 min | ✅ Done 25 Mar 2026 |
| 2 | Strava streams fetch + cache | 2 hours | ✅ Done 25 Mar 2026 |
| 3 | HR zone calculation (6-zone Apple model) | 2 hours | ✅ Done 25 Mar 2026 |
| 4 | TRIMP + effort + training load calculation | 3 hours | ✅ Done 25 Mar 2026 |
| 5 | Body region inference + MET estimation | 1 hour | ✅ Done 25 Mar 2026 |
| 6 | AI summary generation (on-demand, Sonnet) | 2 hours | ✅ Done 25 Mar 2026 |
| 7 | Update `GET /activities/{id}` response | 2 hours | ✅ Done 25 Mar 2026 |
| 8 | Route/coordinate extraction from streams | 1 hour | ✅ Done 25 Mar 2026 |
| 9 | iOS: Activity detail screen layout | 3-5 days | ⬜ Pending |
| 10 | iOS: Swift Charts (HR, speed, elevation) | 3-5 days | ⬜ Pending |
| 11 | iOS: MapKit route display | 1-2 days | ⬜ Pending |
| 12 | iOS: Effort/Training Load cards | 1-2 days | ⬜ Pending |

**Backend:** ✅ Complete  
**iOS:** ~2 weeks estimated  

Enrichment is additive. The list endpoint stays lightweight. Full enrichment (streams fetch, calculations, AI summary) runs on first `GET /activities/{id}` call and is cached.

---

## 8. Cost Impact

- **Strava streams fetch:** One API call per activity on first detail view. At 100 users viewing 3 activities/day = 300 calls/day (well within 1000/day limit).
- **AI summary:** One LLM call per activity (~$0.003 each). At 100 users × 3 activities = $0.90/day.
- **Storage:** Streams JSON is ~50-200KB per activity. At 1000 users × 500 activities = ~50-100GB. Manageable on local disk, consider S3 at scale.

---

## 9. Future Enhancements

- **Live Activity:** For activities in progress (via Strava webhook), show real-time HR and pace
- **Activity comparison:** Side-by-side comparison of two activities (e.g. this week's run vs last week's)
- **Split analysis:** Per-km or per-lap splits for running/cycling
- **Coach integration:** "Ask coach about this workout" button that pre-fills the chat with activity context
- **Social:** Share activity cards with training partners
- **Workout notes:** Editable notes field synced to backend (`PUT /activities/{id}/notes`)
