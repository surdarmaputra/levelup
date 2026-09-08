---
title: Realtime and Async
description: Steps 10–13. The courier API, background jobs, time and SLA, live tracking.
sidebar:
  order: 4
---

## Step 10 — The courier API: tokens, idempotency, out-of-order events

**Story:** *As a courier, my phone reports what I did even on a bad connection, so that a lost signal never costs me a delivery.*

**Mode:** `LEARN` — idempotency is the thing everyone gets wrong, and it is invisible until a retry happens.

**Why now:** Assignment works (step 8). Now the truth starts arriving from outside, from a client you do not control and cannot trust to send anything exactly once.

**Concepts:**
- **Access tokens instead of sessions**: a phone has no cookie jar and no CSRF story. Token issuance, expiry, and revoking one device without logging the courier out everywhere.
- **Idempotency keys**: the client sends one per action, the server records it, and a repeat returns the original result instead of doing the work twice. Where the key is stored, how long it is kept, and what "the same request" means.
- **At-least-once delivery** is the only guarantee a mobile client can give you. Design for duplicates rather than trying to prevent them.
- **Out-of-order events**: "delivered" arrives before "picked up" because the first request was retried after the second succeeded. Client-side timestamps plus a sequence number, and the rule that the server decides the state.
- **Append-only event log**: `JobEvent` records what the phone said; the job state is what the server concluded. Never edit an event.
- **Proof of delivery**: a photo and a signature, uploaded to object storage, and the fact that a failed upload must not lose the delivery. Sehat's ID-check requirement means a completion that is *refused* without it.
- **Partial failure**: Atlas's stop 2 of 3 fails. The job is neither delivered nor failed, and your state machine has to say which state that is.

**Libraries:** `@adonisjs/auth` (access tokens guard), `@adonisjs/drive` for proof-of-delivery files

**Expected outcome:** A `/api/courier` surface: accept an offer, arrive at a stop, confirm pickup, complete a stop with proof, report a failure. Every mutating endpoint takes an idempotency key and is safe to call twice. A `job_events` append-only table. Completion rules that refuse Sehat's prescription drop without an ID check and a signature, from data on the item rather than a merchant check.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — replay every mutating courier endpoint twice with the same idempotency key: the second call returns the first result and creates no second row, no second event, no second state change. Then deliver a "completed" event before its "picked up" event and assert the job state is correct and both events are stored. |
| **L2 — Manual checks** | (a) Send a completion for Sehat's prescription job without the ID check. It must be refused, with a reason naming the requirement. <br>(b) Cut the network mid-upload of a proof photo and confirm the delivery can still be completed once it retries. <br>(c) Revoke one token and confirm the courier's other device still works. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and every courier endpoint is safe to call twice |

---

## Step 11 — Background jobs: offers that expire, work that gets stuck

**Story:** *As a dispatcher, an offer nobody accepts is passed on automatically, so that an order never sits waiting for a human to notice.*

**Mode:** `BUILD` — wiring the queue is scaffolding. The idempotency rules are not, and they are yours.

**Why now:** Step 7 created a 30-second offer expiry and nothing to fire it. Step 10 created retries that can leave a job half-updated. Both need a worker.

**Concepts:**
- **Why a queue and not a `setTimeout`**: the process restarts, and your timer is gone with it
- **Choosing the queue**: `@adonisjs/queue` is first-party and experimental; BullMQ is stable and community-wrapped. Record the decision in an ADR, including what you would do if the experimental API changes under you. This is a real trade-off, not a formality.
- **Job classes with typed payloads**, dispatch from anywhere, and a worker process that is not the web process
- **Retries and backoff**: exponential, a cap, and a dead-letter path. A job that retries forever is an outage that looks like a queue.
- **Every job must be idempotent** — it will run twice, because a worker will die after doing the work and before acknowledging it
- **Passing an id, never an object**: a serialized model in a payload is stale by the time the worker reads it
- **Scheduled sweeps** for the failures your events never reported: offers past expiry, jobs picked up hours ago and never completed, pings that stopped arriving
- **Notifications as a consequence of an event**, not as a line in a controller

**Libraries:** `@adonisjs/queue` on the Redis driver (see the ADR), `@adonisjs/mail` with Mailpit

**Expected outcome:** A worker process and a `npm run worker` script. Jobs for: expiring an offer and re-dispatching, sweeping stuck jobs, and sending the merchant a "courier assigned" notification. The scheduler running the sweeps. A dead-letter path and a way to see what is in it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — an offer that is not accepted within its window is expired by the worker and re-offered to the next candidate; the same job run twice produces exactly one re-offer and one notification. Assert on the database, not on a mock. |
| **L2 — Manual checks** | (a) Kill the worker mid-job and restart it. The work completes exactly once. <br>(b) Force a job to fail repeatedly and confirm the backoff and dead-letter behaviour you configured. <br>(c) Stop the worker entirely for a minute and confirm the web app still serves requests and the work catches up. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and every job class states in a comment why running it twice is safe |

