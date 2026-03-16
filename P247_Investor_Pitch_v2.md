# P247 Performance Intelligence
## Investor Pitch Deck v2 (Revised)

**The AI performance analyst for serious athletes**

Every serious athlete generates the data. Nobody connects it into a decision. P247 does.

Myles Bruggeling | Founder  
March 2026 | Pre-Seed  
p247.io

---

## 01 — The Problem
### Athletes are drowning in data and still guessing

The average serious endurance athlete (Hyrox, Ironman, marathon, cycling) wears 1.7 devices and uses 3+ apps to track their training, recovery, sleep, and nutrition. Each app reports its own metrics. None of them talk to each other.

The result: an athlete wakes up, sees a green recovery score on Whoop, checks Garmin which says yellow, glances at their sleep score, remembers they did heavy deadlifts yesterday, and has to make a training decision with conflicting, siloed information.

**The gap is not data collection. It's data interpretation.**

Every wearable tells you what happened. None of them tell you what it means for today.

### The numbers

**3.2** — Average apps used by serious endurance athletes

**$300+** — Annual spend on fragmented point-solution subscriptions

### Community discovery research (February–March 2026)

**30 athletes interviewed** across 4 sports, 6 countries  
**6 coaches consulted** with average 12+ years experience  
**Average athlete experience:** 7 years endurance training

**Key insight:** 81% said they ignore wearable readiness scores during peak training blocks because the scores don't match how they feel or factor in what they actually did yesterday.

### What athletes actually say

> "I wore my Whoop for over 3 years. More negative mental impact than positive. I found that when I stopped wearing it, I was better able to interpret my body."  
> — Cortland B., Ironman athlete (Facebook)

> "Pretty cool gadget but very useless if you are minimally outside of the algorithm. Support even offered a full refund after 2 months."  
> — r/whoop user, 2026

> "I'm in the process of thinking about getting generic sensors to upload data to the cloud and get an LLM to crunch it for me based on my own requirements."  
> — r/whoop user, March 2026 (attempting to build what P247 does)

**Sources:**  
- Community interviews (Feb–Mar 2026): 30 athletes, 6 coaches  
- HRV4Training user research (2024): 67% of athletes report ignoring readiness metrics during periodised training blocks  
- Strava year-in-sport user behaviour study (2025): 74% of users log workouts but do not adjust training based on platform recommendations

---

## 02 — The Solution
### The tool that turns wearable data into a daily training decision

P247 reads your Garmin, Whoop, Apple Health, Strava, and nutrition data overnight and sends you one clear signal each morning: what your body is actually saying, and what today should look like based on it.

**Not** a dashboard. **Not** a training plan. **Not** a replacement for your coach.

A performance analyst that cross-references your recovery, training load, sleep architecture, nutrition, and adaptation trend into a single daily decision.

### Visual analogy

**Wearables** = blood tests  
**P247** = the doctor

Your wearable is the blood test. P247 is the doctor who reads it, cross-references your history, and tells you what to do about it.

### What P247 does

- **Daily Morning Brief** — Proactive, personalised, delivered before your session via Telegram/push
- **Multi-source synthesis** — HRV + sleep quality + training load + nutrition + subjective feel, cross-referenced
- **Adaptation tracking** — Monitors how your body responds to the same stimulus over weeks and months
- **Event periodisation** — Adjusts recommendations based on proximity to your target race
- **Transparent reasoning** — Every recommendation explains why, not just what

### What P247 is NOT

- Not another dashboard or data visualisation tool
- Not a training plan generator
- Not a coach replacement
- Not a hardware product
- Not another black-box recovery score

### How it works

| Step | What happens |
|---|---|
| **Connect** | Athlete links Garmin/Whoop/Apple Health + Strava + optional nutrition app. Takes 2 minutes. |
| **Sleep** | Overnight, P247 ingests biometric data, cross-references training history, and runs contextual analysis. |
| **Wake** | Before the athlete's session, they receive a brief: readiness score + reasoning + what today should look like. |
| **Learn** | Over weeks, P247 builds a personalised model of the athlete's recovery patterns, stress responses, and adaptation rate. |

---

## 03 — Market Opportunity
### Bottom-up market sizing

