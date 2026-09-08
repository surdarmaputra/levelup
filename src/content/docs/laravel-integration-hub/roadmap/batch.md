---
title: Batch and Schedule
description: Steps 14–17. Scheduled pulls, SFTP and CSV ingestion, quarantine and review, freshness and silence detection.
sidebar:
  order: 5
---

## Step 14 — Scheduled work, and the run that overlaps itself

**Story:** *As Harborline Supply, the hub checks my suppliers every night whether or not they tell it to, so that my catalogue is right in the morning.*

**Mode:** `BUILD` — the scheduler is wiring. The overlap and catch-up decisions are yours.

**Why now:** Everything so far has been triggered by somebody else. Two of the three example businesses have work that nothing triggers, and that changes what failure looks like: there is no sender to retry, so if the run does not happen, nothing happens at all.

**Concepts:**
- **Pull vs. push.** With a webhook, missing work announces itself as a backlog. With a schedule, missing work is silence, and silence looks exactly like success.
- Laravel's scheduler: one `cron` entry, tasks in code, and why per-task `cron` entries rot
- **`withoutOverlapping` and its lock expiry.** A run that takes longer than its interval will overlap itself. The lock stops that; a stale lock after a crash stops everything, which is the failure you must plan for.
- `onOneServer` once there is more than one machine, and what happens without it
- **Catch-up policy**: the machine was down from 01:00 to 05:00. Do you run the missed jobs, run only the latest, or skip? Different answers per connection, and it must be a decision, not an accident.
- Idempotent runs: today's run and today's re-run must leave the same state — step 6 again, in a different shape
- A `Run` record: started, finished, counts, and the outcome. A run that leaves no record cannot be debugged tomorrow.

**Libraries:** framework scheduler, framework cache locks

**Expected outcome:** A scheduler entry per pull connection, driven from connection config rather than hardcoded. Overlap protection with an explicit lock timeout. A recorded `Run` per execution with start, finish, counts and outcome. A documented catch-up policy per connection. Harborline's three suppliers scheduled; Cedar's provider polled as a backstop for missed webhooks.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — a scheduled run that is still executing does not start a second time; a run that crashes leaves a lock that expires rather than blocking forever; every execution produces exactly one `Run` record with a terminal outcome. |
| **L2 — Manual checks** | (a) Kill the process mid-run. Wait for the lock to expire. Confirm the next run starts and that the `Run` record of the dead one is not left "running" forever. <br>(b) Simulate four hours of downtime and confirm the catch-up behaviour matches what you wrote down, for each connection. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and every scheduled connection has a written catch-up policy |

---

## Step 15 — File ingestion that resumes

**Story:** *As Harborline Supply, when a supplier's 8,000-row file has a broken row at 4,812, the 4,811 good rows before it are applied and tomorrow's run does not start from zero, so that one bad row does not cost me a day of trading.*

**Mode:** `LEARN` — write the acceptance test first. Partial failure is the hardest idea in this material.

**Why now:** Scheduling exists, so there is something to run this inside. It is deliberately after the webhook path: reading it second makes the difference between total failure and partial failure obvious.

**Concepts:**
- **Partial failure is the normal case in batch.** A webhook either worked or did not. A file is 8,000 independent outcomes, and treating it as one transaction throws away 7,999 good ones.
- **Resume, don't restart.** Per-row progress recorded durably, so the second attempt starts where the first stopped.
- **The half-written file.** A supplier's upload is still in progress when your job starts at 01:00. Detecting it: a marker file, an atomic rename, a stable-size check, or a checksum — pick one and know its failure mode.
- Streaming a large file rather than loading it: memory, and why `file()` on a 200 MB CSV kills the worker
- **Row-level validation and the quarantine decision**: which rows are applied, which are skipped, which are held for a human
- Chunked batches: a Laravel job batch per chunk, so progress and failure are visible per chunk rather than per file
- **Transaction boundaries** — one per chunk, not one per file and not one per row, and the reasoning behind that middle position
- Encoding, delimiters, BOM, `CRLF`, and the other reasons real CSV files are not CSV files

**Libraries:** `league/flysystem-sftp-v3`, a streaming CSV reader, framework job batches

**Expected outcome:** An SFTP ingestion pipeline: detect a complete file, record a `Run`, stream it in chunks, apply valid rows idempotently, quarantine invalid ones, and record per-row outcomes. Resume after a crash without re-applying rows already applied. Harborline's three suppliers ingesting, including one file that is deliberately truncated and one row that is deliberately malformed.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — ingest an 8,000-row file whose row 4,812 is malformed: assert all valid rows are applied, the bad row is quarantined, the run completes rather than failing, and a second run applies nothing new. Then kill the process at row 3,000 and assert the retry applies rows 3,001 onward only. |
| **L2 — Manual checks** | (a) Start an ingestion while the file is still uploading. Whatever your completeness check is, watch it work — and then remove it and watch the corruption it prevents. <br>(b) Ingest the same file twice. Row counts in the catalogue must be identical. <br>(c) Watch memory while ingesting the largest file you have. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and no run in the system is all-or-nothing |

