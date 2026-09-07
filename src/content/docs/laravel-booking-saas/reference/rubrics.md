---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"50 concurrent requests for one slot: exactly one booking exists"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still wrong: the queued job that runs with no tenant and writes to whichever one was last active, the cache key that serves Northside's schedule to Bright Smile. Most don't show up at runtime until they do.

**Why this exists.** The common failure of self-directed learning is that everything *feels* like it works. The rubric turns "done" into something you check rather than something you feel.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never the whole file. The full file leaks later steps and dilutes the reviewer's attention.

---

## Step 0 — Harness and tooling bootstrap

**ACC-00** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a Larastan violation, a failing test. All three must be verified separately — a gate that only catches one thing gives false confidence about the other two.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed with `--no-verify`, permanently, and then the gate exists only in theory. Move slow checks to CI. |
| AP-00-b | **Multiple verification commands.** If the agent (or you) must remember four commands, some will be skipped. One entry point, always. |
| AP-00-c | **Generic `AGENTS.md`.** Restating public Laravel documentation adds nothing — the model already knows it. The file's value is entirely in what is *specific to this project*: your module layout, your conventions, your deliberate deviations from the default. |
| AP-00-d | **Static analysis started at a low level "for now".** Level 8 on an empty project is free; level 8 on 20k lines is a week. A baseline file you never shrink is the same mistake with extra steps. |

---

## Step 1 — Project skeleton

**ACC-01** — a feature test boots the application and asserts `GET /api/v1/health` returns 200 with the expected JSON shape, including database connectivity. A boot failure is itself a meaningful failure — most misconfiguration surfaces here.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **`env()` called outside `config/`.** Returns `null` the moment config is cached, which is the moment you deploy. Read from config, always. |
| AP-01-b | **`app()` or facades scattered through domain classes** instead of constructor injection. Hides dependencies, makes the class untestable without the framework, and turns every refactor into a search. |
| AP-01-c | **Work performed in a service provider's `register()`.** Only bindings belong there; anything resolving another service runs before the container is ready and fails in ways that look random. |

---

## Step 2 — Eloquent and the schema

**ACC-02** — save a `Service` with related staff, reload it in a fresh query, and assert every field and relationship round-trips, including money and timestamps. Runs against real PostgreSQL, not SQLite.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Money as a float or a decimal string.** Floats lose cents. Store integer minor units with the currency beside them, and decide rounding once, in one place. |
| AP-02-b | **`timestamp` instead of `timestamptz`.** A column without a timezone silently records the server's idea of local time, which changes when you move the server. |
| AP-02-c | **Editing a migration that has already run somewhere else.** The migration table says it ran; the schema no longer matches. Write a corrective migration instead. |
| AP-02-d | **Testing against SQLite while running PostgreSQL.** SQLite has no `timestamptz`, no `EXCLUDE` constraint, and different locking. Steps 10 and 12 will not work, and the tests will not tell you. |

---

## Step 3 — The request contract

**ACC-03** — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly, including a per-field errors map. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when `APP_DEBUG=false`.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Returning Eloquent models directly from controllers.** Every column you add is published to clients, including the ones you meant to keep. Use a resource. |
| AP-03-b | **Validation inline in the controller.** Fine once, unmaintainable by the fifth endpoint, and impossible to reuse from a Livewire component or a job. |
| AP-03-c | **Inconsistent error shapes.** Validation returns one format, not-found another, unhandled a third. A client then needs three parsers, and will write one and hope. |

---

## Step 4 — Auth and authorisation

**ACC-04** — a table-driven test over (role × action) asserting allowed and forbidden for every combination, including a user with no role. A forbidden action returns 403 and changes nothing in the database.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Authorisation checks written inline.** `if ($user->role === 'owner')` in a controller cannot be reused, cannot be tested in isolation, and will be missed on the next endpoint. |
| AP-04-b | **Only the happy path tested.** A permission test that never asserts a denial proves nothing at all. |
| AP-04-c | **Confusing authentication with authorisation with tenancy.** "Signed in" is not "may act" is not "may act *here*". Collapsing them is how a user from tenant A ends up editing tenant B's data. |

---

## Step 5 — Tenant resolution

**ACC-05** — a request to a known subdomain resolves the tenant and reaches the route; an unknown subdomain returns 404; a suspended tenant returns 403; an authenticated user without a membership for that tenant returns 403. Four cases, four distinct responses.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Resolving the tenant in a controller or a base class.** Anything running before that point — other middleware, route model binding — has no tenant, which is exactly when leaks happen. |
| AP-05-b | **Falling back to a default tenant when resolution fails.** A silent fallback turns a 404 into a data leak. Fail closed. |
| AP-05-c | **The tenant held in a static property or a global.** It survives between requests in a long-running worker and between jobs in a queue process. Bind it into the container with request scope. |