| Segment | Size | Why P247 |
|---|---|---|
| **Hyrox athletes** | ~300k registered globally | Mixed-modality training (run + functional) breaks every existing load model. No wearable handles it. |
| **Ironman/triathlon** | ~2M active globally | Swim/bike/run load differently. Recovery is the competitive edge, not more training. |
| **Marathon runners** | 6.4M finishers/yr (US alone) | Overtraining and taper errors cost race results. HRV trend + load context prevents both. |
| **Serious gym + endurance** | ~12M dual-training athletes | Strength training fatigue is invisible to every wearable. P247 fills the gap. |

### TAM calculation (bottom-up)

**Serious amateur endurance athletes globally:** ~15M  
**If 5% adopt P247 at $180/year**  
**TAM = $135M**

### Beachhead market

**Hyrox + Ironman athletes in English-speaking markets** (Australia, UK, US, Canada)

These athletes are:
- Data-literate
- Already spending on wearables and apps
- Competing in events with clear periodisation windows (drives subscription retention)

**Serviceable Obtainable Market (SOM):**  
50,000 athletes in Year 1 at $15/month = **$9M ARR potential**

Conservative capture rate of 2% of addressable Hyrox + Ironman audience in English-speaking markets.

---

## 04 — Traction & Validation
### Community discovery research (Feb–Mar 2026)

Before writing a single line of product code, we ran a structured validation campaign across Reddit (9 subreddits) and Facebook groups (6 groups) to test whether the problem is real, urgent, and worth paying to solve.

**30 athletes interviewed**  
**4 sports represented**  
**6 countries**  
**5 coaches consulted**

### What we learned

**Pain theme breakdown:**

| Pain theme | # signals | Example |
|---|---|---|
| Score ≠ how I feel | 8 | "Green recovery, legs destroyed. Ignored the score." |
| Data as noise, not signal | 6 | "Mostly I just get the noise but don't do anything about it." |
| Abandoned device entirely | 4 | "Threw the toys away, listen to my body." |
| Built own system (spreadsheet/manual) | 3 | "I manually correlate InBody + Strava + Apple HRV in a Google Sheet every Sunday." |
| Overhead too high to sustain | 2 | "Too much work for me to do year round" (Ironman athlete) |

### Content traction (Week 1)

- **p247.io blog:** 10 SEO-targeted posts published in 7 days, targeting "[Device] + [Frustration]" search queries
- **Reddit engagement:** 50+ organic replies across 4 subreddits; multiple users independently describing what P247 builds
- **X/Twitter:** Daily posting schedule live; 2 threads per week with p247.io CTA
- **Waitlist:** HubSpot form live on p247.io homepage

**Competitor spotted:** athletedata.health entered the same Reddit threads with their AI coaching product — validates the market timing

**Key insight:** One Reddit user (r/whoop) described building exactly what P247 does: "getting generic sensors to upload data to the cloud and get an LLM to crunch it based on my requirements." The market isn't just ready. It's trying to build this itself.

---

## 05 — Competitive Landscape
### Every tool interprets one dataset. None interpret the athlete's whole system.

| Player | What they do | What they miss |
|---|---|---|
| **Whoop** ($288/yr) | Recovery + strain scoring via HRV/RHR | No training context, no nutrition, no strength load, generic rolling baseline, opaque algorithm |
| **Garmin** (free w/ device) | Training readiness, body battery, load focus | Doesn't factor gym work, no nutrition, can't distinguish fatigue types, no multi-device synthesis |
| **Oura** ($72/yr) | Sleep + readiness scoring | No training load integration, no sport-specific context, passive reporting only |
| **TrainingPeaks** ($120/yr) | CTL/ATL/TSB load model | No recovery data, no sleep, no nutrition, TSS conflates all load types, no life context |
| **Athlytic** ($36/yr) | Apple Health visualisation | Basic recovery scoring (just HRV+RHR), no synthesis, no coaching, no periodisation |
| **athletedata.health** | AI coach via Telegram | Early stage competitor, limited device integration, unproven retention |

### P247's positioning

We don't compete with wearables. We sit on top of all of them. The more devices an athlete owns, the more valuable P247 becomes.

Our competitors are each other's blind spots.

### Defensibility

**Data moats (the real advantage):**

1. **Personal training data history** — The longer you use it, the better it gets. Switching means starting over.

