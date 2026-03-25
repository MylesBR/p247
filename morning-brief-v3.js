#!/usr/bin/env node
/**
 * P247 Morning Brief v3 — Holistic Health Intelligence
 * All Apple Health + Strava metrics, grouped by category, with cross-domain coaching.
 * Timezone-aware (Australia/Sydney).
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const TZ = 'Australia/Sydney';

// ─── Timezone-aware date helpers ────────────────────────────────────────────

function sydneyDate(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  // Let toLocaleDateString handle the timezone conversion directly
  // (avoids the bug where new Date() in local time + toISOString() shifts the day back to UTC)
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function todayKey() { return sydneyDate(0); }
function yesterdayKey() { return sydneyDate(-1); }

function last7Days() {
  // 7 days ending yesterday (today's data is incomplete)
  const dates = [];
  for (let i = 7; i >= 1; i--) dates.push(sydneyDate(-i));
  return dates;
}

function daysUntilHyrox() {
  const hyrox = new Date(2026, 6, 15);
  const now = new Date();
  return Math.ceil((hyrox - now) / (1000 * 60 * 60 * 24));
}

function daysUntilHM() {
  const hm = new Date(2026, 7, 23);
  const now = new Date();
  return Math.ceil((hm - now) / (1000 * 60 * 60 * 24));
}

function getHyroxPhase() {
  const weeks = Math.ceil(daysUntilHyrox() / 7);
  if (weeks > 12) return { phase: 1, name: 'Aerobic Base', focus: 'Zone 2 work, strength maintenance, running volume build' };
  if (weeks > 8)  return { phase: 2, name: 'Sport-Specific', focus: 'Sled push, rowing, skiing technique, station transitions' };
  if (weeks > 4)  return { phase: 3, name: 'Intensity', focus: 'Race-pace intervals, fatigue management, mental toughness' };
  return { phase: 4, name: 'Peak & Taper', focus: 'Minimal volume, max freshness, race strategy rehearsal' };
}

// ─── Data loading ───────────────────────────────────────────────────────────

function loadHealthData() {
  const f = path.join(BASE_DIR, 'health', 'daily-metrics.json');
  if (!fs.existsSync(f)) return { entries: {} };
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function loadStravaActivities() {
  const f = path.join(BASE_DIR, 'strava', 'activities.json');
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function loadBodyData() {
  const f = path.join(BASE_DIR, 'health', 'body-data.json');
  if (!fs.existsSync(f)) return null;
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const scans = d.scans || [];
  // Prefer InBody scans (most complete), fall back to latest
  const inbody = scans.filter(s => s.type === 'inbody').pop();
  return inbody || (scans.length > 0 ? scans[scans.length - 1] : null);
}

function loadVO2Max() {
  const f = path.join(BASE_DIR, 'health', 'vo2max.json');
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

// ─── Analysis functions ─────────────────────────────────────────────────────

function getYesterdayStrava(allActivities, dateKey) {
  const dayActivities = allActivities.filter(a => {
    const actDate = new Date(a.start_date).toLocaleDateString('en-CA', { timeZone: TZ });
    return actDate === dateKey && a.type !== 'Walk';
  });
  return deduplicateActivities(dayActivities);
}

/**
 * Deduplicate activities that appear twice due to multiple apps
 * (e.g. Strava + Runna both syncing the same run to Apple Health).
 * Match on: same type + distance within 10% + duration within 20%.
 * Keep the one with more data (prefer the one with HR data, or longer moving_time).
 */
function deduplicateActivities(activities) {
  const dominated = new Set();
  for (let i = 0; i < activities.length; i++) {
    if (dominated.has(i)) continue;
    for (let j = i + 1; j < activities.length; j++) {
      if (dominated.has(j)) continue;
      const a = activities[i], b = activities[j];
      if (a.type !== b.type) continue;
      const distA = a.distance || 0, distB = b.distance || 0;
      const durA = a.moving_time || 0, durB = b.moving_time || 0;
      if (distA === 0 || distB === 0) continue;
      const distRatio = Math.abs(distA - distB) / Math.max(distA, distB);
      const durRatio = Math.abs(durA - durB) / Math.max(durA, durB);
      if (distRatio < 0.10 && durRatio < 0.20) {
        // Duplicate found. Keep the one with more complete data.
        const scoreA = (a.average_heartrate ? 1 : 0) + (a.max_heartrate ? 1 : 0) + (a.calories ? 1 : 0);
        const scoreB = (b.average_heartrate ? 1 : 0) + (b.max_heartrate ? 1 : 0) + (b.calories ? 1 : 0);
        dominated.add(scoreB > scoreA ? i : j);
      }
    }
  }
  return activities.filter((_, idx) => !dominated.has(idx));
}

