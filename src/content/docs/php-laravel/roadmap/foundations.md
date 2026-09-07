---
title: Foundations
description: Steps 0–4. Tooling, harness, the Laravel mental model, Eloquent, the request contract, auth.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. An agent is only as good as the loop it can run unsupervised — if it can't verify its own work in one command, it will confidently hand you broken code. This is also the cheapest moment to add static analysis; putting Larastan level 8 on 20k lines of untyped code means fixing 900 errors at once, and you won't.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is what matters most.
- Why formatting is settled by a tool, not by a review comment
- **Static analysis on a dynamic framework**: what Larastan actually knows about Eloquent, and why level 8 on day one is easier than level 8 later
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed with `--no-verify`, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — agents (and future you) make better choices given the *why*
- Docker Compose as the definition of "the environment", so the machine is not part of the bug report

**Libraries:** Laravel 13 skeleton, Pest 4, Laravel Pint, Larastan, Rector, Lefthook, Docker + Compose (PostgreSQL 17, Redis 8, Mailpit)

**Expected outcome:**
- A Laravel 13 project on PHP 8.5 with `declare(strict_types=1)` enforced
- Pint, Larastan (level 8), Rector and Pest wired in
- A `Makefile` exposing `make verify`, `make fmt`, `make up`, `make test`
- `lefthook.yml` — format and the fast checks on commit
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with PostgreSQL, Redis and Mailpit
- `.gitignore`, `.editorconfig`, a CI workflow running `make verify`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when a misformatted file, a Larastan violation, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number. If it passes ~30s once you have real code, fix it — a slow gate gets skipped. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) Ask your agent "what formatter does this project use and how do I run all checks?" It must answer correctly from `AGENTS.md` alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and the v2–v4 evolution checkpoints.

> **Where people quit.** Setting up tooling before any domain code feels like procrastination. It isn't — it's what makes steps 1–23 fast. But if you stall here, ship a minimal `AGENTS.md` + `make verify` and add Larastan at step 3. Momentum beats completeness.

---

## Step 1 — Project skeleton and the Laravel mental model

**Story:** *As a developer, I need a running application with a health endpoint and typed configuration, so I have a verified baseline before adding any domain logic.*

**Mode:** `BUILD` — scaffolding and config. Let the agent generate; you read and question every line.

**Why now:** Everything else assumes you know when Laravel builds an object for you and when it doesn't. Skip this and the framework feels like magic — which means every bug feels like magic too.

**Concepts:**
- What the **service container** is: binding, resolving, automatic constructor injection, and why `app()` sprinkled through a class is a design smell
- **Service providers**: `register()` vs `boot()`, and why doing work in `register()` breaks
- The **request lifecycle**: `public/index.php` → kernel → middleware stack → route → controller → response
- **Middleware**: global, group, and route-level; before vs after; where the tenant will be resolved in step 5
- **Config and environment**: `config/*.php` is the API, `.env` is the machine. Why `env()` outside config files returns `null` in production the moment you cache config.
- **Facades** — what they resolve to, when they hurt testability, and how to use the container instead
- Laravel's directory layout, and what "skinny controller" actually means here

**Libraries:** the Laravel 13 skeleton, `laravel/pint`, Pest

**Expected outcome:** One `GET /up`-style health route of your own under `/api/v1/health`, returning app version and database connectivity. Typed config for anything domain-specific. The application namespace laid out as an empty modular structure, filled in over the rest of the roadmap:

