---
title: Getting Started
description: A guided path from "I know TypeScript" to automating systems that have no API — a browser bot with a resilience ladder, evidence for every run, a model only where deterministic selectors fail, and a vendor update that breaks it on purpose.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know TypeScript"* to the work nobody wants and everybody needs — built
around one real system: **Hinge**, a bot that operates business software through its own
interface because there is no other way in, on Playwright and a vision model used only where a
selector has failed.

Sixteen steps. The first four are not code: what the clicking costs, why this technique broke
for twenty years, what the enterprise vendors sell, and — the one that matters most — whose
permission you need. Take a step in an evening or over two weeks.

## Who this is for

- Comfortable with TypeScript — async, types, npm, a test runner
- Comfortable with SQL, HTTP, a terminal, git and Docker
- You have used a browser's developer tools

**Not assumed:** Playwright, RPA, selector strategy, vision models, or any opinion about whether
driving a UI is a respectable way to integrate two systems.

If you have written a scraping script before, this will still be new. The script is step 6 of 16.
The other fifteen are the difference between a script that worked on Tuesday and a bot a
business depends on at 03:00 every day.

## What you are building, concretely

Hinge logs into business software, navigates it, reads what it needs and enters what it must —
because the vendor never shipped an API and never will. Every step is a deterministic selector
first. When a selector fails, and only then, a vision model looks at the screenshot and finds
the element again. Every run leaves an evidence trail: screenshots, what was read, what was
entered, what came back.

The portfolio artefact is visceral in a way a REST API is not: **a recorded run filing fifty
records into an awful legacy system, with a screenshot trail**, plus the run where the vendor
changed the interface and the bot recovered instead of dying.

Three businesses are the running examples. They disagree on the axis that matters here — **what
the bot is allowed to do and what happens when it is wrong**:

| The business | What Hinge does | What it forces you to handle |
|---|---|---|
| **Halden Timber** — a builders' merchant | Enters the day's orders into a supplier's web-only ordering portal | The high-volume write baseline. Repeatable, correctable, but a double-submitted order is real money and real stock. Idempotency against a system with no idempotency support at all. |
| **Marisol Foods** — a food producer | Files a monthly regulatory return on a government portal | One shot. Session timeouts, a multi-step wizard, a submission that cannot be undone, and an audit that will ask for evidence years later. The point of no return is a real place on a real page. |
| **Kestrel Clinic** — a medical practice | Pulls tomorrow's appointment list out of a scheduling system with no export | Read-only, and the hardest of the three anyway, because the screen is full of patient data. What may be screenshotted, what may be logged, what may be stored, and for how long. |

Same bot, same ladder, three sets of rules. One system, configured per client, never a branch on
which client it is.

Three questions to keep asking: what happens if this runs twice? could I prove to an auditor what
happened? and what does this bot do when the button moves?

Other businesses in this shape: importers on customs portals, letting agents on deposit schemes,
garages on manufacturer parts systems, accountants on tax portals, hauliers on port booking
systems, pharmacies on ordering systems. All of them have somebody clicking through the same
screens every day.

## Why legacy automation

Because of a gap that is not closing: enterprises run around a thousand applications each and
only a minority are integrated. Most of the rest will never get an API — the vendor is gone, the
product is in maintenance, or an integration is a paid tier the client cannot justify. The work
is unglamorous, which is precisely why it pays.

| Reality of the domain | Forces you to learn |
|---|---|
| The system has no API and never will | Driving an interface as an integration technique, done properly |
| Interfaces change without warning | A resilience ladder — deterministic first, model only on failure — and the discipline to keep it that way |
| A bot that heals silently hides a real change | Self-healing that reports, and a repair that becomes a permanent fix |
| The system has no idempotency support | Doing it yourself: check before write, verify after, a ledger of what already happened |
| Some submissions cannot be undone | A named point of no return on a real page, and a decision about what to do when the wizard fails on step four of five |
| An auditor will ask, years later | Evidence as a product feature: screenshots, values, timestamps, retention |
| The screen is full of personal data | What may be captured, what must be masked, what may never be stored |
| Sessions expire mid-task | Re-authentication that resumes rather than restarts |
| You are automating someone else's software | Authorisation, rate limits, and knowing which jobs to refuse |
| A model call per step would be slow and expensive | Measuring where the model is genuinely needed, and keeping it rare |

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | TypeScript 5.9 on Node 24, strict, `any` banned |
| Browser | Playwright — contexts, storage state, locators, waiting, tracing, downloads |
| Resilience | A selector ladder: role and label first, then structural, then a vision model, then a human |
| Vision | The Claude API for element re-location from a screenshot — a fallback, never a default |
| Correctness | Idempotency without server support, check-before-write, verify-after-write, the run ledger |
| Irreversibility | The point of no return on a page, wizard state, and what to do when step four of five fails |
| Evidence | Screenshots and traces as an audit artefact, with retention and masking |
| Privacy | Masking before capture, what may be stored, per-client retention |
| Scheduling | Unattended runs, alerting, and a failure that reaches a person before the client notices |
| Cost | Compute cost, model-fallback rate, and the number that actually dominates — a broken bot's human hours |
| Ethics and scope | Authorisation, terms, rate limiting, and the jobs to refuse |
| Business | What the clicking costs, what the RPA vendors charge, how to price a bot that needs maintenance |
| AI workflow | An `AGENTS.md` harness, a `LEARN`/`BUILD` contract, a portable reviewer prompt |

