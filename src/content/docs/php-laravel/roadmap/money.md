---
title: Money and Async
description: Steps 14–18. Subscriptions, webhooks, per-tenant payment credentials, deposits and refunds, queues.
sidebar:
  order: 5
---

Two money flows live in this product and they are not the same thing:

- the **business pays you** a monthly subscription to use the platform (steps 14–15)
- the **customer pays the business** a deposit when booking (steps 16–17)

Everything in this section runs in Stripe **test mode**. Never put live keys in a learning
project.

---

## Step 14 — Subscriptions: plans, trials, and plan limits

**Story:** *As a business owner, I start a free trial and pick a plan when it ends, so that I can try the platform before committing.*

**Mode:** `BUILD` — Cashier does the plumbing. Your judgement goes into the limits.

**Why now:** Tenancy exists, so there is something to attach a plan to. Doing it before tenancy would have meant subscribing a user rather than a business.

**Concepts:**
- **Subscription lifecycle**: trialing, active, past due, cancelled, and the grace period at the end of a paid month
- **What Cashier gives you** and what it leaves to you — it manages Stripe state, not your product rules
- **Plan limits as product rules**: staff seats, services, bookings per month. Where the check lives, and what happens to data that already exceeds a new, lower limit.
- **Downgrade is the hard direction**: the customer has 10 staff and moves to the 3-staff plan. Block, soft-lock, or archive? Decide and write it down.
- **Proration** — what changes mid-cycle actually cost, and why you should not reimplement Stripe's arithmetic
- **The billing portal**: hosted checkout and hosted portal over hand-built card forms, and the PCI reason why
- **Test mode discipline**: test clocks for trial expiry, and the card numbers that force each failure

**Libraries:** `laravel/cashier` (Stripe), Stripe test mode, Stripe CLI

**Expected outcome:** Plans defined in config, hosted checkout and portal wired up, a trial on tenant creation, subscription state on the tenant, plan-limit enforcement at the point of action, and a clear, tested downgrade policy.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — a tenant on the 3-staff plan is refused the fourth staff member with a 402-or-403 and a message naming the limit; on upgrading, the same action succeeds. Using a Stripe test clock, a trial that ends without a payment method moves the tenant to the restricted state, and no bookings are lost. |
| **L2 — Manual checks** | (a) Walk checkout end to end with a test card. Then repeat with the card that requires 3-D Secure. <br>(b) Downgrade a tenant that exceeds the new limit and describe, in the UI, exactly what happened to the excess. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and no plan limit is enforced in more than one place |

---

## Step 15 — Webhooks: idempotency, retries, dunning

**Story:** *As the platform, a subscription that fails to renew is retried and then restricted, so that unpaid accounts do not run for free forever.*

**Mode:** `LEARN` — idempotency is the concept, and it is easy to get subtly wrong.

**Why now:** Step 14 created state that only Stripe can change. Until webhooks are correct, your database is a guess about what Stripe believes.

**Concepts:**
- **Webhooks are at-least-once**: the same event will arrive twice. Design for it rather than hoping.
- **Idempotency**: store the provider's event id, and make the handler safe to run again — a unique index is the mechanism, not a `if (already processed)` check with a race in it
- **Out-of-order delivery** — `subscription.updated` can arrive before `subscription.created`. Use the event's own timestamp, not arrival order.
- **Signature verification**, and why an unverified webhook endpoint is a public write API to your database
- **Handle fast, work later**: verify, persist the event, return 200, then process on a queue. A slow handler causes provider retries and duplicate work.
- **Dunning**: the sequence of retries, emails, and the final restriction. What the tenant can still do while past due — reading data is not the same as taking bookings.
- **Reconciliation**: a scheduled job that compares your subscription state with Stripe's and reports differences. Webhooks get lost.

**Libraries:** Cashier's webhook controller, Stripe CLI for local delivery, queues

**Expected outcome:** A verified webhook endpoint, a `payment_events` table with a unique index on the provider event id, queued processing, a dunning sequence with tenant-visible state, and a nightly reconciliation job that reports drift.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — deliver the same webhook payload three times and assert exactly one state change and one email; deliver events out of order and assert the final state matches the latest event by its own timestamp; deliver an event with a bad signature and assert a 4xx and no writes. |
| **L2 — Manual checks** | (a) Replay a real event from the Stripe CLI twice and read your `payment_events` table. <br>(b) Force a failed renewal with the failing test card and watch the whole dunning sequence run. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and replaying any webhook is provably harmless |

---

## Step 16 — Per-tenant payment credentials

**Story:** *As a business owner, I connect my own payment account, so that deposits my customers pay arrive directly to me.*

**Mode:** `LEARN` — this step handles other people's secrets. Do not delegate it.

**Why now:** Deposits in step 17 need somewhere to send the money. This is the "bring your own gateway" model; step 21 replaces it with Stripe Connect, and you will only understand what Connect buys you if you have lived without it.

**Concepts:**
- **Why a platform might not touch the money at all**: no payouts to reconcile, no money-transmitter exposure, no balance to hold. A real product decision, not a shortcut.
- **Encrypting credentials at rest**: Laravel's encrypted casts, what `APP_KEY` protects against and what it does not, and why an encrypted column is not the same as a secret manager
- **Never log a secret** — request logging, exception context, and debug pages all leak
- **Routing one webhook endpoint to many tenants**: the payload carries the connected account or your own metadata; the endpoint must resolve the tenant *before* it does anything, and reject what it cannot resolve
- **Per-tenant client construction** — building the payment client from tenant credentials, and keeping it out of the container as a global singleton
- **Key rotation and disconnection**: what happens to in-flight payments when the business changes keys
- **Failing safe**: a tenant with no payment credentials must not be able to require deposits

