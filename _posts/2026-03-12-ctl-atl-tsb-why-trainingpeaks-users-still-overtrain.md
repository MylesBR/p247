---
layout: post
title: "CTL, ATL, TSB: Why TrainingPeaks Users Still Overtrain"
slug: ctl-atl-tsb-why-trainingpeaks-users-still-overtrain
date: 2026-03-12
categories: [trainingpeaks, overtraining, CTL, ATL, TSB, training-load, performance]
description: "TrainingPeaks gives you the most sophisticated training load model available. Athletes using it still overtrain. Here's the gap."
author: Myles Bruggeling
---

TrainingPeaks users love their numbers. Chronic Training Load. Acute Training Load. Training Stress Balance. The Performance Management Chart with its neat coloured lines and mathematically precise curves.

If you are deep in the TrainingPeaks ecosystem, you probably know your CTL to the decimal point. You know what happens when your TSB dips below minus 20. You have opinions about optimal ramp rates and you have read everything Joe Friel has written about periodisation.

And yet. Athletes who track CTL/ATL/TSB religiously still overtrain. They still get injured. They still have blocks where performance flatlines despite following the model perfectly.

Why? Because the model is brilliant at what it measures and completely blind to what it does not.

## What CTL, ATL, and TSB actually are

Quick primer for anyone who hasn't spent three years in TrainingPeaks forums.

**CTL (Chronic Training Load)** is a rolling 42-day exponentially weighted average of your daily Training Stress Score (TSS). Think of it as your "fitness" number. It rises slowly as you train consistently and drops slowly when you rest. CTL is the long game.

**ATL (Acute Training Load)** is the same calculation but over 7 days. It represents recent fatigue. Hammer a big training week and ATL spikes. Take a deload week and it drops.

**TSB (Training Stress Balance)** is simply CTL minus ATL. When TSB is negative, your recent fatigue exceeds your fitness. You are "in the hole." When TSB is positive, you have absorbed your recent training and are theoretically fresh. Race day targets typically aim for TSB between plus 10 and plus 25.

The Performance Management Chart (PMC) plots all three on a single timeline. It is, without question, the most sophisticated consumer-facing training load model available. Coaches and athletes have used it successfully for over a decade.

So what is the problem?

## Problem one: TSS only measures what you tell it

The entire model sits on top of TSS, which is a function of intensity and duration relative to your threshold. For cycling, this is calculated precisely from power data. For running with a power meter, it is similarly clean. For everything else, it is estimated, approximated, or guessed.

A Hyrox athlete who does sled pushes, wall balls, burpee broad jumps, rowing, and SkiErg in the same week has training stress spread across modalities that TSS was never designed to capture. You can assign hrTSS (heart rate based) to these sessions, but hrTSS is a blunt instrument that does not distinguish between 45 minutes of rowing and 45 minutes of heavy sled work. The cardiovascular cost might be similar. The muscular cost is wildly different.

Swim TSS, run TSS, bike TSS, strength TSS: they all get lumped into a single CTL number. But 50 TSS from a tempo run does not create the same recovery demand as 50 TSS from heavy deadlifts. The model treats them as identical. Your body does not.

## Problem two: CTL does not know about your life

Here is a scenario that will be familiar to anyone with a job and a family.

You have been building CTL steadily for eight weeks. Clean ramp rate, roughly 5 to 7 TSS per week increase. Your PMC looks beautiful. Then work explodes. You are sleeping six hours instead of seven and a half. You are eating lunch at your desk. Your stress is through the roof.

Your training does not change. Same sessions, same intensity, same TSS. Your CTL continues its upward march. Your ATL stays stable. Your TSB looks normal.

But you are falling apart.

The model cannot see that your recovery capacity has been halved by life stress. It assumes that the relationship between training load and adaptation is constant. It is not. A 2019 paper by Impellizzeri et al. in the *International Journal of Sports Physiology and Performance* made this point directly: internal training load (how the body actually responds to training) and external training load (what you did on paper) can diverge significantly based on individual recovery capacity, psychological state, and life context.

CTL measures external load. It has no input for internal load. So it tells you your fitness is building while your body is actually accumulating a deficit it cannot absorb.

## Problem three: the ramp rate fallacy

The standard advice is to increase CTL by no more than 5 to 7 points per week. Stay within that band and you are "safe." Exceed it and you risk overtraining or injury.

This rule of thumb has value. It prevents the most egregious loading errors. But it creates a false sense of security for athletes who follow it precisely.

The issue is that ramp rate limits do not account for training monotony. Foster (1998) demonstrated that training monotony (mean daily load divided by standard deviation of daily load) is a strong independent predictor of illness and injury. Two athletes can have identical CTL ramp rates with completely different monotony scores.

Athlete A trains six days a week, alternating hard and easy days. Daily TSS varies from 40 to 120. Low monotony.

Athlete B trains six days a week at a steady 80 TSS every day. Same weekly total. Same ramp rate. High monotony.

