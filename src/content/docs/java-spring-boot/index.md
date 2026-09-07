---
title: Getting Started
description: A guided path from "I know Java, new to Spring" to shipping a production-grade backend and fullstack application.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know Java, new to Spring"* to a production-grade backend and fullstack
application — built around one real domain: an **event ticketing marketplace**, on Java 21 and
Spring Boot 3.5.

Twenty-six steps. There's no deadline on any of it — take a step in an evening or over two
weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with Java — generics, collections, streams, records, the concurrency primitives
- New to Spring, or you've only followed a tutorial
- Can navigate a terminal and use git; Docker installed

**Not assumed:** JPA, Spring Security, Redis, message queues, React.

If you are new to Java itself, this will move too fast — learn the language first. Already
shipped Spring in production? Skim steps 0–6 as a checklist and start at step 7.

## Why an event ticketing marketplace

Most backend tutorials pick a domain with no hard problems in it, then add caching, locking,
and queues on top as demos. You learn the syntax and none of the judgement.

Ticketing was chosen because the hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| Two people can't buy the same seat | Pessimistic vs optimistic locking, deadlock ordering, distributed locks |
| Payment gateways are slow and unreliable | Idempotency, the outbox pattern, webhooks, saga compensation |
| On-sales are genuine traffic spikes | Caching, stampede protection, rate limiting, horizontal scaling |
| Seat maps need real client state | An SPA that earns its complexity |

You can't fake concurrency correctness. Either your test proves 100 concurrent buyers get
exactly 10 seats, or it doesn't.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | Java 21 LTS, virtual threads |
| Framework | Spring Boot 3.5 (Jakarta EE 10) |
| Persistence | Spring Data JPA, PostgreSQL 16, Testcontainers |
| API | REST, RFC 9457 Problem Details, OpenAPI, versioning |
| Security | Session + CSRF → hand-rolled JWT → Spring Authorization Server (OAuth2 + PKCE) |
| Async & messaging | RabbitMQ 3, the outbox pattern, idempotent consumers, sagas |
| Caching & scale | Redis 7, a CQRS read path, stampede protection, two-instance horizontal scaling |
| Resilience | Circuit breakers, retries with jitter, distributed rate limiting, graceful shutdown |
| Observability | Structured logs, correlation IDs across async boundaries, p95/p99 metrics |
| Architecture | Layered → hexagonal refactor → modular monolith → one extracted service |
| Admin frontend | Thymeleaf + HTMX, Tailwind 4 + daisyUI 5, a hand-built design system |
| Customer frontend | React 19 + TypeScript + Vite, Tailwind 4 + shadcn/ui, a live seat map |
| Java quality | Spotless, Error Prone + NullAway, ArchUnit, SpotBugs + FindSecBugs, OWASP dependency-check |
| Frontend quality | Biome, minimal ESLint for `react-hooks`, TypeScript `strict` |
| AI workflow | An `AGENTS.md` harness (v1→v5), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

Optional advanced track: Kafka, Elasticsearch, event sourcing scoped to one aggregate, and a
Kubernetes decision document.

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 26 sequenced steps in five sections, plus an overview of locked decisions, the domain model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–4 | Tooling, harness, Spring fundamentals, persistence, API contract, security |
| [Domain Depth](./roadmap/domain-depth/) | 5–8 | Admin UI, design system, seat maps, read performance, the concurrency problem |
| [Integration and Scale](./roadmap/integration/) | 9–14 | Hexagonal refactor, messaging, caching, horizontal scaling, observability, resilience |
| [Fullstack](./roadmap/fullstack/) | 15–18 | React storefront, seat map, checkout, frontend production readiness |
| [Advanced](./roadmap/advanced/) | 19–24 | OAuth2, service extraction, and the optional Kafka / Elasticsearch / event-sourcing track |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**API development — steps 0–14.** Tooling → foundations → domain depth → concurrency →
integration → scale → resilience. Ends with a production-grade API.

**Fullstack — steps 5, 5b, then 15–18.** A Thymeleaf + HTMX admin back-office and its design
system first; a React + TypeScript customer storefront later.

Two frontends is intentional. Internal CRUD back-offices are faster to build and maintain
server-rendered — a permanent choice, not a temporary step. The customer storefront needs
client state (seat map, hold countdown, live availability) and earns the SPA. You learn
session + CSRF auth on one and token auth on the other, and *why they differ*.

After both: steps 19–20 (OAuth2, service extraction, deployment), then the optional advanced
track.

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
| **L2 — Manual checks** | What a test can't catch — timing something, reading an `EXPLAIN` plan, killing a container mid-request. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is — the mistakes that don't show up on their own. |
| **L5 — Automated guardrails** | CI, ArchUnit, coverage, contract diffs. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

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
3. For concurrency, money, or state-transition steps — **write the acceptance test first**, watch it fail. (Steps 8, 10, 11, 12, 17 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 8, 10, and 12. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  `@Transactional` self-invocation that silently runs in no transaction; a `@Scheduled` job
  that double-executes the moment you run two instances).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the domain model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any domain code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/foundations/).** A ping endpoint and a config file. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
