---
title: Scale and Migration
description: Steps 19–23. The public booking page, the public API, the Connect migration, database per tenant, and deployment.
sidebar:
  order: 6
---

The last five steps put the product in front of real customers, then change two decisions you
made earlier. The migrations are the point: changing a payment integration and a tenancy model
on code that already works is the job.

---

## Step 19 — The public booking page (Inertia + React + Reverb)

**Story:** *As someone who needs a haircut, I pick a barber and a time on one page, and I see a slot disappear the moment someone else takes it.*

**Mode:** `BUILD` — a real frontend. Generate freely, review the state handling.

**Why now:** Availability, holds, concurrency and deposits all work. The page is now a client for finished behaviour rather than a driver of half-built behaviour.

**Concepts:**
- **Why an SPA here and Livewire there**: this page has genuine client state — a selected service, a chosen slot, a hold countdown, a payment step. The back-office does not.
- **Inertia 2**: no separate API for the page's own data, server-side routing, and how props reach the component. What it is *not* — it is not a REST client.
- **TypeScript on the boundary**: typing the props your controller sends, so a renamed field fails at build time
- **Client state discipline** — server data, form state, and UI state are three different things; conflating them is where SPA bugs live
- **Timezone display**: the customer's browser timezone vs the business's, and saying which one is on screen
- **The hold countdown**: a timer the server does not trust. The client shows it; the server enforces it.
- **Reverb and broadcasting**: private, tenant-scoped channels (step 7), a `SlotTaken` event, and what the page does when a slot it is showing disappears
- **Optimistic UI, and when not to** — never for taking a slot
- Accessibility and mobile: most bookings come from a phone

**Libraries:** Inertia 2, React 19, TypeScript, Vite, Tailwind 4, `laravel/reverb`, Laravel Echo

**Expected outcome:** A public booking flow — service, staff, date, slot, details, deposit, confirmation — with a hold countdown, live slot updates over Reverb on a tenant-scoped private channel, typed props, and a graceful path when the hold expires or the slot is taken while the page is open.

```text
resources/js/
├── Pages/Booking/    one page component per step of the flow
├── components/       shared UI
└── types/            generated or hand-written prop types
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-19` — an end-to-end browser test books a slot from the public page and asserts the booking exists in the correct tenant with the correct instant. A second test opens the same page in two sessions, takes the slot in one, and asserts the other removes it without a reload. |
| **L2 — Manual checks** | (a) Open Northside's page on a phone. Complete a booking one-handed, standing up. That is how this page is actually used. <br>(b) Book a Loft Yoga class with your browser timezone set to another continent and confirm the page says which timezone the times are in. <br>(c) Let a hold expire with the page open. What the customer sees must be honest. |
| **L4 — Anti-patterns** | `AP-19-a`, `AP-19-b`, `AP-19-c`, `AP-19-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-19` green, and no broadcast channel can be subscribed to across tenants |

---

## Step 20 — The public API and token authentication

**Story:** *As a dental practice with our own website, I connect it to Bookline with an API key, so that patients book from our site instead of being sent somewhere else.*

**Mode:** `BUILD` — the contract is mostly settled by step 3.

**Why now:** The domain is stable. Publishing an API before the model settled would mean breaking it in public.

**Concepts:**
- **Sanctum tokens vs session auth**: two guards, two threat models, one application. Which routes use which, and why.
- **Token abilities** — a read-only availability token is not the token that creates bookings
- **Per-tenant API keys**: issuing, listing, revoking, and showing the secret exactly once
- **Rate limiting**: per token, not per IP; a stricter limit on writes; and the headers that let a client behave well
- **CORS** — what a business's own website needs, and why `*` is not the answer
- **Versioning and deprecation**: what `/api/v1` promised, and how a v2 arrives without breaking v1
- **Documentation as a deliverable** — an OpenAPI document that is generated from, or tested against, the real routes
- **Abuse cases**: enumerating customers, scraping availability, booking spam

**Libraries:** `laravel/sanctum`, the framework rate limiter, an OpenAPI generator of your choice

