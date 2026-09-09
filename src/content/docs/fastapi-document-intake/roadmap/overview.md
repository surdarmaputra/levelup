---
title: Roadmap Overview
description: Locked decisions, the document model, the shipped document pack, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with Python 3 and SQL. New to FastAPI and to document extraction. |
| Language / runtime | Python 3.13, `uv` for dependencies, type hints everywhere, `mypy --strict` |
| Framework | FastAPI, async throughout |
| Domain | Intake — documents in, validated rows out, with a confidence score and a human review queue |
| Database | PostgreSQL 18. Documents, extractions, fields, confidence, review decisions and the gold set all live in it. |
| Job queue | A `jobs` table in that same PostgreSQL, claimed with `SELECT … FOR UPDATE SKIP LOCKED` |
| Why not a broker | At a few thousand documents a month, Redis and Celery are a second service to run, monitor and explain to a client for no gain. Step 16 states the volume at which that stops being true. |
| File storage | Local disk in development, S3-compatible object storage in production. Originals are kept — an auditor will ask. |
| Extraction model | Claude via the official `anthropic` Python SDK. Default `claude-opus-5`. A cheaper model appears in step 15 as a measured decision, never as a default. |
| Structured output | Pydantic schemas enforced through the SDK's structured outputs. Extraction returns a validated object or fails; it never returns prose to be parsed. |
| Field provenance | Citations enabled on the document block, so every extracted value carries the page it came from |
| Confidence | Derived from validation and agreement, never from asking the model how confident it is |
| Measurement | A hand-labelled gold set from step 11, run in CI from step 11 onwards. A change that lowers accuracy does not merge. |
| Review UI | htmx + Jinja2 templates. The review queue is forms and tables; a single-page application adds a build pipeline and teaches nothing about this problem. |
| Testing | pytest against real PostgreSQL. The model API is faked in unit tests and called for real only in the accuracy suite. |
| Quality | ruff (format + lint), `mypy --strict`, pytest. One formatter, one type checker. |
| Ops | Docker Compose → a single small VPS. No GPU, no model hosting, no Kubernetes. |
| AI harness | `AGENTS.md` from step 4, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** the roadmap is 18 numbered steps, 0 through 17. Steps 0–3 contain no
code. They are the difference between building this and selling it, and they are first on
purpose.

---

## Why this domain

Document intake was chosen because **the correct answer already exists and the client knows
it.** That one property forces every topic that separates a demo from a product:

- **The invoice total is a fact** → measurement rather than impressions, and a gold set you did not write with the model you are grading
- **A wrong number reaches the accounts** → confidence, thresholds, and a human path that is designed rather than bolted on
- **Some documents carry their own text** → knowing when not to call a model at all
- **Others are a photo taken in a warehouse** → vision extraction and its different failure shape
- **Every real invoice has a line-item table** → repeating structures, page breaks, and totals that must reconcile
- **One remittance settles forty claims** → a model where a document is not a record
- **Suppliers change layouts silently** → drift detection, because the first person to notice must not be the client
- **Every document costs money** → per-document cost, batch processing, and a cascade you measured rather than guessed

A demo cannot teach these. Nothing in a demo has to be right three hundred times.

---

## The three example clients

Every step is written against the same three businesses. Their documents arrive in step 5 and
stay for the rest of the roadmap — they disagree on purpose, and a pipeline that works for all
three is a pipeline that works.

| Client | Documents | The rule it exists to break |
|---|---|---|
| **Meridian Print Co** `meridian` | Digital PDF invoices from three regular suppliers. A real text layer, one page, consistent layout, roughly 60 a month. | The simple case. Everything about it is easy, which is exactly why it is the baseline: if you cannot get Meridian to 99% you have a bug, not a hard problem. It is also the case where calling a model at all is the wrong answer. |
| **Coastline Freight** `coastline` | Delivery notes and bills of lading, photographed on a phone in a warehouse. Skewed, shadowed, sometimes upside down. Multi-page, with a line-item table that continues across the page break. | No text layer, so extraction is vision or nothing. The important content is a repeating table rather than a set of named fields, and a table split across pages is where naive extraction silently drops rows. |
| **Alder Health Clinic** `alder` | Insurance remittance advice. A single document settles forty claims — some paid in full, some paid partially, some rejected with a reason code. | One document produces forty rows and there is no "the amount". A model built around *document has fields* cannot represent it at all. Personal health data also constrains what may appear in a log, in a prompt, or in a retained image. |

