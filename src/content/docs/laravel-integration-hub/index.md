---
title: Getting Started
description: A guided path from "I can build a Laravel app" to the integration work businesses pay a retainer for — webhooks that arrive twice, supplier files that arrive half-written, and money that has to reconcile.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I can build a Laravel app"* to the work that keeps paying after launch —
built around one real domain: **Conduit**, the integration hub a small business runs its
operations on, joining the systems it already uses and does not control, on PHP 8.5 and
Laravel 13.

Twenty-two steps. There's no deadline on any of it — take a step in an evening or over two
weeks. The order matters, the pace doesn't.

## Who this is for

- You have built at least one Laravel application end to end — routes, Eloquent, jobs, tests
- Comfortable with SQL, HTTP, a terminal, and git; Docker installed
- You have hit a webhook, a cron job, or a third-party API in anger at least once

**Not assumed:** queues beyond `dispatch()`, Horizon, idempotency, retry policy, circuit
breakers, SFTP ingestion, reconciliation, or any of the words in the paragraph above.

This material starts where a first Laravel roadmap ends. If you are new to Laravel, work
through [Laravel — Multi-Tenant Booking SaaS](../laravel-booking-saas/) first and come back;
the two share a stack on purpose, so nothing here will be spent re-learning Eloquent.

**If you have done [Go — Webhook Delivery Platform](../go-webhook-delivery/), read this
first.** The two materials share a core — idempotency, retry with backoff, dead-letter and
replay, rate limiting, circuit breaking — because those are the same problems on both sides of
a webhook. They are not the same material. That one builds the platform that *sends* events to
servers it does not control; this one builds the hub that *receives* them from systems it does
not control, and then does the work that has no webhook at all:

| Only there | Shared | Only here |
|---|---|---|
| Learning Go; ordered delivery and what it costs; running a multi-tenant delivery platform; the subscriber-facing dashboard | Idempotency · retry and backoff · dead-letter and replay · rate limits · circuit breaking | Scheduled batch and SFTP ingestion that resumes mid-file · mapping and schema drift · quarantine with a human review screen · freshness and silence detection · out-of-order money events · nightly reconciliation |

Roughly five of these twenty-two steps will feel familiar. Work them anyway — the same
mechanism fails differently when you are the receiver — or skim them and spend the time on
steps 13 to 19, which have no equivalent there.

## What you are building, concretely

Conduit sits between the systems a business already pays for. Orders arrive from one place,
invoices belong in another, stock lives in a third, and somebody has to be told when any of it
fails. You own none of those systems. They rate-limit you, they send the same event twice, they
send events out of order, and sometimes they send nothing at all and that is the bug.

Three businesses are used as the running examples all the way through the roadmap. They were
picked because they disagree with each other on exactly the points that are hard to build:

| The business | What it connects | What it forces you to handle |
|---|---|---|
| **Meridian Print** — a print shop | Website order form → invoice in the accounting system → WhatsApp confirmation to the customer | The simple case, done properly: receive a webhook, acknowledge it fast, do the work once even when it arrives twice, and retry the parts that fail |
| **Harborline Supply** — a wholesaler | Three suppliers drop stock and price files on SFTP overnight; the catalogue must match by morning | There is no webhook. Work is batch, on a schedule, and fails *halfway* — a file of 8,000 rows with a broken row at 4,812 must resume, not restart, and the rows it rejects need somewhere to go and someone to fix them |
| **Cedar & Co** — a design agency | Stripe → accounting → Slack → the client portal; refunds and part payments arrive days later | The events lie. They duplicate, they arrive out of order, and the money has to add up at the end of the day whatever order they came in |

Same code, same queue, three businesses whose integrations do not agree. That is the whole
exercise: one system, configured per connection, and never a line of
`if ($connection->slug === …)`.

Three questions to keep asking as you build: what happens if this webhook is delivered twice?
what happens if it never arrives at all? and if this job runs halfway and dies, what does the
next run see?

Other businesses in this shape, if you want to point your own version at one: clinics syncing
appointments to accounting, schools moving enrolment into a billing system, importers
reconciling shipping manifests, franchises rolling up daily sales, agencies pushing time
tracking into invoices, retailers syncing one catalogue to three marketplaces. All of them own
none of the systems they depend on, and all of them are somebody's paying customer today.

## Why an integration hub

Most Laravel material builds a new application where you control every table. Real paid work is
usually the opposite: the systems already exist, they are somebody else's, and your job is to
make them agree. This domain was chosen because the hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| The same webhook is delivered twice, or fifty times during someone else's outage | Idempotency keys, deduplication windows, and why "check then insert" is a bug |
| A payment provider sends `invoice.paid` before `invoice.created` | Deriving state from events instead of incrementing counters, and out-of-order tolerance |
| A supplier's nightly file is half-written when you read it, and one row in it is malformed | Batch processing that resumes per row, quarantine tables, and a screen where a non-developer fixes the bad rows |
| The third-party API is down, slow, or rate-limiting you | Timeouts, backoff, circuit breakers, and per-connection rate limits that respect *their* budget, not yours |
| A queue worker dies mid-job at 03:00 | At-least-once delivery, jobs safe to run twice, dead-letter handling, and poison messages that must not block the queue |
| Nobody notices when an integration quietly stops | Freshness checks, staleness alerts, and the difference between "no errors" and "working" |
| The numbers in two systems disagree by 40,000 | Reconciliation as a scheduled job, drift as a metric, and an answer to "which one is right" |

