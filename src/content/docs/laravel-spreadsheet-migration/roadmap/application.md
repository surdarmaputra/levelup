---
title: The Application
description: Steps 8–11. The daily workflow, roles and permissions, the audit trail, the report that must match.
sidebar:
  order: 4
---

## Step 8 — The daily workflow

**Story:** *As the person who used to fill in the spreadsheet, doing my job in the new system takes fewer keystrokes than it used to, so that I stop opening the old one.*

**Mode:** `BUILD` — resources and forms. The workflow decisions are yours.

**Why now:** After the data is in and verified. Screens over unverified numbers teach the client to distrust the screens.

**Concepts:**
- **Adoption is a keystroke problem.** The spreadsheet had one screen, no navigation and no page loads. If your version takes more actions to record the same thing, people go back, and the migration fails for a reason that has nothing to do with code.
- Watching the real workflow before designing the form: what order do they type in, what do they type most often, what do they leave blank
- Defaults, last-used values, inline creation of a related record, and keyboard-first entry — the unglamorous features that decide whether this is used
- **The resource is not the workflow.** A panel builder gives you one screen per table; the client's day is usually one screen that touches three tables. Building that screen is where the panel builder stops helping and you start.
- Filters and saved views replacing the client's habit of sorting and filtering a sheet by hand
- Bulk actions, because they had a spreadsheet and they are used to editing forty rows at once
- What not to build: every field they never fill in, every screen they will never open. The sheet tells you which those are — profiling in step 2 already showed you the columns that are 4% filled.

**Libraries:** Filament resources, forms, tables and actions

**Expected outcome:** Resources for the core entities, plus at least one purpose-built screen matching the client's actual daily task rather than one table. Sensible defaults and inline creation. Saved filters replacing their common sheet views. Bulk edit for the operations they do in batches. Every field they never use, left out.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — a feature test performs the business's most common daily task end to end through the application and asserts the resulting records match what the equivalent spreadsheet row would have contained. |
| **L2 — Manual checks** | (a) Count the keystrokes and clicks for that task in your system and in the spreadsheet. If yours is higher, fix it before moving on. <br>(b) Ask someone who has never seen the app to record one transaction, and watch without helping. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and the daily task is faster than the spreadsheet was |

---

## Step 9 — Roles, permissions, and what people should not see

**Story:** *As the owner, my staff can do their jobs without seeing what everybody earns, which was impossible when it was all one shared sheet.*

**Mode:** `LEARN` — authorisation bugs are silent, and a panel builder will happily expose everything by default.

**Why now:** After the screens exist and before anybody real logs in. Retrofitting authorisation after a client's staff have accounts means a period where the wrong people saw the wrong data.

**Concepts:**
- **The old system had no permissions at all.** Everyone who had the file had everything. That is usually one of the top three reasons the client called you, and it is rarely on the written requirements.
- Roles that match how the business actually works — owner, manager, staff — derived from asking who is allowed to do what, not from a permissions library's examples
- **Policies as the unit of authorisation**, and the panel builder's defaults as the thing to override rather than trust
- **Row-level and field-level are different problems.** "Can Ani see this transaction?" and "can Ani see the cost price on a transaction she can see?" need different mechanisms, and the second one is the one people forget.
- Testing the negative cases: every role against every action, including the user with no role
- What an audit of your own permissions looks like: a table of role by resource by action that you can show the owner and they can correct
- Deleting is not a permission problem alone — see step 10

**Libraries:** framework policies; a permissions package only if roles turn out to be per-business configurable, decided at the end of the step

**Expected outcome:** A role model derived from a conversation with the owner rather than from a library example. Policies covering every resource, with the panel's defaults explicitly overridden. Field-level restriction on at least the money fields staff must not see. A role-by-action matrix in `docs/`, checked against tests, that you could show the owner.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a table-driven test over (role × resource × action) asserts allowed and forbidden for every combination including a user with no role; a forbidden action returns a denial and changes nothing; a restricted field is absent from the response rather than merely hidden in the interface. |
| **L2 — Manual checks** | (a) Log in as each role and try to reach a forbidden record by typing its URL directly. <br>(b) Read the role-by-action matrix as if you were the owner. Every row you cannot justify is one to ask about. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and no field is hidden only in the interface |

