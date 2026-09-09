---
title: Cost
description: Steps 14–15. Four meters running at once, which one is actually the largest, and the levers — with the caller suite deciding whether each trade was acceptable.
sidebar:
  order: 6
---

Two steps. The first only measures. The second changes things, judged by the caller suite from
step 12 and the latency budget from step 5 together.

This is the most expensive material in the catalog to run, and its cost lesson is the most
surprising: **four meters run at the same time, and the model is usually not the biggest one.**
Text to speech generally is. A developer optimising prompt tokens here is working on the third or
fourth largest line.

---

## Step 14 — Four meters, and which one is largest

**Story:** *As the person selling this, I can state what a minute of call costs, broken into its four parts, and compare it honestly against an answering service.*

**Mode:** `LEARN` — this step changes no behaviour.

**Why now:** After the agent behaves, so there is something to protect while optimising. And after the suite exists, because the suite is now a real line in your own bill.

**Concepts:**

**The four meters, all running while the caller is on the line:**

| Meter | What it charges for | Rough share |
|---|---|---|
| **Telephony** | Per minute of call, plus a monthly number rental | Small per minute, and the number rental is a fixed cost per client |
| **Speech in** | Per minute of audio recognised, usually streaming | Typically the smallest of the four |
| **The model** | Per token, so it scales with how much is said and how much history is carried | Meaningful, and usually not the largest |
| **Speech out** | Per character or per minute of generated audio | **Usually the largest**, and it is the one nobody expects |

Get your own current figures rather than trusting a table — this market re-prices frequently, so
record the date beside every number. Published all-in figures for assembled stacks have sat
roughly between seven and thirty cents a minute, with a bring-your-own-keys assembly toward the
lower end; a managed platform bundles orchestration into a higher per-minute rate.

**Why speech out being largest changes your design.** Every word the agent says costs money and
time. Shorter replies are cheaper *and* faster *and* better conversation — which is a rare
alignment, and it means the first cost lever is also a quality improvement. Meanwhile the
instinct to trim the system prompt is optimising a smaller meter.

**Where spend is visible.**

- **Each provider's console** — four of them, which is why an aggregate view is worth building.
- **The `usage` on every model response**, recorded per turn as it happens.
- **Duration per call**, from your ledger, which is the multiplier on three of the four meters.
- **Your own ledger, per call**, which is the only place all four are in one row.

**Cost per call, not per minute.** A client thinks in calls. A three-minute booking and a
forty-second wrong number cost very different amounts, and the average is what matters.

**Cost per *completed* call.** Include abandoned calls, calls that escalated, and the caller-suite
runs. An escalated call still cost money on all four meters before it transferred.

**The comparison that matters is not software.** It is an answering service per call, or a
receptionist's hour. Put your cost per call beside both. That is the slide, and it is usually
comfortable.

**The caller suite is a real line item.** Ten calls of real audio through four meters, several
times a day. Price it, and let the number decide how often it runs on a branch versus on the main
branch.

**Alerts.** A spending limit on all four accounts, and your own alert on cost per call leaving its
band. A change that made the agent chattier shows up here immediately, because speech out is the
big meter.

**Libraries:** none new — the ledger from step 6 and the timings from step 5

**Expected outcome:** A cost ledger with all four meters per call, per client. `docs/cost-report.md` — cost per call and per minute broken into four parts, cost per completed call including abandoned and escalated calls, the monthly cost of running the caller suite, number rentals as a fixed cost, and a three-way comparison against a managed platform and a human answering service. Spending limits on all four accounts and a drift alert. **No behaviour changes.**

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — every call in a caller-suite run has all four meters attributed, and the sum per provider matches that provider's figure for the period; an escalated call appears with the cost incurred before transfer. |
| **L2 — Manual checks** | (a) Put the four meters in order for a typical call. If speech out is not at or near the top, check whether you are being billed the way you think. <br>(b) Work out Bayside's monthly cost at their real volume and compare it to an answering service. That comparison is your pitch. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and you can state cost per call with all four parts |