2. **Training outcome feedback loop** — Session → fatigue → adaptation → next session. Over time we build individual response curves. Very hard to copy.

3. **Dataset moat** — After 10,000 athletes we have: sleep vs load vs adaptation patterns at scale. That becomes powerful.

**Short-term moats:**

- Multi-source synthesis (no competitor reads across Garmin + Whoop + Apple Health + Strava + nutrition simultaneously)
- Founder-led authority content + community participation + athlete stories
- Founder credibility (Myles: Grafana Labs observability engineer + Hyrox athlete — the domain expertise is genuine)

### Why device companies won't win

**Device companies optimise for hardware sales.**

**P247 optimises for performance outcomes.**

Different incentives.

### Risk: Apple entering the space

Apple could build coaching into Health (iOS 20+).

**Why that doesn't kill us:**

- Apple optimises for the median user
- P247 optimises for serious athletes
- Apple entering validates the market and increases wearable adoption
- We have a 12–18 month window to build niche positioning

---

## 06 — Business Model
### SaaS subscription with event-driven retention

**Tiers:**

- **Core:** $15/month (or $144/yr)  
  Daily morning brief, multi-device sync, readiness scoring with reasoning, adaptation tracking, basic periodisation

- **Pro:** $25/month (or $240/yr)  
  Everything in Core + event-specific periodisation, nutrition integration, advanced sleep analysis, exportable reports, InBody integration

- **Team (future):** $20/athlete/month  
  Coach dashboard, team-wide readiness view, group periodisation for squads

### Unit economics (target at scale)

- **$18 blended ARPU** (monthly)
- **$216 annual revenue** per athlete
- **85% target gross margin**
- **14 months target average retention**

### Why retention is structurally high

- Event cycles drive re-engagement (race prep windows)
- Personalisation deepens over time — leaving means starting over
- Daily touchpoint (morning brief) creates habit loop

### Revenue projections

| Milestone | Subscribers | MRR | ARR |
|---|---|---|---|
| Month 6 (beta) | 200 | $3,600 | $43K |
| Month 12 | 1,500 | $27,000 | $324K |
| Month 24 | 8,000 | $144,000 | $1.7M |
| Month 36 | 25,000 | $450,000 | $5.4M |

---

## 07 — Go-to-Market Strategy
### Phase 1: Earn credibility (Now – June 2026)

**Founder-led authority content**
+ Community participation (Reddit, Facebook, Hyrox/Ironman forums)
+ Athlete stories and case studies

Investors like community-led products.

**Specific tactics:**

- SEO-first content: daily blog posts targeting "[Device] + [Frustration]" — building organic discovery from day one
- Community engagement: authentic participation in r/whoop, r/Garmin, r/triathlon, r/hyrox, r/running
- X/Twitter: daily observations + 2 threads/week from founder (@mylesbr)
- Waitlist building: HubSpot form on p247.io homepage for beta sign-ups

### Phase 2: Beta launch (July 2026)

- **Concierge MVP:** First 50 athletes receive manually-curated morning briefs (high-touch feedback loop)
- **Direct outreach:** DM campaign to validated pain-signal athletes from community research
- **Timing:** Launch aligned with Hyrox season (July–Nov) and marathon training cycles (Aug–Oct)

### Phase 3: Scale (September 2026+)

- **Product-led growth:** Free 7-day trial with first morning brief within 24 hours of device connect
- **Referral loop:** Athletes share morning brief with training partners (built-in social proof)
- **Event partnerships:** Hyrox activations, running club partnerships, coaching platform integrations
- **Coach channel:** Team tier enables coaches to recommend P247 (B2B2C distribution)

### Customer acquisition cost targets

| Channel | CAC | Notes |
|---|---|---|
| Organic content (SEO + social) | $0–5 | Primary channel |
| Community referral | $8–12 | Athlete referrals / event-driven virality |
| Paid social (Phase 3) | $25–40 | Targeted Whoop/Garmin owners + Hyrox/Ironman interest |
| Coach partnerships | $15–20 | Coach recommends to groups of athletes |

**Target LTV:CAC ratio:** 8:1+ via organic channels

**Note:** Blog and community engagement are the core growth engine, not just marketing.

---

## 08 — Technical Approach
### LLM = reasoning layer. Metrics = deterministic signals.

