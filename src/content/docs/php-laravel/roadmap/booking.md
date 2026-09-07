---
title: Booking and Availability
description: Steps 9–13. The availability engine, time correctness, the booking state machine, double-booking, read performance.
sidebar:
  order: 4
---

The core of the product. Five steps, four of them `LEARN`, because every one of them is a place
where generated code looks right and is wrong.

---

## Step 9 — Working hours, staff schedules, and the availability engine

**Story:** *As a customer, I see the times I can actually book with a given member of staff, so that I am not offered a slot that will be refused.*

**Mode:** `LEARN` — this is an algorithm, and it is the product.

**Why now:** Everything after this consumes availability: the booking flow, the public page, the reminders. Get the shape wrong and all three inherit it.

**Concepts:**
- **Availability as set arithmetic**: opening hours, minus time off, minus existing bookings, minus buffers, intersected with a booking horizon
- **Interval algebra** — the six ways two intervals can relate, and the two that people always forget when they write the overlap condition by hand
- **Slot granularity**: fixed grid (every 15 minutes) vs free-start. What each does to the number of candidate slots and to customer expectations.
- **Buffers and setup time**: before, after, and the difference between a service that needs cleanup and one that does not
- **Lead time and horizon** — no bookings in the next two hours, none more than 60 days out
- **Capacity beyond one**: a class with eight places is the same engine with a count instead of a boolean. Decide now whether you support it.
- **Where the computation lives**: a pure, testable service that takes a date range and returns intervals, with no framework types in its signature
- **Property-based thinking**: what must be true of *any* output — no slot outside opening hours, no slot overlapping a booking, no slot shorter than the service

**Libraries:** `nesbot/carbon` (bundled), optionally `spatie/period` — decide whether the dependency earns its place

**Expected outcome:** A pure `AvailabilityService` taking (staff, service, date range) and returning available intervals, with working hours, time off, existing bookings, buffers, lead time and horizon all applied. Table-driven tests covering each rule alone and in combination.