---

## Step 15 — Making it cost less without making it worse

**Story:** *As the person selling this, a call costs less than it did, and it is no slower and no worse on any of the ten callers.*

**Mode:** `LEARN` — every lever here trades against latency, quality, or both, and two gates decide.

**Why now:** After measurement. And uniquely in this catalog, **two gates apply at once**: the caller suite and the latency budget. A change that saves money and adds 200ms fails, even if every assertion passes.

**Concepts:**

**Start with the largest meter, which step 14 says is speech out.**

1. **Say less.** The single best lever in this material, because it saves money, saves time and makes the conversation better. Read your transcripts and cut. Most agents say roughly twice what they need to.
2. **Do not re-say what was interrupted.** Audio generated for a caller who was already talking is paid for and never heard. Stopping generation promptly on barge-in — which step 8 built — is a cost lever as well as a quality one.
3. **Cache what is fixed.** Greetings, disclosure, hold phrases and common confirmations are the same audio every time. Synthesise once, reuse. It removes both cost and first-audio latency on the most frequent utterances in the system.
4. **Choose the voice deliberately.** Voices differ substantially in price and in first-audio latency, and the most expensive is not always the most natural on a phone line — which is narrowband and unforgiving. Compare on your own audio.

**Then the model meter:**

5. **Keep the history bounded.** A twelve-turn call re-sends everything each turn. Summarise or drop old turns; a booking rarely needs turn three.
6. **Cache the stable prefix.** The system prompt and the call policy are identical on every turn. Verify with cache-read tokens.
7. **Effort before model.** Lower effort on a capable model is often both cheaper and faster, and faster matters more here than in any other material in this catalog.
8. **Then the model itself, measured against both gates.** A cheaper model that is faster may be *better* here even at equal quality, because latency is quality in voice. Measure; do not assume in either direction.

**Then the rest:**

9. **End calls that are going nowhere sooner.** The silent-caller handling from step 13 is a cost control. Every second of a pocket dial costs four meters.
10. **Speech in** is usually the smallest meter. Leave it alone unless the numbers say otherwise.
11. **Run the caller suite less often on branches** than on the main branch, if its cost justifies it. Say what you chose.

**The two gates, together, on every change.** The suite must pass and the ninety-fifth percentile
latency must stay inside the budget. A change that saves money and adds 200ms is a regression,
because a slower agent gets interrupted more, and an interrupted agent has worse calls.

**Where to spend more deliberately.** Northgate's urgency judgement is not the place to save a
cent. Say where you chose to spend.

**Then price it.** Cost per call × calls per month, plus number rental, plus your time, against
the step 0 missed-call figure and the cost of an answering service.

**Libraries:** the `anthropic` SDK — prompt caching, effort settings; your synthesiser's caching and voice options

**Expected outcome:** At least four changes, each an experiment with suite results and latency percentiles before and after. Fixed utterances cached as audio. Bounded conversation history. Prompt caching verified. A voice choice with cost and first-audio latency measured on your own line. A tuning log. `docs/cost-report.md` finished with cost per call per client, a monthly figure at stated volume, and the comparison against step 0 and an answering service.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — cost per completed call falls against the step 14 baseline while every must-never assertion in the caller suite still passes and the ninety-fifth percentile time to first audio stays inside the budget; every change has a recorded before-and-after on both gates. |
| **L2 — Manual checks** | (a) Listen to a call before and after your reply-shortening pass. If it sounds curt, you went too far; if it sounds the same, you did not go far enough. <br>(b) Compare your final cost per call against an answering service per call. If you are not comfortably cheaper, the design needs changing rather than the price. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d`, `AP-15-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and the call is cheaper, no slower, and no worse |

> **The trap this step exists to prevent.** Optimising the model's tokens while the synthesiser generates two sentences of unnecessary politeness on every turn. Step 14 puts the four meters in order so that this step starts at the top of the list rather than at the familiar one.
