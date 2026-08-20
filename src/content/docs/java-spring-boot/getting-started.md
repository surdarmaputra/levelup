---
title: Getting Started
description: What this is, how the documents fit together, and how to read a roadmap step.
sidebar:
  order: 1
---

A guided path from "I know Java, new to Spring" to shipping a production-grade backend and fullstack application.

Twenty-six steps, one real domain: an **event ticketing marketplace**.

There's no timeline attached to any of it. Take a step in an evening or a fortnight — the sequence matters, the pace doesn't.

## Why ticketing, and not a todo app

Most backend tutorials pick a domain with no hard problems in it, then bolt on caching, locking, and queues as demonstrations. You learn the syntax and none of the judgement.

Ticketing was chosen because the hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| Two people can't buy the same seat | Pessimistic vs optimistic locking, deadlock ordering, distributed locks |
| Payment gateways are slow and unreliable | Idempotency, outbox pattern, webhooks, saga compensation |
| On-sales are genuine traffic spikes | Caching, stampede protection, rate limiting, horizontal scaling |
| Seat maps need real client state | An SPA that earns its complexity |

You can't fake concurrency correctness. Either your test proves 100 concurrent buyers get exactly 10 seats, or it doesn't.

## Who this assumes you are

- Comfortable with Java — generics, collections, streams, records
- Never used Spring, or only followed a tutorial
- Can navigate a terminal and use git
- Docker installed

**Not assumed:** JPA, Spring Security, Redis, message queues, React.

Already shipped Spring in production? Start at step 7 and treat 0–6 as a checklist.

---

## Start here

**1. Read this page to the end.** Particularly *How to read the roadmap* below — the step format only makes sense once.

**2. Skim the [Roadmap Overview](../roadmap/overview/).** The locked decisions and domain model. Don't memorize it; know it's there.

**3. Set up the [agent harness](../setup/agent-harness/).** This is step 0 — tooling, `make verify`, `AGENTS.md`. Setting up tooling before writing any domain code feels like procrastination. It isn't: it's what makes every later step fast, and it's the difference between an agent that helps and one that guesses.

**4. Set up the [reviewer](../setup/reviewer-setup/).** Configure once, use at the end of every step. Works in a plain chat window — no repo access, no coding agent needed.

**5. Start [step 1](../roadmap/foundations/).** A ping endpoint and a config file. Small on purpose.

If you find yourself still tuning `AGENTS.md` after a couple of sittings, you're procrastinating. Ship a minimal version and move on — it's designed to grow later.

---

## How to read the roadmap

