---
title: The Delivery Core
description: Steps 6–10. Postgres, the ingest API, the work queue, signed delivery, retries and dead-lettering.
sidebar:
  order: 3
---

The system starts here. By the end of step 10 Relay accepts events, fans them out, delivers them
over HTTP with a signature, retries what fails, and gives up in a way you can inspect.

---

## Step 6 — Postgres, migrations, and the three subscribers

**Story:** *As an operator, I can register an endpoint with its subscription pattern and secret, and it survives a restart.*

**Mode:** `LEARN` — SQL and transaction boundaries are where a service's correctness is decided. Let the agent review your schema, not write it.

**Why now:** Data model before API shape. Getting the schema wrong is expensive to undo; getting the JSON wrong is cheap. The queue in step 8 depends on decisions you make in this step — the state column, the index, the lease fields.

**Concepts:**
- `database/sql` versus `pgx/v5` native — and why this roadmap uses the pgx pool directly
- Connection pools: `MaxConns`, and the arithmetic that matters at step 18 (two instances × pool size must stay under Postgres `max_connections`)
- Hand-written SQL and `pgx` positional parameters. **Never build SQL with `fmt.Sprintf`.**
- `context` on every query, and what happens to an in-flight query when the context is cancelled
- Transactions: `BeginTx`, commit and rollback, and `defer tx.Rollback()` as the safe default
- Migrations with `goose`: versioned, forward-only, immutable once merged, embedded in the binary with `embed.FS`
- Schema design for a queue: the `state` column, `available_at`, `attempt_count`, and a partial index on the rows a worker actually scans
- `NULL` in Go: `*string` versus `sql.NullString` versus a zero value, and picking one convention
- `time.Time`, `timestamptz`, and storing UTC only
- Repository code as a thin layer: it maps rows to domain types and nothing else. No business rules in SQL.

**Libraries:** `github.com/jackc/pgx/v5` (+ `pgxpool`), `github.com/pressly/goose/v3`, `testcontainers-go` with the Postgres module.

**Expected outcome:** The schema for `endpoints`, `events`, `deliveries` and `attempts`. Goose migrations, embedded. A store package with create and read operations for endpoints. A seed command that inserts the three subscribers — Kirana Ledger (`invoice.*`), Meridian Bank Sandbox (`payment.*`, 5 rps, 2s timeout), Pixel Forge Studio (three endpoints on `render.*`, ordered by `job_id`). Integration tests against a real Postgres container.