Concrete questions to keep asking: does Meridian's invoice extract correctly *without* a model
call? Does Coastline's line-item table keep all fourteen rows when row nine falls on the page
break? Does Alder's remittance produce forty rows whose amounts sum to the payment total, and
what happens when they do not?

None of the three may ever be special-cased in code. If you find yourself writing
`if client.slug == "alder"`, the extraction model is wrong, not the client.

---

## The document pack

The material ships its own adversary. You cannot practise this against clean sample data,
because clean sample data is not the problem.

The pack downloaded at step 5 contains roughly 300 documents across the three clients,
generated to behave like real ones:

| What's in it | Why |
|---|---|
| Clean digital PDFs with a text layer | The case where a model call is waste |
| The same invoice re-saved by a different tool | Byte-identical content, different bytes — the hashing lesson |
| Phone photographs: skewed, shadowed, glare, one upside down | The vision path, and the failures that are not the model's fault |
| A scanned page with no text layer at all | Silent empty extraction, the failure with no error |
| A multi-page delivery note with a table crossing the break | The single most common real bug in this domain |
| Three invoices from a supplier who changed layout mid-year | Drift, and what step 17 has to catch |
| A remittance settling forty claims, two of them rejections | The one-document-many-rows model |
| A document in the wrong client's folder | Classification, and why it comes before extraction |
| **Gold labels for every field of every document** | The accuracy number at step 11 |

**Do not open the gold labels before step 11.** Reading them first turns the accuracy number
into a memory test. They are in a separate archive for that reason.

---

## The document model (target state)

```
Client ──has──> ExtractionSchema (the fields this document type must produce)
   │
   ├──has──> Source (an upload, a watched folder, an email address)
   │            │
   │            └──has──> Document ──has──> DocumentFile (content hash, pages, stored original)
   │                          │
   │                          ├──has──> Extraction (attempt, model, cost, latency)
   │                          │              │
   │                          │              ├──has──> FieldValue (name, value, confidence, page)
   │                          │              └──has──> LineItem (position, fields, confidence)
   │                          │
   │                          └──has──> ReviewTask ──has──> ReviewDecision (who, when, corrections)
   │
   └──has──> GoldDocument ──has──> GoldField (the hand-labelled truth)
```

Three distinctions that look like pedantry and are not:

- A **Document** is the thing the business received — "Coastline's delivery note DN-4471". A
  **DocumentFile** is one file of it. Re-sending the same invoice as a re-saved PDF is one
  document, two files, one extraction.
- An **Extraction** is one *attempt*. Keeping attempts rather than overwriting is what lets you
  compare two models, two prompts, or two versions of the pipeline over the same documents,
  which is the whole of step 15.
- A **FieldValue** is not the same shape as a **LineItem**. Forcing forty remittance rows into
  a field list is the exact mistake Alder exists to prevent.

An extraction has one of three **outcomes**: accepted, sent to review, or rejected. Those three
are counted separately from step 13, and their ratio is what the client is buying.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, lint, types, tests, in one command | 4 | Everything below, in one place |
| ruff format + lint | 4 | Formatting arguments and obvious defects |
| `mypy --strict` | 4 | The type errors a pipeline of dictionaries hides until runtime |
| pytest against real PostgreSQL | 6 | SQL and constraint behaviour a mock would accept |
| The no-unvalidated-write test | 10 | Any path that can write a field into the client's data without passing validation |
| The empty-extraction test | 7 | A document that produced nothing being recorded as processed |
| The accuracy regression gate | 11 | A change that lowers field accuracy or raises the review rate |
| A no-document-content-in-logs test | 6 | An invoice body, a patient name or an API key reaching the log channel |
| CI on every push | 4 | The above, on a machine that is not yours |

The accuracy regression gate is the one that matters. From step 11, a change that lowers the
number does not merge without a recorded decision. It is the difference between "this prompt
feels better" and knowing.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Three things to keep in mind:

**Steps 0 to 3 have no code and are not optional.** They are where you learn what the work is
worth. A reader who skips them can build Intake and cannot quote for it, scope it, or answer
"why not just buy Rossum?" — which is the second question every client asks.

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. Confidence scoring, table extraction, gold-set design and cost decisions all
produce code that looks obviously reasonable and is quietly wrong, and the wrongness is
invisible until you have the measurement you have not built yet.

**Step 11 is the step.** Everything before it is a pipeline you hope works. Everything a client
is paying for starts there.