function estimateIntensity(activity) {
  const maxHR = 168; // 220 - 52
  const avgHR = activity.average_heartrate || 0;
  const pctMax = avgHR / maxHR;
  if (pctMax < 0.6) return 1.0;
  if (pctMax < 0.75) return 1.5;
  if (pctMax < 0.85) return 2.0;
  return 2.5;
}

function calcTrainingLoad(activities) {
  let totalLoad = 0;
  const details = [];
  for (const a of activities) {
    const durMin = a.moving_time / 60;
    const intensity = estimateIntensity(a);
    const load = durMin * intensity;
    totalLoad += load;

    const detail = {
      name: a.name,
      type: a.type,
      durMin: Math.round(durMin),
      distKm: +(a.distance / 1000).toFixed(1),
      avgHR: a.average_heartrate || null,
      maxHR: a.max_heartrate || null,
      load: Math.round(load),
    };

    // Add pace for runs
    if (a.type === 'Run' && a.distance > 0) {
      const paceSec = a.moving_time / (a.distance / 1000);
      detail.pace = `${Math.floor(paceSec / 60)}:${String(Math.floor(paceSec % 60)).padStart(2, '0')}/km`;
    }

    details.push(detail);
  }
  return { totalLoad: Math.round(totalLoad), activities: details };
}

function getRunPaceTrend(allActivities) {
  const allRuns = allActivities
    .filter(a => a.type === 'Run' && a.distance > 500)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const runs = deduplicateActivities(allRuns).slice(-5);

  return runs.map(r => {
    const paceSec = r.moving_time / (r.distance / 1000);
    return {
      date: new Date(r.start_date).toLocaleDateString('en-CA', { timeZone: TZ }),
      name: r.name,
      distKm: +(r.distance / 1000).toFixed(1),
      pace: `${Math.floor(paceSec / 60)}:${String(Math.floor(paceSec % 60)).padStart(2, '0')}/km`,
      paceSec,
      avgHR: r.average_heartrate || null,
    };
  });
}

function analyzeTrend(dm) {
  const days = last7Days();
  const entries = dm.entries || {};

  // Build corrected daily records:
  // - Activity/nutrition: from each date's entry
  // - Sleep: from the NEXT day's entry (Apple Health stamps sleep by wake date)
  //   e.g. Monday night's sleep is stored under Tuesday's entry
  const data = days.map(dateStr => {
    const dayEntry = entries[dateStr] || {};
    // Find the next day for sleep data
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const nextDay = d.toISOString().slice(0, 10);
    const nextEntry = entries[nextDay] || {};

    // Start with the day's activity/nutrition data
    const merged = { ...dayEntry };
    // Override sleep fields with next day's entry (wake date)
    const sleepFields = ['sleep_hours', 'sleep_core', 'sleep_deep', 'sleep_rem', 'sleep_awake',
                         'sleep_source', 'apple_sleeping_wrist_temperature',
                         'respiratory_rate', 'blood_oxygen_saturation'];
    for (const field of sleepFields) {
      if (nextEntry[field] != null) {
        merged[field] = nextEntry[field];
      }
    }
    return merged;
  });

  const filled = data.filter(e => Object.keys(e).length > 2);

  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const sleepArr = filled.map(e => e.sleep_hours).filter(v => v != null && v > 0);
  const hrvArr = filled.map(e => e.hrv).filter(v => v != null);
  const rhrArr = filled.map(e => e.resting_hr).filter(v => v != null);
  const stepsArr = filled.map(e => e.step_count).filter(v => v != null);
  const calArr = filled.map(e => e.active_calories).filter(v => v != null);
  const deepArr = filled.map(e => e.sleep_deep).filter(v => v != null);
  const remArr = filled.map(e => e.sleep_rem).filter(v => v != null);
  const fiberArr = filled.map(e => e.fiber_g).filter(v => v != null);
  const proteinArr = filled.map(e => e.protein_g).filter(v => v != null);

  return {
    daysWithData: filled.length,
    avgSleep: avg(sleepArr) ? +avg(sleepArr).toFixed(1) : null,
    avgDeep: avg(deepArr) ? +avg(deepArr).toFixed(2) : null,
    avgREM: avg(remArr) ? +avg(remArr).toFixed(2) : null,
    avgHRV: avg(hrvArr) ? Math.round(avg(hrvArr)) : null,
    avgRHR: avg(rhrArr) ? Math.round(avg(rhrArr)) : null,
    avgSteps: avg(stepsArr) ? Math.round(avg(stepsArr)) : null,
    avgCal: avg(calArr) ? Math.round(avg(calArr)) : null,
    avgFiber: avg(fiberArr) ? +avg(fiberArr).toFixed(0) : null,
    avgProtein: avg(proteinArr) ? Math.round(avg(proteinArr)) : null,
    sleepArr,
    hrvArr,
  };
}

