---
title: Getting Started
description: A guided path from "I can program, I have never written Go" to a production-grade Go service you can put in a portfolio.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I can program, I have never written Go"* to a production-grade Go service —
built around one real system: **Relay**, a webhook delivery platform that takes events in and
delivers them to customer HTTP endpoints, with retries, signing, rate limits and a replay
dashboard.

Twenty steps. The first six teach the language; the rest build the system. There's no deadline
on any of it — take a step in an evening or over a week. The order matters, the pace doesn't.

## Who this is for

- You can already program — variables, functions, loops, some object-oriented or scripting
  language (JavaScript, Python, PHP, Java, C#, Ruby). Any one is enough.
- You have **never written Go**, or you have only followed a "hello world" tutorial.
- You can navigate a terminal and use git; Docker installed.

**Not assumed:** goroutines, channels, interfaces in the Go sense, pointers, SQL beyond basic
`SELECT`, HTTP internals, message queues.

If you have never programmed at all, this will move too fast — learn programming basics first.
If you already ship Go in production, skim steps 0–5 as a checklist and start at step 6.

## What you are building, concretely

Relay accepts events over an HTTP API, works out which customer endpoints subscribed to them,
and delivers each one — retrying, signing, rate-limiting and recording every attempt. Three
customer endpoints run through the whole roadmap. They were picked because they disagree with
each other on exactly the points that are hard to build:

| The subscriber | The setup | What it forces you to handle |
|---|---|---|
| **Kirana Ledger** | A small bookkeeping app. One endpoint, subscribed to `invoice.*`, replies `200` in about 40ms, accepts every payload you send it. | Nothing clever — and that is the point. It is the baseline that proves the happy path end to end. If Kirana's deliveries are not correct, nothing after it matters. |
| **Meridian Bank Sandbox** | Strict. Rejects any request without a valid HMAC signature. Accepts at most 5 requests per second, then answers `429` with `Retry-After: 30`. Cuts the connection after 2 seconds. Subscribed to `payment.*`. | Request signing, a per-endpoint rate limit, obeying a server's `Retry-After` instead of your own backoff, hard client timeouts — and making sure one slow endpoint never starves the other two. |
| **Pixel Forge Studio** | A render farm. **Three** endpoints subscribed to the same `render.*` events. Events for one render job must arrive in order (`render.started` → `render.frame` → `render.finished`). Their tunnel goes down for hours at a time. | Fan-out of one event to many deliveries, per-key ordering, the head-of-line blocking decision it forces, a dead-letter path after a long outage, and replay that preserves order. |

Seed all three from step 6 onward and keep them. Kirana is where you check the basics still
work; Meridian is where backoff, signing and rate limiting get their teeth; Pixel Forge is the
one that breaks a design which assumed every subscription is one endpoint and every delivery is
independent.

Concrete questions to keep asking as you build: when Meridian answers `429`, does Kirana's next
delivery still go out immediately? When Pixel Forge is down for six hours, how many goroutines
is Relay holding? After a replay, does `render.finished` still arrive last?

**None of the three is ever special-cased in code.** An `if endpoint.Name == "Meridian"` means
your model is missing a field, not that the customer is unusual.

Other systems built exactly this way, if you want to point your own version at one: payment
providers, CI and build services, e-commerce order events, CRM sync, SMS and email providers,
IoT device telemetry, chat platform integrations, package tracking. All of them push events to
somebody else's HTTP server, and all of them lose data if the retry logic is wrong.

## Why a webhook delivery platform

Most Go tutorials build a CRUD API, then bolt a goroutine onto it as a demo. You learn the
syntax and none of the judgement. Go is used in production for services that hold many
connections, do many things at once, and must keep going when a dependency stops answering —
so the domain should force that.

Webhook delivery was chosen because the hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| Thousands of deliveries wait on slow external servers | Goroutines, worker pools, `context` deadlines, backpressure |
| Receivers go down, hang, or answer `429` | Retries, exponential backoff with jitter, circuit breaking, dead-letter queues |
| A delivery may be sent twice and must not be counted twice | Idempotency keys, at-least-once semantics, transactional claim of work |
| Two Relay instances share one queue | `SELECT … FOR UPDATE SKIP LOCKED`, distributed rate limits, no leader election |
| One noisy customer must not slow down the others | Fairness, per-endpoint limits, isolation between workers |
| Some events must arrive in order | Per-key serialization, and the throughput you give up for it |
| The receiver has to trust the payload | HMAC signing, constant-time comparison, replay windows |

You cannot fake any of this. Either your test proves that 200 concurrent workers claim 200
distinct deliveries and never the same one twice, or it doesn't.

This is also what Go is actually hired for. A repository showing worker pools, contexts,
timeouts, graceful shutdown and a race-free test suite reads as *"this person can build a
service"*. A Go CRUD app reads as *"this person wrote PHP in Go"*.

## What you'll learn

| Area | Technology |
|---|---|
| Language | Go 1.25+ — types, structs, slices, maps, pointers, methods, interfaces, generics where they earn their place |
| Errors | Sentinel errors, `errors.Is` / `errors.As`, wrapping with `%w`, `errors.Join`, why there are no exceptions |
| Concurrency | Goroutines, channels, `select`, `sync` primitives, worker pools, `context`, cancellation, the race detector |
| HTTP | Standard library `net/http` — routing patterns, middleware, `http.Client` timeouts, graceful shutdown |
| Persistence | PostgreSQL 16 with `pgx/v5`, `goose` migrations, hand-written SQL, transactions |
| Queueing | A Postgres-backed job queue: `FOR UPDATE SKIP LOCKED`, claim/lease/heartbeat, dead-lettering |
| Resilience | Exponential backoff with jitter, `Retry-After`, circuit breaking, per-endpoint rate limits with `x/time/rate` |
| Security | HMAC-SHA256 signing, constant-time comparison, replay windows, API keys, sessions and CSRF for the dashboard |
| Observability | `log/slog` structured logs, correlation IDs across goroutines, Prometheus metrics, `pprof` |
| Dashboard | `html/template` with `embed`, htmx, no build step and no JavaScript framework |
| Testing | Table-driven tests, `t.Cleanup`, `httptest`, `testcontainers-go`, `testing/synctest` for time, `-race`, `goleak` |
| Go quality | `gofmt`, `go vet`, `golangci-lint` (staticcheck, errcheck, errorlint, bodyclose), `govulncheck` |
| Ops | Multi-stage Docker to a static binary, Compose with nginx and two app instances, graceful drain |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 20 sequenced steps in five sections, plus an overview of locked decisions, the domain model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Go Foundations](./roadmap/go-foundations/) | 0–5 | The language itself: types, errors, interfaces, `net/http`, goroutines, testing |
| [The Delivery Core](./roadmap/delivery-core/) | 6–10 | Postgres, the ingest API, the work queue, signed HTTP delivery, retries and dead-lettering |
| [Correctness Under Load](./roadmap/correctness/) | 11–14 | Rate limits and fairness, ordering, circuit breaking, observability |
| [The Dashboard](./roadmap/dashboard/) | 15–17 | Server-rendered UI with `html/template` and htmx, replay, authentication |
| [Production](./roadmap/production/) | 18–19 | Two instances, graceful drain, Docker, load test, the README that sells the repository |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**Backend only — steps 0–14, then 18–19.** The language, the queue, delivery, retries, rate
limits, ordering, observability, then production. Ends with a service you demonstrate with
`curl`, tests and metrics.

