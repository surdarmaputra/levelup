---
title: Getting Started
description: A guided path from "I can build a Laravel app" to moving a living business off its spreadsheets without stopping it for a day — discovery, messy import, entity resolution, reconciliation and cutover.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I can build a Laravel app"* to the job small businesses actually hire for —
built around one real domain: **Fieldbook**, the operations back office that replaces the
spreadsheet a business has run on for six years, on PHP 8.5 and Laravel 13.

Sixteen steps. There's no deadline on any of it — take a step in an evening or over two weeks.
The order matters, the pace doesn't.

## Who this is for

- You have built at least one Laravel application end to end
- Comfortable with SQL, a terminal, and git; Docker installed
- You have opened someone else's spreadsheet and felt the beginning of dread

**Not assumed:** spreadsheet parsing, entity resolution, data reconciliation, cutover planning,
or any experience of migrating a system that people are using while you migrate it.

If you are new to Laravel, work through
[Laravel — Multi-Tenant Booking SaaS](../laravel-booking-saas/) first. The stack is shared on
purpose, so nothing here is spent re-learning Eloquent.

## What you are building, concretely

A business runs on spreadsheets and a phone. It works. It has worked for six years. It is now
the constraint: two people cannot edit at once, nobody can tell who changed a number, and the
one person who understands the formulas is leaving.

Your job is **not** to build an app. Your job is to move a living business from one system to
another without it stopping for a day, and the app is the easy half. The hard half is that the
domain model is not written down anywhere — it is in the columns, in the formulas, and in
somebody's head, and you have to get it out.

Three businesses are used as the running examples all the way through the roadmap. They were
picked because they disagree with each other on exactly the points that are hard:

| The business | Its spreadsheet | What it forces you to handle |
|---|---|---|
| **Willow Lane Nursery** — a plant nursery | One sheet, about 4,000 stock rows, one person editing, reasonably tidy | The simple case, done properly. It really is a table. Import it, get the types right, and make the monthly stock report match the sheet to the last unit. If this goes wrong, nothing else matters. |
| **Cavendish Tutors** — a tutoring agency | Six sheets, one per tutor, plus a master joined with `VLOOKUP`. Two people edit at once and overwrite each other most weeks. | It is a relational model, badly denormalised, and the six copies of the customer list disagree. "Sarah Whitfield", "S. Whitfield" and "sarah w" are one person — or three — and deciding is a judgement you cannot fully automate. |
| **Portside Freight** — a small logistics firm | One sheet where the `notes` column carries real business logic and the pricing rules live inside nested formulas nobody has written down. One person knows why. | The model is not in the data. It is in the formulas and in Bu Ratna's head, and you get it out by reading `=IF(...)` and by interviewing someone who does not think of what she does as rules. Some rows are genuine exceptions and must stay exceptions. |

Same code, three businesses whose "spreadsheet" means three different things. That is the whole
exercise: one system, configured per business, and never a line of
`if ($business->slug === 'portside')`.

Three questions to keep asking as you build: where does this rule actually live? are these two
rows the same thing? and if we switch over on Monday, what happens to the work someone did on
Sunday?

Other businesses in this shape, if you want to point your own version at one: dental labs,
building contractors, catering companies, equipment hire, recruitment agencies, small
manufacturers, property managers, driving schools, import agents. All of them run on a
spreadsheet that has outgrown itself, all of them know it, and all of them are somebody's
paying customer today.

## Why a spreadsheet migration

Every other roadmap hands you a domain. This one hands you a mess and makes you find the domain
inside it, which is what the job is. The domain was chosen because the hard parts are
unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| The requirements are a spreadsheet, and nobody has written them down | Discovery: profiling columns, counting distinct values, and finding the column that means two things depending on another column |
| The business rules are inside formulas | Reading nested `IF`s as the decision table somebody wrote by accident, and checking it against what the owner says they do |
| The same customer appears three times, spelled three ways | Entity resolution, confidence thresholds, and a human in the loop — because a wrong merge is worse than a duplicate |
| Real exported data has dates as text, numbers as text, and a total row at the bottom | Import that survives reality, per-row quarantine, and a review path for the rows a person must fix |
| The client trusts the spreadsheet and not you | Reconciliation: their report, regenerated from your database, matching to the cent — which is also the only objective test that you understood the domain |
| People are using the old system while you build | Parallel running, dual entry, a freeze window, a rollback plan, and the person who still has the sheet open in a tab |
| They are afraid of being locked in | An export back to the format they came from, working, from the first week |

