---
title: Foundations
description: Steps 4–6. Tooling and the agent harness, the FastAPI skeleton and document store, and the extraction schema.
sidebar:
  order: 3
---

## Step 4 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** First code step. Everything downstream depends on a fast, reliable feedback signal, and this is the cheapest moment to turn on strict typing — `mypy --strict` on an empty project is free, and on a pipeline where every stage transforms a shape it is a week.

**Concepts:**
- **Loop engineering**: an agent's effectiveness is bounded by the feedback it can get without asking you. One fast, deterministic, single-command verification matters more than any prompt.
- `uv` for dependency management, and why a committed lockfile matters more than which tool produced it
- **Strict typing in a dynamic language**: what `mypy --strict` buys in a pipeline where a document becomes bytes, becomes text, becomes fields, becomes rows. `dict[str, Any]` flowing through six functions is exactly the failure this prevents.
- ruff as one tool for formatting and linting, and why one tool with one config beats three
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed, permanently
- `AGENTS.md` as the convention contract, and why project-specific instructions beat generic ones — including pointing it at the four documents from steps 0–3
- Architecture Decision Records: agents and future you both make better choices given the *why*
- Docker Compose as the definition of "the environment"

**Libraries:** `uv`, FastAPI, `ruff`, `mypy`, `pytest`, `pytest-asyncio`, Docker + Compose (PostgreSQL 18)

**Expected outcome:**
- A Python 3.13 project managed with `uv`, with a committed lockfile
- ruff, mypy strict and pytest wired in
- A `Makefile` exposing `make verify`, `make fmt`, `make up`, `make test`, `make dev`
- A pre-commit hook running the fast subset
- `AGENTS.md` v1 + `CLAUDE.md` symlink, referencing `docs/business-case.md` and `docs/pipeline.md`
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL 18
- `.gitignore`, `.editorconfig`, a CI workflow running `make verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — `make verify` exits 0 on a clean tree and non-zero when a misformatted file, a type error, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number; you will compare against it at step 16. <br>(b) Ask your agent "what does this project do and who pays for it?" It must answer from `AGENTS.md` and the step 0 document, without you explaining. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The FastAPI skeleton and the document store

**Story:** *As Coastline Freight, I can send a photographed delivery note to the system and it is stored, hashed and queued, so nothing is lost before anything clever happens.*

**Mode:** `BUILD` — scaffolding, upload handling and storage. Generate, then read every line.

**Why now:** Before extraction, because a document you cannot re-process is a document you cannot improve on. Every later step re-runs extraction over documents stored here.

**Concepts:**
- **Dependency injection in FastAPI**: what `Depends` actually does, when a dependency is re-evaluated, and why a database session is a dependency rather than a global
- **Lifespan**: what belongs at startup — the connection pool, the HTTP client, the object-storage client — and what happens to each when the process is killed
- **`async` in a web framework**: why one blocking call in an async handler stalls every other request on that worker, and how to find one
- **File uploads that do not fit in memory.** A 40-page scanned PDF streamed to disk, not read into a bytes object. The failure only appears with real documents, which is why real documents arrive in this step.
- **Content hashing, and hashing the right thing.** The pack contains the same invoice re-saved by a different tool: identical content, different bytes. Hash what you will extract from, not the file.
- **The original is evidence.** Store it unmodified and keep it. An auditor, a dispute, or a re-run against a better model all need the exact file that arrived.
- Pydantic settings: typed configuration validated at startup, so a missing API key fails at boot rather than at the first paid request
- **A job queue in the database you already run**: a `jobs` table, `SELECT … FOR UPDATE SKIP LOCKED`, a worker loop, and visible retries. What a broker would add, and why not yet.
- Request-scoped context: a request id at the door, carried through every log line

**Libraries:** FastAPI, `pydantic-settings`, `uvicorn`, SQLAlchemy 2, `boto3` or `minio` for object storage

**Expected outcome:** A running application that accepts a document upload, streams it to storage, records it with a content hash, and enqueues an extraction job that a worker picks up and marks done. A `GET /health` reporting application, database and storage. One exception handler, one body shape. **The shipped document pack downloaded and loaded** for all three clients — the gold-label archive left unopened. The package laid out as an empty structure, filled in over the rest of the roadmap:

```text
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

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — uploading a document stores the original byte-identical, records a hash, and creates exactly one job; uploading the re-saved copy of the same invoice produces one document, not two; killing the worker mid-job leaves the job claimable again rather than lost. |
| **L2 — Manual checks** | (a) Upload the 40-page scan and watch memory while it uploads. If it spikes by the file size, you read it into memory. <br>(b) Look at the stored original for the upside-down photograph. It must be exactly what you sent, rotation and all. Fixing it on the way in destroys the evidence. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and you can re-run every document in the pack through the pipeline with one command |