```text
app/Scheduling/
├── Availability/   the engine — no Eloquent, no facades in the signature
├── Rules/          one class per constraint: WorkingHours, TimeOff, Buffer, LeadTime
└── ValueObjects/   Interval, SlotSize, Duration
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a table-driven test where each row states opening hours, existing bookings, time off, buffer and service duration, and asserts the exact list of slots returned. Include a day fully booked, a day fully off, and a booking that starts before opening and ends after it. |
| **L2 — Manual checks** | (a) Feed the engine a week with 200 existing bookings and time the call. Note the number; step 13 will attack it. <br>(b) Hand the rules list to someone else and ask them to name a case you did not test. There is always one. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and the engine can be tested without touching the database |

---

## Step 10 — Time correctness: timezones, DST, recurrence

**Story:** *As a customer travelling abroad, my 09:00 appointment is still at 09:00 in the shop's town, so that I arrive when the business expects me.*

**Mode:** `LEARN` — expect to fail review here. Almost everyone does.

**Why now:** Step 9 produced intervals. Until they are anchored to real instants they are only numbers, and the bugs are invisible in a single timezone.

**Concepts:**
- **Instant vs local time**: a booking happens at an instant; opening hours are a local wall-clock rule. They are different types and storing them the same way is the root of most calendar bugs.
- **Store UTC, render tenant-local** — and the third timezone, the customer's, which affects display only
- **DST gaps**: on the spring-forward day, 02:30 does not exist. What does your engine emit for a business that opens at 02:00?
- **DST overlaps**: on the autumn day, 01:30 happens twice. Which one did the customer book?
- **Recurring weekly rules** are local rules — "every Tuesday at 09:00" is not "every 168 hours"
- **Duration vs interval arithmetic**: adding one day is not adding 24 hours
- Carbon's immutable API, and why the mutable one causes action at a distance
- **A clock abstraction** so tests can control "now" instead of sleeping
- Where the tenant's timezone is set, and what happens when the business changes it after bookings exist

**Libraries:** Carbon (immutable), PHP's `IntlDateFormatter` for display, a `Clock` interface of your own

**Expected outcome:** All timestamps stored as `timestamptz` in UTC, a `Clock` bound in the container and frozen in tests, availability computed against the tenant timezone, rendering in the viewer's timezone, and explicit, tested behaviour on both DST boundaries.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — with the tenant timezone set to one that observes DST, assert the slot list on the spring-forward day contains no non-existent local time, and on the fall-back day the duplicated hour resolves to exactly one instant. Assert a weekly 09:00 rule stays 09:00 local on both sides of each transition. |
| **L2 — Manual checks** | (a) Set the tenant timezone to `Pacific/Chatham` (a 45-minute offset) and read the rendered schedule. <br>(b) Change a tenant's timezone after bookings exist. Decide, and document, whether existing bookings move. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and no `now()` call remains outside the clock |

---

## Step 11 — The booking flow and its state machine

**Story:** *As a customer, I can hold a slot while I finish entering my details, so that it is not taken from under me mid-form.*

**Mode:** `LEARN` — the state machine is a design decision with consequences you will live with.

**Why now:** Step 12 makes this correct under concurrency. You cannot make a flow correct before the flow exists.

**Concepts:**
- **The states**: held → pending → confirmed → completed, plus cancelled and no-show. Draw the diagram before writing code.
- **Illegal transitions** — confirmed → held must be impossible, and "impossible" means the model refuses, not that no screen offers it
- **Holds with a TTL**: why a hold is a row and not a cache entry, and how it is released — lazily on read, actively by a job, or both
- **Where the rules live**: an enum for the state, a transition method on the aggregate, and events for the side effects
- **Events and listeners**: `BookingConfirmed` fans out to email, calendar and metrics without the booking service knowing about any of them
- **Idempotent transitions** — a double-submitted form must not create two bookings
- **Cancellation policy** as data, not as an `if` — a window, a fee, and who may cancel
- **Audit**: who changed what, when. A booking dispute is a support ticket you answer from the log.

**Libraries:** framework events and enums; a state-machine package only if you can say what it adds

**Expected outcome:** A `Booking` aggregate with a state enum and guarded transitions, `SlotHold` with a TTL and a release path, domain events for each transition, an idempotency key on booking creation, and an append-only booking audit trail.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — a test over every (state × transition) pair asserting allowed transitions succeed and every illegal one throws and changes nothing. Plus: submitting the same booking request twice with one idempotency key creates exactly one booking. |
| **L2 — Manual checks** | (a) Create a hold and let it expire. Confirm the slot returns to availability by both paths — the lazy read and the sweeper job. <br>(b) Draw the state diagram from the code, not from memory. If it differs from your original drawing, one of them is wrong. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and no code outside the aggregate assigns a booking state |

---

## Step 12 — Double-booking: locking vs an exclusion constraint

**Story:** *As a business owner, two customers can never hold the same slot with the same member of staff, so that I never have to phone one of them to apologise.*

**Mode:** `LEARN` — write the failing concurrency test first. It is the only way to know your fix worked.

**Why now:** Everything needed to make the race happen now exists. Doing this earlier would have meant simulating it.

**Concepts:**
- **Why check-then-insert is always a bug**: between the `SELECT` that finds the slot free and the `INSERT` that takes it, another request does the same thing
- **Transaction isolation** in PostgreSQL: what `READ COMMITTED` actually promises, and why "it worked in testing" means "only one request at a time"
- **Pessimistic locking**: `SELECT ... FOR UPDATE` on what, exactly? Locking the booking row does nothing — the row does not exist yet. Lock the staff-day, or the resource.
- **The database as the guarantee**: a PostgreSQL `EXCLUDE USING gist` constraint over a `tstzrange` and the staff id makes overlap *unrepresentable*. Compare it honestly with the lock.
- **Deadlocks** — consistent lock ordering, and what to do with the deadlock you still get
- **Retry and backoff** on serialisation failures, and why blind retry on any exception is dangerous with money involved
- **Testing concurrency in PHP**: parallel processes against one database, not threads. What your test harness must do to make the race real.
- **The user-facing failure** — 409 with a fresh slot list, never a 500

**Libraries:** PostgreSQL `btree_gist` extension, Pest with parallel processes

**Expected outcome:** An exclusion constraint preventing overlapping non-cancelled bookings per staff member, transactional slot-taking with the appropriate lock, a translated 409 response with fresh availability, and a concurrency test that reliably fails before the fix.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — 50 concurrent requests for the same slot: exactly one booking exists afterwards, 49 receive 409, no 500s, and no orphan holds remain. Run it 20 times; a race that passes once proves nothing. |
| **L2 — Manual checks** | (a) Drop the exclusion constraint and re-run the test. It must fail. If it still passes, the test is not concurrent. <br>(b) Read the PostgreSQL log for deadlocks during the run and account for each one. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green 20 runs in a row, and the database alone would still prevent the overlap |

**Harness impact:** `AGENTS.md` — record that slot-taking is transactional and constraint-backed, and that no code path may create a booking outside that service.

---

## Step 13 — Read performance: N+1, eager loading, indexing

**Story:** *As a customer, the booking page shows me next week's availability immediately, so that I do not give up and phone instead.*

**Mode:** `LEARN` — reading a query plan is a skill, and it does not transfer from a generated diff.

**Why now:** The availability query is now the hottest read in the product, and step 19 puts it in front of real customers.

**Concepts:**
- **The N+1 problem** properly: how it appears through relations, through accessors, and inside Blade and Livewire loops
- **Eager loading** — `with`, `load`, constrained eager loads, `withCount`, and when eager loading makes things worse
- **Reading `EXPLAIN (ANALYZE, BUFFERS)`**: sequential scan vs index scan, estimated vs actual rows, and what a nested loop over 10k rows costs
- **Index design for this domain**: `(tenant_id, staff_id, starts_at)`, and why column order is the whole decision. A GiST index for the range queries.
- **Chunking and lazy collections** for exports, and why `->get()` on a year of bookings kills the process
- **Selecting columns**: `select` on wide tables, and the cost of hydrating full models for a list view
- **Caching what is expensive and stable** — the computed availability for a staff-day, invalidated by a booking event, with the tenant in the key (step 7)
- **Measuring first**: a number before and after, or it did not happen

**Libraries:** `laravel/telescope` or `barryvdh/laravel-debugbar` in development only, PostgreSQL `EXPLAIN`

**Expected outcome:** Query counts bounded on every list screen, indexes chosen from real plans rather than guesses, an availability cache keyed by tenant, staff and day with event-driven invalidation, and a recorded before/after for the week-view query.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — with a seeded dataset of 200 staff-days and 2,000 bookings, assert the week-availability endpoint issues fewer than a fixed number of queries (assert on the count, so a regression fails CI) and returns within a stated budget. |
| **L2 — Manual checks** | (a) Run `EXPLAIN (ANALYZE, BUFFERS)` on the availability query before and after your index. Save both plans in `docs/`. <br>(b) Create a booking and confirm the cached availability for that staff-day is invalidated — and that no other tenant's cache was touched. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and you can explain each index you added by pointing at a plan |
