---
title: Roadmap Overview
description: Locked decisions, the action model, the hostile fake system, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with TypeScript and SQL. New to MCP and to agent loops. |
| Language / runtime | TypeScript 5.9 on Node 24, `strict` on, `any` banned |
| Protocol | The Model Context Protocol via `@modelcontextprotocol/sdk`. Tools over stdio locally and streamable HTTP in production. |
| Why MCP | The client already exists. A reviewer installs the server in their own tooling and drives it, with no interface built. It is also where the ecosystem settled, so the tool surface is portable rather than tied to one framework. |
| Agent loop | The `anthropic` SDK's tool runner. The loop is not the lesson; its per-turn hooks are, because that is where approval, budget and logging live. |
| Model | `claude-opus-5` with adaptive thinking. Effort is tuned per route at step 15, measured, never assumed. |
| Tool schemas | Strict, with `additionalProperties: false`. A tool call either validates exactly or fails. |
| Database | PostgreSQL 18. The action ledger, authority rules, approvals and traces. |
| Why a ledger and not a log | Every action must be answerable months later — what was asked, what was decided, what was called, what came back. A log rotates; a ledger is queryable and is what an idempotency check reads. |
| Idempotency | Every write action carries a key derived from the request, not generated at call time. At-least-once delivery is assumed everywhere. |
| Irreversible actions | Not rolled back. Compensated, with the compensation designed before the action ships. |
| Authority | Per-client rules stored as data: which actions, up to what value, with or without approval. Checked in code before any model call that could reach the tool. |
| Evaluation | A scenario suite from step 12 — must-do and must-refuse cases — run in CI. A change that breaks a must-refuse does not merge. |
| Traces | One trace per action, retrievable by id, sufficient to reconstruct the decision |
| Customer surface | A minimal server-rendered approval and trigger page. Not a dashboard. |
| Testing | Vitest against real PostgreSQL and the fake business system. The model is faked in unit tests and called for real only in the scenario suite. |
| Quality | ESLint + Prettier, `tsc --noEmit` strict, Vitest. |
| Ops | Docker Compose → one small VPS. |
| AI harness | `AGENTS.md` from step 4, evolving v1→v4. |

**Note on step count:** 18 numbered steps, 0 through 17. Steps 0–3 contain no code. Step 3 —
deciding which actions must not be automated — is the one that matters most and takes an
afternoon.

---

## Why this domain

An action-taking agent was chosen because **the world it changes has no undo button.** That
forces everything a demo never has to consider:

- **A wrong action costs money** → authority limits, blast radius, approval as a designed path
- **Networks retry, models repeat** → idempotency by default, and the same action twice charging once
- **Some actions cannot be undone** → compensation rather than rollback
- **The model chooses the tool** → a tool surface designed so the wrong call is hard to make
- **Tool results are untrusted** → data from a system or a customer is never an instruction
- **Someone will ask why** → traces good enough to reconstruct a decision months later
- **Loops spend money** → budgets enforced before the loop, and a stop condition

Nothing in a demo ever has to be right when it is retried.

---

## The three example clients

Every step is written against the same three businesses. They differ on one axis — **what
happens when the agent is wrong** — and an authority model that works for all three is one that
works.

| Client | What Warden does | The rule it exists to break |
|---|---|---|
| **Northwind Tools** `northwind` | Issues refunds up to a set amount against returned orders, checks order status, looks up a customer's history | The permissive baseline. Reversible, small blast radius, the agent acts alone. Everything here is easy, which is exactly why it is the baseline: if Northwind is unsafe, the design is unsafe. |
| **Lumen Energy** `lumen` | Prepares payment plans for customers in arrears — instalment count, amounts, dates | Money and a commitment the business must honour. Every plan is approved by a person before it exists. The agent's output is a *proposal*, and the design mistake is treating approval as a confirmation dialog rather than a different outcome. |
| **Sable Logistics** `sable` | Reschedules a delivery already assigned to a driver's route | The action reaches a third party. A route changed at 06:00 cannot be un-changed at 06:05 — the driver has already left. There is no rollback, only compensation, and any design that assumes "undo on failure" is wrong for this client and quietly wrong for the others. |

