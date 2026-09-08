---
title: AGENTS.md Template
description: The v1 agent harness template for Conduit — copy it to your project root and fill in the placeholders.
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

Conduit — an integration hub joining the systems small businesses already run on.
PHP 8.5 + Laravel 13, PostgreSQL, Redis, Horizon.

We do not own any of the systems on the other side. They duplicate, they reorder, they
rate-limit, they go down, and sometimes they send nothing at all and that is the bug.

Three example businesses are seeded and used in every test. They disagree on purpose:

- **Meridian Print** — order webhook → invoice in accounting → WhatsApp confirmation. The simple case, done properly.
- **Harborline Supply** — three suppliers drop CSV files on SFTP overnight. No events; batch work that fails halfway and must resume.
- **Cedar & Co** — Stripe → accounting → Slack → client portal. Duplicate and out-of-order events, part payments, refunds weeks later, and money that must reconcile nightly.

A feature works when it works for all three. Never special-case a business or a connection by
slug or name.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension
matter more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 2, 3, 4, 5, **6**, **8**, **9**, 11, 12, 13, **15**, 17, **18**, **19**, and the runbook half of 21.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

You may write: tests the developer asks for by name, throwaway scripts that demonstrate a
behaviour, and configuration that is not the subject of the step.

### `BUILD` steps — pair or autonomous

Steps 0, 1, 7, 10, 14, 16, 20, and the deploy half of 21.

Generate freely. Scaffolding, config, queue wiring, Livewire screens. Then explain what you
generated so it is reviewed rather than absorbed.

---

## The loop

`make verify` is the single source of truth. It runs Pint (check) → Larastan → Pest → the
replay-safety sweep → frontend lint.

**Run it after every change. Do not report work as complete without a green run.**

```
make verify     # everything. the one you care about.
make fmt        # auto-fix formatting
make test       # tests only, faster iteration
make up         # start Docker dependencies
make down       # stop them
make work       # run a queue worker locally
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
| Queue | Redis 8 + Horizon, three named queues by priority |
| Storage | MinIO (S3-compatible) for archived payloads and ingested files |
| Inbound files | SFTP via Flysystem |
| Back-office | Blade + Livewire 4 + Tailwind 4 |
| Testing | Pest 4 against real PostgreSQL and real Redis; HTTP faked; clock frozen |
| Quality | Pint, Larastan level 8, Rector |

**Never suggest:** SQLite for tests or the array cache driver (steps 6, 11 and 12 depend on
real locking and real shared state); `env()` outside `config/`; a float column for money; an
HTTP call without an explicit timeout; a broker (Kafka, RabbitMQ) — Redis plus idempotency is
the exercise.

---

## Layout

```
app/
├── Connections/    the registry, per-connection config, health
├── Inbound/        receivers, signature verification, the message store
├── Pipeline/       jobs, retry policy, dead-letter, replay
├── Outbound/       HTTP adapters, throttling, circuit breaker
├── Batch/          scheduled pulls, file ingestion, quarantine
├── Ledger/         derived state, reconciliation
└── Support/        clock, correlation ids, structured logging
```

Adapters take and return plain value objects. No Eloquent models and no facades in their
signatures — they must be testable without a database.

---

## Non-negotiable conventions

**Delivery**
- At-least-once, everywhere. Every consumer is idempotent, without exception.
- The unique index is the deduplication mechanism. "Check then insert" is a race, not a check.
- Duplicates are recorded and counted, never silently dropped.
- Every new job class needs a runs-twice test, or the replay-safety sweep fails CI.

**Inbound**
- Verify, store raw, acknowledge. No work in the receiver.
- The stored payload is immutable and is the only thing replay reads from.
- Signature verification is over the raw body, with a timing-safe comparison and a replay window.

**Outbound**
- Every HTTP call has an explicit connect and read timeout. No exceptions.
- Every non-idempotent request carries an outbound idempotency key.
- Retries use exponential backoff with jitter and a hard ceiling, then dead-letter.
- Rate limits and circuit breakers live in Redis, never in process memory.

**Secrets**
- Credentials are encrypted at rest with a recorded key id.
- Jobs carry connection ids, never secrets. Job payloads are stored in plain text in Redis.
- Nothing secret reaches a log, an exception message, or an error tracker.

**Money and state**
- Integer minor units with an explicit currency. Never a float.
- State is derived from events, never a running total that events mutate.
- Arrival order is not event order. Any code that assumes it is, is wrong.
- A monetary discrepancy is never auto-corrected. It is reported.

**Operations**
- Every scheduled connection has a freshness expectation and an alert for silence.
- Every alert has a documented action. An alert nobody acts on is deleted.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** Laravel's surface changes between majors. If you're unsure a method exists in 13.x, say so rather than producing plausible code.
- **No scope creep.** Don't add a circuit breaker at step 8 or reconciliation at step 12. Later steps cover them deliberately.
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
- [ ] **v2 — Step 4.** The error model, the status-code table, and the rule that jobs carry ids and never secrets.
- [ ] **v3 — Step 6.** Idempotency as a rule rather than a habit: every consumer idempotent, every duplicate recorded, the unique index as the mechanism.
- [ ] **v3b — Step 9.** Replay is the recovery path; every new job class needs a runs-twice test or CI fails.
- [ ] **v4 — Step 17.** Queue names and priorities, freshness expectations per connection, and the rule that every alert has a documented action.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file couldn't be written well on day 1.