// ─── Recovery scoring ───────────────────────────────────────────────────────

function scoreRecovery(d, trainingLoad, trend) {
  const sleep = d.sleep_hours ?? 0;
  const hrv = d.hrv ?? null;
  const rhr = d.resting_hr ?? null;
  const deep = d.sleep_deep ?? 0;
  const awake = d.sleep_awake ?? 0;

  const sleepScore = Math.min(100, (sleep / 7.5) * 100);
  const hrvScore = hrv != null ? Math.min(100, (hrv / 60) * 100) : 50;
  const rhrScore = rhr != null ? Math.max(0, 100 - (rhr - 40) * 2) : 50;
  const loadScore = Math.max(20, 100 - (trainingLoad / 5));
  // Deep sleep bonus/penalty
  const deepScore = deep >= 1.0 ? 100 : deep >= 0.5 ? 70 : 40;
  // Sleep fragmentation: awake time during the night destroys recovery quality
  // 0h awake = 100, 0.5h = 70, 1h = 40, 1.5h+ = 20
  const fragScore = awake <= 0.1 ? 100 : awake <= 0.5 ? 70 : awake <= 1.0 ? 40 : 20;

  const total = Math.round(
    sleepScore * 0.25 +
    hrvScore * 0.20 +
    rhrScore * 0.10 +
    loadScore * 0.10 +
    deepScore * 0.15 +
    fragScore * 0.20
  );

  const quality =
    total >= 75 ? '🟢 Excellent' :
    total >= 60 ? '🟡 Adequate' :
    total >= 45 ? '🟠 Compromised' :
    '🔴 Critical';

  return {
    total, quality,
    sleepScore: Math.round(sleepScore),
    hrvScore: Math.round(hrvScore),
    rhrScore: Math.round(rhrScore),
    loadScore: Math.round(loadScore),
    fragScore: Math.round(fragScore),
    deepScore: Math.round(deepScore),
  };
}

// ─── Holistic coaching ──────────────────────────────────────────────────────

