---
title: Foundations
description: Steps 0–3. Tooling, harness, the FastAPI mental model, workspaces and the corpus schema.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. This is also the cheapest moment to turn on strict typing: `mypy --strict` on an empty project is free, and on a retrieval pipeline full of dictionaries it is a week.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is what matters most.
- `uv` for dependency management and why a lockfile that is actually committed matters more than which tool produced it
- **Strict typing in a dynamic language**: what `mypy --strict` buys in a pipeline where every stage transforms a shape, and why `dict[str, Any]` flowing through six functions is the failure this prevents
- ruff as one tool for formatting and linting, and why one tool with one config beats three
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — agents (and future you) make better choices given the *why*
- Docker Compose as the definition of "the environment", including pgvector from the start

**Libraries:** `uv`, FastAPI, `ruff`, `mypy`, `pytest`, `pytest-asyncio`, Docker + Compose (PostgreSQL 17 with pgvector, Redis, MinIO)

**Expected outcome:**
- A Python 3.13 project managed with `uv`, with a committed lockfile
- ruff, mypy strict and pytest wired in
- A `Makefile` exposing `make verify`, `make fmt`, `make up`, `make test`, `make dev`
- A pre-commit hook running the fast subset
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL + pgvector, Redis and MinIO
- `.gitignore`, `.editorconfig`, a CI workflow running `make verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when a misformatted file, a type error, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number. <br>(b) Connect to PostgreSQL and run `CREATE EXTENSION vector;` by hand. If it fails now, it will fail at step 6 and you will blame retrieval. <br>(c) Ask your agent "how do I run all checks in this project?" It must answer correctly from `AGENTS.md` alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and the v2–v4 evolution checkpoints.

> **Where people quit.** Setting up tooling before any AI code feels like procrastination, and the model is the fun part. But an assistant with no test loop is a thing you tune by vibes, and this whole material exists to replace vibes with numbers.

---

## Step 1 — FastAPI skeleton and the mental model

**Story:** *As a developer, I have a running application with typed settings and a health endpoint, so I have a verified baseline before adding anything that costs money.*

**Mode:** `BUILD` — scaffolding and config. Generate, then read every line.

**Why now:** Everything else assumes you know when FastAPI creates something for you and when it does not. Skip this and dependency injection feels like magic, which means every lifecycle bug feels like magic too.

**Concepts:**
- **Dependency injection in FastAPI**: what `Depends` actually does, when a dependency is re-evaluated, and why a database session is a dependency rather than a global
- **Lifespan**: what belongs at startup — a connection pool, an HTTP client, a model client — and what happens to each when the process is killed
- **`async` in a web framework**: why one blocking call in an async handler stalls every other request on that worker, and how to find one
- Pydantic settings: typed configuration from the environment, validated at startup, so a missing API key fails at boot rather than at the first question
- Routers, tags, and an OpenAPI document that is worth showing a client
- Request-scoped context: a request id attached at the door and carried through every log line, which step 17 will depend on
- Error shape: one exception handler, one body shape, RFC 9457 problem details

**Libraries:** FastAPI, `pydantic-settings`, `uvicorn`

**Expected outcome:** A running application with typed settings, a lifespan-managed database pool, a `GET /health` endpoint reporting application, database and pgvector availability, one exception handler, and a request id in every log line. The package laid out as an empty structure, filled in over the rest of the roadmap:

```text
src/anchor/
├── api/            routes, schemas, error handling
├── corpus/         sources, documents, versions, chunks
├── retrieval/      embedding, search, fusion, reranking
├── answering/      prompt assembly, grounding, refusal, citations
├── evaluation/     eval sets, scoring, reports
└── support/        settings, logging, clock, ids
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a test client boots the app and asserts `GET /health` returns 200 with database and pgvector status; starting the app without a required setting fails at startup with a clear message rather than at first request. |
| **L2 — Manual checks** | (a) Put a blocking `time.sleep(5)` in an async handler and fire ten concurrent requests. Watch what happens. Remove it, and remember it. <br>(b) Read the generated OpenAPI page. If you would not show it to a client, fix the descriptions now while there are four endpoints. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain in one sentence what happens between the request arriving and your handler running |

---

## Step 2 — Workspaces, policy, and the keys you must not leak