---

## Step 6 — Scoping and the leak test

**ACC-06** — for every model implementing the tenant contract: create a row for tenant A and one for tenant B, act as tenant A, and assert that listing, finding by id, counting, and route model binding all exclude B's row. Adding a model without the trait must make this test fail.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **A hand-maintained list of tenant-owned models in the test.** The next model added will not be on it. Discover models by reflection so forgetting the trait is a failure, not an omission. |
| AP-06-b | **Unique constraints that ignore `tenant_id`.** A globally unique service name means the second barbershop to sign up cannot call their service "Cut". Every unique index in a tenant-owned table includes the tenant. |
| AP-06-c | **Raw queries and `DB::table()` used casually.** The global scope does not apply. Each one needs an explicit tenant condition and a written reason for existing. |
| AP-06-d | **No tenant in context treated as "return everything".** It must throw. A scope that quietly disables itself is worse than no scope, because you will trust it. |

---

## Step 7 — Tenant context outside the request

**ACC-07** — dispatch a job as tenant A and one as tenant B onto the same worker, in that order, and assert each wrote only to its own tenant. Then run a job that throws and assert the next job on the same worker still has the correct tenant.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Cache keys without the tenant.** The single most common multi-tenant production bug: Northside's schedule served to a Bright Smile patient, with no error anywhere. |
| AP-07-b | **Tenant context set but never cleared.** A worker is a long-running process. Context that leaks between jobs is a leak between customers. Clear it in a `finally`. |
| AP-07-c | **Serialising the whole tenant model into the job.** Stale by the time it runs, and it puts tenant data in the queue payload. Serialise the id. |
| AP-07-d | **A scheduled command that loops over tenants without isolating failures.** Tenant 3 throws and tenants 4 to 400 never run — usually discovered by a customer. |

---

## Step 8 — The tenant back-office

**ACC-08** — a Livewire test creates, edits and deletes a service as an owner, then asserts a staff-role user is forbidden from each write action while still able to read.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Livewire components with no authorisation check.** A mounted component is an entry point exactly like a controller. Route middleware does not protect an action method. |
| AP-08-b | **`wire:model` live on every input.** One request per keystroke. Use the debounced or blur variants unless live is genuinely needed. |
| AP-08-c | **Business logic inside the component.** Availability rules and booking transitions belong in services that a job or an API controller can call too. |

---

## Step 9 — The availability engine

**ACC-09** — a table-driven test where each row states opening hours, existing bookings, time off, buffer and service duration, and asserts the exact list of slots returned. Includes a fully booked day, a day fully off, and a booking overlapping the start and end of opening hours.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **An overlap condition written from memory.** `start < other.end && end > other.start` is right; most first attempts are not, and the failing case is the touching-at-the-boundary one. Test all six interval relations. |
| AP-09-b | **The engine reaching into Eloquent or facades directly.** It becomes untestable without a database, and then it stops being tested at the edges where the bugs are. |
| AP-09-c | **Rules bolted on as nested conditions.** Buffers, lead time, horizon and time off each become an `if` inside the loop, and adding the fifth rule means rereading all four. One class per rule. |

---

## Step 10 — Time correctness

**ACC-10** — with the tenant timezone set to one that observes DST, assert the slot list on the spring-forward day contains no non-existent local time, and on the fall-back day the duplicated hour resolves to exactly one instant. Assert a weekly 09:00 rule stays 09:00 local on both sides of each transition.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Storing local time and the timezone separately as strings.** Every comparison then needs a conversion someone will forget. Store the instant. |
| AP-10-b | **Adding 24 hours to mean "tomorrow".** On DST days it is 23 or 25 hours. Add one day to a timezone-aware value. |
| AP-10-c | **`now()` called directly in domain code.** Untestable, and time-dependent bugs then need a real DST day to reproduce. Inject a clock. |
| AP-10-d | **The server timezone treated as the tenant's.** It works until a customer is in another country, or you move the server. |

---

## Step 11 — The booking state machine

**ACC-11** — a test over every (state × transition) pair asserting allowed transitions succeed and every illegal one throws and changes nothing. Plus: submitting the same booking request twice with one idempotency key creates exactly one booking.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **State assigned from outside the aggregate.** `$booking->status = 'confirmed'` in a controller bypasses every rule you wrote. Transitions are methods. |
| AP-11-b | **Holds kept only in the cache.** They vanish on a cache flush and cannot be queried, audited, or cleaned up. A hold is a row. |
| AP-11-c | **Side effects inside the transition.** Sending mail and charging a card from inside the state change makes the transition untestable and non-atomic. Raise an event. |

