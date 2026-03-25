import Foundation
import HealthKit

/// P247 HealthKit Manager — reads Apple Health data and pushes to the P247 backend.
/// Drop this file into your Xcode project. Call `HealthKitManager.shared.requestAuthorization()`
/// during onboarding, then `startBackgroundSync()` after permission is granted.
///
/// Requirements:
/// - Add HealthKit capability in Xcode (Signing & Capabilities)
/// - Add Background Modes capability with "Background fetch" and "Background processing"
/// - Add NSHealthShareUsageDescription to Info.plist
/// - Add NSHealthUpdateUsageDescription to Info.plist (even though we don't write)

final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()
    
    private let healthStore = HKHealthStore()
    private let apiBaseURL = "https://app.p247.io"
    
    /// Set this from your auth/login flow
    var apiKey: String = ""
    
    @Published var isAuthorized = false
    @Published var isSyncing = false
    @Published var lastSyncDate: Date?
    @Published var syncProgress: String?
    
    // MARK: - HealthKit Types We Read
    
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        
        // Heart
        types.insert(HKQuantityType(.heartRateVariabilitySDNN))
        types.insert(HKQuantityType(.restingHeartRate))
        types.insert(HKQuantityType(.heartRate))
        types.insert(HKQuantityType(.vo2Max))
        
        // Sleep
        types.insert(HKCategoryType(.sleepAnalysis))
        
        // Respiratory
        types.insert(HKQuantityType(.respiratoryRate))
        types.insert(HKQuantityType(.oxygenSaturation))
        
        // Activity
        types.insert(HKQuantityType(.stepCount))
        types.insert(HKQuantityType(.distanceWalkingRunning))
        types.insert(HKQuantityType(.activeEnergyBurned))
        types.insert(HKQuantityType(.basalEnergyBurned))
        types.insert(HKQuantityType(.appleExerciseTime))
        types.insert(HKQuantityType(.flightsClimbed))
        
        // Nutrition
        types.insert(HKQuantityType(.dietaryProtein))
        types.insert(HKQuantityType(.dietaryCarbohydrates))
        types.insert(HKQuantityType(.dietaryFatTotal))
        types.insert(HKQuantityType(.dietaryFiber))
        types.insert(HKQuantityType(.dietaryEnergyConsumed))
        types.insert(HKQuantityType(.dietarySugar))
        types.insert(HKQuantityType(.dietaryPotassium))
        types.insert(HKQuantityType(.dietaryCholesterol))
        types.insert(HKQuantityType(.numberOfAlcoholicBeverages))
        types.insert(HKQuantityType(.dietaryWater))
        
        // Body
        types.insert(HKQuantityType(.bodyMass))
        types.insert(HKQuantityType(.bodyFatPercentage))
        types.insert(HKQuantityType(.leanBodyMass))
        
        // Running mechanics
        types.insert(HKQuantityType(.runningSpeed))
        types.insert(HKQuantityType(.runningPower))
        types.insert(HKQuantityType(.runningStrideLength))
        types.insert(HKQuantityType(.runningVerticalOscillation))
        types.insert(HKQuantityType(.runningGroundContactTime))
        
        // Walking
        types.insert(HKQuantityType(.walkingSpeed))
        
        // Environment
        if #available(iOS 17.0, *) {
            types.insert(HKQuantityType(.timeInDaylight))
        }
        
        // Workouts
        types.insert(HKObjectType.workoutType())
        
        return types
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("[P247] HealthKit not available on this device")
            return
        }
        
        try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        
        await MainActor.run {
            self.isAuthorized = true
        }
        
        print("[P247] HealthKit authorization granted")
        
        // Start initial backfill
        await backfill(days: 14)
        
        // Set up background observers
        startBackgroundSync()
    }
    
    // MARK: - Background Sync (Observer Queries)
    
    func startBackgroundSync() {
        let typesToObserve: [HKSampleType] = [
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.restingHeartRate),
            HKQuantityType(.stepCount),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.dietaryProtein),
            HKCategoryType(.sleepAnalysis),
            HKObjectType.workoutType(),
        ]
        
        for sampleType in typesToObserve {
            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completionHandler, error in
                guard error == nil else {
                    completionHandler()
                    return
                }
                
                Task {
                    await self?.syncToday()
                    completionHandler()
                }
            }
            
            healthStore.execute(query)
            
            // Enable background delivery
            healthStore.enableBackgroundDelivery(for: sampleType, frequency: .hourly) { success, error in
                if let error = error {
                    print("[P247] Background delivery failed for \(sampleType): \(error)")
                }
            }
        }
        
        print("[P247] Background observers registered")
    }
    
    // MARK: - Sync Today's Data
    
    func syncToday() async {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        await syncDate(today)
    }
    
    // MARK: - Backfill (First Launch)
    
    func backfill(days: Int) async {
        let calendar = Calendar.current
        
        for i in (0..<days).reversed() {
            let date = calendar.date(byAdding: .day, value: -i, to: calendar.startOfDay(for: Date()))!
            
            await MainActor.run {
                self.syncProgress = "Syncing \(days - i)/\(days) days..."
            }
            
            await syncDate(date)
        }
        
        await MainActor.run {
            self.syncProgress = nil
        }
        
        print("[P247] Backfill complete (\(days) days)")
    }
    
    // MARK: - Sync a Single Date
    
    private func syncDate(_ startOfDay: Date) async {
        await MainActor.run { self.isSyncing = true }
        defer { Task { await MainActor.run { self.isSyncing = false } } }
        
        let calendar = Calendar.current
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        let dateString = ISO8601DateFormatter.string(from: startOfDay, timeZone: .current, formatOptions: [.withFullDate])
        
        var metrics: [String: Any] = [:]
        
        // Quantity metrics (sum or average)
        let sumMetrics: [(HKQuantityTypeIdentifier, String, HKUnit)] = [
            (.stepCount, "step_count", .count()),
            (.distanceWalkingRunning, "distance_km", .meterUnit(with: .kilo)),
            (.activeEnergyBurned, "active_calories", .kilocalorie()),
            (.basalEnergyBurned, "basal_calories", .kilocalorie()),
            (.appleExerciseTime, "exercise_min", .minute()),
            (.flightsClimbed, "flights_climbed", .count()),
            (.dietaryProtein, "protein_g", .gram()),
            (.dietaryCarbohydrates, "carbs_g", .gram()),
            (.dietaryFatTotal, "total_fat", .gram()),
            (.dietaryFiber, "fiber_g", .gram()),
            (.dietaryEnergyConsumed, "dietary_energy_kj", .kilocalorie()),
            (.dietarySugar, "sugar_g", .gram()),
            (.dietaryPotassium, "potassium_mg", .gramUnit(with: .milli)),
            (.dietaryCholesterol, "cholesterol", .gramUnit(with: .milli)),
            (.numberOfAlcoholicBeverages, "alcohol_drinks", .count()),
            (.dietaryWater, "water_ml", .literUnit(with: .milli)),
        ]
        
        for (type, key, unit) in sumMetrics {
            if let value = await querySum(type: type, unit: unit, start: startOfDay, end: endOfDay) {
                metrics[key] = round(value * 10) / 10
            }
        }
        
        let avgMetrics: [(HKQuantityTypeIdentifier, String, HKUnit)] = [
            (.heartRateVariabilitySDNN, "hrv", .secondUnit(with: .milli)),
            (.restingHeartRate, "resting_hr", HKUnit.count().unitDivided(by: .minute())),
            (.respiratoryRate, "respiratory_rate", HKUnit.count().unitDivided(by: .minute())),
            (.oxygenSaturation, "blood_oxygen_saturation", .percent()),
            (.walkingSpeed, "walking_speed_kmh", HKUnit.meter().unitDivided(by: .second())),
        ]
        
        for (type, key, unit) in avgMetrics {
            if let value = await queryAverage(type: type, unit: unit, start: startOfDay, end: endOfDay) {
                var adjusted = value
                if key == "blood_oxygen_saturation" { adjusted = value * 100 } // Convert 0.97 to 97
                if key == "walking_speed_kmh" { adjusted = value * 3.6 } // m/s to km/h
                metrics[key] = round(adjusted * 10) / 10
            }
        }
        
        // Latest-value metrics
        let latestMetrics: [(HKQuantityTypeIdentifier, String, HKUnit)] = [
            (.vo2Max, "vo2max", HKUnit.literUnit(with: .milli).unitDivided(by: HKUnit.gramUnit(with: .kilo).unitMultiplied(by: .minute()))),
            (.bodyMass, "weight_kg", .gramUnit(with: .kilo)),
            (.bodyFatPercentage, "body_fat_pct", .percent()),
            (.leanBodyMass, "lean_body_mass", .gramUnit(with: .kilo)),
        ]
        
        for (type, key, unit) in latestMetrics {
            if let value = await queryLatest(type: type, unit: unit, start: startOfDay, end: endOfDay) {
                var adjusted = value
                if key == "body_fat_pct" { adjusted = value * 100 }
                metrics[key] = round(adjusted * 100) / 100
            }
        }
        
        // Heart rate samples (min/max/avg)
        if let hrStats = await queryHeartRateStats(start: startOfDay, end: endOfDay) {
            metrics["heart_rate_samples"] = hrStats
        }
        
        // Daylight
        if #available(iOS 17.0, *) {
            if let daylight = await querySum(type: .timeInDaylight, unit: .minute(), start: startOfDay, end: endOfDay) {
                metrics["daylight_min"] = Int(daylight)
            }
        }
        
        // Running mechanics (from running workouts only)
        let runningMetrics = await queryRunningMechanics(start: startOfDay, end: endOfDay)
        if !runningMetrics.isEmpty {
            for (key, value) in runningMetrics {
                metrics[key] = value
            }
        }
        
        // Sleep
        let sleepData = await querySleep(start: startOfDay, end: endOfDay)
        
        // Workouts
        let workouts = await queryWorkouts(start: startOfDay, end: endOfDay)
        
        // Skip if no data
        if metrics.isEmpty && sleepData == nil && workouts.isEmpty {
            return
        }
        
        // Build payload
        var payload: [String: Any] = [
            "date": dateString,
            "timezone": TimeZone.current.identifier,
            "device_sync_timestamp": ISO8601DateFormatter().string(from: Date()),
            "metrics": metrics,
        ]
        
        if let sleepData = sleepData {
            payload["sleep"] = sleepData
        }
        
        if !workouts.isEmpty {
            payload["workouts"] = workouts
        }
        
        // POST to backend
        await postToBackend(payload: payload)
        
        await MainActor.run {
            self.lastSyncDate = Date()
        }
    }
    
    // MARK: - HealthKit Queries
    
    private func querySum(type: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        let quantityType = HKQuantityType(type)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: quantityType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                let value = stats?.sumQuantity()?.doubleValue(for: unit)
                continuation.resume(returning: value)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryAverage(type: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        let quantityType = HKQuantityType(type)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: quantityType, quantitySamplePredicate: predicate, options: .discreteAverage) { _, stats, _ in
                let value = stats?.averageQuantity()?.doubleValue(for: unit)
                continuation.resume(returning: value)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryLatest(type: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        let quantityType = HKQuantityType(type)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: quantityType, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                let value = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: unit)
                continuation.resume(returning: value)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryHeartRateStats(start: Date, end: Date) async -> [String: Any]? {
        let hrType = HKQuantityType(.heartRate)
        let unit = HKUnit.count().unitDivided(by: .minute())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: hrType, quantitySamplePredicate: predicate, options: [.discreteAverage, .discreteMin, .discreteMax]) { _, stats, _ in
                guard let stats = stats,
                      let avg = stats.averageQuantity()?.doubleValue(for: unit),
                      let min = stats.minimumQuantity()?.doubleValue(for: unit),
                      let max = stats.maximumQuantity()?.doubleValue(for: unit) else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: [
                    "avg": Int(round(avg)),
                    "min": Int(round(min)),
                    "max": Int(round(max)),
                ])
            }
            healthStore.execute(query)
        }
    }
    
    private func querySleep(start: Date, end: Date) async -> [String: Any]? {
        let sleepType = HKCategoryType(.sleepAnalysis)
        // Sleep for a given night usually starts the previous evening
        let sleepStart = Calendar.current.date(byAdding: .hour, value: -12, to: start)!
        let predicate = HKQuery.predicateForSamples(withStart: sleepStart, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                guard let samples = samples as? [HKCategorySample], !samples.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }
                
                // Filter to Apple Watch source if available (prefer wearable over phone)
                let watchSamples = samples.filter { $0.sourceRevision.productType?.hasPrefix("Watch") == true }
                let bestSamples = watchSamples.isEmpty ? samples : watchSamples
                
                var core: TimeInterval = 0
                var deep: TimeInterval = 0
                var rem: TimeInterval = 0
                var awake: TimeInterval = 0
                var inBedStart: Date?
                var inBedEnd: Date?
                
                for sample in bestSamples {
                    let duration = sample.endDate.timeIntervalSince(sample.startDate)
                    
                    if inBedStart == nil || sample.startDate < inBedStart! {
                        inBedStart = sample.startDate
                    }
                    if inBedEnd == nil || sample.endDate > inBedEnd! {
                        inBedEnd = sample.endDate
                    }
                    
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                        core += duration
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                        deep += duration
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                        rem += duration
                    case HKCategoryValueSleepAnalysis.awake.rawValue:
                        awake += duration
                    case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        core += duration // Count unspecified as core
                    default:
                        break
                    }
                }
                
                let totalSleep = core + deep + rem
                guard totalSleep > 0 else {
                    continuation.resume(returning: nil)
                    return
                }
                
                var result: [String: Any] = [
                    "total_hours": round(totalSleep / 3600 * 100) / 100,
                    "core_hours": round(core / 3600 * 100) / 100,
                    "deep_hours": round(deep / 3600 * 100) / 100,
                    "rem_hours": round(rem / 3600 * 100) / 100,
                    "awake_hours": round(awake / 3600 * 100) / 100,
                    "source": "Apple Watch",
                ]
                
                let formatter = ISO8601DateFormatter()
                if let start = inBedStart { result["in_bed_start"] = formatter.string(from: start) }
                if let end = inBedEnd { result["in_bed_end"] = formatter.string(from: end) }
                
                continuation.resume(returning: result)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryWorkouts(start: Date, end: Date) async -> [[String: Any]] {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                guard let workouts = samples as? [HKWorkout] else {
                    continuation.resume(returning: [])
                    return
                }
                
                let formatter = ISO8601DateFormatter()
                let results: [[String: Any]] = workouts.map { workout in
                    var dict: [String: Any] = [
                        "type": workout.workoutActivityType.name,
                        "start": formatter.string(from: workout.startDate),
                        "end": formatter.string(from: workout.endDate),
                        "duration_seconds": Int(workout.duration),
                        "source": workout.sourceRevision.source.name,
                    ]
                    
                    if let energy = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                        dict["energy_kcal"] = Int(round(energy))
                    }
                    if let distance = workout.totalDistance?.doubleValue(for: .meter()) {
                        dict["distance_m"] = Int(round(distance))
                    }
                    
                    return dict
                }
                
                continuation.resume(returning: results)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryRunningMechanics(start: Date, end: Date) async -> [String: Any] {
        var result: [String: Any] = [:]
        
        let mechanics: [(HKQuantityTypeIdentifier, String, HKUnit)] = [
            (.runningSpeed, "running_speed_kmh", HKUnit.meter().unitDivided(by: .second())),
            (.runningPower, "running_power_w", .watt()),
            (.runningStrideLength, "running_stride_m", .meter()),
            (.runningVerticalOscillation, "running_oscillation_cm", .meterUnit(with: .centi)),
            (.runningGroundContactTime, "running_ground_contact_time", .secondUnit(with: .milli)),
        ]
        
        for (type, key, unit) in mechanics {
            if let value = await queryAverage(type: type, unit: unit, start: start, end: end) {
                var adjusted = value
                if key == "running_speed_kmh" { adjusted = value * 3.6 }
                result[key] = round(adjusted * 100) / 100
            }
        }
        
        return result
    }
    
    // MARK: - Backend POST
    
    private func postToBackend(payload: [String: Any]) async {
        guard !apiKey.isEmpty else {
            print("[P247] No API key set, skipping sync")
            return
        }
        
        guard let url = URL(string: "\(apiBaseURL)/sync/healthkit") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // The /sync/healthkit endpoint expects { "data": [...] } but we send our structured format
        // Wrap in the expected shape
        let wrappedPayload: [String: Any] = ["data": [payload]]
        
        guard let body = try? JSONSerialization.data(withJSONObject: wrappedPayload) else {
            print("[P247] Failed to serialize payload")
            return
        }
        
        request.httpBody = body
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 {
                    let dateStr = (payload["date"] as? String) ?? "unknown"
                    print("[P247] Synced \(dateStr) successfully")
                } else {
                    let responseStr = String(data: data, encoding: .utf8) ?? ""
                    print("[P247] Sync failed (\(httpResponse.statusCode)): \(responseStr)")
                }
            }
        } catch {
            print("[P247] Sync error: \(error.localizedDescription)")
        }
    }
}

// MARK: - Workout Activity Type Names

extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .running: return "Run"
        case .cycling: return "Ride"
        case .swimming: return "Swim"
        case .walking: return "Walk"
        case .hiking: return "Hike"
        case .crossTraining: return "CrossTraining"
        case .functionalStrengthTraining: return "FunctionalStrengthTraining"
        case .traditionalStrengthTraining: return "WeightTraining"
        case .highIntensityIntervalTraining: return "HIIT"
        case .rowing: return "Rowing"
        case .yoga: return "Yoga"
        case .elliptical: return "Elliptical"
        case .stairClimbing: return "StairClimber"
        case .other: return "Other"
        default: return "Other"
        }
    }
}
