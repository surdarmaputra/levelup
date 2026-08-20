---
title: Roadmap Overview
description: Locked decisions, the domain model, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with Java. New to Spring. |
| Language / runtime | Java 21 LTS, virtual threads enabled |
| Framework | Spring Boot 3.5.x (Jakarta EE 10 namespace) |
| Domain | Event ticketing marketplace |
| Architecture | Modular monolith → extract 1 service (step 20) |
| Code structure | Layered → hexagonal refactor (step 9) → lightweight CQRS read path (step 11) |
| Infrastructure | PostgreSQL 16, Redis 7, RabbitMQ 3, Testcontainers |
| Admin frontend | Thymeleaf + HTMX (step 5) |
| Customer frontend | React 19 + TypeScript + Vite (steps 15–18) |
| Auth progression | Session+CSRF → hand-rolled JWT → Spring Authorization Server |
| Testing | Tests gate every step. Test-first on concurrency, money, state transitions. |
| Ops | Docker Compose + nginx LB (2 app instances) → single VPS. K8s conceptual only. |
| Admin UI | Tailwind 4 + daisyUI 5 + custom theme + ApexCharts. No template adopted wholesale. |
| Storefront UI | Tailwind 4 + shadcn/ui, custom design tokens |
| Java quality | Spotless + Palantir format, Error Prone, NullAway, ArchUnit, SpotBugs + FindSecBugs, OWASP dependency-check. **No Checkstyle, no PMD** — see step 0. |
| Frontend quality | Biome (lint + format + imports) + minimal ESLint for `react-hooks` + TypeScript `strict` |
| AI harness | `AGENTS.md` from step 0, evolving v1→v5. Two-mode contract per step. |

**Note on step count:** the plan came out to 24 steps, not 23. Step 20 (service extraction + deploy) needed its own slot rather than being crammed into the resilience step.

---

## Why this domain

Ticketing was chosen because it *forces* the advanced topics rather than decorating with them:

- **Overselling is a real correctness problem** → locking, seat holds with TTL, distributed locks
- **Payment gateways are asynchronous and unreliable** → idempotency keys, outbox pattern, webhooks, compensation
- **On-sale moments are genuine traffic spikes** → caching, rate limiting, read/write split, horizontal scaling
- **Seat maps demand real client state** → the React path isn't a toy

A CRUD app cannot teach these. Any caching or locking you added to one would be theater.

---

## The domain model (target state)

```
Organizer ──creates──> Event ──has──> Showtime ──at──> Venue
                                          │              │
                                          │              └──has──> SeatMap ──has──> Seat
                                          │
                                          └──has──> TicketType (price, quota)

Customer ──creates──> Order ──holds──> SeatHold (TTL) ──becomes──> Ticket
                        │
                        └──has──> Payment ──driven by──> PaymentEvent (webhook)
```

Module boundaries (package-enforced from step 1, ArchUnit-enforced from step 9):

```
com.ticketflow
├── catalog/        events, showtimes, venues, seat maps
├── ordering/       orders, holds, tickets, the purchase transaction
├── payments/       gateway adapters, webhooks, reconciliation
├── identity/       users, roles, auth
├── notification/   email/SMS dispatch  (extracted to own service at step 20)
└── shared/         cross-cutting: errors, config, correlation, base types
```

---

## Global guardrails (Verification Layer 5)

These are continuous, not per-step. Each switches on at a specific step and stays on. CI fails on violation.

| Guardrail | On from | Rule |
|---|---|---|
| Spotless + Palantir format | Step 0 | Build fails on unformatted code. Auto-fixable. |
| **Error Prone + NullAway** | Step 0 | **Compile fails** on likely-NPE paths, `equals` type mismatches, format-string errors, unclosed resources. Highest-value tool here; most commonly skipped. |
| Lefthook pre-commit | Step 0 | Format + fast checks before commit. Must run in <5s or it gets bypassed. |
| `make verify` | Step 0 | One command: format → compile → test → arch → frontend lint. Local, CI, and agent loop all use it. |
| GitHub Actions CI | Step 3 | Runs `make verify` on every push. Nothing else. |
| Testcontainers in CI | Step 3 | Integration tests run real Postgres. No H2 — H2 lies about locking semantics. |
| JaCoCo coverage gate | Step 6 | ≥80% on `**/domain/**` only. Not global — global coverage targets produce fake tests. |
| ArchUnit: layer rules | Step 9 | Controllers must not reference repositories. Domain must not import Spring. |
| ArchUnit: module rules | Step 9 | Modules communicate only via published interfaces or domain events |
| OpenAPI contract diff | Step 12 | Breaking API change fails CI unless version bumped |
| Biome + TS `strict` | Step 15 | Frontend lint, format, import order. Type errors fail the build. |
| SpotBugs + FindSecBugs | Step 14 | Injection paths, weak crypto, XSS sinks. Build fails on high-confidence findings. |
| Dependency vulnerability scan | Step 14 | OWASP dependency-check; build fails on CVSS ≥7 |
| Bundle size budget | Step 18 | Frontend CI fails if the budget is exceeded |

**On what's deliberately absent: Checkstyle and PMD.** Checkstyle largely enforces formatting, which Spotless already does deterministically and with auto-fix. PMD's genuinely useful findings overlap Error Prone with a far worse signal-to-noise ratio. Running all four produces hundreds of warnings nobody reads — and a gate that gets ignored is worse than no gate, because it teaches you that build output is noise. If you later want an aggregate dashboard, SonarQube Community at step 20 is optional. Not before.

---

---

## Reading the steps

Each step's structure, the `LEARN`/`BUILD` mode contract, and the five verification layers are explained in [Getting Started](../../getting-started/#how-to-read-the-roadmap). Read that first if you haven't.
