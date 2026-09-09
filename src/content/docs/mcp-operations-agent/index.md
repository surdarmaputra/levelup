---
title: Getting Started
description: A guided path from "I have called an LLM" to an agent that takes real actions in real systems — with authority limits, approval gates, idempotent writes, a scenario suite, and a trace that explains every decision.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I have built a chatbot"* to the half of agent work that almost nobody
publishes — built around one real system: **Warden**, an operations agent that issues refunds,
sets up payment plans and reschedules deliveries in a business's actual systems, on TypeScript
and the Model Context Protocol.

Eighteen steps. The first four are not code — what an agent replaces, how the loop really
behaves, what you could buy instead, and which actions you should refuse to automate. Take a
step in an evening or over two weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with TypeScript — async, types, npm, a test runner
- Comfortable with SQL, HTTP, a terminal, and git; Docker installed
- You have called an LLM API and seen a tool call come back, even if you have not built a loop

**Not assumed:** the Model Context Protocol, agent frameworks, idempotency, compensating
actions, evaluation, or any opinion about whether agents are ready for production.

If you have built an agent demo before, this will still be new. The demo is step 7 of 18. The
other seventeen are the reason most agent pilots never reach production.

## What you are building, concretely

Warden does not answer questions. It **does things**: issues a refund, sets up a payment plan,
moves a delivery to Thursday. Every action passes through an authority check, an idempotency
key, and — where the action cannot be undone — a human approval gate. Every action is recorded
with what was asked, what was decided, what was called, and what came back.

The thing that makes it a portfolio piece is not the agent. It is two artefacts: an **MCP server
a reviewer can install in their own client and drive themselves**, and a **scenario suite** that
proves the agent takes the right actions *and refuses the wrong ones* — including the refund it
should not have issued.

Three businesses are the running examples all the way through. They were picked because they
disagree on the one axis that matters here — **what happens when the agent is wrong**:

| The business | What Warden does for them | What it forces you to handle |
|---|---|---|
| **Northwind Tools** — an online retailer | Issues refunds under a set amount on returned orders | The permissive baseline. Actions are reversible, the blast radius is small, and the agent may act alone. If this is wrong, nothing else matters. |
| **Lumen Energy** — a utility | Sets up payment plans for customers in arrears | Money, and a commitment the business must honour. Irreversible in practice, so a human approves before it happens, and the agent's job is to prepare a decision rather than make one. |
| **Sable Logistics** — a courier | Reschedules a delivery already assigned to a driver | The action reaches outside the company. A driver's route changed at 06:00 cannot be un-changed at 06:05. There is no rollback — only compensation — and the obvious model of *undo on failure* does not exist. |

Same agent, same tools, three authority models. That is the whole exercise: one system,
configured per client, and never a line of `if (client.slug === "sable")`.

Three questions to keep asking as you build: what happens if this action runs twice? who
decided this was allowed? and could I explain this decision to the customer three weeks later?

Other businesses in this shape, if you want to point your own version at one: insurers doing
claims adjustments, clinics rescheduling appointments, telcos applying account credits, banks
raising disputes, SaaS companies changing subscriptions, wholesalers amending orders. All of
them have staff doing repetitive decisions in an internal system today.

## Why an action-taking agent

Most agent material stops where the interesting part starts. A demo agent calls a tool, prints a
result, and is applauded. This domain was chosen because **the agent changes the world, and the
world does not have an undo button.**

| Reality of the domain | Forces you to learn |
|---|---|
| A wrong answer is embarrassing; a wrong action costs money | Authority limits, approval gates, and a blast radius you decide rather than discover |
| Networks retry and models repeat themselves | Idempotency as the default, not an optimisation — the same action twice must charge once |
| Some actions cannot be undone | Compensation instead of rollback, and designing for a world where "just revert it" is not available |
| The model decides what to call | A tool surface designed for a reader who cannot ask clarifying questions, and tools that make the wrong action hard |
| A tool result is untrusted input | Data that arrives from a system, or a customer, is never an instruction |
| "It seemed to work" is not evidence | A scenario suite, including the actions it must refuse, run in CI |
| Someone will ask "why did it do that?" | Traces that reconstruct a decision months later, because that is a support requirement |
| Every turn spends money, and loops can spin | Per-action cost, budgets enforced before the loop starts, and a stop condition |

