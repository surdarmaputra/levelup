---
title: Inbound
description: Steps 5–9. Signed webhooks, idempotency, the job pipeline, retries and dead-letter, poison messages.
sidebar:
  order: 3
---

## Step 5 — Receiving a webhook

**Story:** *As Meridian Print's website, when I post a new order to the hub I get an answer in under a second, so that my checkout does not hang while an accounting system is slow.*

**Mode:** `LEARN` — the order of operations in a receiver is the whole lesson.

**Why now:** This is the first real traffic. The message store from step 2 and the credentials from step 4 both exist, so the receiver can verify a signature and persist a payload without inventing either.

**Concepts:**
- **Acknowledge fast, work later.** The receiver verifies, stores, and returns. Anything else — parsing, business logic, calling a third party — happens on a queue. A receiver that does the work is a receiver that times out and gets the same payload again.
- **Signature verification**: HMAC over the raw body, timing-safe comparison, and why you must verify the bytes as received rather than a re-encoded version of the parsed JSON
- **Replay windows**: a timestamp in the signature, a tolerance, and what an attacker can do without one
- Reading the raw request body in Laravel, and the middleware that will quietly break this if it parses first
- What to return when the signature fails (and why it is not 500)
- Correlation ids: one id attached at the door and carried through every job and log line that follows

**Libraries:** framework routing and middleware, Pest with HTTP fakes

**Expected outcome:** A receiver endpoint per inbound connection, resolving the connection from the URL, verifying the signature against that connection's stored secret, persisting an `InboundMessage` with raw body and headers, and returning 200 with nothing else done. A correlation id generated at the door and attached to the stored message. Meridian's order webhook working end to end, storing but not yet acting.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — post a correctly signed payload and assert 200 plus exactly one stored message; post the same payload with a tampered body and assert it is rejected and nothing is stored; post one with a stale timestamp and assert it is rejected. |
| **L2 — Manual checks** | (a) Add a deliberate 3-second sleep in whatever you imagine the "processing" is, and watch the response time. If it moved, your receiver is doing work. <br>(b) Read the stored raw body and confirm it is byte-identical to what you sent, not re-serialised JSON. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and the receiver's p99 does not depend on anything outside your database |

---

## Step 6 — Idempotency

**Story:** *As Meridian Print, when my website's webhook is delivered three times during an outage, exactly one invoice exists in my accounting system, so that I do not have to explain three invoices to a customer.*

**Mode:** `LEARN` — write the acceptance test first. This is the step the whole material is built around.

**Why now:** Everything after this assumes at-least-once delivery is safe. Build the pipeline first and you will retrofit idempotency into a dozen places instead of one.

**Concepts:**
- **At-least-once is the only guarantee anyone offers.** Exactly-once delivery does not exist; exactly-once *effect* is what you build, and it is your job, not the sender's.
- **Idempotency keys**: choosing one, storing it, and the difference between the sender's event id, a natural business key, and a hash of the payload
- **"Check then insert" is a race, not a check.** Two workers run the check at the same microsecond and both pass. The unique index is the actual mechanism; the check is only there to give a nice error.
- Catching a unique-violation and treating it as success — the shape of an idempotent write
- **Dedupe windows**: how long to remember a key, why "forever" costs money, and what a re-delivery after expiry does
- Idempotency for the *effect*, not just the message: two different messages that mean the same thing
- Concurrency testing: how to make two workers genuinely race in a test rather than hoping

**Libraries:** Eloquent, PostgreSQL unique constraints, Pest with parallel processes

**Expected outcome:** A dedupe key derived per connection type, a unique constraint enforcing it, and a `handle-once` wrapper that every consumer goes through. Duplicate deliveries recorded as duplicates — visible, counted, not silently dropped. Meridian's order flow producing exactly one invoice for N deliveries of the same order.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — fire the same signed payload 50 times concurrently and assert exactly one invoice-creation effect, and that the other 49 are recorded as duplicates. Must run against real PostgreSQL with real concurrency, not a loop. |
| **L2 — Manual checks** | (a) Remove the unique index and run `ACC-06` again. It must fail. If it still passes, your test is not concurrent and proves nothing. <br>(b) Say out loud what the dedupe key is for each of the three businesses. Cedar's payment provider sends the same event id for a retry but a *different* one for a genuine second charge — check yours survives that. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and every write path in the system goes through the same handle-once wrapper |

**Harness impact:** `AGENTS.md` v3 — idempotency is now a rule, not a habit: every consumer is idempotent, every duplicate is recorded, the unique index is the mechanism.

---

## Step 7 — The job pipeline

**Story:** *As an operator, work queued from a webhook runs on a worker I can watch, pause and scale, so that a busy morning does not become a support ticket.*

**Mode:** `BUILD` — queues and Horizon are configuration and wiring. Generate, then read.

**Why now:** Idempotency exists, so it is now safe for a job to run twice — which is the precondition for putting anything on a queue at all.

**Concepts:**
- **Queue semantics**: reserved jobs, visibility timeout, and what happens to a job when the worker is killed mid-run
- Redis as a queue driver, and how it differs from the database driver you used until now
- **Horizon**: supervisors, queue priorities, and why one queue for everything means Harborline's nightly 8,000-row import blocks Meridian's orders
- **Job design**: small, single-purpose, carrying ids rather than objects, with `SerializesModels` understood rather than copied
- `ShouldBeUnique` and its lock lifetime — the difference between "do not run twice at once" and "do not run twice ever"
- Batches and chains: when work has a shape, and how failure propagates through each
- Worker lifecycle: `queue:restart`, graceful shutdown, and why a deploy that kills workers mid-job needs step 6 to be right

