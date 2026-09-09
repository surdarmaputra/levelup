---
title: AGENTS.md Template
description: The v1 agent harness template for Intake — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Copy it to your repo root and fill the `<>` placeholders.
> Symlink it so every tool finds it: `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v4) are at the bottom. Tick them off as you reach those steps.
> **Do not write v4 on day 1.** You don't yet know your own conventions, and a harness full of
> guessed rules is worse than a short honest one.

---

## Project

Intake — a pipeline that reads a business's documents and writes validated rows into its
systems, with a confidence score per field, provenance back to the page, and a human review
queue for everything it is unsure about.
Python 3.13 + FastAPI, PostgreSQL 18, the Claude API via the `anthropic` SDK.

**Read `docs/business-case.md` and `docs/pipeline.md` before suggesting anything.** They are the
output of steps 0 and 1 and they say what this replaces and what it is worth. Suggestions that
ignore them tend to be technically fine and commercially wrong.

Three example clients are seeded and used in every test. They disagree on purpose:

- **Meridian Print Co** — clean digital PDF invoices from three suppliers, with a real text layer. The simple case, and the case where calling a model at all is the wrong answer.
- **Coastline Freight** — delivery notes photographed in a warehouse. No text layer, and a line-item table that crosses a page break. Vision or nothing.
- **Alder Health Clinic** — insurance remittance advice where one document settles forty claims, some partially, some rejected. One document, forty rows, no document-level amount. Patient data limits what may be logged or retained.

A feature works when it works for all three. Never special-case a client by slug or name —
differences live in client configuration data.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension matter
more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It's the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, 6, 7, **9**, **10**, **11**, 13, **14**, **15**, 17.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

You may write: tests the developer asks for by name, throwaway scripts that demonstrate a
behaviour, and configuration that is not the subject of the step.

### `BUILD` steps — pair or autonomous

Steps 4, 5, 8, 12, 16.

Generate freely. Scaffolding, config, upload plumbing, the review templates, deploy. Then
explain what you generated so it is reviewed rather than absorbed.

### Two absolute rules

**Never label the gold set.** Labels produced by the model being graded measure agreement with
that model, and every number from step 11 onwards depends on the labels being independent. You
may draft candidates the developer will check by hand; you may not produce labels that are used
unedited.

**Never propose a confidence score that comes from the model.** Confidence in this project is
derived from checks that can fail — arithmetic, referential, plausibility, agreement. Asking the
model how sure it is produces a fluent number that correlates weakly with being right, and it is
the most common mistake in this domain.

---

## The loop

`make verify` is the single source of truth. It runs ruff format check → ruff lint →
`mypy --strict` → pytest → the no-unvalidated-write test.

**Run it after every change. Do not report work as complete without a green run.**

```
make verify     # everything. the one you care about.
make fmt        # auto-fix formatting
make test       # tests only, faster iteration
make up         # start Docker dependencies
make down       # stop them
make dev        # run the app with reload
make score      # run the gold set and print the accuracy report (from step 11)
make cost       # print the cost ledger summary (from step 14)
```

If `make verify` fails, fix it before continuing. Never disable a check to make it pass — if a
rule seems wrong, raise it, don't route around it. A gate that gets bypassed once gets bypassed
always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | Python 3.13, type hints everywhere, `mypy --strict` |
| Dependencies | `uv`, lockfile committed |
| Framework | FastAPI, async throughout |
| Database | PostgreSQL 18; SQLAlchemy 2 + Alembic |
| Jobs | A `jobs` table in PostgreSQL, `SELECT … FOR UPDATE SKIP LOCKED`. No broker. |
| Files | Local disk in dev, S3-compatible in production. Originals stored unmodified. |
| Reading | `pypdfium2` and `pdfplumber` for text layers; the model's document and image blocks for vision |
| Extraction | `anthropic` SDK, structured outputs against Pydantic schemas, default model `claude-opus-5` |
| Review UI | Jinja2 + htmx, server-rendered |
| Testing | pytest against real PostgreSQL; the model API faked except in the accuracy suite |
| Quality | ruff, `mypy --strict` |

**Never suggest:** SQLite for tests (different SQL, different constraint behaviour); a
document-AI framework or orchestration library (the pipeline is the exercise); fine-tuning an
extraction model; a message broker before step 16's stated signal; a single-page application for
the review queue; calling the real model from a unit test.

---

## Layout

```
src/intake/
├── api/            routes, schemas, error handling
├── documents/      upload, storage, hashing, classification
├── reading/        text layer, rasterising, vision
├── extraction/     schemas, model calls, line items
├── validation/     rules, confidence, routing
├── review/         the queue and its templates
├── accuracy/       gold set, scoring, reports
└── support/        settings, logging, jobs, clock, ids
```

Reading returns content and provenance and nothing else. Extraction must not know which reading
path produced its input — no page-image handling, no text-density checks in the extraction layer.

---

## Non-negotiable conventions

**Reading**
- The reading path is decided per page by measured text density, not by file extension.
- A page that produces no content is an `empty_extraction` outcome, never a successful empty result.
- Stored originals are never modified. Normalise a copy.

**Extraction**
- The schema is the contract. Structured outputs validate or fail; no JSON parsed out of prose.
- An absent field is null. Inventing a plausible value is the failure this rule exists for.
- Quality problems are fixed in field descriptions before they are fixed in code.
- Every extraction is an attempt, kept with its model, prompt version, tokens, cost and latency. Nothing overwrites a previous attempt.

**Validation and confidence**
- Confidence comes only from checks that can fail. Never from the model.
- Validation rules are client data, never `if client.slug == …`.
- When a check cannot run, the outcome is review. Never accept.
- Nothing reaches a client-facing table without passing validation.

**Line items**
- Rows are asserted individually, never by count.
- Repeated headers, carried-forward rows and totals rows are named and excluded.
- Truncation is checked explicitly.

**Accuracy**
- Field, document and critical-field accuracy are reported separately. Never just the flattering one.
- Normalisation rules are written down.
- Tune on the training split, report on the held-out split.
- No change to reading, extraction, validation or thresholds merges without a gold-set run.

**Cost**
- Every model call's `usage` is stored at the moment of the call.
- Cost is attributed per client, per stage, per prompt version.
- The unit is cost per *completed document*, including re-runs and reviewer minutes.
- The stable prompt prefix is cached; verify with cache-read tokens, don't assume.

**Privacy**
- Client scoping is structural, not per-query discipline.
- API keys, document content and patient data never reach a log.
- Retention is per client and enforced, not aspirational.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** SDK surfaces change. If you're unsure a method or parameter exists in the installed version, say so rather than producing plausible code.
- **No scope creep.** Don't add a cascade at step 8 or drift detection at step 12. Later steps cover them deliberately.
- **Never bypass a quality gate.** No ignored type errors, no skipped gold-set run, without explicit discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. Read them before proposing anything structural. The
whole-document versus per-page extraction decision is recorded there and changing it changes
what happens to tables that cross a page break.

When a decision is made in conversation, offer to record it as an ADR. Undocumented decisions get
silently reversed three steps later.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. It is the source of truth for review behaviour
— this file does not duplicate it.

To review: load that prompt, the current step's section from `docs/RUBRICS.md`, and the code.
**Only the current step's rubric.** Loading the whole file leaks later steps and produces
off-scope findings.

---

## Evolution checkpoints

Update this file at these points. Each is a roadmap step's "harness impact" note.

- [ ] **v1 — Step 4.** This template, placeholders filled, pointing at the step 0–3 documents.
- [ ] **v2 — Step 6.** Client scoping, extractions-are-attempts, and the rule that document content and patient data never reach a log.
- [ ] **v3 — Step 10.** Confidence never comes from the model; validation rules are data; a failed check means review.
- [ ] **v4 — Step 13.** Thresholds are per-client data, the review rate is watched beside accuracy, and no change ships without a gold-set run.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file couldn't be written well on day 1.
