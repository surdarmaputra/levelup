---
title: Foundations
description: Steps 0–4. Tooling, harness, the message model, the connection registry, encrypted credentials.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. This material spends most of its time on failure paths, and a failure path you cannot run in one command is a failure path you will not test. This is also the cheapest moment to add static analysis; Larastan level 8 on an empty project is free.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is what matters most.
- Why formatting is settled by a tool, not by a review comment
- **Static analysis on a dynamic framework**: what Larastan knows about Eloquent and jobs, and why level 8 on day one is easier than level 8 later
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed with `--no-verify`, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — agents (and future you) make better choices given the *why*
- Docker Compose as the definition of "the environment", including the dependencies you will not use until step 14

**Libraries:** Laravel 13 skeleton, Pest 4, Laravel Pint, Larastan, Rector, Lefthook, Docker + Compose (PostgreSQL 17, Redis 8, MinIO, an SFTP server, Mailpit)

**Expected outcome:**
- A Laravel 13 project on PHP 8.5 with `declare(strict_types=1)` enforced
- Pint, Larastan (level 8), Rector and Pest wired in
- A `Makefile` exposing `make verify`, `make fmt`, `make up`, `make test`, `make work`
- `lefthook.yml` — format and the fast checks on commit
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL, Redis, MinIO, SFTP and Mailpit
- `.gitignore`, `.editorconfig`, a CI workflow running `make verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when a misformatted file, a Larastan violation, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number; if it passes ~30s once you have real code, fix it. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) `docker compose up` and connect to every service by hand, including the SFTP container you will not use until step 15. An environment that changes at step 15 is a step-15 bug you will blame on SFTP. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and the v2–v4 evolution checkpoints.

> **Where people quit.** Setting up tooling before any domain code feels like procrastination. It isn't — it's what makes steps 1–21 fast. But if you stall here, ship a minimal `AGENTS.md` + `make verify` and add Larastan at step 3. Momentum beats completeness.

---

## Step 1 — The connection registry

**Story:** *As an operator, I can see every external system this hub talks to, whether it is enabled, and when it was last heard from, so that "is it working?" has an answer.*

**Mode:** `BUILD` — scaffolding and config. You read and question every line.

**Why now:** Every later step attaches something to a connection: credentials, a rate limit, a retry policy, a freshness expectation. Building those first and retrofitting the registry means editing every one of them twice.

**Concepts:**
- What a **connection** is in this system: a named, configured, credential-bearing link to one external system, owned by one business
- **Direction matters**: inbound (they call us), outbound (we call them), and pull (we fetch on a schedule) behave differently and must be modelled as such from the start
- Config that lives in the database vs. config that lives in `config/` — the rule is whether an operator changes it without a deploy
- The **service container** and constructor injection, applied to adapters you will swap in tests
- Why an `enabled` flag is not enough, and what a `paused_until` gives you during somebody else's incident
- Health as a derived value, not a stored one

**Libraries:** the Laravel 13 skeleton, Pest

**Expected outcome:** A `Connection` model with direction, transport, an enabled state, a pause window, and a JSON config column. A `GET /api/v1/health` endpoint reporting application, database, Redis and per-connection status. An empty modular layout, filled in over the rest of the roadmap:

```text
app/
├── Connections/    the registry, config, health
├── Inbound/        receivers, signature verification, the message store
├── Pipeline/       jobs, retry policy, dead-letter, replay
├── Outbound/       HTTP adapters, throttling, circuit breaker
├── Batch/          scheduled pulls, file ingestion, quarantine
├── Ledger/         derived state, reconciliation
└── Support/        clock, correlation ids, structured logging
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a feature test boots the application and asserts `GET /api/v1/health` returns 200 with per-connection entries, and that a paused connection is reported as paused rather than healthy. |
| **L2 — Manual checks** | (a) Run `php artisan config:cache`, then hit the app. Anything that broke was calling `env()` outside a config file. <br>(b) Read your own health output as if you were on call at 02:00. If it does not tell you which connection is broken, it is decoration. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can add a new connection without touching a controller |

---

## Step 2 — The message model and the schema

**Story:** *As an operator, every payload this system ever received is stored exactly as it arrived, so that any bug can be fixed and the traffic replayed.*

**Mode:** `LEARN` — this schema decides what is possible for the rest of the roadmap. Write it yourself.

**Why now:** Step 5 receives the first real webhook. Receiving before you have somewhere to put it is how systems end up processing payloads they cannot reproduce.

**Concepts:**
- **Store raw, parse later.** The bytes as received, the headers, the signature, the received-at instant — before any validation runs
- **Immutability of the inbound record**, and why a `processed_at` column on it is a design mistake
- Separating `InboundMessage` from `Delivery`: one thing arrived, many attempts were made about it
- **Dedupe keys**: what makes two payloads "the same message", and why the sender's id is a better key than a hash of the body
- Column types that matter here: `jsonb` and what it costs to index, `timestamptz` everywhere, integer minor units for money
- **Partial and expression indexes** — the query you will actually run is "unprocessed messages for this connection, oldest first"
- Factories and seeders that produce realistic traffic, including duplicates
- Testing against real PostgreSQL, and what SQLite would have hidden