**Libraries:** `stripe/stripe-php` directly (Cashier stays on the platform's own account), Laravel encryption

**Expected outcome:** Encrypted per-tenant credentials with a connect/disconnect flow in the back-office, a tenant-resolving webhook endpoint with signature verification per tenant, a per-request payment client factory, and a test proving no secret appears in logs or exception output.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — store credentials for tenants A and B; assert a webhook carrying B's account resolves to tenant B, writes only to B, and that a payload for an unknown account is rejected with no writes. Assert the stored column is unreadable without the app key. |
| **L2 — Manual checks** | (a) Trigger an exception during a payment call with `APP_DEBUG=true` and read the full stack trace and log output. No key fragment may appear anywhere. <br>(b) Disconnect a tenant's account with a pending deposit and describe what your code does. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and a database dump alone gives up no usable credentials |

---

## Step 17 — Deposits, refunds, and the no-show policy

**Story:** *As a business owner, customers who book a chargeable service pay a deposit, so that fewer of them fail to turn up.*

**Mode:** `LEARN` — money plus state transitions. Write the tests first.

**Why now:** The booking state machine (step 11), the concurrency guarantee (step 12), and per-tenant credentials (step 16) all exist. Deposits sit exactly on top of them.

**Concepts:**
- **Where payment sits in the booking flow**: hold → pay → confirm, and what must happen when the payment succeeds after the hold has already expired
- **Payment intents are asynchronous** — the customer's browser and your webhook both report success, at different times, in either order
- **Money arithmetic**: integer minor units, no floats, explicit currency on every amount, and rounding decided once
- **Refunds**: full, partial, and the cancellation window that decides which. Refunds fail too.
- **The no-show flow** — who marks it, what it charges, and how it is disputed
- **Compensation, not rollback**: an external charge cannot be rolled back by a database transaction. If confirmation fails after the charge, the fix is a refund, recorded.
- **Reconciliation**: every deposit in your database maps to exactly one payment at the provider. A nightly job proves it.
- **Receipts and records** — what the business needs to answer a customer's question six months later

**Libraries:** `stripe/stripe-php`, queues, the events from step 11

**Expected outcome:** A deposit policy per service, a payment flow attached to booking confirmation, webhook-driven confirmation with the browser-return path as a fallback rather than the source of truth, refunds on cancellation within policy, a no-show action, and a reconciliation report.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — the payment succeeds but the hold has expired: assert the booking is not confirmed, an automatic refund is issued, and the outcome is recorded. Then: webhook-before-redirect and redirect-before-webhook both end in exactly one confirmed booking and one deposit row. |
| **L2 — Manual checks** | (a) Cancel inside and outside the refund window; check both the customer-visible message and the provider dashboard. <br>(b) Sum deposits in your database and compare with the provider's total for the same period. They must match to the minor unit. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and every recorded amount is an integer with a currency beside it |

---

## Step 18 — Queues, Horizon, and work that must not be lost

**Story:** *As a customer, I get a reminder the day before my appointment, so that I do not forget it.*

**Mode:** `BUILD` — the infrastructure is configuration. Read the retry and failure settings carefully.

**Why now:** Reminders, expiries, webhook processing and reconciliation have all accumulated. They need a real queue, monitoring, and a failure policy.

**Concepts:**
- **Drivers**: database vs Redis, and what changes when you switch
- **Horizon**: what it actually gives you — supervisors, queue balancing, throughput and wait-time metrics, and failed-job visibility
- **Queue priority**: a webhook must not wait behind 4,000 reminder emails. Separate queues, separate workers.
- **Retries, backoff and `$tries`**, and why exponential backoff with jitter beats a fixed delay
- **Idempotent jobs**: a job that is retried after a partial success must not send the email twice. The same discipline as step 15.
- **`ShouldBeUnique`** and its lock timeout — the sharp edge that leaves a job stuck for the whole timeout when a worker dies
- **Failed jobs are a workflow**, not a table you never look at: alerting, a triage habit, and a retry decision
- **The scheduler** — one process, per-tenant loops (step 7), overlapping runs, and `withoutOverlapping`
- **Graceful restart on deploy**: how a worker finishes its job instead of dying mid-charge

**Libraries:** `laravel/horizon`, Redis 8, the scheduler

**Expected outcome:** Redis queues with at least three named queues by priority, Horizon behind platform-admin auth, reminder jobs scheduled per booking with cancellation handling, a hold-expiry sweeper, idempotent job bodies, an alert on failed jobs, and a documented deploy sequence that drains workers.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-18` — a reminder job runs twice and sends exactly one email; a booking cancelled before its reminder sends none; a job that throws lands in `failed_jobs` with enough context to retry it by hand. |
| **L2 — Manual checks** | (a) Queue 1,000 reminders and one webhook job. The webhook must be processed within seconds. If it is not, your queue priorities are wrong. <br>(b) Kill a worker mid-job and watch what happens to that job. Then do it during a deploy restart. |
| **L4 — Anti-patterns** | `AP-18-a`, `AP-18-b`, `AP-18-c`, `AP-18-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-18` green, Horizon shows the queues, and every job body is safe to run twice |

**Harness impact:** `AGENTS.md` v4 — record the queue names and their priorities, the rule that every job is idempotent and carries tenant context, and the deploy drain sequence.
