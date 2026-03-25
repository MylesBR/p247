# P247 iOS: Plan Tab Implementation Brief

**Date:** 25 March 2026
**For:** iOS Development Team
**From:** Myles Bruggeling, Founder
**Status:** Backend in progress. iOS work can begin on UI scaffolding now.
**Production API:** `https://app.p247.io`
**Auth:** `x-api-key` header on all requests

---

## What This Is

The "Events" tab becomes the "Plan" tab. It's the athlete's single action screen for the day: completed workouts, coach-suggested sessions, scheduled events, and recovery alerts in one chronological feed.

The coach can now generate complementary workout suggestions (e.g. "you did push this morning, here's a pull session for this afternoon"). Those suggestions surface as actionable cards in the Plan tab alongside existing events.

**Mockup:** See `p247/mockups/plan-tab.html` (render at 393px width) or `plan-tab.png`.

---

## Tab Bar Change

| Before | After |
|--------|-------|
| ⚡ Today \| 💬 Coach \| 🔔 Events \| 👤 Profile | ⚡ Today \| 💬 Coach \| 📋 Plan \| 👤 Profile |

- Rename "Events" to "Plan"
- Change icon from bell to clipboard (SF Symbol: `list.clipboard` or `checklist`)
- Active state: system blue (`#007AFF`)

---

## Plan Tab Structure

The Plan tab is a vertical scrolling feed, grouped into sections with a "now" marker separating past from future.

### Sections (top to bottom)

1. **Completed** (items before "now")
2. **Now marker** (blue dot + horizontal line + "Now" label)
3. **Up Next** (actionable items from now onward)

### Card Types

Each item in the feed is a card. Four types exist:

| Type | Badge | Left border | Source |
|------|-------|-------------|--------|
| Completed workout | ✓ Done (green) | `#34C759` | Apple Health sync or Strava |
| Coach suggestion | ✨ Coach (purple) | `#7C4DFF` | `GET /plan/today` |
| Scheduled event | 📅 Event (blue) | `#2196F3` | `GET /events/` (existing) |
| Recovery alert | ⚠ Recovery (orange) | `#FF9800` | `GET /plan/today` |

---

## API Integration

### New endpoint: `GET /plan/today`

Returns the athlete's plan items for today (coach suggestions + recovery alerts + completed workouts).

```json
{
  "date": "2026-03-25",
  "items": [
    {
      "id": "plan_1",
      "type": "completed_workout",
      "title": "Hybrid S&C Class",
      "subtitle": "CrossFit Dural · 52 min",
      "time": "06:00",
      "status": "completed",
      "stats": {
        "calories": 487,
        "avg_hr": 142,
        "load": 38
      }
    },
    {
      "id": "plan_2",
      "type": "recovery_alert",
      "title": "Sleep Crisis: 4.8h",
      "subtitle": "Non-negotiable early bedtime tonight. Target 9:30pm.",
      "priority": "high",
      "status": "active"
    },
    {
      "id": "plan_3",
      "type": "coach_suggestion",
      "title": "PM Session: Pull + Mobility",
      "subtitle": "Complements this morning's push-dominant class. Low impact on knees.",
      "time": "~16:30",
      "estimated_duration_min": 35,
      "status": "pending",
      "coach_note": "Based on your 6am workout image. Avoids front squats and loaded lunges (patella rehab).",
      "exercises": [
        {
          "name": "Barbell Rows",
          "sets": "4",
          "reps": "8-10",
          "rest": "90s",
          "muscle_group": "Back"
        },
        {
          "name": "Pull-ups",
          "sets": "3",
          "reps": "AMRAP",
          "rest": "90s",
          "muscle_group": "Lats"
        },
        {
          "name": "Face Pulls",
          "sets": "3",
          "reps": "15",
          "rest": "60s",
          "muscle_group": "Rear Delt"
        },
        {
          "name": "Banded Hip Mobility Flow",
          "sets": "2",
          "reps": "5 min",
          "rest": "continuous",
          "muscle_group": "Mobility"
        },
        {
          "name": "Dead Hangs",
          "sets": "3",
          "reps": "30-45s",
          "rest": null,
          "muscle_group": "Grip"
        }
      ]
    }
  ]
}
```

### Existing endpoint: `GET /events/`

Returns scheduled events (races, games, appointments). These are merged client-side into the Plan feed by time.

### New endpoint: `POST /plan/{item_id}/start`

When the athlete taps "Start Workout" on a coach suggestion card. Marks it as in-progress.

### New endpoint: `POST /plan/{item_id}/complete`

When the athlete finishes the workout (or taps "Done"). Accepts optional completion data.

```json
{
  "completed_exercises": [
    {"name": "Barbell Rows", "completed": true},
    {"name": "Pull-ups", "completed": true},
    {"name": "Face Pulls", "completed": true},
    {"name": "Banded Hip Mobility Flow", "completed": false},
    {"name": "Dead Hangs", "completed": true}
  ],
  "notes": "Felt good, skipped mobility as running late"
}
```

### New endpoint: `DELETE /plan/{item_id}`

Dismiss/remove a plan item (e.g. athlete decides not to do the suggested session).

---

## Card Layouts (SwiftUI)

### Completed Workout Card

```
┌─────────────────────────────────────┐
│ ✓ Done                        6:00 AM │  <- green badge, grey time
│ ✅ Hybrid S&C Class                    │  <- title with check emoji
│ CrossFit Dural · 52 min               │  <- grey subtitle
│                                        │
│ Calories    Avg HR     Load            │
│ 487 kcal    142 bpm    +38             │  <- stat row
└─────────────────────────────────────┘
```

- Left border: 3px green (`#34C759`)
- Stats row: 3 columns, label above value