**Expected outcome:** A tenant-scoped API-key screen in the back-office, token abilities, a public read API for services and availability, a write API for bookings, per-token rate limits with correct headers, a CORS policy, and an OpenAPI document checked in CI against the routes.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-20` — a read-only token is refused on the booking-create endpoint with 403; a token from tenant A cannot read tenant B's availability; exceeding the rate limit returns 429 with the retry headers; a revoked token returns 401 immediately. |
| **L2 — Manual checks** | (a) Call the API from a plain HTML page on another origin and read the CORS failure before fixing it. <br>(b) Hand the OpenAPI document to a developer who has not seen the app and ask them to book an appointment with it. |
| **L4 — Anti-patterns** | `AP-20-a`, `AP-20-b`, `AP-20-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-20` green, and the OpenAPI document is verified in CI rather than maintained by hand |

---

## Step 21 — Payments migration: BYO keys → Stripe Connect

**Story:** *As a tattoo studio taking deposits, I onboard once and the platform's fee is taken automatically, so that I do not have to manage my own gateway keys.*

**Mode:** `LEARN` — a migration of live behaviour. The reasoning matters more than the code.

**Why now:** BYO keys work end to end. Only now can you see what Connect actually replaces, and what it costs you.

**Concepts:**
- **What Connect changes**: the platform becomes part of the money flow. Onboarding, identity verification, and a payout schedule you did not previously have.
- **Account types** and what each demands of the business and of you
- **Charge shapes** — direct, destination, and separate charges and transfers; who appears on the customer's statement, and who bears the dispute
- **Application fees**: the platform's revenue on a payment, and the reporting that follows
- **Onboarding is asynchronous**: an account is not ready when the link returns. Requirements arrive by webhook, sometimes days later.
- **Running both models at once**: a feature flag per tenant, both code paths live, and a payment adapter interface that makes the difference small
- **Migrating tenants** in batches, with a rollback that does not strand an in-flight payment
- **What you have taken on**: disputes, refunds against payouts, and reporting obligations. Name them even though this project does not solve them.

**Libraries:** `stripe/stripe-php` Connect APIs, a payment adapter interface of your own

**Expected outcome:** A payment adapter interface with two implementations (BYO keys, Connect), a per-tenant flag, a Connect onboarding flow that handles the incomplete-account state, destination charges with an application fee, webhook handling for account requirement changes, and a written migration and rollback plan.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-21` — the same booking-with-deposit test passes against both adapters, selected by the tenant flag. A tenant whose Connect onboarding is incomplete cannot require deposits and sees an accurate reason. |
| **L2 — Manual checks** | (a) Complete Connect onboarding in test mode and read the requirements payload before and after. <br>(b) Take a payment on each adapter and compare the fee breakdown. <br>(c) Write the rollback: a tenant migrated at 10:00 with a payment in flight at 10:01 — what happens? |
| **L4 — Anti-patterns** | `AP-21-a`, `AP-21-b`, `AP-21-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-21` green, and nothing outside the adapter knows which model a tenant is on |

---

## Step 22 — Tenancy migration: shared database → database per tenant

**Story:** *As a dental group, our patient data lives in its own database, so that our compliance review can be answered honestly.*

**Mode:** `LEARN` — the second migration, and the more dangerous one.

**Why now:** You have lived with the shared-schema model for 17 steps, including at least one leak that your own test caught. Only now can you judge what per-database isolation is worth.

**Concepts:**
- **The trade honestly stated**: shared schema is cheap to run, cheap to migrate, and one forgotten scope away from a breach. Per-database isolation removes that class of bug and hands you N migrations, N backups, N connection pools, and cross-tenant reporting that no longer works with a single query.
- **What `stancl/tenancy` does** — connection switching, bootstrappers for cache, filesystem and queues, and tenant-aware migrations. Map each feature onto the thing you hand-rolled in steps 5–7.
- **Central vs tenant tables**: tenants, users, subscriptions and platform admin stay central. Everything else moves.
- **Migrating existing data** — copying a tenant out of the shared database, verifying it, then cutting over, with the tenant readable but not writable during the copy
- **Connection pool arithmetic**: 500 tenants × a connection each is not a plan
- **Cross-tenant reporting after the split**: an aggregate table written on the way through, or a job that visits every tenant
- **Provisioning and deprovisioning**: creating a database on sign-up, and deleting one on account closure — including the backup you keep and the deadline for deleting it
- **Keeping both models alive** during the transition, and how the tests prove both

