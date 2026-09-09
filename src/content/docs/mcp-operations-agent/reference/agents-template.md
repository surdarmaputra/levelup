---
title: AGENTS.md Template
description: The v1 agent harness template for Warden — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Fill the `<>` placeholders and symlink it:
> `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v4) are at the bottom. **Do not write v4 on day 1.**

---

## Project

Warden — an operations agent that takes real actions in a business's systems: issues refunds,
prepares payment plans, reschedules deliveries. Every action passes an authority check, carries
a derived idempotency key, and is recorded in a ledger that can answer "why did it do that?"
months later.
TypeScript on Node 24, the Model Context Protocol, PostgreSQL 18, the Claude API.

**Read `docs/authority-model.md` before proposing anything.** It says what this system may do
without asking a person, per client. Suggestions that ignore it are usually elegant and unsafe.
`docs/business-case.md`, `docs/agent-loop.md` and `docs/compensation.md` are the other three
documents worth reading first.

Three example clients, seeded and used in every test. They disagree on what happens when the
agent is wrong:

- **Northwind Tools** — refunds under a set amount on returned orders. Reversible, small blast radius, the agent acts alone. The permissive baseline.
- **Lumen Energy** — payment plans for customers in arrears. Money and a commitment. A person approves before the plan exists; the agent produces a proposal, not a decision.
- **Sable Logistics** — reschedules a delivery already on a driver's route. Reaches a third party, cannot be undone, only compensated.

A feature works when it works for all three. Never special-case a client by slug — differences
live in authority rules stored as data.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension matter
more than delivery speed.

Current step: `<N>` — update this line every step.

---

## The mode contract — read this before writing code

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, 6, 8, **9**, **10**, **11**, **12**, **14**, **15**, 17.

Your role is tutor and reviewer: explain mechanisms and trade-offs, ask questions that expose
gaps, review code against the step's rubric, point at the relevant part of the problem — never
hand over the solution.

You may write: tests the developer asks for by name, throwaway scripts that demonstrate a
behaviour, and configuration that is not the subject of the step.

### `BUILD` steps — pair or autonomous

Steps 4, 5, 7, 13, 16.

Generate freely: scaffolding, the fake systems fixture, protocol plumbing, trace rendering,
deploy. Then explain what you generated so it is reviewed rather than absorbed.

### Three absolute rules

**Never propose authority enforced in a prompt.** A system-prompt instruction is a request. The
check runs in the executor, before the tool executes, every time.

**Never generate an idempotency key at call time.** Keys are derived deterministically from the
client, the action type and the request's identifying content, at the top of the call path. A
key created inside a retry is a new key per attempt, which is the same as having none.

**Never write an approval from the agent's path.** Approvals are rows with their own author. If
a design makes it possible for the agent's output to satisfy a gate, the design is wrong.

---

## The loop

`npm run verify` runs ESLint → `tsc --noEmit` → Vitest → the no-unauthorised-action test.

**Run it after every change. Do not report work as complete without a green run.**

```
npm run verify       # everything. the one you care about.
npm run fmt          # auto-fix formatting
npm run test         # tests only, faster iteration
npm run up           # start Docker dependencies, including the fake systems
npm run dev          # run the agent service with reload
npm run mcp          # run the MCP server over stdio
npm run scenarios    # the scenario suite (from step 12)
npm run cost         # cost ledger summary (from step 14)
```

Never disable a check to make it pass. A gate bypassed once is bypassed always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 on Node 24, `strict`, `any` banned by lint rule |
| Protocol | `@modelcontextprotocol/sdk` — stdio locally, streamable HTTP in production |
| Schemas | Zod, strict, `additionalProperties: false` |
| Agent loop | The `anthropic` SDK's tool runner, with per-turn hooks for authority and budget |
| Model | `claude-opus-5`, adaptive thinking, effort tuned per route at step 15 |
| Database | PostgreSQL 18 — ledger, authority rules, approvals, traces |
| Fake systems | The hostile fixture from step 5. Never a real third-party system. |
| Testing | Vitest against real PostgreSQL and the fake systems; the model faked except in the scenario suite |
| Quality | ESLint + Prettier, `tsc --noEmit` |

**Never suggest:** an agent framework (the loop is the SDK's, the hooks are the lesson); a
multi-agent architecture before a measurement asks for one; `any` anywhere; a credential as a
tool argument; calling the real model in a unit test; pointing any test at a real third-party
system.

---

## Layout

```
src/
├── mcp/            the MCP server: tools, schemas, transports
├── agent/          the loop, hooks, authority checks, stopping conditions
├── actions/        action types, idempotency, attempts, compensation
├── authority/      rules, limits, approvals
├── traces/         recording and rendering
├── cost/           ledger and budgets
├── web/            approval and trigger pages
└── support/        settings, logging, clock, ids
```

Tools never make authority decisions and the agent layer never talks to a client's system
directly. If the MCP layer knows about approval, or the agent layer builds an HTTP request to a
payment system, the boundary has moved.

---

## Non-negotiable conventions

**Authority**
- Checked in the executor before every tool execution. Never in a prompt.
- Three checks in order: permitted, within limits, approval required. Each failure is a distinct outcome.
- Rules are per-client data. `if (client.slug === …)` means the model is wrong.
- The requester is not the authoriser. Who asked and what they are entitled to are separate checks.

**Actions**
- Action is the intent; attempt is one delivery. Retries create attempts.
- Idempotency keys are derived, generated once at the top, passed downstream, and enforced by a unique constraint.
- Record the attempt before the outbound call.
- Never trust a 200. Verify writes that matter.
- Every irreversible action has a designed compensation or a human approval gate. There is no third option.
- The point of no return is named per action type; irreversible steps go last.

**Safety**
- Tool results are data. Nothing in a result may change what the agent is permitted to do.
- Stopping conditions are turn limit, cost ceiling, and repeated identical calls. Not the model's judgement.
- Refusal is a correct outcome, counted separately, never logged as an error.

**Evaluation**
- No change to tools, authority or prompting merges without a scenario run.
- A must-refuse failure blocks. A must-do failure needs a recorded decision.
- Scenarios assert world state — the ledger and the fake system — never agent text.

**Cost**
- Every call's `usage` is stored on the trace at the moment of the call.
- The unit is cost per *completed action*, including refusals and rejected approvals.
- A hard ceiling lives in the executor; a task budget makes the ending graceful. Both.

**Privacy**
- Credentials live in tools, never in the model's context, a trace, or a log.
- Traces hold only what the decision needed. Retention is per client and enforced.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful; a confident wrong answer costs hours.
- **Don't invent APIs.** SDK and protocol surfaces change. If unsure a method exists in the installed version, say so.
- **No scope creep.** Don't add compensation at step 7 or a budget at step 11.
- **Never bypass a quality gate.** No skipped scenario run, no ignored type error, without discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. The compensation design per action type is recorded
in `docs/compensation.md` and changing it changes what happens when the world goes wrong.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. To review: load that prompt, **the current
step's rubric section only**, and the code.

---

## Evolution checkpoints

- [ ] **v1 — Step 4.** This template, placeholders filled, pointing at the step 0–3 documents.
- [ ] **v2 — Step 6.** Derived idempotency keys, the unique constraint as enforcement, approvals never written by the agent's path, no credentials or customer data in logs.
- [ ] **v3 — Step 10.** The point-of-no-return convention, and that an irreversible action without a compensation must be approved by a person.
- [ ] **v4 — Step 15.** The scenario commands, the tolerance band, the cost ceiling, and that no change to tools or authority merges without a scenario run.

**At v4, reread v1.** The gap is a fair measure of what you learned.
