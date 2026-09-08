---
title: Surface and Scale
description: Steps 17–23. The ops console, the customer tracking page, the public API, read performance, observability, regional dispatch, deploy.
sidebar:
  order: 6
---

## Step 17 — The ops console: Edge, Vite, and forms that tell the truth

**Story:** *As a dispatcher, I can see every live job on one screen and intervene on any of them, so that a stuck delivery gets fixed before the customer calls.*

**Mode:** `BUILD` — server-rendered screens over an API you already trust.

**Why now:** The backend is complete through money. Building the console earlier would have meant rebuilding it after every model change.

**Concepts:**
- **Edge templates**: components, slots, layouts, and where the logic must *not* live
- **Server-rendered forms in 2026**: what you get for free — no client state, no loading spinners, no duplicated validation — and what you give up
- **Validation errors rendered from the same VineJS schema the API uses**, so the two can never disagree
- **Vite in an AdonisJS app**: the dev server, the manifest, and what "asset versioning" means when a browser has the old file cached
- **Flash messages and the redirect-after-post pattern**, and why a refresh must never repeat a dispatch
- **Authorization in the view**: hiding a button is presentation, and the policy still runs on the server. A hidden button is not a permission.
- **Manual intervention as a first-class action**: reassign, cancel, force-complete. Each one is a state transition with an actor recorded, not an `UPDATE`.

**Libraries:** Edge (bundled), `@adonisjs/vite`, Tailwind 4

**Expected outcome:** An authenticated console: a live job board, a job detail with its event timeline, a courier list with shift and capability, merchant and order screens, and intervention actions that go through the state machine. Every action authorized by the policies from step 4.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — a functional test signs in as each role and asserts the console screens each may reach, the actions each may perform, and that a forbidden action posted directly to its URL returns 403 and changes nothing. |
| **L2 — Manual checks** | (a) Submit a dispatch form, then refresh the resulting page. Nothing may happen twice. <br>(b) Submit an invalid form and confirm the errors match what the API returns for the same payload. <br>(c) Force-complete a job from the console and read the event timeline. The actor must be recorded. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and every console action is a named transition rather than a direct write |

---

## Step 18 — The customer tracking page: Inertia and React

**Story:** *As a customer, I open one link and see where my order is, so that I do not need an account or an app.*

**Mode:** `BUILD` — the interesting decisions were made in steps 13 and 4; this is the surface over them.

**Why now:** The stream (step 13) and signed links exist. This is the page they were for.

**Concepts:**
- **Inertia's model**: server-side routing, client-side rendering, no separate API for this surface — and what that means for the public API in step 19, which is a *different* consumer
- **Shared data in middleware**, with access to the request and the authenticated context — a config file is not the place for application logic
- **Props are a contract**: what the server sends is what the page gets, so the type is generated rather than hand-written
- **Subscribing to the SSE channel from React**: subscribe on mount, unsubscribe on unmount, and reconcile the stream against the props you were rendered with
- **The page must work before the stream connects** — server-rendered state first, live updates second. A blank screen while a socket negotiates is a broken page.
- **A map without a map bill**: what you actually need is a moving marker and a distance. Decide deliberately how much of a mapping service you take on.
- **Access without an account**: the signed link is the whole authorization story, so its expiry and scope are the whole security story

**Libraries:** `@adonisjs/inertia`, React 19, `@adonisjs/transmit-client`

