---
title: Dispatch
description: Steps 5–9. The order state machine, couriers and eligibility, the dispatch engine, assignment under concurrency, geography.
sidebar:
  order: 3
---

## Step 5 — The order and the delivery job: two aggregates, one state machine

**Story:** *As a merchant, an order I place moves through states I can explain, so that "where is it?" always has one answer.*

**Mode:** `LEARN` — a state machine written by an agent looks right and permits transitions you did not intend.

**Why now:** Everything after this reads or writes a state. Adding the state machine after dispatch means the transitions already exist, scattered across controllers, and you are refactoring instead of designing.

**Concepts:**
- **Aggregates and their boundaries**: an `Order` is what the merchant sold, a `DeliveryJob` is the work of moving it. Atlas Hardware's order becomes one job with three stops — or two jobs — and that is the whole reason they are separate tables.
- **States as an enum, transitions as methods**: `placed → ready → assigned → picked_up → delivered`, plus `cancelled` and `failed`. Nothing else may write the column.
- **Illegal transitions must fail loudly** — a delivered job cannot go back to assigned, and the code that tries must throw a domain error, not update zero rows
- **Guard conditions**: a job may only be assigned if the order is ready; a job may only be picked up if a courier holds it
- **Domain events** (`OrderPlaced`, `JobAssigned`, `JobDelivered`) as the seam every later step hangs off — jobs in step 11, notifications, the ledger in step 16
- **Terminal states and what may still happen after one** — a delivered job can still be refunded; a cancelled one cannot be picked up
- Why a `status` string updated from five controllers is the bug you are preventing

**Libraries:** the framework emitter; no state-machine package — writing it is the exercise

**Expected outcome:** `DeliveryJob` and `Stop` tables and models, a state enum, transition methods on the job that are the only writers of the state column, and domain events emitted on each transition. A transition table written down in `docs/` — from-state, event, to-state, guard — and matching code. Atlas's three-stop job and Warung's single-stop job both representable without a special case.

