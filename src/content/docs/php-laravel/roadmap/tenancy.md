---
title: Multi-Tenancy
description: Steps 5–8. Tenant resolution, scoping and the leak test, tenant context outside the request, the Livewire back-office.
sidebar:
  order: 3
---

Four steps that turn a single-business application into a platform many businesses share. You
build all of it by hand. A package would do it for you in an afternoon and you would learn
nothing — and step 22 adopts one anyway, once you know what it is doing for you.

---

## Step 5 — The tenant, and resolving it from the request

**Story:** *As a business owner, I get my own address at `mysalon.bookline.app`, so that my staff sign in somewhere that belongs to us.*

**Mode:** `BUILD` — resolution is plumbing. The judgement comes in step 6.

**Why now:** Every table from step 2 needs a `tenant_id`, and every request after this one needs to know which tenant it is for. Do it before there are 30 tables, not after.

**Concepts:**
- **What a tenant is here**: one business, with its own staff, services, customers and bookings — not one user
- **Resolution strategies**: subdomain, path prefix, custom domain, header. What each costs in local development, TLS, and cookie scope.
- **Where resolution belongs**: middleware, early, before authorisation — and why a controller resolving the tenant is already too late
- **Binding the current tenant into the container** as a scoped singleton, so nothing has to pass it around
- **Membership**: a user belongs to one or more tenants; signing in is not the same as being allowed into this tenant
- **The unresolved case** — an unknown subdomain, a suspended tenant, a user with no membership. Three different responses, none of them a 500.
- Local development with wildcard subdomains, and the `.test` domain problem

**Libraries:** none new — this is framework middleware and the container

**Expected outcome:** A `Tenant` model with a slug, a `Membership` pivot between users and tenants, resolution middleware on the tenant route group, and a `CurrentTenant` container binding. Central routes (marketing site, sign-up, platform admin) stay outside the tenant group.