### Coach Suggestion Card

```
┌─────────────────────────────────────┐
│ ✨ Coach              ~4:30 PM · 35 min │  <- purple badge
│ 🏋️ PM Session: Pull + Mobility        │  <- title
│ Complements this morning's push...     │  <- subtitle
│                                        │
│ 💡 Based on your 6am workout image.   │  <- coach note (purple bg)
│    Avoids front squats (patella rehab) │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ □  Barbell Rows                  │   │
│ │    4 × 8-10 · 90s rest    Back   │   │
│ ├──────────────────────────────────┤   │
│ │ □  Pull-ups                      │   │
│ │    3 × AMRAP · 90s rest    Lats  │   │
│ ├──────────────────────────────────┤   │
│ │ □  Face Pulls                    │   │
│ │    3 × 15 · 60s rest    Rear Delt│   │
│ ├──────────────────────────────────┤   │
│ │ □  Banded Hip Mobility Flow      │   │
│ │    2 × 5 min · continuous  Mob.  │   │
│ ├──────────────────────────────────┤   │
│ │ □  Dead Hangs                    │   │
│ │    3 × 30-45s             Grip   │   │
│ └──────────────────────────────────┘   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │        ▶ Start Workout           │  │  <- purple button
│  └──────────────────────────────────┘  │
└─────────────────────────────────────┘
```

- Left border: 3px purple (`#7C4DFF`)
- Background: subtle gradient white to light purple (`#F8F5FF`)
- Exercise list: white cards within the card, 1px purple-tinted border
- Checkboxes: tappable, track completion per exercise
- Muscle group tags: small purple pill badges, right-aligned
- Coach note: light purple background with 💡 icon
- "Start Workout" button: solid purple, full width

### Recovery Alert Card

```
┌─────────────────────────────────────┐
│ ⚠ Recovery                 Priority │  <- orange badge
│ 😴 Sleep Crisis: 4.8h               │  <- orange title
│ Non-negotiable early bedtime tonight.│
│ Target 9:30pm.                       │
└─────────────────────────────────────┘
```

- Left border: 3px orange (`#FF9800`)
- Background: subtle gradient white to light orange (`#FFF8F0`)

### Event Card

```
┌─────────────────────────────────────┐
│ 📅 Event                    3:00 PM │  <- blue badge
│ ⚽ Dominic's Game                    │
│ Marian College vs St Pauls           │
└─────────────────────────────────────┘
```

- Left border: 3px blue (`#2196F3`)
- Standard white background

---

## Now Marker

Between the Completed section and Up Next section:

```
─────────── ● Now ───────────
```

- Blue dot (`#007AFF`), 8px diameter
- Hairline rules extending left and right
- "Now" label in system blue, 12px semibold

---

## Merging Logic (Client-Side)

The app calls two endpoints and merges results:

1. `GET /plan/today` (coach suggestions, recovery alerts, completed workouts)
2. `GET /events/` (scheduled events, filtered to today)

**Sort order:**
1. Completed items first (sorted by time, most recent on top)
2. Now marker
3. Active items sorted by: recovery alerts (priority), then by time, then coach suggestions without a specific time

**Refresh:** Pull-to-refresh reloads both endpoints. Background refresh every 15 minutes.

---

## Coach Integration

When the coach generates a workout suggestion via chat, it simultaneously creates a plan item via an internal call. The athlete sees:

1. In the Coach tab: the coach's conversational response ("I've put together a PM session for you...")
2. In the Plan tab: the structured workout card with exercises and a Start button

The coach message should include a line like: "I've added this to your Plan. Tap the Plan tab when you're ready to start."

This means the `POST /agent/messages` endpoint, when it detects a workout suggestion in the coach's response, auto-creates a plan item. This is handled server-side; the iOS app doesn't need to parse coach messages.

---

## Empty State

When no plan items exist for today:

```
📋

No plan for today yet.

Ask your coach for a workout suggestion,
or add an event.

[Ask Coach]     [Add Event]
```

"Ask Coach" deep-links to the Coach tab. "Add Event" opens the event creation flow.

---

## Exercise Checkbox Behaviour

- Tap checkbox: toggles complete state (visual only until workout is finished)
- When all exercises checked OR athlete taps "Finish Workout": calls `POST /plan/{item_id}/complete`
- Completion data (which exercises were done) is sent to the backend
- Completed coach suggestion cards move to the "Completed" section and show stats if available

---

## Accessibility

- All cards: VoiceOver labels describing card type, title, and key info
- Checkboxes: accessible toggle with exercise name as label
- Now marker: accessible label "Current time separator"
- Start Workout button: minimum 44pt tap target

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `cardCornerRadius` | 16pt | All cards |
| `innerCardRadius` | 10pt | Exercise items within coach card |
| `cardPadding` | 16pt | Card internal padding |
| `cardMargin` | 12pt | Between cards |
| `sectionLabelSize` | 13pt semibold | "Completed", "Up Next" labels |
| `badgeSize` | 10pt bold | Card type badges |
| `titleSize` | 17pt semibold | Card titles |
| `subtitleSize` | 14pt regular | Card subtitles |
| `borderWidth` | 3pt | Left accent border |

---

## Implementation Order

1. **Tab rename + icon** (5 min, ship immediately)
2. **Card components** (CompletedWorkoutCard, CoachSuggestionCard, RecoveryAlertCard, EventCard)
3. **Plan feed view** with sections and now marker
4. **API integration** (`GET /plan/today` + merge with `GET /events/`)
5. **Exercise checkboxes** + start/complete flow
6. **Empty state**
7. **Pull-to-refresh + background refresh**

---

_This brief covers the iOS side. Backend implementation is happening in parallel. Endpoint schemas above are the contract._
