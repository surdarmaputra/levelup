---
title: Foundations
description: Steps 0–3. Tooling, harness, the admin panel you did not write, discovery, and rule extraction.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. It is also the cheapest moment to add static analysis: Larastan level 8 on an empty project is free.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is what matters most.
- Why formatting is settled by a tool, not by a review comment
- **Static analysis on a dynamic framework**: what Larastan knows about Eloquent, and why level 8 on day one is easier than level 8 later
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed with `--no-verify`, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — and in this material they carry unusual weight, because most of your decisions are about somebody else's business and you will be asked to justify them months later
- Docker Compose as the definition of "the environment", so the machine is not part of the bug report

**Libraries:** Laravel 13 skeleton, Pest 4, Laravel Pint, Larastan, Rector, Lefthook, Docker + Compose (PostgreSQL 17, Redis, Mailpit)

**Expected outcome:**
- A Laravel 13 project on PHP 8.5 with `declare(strict_types=1)` enforced
- Pint, Larastan (level 8), Rector and Pest wired in
- A `Makefile` exposing `make verify`, `make fmt`, `make up`, `make test`
- `lefthook.yml` — format and the fast checks on commit
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml`, `.gitignore`, `.editorconfig`, a CI workflow running `make verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when a misformatted file, a Larastan violation, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) Ask your agent "what does this project use for static analysis and how do I run everything?" It must answer from `AGENTS.md` alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and the v2–v4 evolution checkpoints.

---

## Step 1 — The admin panel you did not write

**Story:** *As a developer, I have a working admin panel over an empty database in an afternoon, so that the rest of the project can be spent on the part nobody else can do.*

**Mode:** `BUILD` — install and configure. The decision to use it is the part you must be able to defend.

**Why now:** First, deliberately. Seeing how little of this project is CRUD is the fastest way to understand where the value actually is.

**Concepts:**
- **Buy the screens, build the understanding.** Filament gives you resources, forms, tables, filters and actions. None of that is what a client is paying you for on this job.
- What a panel builder actually generates, and where its abstractions leak — custom actions, non-CRUD pages, and the moment a form needs a rule the builder has no opinion about
- **When this is the wrong choice**: a customer-facing interface, a workflow that is not row-shaped, or a project where the screens themselves are the product. Write down which of those apply here — none should.
- Authorisation as the panel's boundary: it will happily expose every column of every model, which is a step 9 problem you must not forget exists
- Pinning the version and recording the decision, because a panel builder is a dependency with opinions and upgrading it is a project
- Theming enough that the client recognises their own business, and no further

**Libraries:** Filament — pin a version and record it in an ADR

**Expected outcome:** A running admin panel on an empty database, behind authentication, with the business's name on it and no resources yet. An ADR recording the choice, the version, what it buys, and the two conditions under which you would tear it out. The application namespace laid out as an empty structure, filled in over the rest of the roadmap:

