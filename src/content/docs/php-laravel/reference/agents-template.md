---
title: AGENTS.md Template
description: The v1 agent harness template for Bookline — copy it to your project root and fill in the placeholders.
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

Bookline — a multi-tenant booking and scheduling platform for service businesses.
PHP 8.5 + Laravel 13, PostgreSQL, Redis.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension
matter more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 2, 3, 4, **6**, **7**, 9, **10**, 11, **12**, 13, **15**, 16, 17, 21, 22.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

You may write: tests the developer asks for by name, throwaway scripts that demonstrate a
behaviour, and configuration that is not the subject of the step.

### `BUILD` steps — pair or autonomous

Steps 0, 1, 5, 8, 14, 18, 19, 20, 23.

Generate freely. Scaffolding, config, components, wiring, boilerplate. Then explain what you
generated so it is reviewed rather than absorbed.

---

## The loop

`make verify` is the single source of truth. It runs Pint (check) → Larastan → Pest → the
tenancy leak sweep → frontend lint.

**Run it after every change. Do not report work as complete without a green run.**

```
make verify     # everything. the one you care about.
make fmt        # auto-fix formatting
make test       # tests only, faster iteration
make up         # start Docker dependencies
make down       # stop them
```

If `make verify` fails, fix it before continuing. Never disable a check to make it pass — if a
rule seems wrong, raise it, don't route around it. A gate that gets bypassed once gets bypassed
always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | PHP 8.5, `declare(strict_types=1)` in every file |
| Framework | Laravel 13.x |
| Database | PostgreSQL 17, framework migrations |
| Cache / queue | Redis 8, Horizon from step 18 |
| Back-office | Blade + Livewire 4 + Tailwind 4 |
| Public booking | Inertia 2 + React 19 + TypeScript strict + Vite |
| Realtime | Laravel Reverb |
| Payments | Cashier (platform subscriptions), Stripe PHP SDK (tenant deposits) |
| Testing | Pest 4 against real PostgreSQL |
| Quality | Pint, Larastan level 8, Rector |

**Never suggest:** SQLite for tests (no `timestamptz`, no `EXCLUDE`, different locking);
`env()` outside `config/`; a float or decimal column for money; a tenancy package before
step 22 — the hand-rolled version is the exercise.

---

## Layout

```
app/
├── Tenancy/        tenant model, resolution middleware, scoping trait
├── Scheduling/     services, staff, working hours, the availability engine
├── Booking/        bookings, holds, state transitions, events
├── Billing/        subscriptions, deposits, payment adapters
├── Identity/       users, memberships, policies
└── Support/        errors, clock, shared value objects
```

The availability engine takes and returns plain value objects. No Eloquent models, no facades
in its signature — it must be testable without a database.

---

## Non-negotiable conventions

**Tenancy**
- Every tenant-owned model uses the `BelongsToTenant` trait. No exceptions, and the leak sweep enforces it.
- Every unique index on a tenant-owned table includes `tenant_id`.
- Every cache key, storage path and broadcast channel name includes the tenant.
- Every queued job carries the tenant id and establishes context through the job middleware.
- No current tenant means throw. Never fall back to "all tenants".
- Raw SQL and `DB::table()` need an explicit tenant condition and a comment saying why they exist.

**Time**
- Store instants in UTC in `timestamptz` columns. Render in the tenant's timezone.
- No `now()` in domain code — inject the clock so tests can freeze it.
- Weekly rules are local wall-clock rules, not fixed offsets.

**Money**
- Integer minor units with an explicit currency. Never a float.
- External charges happen outside database transactions, and are compensated by a recorded refund.

**Booking**
- Slot-taking is transactional and backed by the exclusion constraint. No other code path creates a booking.
- Booking state changes only through transition methods on the aggregate.

**API**
- Errors are RFC 9457 problem details, one shape everywhere.
- Controllers return resources, never models.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** Laravel's surface changes between majors. If you're unsure a method exists in 13.x, say so rather than producing plausible code.
- **No scope creep.** Don't add caching at step 9 or Connect at step 16. Later steps cover them deliberately.
- **Never bypass a quality gate.** No baseline entries, no `--no-verify`, no ignored Larastan errors, without explicit discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. Read them before proposing anything structural —
several were made deliberately and against the obvious default.

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
- [ ] **v2 — Step 4.** The error model, the role enum, and the rule that authorisation lives in policies.
- [ ] **v3 — Step 6.** The tenancy rules above, written as rules rather than as habits — every model gets the trait, every unique index carries `tenant_id`, raw queries need a justification.
- [ ] **v3b — Step 12.** Slot-taking is transactional and constraint-backed; no other path creates a booking.
- [ ] **v4 — Step 18.** Queue names and priorities, the rule that every job is idempotent and carries tenant context, and the deploy drain sequence.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file couldn't be written well on day 1.
