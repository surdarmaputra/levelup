---
title: Operations
description: Steps 16–17. Numbers, hours and out-of-hours routing, then drift, transcript review, and the monthly report.
sidebar:
  order: 7
---

## Step 16 — Numbers, hours, and the day it fails

**Story:** *As Bayside Dental, the system answers when we are busy and gets out of the way when we are not — and if it breaks at 09:00 on a Monday, calls still reach us.*

**Mode:** `BUILD` — deployment and routing, with one decision to record.

**Why now:** After the agent behaves and is priced. Putting a number on a client's website before you know what happens when the agent is down is how a business loses a morning of calls.

**Concepts:**
- **The routing decision comes before the deployment.** A number can go straight to the agent, to the agent only when the business does not pick up within a few rings, or to the agent only out of hours. The middle option is the most sellable and the least risky: the human answers first, and the agent catches what would otherwise be missed. Recommend it, and record why.
- **Failure must route to a human, in the telephony layer.** If your agent is down, the number falls back to the business's normal line — configured at the provider, not in your code, because your code is the thing that is down. This is the single most important configuration in the step.
- **Opening hours are data, per client**, with holidays and exceptions. Northgate's out-of-hours behaviour is the opposite of Bayside's: at 02:00 the agent is the front door, and its job is to reach the on-call engineer.
- **The on-call rota is data too**, and wrong data at 02:00 is worse than no system.
- **What has to run**: the agent process, PostgreSQL, and a public endpoint the real-time service can reach. Sized for concurrent calls — each call holds a session and a set of streams, so capacity is measured in simultaneous calls rather than requests per second.
- **Concurrency limits and what happens at the limit.** More calls than capacity must fall back to the human line, not queue silently.
- **Secrets across five providers**, from the environment, rotatable, with spending limits set.
- **The runbook**: the agent is down, a provider is down, a number stops receiving, a caller complains about something the agent said, a cost spike. Five pages.
- **Handover.** The client owns the number, the recordings and the transcripts. If they stop working with you, the number must keep working — which means the number is in *their* provider account, not yours. Arrange that at the start; moving a number later is slow and sometimes impossible.

**Libraries:** your telephony provider's routing configuration, Docker Compose, your CI

**Expected outcome:** A deployment with the agent, PostgreSQL and a reachable endpoint, sized in concurrent calls. Provider-level failover to the business's normal line, tested by taking the agent down. Opening hours and holidays as data per client. Northgate's on-call rota as data. A concurrency limit that falls back rather than queues. Secrets from the environment with spending limits on all five accounts. `docs/RUNBOOK.md`. The number in the client's own account, or a written plan to move it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — with the agent process stopped, a call to the number still reaches the fallback destination; a call outside configured hours follows the client's out-of-hours rule; calls beyond the concurrency limit fall back rather than queue; no secret appears in any log or transcript. |
| **L2 — Manual checks** | (a) Stop the agent and phone the number. If it rings out, you have built a way for a business to miss calls. <br>(b) Phone Northgate's number at a time when the rota says nobody is available. Whatever happens is what a customer with an emergency will get. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and the business cannot lose a call because your software stopped |

---

## Step 17 — Drift, transcript review, and the monthly report

**Story:** *As Copper Kettle, my developer listens to the calls that went badly and fixes them, and I get a page each month telling me what the system did.*

**Mode:** `LEARN` — this is what turns a delivered build into a retainer, and it is mostly listening.

**Why now:** Last. It needs the ledger, the suite, the cost report and real calls.

**Concepts:**
- **Listen to calls. It is the job.** Every week, listen to the escalations, the abandoned calls, and a random sample of the successful ones. Nothing in a dashboard tells you what a transcript does — and the random successful sample is where the surprises are, because those calls are being counted as wins.
- **What to watch, per client, against its own baseline:** escalation rate and the trigger mix, abandonment rate, average turns per call, recognition confidence, time to first audio percentiles, and cost per call. A shift in any of them is a signal.
- **A falling escalation rate at Northgate is a problem, not an achievement.** It means the agent is handling calls it should be handing over. This is the metric most likely to be misread by everyone, including the client, so put it in the report with a sentence explaining which direction is good.
- **A rising abandonment rate usually means latency.** Callers hang up on slow systems. Check the percentiles before checking the conversation.
- **Recognition confidence drifts with the caller population.** A new advertising campaign brings different callers, different accents, different environments. Nothing on your side changed.
- **The suite grows from real failures.** Every call that went badly becomes a fixture. This is how the suite stays honest and stops reflecting only the failures you imagined at step 12.
- **Model and provider changes happen without you.** Run the suite on a schedule, not only on change, exactly as elsewhere in this catalog. Voice adds two more third parties to be surprised by.
- **The monthly report**: calls answered, outcomes broken down, escalations with their triggers, calls missed before the system existed compared with now, cost, and anything that changed. One page, generated, sent whether or not anything happened. For a business that was missing calls, the first line is the whole argument.
- **When to advise them out of it.** If the practice hires a receptionist, or a platform ships their exact use case cheaper, say so. It costs you one client and keeps your reputation, which is worth more.

**Libraries:** none new — metrics over your ledger

**Expected outcome:** A weekly review routine covering escalations, abandonments and a random successful sample, with findings recorded. Per-client baselines and alerts on sustained shifts, with escalation rate treated as directional rather than as something to minimise. Real failed calls added to the caller suite. A scheduled suite run. An automatically generated monthly report per client. A written note on when you would advise the client to stop.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — a sustained shift in escalation rate, abandonment or latency percentile raises an alert against that client's own baseline; a call added from a real failure runs in the suite unchanged; the scheduled suite run fails loudly on a must-never regression. |
| **L2 — Manual checks** | (a) Listen to ten real calls end to end. You will find something no metric showed you; that is the point of the routine, not a sign it is missing a metric. <br>(b) Read the monthly report as the client. If the first line is not about calls answered that would otherwise have been missed, the report is written for you. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and you find out about a bad call before the client does |

> **What you have at the end.** A phone number a stranger can dial, ten recorded callers that prove how it behaves including the ones it refuses to handle, a cost per call broken into four meters, and a report whose first line is the number of calls that would have been missed. The number alone gets attention. The other three are why the attention survives the second question.