```text
app/
├── Discovery/      column profiling, formula extraction, findings
├── Importing/      readers, mapping, quarantine, runs
├── Resolution/     candidate matching, merge, aliases
├── Reconciling/    comparisons against the source sheet
├── Domain/         parties, items, transactions, rules
└── Support/        clock, money, shared value objects
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a feature test asserts the panel requires authentication, that an authenticated user reaches it, and that the application boots with no resources registered. |
| **L2 — Manual checks** | (a) Time how long this step took. Compare it with the estimate you would have given for hand-building the same thing. That difference is the argument. <br>(b) Write down, in one sentence, what you would do if the client later demands a customer-facing portal. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can defend the choice of a panel builder in two sentences |

---

## Step 2 — Discovery: read the data before you design anything

**Story:** *As a developer, I know what is actually in the client's spreadsheet — every column, every format, every exception — before I write a single migration.*

**Mode:** `LEARN` — write the acceptance test first. Do not let an agent design a schema in this step, and do not design one yourself.

**Why now:** Before the schema, obviously, and yet this is the step almost everyone skips. A schema designed from the column headings is a schema designed from what the client meant to record, not what they recorded.

**Concepts:**
- **You are forbidden from writing a migration in this step.** The discipline is the lesson. Every hour here saves a day of rework in step 6.
- **Column profiling**: for every column — how many rows are filled, how many distinct values, the shortest and longest value, the top ten values by frequency, and every distinct format found
- What profiling reveals that reading does not: the column that is 94% numbers and 6% notes, the date column with three formats, the "status" column with eleven values where the owner believes there are four
- **The column that means two things.** A field whose meaning depends on another field is the most common hidden rule in a spreadsheet, and it is invisible until you cross-tabulate.
- Rows that are not rows: total rows, blank separator rows, headers repeated mid-sheet, a note somebody typed in column H
- **Cardinality tells you the model.** A column with four distinct values across 4,000 rows is an enum. A column that is unique per row is an identifier. A column with 300 values and a long tail of near-duplicates is an entity waiting for step 5.
- Writing the findings down as a document you show the client. Their reaction to it is data.
- Building the three fixture spreadsheets, and choosing the mess deliberately

**Libraries:** a spreadsheet reader, and a profiling command you write yourself — this is 200 lines and writing it is the point

**Expected outcome:** Three fixture spreadsheets built to match the [overview](../overview/#the-three-example-businesses), including their specific pathologies. A `profile` artisan command producing, per sheet and per column: fill rate, distinct count, inferred types with counts per type, top values, and detected format variants. A written findings document per business listing every anomaly and every question you would ask the owner. No migrations. No models.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — the profiler run against the Willow Lane fixture reports the correct fill rate and distinct count for every column, identifies both date formats, flags the currency-symbol prices as a format variant, and flags the total row as not a data row. |
| **L2 — Manual checks** | (a) Read your own findings document. For every anomaly, write the question you would ask the owner. If you have fewer than ten questions for Portside, you have not looked hard enough. <br>(b) Cross-tabulate two columns you suspect are related. At least one of the three fixtures should surprise you — if none does, your fixtures are too clean. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, three findings documents exist, and there is still no schema |

---

## Step 3 — Rule extraction: the model is in the formulas

**Story:** *As Portside Freight, the pricing rules I have never written down are on a page I can read, correct, and sign off, so that the system charges what I actually charge.*

**Mode:** `LEARN` — this is interviewing and reading, and an agent that guesses a plausible rule here is actively harmful.

**Why now:** After profiling and before the schema. The rules decide which columns are derived and must not be stored, and getting that backwards is a schema you rewrite in step 6.

**Concepts:**
- **A nested `IF` is a decision table somebody wrote by accident.** Flatten it: conditions down the side, outcome per row, and the cases that are unreachable.
- Formulas that reveal structure: a `VLOOKUP` is a foreign key, an absolute reference is a constant that should be configuration, and a hardcoded number inside a formula is a business rule nobody remembers agreeing to
- **Derived vs. stored.** A column computed by a formula must not become a stored column, or it will drift. Finding these is most of what this step is for.
- **The rules that are not in the file.** "We don't charge that customer for waiting time" appears nowhere and is applied every week. You get it by asking, and by asking about specific rows rather than in general.
- **Interviewing technique that works on people who do not think in rules**: walk through five real recent rows and ask "why is this one 480 and that one 520?" Never ask "what are your pricing rules?" — nobody can answer that.
- Exceptions that are real: the customer with a legacy rate, the row that is wrong and has been wrong for two years. Both must survive the migration, and the second one must be visible rather than silently corrected.
- Writing the rules as a document the owner signs off. Their corrections are the most valuable output of the whole step.

**Libraries:** none. A spreadsheet reader that exposes formulas rather than values, and a text editor.

**Expected outcome:** A rules document per business: every extracted rule as a decision table, its source (formula reference, or the person who told you), whether it is derived or stored, and a confidence marker. A list of exceptions with a decision for each — model it, configure it, or keep it as an exception. At least three rules that came from a conversation and appear nowhere in the file. Sign-off recorded.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — a test evaluates every extracted Portside rule against 50 real rows from the fixture and reproduces the sheet's own computed price for at least 48 of them; every row it fails to reproduce is listed in the exceptions document. |
| **L2 — Manual checks** | (a) Read your rules back to someone playing the owner, one at a time. Any rule you cannot say in one plain sentence is a rule you have not understood. <br>(b) Find one derived column you were about to store, and one stored column you were about to derive. Both mistakes are normal at this stage; catching them here is the point. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and every rule in your document has a source you can name |

**Harness impact:** `AGENTS.md` v2 — record that discovery precedes schema, that derived columns are never stored, and that a rule without a named source is not a rule.
