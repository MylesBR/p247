---
layout: post
title: "Five Devices, One Body, No Answers"
slug: five-devices-one-body-no-answers
date: 2026-03-14
categories: [wearables, recovery, multi-device, garmin, whoop, oura]
description: "You bought more devices hoping for clarity. Instead you got five opinions and zero consensus. Here's why stacking wearables makes the problem worse."
author: Myles Bruggeling
---

You started with a Garmin. Then you added a Whoop because someone in your training group swore by it. Then an Oura ring because you read that it does sleep better than both of them combined. Maybe a Polar chest strap for more accurate heart rate during sessions. Maybe an Amazfit on the nightstand as a backup.

Now you have five devices tracking the same body and none of them agree.

Garmin says your Body Battery is 74 and you are ready for a moderate session. Whoop says recovery is 42% and you should take it easy. Oura says your readiness is 81 and your HRV trend is stable. You feel somewhere between all of them.

Which number do you trust? The honest answer for most multi-device athletes is: none of them.

## Why the scores disagree

The first thing to understand is that these devices are not measuring the same thing and calling it by different names. They are measuring different things, weighting them differently, and presenting the result as if it is the same concept.

Garmin Body Battery runs on Firstbeat Analytics. It combines HRV, stress data, sleep quality, and activity throughout the day into a single energy score. The metaphor is a battery: you drain it with activity and stress, you recharge it with rest and sleep. It is responsive and updates throughout the day.

Whoop recovery is calculated once per morning based on overnight data. It uses HRV (specifically RMSSD during slow wave sleep), resting heart rate, respiratory rate, and sleep performance. It weights HRV heavily and uses a rolling baseline that adjusts to your personal trends over time.

Oura readiness pulls from overnight HRV, body temperature deviation, resting heart rate, sleep quality, and recent activity balance. It adds temperature as a signal that neither Garmin nor Whoop use in their primary score. The temperature trend can flag illness or hormonal shifts days before HRV moves.

These are fundamentally different approaches to the same question. Of course they produce different answers.

A 2023 study by Miller et al. in the *Journal of Sports Sciences* compared recovery metrics across consumer wearables worn simultaneously and found only moderate correlation between devices. The correlation was highest for resting heart rate (which is a straightforward measurement) and lowest for composite recovery scores (which are proprietary interpretations). The study concluded that athletes should not treat scores from different devices as interchangeable.

## The rolling baseline problem

Whoop uses a rolling baseline that recalculates your "normal" based on recent weeks. If your HRV gradually improves over a training block, Whoop adjusts upward. Your new normal becomes the baseline. The same absolute HRV that got you green three weeks ago now gets you yellow because the algorithm expects more from you.

This makes sense in theory. It personalises the score to your current state rather than comparing you to a population average. But it creates a strange paradox: getting fitter can make your recovery score worse.

One Whoop user described it clearly: "Same numbers it said green two weeks earlier now called yellow." They had built their own mental baseline and started ignoring Whoop's session recommendations entirely. They were doing the analytical work the device was supposed to do for them.

Garmin does not use the same rolling recalibration. Its Body Battery resets to 100 overnight (in most cases) and drains based on the day's activity and stress. It is less personalised but more consistent day to day. You know what 80 means on Monday and what 80 means on Friday. But it also means the score is less sensitive to your actual fitness trajectory.

Oura sits somewhere in between, using a temperature deviation baseline that adjusts slowly and an HRV comparison window that looks at recent trends. It is gentler with recalibration but can miss rapid changes.

Same body. Three different definitions of "normal." Three different conclusions about your readiness.

## The measurement timing gap

When you measure matters as much as what you measure.

Whoop takes its recovery measurement during your deepest sleep window. If your best HRV reading happens during the first sleep cycle (before midnight) and you have a disrupted second half of the night, Whoop might still give you green because it captured the good data early.

Garmin Body Battery updates continuously but the recovery portion loads overnight. Your score at 6am reflects overnight charging. If you toss and turn from 4am onward, your final battery level might be lower than Whoop's recovery score because Garmin caught the late-night disruption while Whoop had already locked in its measurement.

