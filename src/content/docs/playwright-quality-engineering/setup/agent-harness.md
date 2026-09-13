---
title: Agent Harness
description: Setting up AGENTS.md, the npm run verify loop, and the LEARN/BUILD mode contract for a project whose deliverable is the tests.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 4.

Steps 0 to 3 need none of this. Do them first — and `docs/test-strategy.md` from step 1 is the
one the harness most needs to point at.

## The goal, and the end state

```
your-project/
├── AGENTS.md          conventions, the four absolute rules, the mode contract
├── CLAUDE.md          symlink → AGENTS.md
├── package.json       scripts, including `verify`
├── tsconfig.json      strict
├── playwright.config.ts   three projects, traces on, the reporter
├── docker-compose.yml the three products, PostgreSQL 18, a broker, the stubs
├── defects.md         the defect catalogue — ID, product, symptom. Never the cause.
└── docs/
    ├── risk-model.md          from step 0
    ├── test-strategy.md       from step 1 — what is tested where, and what is not
    ├── test-data.md           from step 2 — where data comes from, and what is forbidden
    ├── release-readiness.md   from step 3 — what blocks a release
    ├── REVIEWER-PROMPT.md
    └── adr/
```

You are done when:

- **`npm run verify` exits 0** on a clean tree — ESLint → `tsc --noEmit` → unit tests → the
  Playwright suite — and non-zero when a lint error, a type error and a failing test are each
  introduced independently.
- **`any` is banned by a lint rule, in the test code too.** A helper that accepts anything will
  accept the wrong shape and pass.
- **`waitForTimeout` and bare `setTimeout` are banned by a lint rule.** Day one, not step 10.
- **Traces are on** for every run from the first one.
- **`npm run defects -- <ID>`** switches one catalogue defect on and runs the suite against it.
- **`AGENTS.md` is v1 only**, containing the four absolute rules and pointers to the step 0–3
  documents.

Start from the [`AGENTS.md` template](../../reference/agents-template/).

Three checks arrive later — the shuffled independence run at [step 6](../../roadmap/foundations/),
the repeat run at [step 10](../../roadmap/depth/), and the runtime budget at
[step 15](../../roadmap/release/). Wire the commands now with placeholders.

## Why

**The loop matters more than the file.** But this project has two harness problems that are
specific to it.

**An agent writes tests that pass.** That is what it is optimising for, and it is the exact
failure mode of the whole discipline. Asked for a checkout test, it will assert that a
confirmation page appeared — which passes with the total a penny wrong, which is
`TRAIL-DISCOUNT-ROUNDING`, which is in the catalogue for this reason. The rule that an assertion
names the value has to be in the file, in plain words, because nothing in the code says it.

**An agent fixes intermittent failures with retries and waits.** Both make the test green, which
looks like success, and both destroy the thing that made the test worth having. A retry hides a
race condition; a wait hides the timing problem and slows every run forever. `AGENTS.md` has to
say that an intermittent failure is a diagnosis owed, and name the six causes so the agent has
somewhere to go instead.

There is a third, smaller one: an agent will offer to copy production data to make a test
realistic. The rule in `docs/test-data.md` and an absolute rule in `AGENTS.md` is what stops it,
and it needs to be there before the first factory, not after.

## How

**1. Do steps 0 to 3 first.**

**2. Copy the [template](../../reference/agents-template/)**, fill the placeholders, symlink
`CLAUDE.md`.

**3. Write the four absolute rules in, near the top.** Never production data. Never a duration
wait. Never a retry as a flake fix. Never assert a page where the value is the point.

**4. Fill in the mode contract honestly.** Steps 6, 8, 9, 10, 13 and 16 are `LEARN`. Test
architecture, asynchronous assertions and flake diagnosis are where a plausible wrong answer is
most likely and most expensive.

**5. Build `npm run verify` before the first test.** Lint, types, unit, suite. One command.

**6. Write the defect catalogue by symptom only.** If the file says *"the multi-item discount
rounds down instead of to nearest"*, you will write the test from the sentence. If it says
*"a customer's total can be a penny out"*, you have to find it. The second one teaches; keep the
cause in the product code where you will not read it.

**7. Ban the sleep now.** It costs one config line today and a hundred rewritten tests at step 10.

**8. Update the file at the three checkpoints**, not continuously.
