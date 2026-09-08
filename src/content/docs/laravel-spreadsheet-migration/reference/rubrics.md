---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"every headline figure equals the figure in the sheet exactly"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still wrong: the schema derived from column headings instead of from the data, the automatic merge that turns out to be a father and a son.

**Why this exists.** This material has an unusually honest oracle — the client's own spreadsheet — and the rubric is what keeps you using it instead of your own judgement.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never the whole file. The full file leaks later steps and dilutes the reviewer's attention.

---

## Step 0 — Harness and tooling bootstrap

**ACC-00** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a Larastan violation, a failing test.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed permanently, and then the gate exists only in theory. |
| AP-00-b | **Multiple verification commands.** If you must remember four commands, some will be skipped. One entry point. |
| AP-00-c | **Generic `AGENTS.md`.** Restating public Laravel documentation adds nothing. The value is entirely in what is specific to this project and this client. |

---

## Step 1 — The admin panel you did not write

**ACC-01** — a feature test asserts the panel requires authentication, that an authenticated user reaches it, and that the application boots with no resources registered.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Hand-building CRUD on this project.** It consumes half the roadmap re-teaching what another material covers, and on a real fixed-price job of this shape it is how you lose money. |
| AP-01-b | **An unpinned panel version.** A panel builder is a dependency with opinions; an unpinned major upgrade mid-project is a week you did not quote for. |
| AP-01-c | **Trusting the panel's default exposure.** It will show every column of every model to every authenticated user until step 9 says otherwise. Note it now; do not discover it in production. |

---

## Step 2 — Discovery

**ACC-02** — the profiler run against the Willow Lane fixture reports the correct fill rate and distinct count for every column, identifies both date formats, flags the currency-symbol prices as a format variant, and flags the total row as not a data row.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Writing a migration in this step.** The schema then comes from the column headings, which record what the client meant to capture rather than what they captured. |
| AP-02-b | **Reading the sheet instead of profiling it.** Your eye sees the first fifty rows. The problems are at row 3,400. |
| AP-02-c | **Clean fixtures.** A tidy fixture makes every later step pass for the wrong reason and teaches you nothing about real data. |
| AP-02-d | **Findings kept in your head.** The document is what you show the client, and their reaction to it is the most useful information in the whole discovery phase. |

---

## Step 3 — Rule extraction

**ACC-03** — every extracted Portside rule, evaluated against 50 real fixture rows, reproduces the sheet's own computed price for at least 48; every row it fails is listed in the exceptions document.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **A rule with no named source.** If you cannot say which formula or which conversation it came from, it is a guess wearing a rule's clothes. |
| AP-03-b | **Asking "what are your pricing rules?"** Nobody can answer that. Walk through five real rows and ask why each one is the number it is. |
| AP-03-c | **Silently correcting an exception.** The row that has been wrong for two years must survive the migration and be visible. Fixing it quietly means the client's totals change and you cannot explain why. |
| AP-03-d | **Storing a derived value.** A column computed by a formula becomes a column that drifts. Deciding derived-vs-stored is most of what this step is for. |

---

## Step 4 — Deriving the schema

**ACC-04** — every rule marked enforceable in step 3 has a corresponding constraint, proven by a test that attempts the violation and asserts the database rejects it; every unenforceable rule has a written reason.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **A table per sheet.** Six per-tutor sheets are one table with a foreign key. Mirroring the spreadsheet's shape imports its problems along with its data. |
| AP-04-b | **Enforcing a rule the existing data violates, without a plan.** The import then fails on real data and the migration stalls. Decide per rule: enforce and quarantine, or admit and warn. |
| AP-04-c | **No source provenance.** Without the sheet, row number and import run on every record, step 7 cannot reconcile and step 12 cannot explain a difference. |
| AP-04-d | **Money as a float, or a `date` where the sheet meant a moment.** The spreadsheet does not distinguish these; your schema must, and getting it wrong is discovered during reconciliation. |

---

## Step 5 — Entity resolution

**ACC-05** — over the Cavendish fixture with a hand-labelled answer key, resolution produces zero false merges above the high threshold; every known duplicate is merged or proposed; an unmerge restores both records and their transactions exactly.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Two bands instead of three.** Without a middle band that asks a human, you either merge things you should not or find nothing. The interesting cases are exactly the ambiguous ones. |
| AP-05-b | **An irreversible merge.** Aliases discarded after merging leaves no way to undo and no record of why two rows became one. |
| AP-05-c | **Name similarity as the only signal.** A shared phone number or email is worth more than a hundred fuzzy name matches, and real sheets usually have one. |
| AP-05-d | **Comparing every row with every other row.** Quadratic, slow, and unnecessary — block on something cheap first. |

---

## Step 6 — The import pipeline

**ACC-06** — importing the Willow Lane fixture applies every valid row, quarantines exactly the known-bad rows, ignores the total row, and produces identical state on a second run; a dry run changes nothing and predicts the real run's counts.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **Silent coercion.** `"1.250"` is 1250 or 1.25 depending on locale. Guessing makes a client's stock value wrong by a factor of a thousand, with no error anywhere. |
| AP-06-b | **One transaction for the whole file.** One bad row discards thousands of good ones and holds a lock for minutes. |
| AP-06-c | **No dry run.** The import becomes a scary irreversible event instead of a report the client reads and approves. |
| AP-06-d | **Loading the sheet into memory.** Fine on the 200-row sample, fatal on the real file, and the failure looks unrelated. |

---

## Step 7 — Reconciliation

