---
title: Foundations
description: Steps 4–6. Tooling and the agent harness, the hostile fake business system, and the action ledger schema.
sidebar:
  order: 3
---

## Step 4 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my authority model well enough to stop proposing tools that skip it.*

**Mode:** `BUILD` — but read every generated config.

**Why now:** First code step. Everything downstream needs a fast, reliable signal, and strict TypeScript on an empty project is free.

**Concepts:**
- **Loop engineering**: an agent's effectiveness is bounded by the feedback it can get without asking you. One fast, deterministic command matters more than any prompt.
- **`strict` from line one, and `any` banned.** An agent loop is full of shapes that arrive from outside — tool arguments the model produced, responses from a system that lies. `unknown` at every boundary with a parse step is the discipline; `any` is how a wrong tool argument reaches a write call.
- Vitest over the alternatives for speed, and why one test runner with one config beats three
- ESLint and Prettier as one decision made once
- Pre-commit hooks and the 5-second rule
- `AGENTS.md` as the convention contract, pointing at `docs/authority-model.md` — the single most useful thing an agent can read here
- Architecture Decision Records
- Docker Compose as the definition of "the environment"

**Libraries:** TypeScript 5.9, Vitest, ESLint, Prettier, `tsx`, Docker + Compose (PostgreSQL 18)

**Expected outcome:**
- A Node 24 + TypeScript project with `strict` on and `any` disallowed by lint rule
- Vitest, ESLint and Prettier wired in
- `npm run verify` running lint → `tsc --noEmit` → tests
- A pre-commit hook running the fast subset
- `AGENTS.md` v1 + `CLAUDE.md` symlink, referencing the four step 0–3 documents
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL 18
- `.gitignore`, `.editorconfig`, a CI workflow running `npm run verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — `npm run verify` exits 0 on a clean tree and non-zero when a lint error, a type error and a failing test are each introduced independently. |
| **L2 — Manual checks** | (a) Ask your agent "what may this system do without asking a person, for Lumen?" It must answer from `docs/authority-model.md` alone. <br>(b) Try to introduce an `any` and confirm lint stops you. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, `npm run verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The fake business system

**Story:** *As a developer, I have a client's systems to work against that behave as badly as real ones, so my mistakes surface here rather than at a customer.*

**Mode:** `BUILD` — this is a fixture, and building it teaches you what you are defending against.

**Why now:** Before the ledger and before any tool. Every later step is tested against this, and building it first means you have met each failure before you have to handle it.

**Concepts:**
- **Why you build the adversary yourself.** A friendly stub teaches nothing. Writing the double-charge yourself is the moment idempotency stops being a word.
- **The failures to implement**, each one taken from real integration work:
  - Charges twice when two requests arrive without a shared idempotency key
  - Returns 500 on about one call in twenty, at random
  - Occasionally takes 30 seconds and then succeeds — the timeout that is not a failure
  - Returns 200 for a write that did not commit, so a status code is never evidence
  - One endpoint with no reversal at all, which is Sable's whole world
  - A customer note field containing text that reads like an instruction
  - Rate limiting after a burst
- **Deterministic randomness.** The failures must be reproducible: seed them, and let a test force a specific failure. A fixture that fails unpredictably makes every test flaky and gets disabled within a week.
- **Realistic data for all three clients.** Northwind orders and returns, Lumen accounts in arrears with balances, Sable deliveries on driver routes with times. Enough that a scenario at step 12 can be about a real situation.
- **A verification endpoint**, so a test can ask *did this actually commit?* independently of what the write returned. This is what makes the "200 without committing" case testable rather than theoretical.
- **Never point this material at a real third-party system.** Not a sandbox account with real money, not a trial of a client's SaaS. We ship the target.

**Libraries:** a small HTTP framework (Hono or Fastify), a seeded random generator

**Expected outcome:** A `fake-systems` service in the Compose file with orders, customers, payments and deliveries for all three clients, implementing all seven behaviours above with seeded, forceable failures. A verification endpoint. A README documenting each behaviour and how to force it in a test.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — each of the seven behaviours can be forced deterministically from a test and is asserted; two payment requests without a shared key produce two charges, and with a shared key produce one. |
| **L2 — Manual checks** | (a) Call the payment endpoint twice by hand without a key and look at the result. Remember it. <br>(b) Force the "200 without committing" case and confirm the verification endpoint disagrees with the write response. That disagreement is the lesson. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and you can force any failure from a test in one line |

---

## Step 6 — The action ledger

**Story:** *As Sable Logistics, when a reschedule is retried after a timeout, the driver's route is changed exactly once, and I can see months later who decided it and why.*

**Mode:** `LEARN` — this schema decides whether idempotency, approval and traces are possible at all.

**Why now:** Before any tool exists. Retrofitting an idempotency key onto a table of actions already taken is not a migration, it is a reconciliation.

**Concepts:**
- **Action versus attempt.** An `Action` is the intent — *refund order 4471 by £30*. An `ActionAttempt` is one delivery of it. A retry creates an attempt. This one distinction is what makes the ledger an idempotency mechanism rather than a history.
- **The idempotency key is derived, not generated.** Deterministically, from the client, the action type and the request's identifying content. A key created with a random function at call time is a new key on every retry, which is the same as having none — and it is what an agent will write for you if you let it.
- **The unique constraint is the enforcement.** Not a `SELECT` before the `INSERT`. Two workers running that check concurrently both see nothing and both proceed; the database constraint is the only thing that actually holds.
- **Approval is a separate row with a separate author.** Nothing in the agent's path may write it. Making that structurally impossible — a different table, a different write path — beats a rule everyone agrees to follow.
- **Authority rules are data.** Action type, value limit, rate limit, approval required, permitted approvers, per client. Rows, never branches.
- **Compensation is an action.** It has attempts, it can fail, and its failure needs a destination. A compensation modelled as a boolean column has not been thought about.
- **What a trace has to contain to answer "why did it do that?"** — the request, the model's decision, every tool call with arguments and results, the authority check and its outcome, tokens and cost. Three weeks later, with the customer on the phone.
- **What must never be stored**: full payment details, credentials, and more personal data than the decision required. Traces are the place this leaks, because it is tempting to store the whole request.

**Libraries:** a query builder or lightweight ORM of your choice, plus a migration tool

**Expected outcome:** Migrations and models for `clients`, `authority_rules`, `conversations`, `turns`, `traces`, `actions`, `action_attempts`, `approvals` and `compensations`. A unique constraint on the idempotency key. Authority rules seeded from `docs/authority-model.md` for all three clients — Northwind permissive, Lumen approval-required, Sable irreversible with a compensation route. A log configuration that redacts credentials and customer data.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — inserting a second attempt with the same idempotency key is rejected by the database, not by application code; an approval row cannot be created by the agent's write path; a query under client A never returns client B's rows. |
| **L2 — Manual checks** | (a) Write down how you would answer "why did the agent refund this order?" using only what the schema stores. Every gap is a missing column, and it is cheaper to add now. <br>(b) Try to design an approval the agent could forge. If you can, the schema permits it. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and a fourth client with different authority rules requires no schema change |

**Harness impact:** `AGENTS.md` v2 — record that idempotency keys are derived, that the unique constraint is the enforcement, that approvals are never written by the agent's path, and that credentials and customer data never reach a log.