**Libraries:** `laravel/horizon`, Redis 8

**Expected outcome:** Redis queues with at least three named queues by priority (interactive, standard, bulk), Horizon configured with a supervisor per queue, and the delivery pipeline moved onto it: a stored message dispatches a `Delivery`, which performs one attempt against one target. Meridian's flow now runs entirely on the queue.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — dispatch a delivery, assert it lands on the expected queue, runs, and records an attempt; then assert that a bulk job dispatched at the same time does not delay it. |
| **L2 — Manual checks** | (a) Open Horizon, dispatch 500 bulk jobs and 5 interactive ones, and watch which finish first. <br>(b) Kill a worker with `SIGKILL` in the middle of a job. Find the job again. Explain what made it come back and what would have happened without step 6. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and no queue can starve another |

---

## Step 8 — Retry policy

**Story:** *As Cedar & Co's accounting system, when I am down for ten minutes the hub waits and tries again rather than giving up or hammering me, so that nothing is lost and my recovery is not made worse.*

**Mode:** `LEARN` — retry policy is judgement, and a generated one will be wrong in a way that only shows during an incident.

**Why now:** The pipeline exists and jobs now fail against real third parties. A default retry policy is a policy — usually a bad one — so decide it deliberately before step 10 starts making real outbound calls.

**Concepts:**
- **Which failures are retryable.** A timeout is. A 500 is. A 422 is not, and retrying it is how one malformed payload becomes 4,000 log lines.
- **Exponential backoff with jitter.** Without jitter every job that failed during an outage retries at the same instant and takes the recovering system down again. This is the single most common mistake in this domain.
- Per-connection retry budgets: a third party with a 99% SLA and one with a 99.99% SLA do not deserve the same patience
- `tries`, `backoff`, `retryUntil`, `maxExceptions` — what each actually controls, and which one you want
- **Retry storms and the thundering herd**, and why a cap on total attempts is not the same as a cap on concurrent retries
- Distinguishing "failed" from "failed permanently" in your own records
- Time in tests: freezing the clock and travelling forward instead of sleeping

**Libraries:** framework queue retry configuration, Pest time helpers

**Expected outcome:** A retry policy per connection — attempts, base delay, multiplier, jitter, and a hard ceiling — stored as connection config, not hardcoded. A classifier that decides retryable vs. permanent from the failure. Attempt records showing the actual delays used. A test proving two jobs failing in the same second do not retry in the same second.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — a job failing with a retryable error is retried on the configured schedule and stops at the ceiling; a job failing with a permanent error is not retried at all. Assert on recorded attempt timestamps with a frozen clock. |
| **L2 — Manual checks** | (a) Queue 200 jobs against a target that returns 503, then plot the retry times. If they cluster, your jitter is missing or wrong. <br>(b) For each of the three businesses, name the failure that must never be retried. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and no retry delay in the system is a fixed number of seconds |

---

## Step 9 — Dead-letter, poison messages, and replay

**Story:** *As an operator, when one message can never succeed it stops consuming the queue and waits for me on a screen, so that 4,000 healthy orders are not stuck behind one broken one.*

**Mode:** `LEARN` — write the acceptance test first.

**Why now:** Retries now terminate, which means something must catch what falls out. Without this step the pipeline silently loses work, and you will not find out for a week.

**Concepts:**
- **Dead-letter as a destination, not an error.** Exhausted work moves somewhere durable, with the original payload, the failure, and every attempt.
- **Poison messages**: a payload that reliably kills its worker. Why an unbounded retry on one of these can occupy every worker you own, and how isolation prevents it.
- **Replay from the message store, not from the sender.** This is why step 2 stored the raw bytes: a fix deployed on Thursday must be applicable to Tuesday's traffic.
- Replay safety: replaying is just delivering again, so it is only safe because step 6 exists. Everything connects here.
- Partial replay: one message, one connection, one time window — and why "replay everything" is rarely what you want
- The operator's question a dead-letter record must answer: *what broke, what was it trying to do, and what happens if I press replay?*
- The replay-safety sweep: a CI test that fails when a job class has no "runs twice, same result" test

**Libraries:** framework failed-job handling, Pest

**Expected outcome:** A dead-letter store holding the message reference, the target, the final failure, and the attempt history. A replay path that re-dispatches from the stored payload, records that it was a replay, and is safe to press twice. Poison-message isolation so a repeatedly fatal payload is quarantined rather than retried forever. The replay-safety sweep added to `make verify`.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a message that always fails ends in dead-letter with its full attempt history and blocks nothing else on the queue; replaying it after the fault is removed produces exactly one effect; replaying it twice still produces exactly one. |
| **L2 — Manual checks** | (a) Dead-letter a Cedar payment event, then read the record as if you were on call. If you cannot tell what will happen when you press replay, add what is missing. <br>(b) Push one poison message into a queue of 500 healthy ones and confirm the 500 complete. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, the replay-safety sweep runs in `make verify`, and nothing in the system can fail silently |

**Harness impact:** `AGENTS.md` v3b — replay is the recovery path; every new job class needs a runs-twice test or CI fails.
