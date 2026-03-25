# P247 HealthKit Sync — Drop-In Implementation

## Files

- `HealthKitManager.swift` — Complete HealthKit read + sync implementation

## Xcode Setup (required)

### 1. Add Capabilities

In your target's Signing & Capabilities:
- **HealthKit** — check "Clinical Health Records" is OFF (not needed)
- **Background Modes** — check "Background fetch" and "Background processing"

### 2. Info.plist Keys

Add these two keys:

```xml
<key>NSHealthShareUsageDescription</key>
<string>P247 reads your health data to generate personalised recovery scores, training recommendations, and daily performance briefs.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>P247 does not write to Apple Health.</string>
```

### 3. BGTaskScheduler (AppDelegate or App init)

Register a background task for periodic sync fallback:

```swift
import BackgroundTasks

// In your App init or AppDelegate didFinishLaunching:
BGTaskScheduler.shared.register(forTaskWithIdentifier: "io.p247.healthsync", using: nil) { task in
    Task {
        await HealthKitManager.shared.syncToday()
        task.setTaskCompleted(success: true)
    }
}

// Schedule it (call after authorization):
func scheduleBackgroundSync() {
    let request = BGAppRefreshTaskRequest(identifier: "io.p247.healthsync")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 2 * 60 * 60) // 2 hours
    try? BGTaskScheduler.shared.submit(request)
}
```

Add to Info.plist:
```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>io.p247.healthsync</string>
</array>
```

## Usage

### During Onboarding

```swift
// Set the API key first
HealthKitManager.shared.apiKey = "p247_..."

// Request permission (also triggers 14-day backfill automatically)
Task {
    try await HealthKitManager.shared.requestAuthorization()
}
```

### Show Sync Progress (during backfill)

```swift
// HealthKitManager is @ObservableObject
@StateObject var healthKit = HealthKitManager.shared

var body: some View {
    if let progress = healthKit.syncProgress {
        Text(progress) // "Syncing 6/14 days..."
    }
}
```

### Manual Sync (pull-to-refresh)

```swift
Task {
    await HealthKitManager.shared.syncToday()
}
```

## What It Sends

Each sync POSTs to `POST /sync/healthkit` with this structure:

```json
{
  "data": [{
    "date": "2026-03-23",
    "timezone": "Australia/Sydney",
    "device_sync_timestamp": "2026-03-23T21:30:00+11:00",
    "metrics": {
      "step_count": 14545,
      "active_calories": 620,
      "hrv": 32,
      "resting_hr": 57,
      "protein_g": 145,
      ...
    },
    "sleep": {
      "total_hours": 6.7,
      "core_hours": 4.8,
      "deep_hours": 0.56,
      "rem_hours": 1.0,
      "awake_hours": 0.63,
      "source": "Apple Watch"
    },
    "workouts": [{
      "type": "FunctionalStrengthTraining",
      "start": "2026-03-23T06:00:00+11:00",
      "duration_seconds": 3300,
      "energy_kcal": 420,
      "source": "Apple Watch"
    }]
  }]
}
```

## Data Flow

1. **Observer queries** fire when HealthKit gets new data (workout complete, sleep logged)
2. HealthKitManager queries the day's data, aggregates it
3. POSTs to `/sync/healthkit`
4. Backend stores the payload
5. Brief generation uses the latest data

## Notes

- Sleep data: queries 12 hours before start of day to catch previous evening's bedtime
- Prefers Apple Watch sources over iPhone for sleep data
- Running mechanics only populated on days with running workouts
- VO2 Max uses latest reading (not average)
- Dietary energy is sent in kcal (field is called dietary_energy_kj for historical reasons)
- Background observers trigger on new samples, not on a schedule
- BGTaskScheduler is a fallback every 2 hours in case observers miss something