The PMC looks identical for both. But Athlete B is at significantly higher risk of illness and psychological staleness, and the model gives no warning.

## Problem four: the deload trap

TSB is supposed to tell you when you are fresh. Positive TSB means you have absorbed your training. Time to race or push.

But TSB is a simple subtraction. CTL 80 minus ATL 70 equals TSB plus 10. That looks like a moderately fresh athlete.

What TSB does not tell you is the composition of that number. Were those 80 CTL points built from well-varied training with adequate recovery between hard sessions? Or were they ground out through six weeks of monotonous loading with accumulating sleep debt?

The same TSB of plus 10 can describe an athlete who is genuinely primed to perform and an athlete who is one hard session away from a breakdown. The number is the same. The underlying physiological state is completely different.

This is why experienced coaches do not rely on TSB alone for race readiness. They look at HRV trends, subjective wellness, performance test results, and athlete mood. They use the PMC as one input among many.

But most self-coached athletes do not have that framework. They look at TSB, see a positive number, and assume they are ready. The model encourages this. It presents TSB as THE readiness metric. The chart even colour codes it: green when positive, red when negative. Green means go.

Except when it does not.

## Problem five: no recovery model

This is the fundamental limitation, and it is structural. The PMC does not model recovery. It models load and the mathematical decay of load over time.

CTL does not drop because you recovered. It drops because time passed. The 42-day exponential decay is a mathematical function, not a biological one. It assumes that recovery happens at a constant rate for all athletes under all conditions. A 25-year-old sleeping nine hours recovers at the same rate as a 48-year-old sleeping six. The math does not know the difference.

Real recovery depends on sleep quality, nutrition, hydration, stress, age, training history, and the type of training performed. Two athletes with identical CTL trajectories can have completely different actual fitness levels based solely on how well they recover between sessions.

The PMC shows you the load you applied. It does not show you how much of that load your body actually absorbed. The gap between those two numbers is where overtraining lives.

## What fills the gap

The answer is not abandoning CTL/ATL/TSB. The model is genuinely useful. Tracking training load over time, managing ramp rates, and timing deloads around target events are real skills that produce real results.

The answer is adding the dimensions the model lacks.

**Sleep architecture, not just duration.** How fragmented was your sleep this week? Did your deep sleep percentage drop? Are you accumulating a deficit the PMC cannot see?

**HRV trend, not just today's number.** A 14-day HRV trend overlaid on your CTL ramp tells a story that neither metric tells alone. If CTL is rising and HRV is slowly falling, you are loading faster than you are absorbing.

**RPE drift.** If the same session at the same TSS feels progressively harder week over week, your internal load is diverging from your external load. This is one of the earliest and most reliable overreaching signals, and the PMC does not track it.

**Training variability.** Monotony and strain calculations on top of TSS data would catch what ramp rate alone misses. These are simple calculations. TrainingPeaks could implement them. They have not.

**Nutrition and hydration.** If you are running a caloric deficit during a CTL ramp, you are compounding training stress with metabolic stress. The PMC has no input for this.

The picture you need is not a better PMC. It is the PMC plus everything it cannot see, synthesised into a readiness assessment that accounts for the whole athlete, not just the load applied.

## The synthesis problem

The irony is that most serious athletes already generate all this data. Garmin or Whoop gives you HRV and sleep. TrainingPeaks gives you CTL/ATL/TSB. MyFitnessPal or a similar app gives you nutrition. You probably even have RPE logged somewhere.

The data exists. It just lives in five different apps that never talk to each other. And manually cross-referencing your PMC with your HRV trend with your sleep scores with your nutrition log is the kind of thing you do once, get useful insight from, and never do again because it takes 45 minutes.

This is the exact problem [P247](https://p247.io) is being built to solve. Not to replace TrainingPeaks. Not to recalculate your CTL. To sit across all your data sources and add the context that the PMC cannot capture on its own.

When your CTL ramp rate is clean but your HRV trend is drifting down and your sleep quality has been below baseline for nine days, you need something that connects those dots and says: "Your PMC looks fine, but the combination of your recovery signals suggests you should deload this week, not next week."

That is not a dashboard. That is an analyst. And it is the layer that is missing between the data you generate and the decisions you make.

Your PMC is not wrong. It is just not enough. And the gap between what it tells you and what your body is actually doing is where performance gets left on the table, or worse, where injuries start.

If you are tired of being the one who has to synthesise five apps in your head, [check out P247](https://p247.io).

---

**References:**

- Foster, C. (1998). Monitoring training in athletes with reference to overtraining syndrome. *Medicine & Science in Sports & Exercise*, 30(7), 1164-1168.
- Impellizzeri, F. M., Marcora, S. M., & Coutts, A. J. (2019). Internal and External Training Load: 15 Years On. *International Journal of Sports Physiology and Performance*, 14(2), 270-273.
- Coggan, A. (2003). Training and Racing Using a Power Meter: An Introduction. *TrainingPeaks/Peaksware*.
