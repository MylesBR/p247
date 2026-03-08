#!/usr/bin/env node
/**
 * P247 Morning Brief v2 — Full Product Stack
 * Strava + Recovery Scoring + Sleep Coaching + Nutrition + Hyrox Periodization
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getLast7Days() {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.unshift(d.toISOString().slice(0, 10));
  }
  return dates;
}

function daysUntilHyrox() {
  // July 2026 Hyrox (assume mid-July = 15 July)
  const hyrox = new Date(2026, 6, 15); // 0-indexed months
  const today = new Date();
  return Math.ceil((hyrox - today) / (1000 * 60 * 60 * 24));
}

function getHyroxPhase() {
  const weeks = Math.ceil(daysUntilHyrox() / 7);
  if (weeks > 12) return { phase: 1, name: 'Aerobic Base', focus: 'Zone 2 work, strength maintenance' };
  if (weeks > 8)  return { phase: 2, name: 'Sport-Specific', focus: 'Sled push, rowing, skiing technique' };
  if (weeks > 4)  return { phase: 3, name: 'Intensity', focus: 'High-intensity intervals, mental toughness' };
  return { phase: 4, name: 'Peak & Taper', focus: 'Minimal volume, max freshness' };
}

// ─── Fetch Strava data ─────────────────────────────────────────────────────

async function fetchStravaActivities() {
  const token = process.env.STRAVA_ACCESS_TOKEN;
  if (!token) {
    console.log('[P247] No Strava token, skipping workout load');
    return null;
  }

  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const activities = await response.json();
    
    // Get yesterday's activities
    const yesterday = getYesterdayKey();
    const yesterdayActivities = activities.filter(a => {
      const actDate = new Date(a.start_date).toISOString().slice(0, 10);
      return actDate === yesterday && a.type !== 'Walk'; // exclude walks
    });

    if (yesterdayActivities.length === 0) return null;

    // Calculate training load: duration (min) × intensity factor
    // Intensity: easy/recovery = 1.0, moderate = 1.5, hard/threshold = 2.0, VO2/race = 2.5
    let totalLoad = 0;
    const activities_detail = [];

    for (const a of yesterdayActivities) {
      const duration_min = a.moving_time / 60;
      const intensity = estimateIntensity(a);
      const load = duration_min * intensity;
      totalLoad += load;
      activities_detail.push({
        name: a.name,
        type: a.type,
        duration_min: Math.round(duration_min),
        distance_km: a.distance / 1000,
        avgHeartRate: a.average_heartrate,
        maxHeartRate: a.max_heartrate,
        intensity,
        load: Math.round(load),
      });
    }

    return {
      total_load: Math.round(totalLoad),
      activities: activities_detail,
      count: yesterdayActivities.length,
    };
  } catch (err) {
    console.error('[P247] Strava fetch error:', err.message);
    return null;
  }
}

function estimateIntensity(activity) {
  // Rough estimation based on avg heart rate as % of max (220-age = 220-52 = 168)
  const maxHR = 168;
  const avgHR = activity.average_heartrate || 0;
  const pctMax = avgHR / maxHR;

  if (pctMax < 0.6) return 1.0; // easy
  if (pctMax < 0.75) return 1.5; // moderate
  if (pctMax < 0.85) return 2.0; // hard
  return 2.5; // VO2/race pace
}

// ─── Load health data ──────────────────────────────────────────────────────

function loadHealthData() {
  const dmFile = path.join(BASE_DIR, 'health', 'daily-metrics.json');
  if (!fs.existsSync(dmFile)) return { entries: {} };
  return JSON.parse(fs.readFileSync(dmFile, 'utf8'));
}

// ─── Calculate recovery score with training load ────────────────────────────

function analyzeRecovery(yesterday, strava, trend) {
  const sleep = yesterday.sleep_hours ?? 0;
  const hrv = yesterday.hrv ?? null;
  const rhr = yesterday.resting_hr ?? null;
  const trainingLoad = strava?.total_load ?? 0;

  const sleepScore = Math.min(100, (sleep / 7.5) * 100);
  const hrvScore = hrv ? Math.min(100, (hrv / 60) * 100) : 50;
  const rhrScore = rhr ? Math.max(0, 100 - (rhr - 40) * 2) : 50;
  
  // Training load impact: 100 load = 20 point deduction from recovery
  const trainingLoadScore = Math.max(20, 100 - (trainingLoad / 5));

  const recoveryScore = Math.round(
    sleepScore * 0.40 +
    hrvScore * 0.25 +
    rhrScore * 0.20 +
    trainingLoadScore * 0.15
  );

  return {
    sleep,
    hrv,
    rhr,
    trainingLoad,
    sleepScore: Math.round(sleepScore),
    hrvScore: Math.round(hrvScore),
    rhrScore: Math.round(rhrScore),
    trainingLoadScore: Math.round(trainingLoadScore),
    recoveryScore,
    quality:
      recoveryScore >= 75 ? '🟢 Excellent' :
      recoveryScore >= 60 ? '🟡 Adequate' :
      recoveryScore >= 45 ? '🟠 Compromised' :
      '🔴 Critical',
  };
}

// ─── Generate sleep improvement coaching ────────────────────────────────────

function sleepCoaching(yesterday, trend) {
  const sleep = yesterday.sleep_hours ?? 0;
  const last7 = trend.avgSleep;
  const sleepData = trend.sleepHistory || [];

  // Find pattern
  let pattern = 'stable';
  if (sleepData.length > 3) {
    const recent = sleepData.slice(-3).reduce((a,b) => a+b, 0) / 3;
    const prev = sleepData.slice(0, 4).reduce((a,b) => a+b, 0) / 4;
    if (recent < prev - 0.5) pattern = 'declining';
    if (recent > prev + 0.5) pattern = 'improving';
  }

  let recommendation = '';
  let priority = 'medium';

  if (sleep < 5) {
    recommendation = `🚨 CRITICAL: Only ${sleep.toFixed(1)}h last night. Bedtime needs to move 30min earlier TONIGHT. Pick 22:00 bedtime, no exceptions. This is costing you SMM recovery (you've lost 1.7kg since Nov).`;
    priority = 'critical';
  } else if (last7 < 5.5 && pattern === 'declining') {
    recommendation = `📉 TREND ALERT: Sleep averaging ${last7.toFixed(1)}h and declining (${pattern}). At 52y with training 6x/week, you need 7h minimum. Set a non-negotiable 22:30 bedtime for 7 consecutive nights. Track it.`;
    priority = 'high';
  } else if (sleep < 6 && sleep >= 5) {
    recommendation = `⚠️ SHORT NIGHT: ${sleep.toFixed(1)}h is below your minimum. Blue-light blocker 1h before bed + magnesium glycinate 200mg at 21:30. Test for 3 nights.`;
    priority = 'high';
  } else if (last7 >= 7 && last7 <= 7.5) {
    recommendation = `✅ ON TARGET: Averaging ${last7.toFixed(1)}h — this is working. Maintain the 22:30 bedtime routine. Don't experiment with changes.`;
    priority = 'low';
  } else if (last7 > 7.5) {
    recommendation = `💤 SOLID: Averaging ${last7.toFixed(1)}h of quality sleep. Your SMM recovery is supported. Maintain discipline on bedtime.`;
    priority = 'low';
  }

  return { recommendation, priority, pattern, avgSleep: last7 };
}

// ─── Nutrition targets ─────────────────────────────────────────────────────

function nutritionTargets(yesterday, strava) {
  // Base on yesterday's calorie burn + SMM needs
  const activeCalBurned = yesterday.active_calories ?? 0;
  const trainingLoad = strava?.total_load ?? 0;

  // Baseline at 79.6kg: 1854 kcal (BMR from InBody)
  // Daily deficit/surplus based on training
  let dailyTarget = 1854; // BMR
  dailyTarget += activeCalBurned; // add back activity
  dailyTarget += trainingLoad > 80 ? 200 : 0; // recovery boost for high load days

  // Protein: 2.0g/kg for SMM recovery + deficit context
  const proteinG = Math.round(79.6 * 2.0);
  
  // Carbs: 60% of remaining calories
  const caloriesAfterProtein = dailyTarget - (proteinG * 4);
  const carbG = Math.round((caloriesAfterProtein * 0.6) / 4);
  
  // Fat: 40% of remaining
  const fatG = Math.round((caloriesAfterProtein * 0.4) / 9);

  return {
    totalCalories: Math.round(dailyTarget),
    protein: { grams: proteinG, label: 'high protein for SMM recovery' },
    carbs: { grams: carbG, label: 'training fuel' },
    fat: { grams: fatG, label: 'hormone support' },
    note: trainingLoad > 80 ? '(high load day detected — boost carbs by 30g)' : '',
  };
}

// ─── Trend analysis with history ────────────────────────────────────────────

function analyzeTrend(dm) {
  const last7 = getLast7Days();
  const entries = dm.entries || {};
  const data = last7.map(d => entries[d] ?? {});

  const sleepHistory = data.map(e => e.sleep_hours ?? 0);
  const hrvHistory = data.filter(e => e.hrv).map(e => e.hrv);
  const rhrHistory = data.filter(e => e.resting_hr).map(e => e.resting_hr);

  const avgSleep = sleepHistory.reduce((a,b) => a+b, 0) / 7;
  const avgHRV = hrvHistory.length > 0 ? hrvHistory.reduce((a,b) => a+b, 0) / hrvHistory.length : null;
  const avgRHR = rhrHistory.length > 0 ? rhrHistory.reduce((a,b) => a+b, 0) / rhrHistory.length : null;
  const avgSteps = data.reduce((s, e) => s + (e.step_count ?? 0), 0) / 7;
  const avgCal = data.reduce((s, e) => s + (e.active_calories ?? 0), 0) / 7;

  return {
    avgSleep: parseFloat(avgSleep.toFixed(1)),
    avgHRV: avgHRV ? Math.round(avgHRV) : null,
    avgRHR: avgRHR ? Math.round(avgRHR) : null,
    avgSteps: Math.round(avgSteps),
    avgCal: Math.round(avgCal),
    sleepHistory,
  };
}

// ─── Main brief formatting ──────────────────────────────────────────────────

async function generateBrief() {
  const dm = loadHealthData();
  const entries = dm.entries || {};
  const yesterday = getYesterdayKey();
  const yesterdayData = entries[yesterday] || {};

  if (Object.keys(yesterdayData).length === 0) {
    console.log('[P247] No data for yesterday');
    process.exit(0);
  }

  // Fetch Strava
  const strava = await fetchStravaActivities();

  // Analyze
  const trend = analyzeTrend(dm);
  const recovery = analyzeRecovery(yesterdayData, strava, trend);
  const sleepCoach = sleepCoaching(yesterdayData, trend);
  const nutrition = nutritionTargets(yesterdayData, strava);
  const hyrox = getHyroxPhase();

  // Generate brief
  let brief = `*P247 Morning Brief — ${getTodayKey()}*\n\n`;

  // Recovery score
  brief += `*Recovery Score:* ${recovery.quality} (${recovery.recoveryScore}/100)\n`;
  brief += `• Sleep: ${recovery.sleep.toFixed(1)}h (${recovery.sleepScore}/100)\n`;
  if (recovery.hrv) brief += `• HRV: ${recovery.hrv}ms (${recovery.hrvScore}/100)\n`;
  if (recovery.rhr) brief += `• Resting HR: ${recovery.rhr}bpm (${recovery.rhrScore}/100)\n`;
  if (strava) brief += `• Training Load: ${recovery.trainingLoad} (${recovery.trainingLoadScore}/100)\n`;
  brief += '\n';

  // Training readiness
  let readiness = '✅ Train as planned';
  if (recovery.recoveryScore < 60) readiness = '🟡 Moderate intensity only';
  if (recovery.recoveryScore < 45) readiness = '🛑 Easy day or skip strength';
  brief += `*Training Readiness:* ${readiness}\n\n`;

  // Strava data
  if (strava && strava.activities.length > 0) {
    brief += `*Yesterday's Training:*\n`;
    for (const act of strava.activities) {
      brief += `• ${act.name}: ${act.duration_min}min, ${act.distance_km.toFixed(1)}km, avg HR ${act.avgHeartRate}bpm\n`;
    }
    brief += `Total Load: ${strava.total_load} (${recovery.trainingLoadScore}/100 recovery impact)\n\n`;
  }

  // Sleep coaching (MAIN MESSAGE)
  brief += `*Sleep Improvement Protocol:*\n${sleepCoach.recommendation}\n\n`;

  // Nutrition
  brief += `*Daily Nutrition Target:*\n`;
  brief += `${nutrition.totalCalories} kcal | ${nutrition.protein.grams}g protein (recovery) | ${nutrition.carbs.grams}g carbs | ${nutrition.fat.grams}g fat\n`;
  if (nutrition.note) brief += `${nutrition.note}\n`;
  brief += '\n';

  // Hyrox phase
  const daysLeft = daysUntilHyrox();
  brief += `*Hyrox Build (${daysLeft} days):*\n`;
  brief += `Phase ${hyrox.phase}: ${hyrox.name}\n`;
  brief += `Focus: ${hyrox.focus}\n\n`;

  // Weekly trend
  brief += `*This Week's Baseline:*\n`;
  brief += `Sleep: ${trend.avgSleep}h | Steps: ${trend.avgSteps} | Output: ${trend.avgCal} kcal\n`;
  brief += `${trend.avgHRV ? `HRV Avg: ${trend.avgHRV}ms | ` : ''}${trend.avgRHR ? `RHR Avg: ${trend.avgRHR}bpm` : ''}\n\n`;

  brief += `_Dashboard: http://192.168.100.143:3000/health_`;

  return brief;
}

// ─── Run ────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const brief = await generateBrief();
    console.log(brief);
    process.exit(0);
  } catch (err) {
    console.error('[P247] Error:', err);
    process.exit(1);
  }
})();
