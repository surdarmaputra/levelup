---
title: Money and Operations
description: Steps 18–21. Out-of-order events and derived state, daily reconciliation, the ops console, deploy and on-call.
sidebar:
  order: 6
---

## Step 18 — Events that arrive in the wrong order

**Story:** *As Cedar & Co, when the payment provider sends `invoice.paid` before `invoice.created`, my client portal shows the right balance anyway, so that nobody has to explain a negative invoice to a client.*

**Mode:** `LEARN` — write the acceptance test first. Everything about this step is counter-intuitive until you have seen it fail.

**Why now:** Idempotency (step 6) made duplicates safe. It did nothing about order, and order is a separate problem with a separate solution. Doing this before reconciliation means step 19 is measuring a system that has a chance of being right.

**Concepts:**
- **Ordering is not guaranteed and never was.** Retries, parallel workers, and the sender's own infrastructure all reorder events. A system that assumes order is a system that is wrong occasionally and silently.
- **`balance += amount` is the bug.** An incremented counter cannot tolerate a duplicate, a reordering, or a replay. Derive state from the set of events instead, and the same three become harmless.
- **Derived state**: the balance is a function of the events you hold, recomputed rather than mutated. What that costs, and when a materialised snapshot is worth it.
- Late-arriving events: a refund for an invoice you closed three weeks ago. The event is old, the arrival is new, and both timestamps matter for different reasons.
- **Sequence numbers and versions** when a provider gives you one, and what to do when they do not — usually the provider's own event timestamp plus a tiebreaker
- Events you have not seen yet: an event referencing an invoice that does not exist. Creating a placeholder vs. parking the event — and why parking forever is a leak.
- Part payments, over-payments and currency: the states a real invoice actually has, which is more than paid and unpaid

**Libraries:** Eloquent, PostgreSQL, Pest

**Expected outcome:** A ledger for Cedar's payment events where invoice state is derived from stored events, tolerant of duplicates, reordering and late arrival. A recomputation path that produces identical state from the same event set in any order. Placeholder handling for events referencing unknown entities, with an ageing signal so a placeholder that never resolves is visible.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-18` — take a fixed set of 12 payment events including a part payment, a refund and a duplicate; apply them in five different orders including fully reversed; assert the derived invoice state is byte-identical every time. |
| **L2 — Manual checks** | (a) Find every `+=` and every `increment()` in your money code. Each one is either justified in a comment or a bug. <br>(b) Deliver a refund for an invoice that does not exist yet, then deliver the invoice. Confirm the balance is right and no manual intervention was needed. |
| **L4 — Anti-patterns** | `AP-18-a`, `AP-18-b`, `AP-18-c`, `AP-18-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-18` green, and no monetary value in the system is stored as a running total that events mutate |

---

## Step 19 — Reconciliation, and the number that tells you the truth

**Story:** *As Cedar & Co, every night the hub compares what it believes about my money with what the payment provider believes, and tells me the difference, so that "the integration is working" is a number rather than an opinion.*

**Mode:** `LEARN` — this step exists to find out whether steps 5 to 18 worked.

**Why now:** Last, because it audits everything before it. Building it earlier would only prove that an incomplete system is incomplete.

**Concepts:**
- **Reconciliation is the only real test of an integration.** Every other check asks "did my code do what I told it to?" This one asks "does the outside world agree with me?"
- The three outcomes: in both and matching, in both and different, in one but not the other. Each has a different cause and a different fix.
- **Drift as a metric.** Zero is the only acceptable steady state, and a non-zero number is an amount of somebody's money you cannot account for.
- Choosing a source of truth per field: the provider owns the payment, you own the mapping, and pretending otherwise causes fights
- **Window selection**: reconciling yesterday, not today, and why an event mid-flight is not a discrepancy
- Fetching the other side's view: their reporting API, their settlement file, their pagination, and their eventual consistency
- **What to do about a discrepancy**: auto-heal the safe ones, quarantine the rest for a human, never silently overwrite money
- The reconciliation report as a client-facing artefact — this is the thing that justifies a monthly retainer

**Libraries:** framework scheduling, your outbound adapters, Livewire for the report

