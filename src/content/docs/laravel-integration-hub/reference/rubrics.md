---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"50 concurrent deliveries of one payload: exactly one invoice"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still wrong: the retry with no jitter that turns a partner's recovery into a second outage, the credential passed into a job and written to Redis in plain text. Most of them do not show up at runtime until somebody else has a bad day.

**Why this exists.** In this domain a broken integration and a working one look identical from the outside — both are quiet. The rubric turns "done" into something you check rather than something you feel.

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
| AP-00-c | **Generic `AGENTS.md`.** Restating public Laravel documentation adds nothing — the model already knows it. The file's value is entirely in what is specific to this project. |
| AP-00-d | **Dependencies added later.** Bringing up SFTP or MinIO for the first time at step 15 means every step-15 bug looks like an SFTP bug. Define the whole environment now. |

---

## Step 1 — The connection registry

**ACC-01** — a feature test boots the application and asserts `GET /api/v1/health` returns 200 with per-connection entries, and that a paused connection reports as paused rather than healthy.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **`env()` called outside `config/`.** Returns `null` the moment config is cached, which is the moment you deploy. |
| AP-01-b | **Connection behaviour hardcoded in a controller or a match statement.** Adding a connection must be data, not a deploy. |
| AP-01-c | **Health that only reports "up".** A health endpoint that cannot say *which* connection is broken tells the person on call nothing they did not already know. |

---

## Step 2 — The message model and the schema

**ACC-02** — insert the same inbound message twice for one connection and assert the second insert is rejected by the database, not by application code. Runs against real PostgreSQL.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Parsing before storing.** If validation runs first, an unparseable payload is lost, and unparseable payloads are exactly the ones you need to look at. |
| AP-02-b | **A mutable inbound record.** A `processed_at` column on the message conflates what arrived with what you did about it, and makes a second delivery attempt impossible to represent. |
| AP-02-c | **Money as a float, or timestamps without a timezone.** Floats lose minor units; `timestamp` silently records the server's local time. |
| AP-02-d | **Dedupe by hash of the body.** Two genuinely different events can serialise identically, and one event can serialise two ways. Use the sender's id where one exists. |

---

## Step 3 — The request contract and the error model

**ACC-03** — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly, including a per-field errors map. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when `APP_DEBUG=false`.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Returning 500 for a payload you will never accept.** The sender retries it for hours. A permanent failure must be a 4xx. |
| AP-03-b | **Returning 200 for something you dropped.** The sender stops retrying and the data is gone with no record anywhere. |
| AP-03-c | **Inconsistent error shapes.** Validation returns one format, not-found another, unhandled a third — so a partner writes one parser and hopes. |

---

## Step 4 — Credentials and encryption

**ACC-04** — store a credential, read the raw column directly and assert the plaintext does not appear; run the rotation command and assert the credential still decrypts and the key id changed.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **A credential passed into a queued job.** Job properties are serialised into Redis in plain text. Pass the connection id and resolve the secret inside `handle()`. |
| AP-04-b | **Secrets in exception messages.** An adapter that includes the request headers in its exception publishes the token to every log, every error tracker, and every screenshot. |
| AP-04-c | **No rotation path.** Encryption without a way to re-key means the first suspected leak is a manual database edit under pressure. |
| AP-04-d | **Non-timing-safe signature comparison.** `==` on an HMAC leaks the signature one byte at a time to anyone patient enough. |

---

## Step 5 — Receiving a webhook

**ACC-05** — a correctly signed payload returns 200 and stores exactly one message; a tampered body is rejected and stores nothing; a stale timestamp is rejected.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Doing the work in the receiver.** The sender times out, retries, and now you have two of everything — and a p99 that depends on somebody else's database. |
| AP-05-b | **Verifying the signature against re-encoded JSON.** Decoding and re-encoding changes bytes; the HMAC is over what was sent. Verify the raw body. |
| AP-05-c | **No replay window.** Without a timestamp tolerance, a captured request is valid forever. |
| AP-05-d | **No correlation id.** Without one id carried from the door through every job and log line, debugging a single order means reading every log. |

---

## Step 6 — Idempotency

**ACC-06** — fire the same signed payload 50 times concurrently and assert exactly one effect, with the other 49 recorded as duplicates. Real PostgreSQL, real concurrency — not a sequential loop.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **"Check then insert."** Two workers pass the check in the same microsecond. The unique index is the mechanism; the check is only a nicer error message. |
| AP-06-b | **Dropping duplicates silently.** A duplicate rate that suddenly changes is a signal about the sender. Count them, show them. |
| AP-06-c | **A dedupe window that never expires, or expires in an hour.** Forever is unbounded storage; an hour is a re-delivery after a long outage doing the work twice. Choose a number and write down why. |
| AP-06-d | **Idempotent messages but non-idempotent effects.** Deduplicating the payload while the handler still appends a row means the second delivery is safe and the second *retry* is not. |

---

## Step 7 — The job pipeline

