---
title: Money
description: Steps 14–16. Payments and webhooks, refunds and failed deliveries, the payout ledger.
sidebar:
  order: 5
---

## Step 14 — Payments: charging the customer, and webhooks that arrive twice

**Story:** *As a customer, I pay for my delivery once, so that a retried payment notification never charges me again.*

**Mode:** `LEARN` — webhook idempotency is the same lesson as step 10, with money attached. Write it yourself.

**Why now:** Deliveries work end to end. Charging before that meant charging for a flow that was still changing.

**Concepts:**
- **The money never lives in your database, only the record of it does** — the provider is the source of truth for the charge, you are the source of truth for what it was for
- **Payment intents**: create, confirm, and the states in between. The customer's browser and your server both learn the outcome, at different times and sometimes in the wrong order.
- **Webhook idempotency**: providers deliver at least once. Store the provider's event id, make the insert unique, and let the constraint reject the duplicate — the same lesson as step 8, in a different costume.
- **Signature verification** on every webhook, against the raw body. A JSON-parsed body cannot be verified, which is why the route needs the raw payload.
- **Out-of-order webhooks**: `payment_succeeded` arriving before `payment_created`. Handle them by event type and id, never by arrival order.
- **The dual-write problem**: you charged the card and then the database write failed. Compensate with a recorded refund; never pretend it did not happen.
- **Cash on delivery** — Warung takes cash. A payment method with no provider at all, which stops you from assuming every order has a payment intent.
- **Money as integer minor units with a currency**, one rounding decision in one place

**Libraries:** the Stripe SDK; no framework payment package — the wiring is the exercise

**Expected outcome:** A payment intent created for an order, a webhook endpoint with signature verification and idempotent handling, a `payment_events` table with a unique constraint on the provider event id, and an order that only becomes payable once. Cash orders supported as a first-class payment method.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — deliver the same webhook payload three times: exactly one payment event row, exactly one state change, and the same 2xx response every time. Then deliver `succeeded` before `created` and assert the final state is correct. A payload with a bad signature is rejected with no side effect. |
| **L2 — Manual checks** | (a) Replay a real webhook from the provider's dashboard twice and watch your database. <br>(b) Kill the process between the charge and the local write, restart, and describe exactly what a customer sees. Then fix it. <br>(c) Place a Warung cash order end to end and confirm no code path assumed a payment intent existed. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and the webhook endpoint is safe to point a replay tool at |

---

## Step 15 — Refunds, cancellations, and deliveries that fail

**Story:** *As a merchant, an order that could not be delivered is settled correctly, so that the customer is refunded and the courier is still paid for the trip.*

**Mode:** `LEARN` — the rules here are policy. An agent will invent plausible ones, and they will be wrong.

**Why now:** You have charges (step 14) and failure states (steps 5 and 10). This is where they meet, and where the three merchants stop agreeing.

**Concepts:**
- **Cancellation is not one thing**: before dispatch, after assignment, after pickup. Each costs someone something different, and the policy has to say who.
- **Failed delivery is not cancellation**: the courier went, the parcel came back. Sehat's "nobody was home to show ID" is a failure with a full trip behind it.
- **Refunds are compensating transactions**, recorded as their own entries. Never edit the original charge row.
- **Partial refunds** — Atlas's stop 2 of 3 failed, so two thirds of the goods arrived. What is refunded, and against which line?
- **Idempotent refunds**: the same lesson again. Provider-side idempotency keys exist for exactly this.
- **Policy as data**: cancellation windows and fees per merchant, so Sehat's rule and Warung's rule are two rows, not two branches
- **The asymmetry that surprises people**: the customer's refund and the courier's payment are independent decisions. A failed delivery can refund the customer *and* pay the courier.

**Libraries:** the Stripe SDK (refunds)

**Expected outcome:** Cancellation endpoints for merchant and customer with policy applied by state; a failed-delivery path from the courier API; refunds recorded as their own rows and reconciled against the provider; per-merchant cancellation policy as data. A written policy table in `docs/` — state at cancellation, who cancelled, what is refunded, what the courier is owed.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — a table-driven test over (state × who cancelled × merchant policy) asserting the refunded amount and the courier's entitlement for every combination, including the after-pickup case and Atlas's partial failure. Refund calls are asserted idempotent. |
| **L2 — Manual checks** | (a) Cancel the same order twice, fast, from two windows. Exactly one refund. <br>(b) Reconcile a day of seeded activity: charges minus refunds must equal what the provider says. <br>(c) Read the policy table in `docs/` against the code and find the case neither covers. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and every refund traces to a delivery outcome and a policy row |

---

## Step 16 — The ledger: courier payouts and platform commission

**Story:** *As a courier, I can see exactly what I earned and why, so that I trust the number I am paid.*

**Mode:** `LEARN` — a ledger built as a `SUM()` over orders is the mistake this step exists to prevent.

**Why now:** Deliveries, failures and refunds all exist. Every one of them owes someone something, and until now you have not recorded who.

**Concepts:**
- **Double-entry, in the small**: every movement of money is two entries that sum to zero. It is not accounting theory — it is what makes a mistake *findable*.
- **Append-only, never updated**: a correction is another pair of entries, not an edit. The audit trail is the point.
- **A balance is a derived value**, computed from entries. Cached later if it is slow, never stored as the truth.
- **Money in minor units, one currency per entry**, and rounding decided once — a per-delivery commission of 12.5% on an odd amount has to round somewhere, and the same somewhere every time
- **Idempotent posting**: the entry for one delivery is written once, guarded by a unique key on (job, entry type). Re-running the sweep must not pay twice.
- **Payout batches**: entries accumulate, a batch pays them, and the batch is what the external transfer references
- **What you are deliberately not building**: tax, invoices, and the provider's own payout mechanics. The ledger is yours; moving the money is a service call.
- **Reconciliation as a test**: the platform's balance plus the couriers' balances plus refunds equals what was charged. If it does not, something is wrong, and you want that as a failing test rather than a support ticket.

**Libraries:** none — the ledger is plain tables and plain SQL, on purpose

**Expected outcome:** A `ledger_entries` table (job, party, type, amount, currency, created instant, idempotency key) with entries posted on delivery, failure and refund. Balance queries per courier and for the platform. A payout batch table. A reconciliation query that must balance, asserted in tests.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — over a seeded day covering all three merchants, a delivery, a failed delivery, a partial refund and a cancellation: every entry pair sums to zero, each courier's balance matches a hand-computed figure, and re-running the posting job changes nothing. |
| **L2 — Manual checks** | (a) Post a commission on an amount that does not divide evenly and check where the remainder went. It must go to the same party every time. <br>(b) Try to update a ledger row. It should be difficult on purpose — a database rule or permission, not just a convention. <br>(c) Take one courier's balance and trace it back to individual deliveries by hand. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and the reconciliation query returns zero difference on the seeded data |

**Harness impact:** `AGENTS.md` v3b — money is integer minor units, the ledger is append-only, and every posting carries an idempotency key.
