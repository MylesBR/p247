---
layout: post
title: "She Ignores Her Recovery Score. Here's What She Looks At Instead."
slug: she-ignores-her-recovery-score
date: 2026-03-21
categories: [wearables, recovery, menstrual-cycle, pattern-recognition, training]
description: "An experienced athlete built her own multi-signal interpretation system because no wearable could account for her cycle. What she does manually is what the next generation of tools should automate."
author: Myles Bruggeling
---

She's been training seriously for six years. Triathlon in summer, CrossFit year-round, the occasional half marathon when she feels like punishing herself. She owns a Whoop. She checks it every morning. And then she ignores the recovery score completely.

Not because she thinks it's useless. Because she's learned it's incomplete.

Her system is simple but specific. Every morning she looks at three things: her HRV trend over the past five days, her resting heart rate relative to her baseline, and where she is in her menstrual cycle. She logs her perceived energy on a 1 to 5 scale in a notes app. Then she decides how to train.

The Whoop recovery score? She glances at it the way you glance at a clock you know runs five minutes fast. It's information. It's just not the whole story.

## Why the score breaks down

For roughly half the population, recovery scores have a predictable blind spot. The menstrual cycle creates hormonal fluctuations that directly affect HRV, resting heart rate, body temperature, sleep architecture, and perceived exertion. These aren't subtle variations. They're systematic, recurring, and significant enough to make a daily recovery score misleading for up to two weeks out of every four.

During the luteal phase (roughly the two weeks after ovulation), progesterone rises. This elevates basal body temperature, increases resting heart rate, and typically suppresses HRV. Your Whoop sees elevated heart rate and lower HRV and concludes you're under-recovered. It gives you yellow or red.

But you're not under-recovered. You're in the luteal phase. Your body is doing exactly what it's supposed to do. The physiological baseline has shifted, and the algorithm is comparing you against a baseline that doesn't account for where you are in your cycle.

A 2020 study by McNulty et al. in *Sports Medicine* reviewed the relationship between menstrual cycle phases and exercise performance. They found that strength and high-intensity performance tend to be marginally better in the follicular phase, while the luteal phase is associated with increased perceived exertion and thermoregulatory strain. Not because the athlete is broken. Because her physiology is doing something different.

The recovery score doesn't know this. It just sees the numbers and panics.

## Her system