**ACC-07** — a dispatched delivery lands on the expected queue, runs, and records an attempt; a bulk job dispatched simultaneously does not delay it.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **One queue for everything.** An 8,000-row nightly import sits in front of a customer's order confirmation. |
| AP-07-b | **Passing Eloquent models into jobs and relying on `SerializesModels` without understanding it.** The model is refetched at run time; the row may have changed or gone. |
| AP-07-c | **`ShouldBeUnique` with a lock longer than the work.** The second legitimate run is silently swallowed and nobody notices until the numbers are wrong. |

---

## Step 8 — Retry policy

**ACC-08** — a retryable failure is retried on the configured schedule and stops at the ceiling; a permanent failure is not retried at all. Asserted on recorded attempt timestamps with a frozen clock.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Backoff without jitter.** Every job that failed during an outage retries at the same instant and takes the recovering system down again. This is the most common mistake in this domain. |
| AP-08-b | **Retrying a 4xx.** The payload will never be accepted. Retrying it turns one bad message into thousands of log lines and a rate-limit ban. |
| AP-08-c | **A fixed delay.** `sleep(5)` between attempts is not a policy; it is a synchronised herd with extra steps. |
| AP-08-d | **Unbounded retries.** Without a ceiling there is no dead-letter, and without dead-letter nobody ever finds out. |

---

## Step 9 — Dead-letter, poison messages, and replay

**ACC-09** — an always-failing message ends in dead-letter with its full attempt history and blocks nothing else; replaying it after the fault is removed produces exactly one effect; replaying twice still produces exactly one.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Replaying by asking the sender to send again.** Most senders will not, and the ones that will send you a *different* payload. Replay from your own stored bytes. |
| AP-09-b | **A dead-letter record without the payload or the error.** It records that something failed, which you already knew. |
| AP-09-c | **A poison message retried forever.** One payload that kills its worker will occupy every worker you own. |
| AP-09-d | **A replay button with no idempotency behind it.** The button is only safe because step 6 exists; if a job class is not covered by a runs-twice test, the button is a loaded gun. |

---

## Step 10 — Outbound adapters and timeouts

**ACC-10** — against a target that never responds, the adapter fails within the configured timeout, records the attempt with its duration, and releases the worker. Assert the elapsed time.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **No explicit timeout.** One hung partner blocks a worker for minutes; twenty workers later the queue has stopped. |
| AP-10-b | **A read timeout longer than the queue's visibility timeout.** The job is handed to a second worker while the first is still waiting, and now the request happens twice. |
| AP-10-c | **Treating any 200 as success.** A 200 carrying an error body, or an HTML login page, is a failure that your code just recorded as done. |
| AP-10-d | **No outbound idempotency key.** You demand deduplication from your senders and offer none to your targets — so your own retry creates their duplicate. |

---

## Step 11 — Rate limits and throttling

**ACC-11** — with a limit of 10/minute and 40 queued jobs across two workers, no more than 10 requests reach the target in the first minute and none are lost.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **An in-process limiter.** Correct with one worker, wrong with two, and you will run two. |
| AP-11-b | **Failing jobs when the limit is reached.** They belong back on the queue with a delay, not in the failed table. |
| AP-11-c | **Ignoring `Retry-After`.** The other side told you exactly when to come back and you applied your own backoff instead. |

---

## Step 12 — Circuit breaking

**ACC-12** — after the failure threshold, calls fail immediately without reaching the target; after the cooldown exactly one probe is admitted; a successful probe closes the circuit, a failed one reopens it.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Half-open that admits everything.** The recovering partner receives your entire backlog in one second and goes down again. |
| AP-12-b | **A threshold of consecutive failures with no minimum volume.** One failed call on a quiet night opens the circuit for everybody. |
| AP-12-c | **The same open-circuit behaviour everywhere.** Skipping a WhatsApp confirmation is fine; skipping a payment event is data loss. Decide per connection. |

---

## Step 13 — Mapping and schema drift

**ACC-13** — a payload missing a required field is rejected with a named error and nothing is written; an unknown extra field maps successfully; a renamed field fails the drift test rather than mapping to null.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Mapping a missing field to null.** The import succeeds, the column fills with nulls, and the problem is found weeks later in a report. |
| AP-13-b | **The partner's field names in your domain.** Their rename becomes your migration, everywhere, at once. |
| AP-13-c | **Hand-written fixtures.** A payload you invented tests your imagination. Record a real one. |
| AP-13-d | **Money or timestamps as plain scalars across the boundary.** An amount without a currency and an instant without a zone are both bugs waiting for the first foreign supplier. |

---

## Step 14 — Scheduled work

**ACC-14** — a still-running scheduled task does not start a second time; a crashed run leaves a lock that expires rather than blocking forever; every execution produces exactly one `Run` record with a terminal outcome.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **`withoutOverlapping` with no expiry.** One crash and the task never runs again, silently, until somebody notices the data is old. |
| AP-14-b | **No catch-up policy.** After four hours of downtime the system either does nothing or does everything, and which one was never decided. |
| AP-14-c | **A run that records nothing.** Tomorrow's question is "did last night work?" and there is no answer. |

