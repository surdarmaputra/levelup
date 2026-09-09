---
title: Getting Started
description: A guided path from "I can write code" to the automation retainer — AI steps inside a business's real operations, with replay, human sign-off, a confidentiality answer, a golden set, and a cost dashboard the client reads.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I can write code"* to the work businesses pay a monthly retainer for —
built around one real system: **Relay**, an operations automation that runs a business's daily
work with AI steps inside it, on self-hosted n8n with a TypeScript service beside it.

Sixteen steps. The first four are not code: what the manual work costs, how a non-deterministic
step behaves inside a workflow, what the no-code market already does, and how to scope a
retainer. Take a step in an evening or over two weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with TypeScript or another server language — async, HTTP, JSON, a test runner
- Comfortable with SQL, a terminal, git and Docker
- You have called an LLM API at least once

**Not assumed:** n8n, workflow automation, self-hosting, redaction, evaluation, or any opinion
about whether no-code tools are real engineering.

This is the most **integration-heavy** material in the catalog and the least algorithmic. That is
deliberate. Most paid work is wiring, and the wiring is where it goes wrong.

## What you are building, concretely

Relay is not a product. It is the shape of a delivered engagement: a business's actual process,
running every day, with the parts that need judgement handled by a model and the parts that need
guarantees handled by your code. It replays after a failure, it asks a person when it should, it
keeps the client's confidential documents where they are allowed to be, and it reports what it
cost.

The portfolio artefact is unusual for this catalog and closer to real work than most: **a system
running a real process, with a dashboard showing runs, failures, human decisions, hours saved
and cost per run.** Plus the golden set that says the AI steps still behave.

Three businesses are the running examples all the way through. They disagree on the axis that
matters here — **what a wrong AI step costs**:

| The business | What Relay does for them | What it forces you to handle |
|---|---|---|
| **Fern & Oak** — a marketing agency | Reads the shared inbox, classifies enquiries, creates and tags CRM records, drafts a first reply for a human to send | The high-volume, low-stakes baseline. A wrong tag costs seconds to fix. This is where you learn the mechanics — replay, idempotency, cost — without anything at risk. |
| **Ridgeway Legal** — a small law firm | Takes incoming contracts, extracts key terms, flags unusual clauses for a solicitor | Confidentiality. Client documents are privileged, and "just send it to an API" is not an available answer. Redaction, where inference runs, what the paperwork must say, and — as a last resort — a local model with its real cost stated. |
| **Brightline Recruiting** — a recruitment agency | Screens applications against a role and produces a shortlist with reasons | The AI's output is about **a person**. Nothing may be auto-rejected, the reasoning must be recorded and reviewable, the inputs must be checked for things that should not influence a decision, and a human signs off every outcome. This one breaks the model of "the workflow decides". |

Same platform, same patterns, three sets of rules. One system, configured per client, never a
line branching on which client it is.

Three questions to keep asking: what happens when this runs twice? who decided this, and can
they show why? and what does one run cost?

Other businesses in this shape: property managers routing maintenance requests, clinics handling
referrals, wholesalers processing orders from email, insurance brokers triaging claims,
accountants onboarding clients. All of them run a daily process by hand today.

## Why AI operations automation

Most automation material teaches the tool. This domain was chosen because of one property that
breaks every no-code tutorial: **a step whose output you cannot predict, inside a process that
needs guarantees.**

| Reality of the domain | Forces you to learn |
|---|---|
| The client's process is not written down anywhere | Discovery, and building against a description that turns out to be wrong |
| One step in the workflow is non-deterministic | A contract around the AI step — validate its output, handle the case where it is wrong, never let it silently decide |
| Workflows fail halfway through | Replay from a known point, idempotency at every external write, and knowing what already happened |
| Some outputs must not be automatic | Human sign-off as a first-class state, not a notification |
| Some documents may not leave the building | Redaction, inference location, contractual answers, and the real cost of a local model |
| A decision about a person is not a decision about a record | Recorded reasoning, reviewable outcomes, and inputs that must not influence the result |
| Model behaviour changes and nobody is watching | A golden set for the AI steps, run on a schedule, not just on change |
| The client pays monthly | Cost per run, a dashboard they read, and a report that renews the retainer |
| The requirement changes at week six | Because it always does. The material makes it happen to you. |

## What you'll learn

