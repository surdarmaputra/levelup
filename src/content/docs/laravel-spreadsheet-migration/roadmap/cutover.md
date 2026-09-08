---
title: Cutover
description: Steps 12–15. Parallel run and dual entry, freeze and switch, training and export-back, deploy and handover.
sidebar:
  order: 5
---

## Step 12 — Parallel run and dual entry

**Story:** *As the owner, for two weeks both systems run side by side and the numbers are compared every morning, so that by the time we switch I already know it works.*

**Mode:** `LEARN` — write the acceptance test first. This is the step that decides whether the migration lands.

**Why now:** After the application is complete and the headline report matches. Parallel running an incomplete system produces differences you cannot interpret.

**Concepts:**
- **Nobody switches on trust.** They switch on two weeks of the numbers agreeing. The parallel run is not caution; it is how the decision gets made.
- **Dual entry is expensive and temporary.** Staff record everything twice, they resent it, and the period must therefore be as short as the evidence allows — usually one to three weeks, agreed in advance with an end date.
- The daily comparison: re-import the sheet each morning, run reconciliation from step 7, and produce one page showing what differs. Somebody reads it every day; that is the job during this period.
- **Every difference has one of three causes**: your bug, their data entry error, or a rule you got wrong. Classifying them correctly is the skill, and the third kind is the one that matters — it means going back to step 3 with a specific question.
- The difference rate is your switch criterion. Agree it up front: *"we switch when we get three consecutive days with zero unexplained differences."* Writing that sentence before the parallel run starts is what stops the period lasting three months.
- Automating the daily comparison so it costs minutes, not hours — a manual comparison gets skipped by day four
- **Detecting drift in the other direction**: work entered in your system and not in theirs is not an error, and your comparison must not report it as one

**Libraries:** the reconciliation command from step 7, the scheduler

**Expected outcome:** A scheduled daily comparison importing the current sheet, reconciling it against the application, and producing a dated difference report with each difference classified. A written switch criterion agreed before the run begins. A log of every difference and its cause. Simulated over the fixture data as a multi-day sequence, including a day with a deliberate rule error.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — over a simulated ten-day parallel run, the daily comparison detects every planted difference, classifies one-sided entries correctly rather than as errors, and the switch criterion evaluates to false until the planted errors are resolved. |
| **L2 — Manual checks** | (a) Read a day's difference report as the owner. If it does not say what you want them to do about each line, rewrite it. <br>(b) Time the daily comparison. Anything over ten minutes of human attention will be abandoned before the end of the second week. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and the switch criterion is written down and agreed |

---

## Step 13 — Freeze, switch, and the way back

**Story:** *As the owner, we switched over on a Monday morning, and if it had gone wrong we could have been back on the spreadsheet by lunchtime.*

**Mode:** `LEARN` — the plan is the deliverable, and a plan with no rollback is not a plan.

**Why now:** After the parallel run has met its criterion. Not before, and not on a date chosen because it was in a proposal.

**Concepts:**
- **The freeze window**: a defined period where the old system is read-only, the final import runs, and nothing is entered anywhere. Usually an evening or a weekend, sized by how long the final import takes plus a margin you have measured.
- Sequencing the final cutover: freeze, final export, final import, reconcile, verify the headline figure, then unlock the new system. Reconciliation is a gate in this sequence, not a formality.
- **The rollback plan**, written before the switch and containing: the trigger conditions, who decides, the steps, and how work entered in the new system since the switch gets back into the spreadsheet. That last part is the one people forget and it is why rollback usually fails.
- Rollback has an expiry. After a week of real use, going back means losing a week, so the plan should say when rollback stops being the answer and forward-fix becomes the only option.
- **Choosing the date with the business, not for it.** Never the day before a month end, never during their busiest week, never a Friday.
- What "done" looks like on the day: a named person confirming the headline figure matches before anyone starts working
- Communicating the switch to staff in advance: what changes, what to do if something looks wrong, and who to call

**Libraries:** your import and reconciliation commands; a checklist

**Expected outcome:** A written cutover runbook: the sequence with timings, the go/no-go gate at reconciliation, the rollback plan including how new work returns to the sheet, the rollback expiry, and the named decision-maker. A rehearsal of the whole sequence against fixture data, timed. A staff communication written and ready.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — the full cutover sequence runs end to end against fixture data: freeze, final import, reconcile, unlock — and the sequence aborts at the gate when reconciliation reports any difference. |
| **L2 — Manual checks** | (a) Rehearse the rollback, including exporting work entered after the switch back into the spreadsheet format. Until you have done it once, you do not have a rollback. <br>(b) Give the runbook to someone else and have them read it aloud. Every place they hesitate is an ambiguous instruction. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and the rollback has been rehearsed rather than described |

