---
title: Cost
description: Steps 13–14. Where the money actually is in a browser bot — it is not the model — and the levers, with the two-portal suite deciding whether each trade was acceptable.
sidebar:
  order: 6
---

Two steps. The first only measures. The second changes things, judged by the suite from step 11
running against both portal versions.

This material's cost lesson is the sharpest in the catalog, and it inverts the usual one: **the
model is nearly free here, the server costs something, and the dominant cost is the hours a
person spends when the bot breaks.** A developer who optimises the vision prompt while the bot
needs two hours of attention a week has understood nothing about this technique.

---

## Step 13 — Where the money actually goes

**Story:** *As the person on the retainer, I know what one run costs — including my own time — and I know which flow is eating it.*

**Mode:** `LEARN` — this step changes no behaviour.

**Why now:** After the bot survives change and runs unattended, because until then you had no honest measure of how much attention it needs.

**Concepts:**

**The four costs, in the order they actually matter here:**

| Cost | What it is | How to measure it |
|---|---|---|
| **Human intervention** | Your hours, and the client's, when a run fails, stops at rung 4, or needs a locator repair | The `interventions` table from step 5, times your rate. This is the number that decides whether the project is worth doing. |
| **Compute** | A browser is memory-hungry. Runs, headless, on a host you pay for monthly. | The host bill, divided by runs. Add concurrency: two flows at once needs the memory for two browsers. |
| **Wall-clock time** | Politeness pacing makes runs long. A long run holds a browser and a slot. | Duration per run, recorded already |
| **The model** | Rung-3 calls only | The `usage` on each fallback call. On a healthy bot this rounds to nothing. |

**Where spend is visible**, and here there are five places rather than four:

- **The provider console** — the bill for the model, which will be small. Useful mainly as a
  surprise detector: a sudden rise means the rung-3 rate rose, which means the interface is
  moving.
- **The `usage` on every fallback response** — recorded at the moment of the call.
- **Your host bill** — usually the larger of the two infrastructure numbers, and the one people
  forget to attribute per client.
- **Your own ledger** — runs, durations, rungs, interventions, per client and per flow.
- **Your time-tracking**, honestly. Interventions are only measurable if you record them when
  they happen, including the five-minute ones.

**The rung-3 rate is a cost metric and an early-warning metric at once.** Zero on a healthy bot.
Rising means drift, which means an intervention is coming. It is the cheapest leading indicator
in this material and you already record it.

**Cost per *successful* run.** Include the runs that failed and were re-run, the interventions,
and the wall-clock. A bot with a 90% success rate and a ten-minute intervention on each failure
costs far more than its compute suggests.

**Attribute per client and per flow.** Marisol runs monthly and is expensive per run; Halden runs
daily and is cheap per run and dominant in total. Which one to optimise is not obvious until you
have both numbers.

**Third-party tooling.** Browser automation has its own category — hosted browser grids and
run-recording platforms — as well as the general observability tools:

| Option | What it is | When to adopt |
|---|---|---|
| Hosted browser infrastructure | Someone else runs the browsers, with parallelism and recordings | When you need concurrency beyond one host, or when the client will not host a browser. Compare against a bigger VPS first; for three flows it rarely wins. |
| Run-recording and monitoring platforms | Dashboards over runs, traces and failures | When several people need to see run health. Playwright's own trace viewer plus your ledger covers one developer well. |
| Open-source LLM observability platforms | Tracing and cost for the model calls | Almost never here — there are barely any model calls to observe. **Check the resource requirements before adopting one**; several want more memory than the browser does. |

The honest default is your ledger plus the trace viewer. Note the trigger that would change it.

**The client-facing number.** Runs, success rate, interventions, hours saved against step 0, and
your maintenance hours. That last one is unusual to publish and it is what makes a retainer
renewable — a client who can see the maintenance is real does not ask why they are paying for it.

**Libraries:** none new — the ledger from step 5