| Area | Technology |
|---|---|
| Orchestration | n8n, self-hosted with Docker — workflows, triggers, error workflows, queue mode |
| Your code | A TypeScript service (Hono) beside n8n: validators, idempotency, the ledger, the cost meter, the golden-set runner |
| Why both | n8n is excellent at connecting things and bad at guarantees. The split is the whole engineering argument, and it is what a no-code operator cannot do. |
| Model use | The Claude API — structured outputs against a schema, prompt caching, batch, effort, and a measured model choice |
| Correctness | Idempotency keys, replay from a checkpoint, at-least-once reality, external writes that happen once |
| People | Human sign-off as a workflow state, sign-off queues, expiry, and what an approver is shown |
| Confidentiality | Redaction before egress, inference location, retention, contractual answers, and self-hosting a model with honest numbers |
| Fairness | Recorded reasoning, reviewable outcomes, inputs excluded from a decision, and an audit trail for decisions about people |
| Evaluation | A golden set per AI step, scheduled runs, drift on a model you do not control |
| Cost | Cost per run, per client, per step; the dashboard; the lever order; batch and caching |
| Operations | Self-hosting, backups, secrets, the monthly report, and handling a changed requirement |
| Business | What the manual process costs, what the no-code market charges, how to price a retainer |
| AI workflow | An `AGENTS.md` harness, a `LEARN`/`BUILD` contract, a portable reviewer prompt |

## How this material is structured

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness and a portable reviewer prompt. | Once, before step 4. |
| **[Roadmap](./roadmap/overview/)** | The 16 steps in six sections, plus the locked decisions, the client simulator, and the guardrails. | Skim the overview, then work in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics, the `AGENTS.md` template, deliberate omissions. | One rubric section per step. |

| Section | Steps | Focus |
|---|---|---|
| [Concepts](./roadmap/concepts/) | 0–3 | What the manual work costs, how an AI step behaves in a workflow, the no-code market, scoping a retainer |
| [Foundations](./roadmap/foundations/) | 4–6 | Self-hosted n8n and the sidecar, the run ledger, the first workflow with no AI in it |
| [Workflows](./roadmap/workflows/) | 7–10 | The first AI step and its contract, idempotency and replay, human sign-off, confidentiality |
| [Trust](./roadmap/trust/) | 11–12 | The golden set for AI steps, and fairness and audit for decisions about people |
| [Cost](./roadmap/cost/) | 13–14 | Where the spend is and how to show it to a client, then the levers |
| [Operations](./roadmap/operations/) | 15 | Deploy, handover, the monthly report, and the requirement that changed |

**There is deliberately no implementation code in any of these documents.**

## The three paths

**Understand the job — steps 0–3.** No code. Ends with a retainer proposal you would send.

**Build the thing — steps 4–12.** n8n, the sidecar, the ledger, workflows, AI steps, replay,
sign-off, confidentiality, the golden set, fairness. Ends with three running client automations
whose behaviour you can prove.

**Keep the client — steps 13–15.** Cost, the dashboard, deploy, handover, the monthly report,
and the changed requirement.

## How to read a roadmap step

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. If you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — see [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on. |
| **Concepts** | What you're actually learning. |
| **Libraries** | What to add, and sometimes why over the obvious alternative. |
| **Expected outcome** | What you should have. On steps 0–3 that is a written document. |
| **Verification** | How you prove it's done. |

### Proving a step is done

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. |
| **L2 — Manual checks** | What a test can't catch — killing a workflow halfway, reading a sign-off queue as the approver. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/). |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". |
| **L5 — Automated guardrails** | CI, types, the golden set from step 11. See the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The per-step loop

1. Check the **Mode**.
2. Read the step.
3. For replay, sign-off, confidentiality and evaluation steps — **write the acceptance test first**. (Steps 8, 9, 10, 11 especially.)
4. Implement until it passes.
5. Run the L2 checks.
6. Self-check the `AP-NN-*` list.
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix, resubmit until `PASS`.

Expect to fail review the first time at steps 8, 10 and 12.

## A note on cost

Steps 7 onwards spend real money, and it is small — inbox triage at a few hundred items a month
is dollars, not tens of dollars. The surprise in this material is the other direction: **the
server usually costs more than the inference.** Step 13 exists so you find that out from your own
numbers rather than from this paragraph. Set a spending limit before step 7.

## Start here

1. **Read this page to the end.**
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the client simulator.
3. **Start [step 0](./roadmap/concepts/).** No repo. A calculator and an hour.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.**
5. **Bring up the client simulator** at [step 4](./roadmap/foundations/) — three seeded businesses with their inboxes, files and systems, and a change request that arrives later whether you are ready or not.
