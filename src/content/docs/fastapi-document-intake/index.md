---
title: Getting Started
description: A guided path from "I know Python" to a document intake pipeline you can sell — invoices and delivery notes turned into validated rows, with a confidence score, a human review queue, and a measured accuracy number.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know Python, I have called an LLM once"* to the most boring and most
sellable AI product there is — built around one real system: **Intake**, a pipeline that reads
a business's documents and writes validated rows into its database, on Python 3.13 and FastAPI.

Eighteen steps. The first four are not code — they are what the work is worth, how the
technique actually behaves, what you could buy instead, and how to scope the job with a client.
Take a step in an evening or over two weeks. The order matters, the pace doesn't.

## Who this is for

- Comfortable with Python 3 — type hints, `async`/`await`, virtual environments, packages
- Comfortable with SQL, HTTP, a terminal, and git; Docker installed
- You have called an LLM API at least once, even if only in a notebook

**Not assumed:** FastAPI, OCR, document parsing, structured output, confidence scoring,
evaluation, or any opinion about whether AI belongs in an accounts payable department.

If you have built an extraction demo before, this will still be new. The demo is step 8 of 18.
The other seventeen are what makes the difference between a script that worked on your three
sample PDFs and a system a freight company runs on Monday morning.

## What you are building, concretely

Intake takes documents that arrive as pictures of data — a supplier's PDF invoice, a
photographed delivery note, an insurance remittance — and produces rows. Every extracted field
carries a confidence score and a pointer back to the page it came from. Fields that fail
validation, or that the system is unsure about, go to a human review queue instead of into the
database.

The thing that makes it a portfolio piece is not the pipeline. It is the **accuracy report**: a
fixed set of documents, hand-labelled once, and a number for field-level accuracy, review rate
and cost per document that moves when you change the extraction. A reviewer does not have to
trust you. They can read the number and check the labels.

Three businesses are the running examples all the way through. They were picked because they
disagree with each other on exactly the points that are hard to build:

| The business | Its documents | What it forces you to handle |
|---|---|---|
| **Meridian Print Co** — a small print shop | Digital PDF invoices from three regular suppliers. Consistent layouts, a text layer, one page each. | The simple case, done properly. Extract without a model where the text is already there, get the totals right, and prove it. If this is wrong, nothing else matters. |
| **Coastline Freight** — a freight forwarder | Delivery notes and bills of lading photographed on a phone in a warehouse. Skewed, shadowed, multi-page, with a line-item table that runs across a page break. | Images with no text layer, tables that must survive extraction, and a document whose most important content is a repeating structure rather than a set of named fields |
| **Alder Health Clinic** — a medical practice | Insurance remittance advice. One document settles forty claims, several of them partially, and some are rejections with a reason code. | One document producing many rows, none of which is "the total". The obvious model — a document has fields — does not fit at all, and personal health data limits what may be logged or kept. |

Same pipeline, same code, three document sets whose rules do not match. That is the whole
exercise: one system, configured per client, and never a line of
`if client.slug == "coastline"`.

Three questions to keep asking as you build: how sure is this field, and how do I know? what
happens to a document the system gets wrong? and what does one document cost to process?

Other businesses in this shape, if you want to point your own version at one: builders'
merchants with supplier invoices, letting agents with tenancy paperwork, importers with customs
declarations, garages with parts orders, accountants with client bank statements, charities with
grant receipts, wholesalers with purchase orders. All of them re-type documents today, and all
of them are somebody's paying customer.

## Why document intake

Most AI material picks a problem where nobody can tell whether the output is right. This domain
was chosen for the opposite reason: **there is always a correct answer, and the client already
knows it.** The invoice total is a fact. That single property forces everything hard:

| Reality of the domain | Forces you to learn |
|---|---|
| The right answer exists and the client can check it | Measurement as the deliverable, not a demo — hand-labelled data, field-level accuracy, and a number that moves |
| A wrong number in the accounting system is worse than no number | Confidence scoring, thresholds, and routing to a human as a designed behaviour rather than an error path |
| Some documents already contain their own text | Knowing when *not* to call a model — the cheapest and most accurate extraction is the one that reads the text layer |
| Others are a photograph taken in a warehouse | Vision extraction, and how its failure shape differs from a text-layer parse |
| A line-item table is the hard part of every real invoice | Repeating structures, page breaks, and why "extract the fields" is the wrong mental model |
| One remittance settles forty claims | A document model that does not assume one document is one record |
| Suppliers change their layouts without telling anyone | Drift, monitoring accuracy over time, and finding out before the client does |
| Every document costs money to process | Per-document cost, batch processing, caching, and a cheap-first cascade that you measure rather than assume |