**Backend plus dashboard — the full 0–19.** Adds a server-rendered operations dashboard at steps
15–17: the delivery list, an attempt timeline, filters, and a replay button.

Take the second path if this is a portfolio project. A reviewer who cannot run your code will
click through screenshots, and "here is a page where I can see a failed delivery and replay it"
lands harder than a passing test suite. The dashboard is server-rendered on purpose — `html/template`
plus htmx, no React, no build step. That is how a Go team would build an internal tool, and it
keeps the repository about Go rather than about npm.

## How to read a roadmap step

Every step has the same parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. This is the real point of the step; the code is just the vehicle. |
| **Libraries** | What to add, and sometimes why that choice over the obvious alternative. In Go the answer is often "nothing — the standard library covers it". |
| **Expected outcome** | What you should have when the step is done — the pieces to build, and where useful a high-level project structure. The *how* is yours to work out. |
| **Verification** | How you prove it's done — see below. |

Some steps also carry a **Harness impact** note: what to add to `AGENTS.md` afterwards.

### Proving a step is done

The common failure of self-directed learning is that everything *feels* like it works. Five
verification layers exist to prevent that:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading a query plan, killing a container mid-delivery, watching goroutine count in `pprof`. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is — the mistakes that don't show up on their own. |
| **L5 — Automated guardrails** | CI, linters, the race detector, coverage. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

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
3. For concurrency, retry, and ordering steps — **write the acceptance test first**, watch it fail. (Steps 4, 8, 10, 11, 12, 18 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 8, 10 and 12. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  goroutine started per delivery with nothing bounding it; a retry loop with no jitter that
  makes every worker hit the same dead endpoint at the same second).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the domain model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any Go code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/go-foundations/).** One file, a few types, a test. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
