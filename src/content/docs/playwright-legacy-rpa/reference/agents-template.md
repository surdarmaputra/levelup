---
title: AGENTS.md Template
description: The v1 agent harness template for Hinge — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Fill the `<>` placeholders and symlink it:
> `ln -s AGENTS.md CLAUDE.md`

---

## Project

Hinge — a bot that operates business software through its own interface, because those systems
have no API and never will. Deterministic locators first, a vision model only when a locator has
failed, evidence for every run.
TypeScript on Node 24, Playwright, PostgreSQL 18, the Claude API for the fallback rung only.

**Read `docs/authorisation.md` before suggesting anything that touches a system.** It says whose
software each flow runs against, who authorised it, and how fast it may go.
`docs/how-rpa-breaks.md` explains the ladder and why the model is third.

Three example clients, all running against the **shipped legacy portal**:

- **Halden Timber** — enters the day's purchase orders into a supplier's ordering portal. High volume, correctable, and the portal has no idempotency support, so we build it.
- **Marisol Foods** — files a monthly regulatory return. A five-page wizard, a fifteen-minute session, and a submit that cannot be withdrawn.
- **Kestrel Clinic** — reads tomorrow's appointment list from a system with no export. Read-only, and every screen is full of patient data.

A feature works when it works for all three. Never special-case a client by slug.

Current step: `<N>` — update this line every step.

---

## The absolute rules

**Never point anything at a real third-party system.** Not a live site, not a sandbox with real
money, not a client's trial account, not "just to check". Every test and every flow runs against
the legacy portal in `docker-compose.yml`. This is not a preference.

**Never call the model before a locator has been tried.** The ladder is: semantic locator →
structural fallback → vision model → a person. Reaching for the model first is slower, costs
money per step, is non-deterministic, and — worst — hides the interface change that the locator
failure would have reported.

**Never absorb a rung-3 use silently.** Every fallback is reported. An interface changed, and
that is news. A rung-3 success becomes a committed locator fix, not a permanent arrangement.

**Never retry past a point of no return.** Marisol's confirm button files the return. Retry is
structurally refused past that step, not discouraged by convention.

---

## The mode contract

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, 5, **7**, **8**, **9**, **10**, **11**, **13**, **14**.

Tutor and reviewer: explain mechanisms and trade-offs, ask questions that expose gaps, review
against the step's rubric, point at the problem — never hand over the solution.

You may write: tests asked for by name, throwaway scripts, and configuration that is not the
subject of the step.

### `BUILD` steps

Steps 4, 6, 12, 15.

Generate freely: the Compose stack, the legacy portal fixture, the first read flow, the
scheduler, deploy. Then explain what you generated.

---

## The loop

`npm run verify` runs ESLint → `tsc --noEmit` → Vitest → the Playwright suite against both
portal versions → the ladder-order test.

```
npm run verify        # everything. the one you care about.
npm run test          # unit tests only
npm run e2e           # Playwright against the portal
npm run e2e:updated   # Playwright against the updated portal (from step 11)
npm run up            # PostgreSQL and the legacy portal
npm run flow -- <name> --dry   # run a flow in dry mode
npm run cost          # cost report (from step 13)
```

Never disable a check to make it pass.

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 on Node 24, `strict`, `any` banned |
| Browser | Playwright, Chromium, pinned with the image. Tracing on. |
| Locators | Role and accessible name first. Never generated ids, never long structural chains. |
| Model | `anthropic` SDK, rung 3 only, faked in tests, images masked before sending |
| Database | PostgreSQL 18 — runs, step results with the rung used, evidence, remote writes, interventions |
| Target | The shipped legacy portal. Always. |
| Testing | Vitest and Playwright against the portal, both versions from step 11 |
| Quality | ESLint + Prettier, `tsc --noEmit` |

**Never suggest:** driving the browser with a model as the primary strategy; a commercial RPA
suite as a dependency; captcha solving or circumventing an access control; a fixed-duration
sleep; `any`; running a flow against anything but the portal.

---

## Layout

```
src/
├── portal/         the legacy portal fixture (its own service)
├── locate/         the ladder: semantic, structural, vision, escalate
├── flows/          one module per client flow
├── ledger/         runs, step results, remote writes, interventions
├── evidence/       capture, masking, retention
├── schedule/       unattended runs, windows, locks, alerts
├── cost/           reports
└── support/        settings, logging, clock, ids
```

Flows never build locators inline — they ask the ladder. The ladder never knows which client it
is serving.

---

## Non-negotiable conventions

**Locating**
- Role and accessible name first, one recorded structural fallback second, the model third, a person fourth.
- The rung used is recorded on every step result.
- Every rung-3 use is reported with element, page and the locator that failed.
- No generated ids. No fixed-duration waits — wait for a condition.

**Writing**
- A natural key from the client's own data, recorded before submitting, enforced by a unique constraint.
- Check the ledger, then the remote system, then act, then verify by reading back.
- One retry on an unverified write, then stop and raise an intervention.
- Ambiguity — two matching records — always stops for a person.
- Every write flow has a dry mode that does everything except the write.

**Irreversible steps**
- The point of no return is named per flow and the irreversible step is last.
- Validate the summary field by field before confirming.
- Retry past the boundary is structurally refused.

**Evidence and privacy**
- Mask in the page before capture, including for traces and rung-3 images.
- Retention is set at capture, per client, enforced by a job.
- Credentials and page content never reach a log, a trace, an error message or the ledger.

**Politeness**
- Pacing, permitted hours and one session per account come from `docs/authorisation.md` and are enforced in code.
- Pacing is never reduced to save time.

**Cost**
- The dominant cost is human intervention. Interventions are recorded when they happen, including the short ones.
- The rung-3 rate is a monitored number and a leading indicator of drift.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.**
- **Say when you're unsure.**
- **Don't invent APIs.** Playwright's surface changes between versions.
- **No scope creep.** Don't add the ladder at step 6 or masking at step 7.
- **Never bypass a quality gate.**

---

## Code review

`docs/REVIEWER-PROMPT.md`. Load it with **the current step's rubric section only**.

---

## Evolution checkpoints

- [ ] **v1 — Step 4.** This template, placeholders filled, the four absolute rules, pointing at the step 0–3 documents.
- [ ] **v2 — Step 5.** Natural-key idempotency, the rung recorded on every step, masking at capture, no credentials or page content in logs.
- [ ] **v3 — Step 10.** The ladder order and its reporting rule, the point-of-no-return convention, and masking extended to traces and rung-3 images.

**At v3, reread v1.** The gap is a fair measure of what you learned.
