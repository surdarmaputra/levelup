---
title: Operations
description: Step 15. Deploy and handover, the monthly report, and absorbing the requirement that changed.
sidebar:
  order: 7
---

## Step 15 — Deploy, handover, and the requirement that changed

**Story:** *As Brightline Recruiting, my new criterion is live within the week, applied to applications already scored, and nothing that already worked broke.*

**Mode:** `BUILD` for the deployment, `LEARN` for the change. The change is the harder half and it is the point of the step.

**Why now:** Last. It needs everything: the ledger for replay, sign-off for the re-decisions, the golden set to prove nothing regressed, and the cost report to price the change honestly.

**Concepts:**

**Deploy and handover.**
- **What has to run**: n8n, PostgreSQL, the client simulator's real equivalents (the client's own systems), your service, and a reverse proxy. One Compose file, one small host.
- **n8n's encryption key is the whole game in a restore.** Lose it and every stored credential is gone. Back it up separately from the database, document where it lives, and rehearse the restore.
- **Workflows come from git, not from the running container.** Deploy imports them. A workflow edited in the production editor and not exported is the standard way three months of work disappears.
- **Credentials scoped to what the workflow does**, rotatable, never in a workflow node's plain fields where an export would carry them.
- **Backups restored, not assumed.** Restore into a scratch stack and run the golden set against it.
- **The runbook**: a failed overnight run, a stuck sign-off queue, a cost spike, a client system that changed shape, a golden-set alert with no change from you. Five pages.
- **Handover is part of the job.** The client owns their workflows, their ledger and their data. Exports must exist and be readable. A system only you can operate is worth less to them, and in the end to you.

**The requirement that changed.** The simulator delivered Brightline's change request at step 12:
a new screening criterion, and they want it applied to applications already scored.

This is the actual job, and it is where the previous fourteen steps get their return:

- **Read what they asked for and find what they meant.** "Apply it to the ones already scored" could mean re-score everything, score only the ones not yet decided, or flag which previous decisions might have gone differently. These are three different pieces of work with three different prices and one of them is not acceptable at all — re-deciding an application a person already signed off is not yours to do.
- **Versioning is the answer to almost all of it.** A new criterion is a new prompt version and a new workflow version. Old runs keep their version; new runs get the new one. Runs become comparable rather than confusing, and "what changed and when" is answerable.
- **The golden set must be extended before the change ships**, not after. New criterion, new items, hand-labelled. Shipping first and measuring later is how a retainer loses a client's trust in one release.
- **Backfill is a workflow, not a script.** Same ledger, same idempotency, same sign-off. A one-off script that re-scores four hundred applications outside the system leaves no audit trail, which at Brightline is the one thing that must exist.
- **Price it.** Is this a change inside the retainer or a new piece of work? Step 3 defined the boundary. This is where you find out whether that definition was any good, and if it was not, fix it in the next proposal rather than absorbing the cost silently.
- **Say what it will cost in model spend too.** Re-scoring four hundred applications is a real number, and it belongs in the batch path from step 14.

**The monthly report.** Runs, failures, items sent to a person, hours saved against step 0, cost,
golden-set status, and anything that changed. One page, generated, sent whether or not anything
happened. This is what a retainer is, expressed as a document.

**When to advise them out of it.** If Brightline's applicant tracking system ships screening that
does this properly, say so. You will keep the other two clients and the reputation.

**Libraries:** Docker Compose, your CI, your ledger

**Expected outcome:** A deployment on one small host with everything from git plus documented secrets. The n8n encryption key backed up separately, with a rehearsed restore. Backups restored and verified against the golden set. Workflow and prompt versioning, with old runs keeping their versions. The Brightline change delivered as a versioned change plus a backfill workflow that goes through sign-off, with the golden set extended first. `docs/RUNBOOK.md` with five scenarios. An automatically generated monthly report per client. A written note on the change: what they asked, what they meant, what you priced, and whether it fell inside the retainer.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — a full restore from backup plus the encryption key reproduces every workflow and credential, and passes the golden set; runs created before the change keep their prompt and workflow version; the backfill produces sign-off items rather than decisions, and cannot alter an application a person already signed off. |
| **L2 — Manual checks** | (a) Destroy the stack and rebuild from git, backups and your documented secrets, timing it. That number is your honest answer to "what happens if you get hit by a bus?" <br>(b) Write the email to Brightline explaining what you did with their change and what it cost. If you cannot justify the price from the ledger, the ledger is missing something. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d`, `AP-15-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, the change is live, nothing regressed, and the monthly report generates itself |

> **What you have at the end.** Three real processes running, a replay button that works, a sign-off queue people use, a confidentiality answer a solicitor accepts, a golden set that catches a model you do not control, and a dashboard with hours saved and cost per run. That is not a portfolio project. That is an engagement, and the difference is visible from across a room.