---

## Step 10 — The audit trail

**Story:** *As the owner, when a number is different from last week I can see who changed it, when, and what it was before — which the spreadsheet could never tell me.*

**Mode:** `LEARN` — deciding what to record and what to leave out is judgement, and recording everything is the same as recording nothing.

**Why now:** After permissions, because the audit trail records who did something and "who" only means anything once roles exist. Before cutover, because the parallel run in step 12 depends on being able to explain a difference.

**Concepts:**
- **"Who changed this?" is one of the top reasons a business outgrows a spreadsheet**, and it is almost never on the requirements list because they have stopped believing it is possible
- What to record: the model, the field, the old value, the new value, the actor, the time, and the reason where one is required
- **What not to record**, and why: every read, every unchanged field, whole payloads. An audit log nobody can search is a storage bill.
- Recording at the model layer rather than the controller, so a change made by a job, a command or an import is captured the same way
- **Deletion**: soft deletes so a mistake is recoverable, a real deletion path for the cases that legally require it, and the difference between the two documented
- Making history visible where the question is asked — on the record itself, not in a separate log screen nobody opens
- Retention: how long, and who is allowed to read it
- The import from step 6 is an actor too. A row changed by an import must be as explicable as one changed by a person.

**Libraries:** an auditing package or your own model observers — decide, and record why

**Expected outcome:** Field-level change history on the models that carry money or status, attributed to a user or to a named system actor. History visible on the record. Soft deletes with a restore action, and a documented hard-delete path. A written retention and access policy. Import runs appearing in history as an actor.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — changing a monetary field through the interface, through a console command, and through an import each produces a history entry with the correct actor, old value and new value; a soft-deleted record can be restored with its history intact. |
| **L2 — Manual checks** | (a) Change a number, then answer "who changed this and what was it before?" using only the interface. If it takes more than two clicks, it will not be used. <br>(b) Check the size of the audit table after importing all three fixtures. If it is larger than the data, you are recording too much. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and every change to money or status has an actor |

---

## Step 11 — The one report that must match

**Story:** *As the owner, the monthly figure I have looked at every month for six years is on my screen, and it is the same number, so I can stop opening the spreadsheet to check.*

**Mode:** `LEARN` — the correctness bar is absolute and the work is understanding, not SQL.

**Why now:** Last before cutover. This report is what the client uses to decide whether the new system is real, and the parallel run in step 12 compares it daily.

**Concepts:**
- **Every business has one number.** Monthly revenue, stock value, hours billed, tonnes shipped. Find it by asking what they check on the first of the month, then make that number exactly right before anything else.
- Reproducing a figure whose definition lives in a formula range — including the rows the range accidentally excludes
- **When your number is right and theirs is wrong.** It happens, it is valuable, and how you say it decides whether the project survives: show both calculations side by side, name the specific rows that differ, and let them conclude it.
- Period boundaries, which are where most differences hide: does their month end on the last day, the last working day, or when they got round to it?
- Presenting figures a non-developer can check: totals that add up on screen, drill-down to the rows behind a number, and an export they can open in the tool they trust
- Performance: the report runs over the whole dataset every time somebody opens it, so index for it deliberately
- **The report is a portfolio artefact.** A screenshot of your figure beside theirs, matching, is the most persuasive thing in a case study.

**Libraries:** Eloquent and raw SQL where it is clearer; the export from step 14

**Expected outcome:** The client's headline report, reproduced exactly, with drill-down to the underlying records and an export. Period-boundary rules written down and confirmed with the owner. Indexes chosen for this report's query. A side-by-side comparison against the sheet for every month in the fixture data, all matching or every difference explained in writing.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — for every period in the fixture data, the report's figure equals the spreadsheet's figure exactly, or the difference appears in the documented explained-differences list with a named cause. |
| **L2 — Manual checks** | (a) Drill from the headline figure to the rows behind it and add them up by hand for one period. <br>(b) Show the report beside the spreadsheet to someone playing the owner. If they cannot see in five seconds that the numbers match, the presentation is wrong. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and every unexplained difference is gone rather than tolerated |

**Harness impact:** `AGENTS.md` v4 — record the headline report definition, the period-boundary rules, and the rule that the reconciliation and report suites must stay green.