```text
app/dispatch/
├── domain/        job state, transitions, guards, events — no framework imports
├── application/   the services that call them
└── http/          controllers, serializers
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — a table-driven test over every (state × event) pair. Legal pairs move the job to the expected state and emit the expected event; every other pair throws and leaves the row unchanged. The illegal cases outnumber the legal ones. |
| **L2 — Manual checks** | (a) Grep for writes to the state column. There must be exactly one place. <br>(b) Model Atlas's three-stop job on paper. If completing stop 2 has no representation short of "delivered", the model is not finished. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and the transition table in `docs/` matches the code exactly |

---

## Step 6 — Couriers, shifts, and capabilities

**Story:** *As a dispatcher, I can see which couriers are working right now and what each of them is equipped to carry, so that I never offer a job to someone who cannot do it.*

**Mode:** `BUILD` — modelling and CRUD. Generate it, then check the edge cases yourself.

**Why now:** Step 7 selects candidates. Selecting from a set you have not defined produces a filter written against whatever fields happened to exist.

**Concepts:**
- **Availability is derived, not stored**: a courier is available if they are on shift, online, and not holding an active job. A boolean column that says so goes stale the moment a process dies.
- **Capabilities as data**: `cold_bag`, `van`, `prescription_verified`. Sehat's insulin run needs the first, Atlas's load needs the second. Neither is a merchant name in an `if`.
- **Requirements on the item, capabilities on the courier**, and the set comparison between them — this is what stops step 7 from becoming a chain of special cases
- **Shifts and time windows** — the first place the clock shows up; a shift that crosses midnight is the case that breaks a naive query
- **Soft state that expires**: an "online" flag is only true as long as the last ping is recent
- Modelling vehicles without inventing a fleet-management system

**Libraries:** `@adonisjs/lucid`

**Expected outcome:** `couriers`, `shifts`, `courier_capabilities` tables with models and factories; `handling_requirements` on order items. A query that returns "couriers on shift and online right now", and a pure function that answers "can this courier carry this order?" from capabilities and requirements alone. Seeded couriers that differ: one with a cold bag, one with a van, one with neither.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — for each of the three merchants' orders, assert exactly which seeded couriers are eligible and which are not, and that the reason for each rejection is a named requirement rather than a boolean. A courier whose shift ended one minute ago is not eligible. |
| **L2 — Manual checks** | (a) Add a capability to the seed data and confirm nothing in the eligibility code changed. If it did, the capability is not data. <br>(b) Model a shift running 22:00–06:00 and check the availability query is still right. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and adding a new requirement type touches data and one enum, not the eligibility logic |

---

## Step 7 — The dispatch engine: candidates, scoring, and offers

**Story:** *As a dispatcher, a ready order is offered to the courier who should get it, so that I do not pick from a list by hand.*

**Mode:** `LEARN` — the engine is the heart of the product. Write it, then have your agent attack it.

**Why now:** It needs the state machine (step 5) and eligibility (step 6). It must exist before concurrency (step 8), because step 8 is about what happens when this engine runs twice at once.

**Concepts:**
- **A pure function at the core**: candidates in, ranked offers out. No database calls, no clock reads, no framework imports in the signature — this is what makes it testable and what makes step 22 possible.
- **Scoring is a policy, not an algorithm**: distance, current load, time on shift, and the promised time. Write the weights down, and make them configuration rather than constants in a loop.
- **Offer, accept, expire** — a courier is offered a job and has 30 seconds to accept. That expiry is a timer, which is why step 11 exists.
- **Fairness and starvation**: a scoring function that always prefers the closest courier gives the same person every job and leaves the far ones idle. Name what you do about it.
- **Scheduled work is different work**: Atlas's booked window is not dispatched now, it is dispatched at a computed time. One engine, two entry points.
- **Explainability**: every offer records why that courier scored where they did. Without it, "why didn't I get that job?" is unanswerable.

**Libraries:** none — this step adds no dependency, on purpose

**Expected outcome:** A dispatch engine module taking plain value objects (job requirements, candidate couriers with position and load, the current instant) and returning a ranked list with a score breakdown per candidate. An `offers` table recording who was offered what, when, with what score, and how it ended. Configuration for the weights, with the defaults written down and justified.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — unit tests of the engine with no database and no clock: an ineligible courier never appears in the ranking; among eligible couriers the ordering matches the documented weights; two identical candidates produce a deterministic, documented tie-break. |
| **L2 — Manual checks** | (a) Run the engine over the seed data for all three merchants and read the score breakdowns. Any ranking you cannot explain out loud is a weight you do not understand. <br>(b) Try to import a Lucid model into the engine. If it works, the boundary is not enforced. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, the engine runs in tests with no database at all, and every offer carries its score breakdown |

---

## Step 8 — Assignment under concurrency: one courier, one job

**Story:** *As a courier, when I accept a job, it is mine, so that I never arrive at a pickup someone else already collected.*

**Mode:** `LEARN` — this is the step. An agent will write something that passes a single-threaded test and fails under load.

**Why now:** The engine exists and can produce two offers for the same courier in the same second. This is where you find out whether your assignment path is a read followed by a write.

**Concepts:**
- **Why `SELECT` then `INSERT` is a bug**: the gap between them is where the second request lives. This is the single most important idea in the roadmap.
- **Transactions and isolation levels**: what read-committed actually promises, and what it does not
- **Row locks**: `FOR UPDATE`, and `FOR UPDATE SKIP LOCKED` for pulling work from a queue table without two workers taking the same row
- **Making the bad state unrepresentable**: a partial unique index — at most one active job per courier, at most one active job per order — so the database refuses the second write even if your code is wrong
- **Constraint violations are control flow here**: catching the unique-violation error and turning it into a 409 is correct design, not a hack
- **Optimistic vs pessimistic**: which one fits an accept-an-offer flow, and why the answer changes if offers are rare
- **Testing concurrency honestly**: parallel processes against one database. A loop in a single process proves nothing, and neither does a sleep.

**Libraries:** `@adonisjs/lucid` transactions; PostgreSQL partial unique indexes

**Expected outcome:** An accept-offer path that runs in one transaction, takes the right lock, writes the assignment, and is backed by database constraints that make a second assignment impossible. A 409 problem-details response for the loser. The dispatch invariant sweep from the [overview](../overview/#global-guardrails-verification-layer-5), wired into `npm run verify`.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — 50 concurrent accepts, from real parallel processes against one database, for one job offered to five couriers: exactly one assignment row exists, exactly one request got 201, the other 49 got 409, and no job is left in an intermediate state. Then the same for one courier accepting five different jobs at once. |
| **L2 — Manual checks** | (a) Drop the unique index and re-run `ACC-08`. If it still passes, your test is not concurrent. Put the index back. <br>(b) Read the SQL your accept path issues with query logging on. Count the round trips inside the transaction. <br>(c) Kill the process between the lock and the commit and confirm the row is not left locked. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green with the constraint *and* the transaction, and green with the constraint alone |

**Harness impact:** `AGENTS.md` v3 — assignment happens in one transaction behind the constraint, and no other code path creates an assignment.

---

## Step 9 — Geography: nearest couriers, and the index that makes it fast

**Story:** *As a dispatcher, the couriers nearest a pickup are found in milliseconds, so that dispatch does not wait on the database.*

**Mode:** `LEARN` — a query that works and a query that scales look identical until you read the plan.

**Why now:** The engine already ranks by distance using whatever you had. This step makes "nearest" a real spatial query and gives you the first `EXPLAIN` you have to read properly.

**Concepts:**
- **`geography` vs `geometry`**: one measures in metres on a sphere, the other in degrees on a plane. Picking wrong makes every distance subtly wrong, and only in the wrong hemisphere does it become obvious.
- **`ST_DWithin` over `ST_Distance < x`**: only the first can use the index, and why
- **GiST indexes** — what they store, and what `EXPLAIN (ANALYZE, BUFFERS)` shows before and after
- **Straight-line distance is a lie**: it is a fine *ranking* signal and a bad *promise*. Where routing distance would be needed, and why you are not adding a routing service.
- **Location pings**: a write-heavy table, how often to keep them, and why the "last known position" belongs somewhere you can index cheaply
- **Bounding the search**: the merchant's radius (Warung's 3 km) as a filter before scoring, not after
- Reading a query plan: sequential scan, index scan, and the row-count estimate that tells you the planner is guessing

**Libraries:** PostGIS, `@adonisjs/lucid` raw queries where the query builder cannot express it

**Expected outcome:** A `location_pings` table plus a last-known-position representation with a GiST index. A candidate query returning eligible couriers within a merchant's radius of the pickup, ordered by distance, used by the step 7 engine through a repository so the engine stays pure. A written before/after `EXPLAIN` comparison in `docs/`.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — with 10,000 seeded courier positions, the nearest-courier query returns the couriers a hand-computed check says it should, in the right order, and its plan uses the spatial index. Assert the plan, not the wall-clock time. |
| **L2 — Manual checks** | (a) Read `EXPLAIN (ANALYZE, BUFFERS)` with and without the index. Write down both. <br>(b) Move a courier across the antimeridian or the equator in the seed data and confirm the distance is still right. <br>(c) Check what the query does when a courier has never sent a ping. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and you can explain why `ST_DWithin` is index-usable and a distance comparison in `WHERE` is not |