## How this material is structured

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness and a portable reviewer prompt. | Once, before step 4. |
| **[Roadmap](./roadmap/overview/)** | The 16 steps in six sections, plus the locked decisions, the legacy portal, and the guardrails. | Skim the overview, then work in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics, the `AGENTS.md` template, deliberate omissions. | One rubric section per step. |

| Section | Steps | Focus |
|---|---|---|
| [Concepts](./roadmap/concepts/) | 0–3 | What the clicking costs, why RPA breaks, the vendor market, and whose permission you need |
| [Foundations](./roadmap/foundations/) | 4–6 | Tooling, the deliberately awful legacy portal, the run and evidence ledger, the first read flow |
| [Driving](./roadmap/driving/) | 7–10 | The selector ladder, the first write with idempotency, the one-shot submission, and sensitive screens |
| [Resilience](./roadmap/resilience/) | 11–12 | The vendor update that breaks your bot on purpose, then unattended runs and the evidence pack |
| [Cost](./roadmap/cost/) | 13–14 | Where the money actually is — it is not the model — and the levers |
| [Operations](./roadmap/operations/) | 15 | Deploy, handover, drift, and the monthly report |

**There is deliberately no implementation code in any of these documents.**

## The three paths

**Understand the job — steps 0–3.** No code. Ends with a scoping document and, importantly, a
written authorisation position for all three clients.

**Build the thing — steps 4–12.** The portal, the ledger, the ladder, writes, the one-shot
filing, sensitive data, the vendor update, unattended runs. Ends with a bot that survives having
its interface changed.

**Keep it running — steps 13–15.** Cost, deploy, handover, drift and the monthly report.

Step 3 is not optional. You are automating somebody else's software, and knowing which jobs to
refuse is part of doing this competently.

## How to read a roadmap step

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. |
| **Mode** | `LEARN` or `BUILD` — see [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on. |
| **Concepts** | What you're actually learning. |
| **Libraries** | What to add, and sometimes why over the obvious alternative. |
| **Expected outcome** | What you should have. On steps 0–3 that is a written document. |
| **Verification** | How you prove it's done. |

### Proving a step is done

A browser bot that is subtly wrong looks identical to one that is right — the run went green and
the value was wrong. Five layers:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. |
| **L2 — Manual checks** | What a test can't catch — watching a run headed, reading an evidence pack as an auditor. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/). |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". |
| **L5 — Automated guardrails** | CI, types, and the ladder-discipline test from step 7. See the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The per-step loop

1. Check the **Mode**.
2. Read the step.
3. For the ladder, idempotency, the one-shot filing and sensitive data — **write the acceptance test first**. (Steps 7, 8, 9, 10 especially.)
4. Implement until it passes.
5. Run the L2 checks.
6. Self-check the `AP-NN-*` list.
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix, resubmit until `PASS`.

Expect to fail review the first time at steps 8, 9 and 11.

## A note on cost

This is the material where the model is nearly free, and that is a lesson rather than a
convenience. A vision call happens only when a selector fails, so a healthy bot makes almost
none. The cost that dominates is a browser's memory on a server, and — far larger than either —
**the hours a person spends when the bot breaks and nobody notices.** Step 13 makes you measure
all three, and the third one is the reason step 11 exists.

## Start here

1. **Read this page to the end.**
2. **Skim the [Roadmap Overview](./roadmap/overview/).**
3. **Start [step 0](./roadmap/concepts/).** No repo. A calculator and an hour.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.**
5. **Bring up the legacy portal** at [step 4](./roadmap/foundations/) — a deliberately awful web application with a fifteen-minute session timeout, a modal that appears one time in ten, ids that change on redeploy, and a scheduled "vendor update" waiting for you at step 11.