---

## Step 15 — File ingestion

**ACC-15** — an 8,000-row file with a malformed row 4,812: all valid rows applied, the bad row quarantined, the run completes, and a second run applies nothing new. Killed at row 3,000, the retry applies rows 3,001 onward only.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **One transaction for the whole file.** A single bad row discards 7,999 good ones, and the lock is held for minutes. |
| AP-15-b | **Restarting instead of resuming.** Re-applying 4,811 rows every night works until the file is large, then it works badly and eventually not at all. |
| AP-15-c | **Reading a file that is still being written.** No completeness check means a truncated file silently becomes a truncated catalogue. |
| AP-15-d | **Loading the file into memory.** Fine on the 200-row sample, fatal on the real one, and the failure looks like an unrelated worker crash. |

---

## Step 16 — Quarantine and review

**ACC-16** — correcting a quarantined row and re-applying it produces exactly one applied result and marks the record resolved with an audit entry; re-applying a resolved row does nothing.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **A database error as the user-facing message.** `SQLSTATE[23505]` tells the office manager nothing and trains them to call you. |
| AP-16-b | **Quarantine with no ageing signal.** A pile nobody looks at grows until it is a data-quality problem instead of a fourteen-row afternoon. |
| AP-16-c | **Re-apply without the step 6 wrapper.** The one action a non-developer will press twice is the one that must be idempotent. |

---

## Step 17 — Freshness and silence

**ACC-17** — a connection expecting a file by 06:00 with none received raises a stale signal exactly once and does not repeat every minute; the signal clears when a file arrives.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Alerting only on errors.** The failure this step exists for produces no error at all. |
| AP-17-b | **An alert that repeats every check.** Three hundred emails by morning, all ignored, including the next real one. |
| AP-17-c | **A threshold of zero.** Traffic that halves is a broken integration and a zero-threshold alert will never see it. |
| AP-17-d | **An alert with no action.** If nobody knows what to do at 03:00, it is noise; downgrade it or delete it. |

---

## Step 18 — Out-of-order events

**ACC-18** — twelve payment events including a part payment, a refund and a duplicate, applied in five different orders including fully reversed, produce byte-identical derived state every time.

| ID | Anti-pattern |
|---|---|
| AP-18-a | **`balance += amount`.** Cannot survive a duplicate, a reordering or a replay — and this system produces all three. |
| AP-18-b | **Assuming arrival order is event order.** It is not, was never promised, and the failure is silent and monetary. |
| AP-18-c | **Rejecting an event for an entity you have not seen.** The invoice is two seconds behind the payment; rejecting loses the payment permanently. |
| AP-18-d | **Placeholders that never age out.** An event parked forever waiting for a parent that will never arrive is a leak with no alarm on it. |

---

## Step 19 — Reconciliation

**ACC-19** — in a window where one payment is missing locally, one differs by 1 minor unit, and one exists locally but not remotely, all three are reported in the correct category with the correct difference; a clean window reports zero drift.

| ID | Anti-pattern |
|---|---|
| AP-19-a | **Reconciling against your own database.** Comparing your ledger to your own events proves your code is consistent with itself, which was never in doubt. |
| AP-19-b | **Auto-correcting a monetary discrepancy.** Silently overwriting money to make a report green destroys the only evidence of the bug. |
| AP-19-c | **Reconciling the current window.** Events in flight are not discrepancies, and an alert that fires every night at 23:00 for the same reason gets muted. |
| AP-19-d | **Drift reported but not alerted.** A number on a page nobody opens is not monitoring. |

---

## Step 20 — The ops console

**ACC-20** — replaying a dead-lettered message from the console produces exactly one effect, records who did it, and updates the record's state; pausing a connection stops new deliveries without failing queued ones.

| ID | Anti-pattern |
|---|---|
| AP-20-a | **Destructive actions without confirmation or audit.** "Who replayed 4,000 messages at 02:00" must have an answer. |
| AP-20-b | **A console that requires the terminal anyway.** If routine support still means `psql`, the console has not been built yet. |
| AP-20-c | **Polling every second.** A dashboard that loads the database harder than the traffic does is its own incident. |

---

## Step 21 — Deploy, drain, and the runbook

**ACC-21** — deploying while 500 jobs are in flight loses zero jobs and duplicates zero effects, and the scheduler resumes on the new release.

| ID | Anti-pattern |
|---|---|
| AP-21-a | **A backup that has never been restored.** It is a belief, not a backup, and you find out on the worst day. |
| AP-21-b | **A runbook of commands with no diagnosis.** The person on call needs to know what the alert means before they need a command. |
| AP-21-c | **Alerts routed only to you.** An integration only one person can support is not a deliverable; it is a dependency you have sold to a client. |