Oura weights the previous day's activity against overnight recovery. A big training day followed by a solid night might get you moderate readiness on Oura while Whoop (which does not factor yesterday's training load directly into the recovery score) gives you green.

Same sleep. Same body. Different measurement windows. Different scores.

## What multi-device athletes actually do

Talk to anyone who wears multiple devices and a consistent pattern emerges. They go through three phases.

**Phase one: comparison.** They check all their scores every morning, looking for consensus. When the devices agree, they feel confident. When they disagree, they feel anxious. This phase typically lasts a few weeks.

**Phase two: favouritism.** They pick the device that most often matches how they feel and start ignoring the others. This is usually the device they had first or the one their training group uses. The other devices become expensive alarm clocks.

**Phase three: override.** They stop trusting any single score and develop their own internal system. They glance at the numbers but make decisions based on how their legs feel, how motivated they are, and how yesterday's session went. They might check HRV trends over a week rather than reading a single morning score. They have effectively become their own recovery algorithm.

Phase three is where the best athletes end up. But it takes months of data and self-awareness to get there. And it raises an obvious question: if the end state is ignoring the device and going by feel, what was the point of the device?

## The data is not the problem

Here is the thing that gets lost in the frustration. The raw data from these devices is genuinely useful. Your HRV trend over four weeks tells you something real about your autonomic adaptation. Your resting heart rate trajectory flags overreaching before you feel it. Sleep staging data, even with the known accuracy limitations of wrist sensors, gives you a directional signal about sleep quality over time.

The problem is not the data. The problem is that each device takes the same raw signals, runs them through a proprietary black box, and spits out a single number that pretends to answer a question no single number can answer.

"Are you recovered?" is not a yes or no question. It depends on recovered for what. Recovered enough to do an easy swim? Probably. Recovered enough to hit heavy deadlifts? Maybe not. Recovered autonomically but still carrying peripheral muscle fatigue from Tuesday's session? Your HRV will not tell you that.

A 2021 review by Carrasco-Poyatos et al. in *Sports Medicine* emphasised that recovery is a multi-dimensional construct. Autonomic recovery, neuromuscular recovery, metabolic recovery, and psychological readiness all operate on different timelines and respond to different interventions. Reducing this to a single composite score necessarily loses information.

## Why more devices make it worse

The intuitive response to unreliable data is to add more data sources. If one device is not giving you the full picture, surely three will.

But what actually happens is the opposite. More devices create more noise without more signal. Each score introduces a new proprietary interpretation that may or may not align with the others. The athlete now has to reconcile three opinions instead of one. The cognitive load increases. The decision becomes harder.

This is a well documented phenomenon in decision science. Iyengar and Lepper (2000) showed in their famous jam study that more choices reduce decision quality and satisfaction. The same principle applies to data. More numbers do not automatically produce better decisions, especially when those numbers disagree and you have no framework for resolving the disagreement.

The athletes who benefit most from wearable data are not the ones with the most devices. They are the ones who understand what their device is actually measuring, what it is missing, and how to weight its output against their own subjective experience.

## What would actually work

The fix is not a sixth device. It is a layer that sits between your devices and your decisions.

Take the raw signals from whatever you wear. HRV trend over days, not a single morning snapshot. Resting heart rate trajectory. Sleep disruption patterns. Training load by session type. Combine them with the context no wrist sensor can capture: what you ate, what you trained, what is happening in your life.

Then surface specific, actionable insight. Not "you're 74% recovered." Instead: "Your HRV has been declining for three days. Your last two sessions were high intensity with no deload. Tuesday's sleep had a mid-night disruption. Consider an easy session or rest day."

That kind of synthesis is what multi-device athletes are doing manually in their heads every morning. The ones who do it well perform better. The ones who cannot are stuck checking three scores and flipping a coin.

The data exists. The interpretation layer does not. And until it does, adding another device to your nightstand will not get you any closer to knowing whether to train hard or take the day off.

---

*This is part of a series exploring the gaps between what wearables measure and what athletes actually need. Follow along at [p247.io](https://p247.io).*
