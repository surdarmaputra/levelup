---
title: AGENTS.md Template
description: The v1 agent harness template for Fieldbook — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 0](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 0.** Copy it to your repo root and fill the `<>` placeholders.
> Symlink it so every tool finds it: `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v4) are at the bottom. Tick them off as you reach those steps.
> **Do not write v4 on day 1.**

---

## Project

Fieldbook — the operations back office that replaces the spreadsheets a small business has run
on for years. PHP 8.5 + Laravel 13, PostgreSQL, Filament.

**The domain model is not given.** It is derived from the client's spreadsheets in steps 2 to 4.
Nothing in this project may assume a rule that is not traceable to a formula, a profiling
result, or a named person who said it.

Three example businesses are used in every test. They disagree on purpose:

- **Willow Lane Nursery** — one tidy sheet, ~4,000 rows, two date formats, a total row, 30 prices typed with a currency symbol. The simple case.
- **Cavendish Tutors** — six per-tutor sheets joined by `VLOOKUP`; the customer list exists six times and the copies disagree. Entity resolution.
- **Portside Freight** — one sheet where pricing lives in nested `IF` formulas nobody wrote down, and the `notes` column carries real logic. The model is in the formulas and in a person's head.

A feature works when it works for all three. Never special-case a business by slug or name.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension
matter more than delivery speed.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps **2**, **3**, 4, **5**, 6, **7**, 9, 10, 11, **12**, **13**, and the handover half of 15.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review what they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

### `BUILD` steps — pair or autonomous

Steps 0, 1, 8, 14, and the deploy half of 15.

Generate freely: tooling, the panel, resources and forms, the export, the deploy. Then explain
what you generated so it is reviewed rather than absorbed.

### Two absolute rules

**Never invent a business rule.** In steps 2, 3, 4 and 11 a plausible fictional rule reads
exactly like a real one, and it will be discovered during the parallel run in front of the
client. Every rule traces to a formula reference, a profiling result, or a named person.
"It seemed reasonable" is not a source — say "I don't know, ask the owner" instead.

**Never propose an entity-resolution threshold from intuition.** Thresholds come from running
against a hand-labelled answer key. A number that sounds sensible is how two customers become
one person.

---

## The loop

`make verify` is the single source of truth. It runs Pint (check) → Larastan → Pest → the
reconciliation suite.

**Run it after every change. Do not report work as complete without a green run.**

```
make verify     # everything. the one you care about.
make fmt        # auto-fix formatting
make test       # tests only, faster iteration
make up         # start Docker dependencies
make down       # stop them
make profile    # column profiler (step 2)
make reconcile  # reconciliation against the fixtures (step 7)
```

If `make verify` fails, fix it before continuing. Never disable a check to make it pass. A gate
that gets bypassed once gets bypassed always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | PHP 8.5, `declare(strict_types=1)` in every file |
| Framework | Laravel 13.x |
| Database | PostgreSQL 17, framework migrations |
| Admin UI | Filament, version pinned in `docs/adr/` |
| Import | `.xlsx` and `.csv`, streamed |
| Testing | Pest 4 against real PostgreSQL, using the three messy fixture spreadsheets |
| Quality | Pint, Larastan level 8, Rector |

**Never suggest:** SQLite for tests (step 4's constraints and step 6's unique-violation handling
need real PostgreSQL); a float column for money; a clean fixture spreadsheet; storing a derived
column; hand-building CRUD screens on this project.

---

## Layout

```
app/
├── Discovery/      column profiling, formula extraction, findings
├── Importing/      readers, mapping, quarantine, runs
├── Resolution/     candidate matching, merge, aliases
├── Reconciling/    comparisons against the source sheet
├── Domain/         parties, items, transactions, rules
└── Support/        clock, money, shared value objects

docs/
├── adr/            decisions, newest wins
└── discovery/      findings and rules per business — deliverables, not notes
```

---

## Non-negotiable conventions

**Discovery**
- Discovery precedes schema. No migration is written before profiling is complete.
- Every rule has a named source. A rule without one is a question, not a rule.
- Derived values are never stored.
- Exceptions are preserved and made visible, never silently corrected.

**Data**
- Money is integer minor units with an explicit currency.
- Every imported record carries its source: sheet, row number, import run.
- The original spreadsheets are archived read-only and never deleted.

**Import**
- No silent coercion. A value is transformed only by a rule that can be pointed at.
- Every import has a dry run that changes nothing and predicts the real run.
- Per-row outcomes: applied, quarantined, skipped. Never all-or-nothing.
- Importing the same file twice produces the same state.

**Resolution**
- Three bands: merge, propose, ignore. Never merge below the threshold.
- Every merge is recorded, keeps both aliases, and can be undone.

**Correctness**
- Reconciliation runs in CI and must stay green.
- Money reconciles with zero tolerance.
- A difference is investigated, never tolerated.

**Access and history**
- A restricted field is absent from the response, not hidden in the interface.
- Every change to money or status has an actor, including changes made by an import.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** In this project "I don't know, ask the owner" is frequently the correct answer and is always better than a plausible guess.
- **Don't invent APIs.** Laravel and Filament surfaces change between majors. If unsure a method exists in the pinned version, say so.
- **No scope creep.** Don't add permissions at step 4 or an API at step 11.
- **Never bypass a quality gate.** No skipped reconciliation, no `--no-verify`.

---

## Decisions

Architecture decisions live in `docs/adr/`. They carry unusual weight here: most of them are
decisions about somebody else's business, and you will be asked to justify them months later.

When a decision is made in conversation, offer to record it as an ADR. Undocumented decisions
get silently reversed three steps later.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. To review: load that prompt, the current
step's section from `docs/RUBRICS.md`, and the code. **Only the current step's rubric.**

---

## Evolution checkpoints

- [ ] **v1 — Step 0.** This template, placeholders filled.
- [ ] **v2 — Step 3.** Discovery precedes schema; derived columns are never stored; a rule without a named source is not a rule.
- [ ] **v3 — Step 5.** Resolution rules: three bands, never merge below the threshold, every merge audited and reversible.
- [ ] **v4 — Step 11.** The headline report definition, the period-boundary rules, and the requirement that the reconciliation and report suites stay green.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned about
this client's business — which, in this material, is most of what you were being paid for.