The athlete who posted about this on r/whoop (she's not alone, dozens of women have described similar approaches) developed her framework over about 18 months of frustration. She started by tracking her cycle phases alongside her Whoop data and noticed the pattern immediately. Her recovery score dropped predictably in the luteal phase and recovered in the follicular phase, regardless of her actual training load or how she felt.

So she stopped looking at the composite score and started building her own signal stack.

**Signal one: HRV trend, not daily number.** She watches the five-day trend direction rather than any single reading. A declining trend in the follicular phase means something different than a declining trend in the luteal phase. In the follicular phase, a five-day HRV decline probably indicates accumulating fatigue. In the luteal phase, it might just be progesterone doing its thing. Context changes the interpretation entirely.

**Signal two: resting heart rate delta.** She compares her morning RHR against her phase-specific baseline, not her overall baseline. She knows her luteal-phase RHR runs about 4 to 6 beats higher than her follicular-phase RHR. So a reading of 58 in the luteal phase is actually equivalent to a reading of 53 in the follicular phase. The Whoop doesn't make this distinction. She does.

**Signal three: perceived energy and motivation.** This is the subjective layer that no wearable captures. She rates herself 1 to 5 every morning before looking at any data. She's found that her self-assessment, adjusted for cycle phase, is more predictive of session quality than the recovery score. When her subjective rating disagrees with the Whoop score, she trusts herself. And she's usually right.

**Signal four: training context.** What did she do yesterday? What's the session today? Is this a deload week or a build week? The Whoop score exists in isolation. Her decision accounts for the training plan.

She synthesises all four signals in about 90 seconds while drinking her coffee. It's not complicated. But it requires knowledge that the app doesn't have and can't easily get.

## The manual synthesis problem

What she's doing is exactly what good coaches do. They take multiple data inputs, weight them based on context, and make a judgment call. It's pattern recognition informed by experience, not algorithm.

The issue is that this approach doesn't scale. She developed it over 18 months of tracking, noticing patterns, getting it wrong, adjusting. Most athletes don't have the patience or the analytical inclination to build their own interpretation framework. They want the app to tell them something useful. And for a large segment of users, it can't. At least not yet.

This isn't just a menstrual cycle problem, although that's the most systematic example. The same limitation applies to any athlete whose recovery is affected by variables the wearable doesn't capture. Life stress. Travel. Illness onset. Nutritional changes. Altitude. Climate shifts. The wearable sees the downstream effects on autonomic markers but doesn't know the cause, which means it can't tell you whether the signal is something to worry about or something to ignore.

She figured that out for herself. Most people won't.

## What Whoop has tried (and why it's not enough)

To their credit, Whoop added a menstrual cycle tracking feature. You can log your cycle phase and see it overlaid on your data. It's a step in the right direction. But the recovery score calculation itself doesn't meaningfully adjust for cycle phase. The feature adds visibility without changing the interpretation.

It's the difference between showing you a weather map and adjusting your route based on the weather. The data is there. The intelligence isn't.

Garmin and Oura have made similar moves. Oura's cycle tracking is reasonably detailed. Garmin's Body Battery doesn't account for it at all. None of them have cracked the integration problem: taking cycle phase data and using it to modify the interpretation of HRV, RHR, and sleep metrics in a way that produces genuinely contextualised recommendations.

The technology to do this exists. Cycle phase prediction from wearable temperature data is surprisingly accurate. Phase-specific HRV baselines could be calculated automatically. Adjusted recovery scores that account for known hormonal effects are entirely feasible from an algorithmic standpoint.

Nobody has shipped it in a way that actually changes the user experience. The closest thing is what this athlete built for herself in a notes app and her own head.

## The broader pattern

This story is a specific example of a general truth about wearable data. The people who get the most value from their devices are the ones who develop their own interpretation layer on top of the raw numbers. They don't trust composite scores. They look at individual signals, weight them based on context the device doesn't have, and make judgment calls.

These are the athletes who keep training logs alongside their wearable data. Who notice that their Tuesday sessions always suffer when they have a stressful Monday at work. Who know that their HRV drops for three days after a long-haul flight and have learned to just ride it out instead of reducing training intensity.

They're doing manual multi-signal synthesis. And they're doing it because no product on the market does it for them.

The gap isn't data collection. Wearables are excellent at collecting data. The gap is contextualised interpretation. Taking the raw signals from the device, combining them with information the device doesn't have (cycle phase, life stress, training plan, nutrition, goals), and producing an insight that's actually personalised.

Not "your recovery is 62%." But "your HRV is lower than your follicular-phase baseline but consistent with your luteal-phase pattern. Given your training load this week and the intensity session planned for tomorrow, you're fine to train as planned."

That's what she does in her head every morning. That's what a product should be able to do at scale.

## What this means for what comes next

The athletes building their own systems are showing us the product spec. They're prototyping the interpretation layer manually because nobody has built it yet. Their workarounds are the design brief.

When someone tracks their cycle phase in one app, checks their HRV in another, logs their perceived energy in a third, and makes a training decision based on all three, they're telling you exactly what they need. A single view that synthesises those signals and accounts for the context that changes how each one should be read.

P247 exists because that synthesis layer is missing. Not because athletes need another metric. Because they need the connections between the metrics they already have.

---

## Suggested X Thread

**Tweet 1:**
She's been training for six years. Owns a Whoop. Checks it every morning. Ignores the recovery score completely. Here's what she looks at instead. 🧵

**Tweet 2:**
During the luteal phase, progesterone raises RHR and suppresses HRV. Whoop sees this and flags under-recovery. But she's not under-recovered. Her physiology just shifted. The algorithm doesn't know the difference.

**Tweet 3:**
Her system: 5-day HRV trend (not daily), RHR vs phase-specific baseline, perceived energy 1-5, and training context. Four signals. 90 seconds. More accurate than the composite score.

**Tweet 4:**
She built this over 18 months of tracking, noticing patterns, and getting it wrong. Most athletes won't do that. The product should do it for them.

**Tweet 5:**
The athletes building their own interpretation systems are writing the product spec. They're prototyping what the next generation of tools should automate. New post: [link]
