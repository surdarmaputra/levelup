---
title: Foundations
description: Steps 0–4. Tooling, harness, the AdonisJS mental model, Lucid, the request contract, auth.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. An agent is only as good as the loop it can run unsupervised — if it can't verify its own work in one command, it will confidently hand you broken code. This is also the cheapest moment to turn TypeScript strictness all the way up; adding `noUncheckedIndexedAccess` to 20k lines of existing code means fixing 400 errors at once, and you won't.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is what matters most.
- Why formatting is settled by a tool, not by a review comment
- **Strict TypeScript on a framework that generates types**: what `tsc --noEmit` catches that tests never reach, and why strictness on day one is cheaper than strictness later
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed with `--no-verify`, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — agents (and future you) make better choices given the *why*
- Docker Compose as the definition of "the environment", so the machine is not part of the bug report

**Libraries:** an AdonisJS 7 starter kit, Japa, ESLint, Prettier, Lefthook, Docker + Compose (PostgreSQL 17 with PostGIS, Redis 8, Mailpit)

**Expected outcome:**
- An AdonisJS 7 project on Node 24 with TypeScript strict, `noUncheckedIndexedAccess` on
- ESLint, Prettier, `tsc --noEmit` and Japa wired in
- `npm run verify` running format check → lint → types → tests, in that order
- `lefthook.yml` — format and the fast checks on commit
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL + PostGIS, Redis and Mailpit
- `.gitignore`, `.editorconfig`, a CI workflow running `npm run verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `npm run verify` exits 0 on a clean tree and non-zero when a misformatted file, a type error, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `npm run verify` on the empty project. Note the number. If it passes ~30s once you have real code, fix it — a slow gate gets skipped. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) Ask your agent "what runs in this project's verify command, and in what order?" It must answer correctly from `AGENTS.md` alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `npm run verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and the v2–v4 evolution checkpoints.

> **Where people quit.** Setting up tooling before any domain code feels like procrastination. It isn't — it's what makes steps 1–23 fast. But if you stall here, ship a minimal `AGENTS.md` + `npm run verify` and tighten the compiler at step 3. Momentum beats completeness.

---

## Step 1 — Project skeleton and the AdonisJS mental model

**Story:** *As a developer, I need a running application with a health endpoint and typed configuration, so I have a verified baseline before adding any domain logic.*

**Mode:** `BUILD` — scaffolding and config. Let the agent generate; you read and question every line.

**Why now:** Everything else assumes you know when the framework builds an object for you and when it doesn't. Skip this and AdonisJS feels like magic — which means every bug feels like magic too.

**Concepts:**
- What the **IoC container** does: binding, resolving, automatic constructor injection, and why importing a singleton by hand defeats it
- **Service providers**: the `register` / `boot` / `start` / `ready` phases, and why resolving another service too early fails in ways that look random
- The **HTTP lifecycle**: server → server middleware → router → router middleware → named middleware → controller → response
- **Middleware**: the three kinds, the order they run in, and where dispatch context will be attached later
- **Typed environment variables**: `start/env.ts` validates and types `process.env` at boot, so a missing variable is a startup failure rather than an `undefined` at 3am
- **Config files as the API, environment as the machine** — why a config value read at import time behaves differently from one read per request
- **Subpath imports** (`#models/*`, `#services/*`) and what they replace
- **ace commands** — the CLI is part of the app, not a script folder
- What "skinny controller" actually means here

**Libraries:** the AdonisJS 7 starter kit, the framework's health-check module

**Expected outcome:** One `GET /api/v1/health` route of your own, returning application version, database connectivity and Redis connectivity. Typed env for everything the app needs to boot. The application namespace laid out as an empty modular structure, filled in over the rest of the roadmap:

```text
app/
├── orders/       orders, items, handling requirements
├── dispatch/     jobs, stops, assignment, the dispatch engine
├── couriers/     couriers, shifts, capabilities, location
├── billing/      payments, refunds, the ledger
├── identity/     users, memberships, policies
└── shared/       errors, clock, money, geo value objects
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a functional test boots the application and asserts `GET /api/v1/health` returns 200 with the expected JSON shape, including database and Redis status. |
| **L2 — Manual checks** | (a) Remove a required environment variable and start the app. It must fail at boot with a message naming the variable, not later with a `TypeError`. <br>(b) Read `start/kernel.ts` and list, in order, everything that runs before your controller. You should be able to explain each entry. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain in one sentence what happens between the HTTP request arriving and your controller running |

---

## Step 2 — Lucid, migrations, and the schema

**Story:** *As a merchant, my orders and items are stored durably, so that today's deliveries survive a restart.*

**Mode:** `LEARN` — your agent explains Lucid's behaviour and reviews your migrations. You write them.

**Why now:** Steps 5 and 8 add states and constraints to every table you create here. Doing it in the other order means writing every migration twice.

**Concepts:**
- **Migrations as the only source of schema truth**; why editing a migration that has already run is a lie, and what a corrective migration looks like
- **Generated schema classes**: the schema is read from the database, the types come from it, and your model extends what was generated. What that removes, and what it means for CI — a drifted generated file is a broken build, not a warning.
- **Models and relationships**: `hasMany`, `belongsTo`, `manyToMany` with a pivot, and the queries each one produces
- **Preloading** and the N+1 problem, seen for the first time (properly attacked in step 20)
- **Column types that matter here**: `timestamptz` vs `timestamp`, integer money in minor units vs decimal vs float — and why float is never money
- **PostGIS from the start**: a `geography(Point, 4326)` column for the pickup and drop-off, and why storing two float columns costs you step 9
- **Factories and seeders** — test data realistic enough to catch bugs
- Testing against real PostgreSQL, and what SQLite would have hidden

**Libraries:** `@adonisjs/lucid`, the `pg` driver, PostGIS, Japa

**Expected outcome:** Migrations, models, factories and seeders for `merchants`, `users`, `memberships`, `customers`, `orders`, `order_items`, `couriers` — no dispatch logic yet. Money as integer minor units with the currency beside it. Every timestamp column `timestamptz`. Addresses carrying a geography point. A seeder producing the three example merchants from the [overview](../overview/#the-three-example-merchants): Warung Pak Budi (one item, 3 km radius), Sehat Pharmacy (an item needing a cold bag, one needing an ID check) and Atlas Hardware (one order, three drop-off addresses).

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — save an `Order` with items and addresses, reload it in a fresh query, and assert every field and relationship round-trips: money, timestamps, and the geography point. Runs against real PostgreSQL with PostGIS. |
| **L2 — Manual checks** | (a) Run the migrations, then read the schema in `psql` with `\d+`. Column types are what you intended, not what the ORM guessed. <br>(b) Read the seeded rows for all three merchants. If Sehat's cold-chain requirement or Atlas's three drop-offs have nowhere to live, the schema is not finished. <br>(c) Change a column in a migration, re-run, and confirm the generated schema classes change and CI would catch them uncommitted. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and one command gives you all three example merchants with their orders |

---

## Step 3 — The request contract: validation, serialization, error model

**Story:** *As an API consumer, invalid input gives me a predictable, machine-readable error, so that I can handle failures without parsing prose.*

**Mode:** `LEARN` — the shape of your error model is a design decision, not a scaffold.

**Why now:** Every endpoint after this one inherits whatever contract you set here. Retrofitting an error format across 40 endpoints is a week you don't need to spend.

**Concepts:**
- **VineJS**: a validator is a compiled function, not a runtime walk of an object — what that buys you, and why the schema lives beside the controller that uses it
- **Validation rules that carry domain meaning** — a drop-off must be within the merchant's service radius; a scheduled window must be in the future and a whole number of minutes long
- **Serialization**: separating the persistence shape from the wire shape, and why returning a model directly publishes every column you later regret
- **The error model**: RFC 9457 problem details, a stable `type`, and one exception handler rendering every failure the same way
- **Status codes that matter here**: 422 vs 409 vs 404 — and why "that courier just took another job" is not a validation error
- **API versioning**: what `/api/v1` commits you to
- The exception handler, and how not to leak a stack trace in production

**Libraries:** VineJS (bundled), the framework exception handler

**Expected outcome:** CRUD endpoints for merchants, orders and couriers under `/api/v1`, each with a VineJS schema and an explicit serializer. One exception handler producing RFC 9457 problem details for validation errors, not-found, authorization failures and unhandled errors. A documented list of your `type` URIs.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly, including a per-field errors map. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when the app is not in debug mode. |
| **L2 — Manual checks** | (a) Read three error responses side by side. If a client would need different parsing for each, the model isn't done. <br>(b) Turn debug off locally and force an error. Nothing internal may appear in the response body. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and every failure path in the app produces the same body shape |

---

## Step 4 — Auth I: session auth, roles, policies

**Story:** *As a merchant owner, only the people I invite can see my orders, so that my customer list stays mine.*

**Mode:** `LEARN` — authorization bugs are silent. Write the tests yourself.

**Why now:** Dispatch in steps 5–9 needs to know who is acting: a merchant's staff, a platform dispatcher, or a courier. Building the dispatch rules first gives you actions nobody owns.

**Concepts:**
- **Session authentication**: how the session guard works, session fixation, and what regenerating the session on login prevents
- **CSRF** — what the token defends against, and why the courier API in step 10 will use a different mechanism
- **Password hashing** — the default algorithm, and why you never touch its parameters
- **Bouncer abilities vs policies**: when a one-line ability is enough and when a policy class is the right unit
- **Three roles, four actors**: platform staff, merchant owner, merchant staff — and the courier, who is not a `User` at all. Notice how the fourth breaks a role enum that assumed everyone signs in the same way.
- The difference between **authentication** (who), **authorization** (may they), and **ownership** (whose data) — three separate checks that are often collapsed into one bug
- Signed URLs, for the customer tracking links in step 18

**Libraries:** `@adonisjs/auth` (session guard), `@adonisjs/bouncer`

**Expected outcome:** Registration, login, logout and password reset for console users. A `User` model, a `Membership` joining a user to a merchant with a role, an invitation flow stub, and policies for orders and couriers. Authorization asserted in tests for every role, including the negative cases and the cross-merchant case.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — a table-driven test over (role × action) asserting allowed and forbidden for every combination, including a user with no membership and a user with a membership for a *different* merchant. A forbidden action returns 403 and changes nothing in the database. |
| **L2 — Manual checks** | (a) Log in, copy the session cookie, log out, replay the cookie. It must not work. <br>(b) Read every policy method and name the case it does *not* cover. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and no controller performs an authorization check inline |

**Harness impact:** `AGENTS.md` v2 — record the error model, the role enum, and the rule that authorization lives in policies and abilities.
