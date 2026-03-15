---
layout: post
title: "CTL, ATL, TSB: Why TrainingPeaks Users Still Overtrain"
slug: ctl-atl-tsb-trainingpeaks-overtrain
date: 2026-03-20
categories: [trainingpeaks, training-load, overtraining, endurance, performance]
description: "You can have perfect zones, a textbook TSS ramp, and a coach reviewing your plan. And you can still blow up. Here's what the Performance Management Chart misses."
author: Myles Bruggeling
---

You can have perfect power zones. A textbook TSS ramp rate of five to seven per week. A coach reviewing your plan. A negative TSB that's exactly where it should be before your taper. And you can still blow up.

It happens all the time. The athlete who does everything right according to the Performance Management Chart, follows the model, trusts the numbers, and still ends up overtrained, injured, or burned out three weeks before their A race.

The model isn't broken. But it's incomplete in ways that matter enormously, and the athletes who trust it most are often the ones it fails hardest.

## A quick primer (for anyone who doesn't live in TrainingPeaks)

CTL, ATL, and TSB are the three pillars of the Performance Management Chart. If you've used TrainingPeaks, WKO5, or Golden Cheetah, you've seen this.

**CTL (Chronic Training Load)** is your fitness. It's an exponentially weighted average of your daily Training Stress Score over the last 42 days. Think of it as how much work your body has adapted to over the past six weeks.

**ATL (Acute Training Load)** is your fatigue. Same calculation but over 7 days. It's how much you've done recently.

**TSB (Training Stress Balance)** is the difference. CTL minus ATL. When TSB is negative, you're carrying fatigue. When it's positive, you're fresh. When it's around zero, you're theoretically in the sweet spot for peak performance.

The model was developed from heart rate and power data in the cycling world, and it works. Thousands of athletes have used it to peak for events, manage training blocks, and avoid the most obvious overtraining pitfalls.

So why do smart, data-literate athletes who run their lives through this model still get wrecked?

## The model only sees training stress

This is the fundamental limitation, and it's so obvious that it gets overlooked.

TSS (Training Stress Score) is calculated from your power output, heart rate, or pace relative to your threshold. It measures one thing: how hard and how long you trained. Every number in the Performance Management Chart derives from that single input.

CTL doesn't know you slept four hours last night. ATL doesn't know you're going through a divorce. TSB doesn't know you skipped two meals because work was insane. The model has exactly one input channel. Training load goes in. Everything else is invisible.

For an athlete whose life is stable, sleep is consistent, nutrition is dialled in, and stress is manageable, this works fine. Training load is the dominant variable, and the PMC captures it well.

For everyone else, it's a map with half the territory missing.

## The non-training load problem

Your body doesn't distinguish between types of stress when it decides how to allocate recovery resources. A cortisol spike from a hard interval session and a cortisol spike from a 3am work email hit the same physiological systems. Your HPA axis doesn't check whether the stressor came from your bike or your boss.

This means an athlete can be at a TSB of negative five (mildly fatigued, should be fine for training) while simultaneously carrying significant stress from poor sleep for three consecutive nights, caloric deficit from skipped meals during a busy week, a family crisis that's been running for two weeks, or an illness they're fighting off but haven't fully acknowledged.

Each of these eats into recovery capacity. None of them show up in the PMC. The model says you're at negative five. Your actual recovery debt is much deeper. You train according to the plan, the plan says you can handle it, and your body disagrees.

## How this plays out in real training blocks

The classic failure pattern looks like this. An athlete is twelve weeks out from an Ironman or a cycling grand fondo. They've built CTL steadily from 65 to 95. TSS ramp rate is clean. The PMC looks textbook.

Around week eight, life gets hard. Work deadline. Kid gets sick. Sleep drops from seven hours to five for a week. They keep training because the plan says this is build week three and the numbers support it. TSB is negative eight, which is manageable according to every coaching resource they've read.

Week nine they start feeling flat. Power numbers are slightly down. They push through because the taper is coming and they just need to hold on. Week ten the wheels come off. Performance craters. Motivation evaporates. They either get sick, get injured, or DNF.

In the post-mortem, nothing in TrainingPeaks explains what happened. The ramp was sensible. The TSB was within range. The failure came from accumulated non-training stress that the model couldn't see and the athlete didn't account for.

If you've spent time in r/triathlon or r/cycling, you've read this story a dozen times. The details change. The pattern doesn't.

## Zone calibration doesn't fix this

There's a related thread worth addressing. Some athletes, correctly, identify that inaccurate zones lead to bad TSS calculations, which corrupt the entire PMC. They're right. If your FTP is set 10 watts too high, every ride generates less TSS than it should, and your CTL understates your actual training load.

But even with perfect zones, perfectly calibrated FTP, and a power meter reading to within 1% accuracy, you still have a model that only tracks one dimension of stress. Getting the input right is important. But it doesn't solve the fundamental architecture problem.

You can have the most accurate map in the world. If the map only shows roads and you're navigating a city with rivers, cliffs, and construction zones, accuracy doesn't save you.

## What HRV adds (and what it still misses)

Some athletes layer HRV tracking on top of the PMC. This is better. Morning HRV captures autonomic nervous system state, which reflects total stress load from all sources. If your HRV is trending down while your TSB says you should be fine, that's a meaningful signal.

But HRV tracking and the PMC still live in separate systems. TrainingPeaks doesn't natively ingest your Whoop HRV data. Your Garmin doesn't know your CTL. You're left to manually correlate two dashboards and figure out what the combination means.

In practice, most athletes default to the PMC because it's more structured and gives clearer action signals. HRV becomes the thing they check in the morning and then ignore when it conflicts with the training plan. "My HRV is down but I'm supposed to do threshold intervals today and the plan says I can handle it." The plan wins. The body loses.

## The synthesis problem

This is the pattern that keeps showing up across every data tool in endurance sport. Each platform does one thing well. TrainingPeaks tracks training load beautifully. Whoop tracks recovery. Garmin tracks activity and sleep. Cronometer tracks nutrition. None of them talk to each other.

The athlete becomes the integration layer. They're supposed to look at four dashboards, correlate the signals, weigh the conflicts, and make a training decision every morning. The ones who do this well are usually coaches or experienced athletes with a decade of pattern recognition behind them. Everyone else trusts whichever single metric feels most authoritative and hopes it's enough.

It isn't always enough.

## What would actually help

A system that contextualises training load with recovery data. One that takes your CTL and ATL seriously but also factors in last night's sleep quality, your HRV trend over the past seven days, whether your nutrition has been adequate this week, and whether your subjective fatigue aligns with what the numbers predict.

Not replacing the PMC. It's a powerful model. But wrapping it in the context it needs to be genuinely useful for athletes whose lives aren't perfectly controlled laboratory conditions. Which is every athlete.

That's what P247 is building. Training load deserves context from recovery and lifestyle data. The PMC tells you what happened on the bike. The missing piece is everything that happened off it.
