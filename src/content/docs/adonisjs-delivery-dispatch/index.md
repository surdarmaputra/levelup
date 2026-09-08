---
title: Getting Started
description: A guided path from "I know TypeScript, new to AdonisJS" to a production-grade delivery platform — the last-mile dispatch system a food stall, a pharmacy and a hardware store all run their deliveries on.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know TypeScript, new to AdonisJS"* to a production-grade backend and
fullstack application — built around one real domain: **Antar**, a last-mile delivery platform
that shops use to get their goods to a customer's door, on Node 24 and AdonisJS 7.

Twenty-four steps. There's no deadline on any of it — take a step in an evening or over two
weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with TypeScript — types, generics, `async`/`await`, ES modules, npm
- Comfortable with SQL, a terminal, and git; Docker installed
- New to AdonisJS, or you've only followed a tutorial

**Not assumed:** the IoC container, Lucid, migrations, VineJS, Bouncer, Edge, Inertia, queues,
PostGIS, Stripe.

If you are new to TypeScript itself, this will move too fast — learn the language first.
Already shipping AdonisJS in production? Skim steps 0–4 as a checklist and start at step 5.

## What you are building, concretely

Antar sits between shops and couriers. A shop creates an order, Antar turns it into delivery
work, picks a courier who can actually do that work, and shows the customer where their parcel
is until it arrives.

Three shops are used as the running examples all the way through the roadmap. They were picked
because they disagree with each other on exactly the points that are hard to build:

| The merchant | What it sends | What it forces you to handle |
|---|---|---|
| **Warung Pak Budi** — a one-person food stall | One bag of hot food, 15 minutes of prep, customers within 3 km, often paid in cash at the door | The simple case: one order, one parcel, one courier, right now. Fast dispatch, a promised time, and a customer watching a map |
| **Sehat Pharmacy** — a neighbourhood pharmacy | Prescription medicine that needs an ID check and a signature, and cold-chain items that may not spend more than 30 minutes in transit | Who is allowed to carry what, a delivery that cannot be completed by leaving it at the door, and a job that can expire while it is still in progress |
| **Atlas Hardware** — a builders' merchant | Bulky goods: one order, three drop-offs, a van and two couriers, in a two-hour window booked for tomorrow morning | An order that is not one parcel, work that is scheduled instead of immediate, and a pickup where one of the three items turns out to be missing |

Same code, same database, three shops whose rules do not match. That is the whole exercise: one
dispatch system, configured per merchant and per item, and never a line of
`if (merchant.slug === …)`.

Concrete questions to keep asking as you build: can Sehat's cold-chain job still be completed by
a courier with no cold bag? What does Atlas's job look like when stop 2 of 3 fails? Does Warung's
customer see the courier move without refreshing the page?

Other businesses in this shape, if you want to point your own version at one: grocery delivery,
laundry pickup and return, parcel couriers, lab-sample collection, catering drop-offs, flower
delivery, spare-parts runs between workshops, document couriers, furniture delivery, meal kits.
All of them move a physical thing from A to B with a promise attached, and all of them are
somebody's paying customer today.

## Why last-mile delivery

Most Node tutorials build a blog or a todo API, then bolt on a queue and a websocket as demos.
You learn the syntax and none of the judgement. A dispatch platform was chosen because the hard
parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| Two dispatchers can offer the same courier the same job at the same second | Transactions, row locking, `SKIP LOCKED`, and database constraints that make a double assignment impossible rather than unlikely |
| An order moves through states in one direction, driven by a phone with bad signal | State machines as code, append-only events, idempotent endpoints, and messages that arrive twice or out of order |
| "The nearest available courier" is a query, not an opinion | PostGIS geography columns, `ST_DWithin`, GiST indexes, and what happens to a query plan without one |
| A promise made at 09:00 must be judged at 09:35 | Storing instants in UTC, rendering in local time, deadline timers on a queue, and a clock you can freeze in tests |
| Money moves in two directions | Charging a customer, paying a courier, keeping a commission — as ledger entries you can reconcile, with webhooks that get delivered twice |
| Nobody is on the site when the work happens | Background jobs, retries with backoff, scheduled sweeps for work that got stuck |