You cannot fake a reconciliation. Either your daily job reports zero drift against the payment
provider, or it reports a number, and the number is how much of somebody's money you have lost
track of.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | PHP 8.5, Composer, strict types |
| Framework | Laravel 13 — container, providers, events, jobs, scheduling |
| Persistence | Eloquent, migrations, PostgreSQL 17, partial and expression indexes, `SKIP LOCKED` |
| Queues | Redis 8, Horizon, batches, chains, unique jobs, rate-limited jobs, failed-job policy |
| Reliability | Idempotency keys, deduplication, retry with jitter, circuit breaking, dead-letter and replay |
| Inbound | Signed webhooks, fast acknowledgement, raw-payload capture, replay from stored payloads |
| Outbound | Laravel HTTP client, timeouts, per-connection throttling, outbound idempotency keys |
| Batch | Scheduled pulls, SFTP and CSV ingestion, per-row resume, quarantine and review |
| Secrets | Encrypted per-connection credentials, key rotation, and what never goes in a log |
| Money | Derived balances, out-of-order events, refunds and part payments, daily reconciliation |
| Observability | Structured logs, correlation ids across jobs, queue depth, freshness and drift metrics |
| Back-office | Blade + Livewire 4 + Tailwind 4 — the ops console and the quarantine review screen |
| Quality | Pest 4, Larastan, Laravel Pint, Rector, HTTP fakes, time travel in tests |
| Ops | Alert routing, an on-call runbook, deploy with queue draining |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 22 sequenced steps in five sections, plus the locked decisions, the domain model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–4 | Tooling, harness, the message model, the connection registry, encrypted credentials |
| [Inbound](./roadmap/inbound/) | 5–9 | Signed webhooks, idempotency, the job pipeline, retries and dead-letter, poison messages |
| [Outbound](./roadmap/outbound/) | 10–13 | HTTP timeouts and backoff, circuit breaking, per-connection rate limits, mapping and schema drift |
| [Batch and Schedule](./roadmap/batch/) | 14–17 | Scheduled pulls, SFTP and CSV ingestion, quarantine and review, freshness and silence detection |
| [Money and Operations](./roadmap/operations/) | 18–21 | Out-of-order events and derived state, daily reconciliation, the ops console, deploy and on-call |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**The pipeline — steps 0–13.** The message model, inbound webhooks, the job pipeline, and
outbound calls to systems that fail. Ends with an integration that survives duplicate delivery,
a slow third party, and a rate limit, for one connection at a time.

**Batch, money and operations — steps 14–21.** Scheduled work with no webhook to trigger it,
files that fail halfway, money that must reconcile, and everything needed to hand the result to
a business and charge them monthly for it.

If you only have time for one, the first path teaches the mechanisms and the second teaches
what to sell. Neither is optional if the goal is a system somebody pays for.

## How to read a roadmap step

Every step has the same parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. This is the real point of the step; the code is just the vehicle. |
| **Libraries** | What to add, and sometimes why that choice over the obvious alternative. |
| **Expected outcome** | What you should have when the step is done — the pieces to build, and where useful a high-level project structure. The *how* is yours to work out. |
| **Verification** | How you prove it's done — see below. |

Some steps also carry a **Harness impact** note: what to add to `AGENTS.md` afterwards.

### Proving a step is done

The common failure of self-directed learning is that everything *feels* like it works. That is
worse here than in most domains, because an integration that is quietly broken looks exactly
like an integration that is quietly working. Five verification layers exist to prevent it:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — replaying a stored payload by hand, watching Horizon while you kill a worker, reading the quarantine screen as if you were the client's office manager. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is — the mistakes that don't show up until a third party has an outage. |
| **L5 — Automated guardrails** | CI, Larastan, Pint, the replay-safety sweep, coverage. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The step's Verification block vs. the Rubrics page

These are two views of the same thing. Be clear which is which:

- **The Verification block** ends every step. It's the checklist you work through to close
  *that* step: the `ACC-NN` test to write, the L2 checks to run by hand, the `AP-NN-x` IDs to
  self-check against, and a one-line *Done when*. This is the thing you *do*.
- **The [Rubrics page](./reference/rubrics/)** holds the full text of the `ACC-NN` criteria and
  the `AP-NN-x` anti-patterns that each step only names by ID. It lives in one place so the AI
  reviewer can be handed exactly one step's section without seeing the others. This is a
  *lookup* — you read one section per step while working that step's Verification block. You
  don't "complete" it.

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step: story, why now, concepts.
3. For idempotency, ordering, partial failure and money steps — **write the acceptance test first**, watch it fail. (Steps 6, 9, 15, 18, 19 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 6, 15, and 19. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  webhook handler that does the work before acknowledging, so the sender times out and sends it
  again; a retry policy with no jitter, so every failed job in the queue retries at the same
  second).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the message model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any domain code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/foundations/).** A connection registry and one health endpoint. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