You cannot fake a reconciliation. Either the total your system produces equals the total at the
bottom of their sheet, or it does not, and the difference is the part of their business you
have misunderstood.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | PHP 8.5, Composer, strict types |
| Framework | Laravel 13 — container, jobs, policies, events |
| Persistence | Eloquent, migrations, PostgreSQL 17, constraints that encode real rules |
| Admin UI | Filament — resources, forms, tables, actions, and a deliberate decision not to hand-build CRUD |
| Discovery | Column profiling, type inference, cardinality, formula extraction, structured interviewing |
| Import | Spreadsheet parsing, streaming large sheets, per-row validation, quarantine and review |
| Data quality | Entity resolution, fuzzy matching, confidence thresholds, merge with an audit trail |
| Correctness | Reconciliation against the source spreadsheet, tolerance, and drift as a number |
| Access | Roles and policies, field-level visibility, and the things one employee must not see |
| History | Audit trail, "who changed this number", and soft deletion that survives a mistake |
| Cutover | Parallel run, dual entry, freeze window, switch, rollback, shadow-usage detection |
| Handover | Export back to spreadsheet, training material, runbook, credential transfer |
| Quality | Pest 4, Larastan, Laravel Pint, Rector, tests over real fixture spreadsheets |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 16 sequenced steps in four sections, plus the locked decisions, the fixture spreadsheets, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–3 | Tooling, harness, the admin panel you did not write, discovery, rule extraction |
| [Modelling](./roadmap/modelling/) | 4–7 | Deriving the schema, entity resolution, the import pipeline, reconciliation |
| [The Application](./roadmap/application/) | 8–11 | The daily workflow, roles and permissions, the audit trail, the report that must match |
| [Cutover](./roadmap/cutover/) | 12–15 | Parallel run and dual entry, freeze and switch, training and export-back, deploy and handover |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**Understand and import — steps 0–7.** Discovery, rule extraction, the schema, entity
resolution, import and reconciliation. Ends with the client's own numbers reproduced exactly
from your database, which is the moment they start believing you.

**Ship and switch — steps 8–15.** The application people use every day, permissions, history,
and the cutover that moves a working business onto it without a lost day.

The second path is where most freelance projects of this shape actually fail, and it is the
half nobody teaches.

## How to read a roadmap step

Every step has the same parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. This is the real point of the step; the code is just the vehicle. |
| **Libraries** | What to add, and sometimes why that choice over the obvious alternative. |
| **Expected outcome** | What you should have when the step is done — the pieces to build, and where useful a high-level project structure. The *how* is yours to work out. |
| **Verification** | How you prove it's done — see below. |

Some steps also carry a **Harness impact** note: what to add to `AGENTS.md` afterwards.

### Proving a step is done

The common failure of self-directed learning is that everything *feels* like it works. This
material has an unusually good answer to that, and it is the reason the domain was chosen: for
most steps here, the client's own spreadsheet is an oracle. Either your number matches theirs
or it does not. Five verification layers:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading 30 imported rows against the sheet, showing a screen to someone who is not a developer, asking the owner whether the rule you extracted is really their rule. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is. |
| **L5 — Automated guardrails** | CI, Larastan, Pint, and the reconciliation suite from step 7, which runs against the fixture spreadsheets on every push. Listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The step's Verification block vs. the Rubrics page

These are two views of the same thing. Be clear which is which:

- **The Verification block** ends every step. It's the checklist you work through to close
  *that* step: the `ACC-NN` test to write, the L2 checks to run by hand, the `AP-NN-x` IDs to
  self-check against, and a one-line *Done when*. This is the thing you *do*.
- **The [Rubrics page](./reference/rubrics/)** holds the full text of the `ACC-NN` criteria and
  the `AP-NN-x` anti-patterns that each step only names by ID. It lives in one place so the AI
  reviewer can be handed exactly one step's section without seeing the others. This is a
  *lookup* — you read one section per step while working that step's Verification block. You
  don't "complete" it.

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step: story, why now, concepts.
3. For discovery, entity resolution, reconciliation and cutover steps — **write the acceptance test first**, watch it fail. (Steps 2, 5, 7, 12 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 5, 7 and 12. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  schema designed from the column headings rather than the data; an automatic merge of two
  customers that turns out to be a father and a son).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the fixture spreadsheets. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step.
5. **Start [step 1](./roadmap/foundations/).** A running admin panel over an empty database, and an argument about why you did not build it by hand.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