**Story:** *As Fairview Family Clinic, my documents and my answering rules are mine alone, and the API keys that power this are not sitting in a log file.*

**Mode:** `LEARN` — the policy model shapes steps 10 and 11, and a secret leaked in step 2 is leaked everywhere.

**Why now:** Before any document is ingested, there must be something to own it. Retrofitting a workspace boundary onto a corpus is a migration over every table you are about to create.

**Concepts:**
- **The workspace as the isolation boundary**: every document, chunk, embedding, conversation and eval result belongs to exactly one, and a query without a workspace filter is a bug
- **Policy as data, not code.** Declined categories, whether citations are mandatory, what happens on refusal, and where escalation goes — all per workspace, none of it in an `if`
- Why Fairview and Ridgeline must run the same code paths with different rows
- **Secrets**: an API key in settings, never in a log, never in an error body, never in a traceback that reaches an error tracker
- **Documents are secrets too.** A client's fee schedule in a debug log is a confidentiality problem even though it is not a credential.
- Structured logging with redaction, and logging the *shape* of a payload rather than its content
- Audit: every answer this system produces will one day need to be explained, so the record starts here

**Libraries:** SQLAlchemy 2, Alembic, `structlog` or the standard library with a JSON formatter

**Expected outcome:** `workspaces` and `policies` tables with migrations, a workspace-scoped session dependency that every query goes through, settings holding the model API key, and a log configuration that redacts secrets and truncates document content. The three example workspaces seeded with their differing policies: Ridgeline permissive, Fairview strict with declined categories and an escalation target, Ledgerly version-aware.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — a query issued under workspace A never returns workspace B's rows, asserted for every table that exists; and a test that runs a full request with debug logging asserts no API key and no document body appears in the output. |
| **L2 — Manual checks** | (a) Write down, for each of the three workspaces, what its policy says in one sentence. If two of them are identical, you have not modelled anything yet. <br>(b) Force an unhandled exception and read the traceback as it would reach an error tracker. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and adding a fourth workspace requires no code change |

---

## Step 3 — The corpus schema

**Story:** *As Ledgerly, when I update my documentation the old answers keep working until the new version is fully indexed, so that nobody gets half an index.*

**Mode:** `LEARN` — this schema decides whether re-indexing without downtime is possible at all.

**Why now:** Step 4 ingests the first real document. Ingesting before there is a versioned place to put it is how systems end up unable to re-index without going dark.

**Concepts:**
- **Document identity vs. document version.** The fee schedule is one document with many versions; chunks and embeddings hang off the version, never the document. This one decision is what makes step 17 possible.
- Content hashing to detect an unchanged document cheaply, and why the hash is over the extracted text rather than the file bytes
- **pgvector**: the `vector` column type, dimensions fixed at creation, and what that means if you change embedding model later (you re-index; there is no migration)
- Index types for vector search — what an approximate index trades away, and why you do not add one until you have enough rows for it to matter
- PostgreSQL full-text search alongside the vectors: `tsvector`, a generated column, and a GIN index, ready for hybrid search in step 7
- Chunk metadata that earns its place: source document, version, position, page or heading path — every field you will need to render a citation
- Migrations with Alembic, and testing against real PostgreSQL with the extension actually installed

**Libraries:** SQLAlchemy 2, Alembic, `pgvector`

**Expected outcome:** Migrations, models and factories for `sources`, `documents`, `document_versions`, `chunks` and their embeddings, all workspace-scoped, with a full-text column beside the vector column. A constraint making one active version per document explicit. Fixtures for all three workspaces, including a second version of one Ledgerly document so version behaviour is exercised from the start.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — inserting a second version of a document leaves the first version's chunks intact and queryable; switching the active version changes what a workspace-scoped chunk query returns; both asserted against real PostgreSQL with pgvector. |
| **L2 — Manual checks** | (a) Read the schema in `psql` with `\d+`. Every column you cannot justify in one sentence should go. <br>(b) Sketch the citation you want an answer to produce — "Service Manual, page 27" — and confirm every field it needs exists on a chunk. If one is missing, add it now. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and you can hold two versions of a document at once without ambiguity |

**Harness impact:** `AGENTS.md` v2 — record the workspace-scoping rule, the version-not-document rule, and the fact that secrets and document bodies never reach a log.
