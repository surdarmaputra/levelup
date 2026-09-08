---
title: Modelling
description: Steps 4–7. Deriving the schema, entity resolution, the import pipeline, reconciliation.
sidebar:
  order: 3
---

## Step 4 — Deriving the schema

**Story:** *As a developer, the database enforces the rules the spreadsheet could only hope for, so that the errors the old system allowed cannot happen again.*

**Mode:** `LEARN` — the schema is the accumulated result of steps 2 and 3, and generating it from the column headings throws both away.

**Why now:** Now, and not before. You have profiles, rules and a signed-off exceptions list. The schema is a consequence of those three, and building it earlier means building it from assumptions.

**Concepts:**
- **The spreadsheet's shape is not the model.** Six per-tutor sheets are one table with a foreign key. A "notes" column carrying structured data is two or three real columns plus a genuine notes field.
- Normalising to the point where the rules can be expressed, and no further — a back office for a nursery does not need fifth normal form
- **Constraints as encoded rules.** Not-null, unique, check constraints, foreign keys: every one is a rule the spreadsheet could not enforce and a class of error the client has been living with.
- **The rule you cannot yet enforce.** Some of the existing data violates the rules the owner just signed off. You must decide, per rule, whether to enforce it and quarantine the offending rows, or record it as a warning and let it in. This decision is the whole difference between a migration that lands and one that stalls.
- Money as integer minor units with a currency; dates as `date` where the sheet meant a day and `timestamptz` where it meant a moment. The spreadsheet does not distinguish; you must.
- Keeping the source: every imported row records which sheet, which row number, and which import run it came from. Without that, step 7 cannot reconcile and step 12 cannot explain a difference.
- Soft deletion, because the client will delete something they need on day three

**Libraries:** Eloquent, migrations, Pest

**Expected outcome:** Migrations, models and factories for the derived model — parties, aliases, items, transactions and lines, rules, import runs and rows — all business-scoped. Constraints for every rule marked enforceable in step 3, and a written list of the rules deliberately left unenforced with the reason. Source provenance on every imported record.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — every rule marked enforceable in the step 3 document has a corresponding constraint, proven by a test that attempts the violation and asserts the database rejects it; every rule marked unenforceable has a written reason in the ADR. |
| **L2 — Manual checks** | (a) Read the schema in `psql` with `\d+`. For every column, name which sheet column it came from or which rule required it. A column that answers neither should not exist. <br>(b) Take the ten weirdest rows from your fixtures and check that each one can be represented. The exceptions from step 3 must fit without a special case. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and every column traces to a profile finding or a signed-off rule |

---

## Step 5 — Entity resolution

**Story:** *As Cavendish Tutors, the six copies of my customer list become one, "S. Whitfield" and "Sarah Whitfield" are recognised as the same person, and the one time you get it wrong I can undo it.*

**Mode:** `LEARN` — write the acceptance test first. An automatic merge that is wrong destroys client trust faster than any bug in this material.

**Why now:** Before import, because import must write against resolved entities. After the schema, because aliases need somewhere to live.

**Concepts:**
- **A wrong merge is worse than a duplicate.** A duplicate is visible and annoying; a wrong merge silently combines two people's history and is discovered months later by an accountant.
- Normalising before comparing: case, whitespace, punctuation, honorifics, company suffixes, and the fact that normalisation is itself a business decision
- **Similarity measures** and what each is good at — edit distance for typos, token-based comparison for reordered names, phonetic matching for names transcribed by ear. Combining them, and why a single score is a simplification you should make consciously.
- **Blocking**: comparing every row with every other row is quadratic and unnecessary. Group by something cheap first — a postcode, a phone number, a first letter — and compare within groups.
- **Three bands, not two.** Above the high threshold, merge automatically and record it. Below the low threshold, leave alone. In between — which is where the interesting cases live — propose it to a human and wait.
- The strongest signal is rarely the name. A phone number or an email is worth more than a hundred fuzzy name matches, and real spreadsheets usually have one somewhere.
- **Reversibility.** Every merge keeps both aliases, records who merged them and when, and can be undone without data loss. This is a product feature, not an internal nicety.
- Cases fuzzy matching gets wrong that a person catches instantly: a father and son at one address, two franchises of one chain, a company that changed name

**Libraries:** PostgreSQL trigram matching, plus comparison functions you write. Read one library's implementation, then write yours.

**Expected outcome:** A resolution pipeline: normalise, block, score, band. Automatic merge above the high threshold with an audit record; a review queue in the panel for the middle band; no action below the low band. Aliases retained. A reversible unmerge. The Cavendish fixture's six lists resolved, with the count of automatic merges, proposed merges and untouched records reported.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — over the Cavendish fixture with a hand-labelled answer key, resolution produces zero false merges above the high threshold; every known duplicate is either merged or proposed; an unmerge restores both records and their transactions exactly. |
| **L2 — Manual checks** | (a) Read every proposed merge in the middle band by hand and decide it. Note how many you get wrong on first reading — that number is why the middle band exists. <br>(b) Deliberately plant a father-and-son pair in a fixture and confirm the system proposes rather than merges. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, no merge happens without a record, and every merge can be undone |

