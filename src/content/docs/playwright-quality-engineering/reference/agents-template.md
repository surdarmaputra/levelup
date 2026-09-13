---
title: AGENTS.md Template
description: The v1 agent harness template for the quality system — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Fill the `<>` placeholders and symlink it:
> `ln -s AGENTS.md CLAUDE.md`

---

## Project

The quality system for three products that ship from one pipeline: a strategy that says what is
tested, a suite proven against a defect catalogue, a pipeline inside a runtime budget, and a gate
that blocks a release for a stated reason.
TypeScript on Node 24, Playwright for browser and API tests, k6 for performance, GitHub Actions.

**Read `docs/test-strategy.md` before suggesting a test.** It says what is tested at which level
and why, and every test references a risk ID from `docs/risk-model.md`.
`docs/test-data.md` says where data comes from. `docs/release-readiness.md` says what blocks a
release.

Three products under test, all in the shipped Compose stack:

- **Trailhead Outfitters** `trailhead` — an outdoor gear storefront. High volume, real screens, money a customer notices within minutes.
- **Beechwood Health** `beechwood` — a patient portal. No production data ever, accessibility is a legal requirement, and a release needs evidence a person signs.
- **Polaris Freight** `polaris` — a dispatch service with no user interface. Events, carriers, duplicate webhooks and a 16:00 cut-off.

A practice works when it works for all three. Never branch on the product inside a helper.

Current step: `<N>` — update this line every step.

---

## The absolute rules

**Never copy production data into a test environment.** Not anonymised, not "just the schema with
a few real rows", not for one debugging session. Data is manufactured by the factories.
`docs/test-data.md` says how, per product.

**Never wait for a duration.** Wait for a condition with a stated deadline. `waitForTimeout` and
bare `setTimeout` are banned by a lint rule. This is the largest single cause of flake and it is
never the right fix.

**Never fix an intermittent failure with a retry.** An intermittent failure is a diagnosis owed:
shared state, a duration wait, real time, ordering, focus timing, or a genuine race in the
product. Retries hide the last one, which is the expensive one.

**Never assert that a page is visible when the value is what matters.** A confirmation screen
appears with a wrong total. The assertion is the total.

---

## The mode contract

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, 6, **8**, **9**, **10**, 12, 13, 16.

Tutor and reviewer: explain mechanisms and trade-offs, ask questions that expose gaps, review
against the step's rubric, point at the problem — never hand over the solution.

You may write: tests asked for by name, throwaway scripts, and configuration that is not the
subject of the step.

### `BUILD` steps

Steps 4, 5, 7, 11, 14, 15, 17.

Generate freely: the Compose stack, the defect catalogue, the fixtures, the API suite, the
accessibility checks, the permission matrix, the pipeline, the synthetic checks. Then explain what
you generated.

---

## The loop

`npm run verify` runs ESLint → `tsc --noEmit` → unit tests → the Playwright suite.

```
npm run verify           # everything. the one you care about.
npm run test:fast        # the local subset: unit, contract, API
npm run test:ui          # browser journeys
npm run test:shuffle     # full parallel, shuffled — the independence run
npm run test:repeat      # the flake detector (from step 10)
npm run defects -- <ID>  # run the suite with a catalogue defect switched on
npm run detection        # detection rate across the whole catalogue (from step 16)
npm run perf             # k6 scenarios (from step 13)
npm run up               # the three products, database, broker, stubs
```

Never disable a check to make it pass. Never quarantine a test to make the pipeline green.

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 on Node 24, `strict`, `any` banned — in the test code too |
| Runner | Playwright for browser and API tests, one project per product |
| Contracts | Consumer-driven, verified in CI on both sides. Stubs are generated from contracts. |
| Async | Bounded polling with a stated deadline; a clock the test controls |
| Data | Seeded factories, per-worker namespaces, cleanup that survives a crash |
| Accessibility | `axe-core` in the suite against a recorded baseline, plus a documented manual pass |
| Performance | k6, thresholds on p95 and error rate |
| Pipeline | GitHub Actions — fail-fast stages, duration-balanced shards, merged report, required checks |
| Proof | The defect catalogue. Detection rate, not line coverage. |

**Never suggest:** a production data copy; a fixed sleep; a retry as a flake fix; a second test
runner; line coverage as a quality metric; a shared mutable fixture file; skipping a test to
unblock a release.

---

## Layout

```
tests/
├── fixtures/       per-worker data, authenticated contexts, the clock
├── factories/      seeded generators, one per entity
├── screens/        screen abstractions — Trailhead and Beechwood only
├── clients/        typed service clients — all three products
├── journeys/       browser tests, few and deliberate
├── api/            the bulk of the suite
├── contracts/      consumer expectations and provider verification
├── a11y/           accessibility checks and the baseline
├── permissions/    the generated role matrix
└── support/        bounded waits, assertions, reporting
perf/               k6 scenarios and workload models
docs/               risk model, strategy, test data, readiness, runbook
```

Journeys never build locators inline — they ask a screen. Screens never assert business rules.

---

## Non-negotiable conventions

**Tests**
- Every test references a risk ID. A test that points at nothing is deleted or the risk is missing.
- One journey, one question. Arithmetic, validation and permissions are API-level.
- Assertions name the value. Failure messages say what broke, for someone who did not write it.
- Tests are independent. The shuffled parallel run is part of CI, not an occasional check.

**Data**
- Factories only. Per-worker namespaces. Seeded randomness. Cleanup after a crash.
- Beechwood's data is manufactured to look like patient data and is treated as if it were.

**Asynchronous work**
- Bounded polling, stated deadline, failure message containing the last observed state.
- Absence is asserted with a settling condition, never a sleep.
- Duplicate and out-of-order delivery are tested deliberately for Polaris.

**Flake**
- A flaky test is a defect with an owner and an expiry date.
- Quarantine removes it from the gate and makes it visible in the report.
- A permitted retry is reported as a flake, never counted as a pass.

**Evidence**
- Traces on failure, artefacts retained per the retention rule, and the release record generated.
- Screenshots and traces hold whatever was on screen — same access rules as the data.

**The gate**
- Only conditions in `docs/release-readiness.md` block. Nothing is invented in the pipeline.
- An accepted failure is recorded with who accepted it.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.**
- **Say when you're unsure.**
- **Don't invent APIs.** Playwright's surface changes between versions.
- **No scope creep.** Don't add contract tests at step 7 or the gate at step 11.
- **Never bypass a quality gate.**

---

## Code review

`docs/REVIEWER-PROMPT.md`. Load it with **the current step's rubric section only**.

---

## Evolution checkpoints

- [ ] **v1 — Step 4.** This template, placeholders filled, the four absolute rules, pointing at the step 0–3 documents.
- [ ] **v2 — Step 7.** The level rule, the factory rule, and every test referencing a risk ID.
- [ ] **v3 — Step 10.** The flake policy in full: detection, triage, the six causes, and when a retry is permitted.

**At v3, reread v1.** The gap is a fair measure of what you learned.
