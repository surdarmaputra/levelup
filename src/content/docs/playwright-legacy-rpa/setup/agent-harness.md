---
title: Agent Harness
description: Setting up AGENTS.md, the npm run verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 4.

Steps 0 to 3 need none of this. Do them first — and `docs/authorisation.md` from step 3 is the
one the harness most needs to point at.

## The goal, and the end state

```
your-project/
├── AGENTS.md          conventions, the four absolute rules, the mode contract
├── CLAUDE.md          symlink → AGENTS.md
├── package.json       scripts, including `verify`
├── tsconfig.json      strict
├── playwright.config.ts   tracing on, both portal versions from step 11
├── docker-compose.yml PostgreSQL 18 + the legacy portal
└── docs/
    ├── business-case.md    from step 0
    ├── how-rpa-breaks.md   from step 1 — the ladder and why the model is third
    ├── build-vs-buy.md     from step 2
    ├── authorisation.md    from step 3 — whose system, who authorised, how fast
    ├── REVIEWER-PROMPT.md
    └── adr/
```

You are done when:

- **`npm run verify` exits 0** on a clean tree — ESLint → `tsc --noEmit` → Vitest → Playwright —
  and non-zero when a lint error, a type error and a failing test are each introduced
  independently.
- **`any` is banned by a lint rule.** Everything read off a page is a string of unknown meaning.
- **Tracing is on** for every Playwright run from the first one.
- **`AGENTS.md` is v1 only**, containing the four absolute rules and pointers to the step 0–3
  documents.

Start from the [`AGENTS.md` template](../../reference/agents-template/).

Two checks arrive later — the ladder-order test at [step 7](../../roadmap/driving/) and the
two-portal suite at [step 11](../../roadmap/resilience/). Wire both commands now with
placeholders.

## Why

**The loop matters more than the file.** But this project has two harness problems that are
specific to it.

**An agent will suggest pointing at a real site.** It is the natural thing to suggest — "let's
try it against the actual portal" — and it is the one thing that must never happen in a learning
project. `docs/authorisation.md` plus an absolute rule in `AGENTS.md` is what stops it, and it
needs to be there before the first flow, not after.

**An agent will reach for the model first.** Asking a vision model to find a button is one
function call and it works immediately. Building a semantic locator with a recorded structural
fallback is more thought for the same visible result today — and it is the difference between a
bot that costs nothing to run and tells you when the interface moved, and one that is slow,
expensive and blind. An agent has no way to know that unless the file says so, so the ladder and
its ordering go in `AGENTS.md` in plain words.

## How

**1. Do steps 0 to 3 first.**

**2. Copy the [template](../../reference/agents-template/)**, fill the placeholders, symlink
`CLAUDE.md`.

**3. Write the four absolute rules in, near the top.** Never a real third-party system. Never the
model before a locator. Never a silent rung-3 use. Never a retry past a point of no return.

**4. Fill in the mode contract honestly.** Steps 7, 8, 9, 10, 11, 13 and 14 are `LEARN`. The
ladder and idempotency-without-server-support are the two where a plausible wrong implementation
is most likely.

**5. Build `npm run verify` before any flow.** Lint, types, unit tests, Playwright. One command.

**6. Turn tracing on now.** It is your debugger today and your audit evidence at step 12. Turning
it on later means the early runs are unreconstructable, which is exactly when you most want to
look.

**7. Ban `any`.** Everything a page returns is a string whose meaning you have to establish.

**8. Update the file at the three checkpoints**, not continuously.
