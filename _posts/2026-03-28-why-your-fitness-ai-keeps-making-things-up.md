---
layout: post
title: "Why Your Fitness AI Keeps Making Things Up"
slug: why-your-fitness-ai-keeps-making-things-up
date: 2026-03-28
categories: [ai, wearables, recovery, training]
description: "Your AI coach called a solo run a 'brick session.' You never rode that day. Here's why health AI hallucinates and what a grounded approach looks like."
author: Myles Bruggeling
---

You finished a 6km run. Nothing special. Laced up, hit the pavement, came home.

Then your AI coach called it a "perfectly paced run off the bike" and praised your "brick execution." You didn't ride that day. You haven't been on the bike in a week.

This keeps happening. The AI invents context that doesn't exist in your data, then builds an entire analysis on top of the fiction. It sounds confident. It reads like it knows you. But it is working from assumptions, not from what actually happened.

## The hallucination problem in health AI

Large language models are pattern completers. When they see a run following a gap in data, they fill that gap with whatever seems statistically likely. For endurance athletes, that often means assuming a bike ride happened first. For triathletes especially, "run after a gap" pattern matches to "brick session" in the training data the model was built on.

The model doesn't check whether a cycling workout actually exists in your history for that day. It doesn't verify against your Strava, your Garmin, or your TrainingPeaks. It generates what sounds right based on probability. And in health and training, sounding right while being wrong is worse than saying nothing at all.

This is not a minor inconvenience. If your AI coach thinks you did a brick when you didn't, every downstream recommendation is corrupted. Recovery advice is wrong. Training load calculations are off. The next session suggestion is built on a phantom workout.

## Why it happens more than you think

The brick session example is obvious because it is easy to spot. But subtler hallucinations happen constantly.

Your AI says your HRV trend is "improving steadily" when it has actually been flat for two weeks. It references a strength session you "completed yesterday" when you took a rest day. It congratulates you on hitting a protein target you never logged.

Each of these comes from the same root cause: the AI is generating plausible text rather than reporting verified data. It fills gaps with assumptions instead of flagging what it doesn't know.

Athletes who use multiple platforms see this most often. Your training plan lives in TrainingPeaks. Your activity data is in Strava. Sleep and recovery sit in Whoop or Garmin. Body composition is in a separate app entirely. No single AI layer has access to all of it, so every one of them is guessing about the pieces it can't see.

## The multi-source problem

One user described piping data from their wearable and Intervals.icu into a Google spreadsheet, then feeding that to Gemini with a detailed control document. "Somewhat successful" was the verdict. Another tried importing their training plan directly into an AI coach via a Google Doc. The AI couldn't handle time references and the experiment was abandoned.

These are sophisticated, data-literate athletes building manual pipelines because no product does the integration properly. They are not asking for a chatbot that sounds encouraging. They want an AI that reads what actually happened across all their data sources, understands the training plan they are following, knows what phase of their periodisation they are in, and only speaks to what it can verify.

That is a fundamentally different product from what exists today.

## What grounded AI looks like

The fix is not better prompting or a more advanced language model. The fix is architecture.

A grounded health AI starts with your actual data. Every device, every platform, every data source you use. It maps what it knows against what it doesn't. When there is a gap, it says "I don't have cycling data for today" instead of inventing a brick session.

It cross-references. If your Garmin logged a run at 7am and your sleep tracker shows you woke at 6:15am, those two data points validate each other. If your training plan says Tuesday is intervals but your Strava shows a steady Zone 2 effort, the AI should flag the discrepancy instead of pretending the plan was followed.

It should know the difference between a rest day you chose and a rest day forced by injury. Between an easy run that was genuinely easy and one where your heart rate was 15bpm above normal for the pace.

Every insight should trace back to a specific data point. Not a probability. Not an assumption. Not a pattern match against what most athletes do.

Your data, verified. Your body, not a statistical average. That is the standard health AI should be held to. Anything less is fiction dressed up as coaching.

## The gap is real

Right now, athletes are choosing between apps that own one data source and guess about the rest, or DIY pipelines held together with spreadsheets and API workarounds. Neither is acceptable for people making real training decisions based on what their tools tell them.

The next generation of health AI will not be the one with the most encouraging tone or the slickest interface. It will be the one that earns trust by never inventing a workout you didn't do.

That is what we are building at P247.
