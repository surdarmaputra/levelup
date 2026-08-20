---
title: AGENTS.md Template
description: The v1 agent harness template for TicketFlow — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 0](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.


> **This is the v1 template from Step 0.** Copy it to your repo root and fill the `<>` placeholders.
> Symlink it so every tool finds it: `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v5) are at the bottom. Tick them off as you reach those steps.
> **Do not write v5 on day 1.** You don't yet know your own conventions, and a harness full of
> guessed rules is worse than a short honest one.

---

## Project

Event ticketing marketplace. Modular monolith, Java 21 + Spring Boot 3.5.x.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension
matter more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 2, 3, 4, 7, **8**, **10**, **11**, **12**, 16, 17, 20, 23, 24.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask Socratic questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

**Do not** produce the implementation, even when asked directly, even when it would be faster.
If asked, respond with the question that leads them there instead.

Rationale: these steps teach concurrency, consistency, and distributed-systems reasoning. Those
only survive being struggled with. Generated code produces a working app and an engineer who
cannot debug it under pressure.

You may still write: tests they specify, boilerplate config, migration scaffolding, and anything
in `LEARN` steps that isn't the core concept.

### `BUILD` steps — pair or autonomous

Steps 0, 1, 5, 5b, 6, 9, 13, 14, 15, 18, 19, 21, 22.

Generate freely. Scaffolding, config, templates, wiring, boilerplate. Then explain what you
generated so it's reviewed rather than absorbed.

---

## The loop

`make verify` is the single source of truth. It runs format check → compile (Error Prone +
NullAway) → tests → ArchUnit → frontend lint.

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
| Language | Java 21 LTS, virtual threads enabled |
| Framework | Spring Boot 3.5.x, Jakarta EE 10 namespace |
| Build | Gradle, Kotlin DSL |
| Database | PostgreSQL 16, Flyway migrations |
| Cache / locks | Redis 7 |
| Messaging | RabbitMQ 3 |
| Admin UI | Thymeleaf + HTMX + Tailwind 4 + daisyUI 5 |
| Storefront | React 19 + TypeScript strict + Vite + shadcn/ui |
| Testing | JUnit 5, AssertJ, Mockito, Testcontainers |
| Java quality | Spotless (Palantir), Error Prone, NullAway, ArchUnit |
| Frontend quality | Biome + minimal ESLint (`react-hooks`) |

**Never suggest:** WebFlux (virtual threads cover it here), Lombok `@Data` on entities,
`RestTemplate` (use `RestClient`), H2 for tests, `WebSecurityConfigurerAdapter` (removed).

---

## Layout

```
src/main/java/com/ticketflow/
├── catalog/        events, showtimes, venues, seat maps
├── ordering/       orders, holds, tickets, purchase transaction
├── payments/       gateway adapters, webhooks, reconciliation
├── identity/       users, roles, auth
├── notification/   email/SMS dispatch
└── shared/         errors, config, correlation, base types
```

Modules communicate via published interfaces or domain events. **Never** by reaching into
another module's internals. ArchUnit enforces this from step 9.

---

## Non-negotiable conventions

**Persistence**
- `ddl-auto: validate` always. Schema comes only from Flyway. Migrations are immutable once merged.
- `@Transactional` never on private, final, or static methods — the proxy silently does nothing
- Never call a `@Transactional` method via `this.` — same silent failure
- `FetchType.LAZY` on every association, explicitly
- `@Enumerated(EnumType.STRING)` always, never `ORDINAL`

**Money**
- `BigDecimal` or integer minor units. **Never `double` or `float`.** No exceptions.

**API**
- Entities never cross the HTTP boundary. Records as DTOs.
- Errors via `@RestControllerAdvice` returning RFC 9457 `ProblemDetail`
- Never 200 with an error payload
- Never leak stack traces, SQL, or internal class names to clients

**Security**
- Default deny. Every endpoint gets an explicit rule.
- Role checks are insufficient — verify ownership separately
- Never disable CSRF on session-authenticated routes
- Tokens in httpOnly + Secure + SameSite cookies. **Never `localStorage`.**

**Concurrency**
- No check-then-act on shared state without a lock
- Sort identifiers before acquiring multiple locks (deadlock prevention)
- Never `synchronized` for state shared across instances
- Never hold a transaction open across an external network call

**Testing**
- Testcontainers, real Postgres. Never H2.
- Concurrency tests use `CountDownLatch`, never `Thread.sleep()`
- Never mock the thing under test

**Frontend**
- Design tokens only. No hardcoded hex colors, no arbitrary font sizes.
- Every data surface handles empty, loading, error, and populated states
- TypeScript `strict`. No `any` without a comment explaining why.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** If you're unsure a method exists, say so rather than producing plausible code.
- **No scope creep.** Don't add caching at step 6 or Kafka at step 10. Later steps cover them deliberately.
- **Never bypass a quality gate.** No `@SuppressWarnings`, no `--no-verify`, no disabled rules, without explicit discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. Read them before proposing anything structural —
several were made deliberately and against the obvious default.

When a decision is made in conversation, offer to record it as an ADR. Undocumented decisions get
silently reversed three steps later.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. It is the source of truth for review behaviour —
this file does not duplicate it.

To review: load that prompt, the current step's section from `docs/RUBRICS.md`, and the code.
**Only the current step's rubric.** Loading the whole file leaks later steps and produces
off-scope findings.

---

## Evolution checkpoints

Update this file at these points. Each is a roadmap step's "harness impact" note.

- [ ] **v1 — Step 0.** This template, placeholders filled.
- [ ] **v2 — Step 3.** API conventions: DTO naming, error envelope shape, status-code policy, versioning rule.
- [ ] **v2b — Step 5b.** Design tokens and the component-fragment inventory. Without this the agent invents a new button style per screen.
- [ ] **v3 — Step 9.** Module boundaries, domain-purity rule, adapter locations. State the ArchUnit constraints in prose — the agent shouldn't need a failing build to learn them.
- [ ] **v4 — Step 13.** "Every new endpoint gets a metric and a correlation ID." Fields that must never be logged.
- [ ] **v5 — Step 20.** Subagent roles (implementer / test-writer / reviewer), service boundaries, contract-test requirement.

**At v5, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file couldn't be written well on day 1.
