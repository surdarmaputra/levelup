---
title: Getting Started
description: A guided path from "I know PHP, new to Laravel" to a production-grade multi-tenant SaaS — a booking platform that service businesses run their day on.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know PHP, new to Laravel"* to a production-grade multi-tenant SaaS —
built around one real domain: **Bookline**, a booking and scheduling platform sold to service
businesses, on PHP 8.5 and Laravel 13.

Twenty-four steps. There's no deadline on any of it — take a step in an evening or over two
weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with PHP 8 — classes, interfaces, traits, enums, closures, Composer
- Comfortable with SQL, a terminal, and git; Docker installed
- New to Laravel, or you've only followed a tutorial

**Not assumed:** Eloquent, migrations, the service container, middleware, queues, Blade,
Livewire, Inertia, Stripe.

If you are new to PHP itself, this will move too fast — learn the language first. Already
shipping Laravel in production? Skim steps 0–4 as a checklist and start at step 5.

## Why a booking SaaS

Most Laravel tutorials build a blog or a todo list, then bolt on a queue and a cache as demos.
You learn the syntax and none of the judgement. A booking platform sold to many businesses at
once was chosen because the hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| Every business is a separate tenant sharing one database | Tenant resolution, global scopes, tenant context in queues, cache and storage, and a test that proves no data crosses the line |
| Two customers can book the same 10:00 slot | Transactions, row locking, Postgres exclusion constraints, and why a `SELECT` then `INSERT` is a bug |
| The business is in one timezone, the customer in another, and clocks shift twice a year | Storing instants in UTC, rendering in tenant time, and the DST hours that happen twice or not at all |
| The business pays you monthly; their customers pay the business | Subscriptions and dunning, webhook idempotency, per-tenant payment credentials, refunds |
| Reminders go out when nobody is on the site | Queues, scheduled jobs, retries, failed-job handling, idempotent workers |

You can't fake a tenancy leak. Either your test proves tenant A's query never returns tenant
B's row, or it doesn't.

Every business in the world that sells time — a clinic, a salon, a studio, a repair shop, a
tutor — runs on software shaped like this. Building it once teaches you the shape.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | PHP 8.5, Composer, strict types |
| Framework | Laravel 13 — container, providers, middleware, events, policies |
| Persistence | Eloquent, migrations, PostgreSQL 17, factories and seeders |
| Multi-tenancy | Subdomain resolution, global scopes, tenant-aware cache / storage / queues, then `stancl/tenancy` for database-per-tenant |
| API | Form requests, API resources, RFC 9457 problem details, versioning, Sanctum tokens |
| Auth | Session auth, roles and policies, per-tenant membership, signed URLs |
| Money | Laravel Cashier (Stripe) subscriptions, plan limits, dunning; encrypted per-tenant credentials; then Stripe Connect |
| Async | Queues, Horizon, scheduled jobs, idempotent consumers, failed-job policy |
| Realtime | Laravel Reverb — a slot disappearing while the customer is looking at it |
| Caching & scale | Redis 8, cache keys under tenancy, N+1 elimination, index design for availability queries |
| Observability | Structured logs, request and job correlation, slow-query and queue-depth signals |
| Admin frontend | Blade + Livewire 4 + Tailwind 4 — a tenant back-office |
| Customer frontend | Inertia 2 + React 19 + TypeScript — the public booking page |
| Quality | Pest 4, Larastan, Laravel Pint, Rector, database-backed tests |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 24 sequenced steps in five sections, plus an overview of locked decisions, the domain model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–4 | Tooling, harness, the Laravel mental model, Eloquent, the request contract, auth |
| [Multi-Tenancy](./roadmap/tenancy/) | 5–8 | Tenant resolution, scoping and the leak test, tenant context outside the request, the Livewire back-office |
| [Booking and Availability](./roadmap/booking/) | 9–13 | The availability engine, time correctness, the booking state machine, double-booking, read performance |
| [Money and Async](./roadmap/money/) | 14–18 | Subscriptions, webhooks, per-tenant payment credentials, deposits and refunds, queues |
| [Scale and Migration](./roadmap/scale/) | 19–23 | The public booking page, the public API, Connect migration, database-per-tenant migration, deploy |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**Backend and tenancy — steps 0–18.** Tooling → Laravel fundamentals → tenancy → availability
and booking → money → async. Ends with a working multi-tenant SaaS that takes bookings and
payments, driven from the Livewire back-office.

**Public-facing and scale — steps 19–23.** The Inertia booking page, the public API, and the two
migrations: BYO payment keys → Stripe Connect, and shared database → database per tenant.

Two frontends is intentional. A tenant back-office is CRUD-heavy and internal; server-rendered
Livewire is faster to build and cheaper to maintain, and that is a permanent choice, not a
temporary step. The public booking page needs real client state — slot selection, a hold
countdown, live availability — and earns the SPA. You learn session auth on one and token auth
on the other, and *why they differ*.

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

The common failure of self-directed learning is that everything *feels* like it works. Five
verification layers exist to prevent that:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading an `EXPLAIN` plan, watching two browsers fight over one slot, changing your machine's clock to a DST boundary. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is — the mistakes that don't show up on their own. |
| **L5 — Automated guardrails** | CI, Larastan, Pint, the tenancy leak sweep, coverage. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

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
3. For tenancy, concurrency, time, and money steps — **write the acceptance test first**, watch it fail. (Steps 6, 7, 10, 12, 15, 17 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 6, 10, and 12. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  queued job that runs without a tenant and writes rows to whichever tenant was last active; a
  cache key that serves one salon's schedule to another).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the domain model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any domain code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/foundations/).** A health endpoint and a config file. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
