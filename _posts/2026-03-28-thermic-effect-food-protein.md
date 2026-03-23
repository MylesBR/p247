---
layout: post
title: "The Thermic Effect of Food: Why Protein Burns More Calories Than Carbs"
slug: thermic-effect-food-protein-burns-more-calories
date: 2026-03-28
categories: [protein, nutrition, calories, body-composition, wearables]
description: "Protein costs your body 20 to 25% of its caloric value just to digest. Your wearable doesn't account for this, and the gap matters more than most athletes realise."
author: Myles Bruggeling
---

Your Whoop estimates calories burned from movement. Your Garmin tracks active calories and resting metabolic rate. Neither one knows what you ate. And that gap matters more than most athletes realise.

When you eat food, your body spends energy digesting, absorbing, and processing it. This is called the thermic effect of food (TEF), and it varies dramatically depending on what you eat.

Protein costs your body roughly 20 to 25% of its caloric value just to process. Eat 100 calories of chicken breast and your body burns 20 to 25 of those calories during digestion. Carbohydrates cost about 5 to 10%. Fats cost about 0 to 3%.

This isn't a rounding error. For an athlete eating 2,500 calories a day, the difference in TEF between a high-protein diet and a low-protein diet can be 150 to 200 calories per day. Over a month, that's the equivalent of several extra hours of moderate exercise, simply from the metabolic cost of processing what you ate.

Your wearable doesn't know any of this. And that makes its calorie estimates wrong in a way that systematically disadvantages athletes who eat more protein.

## How TEF actually works

When you eat a meal, your metabolic rate increases above its resting baseline. This post-meal increase is the thermic effect. It starts within an hour of eating, peaks in the first two to three hours, and can persist for up to six hours for protein-heavy meals.

The reason protein has a much higher thermic effect than carbs or fat is biochemical. Breaking protein into its component amino acids and then using those amino acids for various metabolic processes requires more enzymatic steps than breaking down carbohydrates or fats. Amino acid deamination (removing the nitrogen group), urea synthesis, and gluconeogenesis (converting amino acids to glucose when needed) are all energy-intensive processes.

Fat, by contrast, is chemically efficient to store and metabolise. Your body is very good at absorbing dietary fat and moving it into adipose tissue or using it for energy with minimal processing overhead. This makes sense from an evolutionary perspective: fat is your body's preferred long-term energy storage, so low processing cost maximises the energy you retain.

The numbers from the research:

Protein: 20 to 25% of calories consumed (some studies show up to 30% for lean protein sources like whey)

Carbohydrates: 5 to 10% (higher for complex carbs, lower for simple sugars)

Fats: 0 to 3% (minimal processing cost)

A mixed meal typically has a TEF of about 10% of total calories. But the composition of that meal shifts the number significantly.

## What this means for body composition

Two athletes can eat the same total calories and train identically, and the one eating more protein will have a modest but real metabolic advantage. Not because protein is magic, but because the processing cost is higher, leaving fewer net calories available for storage.

This is one of the reasons high-protein diets consistently outperform isocaloric lower-protein diets for body composition in clinical trials. The Antonio et al. (2014) study had trained men eat an extra 800 calories per day entirely from protein (4.4 grams per kilogram body weight) for eight weeks. They gained no significant body fat despite the caloric surplus. The TEF of all that extra protein, combined with the fact that protein is poorly converted to fat via de novo lipogenesis, meant the surplus didn't produce the fat gain you'd expect from an extra 800 calories of carbs or fat.

For athletes in a slight caloric deficit (cutting for a weight class, leaning out for racing weight, or just trying to improve body composition), the practical advice is straightforward: keep protein high even when total calories drop. The higher TEF helps preserve the caloric deficit, the amino acids protect lean mass, and the satiety effect of protein reduces hunger.

## The wearable blind spot

Here's where this connects to the data tracking problem.

Your Garmin calculates total daily energy expenditure (TDEE) from your basal metabolic rate plus activity calories. Your Whoop does something similar. Both use heart rate data and movement to estimate how many calories you burned.

Neither one accounts for TEF because neither knows what you ate.

If you eat 2,500 calories with 200 grams of protein (800 calories from protein), your TEF is roughly:

Protein: 800 × 0.25 = 200 calories
Remaining food (1,700 cal, mixed carbs/fat): ~1,700 × 0.07 = 119 calories
Total TEF: ~319 calories

If you eat the same 2,500 calories with only 100 grams of protein (400 calories from protein):

Protein: 400 × 0.25 = 100 calories
Remaining food (2,100 cal, mixed carbs/fat): ~2,100 × 0.07 = 147 calories
Total TEF: ~247 calories

The difference is 72 calories per day. Not huge in isolation, but over a 12-week training block, that's over 6,000 calories. Roughly 0.8 kilograms of body fat equivalent that the high-protein athlete "burned" through digestion alone.

Your wearable doesn't capture this difference. Its TDEE estimate is the same regardless of your diet composition. An athlete using wearable calorie data to manage a deficit could be off by 50 to 100 calories per day depending on their protein intake, and that error compounds over weeks.

## Why this matters for recovery tracking

TEF isn't just about body composition. The metabolic cost of digesting protein means your body is doing real work after meals. This slightly elevated metabolic rate shows up in your physiological data. Heart rate rises slightly after eating. HRV can dip temporarily during heavy digestion.

For athletes who eat a large protein-rich meal before bed, this can affect sleep-stage metrics. Your body is actively processing food during the first sleep cycle, which raises metabolic rate and can subtly shift heart rate and HRV readings. Recovery algorithms that rely on early-night HRV might interpret this as reduced recovery when it's actually just your body digesting dinner.

This is another example of the contextualisation problem. A slight HRV dip in the first two hours of sleep after a large meal is different from an HRV dip caused by overtraining. But without meal timing data, the wearable can't distinguish between them.

## Practical takeaways

**TEF is a free metabolic boost, not a cheat code.** The difference between a high and low protein diet's thermic effect is real but modest. It's not going to cancel out a 500-calorie daily surplus. Think of it as a tailwind, not an engine.

**High protein diets slightly undercount on wearable calorie calculators.** If you're using Garmin or Whoop TDEE estimates to manage your nutrition, you're burning slightly more than the device says if your protein intake is high. Factor this into how tightly you manage deficits.

**Don't sacrifice carbs for protein pre-workout just for TEF.** Glycogen availability matters more for training quality than the thermic effect. TEF is a background process. Fuelling the session is the priority.

**Post-meal metabolic effects can confuse recovery data.** If your recovery scores seem inconsistent, check whether you ate a large protein-rich meal within two hours of sleep. The digestion-related metabolic elevation can suppress early-night HRV.

**For body composition phases, protein is doubly useful.** Higher satiety (you feel fuller) plus higher TEF (you burn more processing it) plus muscle preservation (amino acid supply maintains lean mass). This is why every credible body recomposition protocol starts with protein targets before anything else.

## The synthesis gap

TEF is one more variable that lives outside the wearable ecosystem but directly affects the data your wearable produces. Training load, recovery, nutrition, and metabolism are all interconnected. Every consumer platform captures one of these in isolation and leaves the athlete to assemble the full picture.

A system that integrated nutrition data with recovery metrics could contextualise HRV dips (was it a meal or was it overtraining?), improve calorie balance estimates (account for TEF based on actual macronutrient intake), and give athletes a more accurate picture of their energy balance across training days, rest days, and different dietary approaches.

The data exists across MyFitnessPal, Cronometer, your wearable, and your training log. The synthesis doesn't. That gap is what P247 is built to close.