Concrete questions to keep asking: if Northwind's refund tool is called twice with the same
key, does the customer get one refund? Does Lumen's plan exist anywhere before a human approved
it? When Sable's reschedule succeeds but the notification to the driver fails, what does the
system do — and what does it *not* do?

None of the three may ever be special-cased in code. `if (client.slug === "lumen")` means the
authority model is wrong, not the client.

---

## The fake business system

The material ships its own adversary. You cannot learn idempotency against an API that behaves.

Step 5 brings up a small service that stands in for the client's real systems — orders,
customers, payments, deliveries — and it is deliberately hostile:

| Behaviour | What it teaches |
|---|---|
| Charges twice if two requests arrive without the same idempotency key | Why the key is derived from the request, not generated at call time |
| Returns 500 on roughly one call in twenty | Retries, and that a retry is a second delivery of the same action |
| Sometimes takes 30 seconds, then succeeds | Timeouts that are not failures, and the double-submit they cause |
| Returns 200 for a write that did not commit | Verification after the fact, and never trusting a status code as evidence |
| Has one endpoint with no reversal at all | Sable's world. Compensation, or nothing. |
| Returns a customer note field containing an instruction | Tool results are data, never instructions |
| Rate limits after a burst | Backoff, and an agent loop that does not hammer a client's production system |

Every one of these is a real failure from real integration work. The scenario suite at step 12
runs against this system, so a passing suite means the agent survives them.

---

## The action model (target state)

```
Client ──has──> AuthorityRule (action type, value limit, approval required, who may approve)
   │
   ├──has──> Conversation ──has──> Turn (what was asked, what the model decided)
   │                                   │
   │                                   └──has──> Trace (every tool call, tokens, latency, cost)
   │
   └──has──> Action ──has──> ActionAttempt (idempotency key, request, response, outcome)
                 │
                 ├──has──> Approval (who, when, decision, reason)
                 └──has──> Compensation (what was done to make it right, and whether it worked)
```

Three distinctions that matter:

- An **Action** is the intent — *refund order 4471 by £30*. An **ActionAttempt** is one delivery
  of it. Retries create attempts, never actions, and this is what makes the ledger an
  idempotency check rather than a history.
- An **Approval** is a separate record with its own author. An approval the agent can produce
  for itself is not an approval, and the schema is where that is made impossible.
- A **Compensation** is an action in its own right, with its own attempts and its own failure
  mode. Compensation that cannot fail has not been thought about.

Every action ends in one **outcome**: completed, refused, awaiting approval, failed, or
compensated. Those five are counted separately from step 12, and their ratio is what a client
is buying.

---

## Global guardrails (Verification Layer 5)

| Guardrail | From step | What it catches |
|---|---|---|
| `npm run verify` — lint, types, tests, in one command | 4 | Everything below, in one place |
| `tsc --noEmit` with `strict` | 4 | The type errors an agent loop full of unknown shapes hides until runtime |
| Vitest against real PostgreSQL and the fake system | 5 | Behaviour a mock would accept |
| The no-unauthorised-action test | 11 | Any path reaching a write tool without an authority check |
| The idempotency test | 9 | Two deliveries of one action producing two effects |
| The scenario suite, must-do and must-refuse | 12 | A change that makes the agent do something it must not |
| A no-secrets-and-no-customer-data-in-logs test | 6 | Credentials or personal data reaching the log channel |
| CI on every push | 4 | The above, on a machine that is not yours |

The must-refuse half of the scenario suite is the one that matters. Every other metric improves
by making the agent more willing to act.

---

## Reading the steps

**Steps 0 to 3 have no code and are not optional.** Step 3 produces the list of actions you
refuse to automate. A developer who cannot say what belongs on that list should not be building
this for a client.

**Mode is not a suggestion.** Idempotency, compensation, authority and scenario design all
produce code that looks obviously reasonable and is quietly wrong. An agent asked to write them
will produce something plausible, and the wrongness is invisible until the fake system charges
twice.

**Step 12 is the step.** Before it you have an agent you hope behaves. After it you have one
whose behaviour you can prove, including the actions it declines.