**Expected outcome:** A public tracking page reached by signed link: current state, promised time, courier position updating live, and the event timeline. Server-rendered on first load, live thereafter. Expired links get a clear page, not a stack trace.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-18` — the tracking page renders the correct state on first load with JavaScript disabled; an expired or tampered link renders the refusal page; the page for job A contains no data belonging to job B. |
| **L2 — Manual checks** | (a) Load the page, then start the courier moving. The marker moves without a refresh. <br>(b) Throttle the network to 3G and confirm the first paint still shows the true state. <br>(c) Forward the link to another browser and decide, deliberately, whether that is acceptable. Write the decision down. |
| **L4 — Anti-patterns** | `AP-18-a`, `AP-18-b`, `AP-18-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-18` green, and the page is correct before the stream connects |

---

## Step 19 — The public merchant API and outbound webhooks

**Story:** *As a merchant's developer, I create orders from my own shop system and get told when they are delivered, so that nobody types an order twice.*

**Mode:** `BUILD` — with one part that is not: signing and retrying your outbound webhooks.

**Why now:** Every internal caller is settled. Publishing an API before that would have published a contract you had to break.

**Concepts:**
- **A public API is a promise**: versioning, additive change, and deprecation you can actually execute
- **Token scopes**: a shop-system token may create orders and nothing else. Scopes checked in middleware, and the difference between a scope and a role.
- **Rate limiting**: per token, per endpoint, with headers that tell an honest client how to behave. What you do when a merchant's integration retries in a hot loop.
- **You are now the webhook sender.** Everything you learned in step 14 applies to you: sign the payload, include an event id, retry with backoff, and let them be idempotent.
- **Delivery guarantees you can keep**: at-least-once, in-order-per-job at best, with a replay endpoint for the gaps
- **Documenting the API from types** rather than by hand, and what drifts anyway
- **Idempotency at the boundary again**: a merchant's order-create retry must not produce two deliveries. Their key, your uniqueness constraint.

**Libraries:** `@adonisjs/auth` (access tokens with scopes), `@adonisjs/limiter`, `@adonisjs/queue` for webhook delivery

**Expected outcome:** `/api/v1` documented endpoints for creating and reading orders, with scoped tokens and rate limiting. Outbound webhooks for job state changes: signed, retried with backoff, with a dead-letter view and a replay endpoint. Published documentation generated from the schemas, plus a merchant-facing description of the retry and idempotency behaviour.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-19` — a token limited to order creation is refused everywhere else; two order creations with the same merchant idempotency key produce one order; an outbound webhook whose receiver returns 500 is retried with backoff and lands in the dead-letter path after the configured attempts, with a valid signature on every attempt. |
| **L2 — Manual checks** | (a) Hammer an endpoint past the rate limit and read the response headers as a client would. <br>(b) Point the outbound webhook at a receiver that is slow, then one that is down, then one that returns 200 twice. <br>(c) Verify a signature by hand from the raw body. |
| **L4 — Anti-patterns** | `AP-19-a`, `AP-19-b`, `AP-19-c`, `AP-19-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-19` green, and your webhook behaviour is documented as precisely as you would want a provider's to be |

---

## Step 20 — Read performance: the dispatch board, indexes, and cache keys

**Story:** *As a dispatcher, the live board loads instantly with a thousand jobs open, so that the console is usable on the busiest evening of the year.*

**Mode:** `LEARN` — a cache added without reading the query first hides the problem instead of fixing it.

**Why now:** There is real code and a real query shape. Optimising earlier would have been guessing.

**Concepts:**
- **Measure first**: the slow query log, `EXPLAIN (ANALYZE, BUFFERS)`, and the request that is slow versus the query you assumed was
- **N+1 in the wild**: the board loading each job's courier, stops and last event one at a time. Preloading, and the shape of the resulting query.
- **Index design for this workload**: the board filters by state and city and orders by promised time. A composite index in the right column order, and why the wrong order is not used at all.
- **Partial indexes** for a board that only ever looks at active jobs
- **Counting is expensive**: an exact count of a big filtered set costs a scan. Decide what the console actually needs.
- **Caching what is safe to cache**: a two-tier cache, an L1 in memory and an L2 in Redis, and what happens on the first request after a deploy
- **Cache keys carry every dimension** — merchant, city, role, and filters. The bug this prevents is serving Sehat's board to Warung's staff, and it is a data leak, not a glitch.
- **Invalidation by tag** on a state change, and the honest alternative: a short TTL you can defend
- **Pagination that survives inserts**: keyset over offset for a board where new rows arrive constantly

**Libraries:** `@adonisjs/cache` (memory L1 + Redis L2)