**Expected outcome:** A cost report, `docs/cost-report.md`: human intervention hours priced, compute per run, wall-clock per run, model spend, all per client and per flow; cost per successful run; the rung-3 rate; and the comparison against the step 0 estimate of maintenance — including whether your estimate was wrong, and by how much. A client-facing summary with five numbers. A spending limit on the API account and an alert on the rung-3 rate rising. **No behaviour changes.**

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — every run in a week of unattended operation is attributed to a client and flow with duration, rung usage, interventions and model cost; the sum of attributed model cost matches the provider figure for the period. |
| **L2 — Manual checks** | (a) Put the four costs in order for each client. If the model is not last, something is wrong with the ladder — go back to step 7. <br>(b) Compare your real maintenance hours with the step 0 estimate. Most people underestimate by a lot, and correcting it is what makes your next quote honest. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and you can state the true cost per successful run including your own time |

---

## Step 14 — Making it cost less

**Story:** *As the person on the retainer, this bot needs less of my attention than it did a month ago, and it still works on both versions of the portal.*

**Mode:** `LEARN` — the levers here are unusual, and the obvious ones are the wrong ones.

**Why now:** After measurement. And the order matters more here than anywhere: optimising the model spend in this material is optimising the smallest number on the page.

**Concepts:**

**Start where the money is, which step 13 just told you: your hours.** The levers, in order of
what they actually save:

1. **Reduce interventions.** Every rung-4 stop is your evening. Read the intervention records and
   fix the causes: a locator that keeps drifting, a sanity check that is too tight, an
   ambiguity the flow should resolve itself. This is the largest saving available and it is not
   a performance optimisation, which is why it gets skipped.
2. **Reduce false alerts.** An alert that is not actionable costs you the same as a real one the
   first three times, and after that it costs you a missed real alert.
3. **Make repairs faster.** A good rung-3 report — which element, which page, a screenshot, the
   locator it tried — turns a thirty-minute investigation into a two-minute commit. Improving
   the report is a cost optimisation.
4. **Cut wall-clock where it is free.** Waiting for conditions rather than durations, not
   re-authenticating when stored state is valid, not loading pages the flow does not need. But
   **never below the politeness pacing from step 3** — that limit is not a performance budget.
5. **Right-size the host.** Browsers want memory. Measure the peak with your real concurrency and
   size for it, rather than paying for headroom you never use or discovering the limit during
   Marisol's filing.
6. **Run sequentially where you can.** Two flows at once needs two browsers' worth of memory for
   a saving of a few minutes on a nightly job that nobody is waiting for.
7. **Only then, the model.** Fewer fallbacks — which is lever 1 again. A smaller image where the
   model still finds the element. A cheaper model for a task that is genuinely "find the button",
   measured on your real fallback cases. This lever is last because on a healthy bot there is
   almost nothing here to save.

**The one place to spend more, deliberately:** verification. Reading back a submitted order costs
a page load and prevents a duplicate that costs real money. If you find yourself trimming
verification to save wall-clock, you are optimising the wrong direction and step 8 explained why.

**Every change through the two-portal suite.** One change per experiment, both portal versions
run before and after. A "harmless" wait removed is the classic way a bot becomes flaky on a slow
night.

**Then price the retainer.** Compute plus your realistic maintenance hours, against the step 0
labour cost. If the margin is thin, the honest answer is usually fewer flows rather than a higher
price — and telling a client that one of their three flows is not worth automating is the kind
of advice that keeps the other two.

**Libraries:** none new

**Expected outcome:** At least four changes, each an experiment with both portal versions run before and after. An intervention-cause analysis with the top three causes fixed. Improved rung-3 reports. A right-sized host with the measured peak recorded. A tuning log. `docs/cost-report.md` finished with cost per successful run, maintenance hours per month, and a retainer price with the arithmetic behind it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — interventions per hundred runs fall against the step 13 baseline while all three flows still pass on both portal versions; no politeness pacing limit was reduced; every change has a recorded before-and-after. |
| **L2 — Manual checks** | (a) For each change, name what it could have broken and point at the suite result that says it did not. <br>(b) Work out the retainer price for all three flows. If it is not comfortably above your maintenance hours, decide which flow to drop rather than which number to inflate. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d`, `AP-14-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and the bot needs measurably less of your attention |

> **The trap this step exists to prevent.** Spending a day making the vision prompt cheaper on a bot that makes four model calls a month, while it stops for a person twice a week. Step 13 puts the four costs in order so that this step optimises the first one.
