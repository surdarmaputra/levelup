---
title: Operations
description: Steps 16–17. Deploy and hand-over, then drift, new suppliers, and the monthly accuracy report the client receives.
sidebar:
  order: 7
---

## Step 16 — Deploy, run, and hand over

**Story:** *As Meridian Print Co, the system runs without me thinking about it, and if I stop paying my developer I still have my documents and my data.*

**Mode:** `BUILD` — wiring, with two decisions to record.

**Why now:** After the system is measured and priced. Deploying something you cannot yet describe the accuracy or cost of is how a pilot becomes an argument.

**Concepts:**
- **What actually has to run**: the application, a worker, PostgreSQL, and object storage. Four things, one Compose file, one small VPS. Add nothing until a number says to.
- **Where a broker becomes correct.** The Postgres job queue from step 5 is right until roughly the point where a single worker cannot keep up with the arrival rate, or you need scheduled fan-out across machines. State the volume you measured and the signal you would watch, so the upgrade is a decision rather than a fashion.
- **Secrets in production.** The API key, the storage credentials, the database password. Not in the image, not in the repository, and not printed by a health endpoint.
- **Backups that have been restored.** A backup nobody has restored is a belief. Restore into a scratch database and run the accuracy suite against it; that also proves the gold set survived.
- **Retention and residency.** Alder's documents contain patient data. How long are originals kept, who can reach them, and what is deleted on request. This was a scoping question at step 3; it becomes configuration here.
- **Idempotent ingestion.** The same document arriving twice — re-sent by a supplier, re-uploaded by a user — must not produce two rows in the client's accounting system. The content hash from step 5 is what makes this possible; the check has to be at the write boundary, not the upload.
- **The runbook.** A failed batch, a document stuck in review for a week, a cost spike, a supplier whose layout changed, a client asking why one invoice was wrong. Five pages, written before they happen.
- **Hand-over is part of the job.** The client owns their documents and their data. Ingestion must be re-runnable by them, exports must exist, and the accuracy report is theirs. A system that only its author can operate is worth less to them and, in the end, to you.

**Libraries:** Docker Compose, your CI, whatever object storage you chose

**Expected outcome:** A deployment on one small host with the four services, run by CI. Migrations applied before the new version serves, with a rollback that does not orphan in-flight jobs. Secrets from the environment. A restored-and-verified backup. Retention rules per client, applied. Idempotent writes at the boundary to the client's system. `docs/RUNBOOK.md` with the five scenarios. An export the client can take and read without you.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — the same document ingested twice results in one row reaching the client-facing table; a deploy applies migrations before serving and a rollback leaves no job unclaimable; a restore from backup passes the step 11 accuracy suite unchanged. |
| **L2 — Manual checks** | (a) Delete your local environment entirely and bring the system up from the repository and the runbook alone. Every gap you hit is a gap the client would hit. <br>(b) Read the runbook as if it is 07:00 and the overnight batch failed. If you would still have to think, it is not finished. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and you could hand the whole thing to the client tomorrow |

---

## Step 17 — Drift, new suppliers, and the monthly report

**Story:** *As Coastline Freight, when a supplier changes their delivery note layout, my developer tells me before I notice it — and adding a new supplier does not mean a new project.*

**Mode:** `LEARN` — drift detection is the part that decides whether this is a project you finish or a client you keep.

**Why now:** Last. It needs the accuracy number, the review data, the cost ledger and a running system. It is also the step that turns a delivered build into a retainer.

**Concepts:**
- **Layout drift is the failure this domain always has.** A supplier changes their invoice template. Nothing errors. Accuracy on that supplier's documents drops and everything else looks normal. The pack contains three invoices from a supplier who changed mid-year for exactly this rehearsal.
- **What to watch, per sender.** Field accuracy where you have labels, but mostly the proxies you have every day: review rate, validation failure rate, correction rate per field, and confidence distribution. A shift in any of them on one sender, against its own history, is the signal.
- **Per sender against itself, not against the whole.** A change affecting one supplier out of forty moves the overall number by too little to see. The comparison has to be each sender against their own baseline.
- **Corrections are the earliest signal you have.** A reviewer correcting the same field on the same sender three times this week is drift, several days before any aggregate moves. This is what step 12 stored the attribution for.
- **Onboarding a new sender should be data, not a release.** A schema, some field descriptions, validation rules, thresholds. If a new supplier needs code, the model is wrong — and it is also the difference between a retainer that scales and one that eats you.
- **A small labelled set per sender.** Ten hand-labelled documents from each new sender, added to the gold set, so drift on them is measurable rather than inferred.
- **The monthly report is the retainer.** Documents processed, accuracy on the labelled sample, review rate, hours saved against the step 0 model, cost, and anything that changed. One page, automatically generated, sent whether or not anything happened. A client who receives this every month knows what they are paying for, and it is the cheapest renewal conversation there is.
- **When to retire it.** If the client's supplier starts sending structured data — a CSV, an API, a standard e-invoice — the correct advice is to take it and skip the extraction entirely. Saying so is how you stay their developer.

**Libraries:** none new — your own metrics over the ledger and review tables

**Expected outcome:** Per-sender accuracy proxies tracked against their own rolling baseline, with an alert on a sustained shift. A correction-pattern signal on repeated same-field corrections. A documented new-sender onboarding path that touches no code, exercised by adding a fourth sender end to end. Ten labelled documents per sender feeding the gold set. An automatically generated monthly client report. A note in the runbook on when to advise the client out of this system entirely.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — replaying the changed-layout invoices raises a drift signal for that sender and not for the others; three identical corrections on one sender's field raise a signal before the accuracy proxy moves; adding a fourth sender through configuration alone produces correct extractions with no code change. |
| **L2 — Manual checks** | (a) Generate the monthly report for Coastline and read it as the client. Every number must be one they asked for; anything else is you talking to yourself. <br>(b) Take the drift alert and write the email you would send. If you cannot say what changed and what you propose to do, the signal is not actionable yet. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, a layout change is caught by you rather than reported by the client, and a new supplier is an afternoon |

> **What you have at the end.** A running system, an accuracy report a stranger can check against labels they can read, a cost per document with the arithmetic, and a monthly report that explains itself. That set is unusual. Most people who have built extraction have a repository and a story.