**Libraries:** `stancl/tenancy` v3, PostgreSQL administration

**Expected outcome:** The package installed alongside your hand-rolled model, a `tenancy_mode` per tenant, tenant-database provisioning, a migrate-one-tenant command with verification and cut-over, per-tenant migrations in CI, an updated backup and restore procedure, and a decision record comparing the two models with the numbers you measured.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-22` — the entire existing test suite passes against both tenancy modes. Migrating a seeded tenant to its own database preserves every row, and afterwards a query as that tenant reaches only its own database — asserted on the connection, not by trusting the scope. |
| **L2 — Manual checks** | (a) Migrate one tenant while another is taking bookings. Nothing may be lost on either side. <br>(b) Run the per-tenant migration command against 20 tenants where number 11 fails. What is the state of 12–20, and how do you resume? <br>(c) Restore one tenant's database from backup without touching the others. |
| **L4 — Anti-patterns** | `AP-22-a`, `AP-22-b`, `AP-22-c`, `AP-22-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-22` green in both modes, and your decision record says which model you would choose for the next project, and why |

---

## Step 23 — Observability and production deployment

**Story:** *As the operator, I can tell within a minute whether bookings are failing right now, and for which tenant.*

**Mode:** `BUILD` — configuration and infrastructure. Then read every dashboard you created and ask what it does not tell you.

**Why now:** Deploying earlier would have meant deploying something incomplete; deploying later means never doing it. A product that is not deployed is not finished.

**Concepts:**
- **Structured logging**: JSON logs with a request id, a tenant id, and a user id on every line — and never a secret or a customer's personal data
- **Correlation across boundaries** — the id follows the request into the job, and into the outbound payment call
- **The four signals that matter here**: booking failure rate, queue wait time, availability query latency, webhook processing lag. Per tenant where it makes sense.
- **Errors vs exceptions**: an expected 409 is not an alert; a 500 is
- **Health checks** — liveness, readiness, and a check that says the queue workers are alive, because the site can be perfectly healthy while nothing is being processed
- **Deployment on one VPS**: nginx, PHP-FPM, a queue worker service, the scheduler, zero-downtime symlink switching, and the drain sequence from step 18
- **Migrations on deploy** — the ones that are safe to run before the new code, and the ones that are not
- **Backups you have tested by restoring**, which is the only kind that exists
- **Managed alternatives** named and not used: Forge, Vapor, Laravel Cloud. Know what you are choosing against.

**Libraries:** Monolog with a JSON formatter, an error tracker of your choice, Horizon metrics, nginx, supervisor or systemd

**Expected outcome:** Structured logs with request, tenant and correlation ids; the four signals visible somewhere you would actually look; an alert on booking failure rate and on queue depth; a deploy script that is zero-downtime and drains workers; a restore rehearsed at least once; and a runbook covering the three failures you consider most likely.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-23` — a failing booking request produces a log line carrying request id, tenant id and correlation id; the queued job it triggers carries the same correlation id. A deploy performed while a booking is in flight loses nothing. |
| **L2 — Manual checks** | (a) Break something deliberately in production-like conditions and time how long it takes you to identify the tenant affected. <br>(b) Restore the database from a backup into a scratch environment and open the app against it. <br>(c) Read one day of logs and confirm no personal data or secret appears. |
| **L4 — Anti-patterns** | `AP-23-a`, `AP-23-b`, `AP-23-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-23` green, the app is deployed and reachable, and your runbook has been used at least once |

---

## After step 23

The product works, is deployed, and has been migrated twice. What is deliberately not here is
listed in [Deliberate Omissions](../../reference/omissions/) — read it before deciding what to
build next. Two honest options:

- **Take it further as a product.** Group bookings, resources other than staff (rooms, chairs, equipment), a customer-facing account, multi-location businesses.
- **Take it further as engineering.** Read replicas, a reporting database, per-tenant rate limits, and the packages you deliberately avoided.

Either way, write down what you would do differently. That document is worth more than the code.