---

## Step 12 — Double-booking

**ACC-12** — 50 concurrent requests for the same slot: exactly one booking exists afterwards, 49 receive 409, no 500s, no orphan holds. Run it 20 times; a race that passes once proves nothing.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Check-then-insert.** A `SELECT` proving the slot is free, followed by an `INSERT`, with nothing between them but hope. This is the bug the step exists for. |
| AP-12-b | **Locking a row that does not exist yet.** `FOR UPDATE` on the booking table locks nothing when the booking has not been created. Lock the resource — the staff-day — or rely on the constraint. |
| AP-12-c | **A "concurrency" test that runs sequentially.** A loop of 50 requests in one process is not a race. Use parallel processes against one database. |
| AP-12-d | **Retrying blindly on any exception.** A retry after a partial success with money involved charges twice. Retry only on serialisation and deadlock failures, with backoff. |

---

## Step 13 — Read performance

**ACC-13** — with 200 staff-days and 2,000 bookings seeded, the week-availability endpoint issues fewer than a stated number of queries — asserted on the count, so a regression fails CI — and returns within a stated time budget.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Optimising without a measurement.** An index added on a hunch is a write cost you cannot justify. Plan first, then index, then measure again. |
| AP-13-b | **Eager loading everything, everywhere.** `with()` on relations the page does not render moves the cost rather than removing it, and hides the next N+1. |
| AP-13-c | **A cached value with no invalidation path.** Availability cached until it expires means a customer is offered a slot that was taken ten minutes ago. |

---

## Step 14 — Subscriptions

**ACC-14** — a tenant on the 3-staff plan is refused a fourth staff member with a message naming the limit; after upgrading, the same action succeeds. With a Stripe test clock, a trial ending without a payment method moves the tenant to the restricted state and loses no bookings.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Plan limits checked in the UI only.** The API and the queue reach the same action. Enforce at the point of action, once. |
| AP-14-b | **Card details collected on your own form.** Hosted checkout exists so that your server never sees a card number. Building the form yourself changes your compliance obligations. |
| AP-14-c | **No decision for the downgrade case.** A tenant with 10 staff moving to the 3-staff plan needs a defined outcome — blocked, soft-locked, or archived. "It will not happen" is not one. |

---

## Step 15 — Webhooks

**ACC-15** — the same webhook payload delivered three times causes exactly one state change and one email; out-of-order events resolve to the latest by the event's own timestamp; a bad signature returns 4xx with no writes.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **No signature verification.** An unverified endpoint is a public write API to your billing state. |
| AP-15-b | **Idempotency by a read-then-write check.** Two deliveries in parallel both read "not processed". Use a unique index on the provider event id and let the database decide. |
| AP-15-c | **Heavy work inside the webhook request.** Slow responses cause provider retries, which cause duplicate work, which causes the problem you were trying to avoid. Persist, return 200, process on a queue. |
| AP-15-d | **Trusting webhooks as the only source of truth.** They are lost sometimes. A reconciliation job that compares your state with the provider's is not optional. |

---

## Step 16 — Per-tenant payment credentials

**ACC-16** — with credentials stored for tenants A and B, a webhook carrying B's account resolves to tenant B and writes only to B; a payload for an unknown account is rejected with no writes; the stored column is unreadable without the app key.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Secrets in logs or exception context.** Request logging, error trackers and debug pages all serialise arguments. Redact at the boundary and test that the redaction works. |
| AP-16-b | **A payment client cached as a singleton.** It carries one tenant's credentials into the next tenant's request. Build it per request from the current tenant. |
| AP-16-c | **A webhook endpoint that resolves the tenant after doing work.** Verification and resolution come first; anything else risks writing to the wrong tenant. |

---

## Step 17 — Deposits and refunds

**ACC-17** — the payment succeeds but the hold has expired: the booking is not confirmed, an automatic refund is issued, and the outcome is recorded. Webhook-before-redirect and redirect-before-webhook both end in exactly one confirmed booking and one deposit row.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **The browser redirect treated as proof of payment.** The customer can close the tab, and the URL can be replayed. The webhook is the source of truth. |
| AP-17-b | **An external charge inside a database transaction.** The transaction cannot roll back the charge. Charge outside, compensate with a recorded refund when the local work fails. |
| AP-17-c | **Amounts without a currency.** An integer alone is meaningless the moment a second currency exists, and cross-currency arithmetic then happens silently. |
| AP-17-d | **No reconciliation.** If nothing compares your deposits with the provider's payments, you will find the mismatch when a customer does. |

---

## Step 18 — Queues and Horizon