**ACC-07** — for all three fixtures, every headline figure derived from the database equals the sheet's figure exactly; a one-unit error in any imported record makes reconciliation fail and names the record.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Reconciling totals only.** Two errors cancelling out is worse than one error, because the total matches and the mistake hides. |
| AP-07-b | **A tolerance on money.** Rounding is a design decision from step 4, not an allowance you grant yourself when the numbers refuse to match. |
| AP-07-c | **Assuming any difference is your bug.** Sometimes their formula is wrong. Finding it is valuable — and how you tell them decides whether the project survives. |
| AP-07-d | **A one-off reconciliation.** It must be a command that runs in CI forever, or it stops being true the week after you write it. |

---

## Step 8 — The daily workflow

**ACC-08** — a feature test performs the business's most common daily task end to end and asserts the resulting records match what the equivalent spreadsheet row would have contained.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **More keystrokes than the spreadsheet.** People go back to the sheet, and the migration fails for a reason that has nothing to do with your code. |
| AP-08-b | **One screen per table and nothing else.** The client's day usually touches three tables at once; that screen is the one the panel builder will not give you. |
| AP-08-c | **Building every field.** Profiling already showed you the columns that are 4% filled. Shipping them as required fields is how a form becomes hated. |

---

## Step 9 — Roles and permissions

**ACC-09** — a table-driven test over (role × resource × action) asserts allowed and forbidden for every combination including a user with no role; a forbidden action changes nothing; a restricted field is absent from the response rather than hidden in the interface.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **A field hidden only in the interface.** It is still in the response, still in the export, and still in the API. That is a leak, not a permission. |
| AP-09-b | **Roles copied from a library's example.** Owner, manager and staff must come from asking who is allowed to do what in this business. |
| AP-09-c | **Only positive tests.** Authorisation bugs are silent; the forbidden cases are the ones worth asserting. |
| AP-09-d | **Trusting the panel's defaults.** It exposes everything until told otherwise, and "I assumed it was safe" is not a sentence you want to say to a client about payroll. |

---

## Step 10 — The audit trail

**ACC-10** — a monetary field changed through the interface, through a console command, and through an import each produces a history entry with the correct actor, old value and new value; a soft-deleted record restores with its history intact.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Auditing at the controller.** A change made by a job, a command or an import then leaves no trace, and those are exactly the changes nobody can explain later. |
| AP-10-b | **Recording everything.** Every read and every unchanged field produces a log larger than the data and useless to search. |
| AP-10-c | **History on a separate screen nobody opens.** The question is asked while looking at the record, so the answer belongs there. |

---

## Step 11 — The report that must match

**ACC-11** — for every period in the fixture data, the report's figure equals the spreadsheet's figure exactly, or the difference appears in the documented explained-differences list with a named cause.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Choosing the figure that is easy to compute.** It must be the number they already look at, or matching it proves nothing to them. |
| AP-11-b | **Guessing the period boundary.** Last day, last working day, or when they got round to it — this is where most differences hide, and it is one question. |
| AP-11-c | **A total with no drill-down.** A number a client cannot check is a number a client will not trust, and they will keep the spreadsheet to check it. |

---

## Step 12 — Parallel run and dual entry

**ACC-12** — over a simulated ten-day parallel run the daily comparison detects every planted difference, classifies one-sided entries correctly rather than as errors, and the switch criterion stays false until the planted errors are resolved.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **No agreed switch criterion.** Without a written rule for what "good enough" means, the parallel run lasts until somebody loses patience, and dual entry is expensive every day of it. |
| AP-12-b | **A manual daily comparison.** It gets skipped by day four, and the skipped days are where the evidence you needed was. |
| AP-12-c | **Treating every difference as your bug.** Some are their data entry, and some mean a rule from step 3 is wrong — which is the most valuable finding of the period. |
| AP-12-d | **Reporting one-sided new work as an error.** Work entered in the new system and not the sheet is expected; flagging it buries the real differences in noise. |

---

## Step 13 — Freeze, switch, rollback

**ACC-13** — the full cutover sequence runs end to end against fixture data — freeze, final import, reconcile, unlock — and aborts at the gate when reconciliation reports any difference.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **A rollback that does not return new work to the spreadsheet.** This is the part everyone omits and the reason rollbacks fail when they are needed. |
| AP-13-b | **Reconciliation as a formality rather than a gate.** If the sequence can continue past a difference, the difference goes to production. |
| AP-13-c | **A date chosen for the proposal.** Never the day before month end, never their busiest week, never a Friday. |
| AP-13-d | **No rollback expiry.** After a week of real use, going back means losing a week. The plan must say when forward-fix becomes the only option. |

---

## Step 14 — Training, shadow usage, export-back

**ACC-14** — the export produces a spreadsheet that re-imports through the step 6 pipeline with zero differences; a user only exports rows their role permits.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **No export back to their original format.** Every client asks. Without it, the answer to "what if I want to leave?" is a silence they remember. |
| AP-14-b | **Treating shadow usage as disobedience.** Somebody keeping the old sheet updated is telling you about a missing feature, usually a specific and small one. |
| AP-14-c | **A manual instead of one page per role.** Nobody reads a manual, and the audience for this one has never read documentation in their life. |

---

## Step 15 — Deploy, backups, handover

**ACC-15** — restoring the most recent backup into a clean database and running the reconciliation suite passes; a deploy performed while a user is mid-entry does not lose their work.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **An untested backup.** It is a belief, not a backup, and the spreadsheet is no longer the second copy. |
| AP-15-b | **Deleting the source spreadsheets.** They are the provenance for every imported record and the only way to answer a migration question in two years. Archive them read-only, forever. |
| AP-15-c | **Infrastructure in your name.** A domain, a host, or a mail service on your card is a dependency you sold the client by accident and cannot cancel without breaking their business. |
| AP-15-d | **A runbook of commands with no diagnosis.** The person supporting this needs to know what the symptom means before they need a command to run. |