function generateCoaching(d, trend, recovery, training) {
  const insights = [];

  // ── Sleep
  const sleep = d.sleep_hours ?? 0;
  const deep = d.sleep_deep ?? 0;
  const rem = d.sleep_rem ?? 0;

  if (sleep < 5) {
    insights.push(`🚨 *Sleep crisis:* ${sleep.toFixed(1)}h is dangerously low for recovery at 52. Your SMM dropped 1.7kg Nov to Feb and short sleep accelerates that. Non-negotiable 22:00 lights out tonight.`);
  } else if (sleep < 6.5) {
    insights.push(`⚠️ *Sleep short:* ${sleep.toFixed(1)}h. You need 7+ for muscle protein synthesis to peak overnight. Push bedtime 30min earlier.`);
  } else if (sleep >= 7) {
    insights.push(`✅ *Sleep on target:* ${sleep.toFixed(1)}h. Keep the current bedtime routine locked in.`);
  }

  // ── Sleep fragmentation
  const awake = d.sleep_awake ?? 0;
  if (awake >= 1.0) {
    insights.push(`🚨 *Fragmented sleep:* ${(awake * 60).toFixed(0)}min awake during the night. Broken sleep prevents completing full 90-min sleep cycles, which is where deep sleep and REM concentrate. Even if total hours look OK, fragmentation kills recovery quality. Check: alcohol, caffeine after 2pm, room temperature, stress, or bladder issues.`);
  } else if (awake >= 0.5) {
    insights.push(`⚠️ *Sleep disrupted:* ${(awake * 60).toFixed(0)}min awake during the night. That's enough to break sleep cycles and reduce recovery quality.`);
  }

  if (deep < 0.5 && sleep > 0) {
    insights.push(`⚠️ *Deep sleep low:* ${(deep * 60).toFixed(0)}min. This is where growth hormone peaks. Ensure room is cool (18°C), no screens 1hr before bed, magnesium glycinate 200mg at 21:30.`);
  }

  // ── Sleep + Fiber connection
  const fiber = d.fiber_g ?? 0;
  if (fiber < 20 && deep < 0.7) {
    insights.push(`🔗 *Fiber to sleep link:* Your fiber (${fiber}g) is below 20g and deep sleep is low. Research shows fiber feeds gut microbes that produce sleep-promoting SCFAs. Push for 25g+ today via vegetables, oats, or a fiber supplement.`);
  }

  // ── HRV context
  const hrv = d.hrv ?? null;
  if (hrv != null && trend.avgHRV != null) {
    const diff = hrv - trend.avgHRV;
    if (diff < -10) {
      insights.push(`📉 *HRV below baseline:* ${hrv}ms vs ${trend.avgHRV}ms avg. Your nervous system is stressed. Consider dropping intensity today or adding an extra 20min of Zone 2 instead of heavy lifting.`);
    } else if (diff > 5) {
      insights.push(`📈 *HRV above baseline:* ${hrv}ms vs ${trend.avgHRV}ms avg. Good recovery window. Push intensity today if the program calls for it.`);
    }
  }

  // ── Daylight exposure
  const daylight = d.daylight_min ?? 0;
  if (daylight < 20) {
    insights.push(`☀️ *Low daylight:* ${daylight}min. Aim for 15+ min of outdoor light before 9am to anchor your circadian rhythm. Directly improves sleep onset and HRV.`);
  }

  // ── Nutrition
  const protein = d.protein_g ?? 0;
  const targetProtein = 159; // 2.0g/kg * 79.6kg
  if (protein > 0 && protein < targetProtein * 0.8) {
    insights.push(`⚠️ *Protein gap:* ${protein}g yesterday vs ${targetProtein}g target (2.0g/kg). You're leaving muscle recovery on the table. Front-load protein at breakfast and lunch.`);
  } else if (protein >= targetProtein) {
    insights.push(`✅ *Protein on point:* ${protein}g (target ${targetProtein}g).`);
  }

  // ── Running form
  const gct = d.running_ground_contact_time ?? null;
  const stride = d.running_stride_m ?? null;
  const oscillation = d.running_oscillation_cm ?? null;
  if (gct && stride && oscillation) {
    const formNotes = [];
    if (gct > 270) formNotes.push(`GCT ${Math.round(gct)}ms is high (target <260ms for efficiency)`);
    if (oscillation > 9) formNotes.push(`vertical oscillation ${oscillation.toFixed(1)}cm is high (energy leak, target <8.5cm)`);
    if (stride < 0.95) formNotes.push(`stride ${stride.toFixed(2)}m is short (consider cadence drills)`);
    if (formNotes.length > 0) {
      insights.push(`🏃 *Running form:* ${formNotes.join('. ')}. Work on these during easy runs, not speed sessions.`);
    } else {
      insights.push(`🏃 *Running form:* Looking efficient. GCT ${Math.round(gct)}ms, oscillation ${oscillation.toFixed(1)}cm, stride ${stride.toFixed(2)}m.`);
    }
  }

  // ── Wrist temperature
  const wristTemp = d.apple_sleeping_wrist_temperature ?? null;
  if (wristTemp != null) {
    if (wristTemp > 37) {
      insights.push(`🌡️ *Wrist temp elevated:* ${wristTemp.toFixed(1)}°C. Could indicate early illness or overtraining. Monitor how you feel today. If fatigued, dial back.`);
    }
  }

  // ── SpO2
  const spo2 = d.blood_oxygen_saturation ?? null;
  if (spo2 != null && spo2 < 95) {
    insights.push(`🫁 *SpO2 low:* ${spo2}%. Normal is 95-100%. If consistently low, worth a GP check. Can indicate sleep apnea or respiratory issues.`);
  }

  return insights;
}

// ─── Metric interpretation (plain-English cross-metric analysis) ────────────