You cannot fake an accuracy number. Either the extraction got the total right on 282 of 300
documents, or it did not.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | Python 3.13, `uv`, strict typing throughout |
| Framework | FastAPI — dependency injection, lifespan, background tasks, file uploads |
| Data | PostgreSQL 18, SQLAlchemy 2, Alembic migrations, a Postgres-backed job queue |
| Document reading | PDF text layers with `pypdfium2` and `pdfplumber`, rasterising, Tesseract as the comparison, and when each one wins |
| Extraction | The Claude API via the `anthropic` SDK — native PDF document blocks, vision, structured outputs, citations for field provenance |
| Correctness | Pydantic schemas as the contract, validation rules, confidence scoring, thresholds and routing |
| Measurement | A hand-labelled gold set, field-level accuracy, review rate, a regression gate in CI |
| Review | A human review queue in htmx and Jinja2 — the part that makes it usable, and the smallest thing that can |
| Cost | Per-document cost, the Batch API, prompt caching, a measured cheap-first cascade, and where the money actually goes |
| Operations | Drift detection, new-supplier onboarding, an accuracy report the client receives monthly |
| Quality | pytest, ruff, mypy strict, deterministic tests against a non-deterministic dependency |
| Business | What re-keying costs, what the commercial products charge, how to scope and price the job |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. | Once, before step 4. The first four steps need no tooling. |
| **[Roadmap](./roadmap/overview/)** | The 18 sequenced steps in six sections, plus the locked decisions, the document model, and the always-on guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Concepts](./roadmap/concepts/) | 0–3 | What re-keying costs, how the pipeline works, what you could buy instead, how to scope the job |
| [Foundations](./roadmap/foundations/) | 4–6 | Tooling and harness, the FastAPI skeleton, the document and extraction schema |
| [Extraction](./roadmap/extraction/) | 7–10 | The two reading paths, structured extraction, line-item tables, validation and confidence |
| [Accuracy](./roadmap/accuracy/) | 11–13 | The gold set and the number, the human review queue, thresholds and routing |
| [Cost](./roadmap/cost/) | 14–15 | Where the spend is and how to see it, then making it cost less without losing accuracy |
| [Operations](./roadmap/operations/) | 16–17 | Deploy and hand-over, drift, new suppliers, the monthly accuracy report |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The three paths

**Understand the job — steps 0–3.** No code. What the manual process costs, how extraction
actually behaves, what UiPath and Rossum and Docsumo charge, and the questions you ask a client
before quoting. Ends with a written scoping document for one of the three examples.

**Build the thing — steps 4–13.** Schema, ingestion, extraction, tables, validation, the gold
set, the review queue. Ends with a system that works and a number that says how well.

**Make it a business — steps 14–17.** What a document costs, how to make it cost less without
losing accuracy, deploy, hand-over, and catching a supplier's layout change before the client
notices.

Do not skip the first path. It is four steps, it is the shortest of the three, and it is the
difference between a developer who can build this and one who can sell it.

## How to read a roadmap step

Every step has the same parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. This is the real point of the step; the code is just the vehicle. |
| **Libraries** | What to add, and sometimes why that choice over the obvious alternative. |
| **Expected outcome** | What you should have when the step is done. On steps 0–3 that is a written document, not code. |
| **Verification** | How you prove it's done — see below. |

Some steps also carry a **Harness impact** note: what to add to `AGENTS.md` afterwards.

### Proving a step is done

The common failure of self-directed learning is that everything *feels* like it works. Here it
is worse than usual, because an extraction that is 80% right looks identical to one that is 99%
right until you check three hundred documents. Five verification layers exist to prevent it:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading twenty extractions by hand against the original page, opening the worst-scoring document and working out why. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is. |
| **L5 — Automated guardrails** | CI, ruff, mypy strict, and the accuracy regression gate from step 11. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The step's Verification block vs. the Rubrics page

Two views of the same thing:

- **The Verification block** ends every step. It's the checklist you work through to close
  *that* step: the `ACC-NN` test to write, the L2 checks to run by hand, the `AP-NN-x` IDs to
  self-check against, and a one-line *Done when*. This is the thing you *do*.
- **The [Rubrics page](./reference/rubrics/)** holds the full text of the IDs each step only
  names. It lives in one place so the AI reviewer can be handed exactly one step's section
  without seeing the others. This is a *lookup*, not something you complete.

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step: story, why now, concepts.
3. For extraction, tables, confidence and cost steps — **write the acceptance test first**, watch it fail. (Steps 9, 10, 11, 15 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 9, 10 and 13. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  confidence score that is really the model's own opinion of itself; a gold set labelled by the
  same model being measured).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## A note on cost

Steps 8 onwards spend real money. The amounts are small — extracting one invoice costs
somewhere between a fifth of a cent and three cents depending on the model and the page count,
and the full 300-document gold set costs a few dollars to run — but they are not zero, and step
14 exists because "small" is not the same as "known". Set a spending limit on your API account
before step 8. From step 14 you will have your own per-document figure, which is the number a
client actually asks for.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the document model. Don't memorise it; know it's there.
3. **Start [step 0](./roadmap/concepts/).** No tooling, no repo, no API key. A spreadsheet and an hour with a calculator.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.** Configure once, use for the rest.
5. **Download the document pack** at [step 5](./roadmap/foundations/) — 300 documents across the three businesses, with gold labels you don't look at until step 11.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