**Expected outcome:** A measured before/after for the board query with 100,000 jobs seeded: the plan, the index added, and the numbers, written into `docs/`. Preloading fixed. Keyset pagination. Selective caching with keys that include every dimension, and tag-based invalidation on state change.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-20` — with 100,000 seeded jobs the board endpoint issues a bounded number of queries regardless of page size (assert the count, not the time), its plan uses the intended index, and a cached response for one merchant's staff is never returned to another's. |
| **L2 — Manual checks** | (a) Read the plan before and after each index. Record both. <br>(b) Change a job's state and confirm the board reflects it within your stated invalidation window. <br>(c) Clear the cache under load and watch what happens to the database. That is your cold-start cost. |
| **L4 — Anti-patterns** | `AP-20-a`, `AP-20-b`, `AP-20-c`, `AP-20-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-20` green, and every cache key can be read aloud as the exact question it answers |

---

## Step 21 — Observability: traces, logs, and the metric that matters

**Story:** *As an operator, when dispatch slows down I can tell which part slowed, so that I fix the cause rather than restarting the server.*

**Mode:** `BUILD` — instrumentation is wiring. Choosing what to measure is the part to think about.

**Why now:** There is a system with enough moving parts for "it is slow" to be ambiguous: web, worker, database, Redis, and an external payment provider.

**Concepts:**
- **The three signals, honestly**: logs say what happened, traces say where the time went, metrics say how often. Most teams over-invest in the first and skip the second.
- **OpenTelemetry with no bespoke code**: what auto-instrumentation gives you, and what you still have to add by hand
- **Correlation across a queue boundary**: the trace context has to travel in the job payload, or every worker span is an orphan
- **Structured logs with a request id and a job id** — one grep, one story
- **The domain metric that actually matters here** is not p99 latency, it is *time from order ready to courier assigned*. Instrument the business event, not only the HTTP request.
- **Alerting on symptoms, not causes**: "orders unassigned for more than 5 minutes" beats "CPU above 80%"
- **What not to log**: customer addresses, tokens, payment identifiers. A log is a database with no access control.
- **Sampling** — traces cost money at volume, and always-on tracing in production is a bill, not a strategy

**Libraries:** `@adonisjs/otel`, the framework logger

**Expected outcome:** Tracing across web and worker with context propagated through job payloads. Structured logs with request and job correlation ids. Domain metrics: dispatch latency, offer acceptance rate, on-time rate, queue depth, dead-letter count. A short runbook in `docs/` naming, for each alert, the first query to run.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-21` — an order dispatched through the queue produces a single trace spanning the HTTP request and the worker job; every log line emitted during it carries the same correlation id; no log line contains a customer address or a token. |
| **L2 — Manual checks** | (a) Make the database artificially slow and confirm the trace shows where the time went. <br>(b) Read the runbook and follow it for one alert without touching code. If it does not name a query, it is not a runbook. <br>(c) Compute yesterday's dispatch latency from your metrics and from the database. They must agree. |
| **L4 — Anti-patterns** | `AP-21-a`, `AP-21-b`, `AP-21-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-21` green, and one identifier follows a request from the console into the worker and back |

---

## Step 22 — Regional dispatch: one loop becomes many

**Story:** *As the platform, dispatch in one city is unaffected by load or an outage in another, so that a busy Friday in Jakarta does not delay Bandung.*

**Mode:** `LEARN` — this is a migration of working code, and the design decisions are the step.

**Why now:** Everything works with one global dispatch loop. This step makes you feel what it costs to change that once real code depends on it — which is the point.

**Concepts:**
- **Where the single loop actually hurts**: one queue, one worker pool, one scoring pass over every courier everywhere. Find the specific bottleneck before designing anything.
- **Partitioning by region** as the natural key: a job belongs to a city, a courier works in one, and the two sets never need to meet
- **Queue per region and worker pools per region**, so a backlog in one is not a backlog in all
- **The rows that do not partition cleanly**: a courier who moves cities, an Atlas job with stops in two regions. Every real partition has these, and the design has to name them rather than assume they do not exist.
- **Region in the cache key, the channel name, and the metric labels** — everything you built in steps 13, 20 and 21 now has a dimension it did not have
- **Migrating without downtime**: backfill the region column, dual-write, cut over one region at a time, and keep a way back
- **The cost of the abstraction**: a region column is cheap, a region-aware deployment is not. Say what you are buying.