function generateInterpretation(d, trend, recovery, training, paceTrend) {
  const notes = [];
  const sleep = d.sleep_hours ?? 0;
  const deep = d.sleep_deep ?? 0;
  const rem = d.sleep_rem ?? 0;
  const hrv = d.hrv ?? null;
  const rhr = d.resting_hr ?? null;
  const protein = d.protein_g ?? 0;
  const fiber = d.fiber_g ?? 0;
  const daylight = d.daylight_min ?? 0;

  // ── Fiber → deep sleep connection
  if (fiber > 0 && deep > 0) {
    if (fiber < 20 && deep < 0.75) {
      notes.push(`Fiber was ${fiber}g and deep sleep was ${(deep * 60).toFixed(0)}min. These track together: gut bacteria convert fiber into short-chain fatty acids that promote slow-wave sleep. Below 20g fiber consistently correlates with worse deep sleep within 24 hours.`);
    } else if (fiber >= 25 && deep >= 0.75) {
      notes.push(`Fiber at ${fiber}g and deep sleep at ${(deep * 60).toFixed(0)}min. The fiber/deep sleep connection is holding: adequate fiber intake supports the gut microbiome processes that drive slow-wave sleep.`);
    }
  }

  // ── Deep sleep → protein utilisation
  if (deep > 0 && protein > 0) {
    if (deep < 0.75 && protein >= 100) {
      notes.push(`Deep sleep was only ${(deep * 60).toFixed(0)}min but protein was ${protein}g. Growth hormone peaks during deep sleep, and without enough of it, that protein isn't being used as efficiently for muscle repair. Under 45min deep and protein utilisation drops significantly.`);
    }
  }

  // ── HRV vs RHR mismatch (stress vs overtraining signal)
  if (hrv != null && rhr != null && trend.avgHRV != null && trend.avgRHR != null) {
    const hrvDrop = trend.avgHRV - hrv;
    const rhrStable = Math.abs(rhr - trend.avgRHR) <= 3;
    if (hrvDrop > 8 && rhrStable) {
      notes.push(`HRV dropped to ${hrv}ms (avg ${trend.avgHRV}ms) but resting HR held steady at ${rhr}bpm. That mismatch usually means lifestyle stress or poor sleep, not overtraining. If RHR were also elevated, that would signal physical overreach. No need to pull back on training because of HRV alone here.`);
    } else if (hrvDrop > 8 && !rhrStable && rhr > trend.avgRHR) {
      notes.push(`Both HRV (${hrv}ms vs ${trend.avgHRV}ms avg) and RHR (${rhr}bpm vs ${trend.avgRHR}bpm avg) are moving in the wrong direction. When both shift together, that's a genuine recovery signal. Consider dialling back intensity today.`);
    }
  }

  // ── Pace trend interpretation
  if (paceTrend.length >= 3) {
    const first = paceTrend[0];
    const last = paceTrend[paceTrend.length - 1];
    const paceImprovement = Math.round(first.paceSec - last.paceSec);
    const daySpan = Math.round((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24));

    if (paceImprovement > 10 && daySpan > 0) {
      const hrFirst = first.avgHR || 0;
      const hrLast = last.avgHR || 0;
      let hrNote = '';
      if (hrFirst > 0 && hrLast > 0) {
        if (hrLast <= hrFirst + 5) {
          hrNote = ` Heart rate stayed similar (${hrFirst.toFixed(0)} → ${hrLast.toFixed(0)}bpm), meaning this is genuine aerobic improvement, not just pushing harder.`;
        } else if (hrLast > hrFirst + 10) {
          hrNote = ` Note: HR also went up (${hrFirst.toFixed(0)} → ${hrLast.toFixed(0)}bpm), so some of that speed gain is from higher effort, not pure fitness gains.`;
        }
      }
      notes.push(`Running pace improved ${paceImprovement}s/km over ${daySpan} days (${first.pace} → ${last.pace}).${hrNote} Consistent training does this without deliberate form work. Running mechanics data suggests there's still free speed on the table from form improvements.`);
    }
  }

  // ── Sleep + exercise recovery connection
  if (sleep > 0 && training.totalLoad > 0) {
    if (sleep < 6 && training.totalLoad > 120) {
      notes.push(`High training load (${training.totalLoad}) on ${sleep.toFixed(1)}h sleep. The body does most of its repair work during sleep. A big training day on short sleep means you're accumulating fatigue faster than you're clearing it. Prioritise sleep tonight over an early alarm.`);
    }
  }

  // ── Daylight → circadian → sleep quality
  if (daylight > 0 && sleep > 0) {
    if (daylight < 15 && (deep < 0.6 || sleep < 6)) {
      notes.push(`Only ${daylight}min of daylight yesterday. Morning light exposure sets your circadian clock, which directly affects sleep onset time and deep sleep quality. 15+ minutes of outdoor light before 9am is one of the simplest performance levers.`);
    }
  }

  // ── Calorie gap
  // Note: dietary_energy_kj field is mislabeled — values are actually kcal (matches Apple Health "cal" display)
  if (d.dietary_energy_kj != null && d.active_calories != null) {
    const cals = Math.round(d.dietary_energy_kj);
    const targetCal = 1854 + d.active_calories;
    const deficit = targetCal - cals;
    if (deficit > 800) {
      notes.push(`Logged ${cals} kcal against a ${targetCal} kcal target (${deficit} kcal gap). A deficit that large impairs recovery and muscle protein synthesis. If you're deliberately cutting, keep the deficit under 500 kcal to protect muscle mass.`);
    }
  }

  return notes;
}

