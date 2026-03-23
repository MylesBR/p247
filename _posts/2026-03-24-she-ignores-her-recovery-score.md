---
layout: post
title: "She Ignores Her Recovery Score. Here's What She Looks At Instead."
slug: she-ignores-recovery-score
date: 2026-03-24
categories: [recovery, female-athletes, hrv, whoop, training]
description: "A female athlete built her own multi-signal recovery system because standard recovery algorithms can't handle menstrual cycle variability. Here's how contextualised baselines beat a single recovery score."
author: Myles Bruggeling
---

She's been training for six years. Competed in three half-Ironmans. Lifts four days a week. Runs three. She owns a Whoop, a Garmin, and an Oura ring. And every morning, she ignores her recovery score.

Not because she doesn't believe in data. Because she's learned that the data as presented doesn't account for the single biggest variable in her physiology: her menstrual cycle.

Her system is better than the one on her wrist. And what she does manually every morning is exactly what the next generation of athlete tools should automate.

## The problem with one-size-fits-all recovery

Recovery algorithms are built on population averages. They use overnight HRV, resting heart rate, sleep duration, and respiratory rate to estimate how ready you are to train. For most male athletes with stable hormonal profiles, this works reasonably well. The model matches the biology closely enough to be useful.

For female athletes, there's a massive confounding variable that none of these algorithms handle well: cyclical hormonal fluctuation.

Progesterone rises in the luteal phase (roughly days 15 to 28 of a typical cycle). When it does, resting heart rate increases by 2 to 8 bpm. HRV drops. Body temperature rises by 0.3 to 0.5°C. Respiratory rate increases slightly.

Every one of these changes triggers the same response in a recovery algorithm: lower recovery score. The app sees higher heart rate, lower HRV, and elevated temperature. It says you're fatigued. Red or yellow. Scale back.

But you're not fatigued. You're in the second half of your cycle. Your body is doing exactly what it should be doing. The metrics shifted because of hormones, not because of overtraining.

## What she built instead

The athlete from the Reddit thread (and she's far from the only one) stopped trusting the single recovery number and started building her own daily assessment from multiple signals. Her morning routine takes about three minutes and looks like this:

**Step one: Check the cycle day.** She uses a period tracking app to know where she is in her cycle. This is the master context for everything else. Follicular phase (days 1 to 14) means her baseline metrics are lower and more stable. Luteal phase means they'll be elevated. She adjusts her expectations for every other metric accordingly.

**Step two: Compare HRV to phase-specific baseline.** Not her overall 30-day average. Her luteal-phase average and her follicular-phase average, tracked separately in a spreadsheet. A luteal HRV of 42 might be right on her phase baseline even though her overall average is 55. The recovery app would flag that as suppressed. She knows it's normal.

**Step three: Rate subjective fatigue.** A simple 1 to 5 scale. How do her legs feel? How's her motivation? Is the thought of training energising or exhausting? She's learned that RPE-based self-assessment during the luteal phase is actually more reliable than HRV for predicting workout quality.

**Step four: Check training load context.** What did she do yesterday? What's planned for tomorrow? If she's mid-build and yesterday was heavy, she factors that in regardless of what the morning metrics say.

**Step five: Make the call.** Not from a single number. From the convergence of four signals: cycle phase, phase-adjusted HRV, subjective feel, and training context.

She said it takes her about 90 seconds now that she has the routine down. The recovery app takes less time but gives her worse information.

## Why this matters beyond female athletes

The menstrual cycle is the most obvious example of a cyclical variable that recovery algorithms miss. But it's not the only one.

Male athletes have hormonal fluctuations too. Testosterone follows diurnal patterns and is affected by stress, sleep quality, and training load. Cortisol has its own rhythm. Even seasonal light exposure shifts baseline metrics in ways that a static algorithm doesn't accommodate.

The real insight from this athlete's system isn't about menstrual cycles specifically. It's about contextualised baselines. She realised that a single baseline doesn't capture her physiology, so she created multiple baselines and switches between them based on context.

That's a fundamentally different approach than what any consumer wearable offers today. And it works better.

## The manual tax

The problem is obvious. She's doing this manually. Every morning. In a spreadsheet. Cross-referencing three apps with a period tracker and her own subjective assessment.

She has the skill and the discipline to maintain this system. Most athletes don't. Most athletes check one app, see one number, and make a binary decision: train hard or scale back.

And for about two weeks of every month, female athletes using standard recovery scores are getting systematically bad advice. The app tells them to rest when their bodies are fine. Or worse, during the follicular phase when they're actually primed for peak performance, the score shows green and they don't push hard enough because the last two weeks of yellow scores have conditioned them to doubt their capacity.

The cost isn't just one bad workout. It's a training philosophy that slowly erodes confidence in the data and in themselves.

## What automation should look like

Everything this athlete does manually could be automated. The data already exists.

Cycle tracking apps already log phase data. Wearables already capture HRV, resting heart rate, temperature, and sleep. Training platforms already know yesterday's load. The subjective RPE check is the only piece that requires active input.

The missing layer is synthesis. A system that ingests cycle phase as a contextual variable, adjusts baselines automatically, compares today's metrics against the right baseline for the right phase, factors in training context, and produces a recovery recommendation that actually reflects the athlete's biology.

Not a pink version of the same algorithm. A genuinely different model that treats hormonal context as a first-class input rather than noise to average away.

## The broader pattern

This story keeps showing up across P247's research. Athletes who've moved past single-device recovery scores and built their own multi-signal systems. They're doing the synthesis manually because no platform does it for them.

A triathlete who correlates Garmin training load with Whoop recovery and Cronometer nutrition logs in a Google Sheet. A masters cyclist who adjusts his TSB targets based on his Oura sleep score trend. A CrossFit competitor who ignores her Whoop recovery entirely on days when her period tracker says she's in her luteal phase.

They're all solving the same problem. The data exists across multiple platforms. The synthesis doesn't. The athlete fills the gap with pattern recognition and spreadsheets.

That's the gap P247 is closing. Not building a new wearable. Not replacing what's already on your wrist. Sitting across all of it and doing the synthesis that these athletes have proven is necessary, automatically, every morning, without the spreadsheet.