```text
app/Tenancy/
├── Models/          Tenant, Membership
├── Http/            ResolveTenant middleware, EnsureMembership middleware
├── CurrentTenant    the container-bound holder
└── Exceptions/      TenantNotFound, TenantSuspended
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — a request to a known subdomain resolves the tenant and reaches the route; an unknown subdomain returns 404; a suspended tenant returns 403; an authenticated user without a membership for that tenant returns 403. Four cases, four distinct responses. |
| **L2 — Manual checks** | (a) Sign in on one tenant subdomain, then visit another in the same browser. What happens, and is that what you intended? Write the answer down — step 6 will test it. <br>(b) Check your session cookie's domain attribute. If it is set on the parent domain, understand exactly what you have shared. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and no code outside the middleware reads the subdomain |

---

## Step 6 — Scoping every query, and the leak test

**Story:** *As a business owner, no query in this application can return another business's data, so that my customer list is never visible to a competitor on the same platform.*

**Mode:** `LEARN` — this is the step. Do not let an agent write it.

**Why now:** The moment a second tenant exists, every query is a potential leak. Adding the scope after 40 queries exist means auditing 40 queries.

**Concepts:**
- **Global scopes**: how Eloquent applies them, and the four ways they are bypassed — `withoutGlobalScopes()`, raw queries, the query builder instead of the model, and relations resolved from an already-loaded parent
- **A trait as the contract**: automatic `tenant_id` on create, automatic filter on read, and a failure mode when there is no current tenant
- **Defence in depth**: the application scope is the convenience; a composite index and a foreign key on `(tenant_id, id)` is the guarantee. Consider what PostgreSQL row-level security would add.
- **Unique constraints under tenancy** — every unique index you wrote in step 2 is now wrong, because uniqueness is per tenant
- **Route model binding** is a leak: an id from the URL resolves a model *before* your controller runs
- **Writing the leak test** — enumerate models, not endpoints, so a new model added later fails the suite by default
- What "fail closed" means: no tenant in context must throw, never quietly return everything

**Libraries:** none new — a trait, a scope, and a test that walks your own models

**Expected outcome:** A `BelongsToTenant` trait applied to every tenant-owned model, `tenant_id` on every such table with a composite index, all unique constraints rewritten to include `tenant_id`, and a leak-sweep test that discovers models by reflection rather than by a hand-written list.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — for every model implementing the tenant contract: create a row for tenant A and a row for tenant B, act as tenant A, and assert that listing, finding by id, counting, and route model binding all exclude B's row. A new model without the trait must make this test fail. |
| **L2 — Manual checks** | (a) Grep for `DB::table(`, `->withoutGlobalScopes(`, and raw SQL. Every hit is a place the scope does not apply — justify each one in writing. <br>(b) Take one endpoint and run it with the scope disabled. Confirm your test actually catches it. A leak test that never fails proves nothing. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and adding a tenant-owned model without the trait fails CI |

**Harness impact:** `AGENTS.md` v3 — the rule that every new tenant-owned model gets the trait, every unique index includes `tenant_id`, and raw queries need a written justification.

---

## Step 7 — Tenant context outside the request

**Story:** *As a business owner, my reminder emails and exports contain only my data, even though they are produced hours after anyone was on the site.*

**Mode:** `LEARN` — the failure here is invisible in development, where there is only one tenant.

**Why now:** Step 18 puts real work on queues. If tenant context does not survive the trip to a worker, every queued job is a leak waiting for your second customer.

**Concepts:**
- **Why context is lost**: the container binding lives for one request; a queued job runs in a different process, minutes later, with no request at all
- **Serialising the tenant into the job**, and why serialising the whole model is worse than serialising its id
- **The middleware pattern for jobs** — set the tenant, run, then *always* clear it, including on failure
- **Cache keys**: a key without the tenant in it serves one business's data to another. This is the most common multi-tenant production bug there is.
- **Filesystem paths** — uploads, exports, generated PDFs, all under a tenant prefix
- **Mail and notifications**: the from-address, the reply-to, and the branding all come from the tenant, not from config
- **Scheduled commands** run with no tenant at all — the loop-over-tenants pattern, and why it must isolate failures per tenant
- **Broadcasting channels** must be tenant-scoped and authorised, or step 19 broadcasts one business's bookings to another

**Libraries:** framework queues, cache, filesystem; `pestphp/pest` for the context tests

**Expected outcome:** A job middleware that establishes and tears down tenant context, a tenant-aware cache key helper, tenant-prefixed storage paths, a `foreach tenant` scheduled-command runner with per-tenant error isolation, and tenant-scoped broadcast channel names.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — dispatch a job as tenant A and a job as tenant B onto the same worker, in that order, and assert each wrote only to its own tenant. Then run a job that throws, and assert the next job on the same worker still has the correct tenant. |
| **L2 — Manual checks** | (a) Read every `Cache::` call in the codebase and name the tenant part of the key. Any that has none is a live bug. <br>(b) Run the scheduler with two tenants where the first throws. The second must still run. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and no cache key, storage path, or channel name is missing the tenant |

---

## Step 8 — The tenant back-office (Livewire)

**Story:** *As a business owner, I can set up my services, staff and opening hours myself, so that I do not have to ask anyone to configure my account.*

**Mode:** `BUILD` — CRUD screens. Let the agent generate, then review against your policies.

**Why now:** You need a way to create realistic data before building the availability engine. Seeders are fine for tests and useless for judging whether the model is right.

**Concepts:**
- **Why server-rendered for internal CRUD**: a back-office is forms and tables; Livewire keeps state on the server and skips the API layer entirely. This is a permanent choice, not a stepping stone to an SPA.
- **Livewire 4 components**: properties, actions, the request round-trip, and what actually goes over the wire
- **Validation in a component** vs a form request — the same rules, a different entry point
- **`wire:model` and its variants** — live, blur, debounce — and the cost of each in requests per keystroke
- **Authorisation in components**: a mounted component is a controller; it needs the same policy check
- **Tenant-scoped file uploads** — the temporary-file path is a leak if the prefix is missing
- **A small design system first**: tokens, then components, then screens. Three colours and one spacing scale beat a template you did not choose.
- Tables with sorting, filtering and pagination — where Livewire is fast and where it is not

**Libraries:** Livewire 4, Tailwind 4, Vite

**Expected outcome:** A back-office behind tenant + membership middleware: onboarding (business profile, timezone, slug), services CRUD, staff CRUD with invitations, weekly working hours and time off. A design tokens file and a handful of shared Blade components — button, input, table, modal — that every screen uses.

```text
resources/views/
├── components/     the design system: button, field, table, modal
└── back-office/    one directory per area
app/Livewire/       one component per screen, thin, delegating to services
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — a Livewire test that creates a service, edits it, and deletes it as an owner; then asserts a staff-role user is forbidden from each write action while still able to read. |
| **L2 — Manual checks** | (a) Open the network tab and type in a filter field. Count the requests. If it is one per keystroke, fix the binding. <br>(b) Set the tenant's timezone to something far from yours and confirm every displayed time changes. If nothing changes, step 10 has work waiting. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and you can set up a plausible business end to end without touching the database |