// ─── Brief formatting ───────────────────────────────────────────────────────

async function generateBrief() {
  const dm = loadHealthData();
  const entries = dm.entries || {};
  const yday = yesterdayKey();
  const d = entries[yday] || {};

  if (Object.keys(d).length === 0) {
    // Try today's data if yesterday is empty (data might have been pushed for current day)
    const tday = todayKey();
    const td = entries[tday] || {};
    if (Object.keys(td).length === 0) {
      console.log(`[P247] No health data for ${yday} or ${tday}`);
      process.exit(0);
    }
    // Use today's data with a note
    return buildBrief(td, tday, dm, true);
  }

  // Apple Health stamps sleep by wake-up date.
  // Last night's sleep lives under today's entry, not yesterday's.
  // Merge today's sleep fields into yesterday's activity/nutrition data.
  const tday = todayKey();
  const todayData = entries[tday] || {};
  // Sleep-related fields that Apple Health stamps by wake date
  // Includes resp rate, SpO2, HRV measured during sleep
  const sleepFields = [
    'sleep_hours', 'sleep_core', 'sleep_deep', 'sleep_rem', 'sleep_awake',
    'sleep_source', 'apple_sleeping_wrist_temperature',
    'respiratory_rate', 'blood_oxygen_saturation'
  ];
  for (const field of sleepFields) {
    if (todayData[field] != null) {
      d[field] = todayData[field];
    }
  }

  return buildBrief(d, yday, dm, false);
}