---

## Step 14 — Training, shadow usage, and the export they were promised

**Story:** *As a member of staff, I know how to do my job in the new system, and I can still get my data out as a spreadsheet whenever I want, so I am not afraid of this.*

**Mode:** `BUILD` — the export and the material. The observation is the part that teaches you something.

**Why now:** After the switch, when what people actually struggle with is visible rather than guessed at.

**Concepts:**
- **Shadow usage**: somebody still has the old sheet open and is quietly keeping it up to date. It is not disobedience — it is insurance, and it means they do not yet trust something. Find out what, because it is usually one specific missing feature.
- Detecting it rather than asking: a sheet whose modified date keeps moving after the freeze, a member of staff whose entry count is far below their colleagues'
- **The export-back guarantee.** Every client of this kind asks "what if I want to leave?", and a working export to the format they came from is the answer. Build it, show it in week one, and never make them ask.
- The export is also how they do the thing your app does not do. Somebody will always want to pivot something, and refusing that is how shadow spreadsheets are born.
- **Training that works for this audience**: one page per role, screenshots of their own data, and a short recording. Not a manual. Nobody reads a manual.
- The questions that come in the first fortnight are the specification for your next two weeks of work, and they are usually small
- Handling the person who does not want the change: they are often the person who understood the old system best, and their objections are usually specific and correct

**Libraries:** a spreadsheet writer; a screen recorder

**Expected outcome:** An export producing a spreadsheet in the shape the client came from, available to every role for the data they may see. A shadow-usage check reporting per-user activity. One page of role-specific guidance per role, using the client's real data, plus a short recording. A log of first-fortnight questions with what each one became.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — the export produces a spreadsheet that re-imports through step 6's pipeline with zero differences; a user only exports rows their role permits. |
| **L2 — Manual checks** | (a) Give the guidance page to someone who has not seen the system and ask them to complete one task. <br>(b) Look at per-user activity a week after switching. Anyone well below their colleagues is either struggling or still using the sheet, and both need a conversation rather than a feature. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and export-and-reimport is lossless |

---

## Step 15 — Deploy, backups, handover

**Story:** *As the owner, this runs without me thinking about it, somebody other than the person who built it could support it, and everything it needs is in my name.*

**Mode:** `BUILD` for the deploy, `LEARN` for the handover — the handover is the deliverable.

**Why now:** Last. A runbook written before real use is fiction, and backups matter most once the spreadsheet is no longer the copy.

**Concepts:**
- **The spreadsheet used to be the backup.** After cutover it is not, and the client usually has not noticed. Daily backups, offsite, and one restore performed and timed before you say the project is finished.
- An untested backup is a rumour. Restore it into a clean database and run the reconciliation suite against it.
- Deploying safely: migrations before the new version serves, a maintenance page for anything that cannot be online, and a rollback that does not lose a day's entry
- Monitoring that suits this system: is it up, are the daily jobs running, did the backup succeed, is the error rate normal. Four things, routed to an address the client controls.
- **The runbook**: one page per thing that can go wrong — a failed import, a failed backup, a report that looks wrong, someone locked out — with what to check and when to escalate
- **Handover**: repository in the client's organisation, hosting and domain on their billing, credentials moved through a vault whose ownership transfers, admin accounts for named people, alerts to their inbox
- Keeping the original spreadsheets forever, read-only. They are the provenance for every imported record and the only way to answer a question about the migration in two years.
- The support arrangement offered on handover day rather than months later, priced from what the first fortnight actually cost you

**Libraries:** Docker Compose, nginx, a process supervisor, your backup tooling

**Expected outcome:** A deploy that runs migrations safely and can roll back. Daily offsite backups with a tested, timed restore. Four monitored signals routed to the client. A `docs/RUNBOOK.md` covering the failure modes this system actually has. A handover checklist covering repository, hosting, domain, credentials, admin accounts and alert routing. The source spreadsheets archived read-only with their import runs.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — restoring the most recent backup into a clean database and running the reconciliation suite passes; a deploy performed while a user is mid-entry does not lose their work. |
| **L2 — Manual checks** | (a) Hand the runbook to somebody who has never seen the project, trigger a failed import, and watch them work through it. <br>(b) Go through the handover checklist and, for each item, confirm it is in the client's name and not yours. Anything still on your account is a dependency you have sold them by accident. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, the restore has been performed, and somebody who is not you could support this tomorrow |
