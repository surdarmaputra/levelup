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
| Assumed baseline | Comfortable with TypeScript and SQL. New to AdonisJS. |
| Language / runtime | TypeScript 5.9 strict, Node 24, ES modules |
| Framework | AdonisJS 7.x |
| Domain | Antar — a last-mile delivery platform for shops (food stalls, pharmacies, builders' merchants) |
| Persistence | Lucid + PostgreSQL 17 with PostGIS. Migrations are the source of truth; schema classes are generated from them and committed. |
| Validation | VineJS, schemas kept beside the controller that uses them |
| Auth | `@adonisjs/auth` — session guard for the ops console, access tokens for the courier app and the public API. `@adonisjs/bouncer` for abilities and policies. |
| Async | `@adonisjs/queue` on the Redis driver, with the scheduler for sweeps. It is experimental — step 11 records the decision and the exit plan. |
| Realtime | `@adonisjs/transmit` (server-sent events) with the Redis transport |
| Cache | `@adonisjs/cache`, two-tier (memory L1 + Redis L2), from step 20 |
| Ops console | Edge templates + Vite + Tailwind 4 (step 17) |
| Customer surface | Inertia 2 + React 19 + TypeScript (step 18) |
| Payments | Stripe payment intents for the customer charge, a local double-entry ledger for courier payouts and platform commission |
| Testing | Japa against real PostgreSQL with PostGIS. Tests gate every step. Test-first on state, concurrency, time, and money. |
| Quality | Prettier (format), ESLint, `tsc --noEmit`, the dispatch invariant sweep in CI. One formatter, one linter, no second opinion. |
| Ops | Docker Compose → single VPS behind nginx, web and worker processes separated. Managed platforms are noted, not used. |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** the roadmap is 24 numbered steps, 0 through 23. Step 22 (regional
dispatch) gets its own slot rather than being designed in from the start — it is a migration of
working code, and that is the point of it.

---

## Why this domain

Last-mile delivery was chosen because it *forces* the advanced topics rather than decorating
with them:

- **One courier can only do one job at a time** → transactions, row locks, `SKIP LOCKED`, and a constraint that makes the bad state unrepresentable
- **The truth arrives from a phone with bad signal** → idempotency keys, append-only events, out-of-order handling, and endpoints that can be called twice
- **"Nearest available courier" is a real query** → PostGIS, spatial indexes, and a query plan you have to read
- **A promise made now is judged later** → UTC storage, local rendering, deadline timers on a queue, and a clock you can freeze
- **Money moves both ways** → a charge to the customer, a payout to the courier, a commission to the platform, and webhooks delivered twice
- **Nothing happens on a page load** → dispatch retries, stuck-order sweeps, and notifications all run on workers

A CRUD app cannot teach these. Any locking or caching you added to one would be for show.

---

## The three example merchants

Every step is written against the same three shops. Seed them in step 2 and keep them for the
rest of the roadmap — they disagree with each other on purpose, and a feature that works for all
three is a feature that works.

| Merchant | Setup | The rule it exists to break |
|---|---|---|
| **Warung Pak Budi** `warung-budi` | One-person food stall. One bag per order, 15 minutes prep, a 3 km radius, cash accepted at the door | The simple case. One order, one parcel, one courier, dispatched now. If this is wrong, nothing else matters. |
| **Sehat Pharmacy** `sehat-pharmacy` | Prescription items needing an ID check and a signature; cold-chain items with a 30-minute limit in transit; some items only a verified courier may carry | Not every courier may take every job, the delivery cannot be completed by leaving it at the door, and the job can expire while it is still in progress |
| **Atlas Hardware** `atlas-hardware` | Bulky goods. One order → three drop-offs, a van and two couriers, booked into a two-hour window tomorrow morning | Breaks a model built around "one order = one parcel = one courier = right now", and adds a pickup where one of the three items is missing |

Concrete questions to keep asking as you build: can a courier without a cold bag be offered
Sehat's insulin run? What is the state of Atlas's job when stop 2 of 3 fails but stops 1 and 3
succeed? Does Warung's promised time survive the courier taking a second job on the way?

None of the three may ever be special-cased in code. If you find yourself writing
`if (merchant.slug === 'sehat-pharmacy')`, the model is wrong, not the merchant. What Sehat needs
is a *capability requirement on the item* and a *completion rule on the job*, both of which the
other two also have — theirs are just empty.

---

## The domain model (target state)

```
Merchant ──has──> Membership ──> User          (staff who sign in to the console)
   │
   ├──has──> Order ──has──> OrderItem (handling requirements: cold, signature, ID check)
   │            │
   │            ├──becomes──> DeliveryJob ──assigned to──> Courier
   │            │                  ├──has──> Stop (pickup / dropoff, sequenced)
   │            │                  ├──has──> ProofOfDelivery (photo, signature, ID check)
   │            │                  └──has──> JobEvent (append-only, courier-reported)
   │            │
   │            ├──has──> Payment ──driven by──> PaymentEvent (webhook)
   │            └──for──> Customer (of the merchant, not of the platform)
   │
   └──has──> CommissionEntry                   (what the platform keeps)

Courier ──has──> Shift (when they work)
   ├──has──> Capability (cold bag, van, prescription-verified)
   ├──has──> LocationPing (last known position, PostGIS geography point)
   └──has──> PayoutEntry                       (what the platform owes)
```

Three pairs of words that look alike and are not:

- an **Order** is what the merchant sold. A **DeliveryJob** is the work of moving it. Warung has
  one of each; Atlas has one order and a job with three stops, and may end up with two jobs.
- a **User** signs in to the ops console or the merchant console. A **Customer** receives the
  parcel and never signs in. A **Courier** signs in to the courier app with an access token.
- a **JobEvent** is what the courier's phone reported. The job's **state** is what the server
  concluded from those events. They are not the same record, and the second is derived from the
  first.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each one at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `npm run verify` — format, lint, types, tests, in one command | 0 | Everything below, in one place |
| Prettier | 0 | Formatting arguments |
| ESLint | 0 | Unused code, unsafe patterns, import rules |
| `tsc --noEmit` on strict | 0 | The errors a running test never reaches |
| Japa against real PostgreSQL + PostGIS | 2 | Behaviour SQLite hides — locking, `SKIP LOCKED`, geography types, timestamptz |
| Schema drift check — generated schema classes match the migrations, and are committed | 2 | A model typed against a column that no longer exists |
| The dispatch invariant sweep | 8 | Any path that can leave a courier holding two active jobs, or an order with two active jobs |
| CI on every push | 0 | The above, on a machine that is not yours |

The dispatch invariant sweep is the one that matters most. It is a test that fires concurrent
assignment attempts at one courier and one job from parallel processes, then asserts the
database ended in exactly one valid state. Adding a new assignment path that bypasses the
constraint must fail it.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Two things to keep in mind while
working through them:

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. State transitions, concurrency, idempotency, time, and money all *look*
simple in a generated diff and are wrong in ways you only find in production.

**Step 22 is not optional.** Regional dispatch changes decisions you made in steps 7 and 8 on
code that already works. That is the exercise: you are meant to feel what it costs to split a
single global dispatch loop into one per city, because that is what the job is.