```text
internal/store/
├── postgres.go     pool construction, health, transaction helper
├── endpoints.go    endpoint queries
└── store_test.go   testcontainers setup, shared per package
migrations/         goose SQL, embedded
cmd/relay/seed.go   the three subscribers
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — against a real Postgres container: insert an endpoint with a rate limit, a timeout and a subscription pattern; read it back; assert every field round-trips including the timestamp in UTC and the nullable ones. Then run the seed twice and assert it is idempotent — three subscribers, five endpoints, no duplicates. |
| **L2 — Manual checks** | (a) `EXPLAIN` the query the queue will use in step 8 (`state = 'pending' AND available_at <= now()` ordered by `available_at`). Add the index and compare. <br>(b) Cancel a context mid-query and confirm the connection returns to the pool rather than leaking. <br>(c) Edit an already-applied migration and try to start. Confirm it fails. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, schema comes only from migrations, and all three subscribers are seeded |

---

## Step 7 — The ingest API and idempotency

**Story:** *As a producer application, I can POST an event once — or five times after a network timeout — and Relay accepts it exactly once and fans it out to every matching endpoint.*

**Mode:** `LEARN` — idempotency is a design decision with a dozen wrong answers that all look right in a happy-path test.

**Why now:** The queue needs rows to work on. And the idempotency rule has to exist before there are many producers, because retrofitting it means reconciling duplicates you already stored.

**Concepts:**
- Request validation into a typed struct, and returning **all** field errors at once rather than the first
- An error envelope for the API: one shape everywhere, machine-readable, no stack traces or SQL text
- HTTP status discipline: 400 for a malformed body, 401 for a bad key, 409 for a real conflict, 422 for a valid body that violates a rule, 202 for accepted-not-yet-delivered
- **Idempotency keys**: the client supplies one, you store it with a unique constraint, and a repeat returns the original result rather than creating a second event. What the window is, and what happens when the same key arrives with a different body.
- Fan-out inside one transaction: writing the event and its N deliveries together, so a crash never leaves an event with no deliveries
- Why the API returns as soon as the rows are committed, and what "accepted" promises the caller
- Payload limits: `http.MaxBytesReader`, and rejecting a 40MB body before you read it into memory
- API keys: hashed at rest, compared in constant time, scoped to a workspace

**Libraries:** standard library. No validation framework — write the validation, it is twenty lines and you will read it in a year.

**Expected outcome:** `POST /api/v1/events` accepting `{type, payload, ordering_key, idempotency_key}`, authenticated by API key, validating, matching endpoints by pattern, and writing the event plus one delivery per matching endpoint in a single transaction. `GET /api/v1/events/{id}` returning the event with its deliveries. Pixel Forge's three endpoints produce three deliveries from one event.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — POST the same event with the same idempotency key five times concurrently. Exactly one event row exists, exactly the right number of delivery rows exist (three for a `render.*` event, one for `payment.*`), and all five responses carry the same event ID. Runs against real Postgres. |
| **L2 — Manual checks** | (a) POST an event whose type matches nothing and confirm the response says clearly that zero endpoints matched — silence here is a support ticket later. <br>(b) POST a 40MB body and confirm it is rejected without the process memory climbing. <br>(c) Kill the process between writing the event and writing the deliveries (a temporary `panic` will do) and confirm neither is left behind. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, one error envelope across every endpoint, and no request can create an event without its deliveries |

**Harness impact:** `AGENTS.md` **v2b** — the API conventions: the error envelope, the status-code policy, the idempotency rule, the fan-out transaction boundary.

---

## Step 8 — The work queue: claiming deliveries safely

**Story:** *As the platform, many workers across many processes pull work from one queue, and no delivery is ever claimed by two of them.*

**Mode:** `LEARN` — this is the hardest step in the roadmap and the one that makes the repository worth showing. Write every line.

**Why now:** Everything after it is a variation on this loop. It comes after step 4 because the pool shape has to be familiar before the database joins in, and after step 6 because the claim query depends on the schema.

**Concepts:**
- Why a database queue is a real choice, not a compromise: one system to operate, transactional with your data, and correct up to throughput levels you are not going to reach
- **`SELECT … FOR UPDATE SKIP LOCKED`** — what the lock covers, why `SKIP LOCKED` is what makes multiple workers possible, and what happens without it (every worker waits on the first one)
- Claiming in a transaction: select, mark `in_flight`, commit, *then* do the HTTP call. Never hold a transaction open across a network call to someone else's server.
- **Leases and heartbeats.** A worker that dies mid-delivery leaves a row stuck in `in_flight`. A `locked_until` column plus a reaper that returns expired rows to `pending` is the fix.
- At-least-once delivery, and why exactly-once across a network is not available to you
- Batch claiming: one query returns N rows, and the trade-off against fairness
- Polling versus `LISTEN/NOTIFY`, and why polling with a short interval and a backoff when idle is the right first answer
- Backpressure: what the poller does when every worker is busy
- Shutdown: stop claiming, finish what is in flight, release the rest. The step 3 shutdown sequence grows a new member.

**Libraries:** none new. `goleak` switches on for every test package in this step.

**Expected outcome:** A dispatcher that polls for due deliveries, claims them with `SKIP LOCKED`, hands them to the step 4 worker pool, and marks the result. A reaper that reclaims expired leases. The HTTP call itself is still a stub that always succeeds — step 9 makes it real.

```text
internal/delivery/
├── dispatcher.go   poll → claim → submit → record
├── claim.go        the SKIP LOCKED query and the lease
├── reaper.go       expired leases back to pending
└── *_test.go
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — 500 pending deliveries, 4 dispatchers running concurrently against the same Postgres, 8 workers each. Every delivery is processed exactly once, no delivery is claimed twice (assert on the attempt count per delivery), the run is clean under `-race`, and `goleak` reports nothing left running. Then: kill one dispatcher mid-run and assert its claimed rows are reclaimed and completed by the others. |
| **L2 — Manual checks** | (a) Remove `SKIP LOCKED` and run `ACC-08` again. Watch the throughput collapse and explain why. Put it back. <br>(b) Watch `pg_stat_activity` while the test runs and confirm no transaction stays open longer than the claim itself. <br>(c) Stop the dispatcher during a run and read the log lines of the shutdown sequence in order. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d`, `AP-08-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green under `-race`, no transaction spans an external call, and a killed worker loses no work |

> **Expect to fail the review here.** A first-pass claim loop that works on one dispatcher and breaks on four is the normal outcome. That is what the test is for.

---

## Step 9 — Signed HTTP delivery

**Story:** *As Meridian Bank, I can verify that a request really came from Relay and was not replayed from yesterday, or I reject it.*

**Mode:** `LEARN` — signing is short code with sharp edges. A `==` in the wrong place makes the signature decorative.

**Why now:** The queue moves work; now the work has to actually leave the process. Signing belongs with the first real request rather than added later, because an endpoint that once accepted unsigned requests will keep accepting them.