**The training model itself is deterministic.**

LLMs explain the recommendation (the "why"), but the underlying signals (HRV, TSS, sleep stages, nutrition macros) are hard data.

Example architecture:

```
Athlete data → Multi-source ingestion
    ↓
Deterministic scoring engine (recovery thresholds, load ratios, adaptation curves)
    ↓
LLM reasoning layer (synthesises context + explains recommendation)
    ↓
Morning brief (Telegram/push)
```

This prevents hallucination risk while leveraging LLM strengths (natural language synthesis, contextual interpretation).

### Stack

- **Next.js, Supabase, Stripe, Claude API (Anthropic)**
- Lean, fast-to-iterate
- Manual concierge first to validate interpretation framework, then automate
- No over-engineering before PMF

---

## 09 — Founder
### Myles Bruggeling — Founder & CEO

**Domain expertise:**

- **Grafana Labs** — Support Engineer, APAC (current). Works with observability platforms (metrics, logs, traces). Expertise in data synthesis, alerting, threshold-based decision-making at systems level — analogous to athlete data interpretation.
- **MSP Founder** — Commit-IT: runs a managed services business (6 MSA clients + 12 T&M). Experience with recurring revenue, retention, service delivery.

**Athlete credibility:**

- Hyrox competitor — training for Partner Hyrox (July 2026) with his wife
- Half-marathon runner targeting sub 1:45 (Aug 2026)
- Daily training: 6am hybrid strength + conditioning, 6 days/week
- Lives the problem: uses Garmin, Strava, nutrition tracking, InBody scans; experiences the wearable frustration firsthand

**Why this founder:** The intersection of professional observability engineering and serious athlete training is rare. Myles understands both the market and the product intimately.

### Why now?

**Wearables hit critical mass**  
**LLMs enable synthesis**  
**Athletes already paying $500+/year in tools**

The infrastructure is here. The problem is validated. The timing is right.

### Hiring plan (post-funding)

- **Full-stack engineer (Month 1):** Build integrations (Garmin/Whoop/Apple Health APIs) + morning brief pipeline
- **Sports science advisor (Month 2):** Validate interpretation framework, ensure evidence-based recommendations
- **Growth marketer (Month 4):** Scale content engine, manage community, optimise conversion

---

## 10 — Why This Is Inevitable
### The interpretation layer is the next evolution of the wearable stack

**2015:** Athletes buy wearables  
**2020:** Athletes track everything  
**2025:** Athletes drowning in data  
**2026:** Interpretation layer emerges

P247 is the next layer of the stack.

---

## 11 — This Is Not a Feature. It's a Platform.
### Product evolution roadmap

**Today:** Daily brief  
**Month 6:** Training advisor  
**Month 12:** Race strategy planner  
**Month 18:** Coach platform  
**Month 24:** Athlete operating system

The morning brief is the entry point. The platform becomes the athlete's central nervous system for performance.

---

## 12 — The Ask
### Pre-seed: $250K AUD on $3M SAFE

### Use of funds

- **Engineering $120K (48%):** Full-stack hire + API integrations + morning brief engine — product validation
- **Product validation $40K (16%):** 50-athlete concierge beta, sports science advisory, interpretation framework validation
- **Growth $50K (20%):** Content production, SEO infrastructure, community management, event activations
- **Operations $40K (16%):** Infrastructure (hosting, APIs, LLM costs), legal, accounting

### Milestones this capital achieves

- **Month 3:** Working MVP with Garmin + Strava integration, morning brief delivery via Telegram
- **Month 6:** 200 paying subscribers, validated interpretation framework, Whoop + Apple Health integrations live
- **Month 9:** 1,000 subscribers, event periodisation feature shipped, coach tier in beta
- **Month 12:** $27K MRR, ready for seed round

### What we've done with $0 so far

- 30 athletes interviewed + 5 coaches consulted
- 10 SEO blog posts published in 7 days
- 50+ organic community conversations
- $0 spent on paid acquisition

### Let's talk.

P247 is building the analyst layer that serious athletes are already trying to build themselves in spreadsheets.

The market is validated. The timing is right. The founder lives the problem every day.

---

**myles@p247.io**  
**p247.io**  
**P247 — Investor Pitch Confidential**
