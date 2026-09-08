---
title: AGENTS.md Template
description: The v1 agent harness template for Antar — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 0](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 0.** Copy it to your repo root and fill the `<>` placeholders.
> Symlink it so every tool finds it: `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v4) are at the bottom. Tick them off as you reach those steps.
> **Do not write v4 on day 1.** You don't yet know your own conventions, and a harness full of
> guessed rules is worse than a short honest one.

---

## Project

Antar — a last-mile delivery dispatch platform. Merchants place orders, couriers deliver them,
customers watch them arrive. TypeScript on Node 24, AdonisJS 7, PostgreSQL with PostGIS, Redis.

Three example merchants are seeded and used in every test. They disagree on purpose:

- **Warung Pak Budi** — a food stall. One item per order, 15 minutes prep, a 3 km radius, cash accepted at the door
- **Sehat Pharmacy** — prescription items needing an ID check and a signature, cold-chain items with a 30-minute limit in transit, and items only a verified courier may carry
- **Atlas Hardware** — bulky goods: one order, three drop-offs, a van and two couriers, booked into a two-hour window tomorrow

A feature works when it works for all three. Never special-case a merchant by slug or name.
What looks like a merchant rule is a requirement on the item or a policy row on the merchant.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension matter
more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 2, 3, 4, **5**, 7, **8**, 9, **10**, **12**, **14**, 15, **16**, 20, 22.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

You may write: tests the developer asks for by name, throwaway scripts that demonstrate a
behaviour, and configuration that is not the subject of the step.

### `BUILD` steps — pair or autonomous

Steps 0, 1, 6, 11, 13, 17, 18, 19, 21, 23.

Generate freely. Scaffolding, config, components, wiring, boilerplate. Then explain what you
generated so it is reviewed rather than absorbed.

---

## The loop

`npm run verify` is the single source of truth. It runs Prettier (check) → ESLint →
`tsc --noEmit` → Japa → the dispatch invariant sweep.

**Run it after every change. Do not report work as complete without a green run.**

```
npm run verify     # everything. the one you care about.
npm run fmt        # auto-fix formatting
npm run test       # tests only, faster iteration
npm run worker     # the queue worker
```

If `npm run verify` fails, fix it before continuing. Never disable a check to make it pass — if
a rule seems wrong, raise it, don't route around it. A gate that gets bypassed once gets
bypassed always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 strict, `noUncheckedIndexedAccess` on, ES modules |
| Runtime | Node 24 |
| Framework | AdonisJS 7.x |
| Database | PostgreSQL 17 with PostGIS, Lucid migrations, generated schema classes committed |
| Cache / queue | Redis 8 — `@adonisjs/cache` (memory L1 + Redis L2), `@adonisjs/queue` |
| Realtime | `@adonisjs/transmit` with the Redis transport |
| Ops console | Edge + Vite + Tailwind 4 |
| Customer surface | Inertia 2 + React 19 + TypeScript |
| Payments | Stripe SDK; a local append-only ledger for payouts and commission |
| Testing | Japa against real PostgreSQL with PostGIS |
| Quality | Prettier, ESLint, `tsc --noEmit` |

**Never suggest:** SQLite for tests (no geography type, no `SKIP LOCKED`, different locking);
`process.env` read outside the typed env; a float or decimal column for money; two float columns
instead of a geography point; a state-machine or dispatch package — writing both is the exercise.

---

## Layout

```
app/
├── orders/       orders, items, handling requirements
├── dispatch/     jobs, stops, state machine, the dispatch engine, assignment
├── couriers/     couriers, shifts, capabilities, location pings
├── billing/      payments, refunds, the ledger
├── identity/     users, memberships, policies
└── shared/       errors, clock, money, geo value objects
```

The dispatch engine takes and returns plain value objects. No models, no database calls, no
clock reads in its signature — it must be testable with no database at all.

---

## Non-negotiable conventions

**State**
- The job state column is written only by transition methods on the aggregate. Nothing else.
- An illegal transition throws. An update that matches zero rows is not an error the caller sees.
- `JobEvent` rows are append-only. A correction is a new row.

**Concurrency**
- Assignment happens in one transaction, behind a database constraint that makes a second assignment impossible.
- Never `SELECT` to check availability and then `INSERT`. The gap is the bug.
- Concurrency tests use real parallel processes against one database.

**Idempotency**
- Every mutating courier and webhook endpoint takes an idempotency key, stored with a unique constraint.
- Every queued job is safe to run twice, and says why in a comment at the top of the class.
- Jobs carry ids in their payload, never serialized models.

**Time**
- Store instants in UTC in `timestamptz`. Render in the merchant's timezone.
- No direct clock reads in domain code — inject the clock so tests can freeze it.
- A promised time is computed once at dispatch and recorded. Never recomputed for display.

**Money**
- Integer minor units with an explicit currency. Never a float.
- The ledger is append-only, entries balance to zero, and every posting carries an idempotency key.
- External charges happen outside database transactions, and are compensated by a recorded refund.

**API**
- Errors are RFC 9457 problem details, one shape everywhere.
- Controllers return serialized shapes, never models.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** The AdonisJS surface changed between v6 and v7, and some packages are experimental. If you're unsure a method exists, say so rather than producing plausible code.
- **No scope creep.** Don't add caching at step 7 or regions at step 12. Later steps cover them deliberately.
- **Never bypass a quality gate.** No `--no-verify`, no ignored type errors, no skipped tests, without explicit discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. Read them before proposing anything structural —
several were made deliberately and against the obvious default, including the queue choice.

When a decision is made in conversation, offer to record it as an ADR. Undocumented decisions
get silently reversed three steps later.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. It is the source of truth for review
behaviour — this file does not duplicate it.

To review: load that prompt, the current step's section from `docs/RUBRICS.md`, and the code.
**Only the current step's rubric.** Loading the whole file leaks later steps and produces
off-scope findings.

---

## Evolution checkpoints

Update this file at these points. Each is a roadmap step's "harness impact" note.

- [ ] **v1 — Step 0.** This template, placeholders filled.
- [ ] **v2 — Step 4.** The error model, the role enum, and the rule that authorization lives in policies and abilities.
- [ ] **v3 — Step 8.** The concurrency rules above, written as rules rather than as habits — one transaction, one constraint, no check-then-write, and no second assignment path.
- [ ] **v3b — Step 16.** Money is integer minor units, the ledger is append-only, every posting carries an idempotency key.
- [ ] **v4 — Step 23.** The process roles (web, worker, scheduler), queue names, the drain sequence, and the expand/contract migration rule.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file couldn't be written well on day 1.