Every step has the same seven parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step, in real user-story format. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD`. Whether an AI agent may write the implementation. See [the mode contract](../setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. **Read this one.** The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. The step's real payload — the code is just the vehicle. |
| **Libraries** | What to add, and occasionally why that choice over the obvious alternative. |
| **Build** | What to make. Deliberately brief; the *how* is yours to work out. |
| **Verification** | How you prove it's done. Explained below. |

Some steps also carry a **Harness impact** note — what to add to `AGENTS.md` afterwards.

### The verification table

The failure mode of self-directed learning is that everything feels like it works. Five layers exist to prevent that. Four of them appear in the table at the end of each step:

| Row | What it means |
|---|---|
| **L1 — Gating test** | The acceptance test, named `ACC-NN`. Unambiguous pass/fail, no judgement call. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | Things a test can't catch. Timing something, reading an `EXPLAIN` plan, killing a container mid-request. |
| **L4 — Anti-patterns** | Referenced by ID (`AP-NN-a`). "You did it wrong if…" — full text in [Rubrics](../reference/rubrics/). |
| **Done when** | The explicit pass condition. Everything above, in one line. |

**Layer 3** is the [AI code review](../setup/reviewer-setup/) — you run it, so it isn't in the table.

**Layer 5** is the automated guardrails — CI, ArchUnit, coverage, contract diffs. Continuous rather than per-step, so they live in the [Roadmap Overview](../roadmap/overview/#global-guardrails-verification-layer-5). Steps only mention when a *new* guardrail switches on.

**Layer 4 is where most of the real learning is.** The anti-patterns are the mistakes that don't announce themselves — a `@Transactional` method calling another method on `this` and silently running in no transaction at all; a scheduled job quietly double-executing the moment you scale to two instances. Read them even when you're confident.

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step. Story, why now, concepts.
3. For concurrency, money, or state-transition steps — **write the acceptance test first**. Watch it fail. (Steps 8, 10, 11, 12, 17 especially.)
4. Build until it passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in [Rubrics](../reference/rubrics/).
7. Submit to the [reviewer](../setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 8, 10, and 12. That's the design, not a setback.

---

## The documents

| | Document | When you read it |
|---|---|---|
| **1** | Getting Started (this page) | Once, first |
| **2.1** | [Agent Harness](../setup/agent-harness/) | Setup, at step 0 |
| **2.2** | [Reviewer Setup](../setup/reviewer-setup/) | Setup once, run every step |
| **3.0** | [Roadmap Overview](../roadmap/overview/) | Skim first, refer back |
| **3.1** | [Foundations](../roadmap/foundations/) — steps 0–4 | Working through it |
| **3.2** | [Domain Depth](../roadmap/domain-depth/) — steps 5–8 | Working through it |
| **3.3** | [Integration and Scale](../roadmap/integration/) — steps 9–14 | Working through it |
| **3.4** | [Fullstack](../roadmap/fullstack/) — steps 15–18 | Working through it |
| **3.5** | [Advanced](../roadmap/advanced/) — steps 19–24 | Working through it |
| **4.1** | [Rubrics](../reference/rubrics/) | Jump to one section, 26 times |
| **4.2** | [Deliberate Omissions](../reference/omissions/) | When you wonder why GraphQL isn't here |

**There is deliberately no implementation code anywhere in these documents.** Handing you working code produces the feeling of understanding and almost none of the retention. The roadmap tells you what to build and how to prove it works; the building is yours.

---

## The two paths

**Path 1 — API development: steps 0–14.** Tooling → foundations → domain depth → concurrency → integration → scale → resilience. Ends with a production-grade API.

**Path 2 — Fullstack: steps 5, 5b, then 15–18.** Thymeleaf + HTMX admin back-office and its design system first; React + TypeScript customer storefront later.

Two frontends is intentional. Internal CRUD back-offices are faster to build and maintain server-rendered — that's a permanent choice, not a stepping stone. The customer storefront needs client state (seat map, hold countdown, live availability) and earns the SPA. You learn session + CSRF auth on one and token auth on the other, and *why they diverge*.

**Then:** steps 19–20 (OAuth2, service extraction, deployment), and an optional advanced track — Kafka, Elasticsearch, event sourcing, and a Kubernetes decision document.

---

## UI and quality tooling

**Admin (Thymeleaf):** Tailwind 4 + daisyUI 5 + a custom theme. Not an off-the-shelf admin template — those ship Alpine.js, which fights HTMX, and a recognizable stock install reads as "used a template." Step 5b builds a real design system: tokens, type scale, and the four states every data surface needs. That last part is why most portfolio dashboards look amateur.

**Storefront (React):** Tailwind 4 + shadcn/ui, retheme the tokens. You own the component source, which step 16's seat map requires.

**Java quality:** Spotless + Palantir format, **Error Prone + NullAway** (compile-time bug detection — the highest-value tool in the list and the most commonly skipped), ArchUnit, SpotBugs + FindSecBugs, OWASP dependency-check.

**Deliberately not Checkstyle or PMD.** Checkstyle duplicates Spotless; PMD's useful findings overlap Error Prone with far worse signal-to-noise. Running all four produces hundreds of warnings nobody reads — and a gate that gets ignored is worse than no gate, because it teaches you build output is noise.

**Frontend quality:** Biome (lint, format, imports — one binary, far faster than ESLint + Prettier) plus a minimal ESLint config for React Hooks rules, and TypeScript `strict`.

All of it behind one command:

```
make verify   →  format → compile (Error Prone) → test → ArchUnit → frontend lint
```

Same command locally, in CI, in the pre-commit hook, and as the agent's feedback loop. That last one is the point: **an agent is bounded by the signal it can run unsupervised, not by its intelligence.** The quality track and the AI track are the same track.

---

## Ground rules

**Do step 0 first**, even though it feels like procrastination.

**The mode contract is an honour system.** Nothing enforces it. The cost of shortcutting step 8 is invisible until you're debugging production.

**Don't skip ahead.** The ordering encodes dependencies. Step 9 (hexagonal architecture) sits *after* you've felt the pain of a hardcoded payment gateway — taught earlier, ports and adapters is cargo cult. Step 12 exists specifically to *break* your step 11 code; that failure is the lesson, and reading about it doesn't substitute.

**Don't skip tests on the hard steps.** Manual clicking cannot find a race condition. There is no version of step 8 you complete by feel.

**The advanced track is optional, and be honest about it.** If you can't articulate why RabbitMQ is insufficient for step 21's user story, you don't need Kafka. That judgement is worth more than the implementation.

**Event sourcing stays scoped to the `Ticket` aggregate.** System-wide event sourcing is a well-documented way to sink a project. If extending it feels natural, that feeling is the anti-pattern.
