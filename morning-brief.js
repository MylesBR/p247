#!/usr/bin/env node
/**
 * P247 Morning Brief — Performance Analysis Cron
 * Runs 5:45am Sydney time daily
 * Reads overnight health data, generates coaching brief, sends to Slack
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// ─── Load health data ───────────────────────────────────────────────────────

function loadHealthData() {
  const dmFile = path.join(BASE_DIR, 'health', 'daily-metrics.json');
  if (!fs.existsSync(dmFile)) return { entries: {} };
  return JSON.parse(fs.readFileSync(dmFile, 'utf8'));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in Sydney tz
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

// ─── Calculate composite scores ─────────────────────────────────────────────

function analyzeLastNight(yesterdayData) {
  const sleep = yesterdayData?.sleep_hours ?? 0;
  const hrv = yesterdayData?.hrv ?? null;
  const rhr = yesterdayData?.resting_hr ?? null;

  const sleepScore = Math.min(100, (sleep / 7.5) * 100); // 7.5h = 100
  const hrvNorm = hrv ? Math.min(100, (hrv / 60) * 100) : 0; // 60ms = excellent
  const rhrNorm = rhr ? Math.max(0, 100 - (rhr - 40) * 2) : 0; // baseline 40, penalize higher

  const recoveryScore = Math.round((sleepScore * 0.5 + hrvNorm * 0.3 + rhrNorm * 0.2));

  return {
    sleep,
    hrv,
    rhr,
    sleepScore: Math.round(sleepScore),
    hrvNorm: Math.round(hrvNorm),
    rhrNorm: Math.round(rhrNorm),
    recoveryScore,
    quality:
      recoveryScore >= 75 ? '🟢 Excellent' :
      recoveryScore >= 60 ? '🟡 Moderate' :
      '🔴 Poor',
  };
}

function analyzeWeekTrend(dm, entries) {
  const last7 = getLast7Days();
  const data = last7.map(d => entries[d] ?? {});

  const avgSleep = data.reduce((s, e) => s + (e.sleep_hours ?? 0), 0) / 7;
  const avgHRV = data.filter(e => e.hrv).length > 0
    ? data.filter(e => e.hrv).reduce((s, e) => s + e.hrv, 0) / data.filter(e => e.hrv).length
    : null;
  const avgRHR = data.filter(e => e.resting_hr).length > 0
    ? data.filter(e => e.resting_hr).reduce((s, e) => s + e.resting_hr, 0) / data.filter(e => e.resting_hr).length
    : null;
  const avgSteps = data.reduce((s, e) => s + (e.step_count ?? 0), 0) / 7;
  const avgCal = data.reduce((s, e) => s + (e.active_calories ?? 0), 0) / 7;

  // Trend detection (last 3 days vs days 4-7)
  const recent3 = data.slice(4);
  const prev4 = data.slice(0, 4);

  const sleepTrend = recent3.reduce((s, e) => s + (e.sleep_hours ?? 0), 0) / 3 - 
                     prev4.reduce((s, e) => s + (e.sleep_hours ?? 0), 0) / 4;

  return {
    avgSleep: parseFloat(avgSleep.toFixed(1)),
    avgHRV: avgHRV ? Math.round(avgHRV) : null,
    avgRHR: avgRHR ? Math.round(avgRHR) : null,
    avgSteps: Math.round(avgSteps),
    avgCal: Math.round(avgCal),
    sleepTrend: sleepTrend > 0.2 ? '📈 improving' : sleepTrend < -0.2 ? '📉 declining' : '➡️ flat',
  };
}

// ─── Generate coaching insight ──────────────────────────────────────────────

function generateInsight(recovery, trend, yesterday) {
  const insights = [];

  // Sleep deficit
  if (yesterday.sleep < 6) {
    insights.push({
      priority: 1,
      emoji: '😴',
      text: `Sleep ${yesterday.sleep.toFixed(1)}h (need 7+). This is affecting recovery. If strength work is heavy today, scale back 10-15%.`,
    });
  }

  // Chronic sleep debt
  if (trend.avgSleep < 5.5) {
    insights.push({
      priority: 1,
      emoji: '⚠️',
      text: `Sleep averaging ${trend.avgSleep}h this week — below your minimum. This is your blocker. Nothing improves until sleep improves.`,
    });
  }

  // HRV trend
  if (yesterday.hrv && recovery.hrvNorm < 50) {
    insights.push({
      priority: 2,
      emoji: '💓',
      text: `HRV ${yesterday.hrv}ms is lower than your baseline. Combined with ${yesterday.sleep.toFixed(1)}h sleep, your ANS isn't recovering. Easy session recommended.`,
    });
  }

  // Positive note
  if (yesterday.rhr && yesterday.rhr <= 51) {
    insights.push({
      priority: 3,
      emoji: '✅',
      text: `Resting HR at ${yesterday.rhr} — solid. Your fitness is holding. Focus today on recovery support, not pushing harder.`,
    });
  }

  // High steps but low sleep = imbalance
  if (yesterday.sleep < 5 && yesterday.step_count > 8000) {
    insights.push({
      priority: 2,
      emoji: '⚖️',
      text: `High activity (${yesterday.step_count} steps) but under 5h sleep is a net negative. Rest > extra steps today.`,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority)[0];
}

// ─── Format brief ──────────────────────────────────────────────────────────

function formatBrief(recovery, trend, insight, yesterday) {
  const today = getTodayKey();
  const trainingRecommendation = 
    recovery.recoveryScore >= 75 ? '✅ Train as planned' :
    recovery.recoveryScore >= 60 ? '⚠️ Train but moderate intensity' :
    '🛑 Easy day or skip strength';

  return `
*P247 Morning Brief — ${today}*

*Recovery Score:* ${recovery.quality} (${recovery.recoveryScore}/100)
• Sleep: ${recovery.sleep.toFixed(1)}h (${recovery.sleepScore}/100)
• HRV: ${recovery.hrv ? recovery.hrv + 'ms (' + recovery.hrvNorm + '/100)' : 'no data'}
• Resting HR: ${recovery.rhr ? recovery.rhr + 'bpm (' + recovery.rhrNorm + '/100)' : 'no data'}

*Training Readiness:* ${trainingRecommendation}

*This Week's Trend:*
• Sleep: ${trend.avgSleep}h avg (${trend.sleepTrend})
• Steps: ${trend.avgSteps}/day
• Output: ${trend.avgCal} kcal/day

*One Thing Today:*
${insight.emoji} ${insight.text}

_Questions? See the full dashboard: http://192.168.100.143:3000/health_
  `.trim();
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function run() {
  try {
    const dm = loadHealthData();
    const entries = dm.entries || {};
    const yesterdayKey = getYesterdayKey();
    const yesterday = entries[yesterdayKey] || {};

    if (Object.keys(yesterday).length === 0) {
      console.log('[P247] No data for yesterday yet');
      process.exit(0);
    }

    const recovery = analyzeLastNight(yesterday);
    const trend = analyzeWeekTrend(dm, entries);
    const insight = generateInsight(recovery, trend, yesterday);
    const brief = formatBrief(recovery, trend, insight, yesterday);

    console.log(brief);
    console.log('\n[P247] Brief generated');

    // Send to Slack (if webhook configured)
    const webhookUrl = process.env.SLACK_WEBHOOK_P247;
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: brief,
          mrkdwn: true,
        }),
      });

      if (response.ok) {
        console.log('[P247] Slack message sent');
      } else {
        console.error('[P247] Slack send failed:', response.status);
      }
    } else {
      console.log('[P247] No Slack webhook configured (SLACK_WEBHOOK_P247)');
    }
  } catch (err) {
    console.error('[P247] Error:', err.message);
    process.exit(1);
  }
}

run();