---

## Step 16 — Quarantine and the person who fixes it

**Story:** *As Harborline's office manager, I can see the 14 rows that were rejected last night, understand why, fix them, and re-apply them myself, so that I do not have to call a developer about a typo.*

**Mode:** `BUILD` — a Livewire screen. The judgement is in what it shows, not how it is built.

**Why now:** Steps 13 and 15 both produce quarantined records and neither has anywhere to send them. Quarantine with no review path is just a slower way of losing data.

**Concepts:**
- **Quarantine is a queue for humans**, and it obeys the same rules as a queue for workers: it must be visible, it must be actionable, and it must not grow forever unnoticed
- Writing an error message for a non-developer: what was wrong, in which row, and what to do about it. `SQLSTATE[23505]` is not an error message.
- Livewire for a table with filters, inline editing and a re-apply action; where validation lives when the same rules must serve an import and a form
- **Re-apply is replay** — the same step 6 mechanism, so fixing and re-applying a row twice is safe
- Authorisation: who may edit a quarantined row, and the audit trail of who changed what
- Bulk actions, and why "re-apply all" needs a confirmation and a record
- Ageing: a quarantined row nobody has looked at for 30 days is a signal about the integration, not about the row

**Libraries:** Livewire 4, Tailwind 4

**Expected outcome:** A quarantine screen listing rejected rows per business and per run, with the original values, a plain-English reason, inline correction, single and bulk re-apply, and an audit trail. Ageing counters exposed for step 17 to alert on. Harborline's malformed row from step 15 fixable end to end by someone who does not know what a queue is.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — correcting a quarantined row and re-applying it produces exactly one applied result and marks the quarantine record resolved with an audit entry; re-applying an already-resolved row does nothing. |
| **L2 — Manual checks** | (a) Show the screen to someone who does not work on this project and ask them to fix a row. Watch where they hesitate. That hesitation is the finding. <br>(b) Read every error message on the screen and rewrite any that names a database constraint, a class, or an exception. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and a non-developer can resolve a quarantined row without help |

---

## Step 17 — Freshness, silence, and the failure that produces no error

**Story:** *As an operator, when a supplier stops sending files at all, I find out that morning rather than three weeks later when someone notices the prices are old.*

**Mode:** `LEARN` — the interesting part is deciding what "should have happened by now" means for each connection.

**Why now:** The system now has scheduled work, and scheduled work introduces a failure mode nothing before this could produce: nothing happened, no error was raised, and every dashboard is green.

**Concepts:**
- **Absence of error is not evidence of success.** Every metric so far counts things that happened. This step counts things that did not.
- **Freshness as an expectation per connection**: "a file every night by 06:00", "at least one event per hour on a weekday", "nothing expected at weekends". Expressed as data, checked by a job.
- Why an alert on a *rate* is not enough — traffic that halves is invisible to a threshold set for zero
- **Alert fatigue is a real failure mode.** An alert nobody acts on is worse than no alert, because it teaches the team that alerts do not matter. Fewer, sharper, actionable.
- Choosing thresholds from observed behaviour rather than from a guess, and revisiting them once you have two weeks of data
- Signals worth watching here: freshness per connection, queue depth and age of oldest job, dead-letter count, quarantine age, circuit state, and reconciliation drift once step 19 exists
- Routing: which of those wakes someone at 03:00, and which waits for the morning. Most wait.

**Libraries:** framework scheduling and notifications, Mailpit locally

**Expected outcome:** A freshness expectation per connection stored as config. A scheduled checker producing a `Signal` per connection with a state. Alert routing with severity, so quarantine ageing sends a morning email while Cedar's payment feed going silent pages immediately. Every alert carrying the connection, the expectation, what was observed, and a link to the ops console. A written list of every alert and who acts on it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — with a connection expecting a file by 06:00 and no file received, the checker raises a stale signal exactly once and does not repeat it every minute; when a file arrives the signal clears. |
| **L2 — Manual checks** | (a) Stop Harborline's SFTP container overnight in your local environment and confirm you would have known by morning. <br>(b) Read every alert your system can send and ask, for each, what a person would do at 03:00. Any alert with no answer must be downgraded or deleted. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and every connection has an expectation that fires when nothing arrives |

**Harness impact:** `AGENTS.md` v4 — record the queue names and priorities, the freshness expectations, and the rule that every scheduled connection has a silence alert.
