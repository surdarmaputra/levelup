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
| Assumed baseline | Comfortable with PHP 8 and SQL. New to Laravel. |
| Language / runtime | PHP 8.5, `declare(strict_types=1)` everywhere |
| Framework | Laravel 13.x |
| Domain | Bookline — a booking and scheduling platform sold to service businesses |
| Tenancy | Shared database + `tenant_id`, hand-rolled (steps 5–8) → database per tenant with `stancl/tenancy` (step 22) |
| Tenant resolution | Subdomain (`acme.bookline.test`), resolved in middleware, bound in the container |
| Infrastructure | PostgreSQL 17, Redis 8, Mailpit, Docker Compose |
| Admin frontend | Blade + Livewire 4 + Tailwind 4 (step 8) |
| Customer frontend | Inertia 2 + React 19 + TypeScript + Reverb (step 19) |
| Auth progression | Session auth + policies → per-tenant membership → Sanctum tokens for the public API |
| Payments | Cashier (Stripe) for tenant subscriptions → encrypted per-tenant Stripe keys for deposits → Stripe Connect (step 21) |
| Async | Database queue in development, Redis + Horizon from step 18 |
| Testing | Pest 4 against real PostgreSQL. Tests gate every step. Test-first on tenancy, time, concurrency, and money. |
| Quality | Pint (format), Larastan level 8, Rector, a tenancy leak sweep in CI. No PHP_CodeSniffer, no PHPMD — one formatter, one static analyser. |
| Ops | Docker Compose → single VPS behind nginx. Managed platforms (Forge, Vapor, Cloud) are noted, not used. |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** the roadmap is 24 numbered steps, 0 through 23. Step 21 (Connect) and
step 22 (database per tenant) each get their own slot rather than being folded into earlier
steps — both are migrations of working code, and that is the point of them.

---

## Why this domain

A booking SaaS was chosen because it *forces* the advanced topics rather than decorating with
them:

- **Every row belongs to a tenant** → resolution, scoping, context propagation, and a leak test that fails loudly
- **A slot can only be sold once** → transactions, row locks, exclusion constraints, and the difference between them
- **Time is genuinely hard here** → UTC storage, tenant-local rendering, DST gaps, recurring weekly hours
- **Two money flows in one product** → recurring subscriptions from the business, one-off deposits from its customers
- **Nothing happens on a page load** → reminders, expiries, and payment follow-ups all run on queues

A CRUD app cannot teach these. Any locking or caching you added to one would be for show.

---

## The domain model (target state)

```
Tenant ──has──> Membership ──> User          (staff and owners of one business)
   │
   ├──has──> Service (duration, price, deposit policy)
   │
   ├──has──> Staff ──has──> WorkingHours (weekly rule)
   │                └──has──> TimeOff (date range)
   │
   ├──has──> Booking ──for──> Service
   │            │        └──with──> Staff
   │            ├──held as──> SlotHold (TTL)
   │            └──has──> Deposit ──driven by──> PaymentEvent (webhook)
   │
   ├──has──> Customer (of the business, not of the platform)
   │
   └──has──> Subscription (the business's own plan with the platform)
```

Two words that look alike and are not:

- a **User** is a person who signs in to the back-office — an owner or a staff member
- a **Customer** is a person who books an appointment. They never sign in.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each one at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, static analysis, tests, in one command | 0 | Everything below, in one place |
| Laravel Pint | 0 | Formatting arguments |
| Larastan level 8 | 0 | Type errors, undefined properties, wrong Eloquent return types |
| Pest against real PostgreSQL | 2 | Behaviour differences SQLite hides — locking, JSON, ranges, `EXCLUDE` |
| The tenancy leak sweep | 6 | Any tenant-owned model without the global scope, and any query that bypasses it |
| Rector, dry-run in CI | 3 | Dead code and outdated idioms after a framework upgrade |
| CI on every push | 0 | The above, on a machine that is not yours |

The tenancy leak sweep is the one that matters most. It is a test that walks every model
implementing your tenant contract, creates a row for two tenants, and asserts that a query
under tenant A never returns tenant B's row. Adding a model without the trait must fail it.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Two things to keep in mind while
working through them:

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. Tenancy scoping, DST, concurrency, and idempotency all *look* simple in a
generated diff and are wrong in ways you only find in production.

**The two migration steps are not optional.** Steps 21 and 22 change decisions you made
earlier. That is the exercise: you are meant to feel what it costs to change a payment
integration and a tenancy model on code that already works, because that is what the job is.