```text
app/
├── Tenancy/        tenant model, resolution, scoping
├── Scheduling/     services, staff, working hours, availability
├── Booking/        bookings, holds, state transitions
├── Billing/        subscriptions, deposits, payment adapters
├── Identity/       users, memberships, policies
└── Support/        errors, clock, shared value objects
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a feature test boots the application and asserts `GET /api/v1/health` returns 200 with the expected JSON shape. |
| **L2 — Manual checks** | (a) Run `php artisan config:cache`, then hit the app. Anything that broke was calling `env()` outside a config file. Undo the cache after. <br>(b) Run `php artisan about` and read every line. You should be able to explain each driver it lists. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain in one sentence what happens between the HTTP request arriving and your controller running |

---

## Step 2 — Eloquent, migrations, and the schema

**Story:** *As a business owner, my services and staff are stored durably, so that the schedule survives a restart.*

**Mode:** `LEARN` — your agent explains Eloquent's behaviour and reviews your migrations. You write them.

**Why now:** The tenancy work in step 5 modifies every table you create here. Doing it in the other order means writing every migration twice.

**Concepts:**
- **Migrations** as the only source of schema truth; why editing a shipped migration is a lie, and what a corrective migration looks like
- **Eloquent basics**: models, `$fillable` vs `$guarded`, casts, accessors, and what `save()` actually issues
- **Relationships**: `hasMany`, `belongsTo`, `belongsToMany` with a pivot, `hasManyThrough` — and the queries each one produces
- **Eager loading** and the N+1 problem, seen for the first time (properly attacked in step 13)
- **Column types that matter here**: `timestamptz` vs `timestamp`, integer money (minor units) vs decimal vs float — and why float is never money
- **Factories and seeders** — test data that is realistic enough to catch bugs
- Testing against real PostgreSQL, and what SQLite would have hidden

**Libraries:** `laravel/framework` (Eloquent), Pest, `fakerphp/faker`

**Expected outcome:** Migrations, models, factories and seeders for `services`, `staff`, `working_hours`, `customers` — no tenancy yet. Money stored as integer minor units with the currency alongside it. Every timestamp column `timestamptz`. A seeder that produces one plausible business you can eyeball.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — save a `Service` with related staff, reload it from the database in a fresh query, and assert every field and relationship round-trips, including money and timestamps. Runs against real PostgreSQL. |
| **L2 — Manual checks** | (a) Run `php artisan migrate:fresh --seed`, then read the schema in `psql` with `\d+`. Column types are what you intended, not what Laravel guessed. <br>(b) Enable query logging on one page and count the queries. Note the N+1 you will fix in step 13. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, `migrate:fresh --seed` gives you a usable business in one command |

---

## Step 3 — The request contract: validation, resources, error model

**Story:** *As an API consumer, invalid input gives me a predictable, machine-readable error, so that I can handle failures without parsing prose.*

**Mode:** `LEARN` — the shape of your error model is a design decision, not a scaffold.

**Why now:** Every endpoint after this one inherits whatever contract you set here. Retrofitting an error format across 40 endpoints is a week you don't need to spend.

**Concepts:**
- **Form requests**: validation as a class, authorisation on the same object, and why validating inside a controller stops scaling at the second endpoint
- **Validation rules that carry domain meaning** — a duration must be a multiple of the slot size; a price must be non-negative
- **API resources**: separating the persistence shape from the wire shape, and why returning a model directly leaks columns you later regret
- **The error model**: RFC 9457 problem details, a stable `type`, and a single exception handler that renders every failure the same way
- **HTTP status codes that matter here**: 422 vs 409 vs 400 — and why "the slot is gone" is not a validation error
- **API versioning**: what `/api/v1` commits you to
- Exception handling in Laravel 13, and how not to leak stack traces in production

**Libraries:** framework validation, `spatie/laravel-data` (optional — decide and record why)

**Expected outcome:** CRUD endpoints for services and staff under `/api/v1`, each with a form request and an API resource. One exception handler producing RFC 9457 problem details for validation errors, not-found, authorisation failures, and unhandled errors. A documented list of your `type` URIs.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — post an invalid payload; assert a 422 whose body matches the problem-details shape exactly, including a per-field errors map. Then assert an unhandled exception renders the same shape with a 500 and no stack trace when `APP_DEBUG=false`. |
| **L2 — Manual checks** | (a) Read three error responses side by side. If a client would need different parsing for each, the model isn't done. <br>(b) Set `APP_DEBUG=false` locally and force an error. Nothing internal may appear in the response body. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and every failure path in the app produces the same body shape |

---

## Step 4 — Auth I: session auth, roles, policies

**Story:** *As a business owner, only the people I invite can see my schedule, so that my customer list stays mine.*

**Mode:** `LEARN` — authorisation bugs are silent. Write the tests yourself.

**Why now:** Tenancy in step 5 needs an authenticated user to resolve a membership from. Building tenancy first gives you a tenant nobody belongs to.

**Concepts:**
- **Session authentication**: how Laravel's session guard works, session fixation, and what regenerating the session on login prevents
- **CSRF** — what the token defends against, and why the API routes in step 20 will use a different mechanism
- **Password hashing** — bcrypt/argon defaults, and why you never touch them
- **Gates vs policies**: when a policy class is the right unit, and how `authorize()` in a controller compares with `can` middleware
- **Roles without a package first** — owner, manager, staff — and what a package would add later
- The difference between **authentication** (who), **authorisation** (may they), and **tenancy** (whose data) — three separate checks that are often collapsed into one bug
- Signed URLs, for the customer-facing links in step 17

**Libraries:** `laravel/fortify` or the framework's own scaffolding — pick one and record why. `spatie/laravel-permission` is deliberately deferred; decide at the end of the step whether you would adopt it.

**Expected outcome:** Registration, login, logout and password reset. A `User` model, an invitation flow stub, a role enum, and policies for services and staff. Authorisation asserted in tests for every role, including the negative cases.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — a table-driven test over (role × action) asserting allowed and forbidden for every combination, including a user with no role at all. A forbidden action returns 403 and changes nothing in the database. |
| **L2 — Manual checks** | (a) Log in, copy the session cookie, log out, and replay the cookie. It must not work. <br>(b) Read every policy method and name the case it does *not* cover. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and no controller performs an authorisation check inline |

**Harness impact:** `AGENTS.md` v2 — record the error model, the role enum, and the rule that authorisation lives in policies.