**Harness impact:** `AGENTS.md` v3 — resolution rules: three bands, never merge below the threshold, every merge audited and reversible.

---

## Step 6 — The import pipeline

**Story:** *As Willow Lane Nursery, my four thousand rows are in the new system, the thirty rows that were wrong are on a screen for me to fix, and nothing was silently changed on the way in.*

**Mode:** `LEARN` — the failure handling is the step. The parsing is not.

**Why now:** Everything it depends on now exists: a schema that encodes the rules, and resolved entities to attach rows to.

**Concepts:**
- **Real exported data is wrong in specific, repeatable ways**: dates as text, numbers as text, numbers as text with a currency symbol, trailing spaces, merged cells producing blanks, a total row, repeated headers, and a column that is empty for the first 200 rows so its type looks like something it is not
- **Never silently coerce.** `"1,250"` becoming `1250` is probably right. `"1.250"` might be `1250` or `1.25` depending on locale, and guessing is how a client's stock value becomes wrong by a factor of a thousand.
- Per-row outcomes: applied, quarantined, skipped. A file is thousands of independent results, not one transaction.
- **Chunked transactions**, so a bad row does not discard 3,999 good ones and a lock is not held for minutes
- Idempotent import: running the same file twice produces the same state. Source provenance from step 4 is what makes this possible.
- **Dry run first.** Every import reports what it would do before it does it, and the client reads that report. This is what turns an import from a scary event into a conversation.
- Streaming a large sheet rather than loading it, and the memory failure that looks like an unrelated crash
- Mapping as configuration: which sheet column feeds which field, per business, editable without a deploy

**Libraries:** a streaming spreadsheet reader, Laravel job batches

**Expected outcome:** An import pipeline with a dry-run mode producing a per-row report, chunked application, quarantine for rows that fail validation, and provenance on every record. Column mapping held as configuration per business. All three fixtures importing, with Willow Lane's 30 currency-symbol rows correctly handled and its total row correctly ignored.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — importing the Willow Lane fixture applies every valid row, quarantines exactly the known-bad rows, ignores the total row, and produces identical state when run a second time; a dry run changes nothing and reports the same counts the real run then produces. |
| **L2 — Manual checks** | (a) Pick 30 imported rows at random and compare them against the sheet, field by field, by eye. This is tedious and it is the only way to find a silent coercion. <br>(b) Import a file with the columns in a different order and confirm the mapping handles it. Clients reorder columns. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and no value is transformed on import without a rule you can point at |

---

## Step 7 — Reconciliation: does your database agree with their sheet?

**Story:** *As Willow Lane Nursery, the total at the bottom of my spreadsheet and the total in your system are the same number, so I can believe the rest of it.*

**Mode:** `LEARN` — write the acceptance test first. This is the step that tells you whether steps 2 to 6 were right.

**Why now:** After import, because there is now something to compare. Before the application, because building screens over numbers you have not verified is building on sand.

**Concepts:**
- **This is the only objective test that you understood the business.** Every other check verifies that your code does what you told it to. This one verifies that what you told it matches reality.
- Choosing the figures that matter: the two or three numbers the owner already looks at every month. Not the ones that are easy to compute.
- **Reconcile the aggregate and the detail.** Matching totals with mismatched rows means two errors cancelling out, which is worse than one error, because it hides.
- The three outcomes: matches, differs by an amount, exists on one side only. Each has a different cause.
- **A difference is not always your bug.** Sometimes the sheet is wrong — a broken formula, a row excluded from a range, a hardcoded number somebody typed over a formula in 2023. Finding one of these is extremely valuable and must be reported carefully, because you are telling a client their books are wrong.
- Tolerance, and why for money it is usually zero: rounding differences are a design decision you should have made in step 4, not an allowance you grant yourself here.
- Reconciliation as a repeatable command, run again after every change, in CI, forever
- The reconciliation report as a client-facing artefact — this is the document that ends the "do I trust this?" conversation

**Libraries:** your own comparison; the fixtures from step 2

**Expected outcome:** A reconciliation command per business comparing the client's headline figures against the same figures derived from your database, reporting matched, differing and one-sided records with amounts. Zero tolerance on money. A readable report. The reconciliation suite added to `make verify` and to CI. At least one deliberate error planted in a fixture sheet so the report is exercised rather than always green.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — for all three fixtures, every headline figure derived from the database equals the figure in the sheet exactly; introducing a one-unit error into any imported record makes the reconciliation fail and names the record. |
| **L2 — Manual checks** | (a) Run reconciliation against a fixture where you planted a formula error in the sheet. Write the sentence you would say to the client. Rehearsing it matters more than it sounds. <br>(b) Break the aggregate and the detail in opposite directions so the totals still match. Confirm your report catches it. If it does not, you are only reconciling totals. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, reconciliation runs in CI, and you would show the report to the owner unedited |