---

## Step 12 — Time: promised delivery, deadlines, and timezones

**Story:** *As a customer, I am told when my order will arrive, and that promise is judged fairly, so that "late" means the same thing to me and to the merchant.*

**Mode:** `LEARN` — every timezone bug looks like a rounding error until it costs someone a refund.

**Why now:** You now have events with timestamps, jobs that expire, and a scheduler. Getting time wrong from here on contaminates the ledger in step 16 and the metrics in step 21.

**Concepts:**
- **Instants vs wall-clock time**: `timestamptz` stores an instant. Atlas's "tomorrow, 09:00–11:00" is a wall-clock window in the merchant's timezone, and the two are different kinds of value.
- **Store UTC, render local** — and the merchant's timezone is a column, not a server setting
- **A promised time is computed once and recorded**, never recomputed for display. Otherwise your on-time rate changes when you deploy.
- **The clock as a dependency**: no direct `Date.now()` in domain code. Inject a clock so tests can freeze it, and so step 21's metrics measure the same instant your code did.
- **DST**: the hour that happens twice and the hour that does not exist. A scheduled window at 02:30 on a transition night is a real bug with a real answer.
- **Deadline timers**: SLA breach as a scheduled job at a computed instant, not a poll every second
- **Sehat's 30-minute cold-chain limit** is a deadline attached to an item, running from pickup rather than from the order — a second clock on the same job
- **Prep time and travel time** as separate estimates, so you can find out which one you are bad at

**Libraries:** the framework's date handling; a clock abstraction you write

**Expected outcome:** A `Clock` service injected everywhere time is read, and a test clock. Promised delivery time computed and stored at dispatch. SLA breach and cold-chain expiry as scheduled jobs. Merchant timezone on the merchant. All three merchants' cases represented: Warung's "as soon as possible", Sehat's expiry from pickup, Atlas's booked window tomorrow.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — with a frozen clock: a job promised at a given instant is marked late exactly one second after it, not before; Sehat's cold-chain job expires 30 minutes after pickup regardless of when the order was placed; Atlas's window booked across a DST transition starts at the correct instant. |
| **L2 — Manual checks** | (a) Grep for direct clock reads outside the clock service. There must be none in domain code. <br>(b) Set a merchant's timezone to one with a half-hour offset and re-read every rendered time. <br>(c) Schedule an Atlas window at 02:30 on a spring-forward night and decide, deliberately, what your system does. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and no test needs a `sleep` to pass |

---

## Step 13 — Live tracking with server-sent events

**Story:** *As a customer, I watch my courier approach without refreshing, so that I know whether to come downstairs.*

**Mode:** `BUILD` — the transport is wiring. The channel authorization is not; check it yourself.

**Why now:** There are now events worth streaming and a state worth watching. Building the stream earlier means streaming a state machine that was still changing shape.

**Concepts:**
- **Server-sent events vs websockets**: one direction, over plain HTTP, with reconnection built into the browser. Why that is the right fit here, and what it cannot do.
- **Channels and authorization**: a channel per job, and a callback that decides who may subscribe. A customer may watch their own delivery and nothing else.
- **Broadcasting across processes**: with two web processes, the event is emitted on the one that handled the request and the subscriber is on the other. The Redis transport is what closes that gap.
- **Signed links for people who never sign in**: the customer gets a URL, not an account. Expiry, scope, and what leaks if the link is forwarded.
- **Rate of updates**: a ping every second is a cost you pay per viewer. Throttle at the source, and decide what "good enough" is before optimising it.
- **Reconnection and gaps**: what the client missed while offline, and why the stream is a *live* view over a state it can always re-fetch
- **Proxies and buffering**: compression and buffering on `text/event-stream` break SSE in ways that look like a client bug. Note it now, verify it at step 23.

**Libraries:** `@adonisjs/transmit` with the Redis transport, `@adonisjs/transmit-client`

**Expected outcome:** A per-job channel with an authorization callback, broadcasting state changes and throttled courier positions. A signed customer tracking URL. A minimal HTML page that subscribes and renders position and state — the real page comes in step 18. Two web processes proving the Redis transport works.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — a subscriber on job A's channel receives its state changes; a subscriber holding a link to job A receives nothing from job B's channel; an unsigned or expired link is refused before any event is sent. |
| **L2 — Manual checks** | (a) Run two web processes, subscribe on one, trigger the event on the other. If nothing arrives, the transport is not shared. <br>(b) Open the tracking page, kill the network for 30 seconds, restore it, and confirm the view converges on the true state. <br>(c) Watch the number of position events per minute per viewer. Decide if you would pay for it at 1,000 viewers. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green across two processes, and no channel is subscribable without an authorization check |