You can't fake a double assignment. Either your test fires 50 concurrent requests at one courier
and exactly one job sticks, or it doesn't.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | TypeScript 5.9 strict, Node 24, ES modules |
| Framework | AdonisJS 7 — IoC container, providers, middleware, ace commands, typed env |
| Persistence | Lucid, migrations, generated schema classes, PostgreSQL 17, factories and seeders |
| Geospatial | PostGIS — geography columns, distance queries, GiST indexes |
| Validation | VineJS — schemas, custom rules, and validation as a compiled function |
| API | Controllers, serializers, RFC 9457 problem details, versioning, outbound webhooks |
| Auth | `@adonisjs/auth` session guard for the console, access tokens for the courier app and the public API, `@adonisjs/bouncer` abilities and policies |
| Async | `@adonisjs/queue` — jobs, retries, backoff, the scheduler, idempotent workers |
| Realtime | `@adonisjs/transmit` — server-sent events, channel authorization, live tracking |
| Money | Stripe payment intents, webhook idempotency, refunds, a double-entry ledger for payouts and commission |
| Caching | `@adonisjs/cache` — two-tier cache, tags, and keys that can't serve one merchant's board to another |
| Observability | `@adonisjs/otel`, structured logs, request and job correlation, dispatch latency as a metric |
| Ops console | Edge templates + Vite + Tailwind 4 |
| Customer surface | Inertia 2 + React 19 + TypeScript |
| Quality | Japa against real PostgreSQL, ESLint, Prettier, `tsc --noEmit` |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `npm run verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 24 sequenced steps in five sections, plus an overview of locked decisions, the domain model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–4 | Tooling, harness, the AdonisJS mental model, Lucid, the request contract, auth |
| [Dispatch](./roadmap/dispatch/) | 5–9 | The order state machine, couriers and eligibility, the dispatch engine, assignment under concurrency, geography |
| [Realtime and Async](./roadmap/realtime/) | 10–13 | The courier API, background jobs, time and SLA, live tracking |
| [Money](./roadmap/money/) | 14–16 | Payments and webhooks, refunds and failed deliveries, the payout ledger |
| [Surface and Scale](./roadmap/scale/) | 17–23 | The ops console, the customer tracking page, the public API, read performance, observability, multi-city, deploy |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**Backend and dispatch — steps 0–16.** Tooling → AdonisJS fundamentals → the order and job model
→ dispatch and concurrency → the courier API, jobs and real time → money. Ends with a working
delivery platform that takes orders, assigns couriers, tracks them live, and settles the money,
driven entirely from HTTP calls and tests.

**Surface and scale — steps 17–23.** The ops console, the customer tracking page, the public
merchant API, and the work that only shows up with traffic: query plans, cache keys,
instrumentation, regional dispatch, and a deploy that drains workers instead of killing them.

Two frontends is intentional. The ops console is CRUD-heavy and internal; server-rendered Edge
is faster to build and cheaper to maintain, and that is a permanent choice, not a temporary
step. The customer tracking page needs real client state — a moving marker, a countdown, a
stream of events — and earns the SPA. You learn session auth on one and token auth on the other,
and *why they differ*.

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
| **L2 — Manual checks** | What a test can't catch — reading an `EXPLAIN` plan, watching two dispatch requests fight over one courier, killing a worker mid-job. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is — the mistakes that don't show up on their own. |
| **L5 — Automated guardrails** | CI, ESLint, `tsc --noEmit`, the dispatch invariant sweep, coverage. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

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
3. For state, concurrency, time, and money steps — **write the acceptance test first**, watch it fail. (Steps 5, 8, 10, 12, 14, 16 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 8, 10, and 14. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  courier assignment that checks availability with a `SELECT` and then writes; a retried webhook
  that pays Warung's courier twice).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the domain model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any domain code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/foundations/).** A health endpoint and typed config. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
