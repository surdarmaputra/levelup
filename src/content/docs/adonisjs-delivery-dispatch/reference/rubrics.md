---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"50 concurrent accepts for one job: exactly one assignment exists"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still wrong: the availability check that reads before it writes, the worker that pays a courier twice after a restart, the cache key that serves Sehat's board to Warung's staff. Most don't show up at runtime until they do.

**Why this exists.** The common failure of self-directed learning is that everything *feels* like it works. The rubric turns "done" into something you check rather than something you feel.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never the whole file. The full file leaks later steps and dilutes the reviewer's attention.

---

## Step 0 — Harness and tooling bootstrap

**ACC-00** — `npm run verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a type error, a failing test. All three must be verified separately — a gate that only catches one thing gives false confidence about the other two.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed with `--no-verify`, permanently, and then the gate exists only in theory. Move slow checks to CI. |
| AP-00-b | **Multiple verification commands.** If the agent (or you) must remember four commands, some will be skipped. One entry point, always. |
| AP-00-c | **Generic `AGENTS.md`.** Restating public AdonisJS documentation adds nothing — the model already knows it. The file's value is entirely in what is *specific to this project*: your module layout, your conventions, your deliberate deviations from the default. |
| AP-00-d | **TypeScript loosened "for now".** `any` in a signature, `strict` off, or `skipLibCheck` hiding a real conflict. Strictness on an empty project is free; strictness on 20k lines is a week, and the usual outcome is a list of exceptions nobody removes. |

---

## Step 1 — Project skeleton

**ACC-01** — a functional test boots the application and asserts `GET /api/v1/health` returns 200 with the expected JSON shape, including database and Redis status. A boot failure is itself a meaningful failure — most misconfiguration surfaces here.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Reading `process.env` directly.** The typed env exists so a missing variable fails at boot with a name attached. Reading the raw object gives you `undefined` at 3am instead. |
| AP-01-b | **Importing services directly instead of injecting them.** A module that imports its dependency by path cannot be substituted in a test and cannot be reconfigured per environment. Let the container build it. |
| AP-01-c | **Work performed in a provider's register phase.** Only bindings belong there; anything resolving another service runs before the container is ready and fails in ways that look random. |

---

## Step 2 — Lucid and the schema

**ACC-02** — save an `Order` with items and addresses, reload it in a fresh query, and assert every field and relationship round-trips: money, timestamps and the geography point. Runs against real PostgreSQL with PostGIS, not SQLite.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Money as a float or a decimal string.** Floats lose cents. Store integer minor units with the currency beside them, and decide rounding once, in one place. |
| AP-02-b | **`timestamp` instead of `timestamptz`.** A column without a timezone silently records the server's idea of local time, which changes when you move the server. |
| AP-02-c | **Two float columns instead of a geography point.** It works until step 9, where you either add PostGIS anyway or write a distance formula by hand and index nothing. |
| AP-02-d | **Editing a migration that has already run somewhere else, or leaving generated schema classes uncommitted.** The migration table says it ran; the schema no longer matches. Write a corrective migration, and let CI fail on drift. |

---

## Step 3 — The request contract

**ACC-03** — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly, including a per-field errors map. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when the app is not in debug mode.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Returning models directly from controllers.** Every column you add is published to clients, including the ones you meant to keep. Serialize explicitly. |
| AP-03-b | **Validation written inline in the controller.** Fine once, unmaintainable by the fifth endpoint, and impossible to reuse from the console forms in step 17. |
| AP-03-c | **Inconsistent error shapes.** Validation returns one format, not-found another, unhandled a third. A client then needs three parsers, and will write one and hope. |

---

## Step 4 — Auth and authorization

**ACC-04** — a table-driven test over (role × action) asserting allowed and forbidden for every combination, including a user with no membership and a user with a membership for a *different* merchant. A forbidden action returns 403 and changes nothing in the database.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Authorization checks written inline.** `if (user.role === 'owner')` in a controller cannot be reused, cannot be tested in isolation, and will be missed on the next endpoint. |
| AP-04-b | **Only the happy path tested.** A permission test that never asserts a denial proves nothing at all. |
| AP-04-c | **Confusing authentication with authorization with ownership.** "Signed in" is not "may act" is not "may act *on this merchant's data*". Collapsing them is how a user from one merchant ends up reading another's orders. |

---

## Step 5 — The state machine

**ACC-05** — a table-driven test over every (state × event) pair. Legal pairs move the job to the expected state and emit the expected event; every other pair throws and leaves the row unchanged. The illegal cases must outnumber the legal ones — if they do not, you have not enumerated the states.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **The state column written from more than one place.** Five controllers each doing an update is how a delivered job goes back to assigned. One aggregate, one set of transition methods. |
| AP-05-b | **An illegal transition that fails silently.** An update matching zero rows returns success. The transition must throw a domain error you can catch and render. |
| AP-05-c | **A boolean per state** (`is_assigned`, `is_delivered`). Two of them can be true at once, and eventually will be. One state column, one enum. |
| AP-05-d | **Order and job collapsed into one table.** It fits Warung and only Warung. Atlas's one order with three stops, or two jobs, has nowhere to live, and you find out after the schema is full of data. |

---

## Step 6 — Couriers and capabilities

**ACC-06** — for each of the three merchants' orders, assert exactly which seeded couriers are eligible and which are not, and that each rejection names a specific missing requirement. A courier whose shift ended one minute ago is not eligible.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **An `is_available` column.** It is a cache of a computation, and it goes stale the moment a process dies mid-assignment. Derive availability; store only the facts it derives from. |
| AP-06-b | **Capabilities as a hardcoded list in code.** A new requirement then means a deploy and a branch. Requirements on the item and capabilities on the courier are rows, and the comparison between them is one function. |
| AP-06-c | **Shifts modelled as two times without a date or a timezone.** A shift running 22:00–06:00 either disappears or matches everything, depending on which way you got the comparison wrong. |

---

## Step 7 — The dispatch engine

**ACC-07** — unit tests of the engine with no database and no clock: an ineligible courier never appears in the ranking; among eligible couriers the ordering matches the documented weights; two identical candidates produce a deterministic, documented tie-break.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Database queries inside the engine.** Once it needs a connection it needs fixtures, and a scoring test becomes an integration test that nobody runs while tuning weights. |
| AP-07-b | **Weights as constants in the loop.** Tuning then means a deploy, and nobody can answer "why did that courier win?" without reading code. |
| AP-07-c | **No record of why a courier was chosen.** The first support question you get is "why didn't I get that job?", and without a score breakdown there is no answer. |
| AP-07-d | **The nearest courier always wins.** One person gets every job, the rest go idle and quit. Say what you do about starvation, even if the answer is "nothing yet, and here is how we would see it". |

---

## Step 8 — Assignment under concurrency

**ACC-08** — 50 concurrent accepts, from real parallel processes against one database, for one job offered to five couriers: exactly one assignment row exists, exactly one request got 201, the other 49 got 409, and no job is left in an intermediate state. Then the same shape for one courier accepting five different jobs at once.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Check-then-write.** `SELECT` to see if the courier is free, then `INSERT`. The gap between the two statements is exactly where the second request lives. |
| AP-08-b | **Application-level locking only.** A mutex in one process does nothing across two processes, and nothing at all across two machines. The database is the only shared arbiter you have. |
| AP-08-c | **No database constraint behind the transaction.** The transaction protects the path you wrote; the constraint protects the path someone adds next year. Both, always. |
| AP-08-d | **A "concurrency test" that loops in one process, or uses sleeps.** It passes against broken code. Real parallel processes, one database, or the test is decoration. |

---

## Step 9 — Geography

**ACC-09** — with 10,000 seeded courier positions, the nearest-courier query returns the couriers a hand-computed check says it should, in the right order, and its plan uses the spatial index. Assert the plan, not the wall-clock time.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **`ST_Distance(...) < x` in the `WHERE` clause.** It cannot use the index, so it scans every courier. `ST_DWithin` can. This is the entire lesson of the step. |
| AP-09-b | **`geometry` where you meant `geography`,** or a hand-written haversine formula. Both give plausible answers that are wrong by enough to matter, and neither is indexed. |
| AP-09-c | **Ranking by straight-line distance and *promising* on it.** It is an acceptable ranking signal and a bad promise. Say which one you are using it for. |

---

## Step 10 — The courier API

**ACC-10** — replay every mutating courier endpoint twice with the same idempotency key: the second call returns the first result and creates no second row, no second event, no second state change. Then deliver a "completed" event before its "picked up" event and assert the job state is correct and both events are stored.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Idempotency by "check if it already happened".** That is check-then-write again, with the same race. Store the key with a unique constraint and let the database reject the duplicate. |
| AP-10-b | **Trusting the client's ordering.** Events arrive out of order because the first request was retried after the second succeeded. The server decides the state from the events; the phone does not. |
| AP-10-c | **Editing or deleting a job event.** The event log is what the phone said. Correcting it destroys the only record of what actually arrived. Append a correction instead. |
| AP-10-d | **Completion rules keyed on the merchant.** Sehat's ID check is a requirement on the item. The moment it is `if (merchant.slug === 'sehat-pharmacy')`, the next pharmacy has to be added in code. |

---

## Step 11 — Background jobs

**ACC-11** — an offer not accepted within its window is expired by the worker and re-offered to the next candidate; running the same job twice produces exactly one re-offer and one notification. Assertions are against the database, not a mock.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **A job that is not safe to run twice.** The worker dies after doing the work and before acknowledging it, so it runs again. Every job needs an idempotency story written down in the job class. |
| AP-11-b | **Passing a serialized model in the payload.** It is stale by the time the worker reads it, and it grows every time you add a column. Pass an id. |
| AP-11-c | **Unbounded retries.** A job that retries forever is an outage that looks like a queue. Cap the attempts, back off exponentially, and give failures somewhere to land. |
| AP-11-d | **Running the scheduler in every web process.** Three web processes then run every sweep three times, and the bug looks like duplicated work with no obvious source. |

---

## Step 12 — Time

**ACC-12** — with a frozen clock: a job promised at a given instant is marked late exactly one second after it and not before; Sehat's cold-chain job expires 30 minutes after pickup regardless of when the order was placed; Atlas's window booked across a DST transition starts at the correct instant.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Reading the clock directly in domain code.** The behaviour then cannot be tested without waiting, and every test that tries uses a sleep and becomes flaky. |
| AP-12-b | **Recomputing a promised time for display.** The promise was made at dispatch. Recomputing it means your on-time rate changes when you change the estimator, retroactively. |
| AP-12-c | **A single timezone assumption.** The server's timezone, the merchant's, and the customer's are three different things. Storing local time in a `timestamptz` mixes all three. |
| AP-12-d | **Deadlines polled on a tight loop** instead of scheduled at the instant they are due. It works with 10 jobs and melts with 10,000. |

---

## Step 13 — Live tracking

**ACC-13** — a subscriber on job A's channel receives its state changes; a subscriber holding a link to job A receives nothing from job B's channel; an unsigned or expired link is refused before any event is sent.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **A channel with no authorization callback.** Channel names are guessable. Without a check, anyone who can construct the name can watch any delivery. |
| AP-13-b | **In-memory broadcasting with more than one web process.** It works on your laptop and silently fails for half your users in production. Use the shared transport. |
| AP-13-c | **A page that renders nothing until the stream connects.** The state is already known at request time. Render it, then let the stream update it. |

---

## Step 14 — Payments and webhooks

**ACC-14** — deliver the same webhook payload three times: exactly one payment event row, exactly one state change, and the same 2xx response every time. Then deliver `succeeded` before `created` and assert the final state is correct. A payload with a bad signature is rejected with no side effect.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **No idempotency on the provider's event id.** Providers deliver at least once, by design. Without a unique constraint the second delivery does the work again, with money attached. |
| AP-14-b | **Verifying the signature against a parsed body.** Re-serializing changes the bytes, so the signature no longer matches — or worse, you skip verification because it was inconvenient. |
| AP-14-c | **An external charge inside a database transaction.** The transaction can roll back; the charge cannot. Charge outside, record inside, compensate with a refund when the record fails. |
| AP-14-d | **Assuming every order has a payment intent.** Warung takes cash. Code that dereferences a payment on every order breaks on the simplest merchant you have. |

---

## Step 15 — Refunds and failures

**ACC-15** — a table-driven test over (state at cancellation × who cancelled × merchant policy) asserting the refunded amount and the courier's entitlement for every combination, including the after-pickup case and Atlas's partial failure. Refund calls are asserted idempotent.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **Editing the original charge row to record a refund.** The audit trail is gone, and reconciliation against the provider can no longer be done. A refund is its own record. |
| AP-15-b | **Cancellation policy as branches in code.** Sehat's window and Warung's window are two rows. As `if` statements they are two deploys, and the third merchant is a third. |
| AP-15-c | **Tying the courier's payment to the customer's refund.** They are independent decisions. A failed delivery can refund the customer in full and still owe the courier for the trip. |

---

## Step 16 — The ledger

**ACC-16** — over a seeded day covering all three merchants — a delivery, a failed delivery, a partial refund and a cancellation — every entry pair sums to zero, each courier's balance matches a hand-computed figure, and re-running the posting job changes nothing.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **A balance stored as a column and updated in place.** Two concurrent updates lose one, and when it drifts there is no way to find out when it started. Derive the balance from entries. |
| AP-16-b | **Ledger rows that get updated or deleted.** A correction is a new pair of entries. An edited ledger is not a ledger. |
| AP-16-c | **Posting without an idempotency key.** The sweep runs twice after a restart and the courier is paid twice. Unique on (job, entry type), always. |
| AP-16-d | **Rounding decided at each call site.** A 12.5% commission on an odd amount has to leave a remainder somewhere. If that somewhere varies, your reconciliation never balances and nobody can say why. |

---

## Step 17 — The ops console

**ACC-17** — a functional test signs in as each role and asserts the console screens each may reach, the actions each may perform, and that a forbidden action posted directly to its URL returns 403 and changes nothing.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Hiding a button as the authorization.** The URL is still there. Presentation hides it; the policy is what stops it. |
| AP-17-b | **A console action that writes the state column directly.** Intervention is still a transition, with an actor recorded. A direct update bypasses every guard step 5 exists for. |
| AP-17-c | **Validation rules duplicated in the view.** The form and the API then disagree, and the one users hit is whichever you forgot to update. |

---

## Step 18 — The customer tracking page

**ACC-18** — the tracking page renders the correct state on first load with JavaScript disabled; an expired or tampered link renders the refusal page; the page for job A contains no data belonging to job B.

| ID | Anti-pattern |
|---|---|
| AP-18-a | **A signed link with no expiry, or a scope wider than one job.** The link is the entire authorization story for someone with no account. Treat it as a credential. |
| AP-18-b | **Props that leak the whole model.** The customer needs a state, a time and a position. They do not need the courier's phone number, the merchant's costs, or an internal id you later regret publishing. |
| AP-18-c | **A page that only works once the stream is live.** First paint is server-rendered truth. The stream is an update, not the source. |

---

## Step 19 — The public API and outbound webhooks

**ACC-19** — a token limited to order creation is refused everywhere else; two order creations with the same merchant idempotency key produce one order; an outbound webhook whose receiver returns 500 is retried with backoff and lands in the dead-letter path after the configured attempts, with a valid signature on every attempt.

| ID | Anti-pattern |
|---|---|
| AP-19-a | **Tokens without scopes.** A token for creating orders that can also cancel them is a support ticket waiting to become an incident. |
| AP-19-b | **Outbound webhooks sent inline in the request.** A slow receiver becomes your slow endpoint, and their downtime becomes your error rate. Queue them. |
| AP-19-c | **Unsigned outbound webhooks.** You verified every payload you received in step 14. Your consumers deserve the same ability. |
| AP-19-d | **Rate limits with no headers.** An honest client cannot back off correctly if you do not tell them the limit, the remaining count, and when it resets. |

---

## Step 20 — Read performance

**ACC-20** — with 100,000 seeded jobs the board endpoint issues a bounded number of queries regardless of page size (assert the count, not the time), its plan uses the intended index, and a cached response for one merchant's staff is never returned to another's.

| ID | Anti-pattern |
|---|---|
| AP-20-a | **Caching before measuring.** The cache hides the slow query instead of fixing it, and the first cold start after a deploy takes the database down. |
| AP-20-b | **A cache key missing a dimension.** Merchant, region, role and filters all change the answer. A key without one of them serves the wrong board to the wrong person, which is a data leak and not a glitch. |
| AP-20-c | **Offset pagination on a board with constant inserts.** Page 2 skips rows that moved. Keyset pagination, or accept and document the anomaly. |
| AP-20-d | **An index added without reading the plan before and after.** Half of them are unused, and every one of them slows every write. |

---

## Step 21 — Observability

**ACC-21** — an order dispatched through the queue produces a single trace spanning the HTTP request and the worker job; every log line emitted during it carries the same correlation id; no log line contains a customer address or a token.

| ID | Anti-pattern |
|---|---|
| AP-21-a | **Trace context that stops at the queue boundary.** Every worker span becomes an orphan, and the one place you actually need the trace — the async path — is the one place you cannot follow it. |
| AP-21-b | **Logging addresses, tokens or payment identifiers.** A log is a database with no access control and a long retention. |
| AP-21-c | **Only technical metrics.** CPU and p99 latency say nothing about whether orders are being dispatched. Instrument the business event: ready to assigned. |

---

## Step 22 — Regional dispatch

**ACC-22** — with two regions seeded, dispatch in region A never considers a courier in region B and never reads from region B's queue; a stalled worker pool for region B leaves region A's dispatch latency unchanged; a job whose stops cross regions resolves by the documented rule rather than by accident.

| ID | Anti-pattern |
|---|---|
| AP-22-a | **A big-bang cutover.** Backfill, dual-write, migrate one region, keep a way back. A migration you cannot stop halfway is a migration you run once, at night, terrified. |
| AP-22-b | **Region added to the tables and not to the cache keys, channel names and metric labels.** The partition is then real in the database and imaginary everywhere else. |
| AP-22-c | **No answer for the cross-region job.** Atlas has stops in two places, and a courier moves cities. Every partition has these; a design that does not name them has hidden them. |
| AP-22-d | **Region-scoped queues without region-scoped workers.** One pool draining every queue reintroduces the coupling you just spent a step removing. |

---

## Step 23 — Deploy

**ACC-23** — deploy while a job is in flight and a customer is watching the stream: the in-flight job completes exactly once, no HTTP request 502s, and the stream reconnects and converges on the correct state.

| ID | Anti-pattern |
|---|---|
| AP-23-a | **Workers killed rather than drained.** The job is half-done and retried from the start. If it is not idempotent — step 11 — the damage is real. |
| AP-23-b | **A destructive migration deployed with the code that stops needing the column.** Expand, deploy, contract, as three deploys. Anything else is an outage you scheduled yourself. |
| AP-23-c | **A backup that has never been restored.** It is a belief, not a backup. Restore it into a scratch database and run the tests against it. |