**Libraries:** none new — this is your own code changing shape

**Expected outcome:** A region on merchants, couriers and jobs, backfilled by migration. Region-scoped dispatch queues and workers. Region in cache keys, channel names and metric labels. A written migration plan in `docs/` with the cutover order and the rollback, and a documented answer for the cross-region job.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-22` — with two regions seeded, dispatch in region A never considers a courier in region B and never reads from region B's queue; a stalled worker pool for region B leaves region A's dispatch latency unchanged; a job whose stops cross regions resolves by the documented rule rather than by accident. |
| **L2 — Manual checks** | (a) Run the migration against a copy with data in it. Time it, and check the app works at every intermediate stage. <br>(b) Pause region B's workers under load and watch region A's metrics. <br>(c) Re-read the step 7 engine. If it needed changing, ask whether it was as pure as step 7 claimed. |
| **L4 — Anti-patterns** | `AP-22-a`, `AP-22-b`, `AP-22-c`, `AP-22-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-22` green, and the migration plan in `docs/` describes a cutover you would actually run |

---

## Step 23 — Deploy: processes, drains, and the first bad night

**Story:** *As an operator, I deploy in the middle of the day without dropping a delivery, so that shipping is not something we do at 2am.*

**Mode:** `BUILD` — with one part that is not scaffolding: the drain sequence.

**Why now:** You have web processes, workers, a scheduler and an SSE stream. All four behave differently when you restart them, and this is where you find out how.

**Concepts:**
- **A container per role**: web, worker, scheduler. One image, three commands, and why running the scheduler on every web process schedules everything three times.
- **Zero-downtime for HTTP** is the easy half. The hard half is the worker holding a job when you send it `SIGTERM`.
- **Graceful shutdown**: stop accepting, finish what is in flight, acknowledge, exit — and the timeout after which you stop being graceful
- **Migrations and deploys**: expand, deploy, contract. A migration that drops a column the old code still reads is an outage you scheduled yourself.
- **SSE and proxies**: compression and buffering on `text/event-stream` cause disconnect loops that look like a client bug. Configure the proxy for it, and verify.
- **Secrets and configuration** in production, and why a value read at import time cannot be rotated
- **Backups you have restored at least once** — an untested backup is a belief
- **The first bad night**: what you look at, in what order. This is the runbook from step 21, used in anger.

**Libraries:** Docker, nginx; managed platforms noted, not used

**Expected outcome:** A production image and Compose or systemd definitions for web, worker and scheduler. A deploy script: migrate, start new, drain old. Proxy configuration correct for SSE. A restore drill performed and written up. A one-page runbook: deploy, rollback, drain, restore.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-23` — deploy while a job is in flight and a customer is watching the stream: the in-flight job completes exactly once, no HTTP request 502s, and the stream reconnects and converges on the correct state. |
| **L2 — Manual checks** | (a) Send `SIGTERM` to a worker mid-job and watch what it does. Then do it with the timeout set to one second and watch what it does instead. <br>(b) Restore yesterday's backup into a scratch database and run the test suite against it. <br>(c) Deploy a migration that adds a column, then one that drops one, and reason about the old code running against each. |
| **L4 — Anti-patterns** | `AP-23-a`, `AP-23-b`, `AP-23-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-23` green, and you have deployed during a live delivery on purpose |

**Harness impact:** `AGENTS.md` v4 — the process roles, the drain sequence, the expand/contract migration rule, and the queue names.

---

## After step 23

You have a delivery platform: orders, dispatch, couriers, live tracking, money, a console, a public API, instrumentation, and a deploy you have practised. The three merchants still run on the same code with no special cases.

What to do next, in rough order of value:

- **Run it for real, small.** One merchant, one courier, ten deliveries. Every assumption in this roadmap meets a person.
- **Write the postmortem for the first thing that breaks.** It will be time, a webhook, or a worker. All three are in here.
- **Pick one [deliberate omission](../../reference/omissions/)** and add it properly — routing distance is the one that changes the product most.
