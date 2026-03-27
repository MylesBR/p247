---
layout: post
title: "MET Minutes: The One Metric Your Wearable Completely Ignores"
slug: met-minutes-metric-your-wearable-ignores
date: 2026-03-28
categories: [met-minutes, physical-activity, wearables, WHO-guidelines]
description: "The WHO doesn't measure physical activity in steps or calories. They use MET minutes. Your Apple Watch, Garmin, and Whoop all have the raw data to calculate it. None of them do."
author: Myles Bruggeling
---

The World Health Organisation doesn't care about your step count.

They don't care about your calorie burn, your Whoop strain score, your Garmin Body Battery, or how many times your Apple Watch told you to stand up. When the WHO defines how much physical activity you need for health benefits, they use a metric called MET minutes. And your wearable almost certainly isn't showing it to you.

## What MET minutes actually are

MET stands for Metabolic Equivalent of Task. It measures how hard your body is working compared to sitting still.

Sitting on the couch watching Netflix is 1 MET. Walking is about 3.5 METs. Running at a moderate pace is around 9 METs. A hard cycling session can hit 10 to 12 METs.

MET minutes multiplies that intensity by how long you did it. A 45-minute strength session at 5 METs gives you 225 MET minutes. A 30-minute easy run at 8 METs gives you 240 MET minutes. The run contributed more MET minutes despite being shorter, because the intensity was higher.

This is why the WHO uses MET minutes instead of raw time. Thirty minutes of walking and thirty minutes of running are not the same thing, and it's dishonest to pretend they are.

## The WHO targets nobody talks about

The WHO physical activity guidelines, updated in 2020, recommend 500 to 1000 MET minutes per week for adults. Below 500 is classified as insufficient activity. Above 1000 is where additional health benefits start appearing: reduced cardiovascular disease risk, lower all-cause mortality, improved metabolic health.

You've probably heard the simplified version: "150 minutes of moderate activity per week." That's the 500 MET-minute target translated into plain language, because moderate activity sits around 3 to 6 METs. But the simplified version loses important nuance. A person doing 150 minutes of gentle walking and a person doing 150 minutes of tempo running are nowhere near the same activity level, even though both "meet the guidelines" under the simplified framing.

MET minutes fix that. They weight intensity alongside duration. That's why researchers use them and why public health guidelines are actually written in them.

## Your wearable has the data. It just doesn't use it.

Here's the frustrating part. Your Apple Watch calculates MET values for every workout. Open Apple Health, dig into a workout, and you'll find a MET range listed for the session. Your watch knows the intensity. It just doesn't multiply it by the duration and accumulate it across the week.

Apple Health shows you something like "Your METs ranged from 1.2 to 9.4 today." Useful for exactly nobody. What athletes actually want to know is: how many MET minutes did I accumulate this week, am I above the WHO minimum, and what's my trend looking like?

Garmin doesn't surface it either. They have Intensity Minutes, which is adjacent but not the same thing. Intensity Minutes counts time above a heart rate threshold. It doesn't weight by actual metabolic cost. Twenty minutes at 75% max HR counts the same regardless of whether you were cycling (low eccentric stress, moderate metabolic cost) or running (high eccentric stress, high metabolic cost). MET values capture that difference because they're tied to the actual activity type and energy expenditure, not just heart rate.

Whoop has strain, which is their own proprietary score based on cardiovascular load. It's useful within the Whoop ecosystem but it doesn't map to any external health framework. You can't compare your Whoop strain to WHO guidelines or to research studies, because nobody outside of Whoop uses that scale.

## Why this matters for serious athletes

If you're reading this blog, you're probably already exceeding the WHO minimum. Most people who train consistently are well above 500 MET minutes per week. So why care?

Three reasons.

**First, the breakdown matters more than the total.** Knowing you hit 1,200 MET minutes is fine. Knowing that 900 of those came from running and only 300 from strength tells you something important about your training balance. For hybrid athletes training for events like Hyrox, that imbalance has real consequences. You're building cardiovascular capacity while potentially underdosing the stimulus that preserves muscle under high running volume.

**Second, trends reveal what snapshots hide.** Your MET minutes dropping from 1,100 to 800 to 650 over three weeks might not feel like much week to week. But plotted on a chart, it's a clear detraining signal. Maybe you got busy. Maybe you're unconsciously pulling back because something hurts. Either way, the trend catches it before a performance test does.

**Third, it's the only intensity-weighted activity metric that maps to health outcomes research.** When a study says "adults who accumulated more than 1,000 MET minutes per week had a 31% lower risk of all-cause mortality," you can actually check whether you're in that group. You can't do that with Whoop strain or Garmin Intensity Minutes, because those metrics don't appear in epidemiological research.

## The calorie problem

MET minutes also quietly solves the calorie accuracy problem that drives athletes crazy.

An Apple Watch might tell you that your hour of strength training burned 450 calories. That number feels wrong because it probably is wrong. Wrist-based calorie estimation for strength training is notoriously inaccurate. The watch uses heart rate and movement patterns optimised for cardiovascular activity. Lifting heavy with long rest periods confuses it.

MET minutes sidesteps this entirely. Instead of claiming to know exactly how many calories you burned, it tells you how hard your body was working relative to rest, scaled by time. It's a less precise claim, but a more honest one. And for the purpose of tracking activity levels against health guidelines, honesty matters more than false precision.

## What a proper MET minutes view would look like

Imagine opening your fitness app and seeing this:

A weekly total: 1,245 MET minutes. A progress ring showing you at 249% of the WHO target. A breakdown by activity type: 450 from strength, 540 from running, 255 from cycling. A four-week trend showing whether you're accumulating consistently or falling off.

Below that, context: "WHO recommends 500 to 1000 MET minutes per week. You're averaging 1,048 over the last month. Your strength contribution has increased 15% since you added a third session."

No fake calorie numbers. No proprietary strain scores. Just a scientifically grounded measure of how much physical work you're doing, weighted by intensity, tracked over time, compared against research-backed guidelines.

That's the kind of metric that helps you make decisions. Not "your recovery is green" without telling you why. Not "you burned 2,340 calories today" with a confidence interval wider than your garage. A number tied to real health outcomes, calculated from data your watch already records but doesn't bother to aggregate.

## The gap nobody's filling

The Compendium of Physical Activities, maintained by Arizona State University, has published standardised MET values for hundreds of activities since 1993. The WHO has used MET minutes in their guidelines since 2010. The research base for this metric spans decades.

And yet, in 2026, with millions of people wearing devices that record workout type, duration, and energy expenditure to their wrist every single day, not a single major consumer app surfaces accumulated MET minutes against WHO guidelines.

Apple could do it. Garmin could do it. Whoop could do it. None of them have, probably because it's not a metric that drives hardware upgrades or subscription renewals. Steps are simpler. Calories sound more actionable. Proprietary scores create ecosystem lock-in.

MET minutes are just useful. And maybe that's not enough to sell watches, but it's exactly enough to help athletes make better decisions about their training.

---

*P247 is building the decision layer between your wearable and your next training session. MET minutes is one of the metrics we track. If you want your watch data to actually mean something, [join the early access list](https://p247.io/early-access).*