---

## Step 6 — The extraction schema

**Story:** *As Alder Health Clinic, one remittance advice produces forty claim rows, and the system stores them as forty rows rather than pretending my document has one amount.*

**Mode:** `LEARN` — this schema decides whether Alder is possible at all, and whether steps 11 and 15 can compare two extractions of the same document.

**Why now:** Step 7 reads the first document for real. Getting the shape wrong now means a migration across every table you are about to fill.

**Concepts:**
- **A document is not a record.** Meridian's invoice maps to one row and one set of fields. Alder's remittance maps to forty rows and no meaningful document-level amount. A schema that assumes the first cannot represent the second, and every attempt to force it produces a `notes` column full of JSON.
- **Fields and line items are different shapes.** A `FieldValue` is a name, a value, a confidence and a page. A `LineItem` is a position plus its own set of fields. They need separate tables, and the difference is not cosmetic — confidence, validation and review all behave differently on a repeating structure.
- **Extractions are attempts, not results.** Keep every attempt with its model, prompt version, cost and latency. Overwriting means step 15 cannot compare two models over the same documents, which is the whole of the cost work.
- **Provenance per field.** Which page, and where on it, did this value come from? A reviewer who has to search a 40-page document for the number they are checking will stop checking. This is also what makes the citations feature at step 8 worth turning on.
- **Confidence belongs to a value, not to a document.** One extraction can be certain about the invoice number and unsure about the date.
- **Typed values, not strings.** A total is a decimal with a currency, a date is a date with a known format ambiguity (is `03/04/2026` March or April?), a quantity has a unit. Storing everything as text moves the problem into the consuming system.
- **What the schema must not know.** Nothing in it may mention a client by name. Meridian's supplier list, Coastline's units and Alder's reason codes are all rows, never branches.
- Migrations with Alembic, and testing against real PostgreSQL

**Libraries:** SQLAlchemy 2, Alembic, Pydantic 2

**Expected outcome:** Migrations and models for `clients`, `extraction_schemas`, `sources`, `documents`, `document_files`, `extractions`, `field_values`, `line_items`, `review_tasks` and `review_decisions`, plus the `gold_documents` and `gold_fields` tables that stay empty until step 11. Client-scoped throughout. Fixtures for all three clients, including a seeded Alder remittance with forty line items and a Coastline note whose table crosses a page break. A log configuration that redacts secrets and never writes document content.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — the same document can hold two extractions from different models without either overwriting the other; a forty-row remittance stores forty line items each with its own confidence; a query under client A never returns client B's rows, asserted for every table. |
| **L2 — Manual checks** | (a) Sketch the review screen you want at step 12 on paper. Every field it shows must already exist in the schema. If one is missing, add it now. <br>(b) Write down, in one sentence each, how Meridian, Coastline and Alder map onto this schema. If Alder's sentence needs an exception, the schema is wrong. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and adding a fourth client with a new document type requires no schema change |

**Harness impact:** `AGENTS.md` v2 — record the client-scoping rule, the extractions-are-attempts rule, and that document content and patient data never reach a log.