Evaluation and observability are the most-cited blockers on agent projects in production, and
they are the two things a demo never has.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | TypeScript 5.9 on Node 24, strict mode, no `any` |
| Protocol | The Model Context Protocol — `@modelcontextprotocol/sdk`, tools, resources, transports |
| Agent loop | The `anthropic` SDK's tool runner and its per-turn hooks, where approval and budget live |
| Model behaviour | Adaptive thinking, effort, structured outputs, strict tool schemas, task budgets |
| Correctness | Idempotency keys, the action ledger, compensating actions, at-least-once reality |
| Authority | Per-client authority models, value limits, approval gates, escalation to a human |
| Safety | Untrusted tool results, injection through data, refusing an action, failing closed |
| Evaluation | A scenario suite of must-do and must-refuse cases, run in CI as a gate |
| Observability | Traces per action, decision reconstruction, what to log and what never to log |
| Cost | Cost per action, budgets before the loop, caching, effort tuning, a measured model choice |
| Interfaces | An MCP server for engineers, and the smallest possible web surface a customer can use |
| Quality | Vitest, ESLint, strict typing, deterministic tests against a non-deterministic dependency |
| Business | What the manual process costs, what agent platforms charge, which actions to refuse |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable reviewer prompt |

## How this material is structured

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `npm run verify` loop, the `LEARN`/`BUILD` contract — and a portable reviewer prompt. | Once, before step 4. The first four steps need no tooling. |
| **[Roadmap](./roadmap/overview/)** | The 18 sequenced steps in six sections, plus the locked decisions, the action model, and the always-on guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics, the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Concepts](./roadmap/concepts/) | 0–3 | What the manual process costs, how an agent loop behaves, what you could buy, which actions to refuse |
| [Foundations](./roadmap/foundations/) | 4–6 | Tooling and harness, the hostile fake business system, the action ledger schema |
| [Tools](./roadmap/tools/) | 7–10 | The MCP server, tool surface design, the first write, idempotency, irreversible actions |
| [Safety](./roadmap/safety/) | 11–13 | Authority and approval gates, the scenario suite, traces |
| [Cost](./roadmap/cost/) | 14–15 | Where the spend is and how to see it, then budgets and levers |
| [Operations](./roadmap/operations/) | 16–17 | Deploy and credentials, the customer's surface, drift and the monthly report |

**There is deliberately no implementation code in any of these documents.** The roadmap tells you
what to build and how to prove it works; the building is yours.

## The three paths

**Understand the job — steps 0–3.** No code. What a support agent's repetitive decisions cost,
how the loop actually behaves, what the agent platforms sell, and the list of actions you will
refuse to automate. Ends with a written authority model for all three clients.

**Build the thing — steps 4–13.** The hostile fake system, the ledger, the MCP server, tools,
idempotency, compensation, approval gates, the scenario suite, traces. Ends with an agent whose
behaviour you can prove.

**Make it a business — steps 14–17.** Cost per action, budgets, deploy, credentials, the
customer's surface, and the report that keeps the retainer.

Do not skip the first path. Step 3 is where you decide which actions a machine should not be
allowed to take, and that decision is worth more than the rest of the roadmap.

## How to read a roadmap step

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. If you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. |
| **Concepts** | What you're actually learning. The code is just the vehicle. |
| **Libraries** | What to add, and sometimes why over the obvious alternative. |
| **Expected outcome** | What you should have when the step is done. On steps 0–3 that is a written document. |
| **Verification** | How you prove it's done — see below. |

### Proving a step is done

An agent that does the wrong thing looks exactly like an agent that does the right thing, right
up until someone reads the ledger. Five layers exist to prevent that:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading a trace end to end, driving the MCP server by hand, trying to make the agent do something it must not. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". Most of the real learning is here. |
| **L5 — Automated guardrails** | CI, ESLint, strict TypeScript, and the scenario suite from step 12. Listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step: story, why now, concepts.
3. For idempotency, compensation, authority and evaluation steps — **write the acceptance test first**, watch it fail. (Steps 9, 10, 11, 12 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 9, 10 and 12. That's the design, not a setback.

## How to use the rubrics

Each step has a rubric in [Reference → Rubrics](./reference/rubrics/):

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the test and are still wrong (an
  idempotency key generated inside the retry; an approval gate the agent can satisfy itself).

Read `ACC-NN` before you build and write that test first; self-check against every `AP-NN-x`
once it passes; then paste **only that step's section** into the reviewer.

## A note on cost

Steps 7 onwards spend real money, and an agent loop can spend it faster than a single call —
that is the point of step 14 and the reason task budgets appear at step 15. One action costs a
few cents; a loop with no stop condition costs whatever you let it. **Set a spending limit on
your API account before step 7**, and treat "what does one action cost?" as a question with an
answer.

## Start here

1. **Read this page to the end.**
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the action model.
3. **Start [step 0](./roadmap/concepts/).** No repo, no API key. A calculator and an hour.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.**
5. **Bring up the hostile fake business system** at [step 5](./roadmap/foundations/) — the thing that charges twice if you get idempotency wrong.
