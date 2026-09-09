---
title: AGENTS.md Template
description: The v1 agent harness template for Relay — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Fill the `<>` placeholders and symlink it:
> `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v3) are at the bottom.

---

## Project

Relay — a business's daily operations running as automated workflows with AI steps inside them.
Self-hosted n8n orchestrates; a TypeScript service beside it owns everything that must be
guaranteed.
n8n + TypeScript on Node 24 (Hono), PostgreSQL 18, the Claude API.

**Read `docs/business-case.md`, `docs/ai-steps.md` and `docs/confidentiality.md` before
suggesting anything.** They say what the manual process costs, what contract every AI step must
satisfy, and what may leave a client's infrastructure.

Three example clients, seeded in the simulator and used in every test. They disagree on what a
wrong AI step costs:

- **Fern & Oak** — inbox triage, CRM records, draft replies. High volume, low stakes. The only client where an AI step may act without a person.
- **Ridgeway Legal** — contract term extraction and clause flagging. Privileged documents; redaction before egress, pinned inference location, nothing in the ledger.
- **Brightline Recruiting** — application screening. The output is about a person: recorded reasoning, an input allow-list, and a human sign-off on every outcome. Never automatic.

A feature works when it works for all three. Never special-case a client by slug.

This is a **learning project** following `docs/ROADMAP.md`.

Current step: `<N>` — update this line every step.

---

## The split — the most important rule in this file

**n8n owns**: connectors, triggers, scheduling, retries, and the visual flow a client can look at.

**Your service owns**: validation, idempotency, the run ledger, replay, redaction, the model
call, sign-off, the cost meter, and the golden-set runner.

**If it must be guaranteed, it is in your code.** A guarantee implemented as a node
configuration is a guarantee that disappears the next time somebody edits the canvas.

The model call is never made from an n8n node. Behind your service, validation, versioning,
metering, caching and faking are ordinary; in a node, none of them are.

---

## The mode contract

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, **5**, 7, **8**, **9**, **10**, **11**, **12**, **13**, **14**.

Tutor and reviewer: explain mechanisms and trade-offs, ask questions that expose gaps, review
against the step's rubric, point at the problem — never hand over the solution.

You may write: tests asked for by name, throwaway scripts that demonstrate a behaviour, and
configuration that is not the subject of the step.

### `BUILD` steps

Steps 4, 6, 15.

Generate freely: the Compose stack, the simulator, the deterministic workflow, deploy. Then
explain what you generated.

### Three absolute rules

**Never put the model call in an n8n node.** It goes in the service, behind a validated schema.

**Never write a sign-off from a workflow path.** Sign-offs are rows created by a person's
session. A decision about a person that a workflow can complete is the failure this project
exists to prevent.

**Never re-call the model on replay.** The recorded output is reused. A replayed run that
re-generates is a different run, and if a person already saw the first output there are now two
versions of one job.

---

## The loop

`npm run verify` runs ESLint → `tsc --noEmit` → Vitest → the no-unvalidated-AI-output test.

```
npm run verify       # everything. the one you care about.
npm run test         # tests only
npm run up           # the whole stack: n8n, PostgreSQL, the simulator, the service
npm run dev          # the service with reload
npm run wf:export    # export workflows from n8n into workflows/
npm run wf:import    # import workflows from git into n8n
npm run golden       # the golden set (from step 11)
npm run cost         # cost ledger summary (from step 13)
```

Never disable a check to make it pass.

---

## Stack

| Layer | Choice |
|---|---|
| Orchestrator | n8n, self-hosted. Workflows exported to `workflows/` and committed. |
| Service | TypeScript 5.9 on Node 24, Hono, `strict`, `any` banned |
| Database | PostgreSQL 18 — run ledger, sign-offs, golden set, cost meter |
| Model | `anthropic` SDK from the service only, `claude-opus-5` default, structured outputs |
| Simulator | The hostile client fixture from step 4. Never a real client system in a test. |
| Testing | Vitest against real PostgreSQL and the simulator; the model faked except in the golden set |
| Quality | ESLint + Prettier, `tsc --noEmit` |

**Never suggest:** n8n's built-in AI or agent nodes for anything a client pays for; a cloud-hosted
orchestrator (Ridgeway is why we self-host); writing our own workflow engine; a message broker
between n8n and the service; `any`; storing privileged document text anywhere; calling the real
model in a unit test.

---

## Layout

```
src/
├── http/           the endpoints n8n calls
├── steps/          one module per workflow step, AI and deterministic
├── ai/             schemas, prompts and versions, the model client, caching
├── ledger/         runs, step results, external writes, replay
├── signoff/        the queue, permissions, expiry
├── redaction/      egress boundary for privileged content
├── golden/         sets, runner, metrics
├── cost/           meter and reports
└── support/        settings, logging, clock, ids
workflows/          exported n8n workflows, in git
```

---

## Non-negotiable conventions

**AI steps**
- Structured output validated against a schema, or the step fails. Never free text parsed downstream.
- Category sets are closed and always include an escape option.
- Three outcomes: usable, invalid (fail the step), low confidence (route to a person).
- Every call records prompt version, model, tokens, cost and validated output.
- Output is untrusted input: validate, escape and length-limit before it reaches any client system.

**Runs and replay**
- Step results record the hash of the step's actual input, not the trigger payload.
- Replay skips successful steps and reuses recorded AI output.
- Steps that sent something to a person are marked non-replayable and refuse.
- External writes are separate records with derived idempotency keys, enforced by a unique constraint.

**People**
- Sign-off is a persisted state that survives restarts, never a blocked execution.
- Expiry never applies the automatic outcome. It notifies.
- Overrides record both the model's value and the person's.
- Decisions about people use an input allow-list, structured per-criterion reasoning, and an exportable audit record.

**Confidentiality**
- Redaction runs before every egress for clients that require it, tested adversarially.
- Privileged text never enters the ledger, a log, or an error message.
- Retention is per client and enforced.

**Evaluation**
- A golden set per AI step, hand-labelled, run on change and on a schedule.
- A tolerance band, not an exact threshold.
- No change to a prompt, schema or model merges without a run.

**Cost**
- Every call's `usage` is recorded at the moment of the call.
- Infrastructure is reported beside inference. Here it is usually the larger number.
- The unit is cost per *completed run*, including replays and sign-off minutes.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.**
- **Say when you're unsure.**
- **Don't invent APIs.** n8n's node surface and the SDK both change between versions.
- **No scope creep.** Don't add redaction at step 6 or a golden set at step 8.
- **Never bypass a quality gate.**

---

## Decisions

Architecture decisions live in `docs/adr/`. The n8n-versus-service split is recorded there and
it is the one an agent will most often propose crossing.

---

## Code review

`docs/REVIEWER-PROMPT.md`. Load it with **the current step's rubric section only**.

---

## Evolution checkpoints

- [ ] **v1 — Step 4.** This template, placeholders filled, the split written down, pointing at the step 0–3 documents.
- [ ] **v2 — Step 5.** Replay rules, AI output reused on replay, derived keys enforced by a constraint, no privileged text in the ledger.
- [ ] **v3 — Step 10.** AI output validated before any external write, sign-offs never written by a workflow, redaction before egress.

**At v3, reread v1.** The gap is a fair measure of what you learned.