function buildBrief(d, dateKey, dm, isTodayData) {
  const allStrava = loadStravaActivities();
  const yesterdayStrava = getYesterdayStrava(allStrava, dateKey);
  const training = calcTrainingLoad(yesterdayStrava);
  const trend = analyzeTrend(dm);
  const recovery = scoreRecovery(d, training.totalLoad, trend);
  const coaching = generateCoaching(d, trend, recovery, training);
  const paceTrend = getRunPaceTrend(allStrava);
  const hyrox = getHyroxPhase();
  const latestBody = loadBodyData();

  let b = `*🏋️ Health Brief — ${dateKey}*`;
  if (isTodayData) b += ` _(using today's partial data)_`;
  b += '\n\n';

  // ═══ RECOVERY & READINESS ═══
  let readiness = '✅ Train as planned';
  if (recovery.total < 60) readiness = '🟡 Moderate intensity only';
  if (recovery.total < 45) readiness = '🛑 Easy day or active recovery';

  b += `*Recovery & Readiness*\n`;
  b += `${recovery.quality} (${recovery.total}/100) → ${readiness}\n`;
  b += `Sleep ${recovery.sleepScore} | HRV ${recovery.hrvScore} | RHR ${recovery.rhrScore} | Deep ${recovery.deepScore} | Frag ${recovery.fragScore} | Load ${recovery.loadScore}\n\n`;

  // ═══ SLEEP ═══
  b += `*😴 Sleep*\n`;
  b += `Total: ${(d.sleep_hours ?? 0).toFixed(1)}h`;
  if (d.sleep_core != null) b += ` | Core: ${d.sleep_core.toFixed(1)}h`;
  if (d.sleep_deep != null) b += ` | Deep: ${(d.sleep_deep * 60).toFixed(0)}min`;
  if (d.sleep_rem != null) b += ` | REM: ${(d.sleep_rem * 60).toFixed(0)}min`;
  if (d.sleep_awake != null && d.sleep_awake > 0.1) b += ` | ⚠️ Awake: ${(d.sleep_awake * 60).toFixed(0)}min`;
  b += '\n';
  if (d.apple_sleeping_wrist_temperature != null) {
    b += `Wrist temp: ${d.apple_sleeping_wrist_temperature.toFixed(1)}°C`;
  }
  if (d.respiratory_rate != null) {
    b += ` | Resp rate: ${d.respiratory_rate}/min`;
  }
  if (d.blood_oxygen_saturation != null) {
    b += ` | SpO2: ${d.blood_oxygen_saturation}%`;
  }
  b += '\n';
  if (trend.avgSleep != null) {
    b += `7-day avg: ${trend.avgSleep}h`;
    if (trend.avgDeep != null) b += ` | Deep avg: ${(trend.avgDeep * 60).toFixed(0)}min`;
    if (trend.avgREM != null) b += ` | REM avg: ${(trend.avgREM * 60).toFixed(0)}min`;
  }
  b += '\n\n';

  // ═══ VITALS ═══
  b += `*❤️ Vitals*\n`;
  if (d.resting_hr != null) b += `Resting HR: ${d.resting_hr} bpm`;
  if (d.hrv != null) b += ` | HRV: ${d.hrv}ms`;
  if (d.cardio_recovery_bpm != null) b += ` | Cardio recovery: ${d.cardio_recovery_bpm} bpm`;
  b += '\n';
  let vitalsLine2 = '';
  if (d.vo2max != null) vitalsLine2 += `VO2 Max: ${d.vo2max} mL/min/kg`;
  if (d.heart_rate_samples) {
    const hr = d.heart_rate_samples;
    vitalsLine2 += (vitalsLine2 ? ' | ' : '') + `HR range: ${Math.round(hr.min)}-${Math.round(hr.max)} bpm (avg ${hr.avg})`;
  }
  if (vitalsLine2) b += vitalsLine2;
  b += '\n';
  if (trend.avgHRV != null || trend.avgRHR != null) {
    b += `7-day avg:`;
    if (trend.avgHRV != null) b += ` HRV ${trend.avgHRV}ms`;
    if (trend.avgRHR != null) b += ` | RHR ${trend.avgRHR} bpm`;
  }
  b += '\n\n';

  // ═══ ACTIVITY ═══
  b += `*🏃 Activity*\n`;
  if (d.step_count != null) b += `Steps: ${d.step_count.toLocaleString()}`;
  if (d.distance_km != null) b += ` | Distance: ${d.distance_km.toFixed(1)}km`;
  if (d.active_calories != null) b += ` | Active cal: ${d.active_calories}`;
  if (d.exercise_min != null) b += ` | Exercise: ${d.exercise_min}min`;
  b += '\n';
  if (d.daylight_min != null) b += `Daylight exposure: ${d.daylight_min}min`;
  if (d.walking_speed_kmh != null) b += ` | Walking speed: ${d.walking_speed_kmh} km/h`;
  b += '\n';

  // Yesterday's training from Strava
  if (training.activities.length > 0) {
    b += `\n*Training:*\n`;
    for (const act of training.activities) {
      let line = `• ${act.name} (${act.type}): ${act.durMin}min`;
      if (act.distKm > 0) line += `, ${act.distKm}km`;
      if (act.pace) line += `, ${act.pace}`;
      if (act.avgHR) line += `, avg HR ${act.avgHR}`;
      b += line + '\n';
    }
    b += `Training load: ${training.totalLoad}\n`;
  }
  b += '\n';

  // ═══ RUNNING FORM ═══
  if (d.running_speed_kmh || d.running_power_w || d.running_ground_contact_time) {
    b += `*👟 Running Mechanics*\n`;
    if (d.running_speed_kmh) b += `Speed: ${d.running_speed_kmh} km/h`;
    if (d.running_power_w) b += ` | Power: ${d.running_power_w}W`;
    b += '\n';
    if (d.running_ground_contact_time) b += `Ground contact: ${Math.round(d.running_ground_contact_time)}ms`;
    if (d.running_stride_m) b += ` | Stride: ${d.running_stride_m.toFixed(2)}m`;
    if (d.running_oscillation_cm) b += ` | Oscillation: ${d.running_oscillation_cm.toFixed(1)}cm`;
    b += '\n';

    // Pace trend
    if (paceTrend.length > 1) {
      b += `\n*Pace trend:*\n`;
      for (const r of paceTrend) {
        b += `${r.date}: ${r.pace} (${r.distKm}km, ${r.name})`;
        if (r.avgHR) b += ` HR:${r.avgHR}`;
        b += '\n';
      }
      // Direction
      const first = paceTrend[0].paceSec;
      const last = paceTrend[paceTrend.length - 1].paceSec;
      const diff = Math.round(first - last);
      if (diff > 5) {
        b += `📈 Improving: ${diff}s/km faster over ${paceTrend.length} runs\n`;
      } else if (diff < -5) {
        b += `📉 Slowing: ${Math.abs(diff)}s/km slower. Check fatigue or increase easy run volume.\n`;
      }
    }
    b += '\n';
  }

  // ═══ NUTRITION ═══
  b += `*🥗 Nutrition*\n`;
  if (d.dietary_energy_kj != null) {
    const cals = Math.round(d.dietary_energy_kj);
    b += `Calories: ${cals.toLocaleString()} kcal`;
  }
  b += '\n';
  const macros = [];
  if (d.protein_g != null) macros.push(`Protein: ${d.protein_g}g`);
  if (d.carbs_g != null) macros.push(`Carbs: ${d.carbs_g}g`);
  if (d.total_fat != null) macros.push(`Fat: ${(+d.total_fat).toFixed(0)}g`);
  if (d.fiber_g != null) macros.push(`Fiber: ${d.fiber_g}g`);
  if (macros.length > 0) b += macros.join(' | ') + '\n';
  if (d.sugar_g != null) b += `Sugar: ${d.sugar_g}g`;
  if (d.cholesterol != null && d.cholesterol > 0) b += ` | Cholesterol: ${Math.round(d.cholesterol)}mg`;
  if (d.potassium_mg != null) b += ` | Potassium: ${d.potassium_mg}mg`;
  b += '\n';

  // Nutrition targets
  // Use 7-day average active calories for a more realistic daily target
  // (yesterday could be a rest day or a huge training day — neither is typical)
  const targetProtein = 159; // 2.0g/kg * 79.6kg
  const avgActiveCal = trend.avgCal ?? d.active_calories ?? 500;
  const baseCal = 1854 + avgActiveCal;
  b += `\n*Today's targets:* ${baseCal} kcal | ${targetProtein}g protein | 25g+ fiber\n\n`;

  // ═══ BODY COMPOSITION ═══
  if (latestBody) {
    const bd = latestBody.data || {};
    b += `*📊 Body Comp (InBody ${latestBody.date})*\n`;
    const parts = [];
    if (bd.weight_kg) parts.push(`Weight: ${bd.weight_kg}kg`);
    if (bd.smm_kg) parts.push(`SMM: ${bd.smm_kg}kg`);
    if (bd.body_fat_pct) parts.push(`BF: ${bd.body_fat_pct}%`);
    if (bd.score) parts.push(`Score: ${bd.score}/100`);
    if (bd.visceral_fat) parts.push(`Visceral: ${bd.visceral_fat}/9`);
    b += parts.join(' | ') + '\n\n';
  }

  // ═══ COACHING ═══
  if (coaching.length > 0) {
    b += `*🧠 Coaching*\n`;
    for (const insight of coaching) {
      b += insight + '\n';
    }
    b += '\n';
  }

  // ═══ WHAT THIS MEANS ═══
  const interpretations = generateInterpretation(d, trend, recovery, training, paceTrend);
  if (interpretations.length > 0) {
    b += `*💡 What This Means*\n`;
    for (const note of interpretations) {
      b += note + '\n';
    }
    b += '\n';
  }

  // ═══ RACE COUNTDOWN ═══
  b += `*🏁 Race Build*\n`;
  b += `Hyrox: ${daysUntilHyrox()} days (Phase ${hyrox.phase}: ${hyrox.name})\n`;
  b += `Half-marathon: ${daysUntilHM()} days (target: sub 1:45)\n`;
  b += `Focus: ${hyrox.focus}\n\n`;

  // ═══ WEEKLY TREND ═══
  if (trend.daysWithData > 1) {
    b += `*📈 7-Day Averages* (${trend.daysWithData} days with data)\n`;
    const parts = [];
    if (trend.avgSleep != null) parts.push(`Sleep: ${trend.avgSleep}h`);
    if (trend.avgSteps != null) parts.push(`Steps: ${trend.avgSteps.toLocaleString()}`);
    if (trend.avgCal != null) parts.push(`Active cal: ${trend.avgCal}`);
    if (trend.avgProtein != null) parts.push(`Protein: ${trend.avgProtein}g`);
    if (trend.avgFiber != null) parts.push(`Fiber: ${trend.avgFiber}g`);
    b += parts.join(' | ') + '\n';
  }

  return b;
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