**Expected outcome:** A nightly reconciliation job per money connection that pulls the provider's view of a closed window, compares it to the derived ledger from step 18, and records matched, mismatched and missing records with the difference. A drift signal feeding step 17's alerting. A readable daily report. Deliberate discrepancies seeded so the report is exercised rather than always green.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-19` — seed a window where one payment is missing locally, one differs by 1 minor unit, and one exists locally but not remotely; assert all three are reported in the correct category with the correct difference, and that a clean window reports zero drift. |
| **L2 — Manual checks** | (a) Delete one applied payment from your database and run reconciliation. It must find it. If it does not, the reconciliation is decorative. <br>(b) Read the report as if you were Cedar's finance person. If it does not say what to do next, it is not finished. |
| **L4 — Anti-patterns** | `AP-19-a`, `AP-19-b`, `AP-19-c`, `AP-19-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-19` green, drift is a monitored number, and you would put the report in front of a paying client |

---

## Step 20 — The ops console

**Story:** *As an operator, one screen tells me what every integration is doing right now, and lets me replay, pause and inspect without opening a terminal, so that the person supporting this does not have to be me.*

**Mode:** `BUILD` — Livewire screens over data that already exists. The judgement is in what earns a place.

**Why now:** Every signal this console shows was produced by an earlier step. Building it before them would have meant a console showing nothing, then twenty revisits.

**Concepts:**
- **The console answers three questions**: is it working, what broke, and what do I do about it. Anything that answers none of those is decoration and costs attention.
- Summary before detail: connection health first, then runs, then messages, then a single message's full attempt history
- **Actions with consequences**: replay, pause a connection, resolve a quarantined row, close a circuit. Every one confirmed, recorded, attributed.
- Live updating without a websocket: Livewire polling, and choosing an interval that is not a self-inflicted load test
- Reading a correlation id end to end — one id from the receiver through every job, attempt and log line, which is why step 5 created one
- Authorisation for a console that can move money-adjacent things
- **Screenshots of this are your portfolio.** A stranger should understand what the system does within ten seconds of looking at it.

**Libraries:** Livewire 4, Tailwind 4, Horizon alongside it

**Expected outcome:** An ops console: per-connection health with circuit and freshness state, recent runs with counts and outcomes, a searchable message list with full attempt history, dead-letter with replay, quarantine with resolve, and a per-business overview page. Every destructive action confirmed and audited. All three example businesses visibly distinct in it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-20` — replaying a dead-lettered message from the console produces exactly one effect, records who did it, and updates the record's state; pausing a connection stops new deliveries without failing queued ones. |
| **L2 — Manual checks** | (a) Break something at random in your local environment, then use only the console to work out what it is. Any step where you reach for `psql` or `tail` is a missing feature. <br>(b) Show it to somebody unfamiliar with the project for ten seconds and ask what the system does. |
| **L4 — Anti-patterns** | `AP-20-a`, `AP-20-b`, `AP-20-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-20` green, and routine support needs no terminal |

---

## Step 21 — Deploy, drain, and the runbook

**Story:** *As the person on call, when something breaks at 02:00 there is a document that tells me what to check and what to do, so that the answer does not live only in the head of whoever built it.*

**Mode:** `BUILD` for the deploy, `LEARN` for the runbook — the runbook is the deliverable, and writing it is the exercise.

**Why now:** Last. A runbook written before the failure modes exist is fiction.

**Concepts:**
- **Deploying a queue-backed system**: draining workers, `queue:restart`, and why a deploy mid-job is safe here only because step 6 made it safe
- Migrations that are safe to run while the old code is still serving, and the two-phase pattern for a column rename
- **Zero-downtime is a property of the deploy plus the schema plus the queue**, not a flag
- Scheduler and workers under a supervisor; what restarts them, and what happens when the machine reboots
- Backups you have restored at least once, and the fact that an untested backup is a rumour
- **The runbook**: one page per alert. What it means, what to check first, the three most likely causes, the command to run, and when to escalate.
- **This is the artefact that justifies a retainer.** A client is not paying for uptime they cannot see; they are paying for the fact that somebody has written down what happens when it breaks.
- Handover: credentials in a vault whose ownership transfers, the repository in the client's organisation, alerts routed to an address the client controls

**Libraries:** Docker Compose, nginx, a process supervisor, your alerting from step 17

**Expected outcome:** A deploy that drains and restarts workers without losing or duplicating work. Supervised workers and scheduler. A tested backup and a documented restore. A `docs/RUNBOOK.md` with one section per alert the system can raise, plus a first-15-minutes checklist. A handover checklist covering repository, credentials, hosting, alert routing and admin accounts.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-21` — deploy while 500 jobs are in flight: assert zero lost jobs and zero duplicated effects, and that the scheduler resumes on the new release. |
| **L2 — Manual checks** | (a) Restore your backup into a clean database and run `make verify` against it. <br>(b) Give the runbook to somebody who has never seen the project, trigger a real alert, and watch them work through it. Every place they stop is a missing paragraph. <br>(c) Reboot the machine. Everything must come back without you. |
| **L4 — Anti-patterns** | `AP-21-a`, `AP-21-b`, `AP-21-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-21` green, and somebody who is not you could take an alert from this system tonight |