**Concepts:**
- `http.Client` configuration: **never use `http.DefaultClient`.** Set a `Timeout`, and understand `Transport` settings — `MaxIdleConnsPerHost`, `IdleConnTimeout`, and why connection reuse matters when you deliver to the same host thousands of times.
- Per-endpoint deadlines with `context.WithTimeout`, and how they interact with the client timeout
- Always `defer resp.Body.Close()`, and always read or discard the body — an unread body prevents connection reuse. `bodyclose` in the linter catches the first mistake, not the second.
- Reading a bounded prefix of the response body for the attempt record, and discarding the rest
- **HMAC-SHA256 signing**: what goes into the signed string (timestamp, event ID, raw body), why the timestamp must be inside it, and the header format
- `hmac.Equal` and constant-time comparison. A plain `==` leaks timing information.
- Replay windows: rejecting a signature older than five minutes, and what clock skew does to that number
- Secret rotation: two active secrets, sign with the newest, let the receiver accept either
- Classifying a response: 2xx is success; 4xx other than 408/429 is a permanent failure and should not be retried; 5xx, 408, 429, and transport errors are retryable
- Recording the attempt: status, duration, response prefix, error string — this is what the dashboard shows at step 16

**Libraries:** standard library `crypto/hmac`, `crypto/sha256`, `net/http`.

**Expected outcome:** A delivery transport that signs, sends with a per-endpoint timeout, classifies the response, and records an attempt row. A verification helper shipped as a small example so a subscriber can check the signature — that example is what makes the repository readable to someone who has never used your service. `httptest` receivers standing in for all three subscribers.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a delivery is sent to an `httptest` receiver that verifies the signature exactly as the shipped example does. Assert: a correct signature is accepted; a modified body is rejected; a signature with a timestamp six minutes old is rejected; a request signed with a rotated-out secret is still accepted while both secrets are active. |
| **L2 — Manual checks** | (a) Point a delivery at a receiver that never answers and confirm the attempt ends at the endpoint timeout, not the client default. <br>(b) Deliver 200 events to one host and count TCP connections opened. If it is 200, your body handling is wrong. <br>(c) Replace `hmac.Equal` with `==`, confirm tests still pass, then write down why the test suite cannot catch that and put it back. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d`, `AP-09-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, every outbound call bounded by a deadline, and the signature example verifies against real output |

---

## Step 10 — Retries, backoff, and the dead-letter path

**Story:** *As Pixel Forge Studio, my endpoint can be down for six hours and I still receive every event when it comes back, in the right order, without Relay hammering my server.*

**Mode:** `LEARN` — retry policy is where most webhook systems are quietly wrong. The failure mode is invisible until a customer's outage takes your service down with it.

**Why now:** Delivery works and fails; now failure needs a policy. It comes before rate limiting because a retry storm is the thing rate limiting has to survive.

**Concepts:**
- Which failures are retryable, and the cost of getting it wrong in either direction — retrying a `400` forever, or dropping a `503` that would have succeeded in a minute
- **Exponential backoff**: base, factor, cap. Then the numbers: base 10s, factor 2, cap 6 hours, up to 12 attempts or 24 hours, whichever comes first.
- **Jitter, and why it is not optional.** Without it every delivery that failed in the same second retries in the same second, forever. Full jitter versus equal jitter — pick one and be able to defend it.
- `Retry-After` outranks your schedule. Meridian answers `429` with `Retry-After: 30`; honouring it is the difference between a rate limit and an argument. Handle both the seconds form and the HTTP-date form, and cap what you will accept.
- Scheduling by writing `available_at` on the row rather than sleeping in a goroutine. A sleeping goroutine dies with the process; a timestamp does not.
- The dead-letter state: what "given up" means, what is kept, and how an operator gets it back (step 16's replay button)
- Idempotency from the receiver's side: at-least-once means Kirana will see the same event twice one day, and the event ID in the header is how it copes
- Testing time without waiting: `testing/synctest` makes a 24-hour retry schedule assertable in milliseconds

**Libraries:** standard library plus `math/rand/v2` for jitter. Do not import a retry package — the policy is thirty lines and it is the thing you are here to understand.

**Expected outcome:** A retry policy as a pure function — attempt number, response, `Retry-After` → next `available_at` or dead — unit-tested on its own. The dispatcher applies it. A dead-letter state with a reason. Metrics counters ready for step 14.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — using `synctest`: a receiver that fails with 503 for six simulated hours then returns 200. Assert the delivery eventually succeeds, the attempt count matches the schedule, no two consecutive intervals are identical (jitter is present), no interval exceeds the 6-hour cap, and the whole test runs in under a second of real time. Separately: a receiver answering `429` with `Retry-After: 30` is retried after roughly 30 seconds and not after the backoff value. And: a `400` is never retried. |
| **L2 — Manual checks** | (a) Set jitter to zero, run 100 failing deliveries, and plot when the retries land. Turn jitter back on and plot again. <br>(b) Take Pixel Forge's fake receiver down for longer than the dead-letter window and confirm the rows end in `dead` with a readable reason, not stuck in `pending`. <br>(c) Confirm no goroutine is sleeping on behalf of a scheduled retry — restart the process mid-backoff and check the retry still happens. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d`, `AP-10-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, the retry policy is a pure function with its own tests, and the coverage gate on `internal/delivery` is on |