**Libraries:** Eloquent, Pest, `fakerphp/faker`

**Expected outcome:** Migrations, models, factories and seeders for `businesses`, `connections`, `inbound_messages`, `deliveries` and `attempts`. A unique index that makes duplicate messages impossible to insert twice for the same connection. A seeder producing the three example businesses from the [overview](../overview/#the-three-example-businesses) — Meridian Print with two connections, Harborline Supply with three SFTP suppliers, Cedar & Co with a payment provider and three targets — and a traffic seeder that includes a deliberate duplicate.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — insert the same inbound message twice for one connection and assert the second insert is rejected by the database, not by application code. Runs against real PostgreSQL. |
| **L2 — Manual checks** | (a) `php artisan migrate:fresh --seed`, then read the schema in `psql` with `\d+`. Column types are what you intended, not what Laravel guessed. <br>(b) Write out, in one sentence each, what a duplicate means for Meridian, for Harborline and for Cedar. If one of them does not fit your dedupe key, the key is wrong. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and `migrate:fresh --seed` gives you all three businesses and their connections in one command |

---

## Step 3 — The request contract and the error model

**Story:** *As an external system, when I send you something you cannot accept, I get an answer that tells me whether to retry, so that I do not hammer you for an hour over a payload you will never like.*

**Mode:** `LEARN` — this contract is a design decision, not a scaffold.

**Why now:** Every inbound endpoint after this one inherits whatever you decide here, and the status code you return decides whether the other side retries. Getting it wrong turns one bad payload into a denial of service against yourself.

**Concepts:**
- **The status code is an instruction.** 2xx means "stop sending this"; 4xx means "never send this again"; 5xx means "send it again later". Choosing wrongly is how you get retry storms or silent data loss.
- Why a webhook receiver returns 200 for a payload it has already seen, and 200 for a payload it cannot parse but has stored
- **Form requests** for the endpoints humans call, and why the webhook endpoints deliberately validate *after* storing
- **The error model**: RFC 9457 problem details, a stable `type`, one exception handler
- API versioning, and what `/api/v1` commits you to
- Not leaking internals: an error body that helps a partner debug without describing your database

**Libraries:** framework validation, framework exception handling

**Expected outcome:** The operator-facing CRUD endpoints for businesses and connections under `/api/v1`, each with a form request and an API resource. One exception handler producing RFC 9457 problem details. A written table — in `docs/` — mapping every failure this system can produce to a status code and a retry instruction. That table is the contract; the code implements it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when `APP_DEBUG=false`. |
| **L2 — Manual checks** | (a) Read your status-code table and, for each row, say out loud what the sender does next. Any row where the answer is "I don't know" is not finished. <br>(b) Force an error with `APP_DEBUG=false`. Nothing internal may appear in the body. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and every failure path produces the same body shape and a deliberate status code |

---

## Step 4 — Credentials, encryption, and what never reaches a log

**Story:** *As a business owner, my accounting system's API key is stored in a form that a leaked database backup does not expose, so that a bad day does not become a breach.*

**Mode:** `LEARN` — a mistake here is invisible until it is public.

**Why now:** Step 5 receives signed webhooks and step 10 makes authenticated outbound calls. Both need credentials, and adding encryption after they exist means rewriting both plus a migration over live data.

**Concepts:**
- **Encryption at rest with Laravel's encrypter**: what `APP_KEY` protects against, and precisely what it does not (an attacker with your `.env` and your database has both halves)
- Encrypted casts on Eloquent attributes, and why an encrypted column cannot be indexed or searched
- **Key rotation** as a designed operation: a key id stored beside the ciphertext, and a command that re-encrypts
- **Credential scope**: decrypt inside the adapter that makes the call, never in a controller, never into a job payload
- **Queued jobs serialise their properties.** A credential passed into a job is written to Redis in plain text. Pass the connection id; look the credential up in `handle()`.
- Redaction: log channels that strip known secret keys, and why "we just won't log it" is not a control
- Signature verification as the inbound half of the same problem — HMAC, timing-safe comparison, and replay windows

**Libraries:** framework encryption, framework logging, Pest

**Expected outcome:** A `Credential` store attached to connections, encrypted at rest with a recorded key id. An `artisan` command to rotate the key across every stored credential. A log processor that redacts known secret-bearing keys. A test that asserts no credential value appears in any log channel during a full inbound-to-outbound run. The three example businesses seeded with fake credentials so later steps have something to decrypt.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — store a credential, read the raw column directly with `DB::table()` and assert the plaintext does not appear; then run the rotation command and assert the credential still decrypts and the key id changed. |
| **L2 — Manual checks** | (a) Dispatch a job that uses a credential, then read the raw job payload in Redis. If the secret is in there, you passed the wrong thing into the job. <br>(b) Run the seeder with logging at debug level and grep the log file for a known credential value. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, no secret exists in a log, a job payload, or an exception message |

**Harness impact:** `AGENTS.md` v2 — record the error model, the credential rule ("jobs carry ids, never secrets"), and the status-code table.
