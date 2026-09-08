---
title: Roadmap Overview
description: Locked decisions, the message model, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | You have shipped a Laravel application before. Comfortable with Eloquent, routes and basic jobs. |
| Language / runtime | PHP 8.5, `declare(strict_types=1)` everywhere |
| Framework | Laravel 13.x |
| Domain | Conduit — an integration hub joining the systems a small business already runs on |
| Delivery guarantee | At-least-once, everywhere. Every consumer is idempotent. Exactly-once is not offered by anyone and is not attempted here. |
| Message store | Every inbound payload is persisted raw before anything reads it. Replay comes from that store, never from the sender. |
| Queues | Redis 8 + Horizon from step 7. Database queue only for step 0–6 local work. |
| Scheduling | Laravel's scheduler with a single-server lock; no `cron` entries per job |
| Outbound HTTP | Laravel's HTTP client with explicit timeouts on every call. No default timeouts, ever. |
| Retry policy | Exponential backoff **with jitter**, a per-connection cap, then dead-letter. Never infinite. |
| Secrets | Per-connection credentials encrypted at rest, decrypted only inside the adapter that uses them, never logged |
| Infrastructure | PostgreSQL 17, Redis 8, MinIO (S3-compatible), an SFTP container, Mailpit, Docker Compose |
| Back-office | Blade + Livewire 4 + Tailwind 4 — the ops console, the quarantine review screen, the replay button |
| Testing | Pest 4 against real PostgreSQL and real Redis. HTTP faked; time frozen. Tests gate every step. |
| Quality | Pint (format), Larastan level 8, Rector, a replay-safety sweep in CI. One formatter, one static analyser. |
| Ops | Docker Compose → single VPS behind nginx, two worker pools, alerts to a real inbox |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** the roadmap is 22 numbered steps, 0 through 21. Step 19
(reconciliation) gets its own slot rather than being folded into the money step, because
reconciliation is what tells you the money step was wrong.

---

## Why this domain

An integration hub was chosen because it *forces* the reliability topics rather than
decorating with them:

- **You do not own the other side** → timeouts, backoff, circuit breakers, and rate limits that respect somebody else's budget
- **Every message may be delivered twice** → idempotency keys, dedupe windows, and consumers that are safe to run again
- **Events arrive in the wrong order** → state derived from events instead of counters incremented in place
- **Batch work fails halfway** → per-row resume, quarantine, and a human review path
- **Nothing happens on a page load** → queues, schedules, and the fact that silence is a failure mode
- **The numbers must agree** → reconciliation as a scheduled job, and drift as a number you watch

A CRUD app cannot teach these. Any retry logic you added to one would be for show, because
nothing would ever fail.

---

## The three example businesses

Every step is written against the same three businesses. Seed them in step 2 and keep them for
the rest of the roadmap — they disagree with each other on purpose, and an integration that
works for all three is an integration that works.

| Business | Setup | The rule it exists to break |
|---|---|---|
| **Meridian Print** `meridian` | Website order webhook → invoice in the accounting system → WhatsApp confirmation. Roughly 40 orders a day, one connection each way. | The simple case. Event-driven, at-least-once, one path. If a duplicate order creates two invoices here, nothing later matters. |
| **Harborline Supply** `harborline` | Three suppliers drop a stock-and-price CSV on SFTP between 01:00 and 04:00. Files are 5,000–8,000 rows, occasionally truncated, and one supplier quotes prices in a different currency. | There is no event. Work is scheduled, not triggered; failure is partial, not total; and a supplier who sends nothing at all must raise an alarm rather than pass silently. |
| **Cedar & Co** `cedar` | Stripe → accounting → Slack → a client portal. Invoices are part-paid, refunded weeks later, and the provider retries aggressively during its own incidents. | The events lie. Duplicates, out-of-order arrival, and money that must still reconcile to the penny at 23:00 whatever order the events came in. |

Concrete questions to keep asking as you build: if Meridian's order webhook is delivered three
times, how many invoices exist? If Harborline's file breaks at row 4,812, what does tomorrow's
run do with rows 1–4,811? If Cedar's `invoice.paid` arrives before `invoice.created`, what is
the invoice's balance?

None of the three may ever be special-cased in code. If you find yourself writing
`if ($connection->slug === 'harborline')`, the model is wrong, not the connection.

---

## The message model (target state)

Everything in this system is one shape: something arrived, we recorded it, we tried to act on
it, and we can say what happened.

```
Business ──has──> Connection (a system we talk to, with credentials + config)
                      │
                      ├──receives──> InboundMessage (raw payload, signature, dedupe key)
                      │                    │
                      │                    └──produces──> Delivery (one attempt at one target)
                      │                                        │
                      │                                        ├──> Attempt (n, status, error, timing)
                      │                                        └──> DeadLetter (exhausted, replayable)
                      │
                      ├──runs──> Run (one scheduled pull or file ingestion)
                      │              │
                      │              ├──> RunRow (per-row result: applied | skipped | quarantined)
                      │              └──> Quarantine (a row a human must fix)
                      │
                      └──emits──> Signal (freshness, drift, queue depth — what alerting reads)
```

Two words that look alike and are not:

- an **InboundMessage** is what somebody sent us. It is immutable, stored raw, and is the only
  thing we replay from.
- a **Delivery** is one attempt to do something about it. Deliveries are retried, dead-lettered
  and replayed. Messages are not.

Keeping those separate is what makes replay possible. If you process a payload and throw it
away, a bug found on Thursday can never be fixed for Tuesday's traffic.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each one at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, static analysis, tests, in one command | 0 | Everything below, in one place |
| Laravel Pint | 0 | Formatting arguments |
| Larastan level 8 | 0 | Type errors, undefined properties, wrong Eloquent return types |
| Pest against real PostgreSQL and Redis | 2 | Locking, `SKIP LOCKED`, unique-violation behaviour and queue semantics that fakes hide |
| The replay-safety sweep | 9 | Any queued job whose class is not covered by a "runs twice, same result" test |
| A no-secrets-in-logs test | 4 | A credential, token or full payload reaching the log channel |
| Rector, dry-run in CI | 3 | Dead code and outdated idioms after a framework upgrade |
| CI on every push | 0 | The above, on a machine that is not yours |

The replay-safety sweep is the one that matters most. It walks every queueable job class,
asserts each is covered by a test that runs it twice with the same input and asserts the same
end state, and fails when a new job is added without one. Adding a job without that test must
fail CI.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Two things to keep in mind while
working through them:

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. Idempotency, retry policy, out-of-order handling and reconciliation all
*look* correct in a generated diff and are wrong in ways you only find during somebody else's
outage.

**Step 19 is not optional.** Reconciliation is the step that tells you whether steps 5 to 18
actually worked. Skipping it means believing your own system, which is exactly the habit this
material exists to break.