**ACC-18** — a reminder job run twice sends exactly one email; a booking cancelled before its reminder sends none; a job that throws lands in `failed_jobs` with enough context to retry it by hand.

| ID | Anti-pattern |
|---|---|
| AP-18-a | **One queue for everything.** A webhook waits behind 4,000 reminder emails, and billing state goes stale during a marketing send. Separate queues by priority. |
| AP-18-b | **Non-idempotent jobs.** Retries are normal. A job that sends the email before recording that it sent it will send it twice. |
| AP-18-c | **`failed_jobs` nobody reads.** A failure nobody is alerted to is a silent outage. Alert on the rate, and triage on a schedule. |
| AP-18-d | **Deploying without draining workers.** A worker killed mid-charge leaves money taken and nothing recorded. Signal, drain, then restart. |

---

## Step 19 — The public booking page

**ACC-19** — a browser test books a slot from the public page and asserts the booking exists in the correct tenant at the correct instant. A second test opens the page in two sessions, takes the slot in one, and asserts the other removes it without a reload.

| ID | Anti-pattern |
|---|---|
| AP-19-a | **A broadcast channel without tenant scoping and authorisation.** One business's bookings then appear in another's browser, live. |
| AP-19-b | **The hold countdown enforced only in the client.** The clock in the browser is a display. The server decides when a hold has expired. |
| AP-19-c | **Optimistic UI on taking a slot.** Showing "booked" before the server agrees produces the exact failure the whole flow exists to prevent. |
| AP-19-d | **Times rendered with no timezone stated.** The customer cannot tell whose 09:00 it is, and a fifteen-percent no-show rate is the result. |

---

## Step 20 — The public API

**ACC-20** — a read-only token is refused on booking-create with 403; a token from tenant A cannot read tenant B's availability; exceeding the rate limit returns 429 with retry headers; a revoked token returns 401 immediately.

| ID | Anti-pattern |
|---|---|
| AP-20-a | **Tokens without abilities.** One key that can read availability can also cancel every booking, and it is pasted into a website's source. |
| AP-20-b | **Rate limiting by IP only.** Every customer of one hosting provider shares an IP, and a single token can still exhaust your database from many IPs. Limit per token. |
| AP-20-c | **Hand-written API documentation.** It is wrong within two weeks. Generate it from the routes, or verify it against them in CI. |

---

## Step 21 — The Connect migration

**ACC-21** — the same booking-with-deposit test passes against both payment adapters, selected by the tenant flag. A tenant whose Connect onboarding is incomplete cannot require deposits and is shown an accurate reason.

| ID | Anti-pattern |
|---|---|
| AP-21-a | **Provider types leaking past the adapter.** If a controller mentions a Stripe class, swapping the model means editing controllers, and the two implementations cannot be tested the same way. |
| AP-21-b | **Treating onboarding as complete when the link returns.** Requirements arrive asynchronously, sometimes days later. A tenant can be "onboarded" and unable to receive money. |
| AP-21-c | **A migration with no rollback for in-flight payments.** A tenant switched between the charge and the webhook leaves a payment nobody owns. |

---

## Step 22 — Database per tenant

**ACC-22** — the entire existing test suite passes against both tenancy modes. Migrating a seeded tenant to its own database preserves every row, and afterwards a query as that tenant reaches only its own database — asserted on the connection, not by trusting the scope.

| ID | Anti-pattern |
|---|---|
| AP-22-a | **A cut-over with no verification step.** Copy, verify row counts and checksums, *then* switch. A copy that silently dropped rows is discovered weeks later. |
| AP-22-b | **Writable during the copy.** Rows written after the snapshot and before the switch are lost. Read-only for the tenant, briefly, is the honest trade. |
| AP-22-c | **A per-tenant migration run with no resumability.** Tenant 11 fails and you cannot tell whether 12 to 400 ran. Record per-tenant state and make the command resumable. |
| AP-22-d | **Cross-tenant reporting left broken.** Every platform metric was one query and now is none. Decide the replacement before the migration, not after the board asks. |

---

## Step 23 — Observability and deployment

**ACC-23** — a failing booking request produces a log line carrying request id, tenant id and correlation id, and the queued job it triggers carries the same correlation id. A deploy performed while a booking is in flight loses nothing.

| ID | Anti-pattern |
|---|---|
| AP-23-a | **Logs without a tenant id.** With many tenants sharing one application, "bookings are failing" is unanswerable without it. |
| AP-23-b | **Personal data or secrets in logs.** Customer names, emails, phone numbers and payment identifiers in plain log lines are a breach waiting for the day someone shares a log file. |
| AP-23-c | **A backup never restored.** An untested backup is a belief, not a recovery plan. Restore one into a scratch environment and open the app against it. |
