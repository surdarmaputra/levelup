---
title: Outbound
description: Steps 10–13. HTTP timeouts and backoff, per-connection rate limits, circuit breaking, mapping and schema drift.
sidebar:
  order: 4
---

## Step 10 — Outbound adapters and the timeout you forgot

**Story:** *As the hub, when I call an accounting system that has stopped responding, I give up in seconds rather than holding a worker for the default timeout, so that one slow partner does not consume the whole pool.*

**Mode:** `BUILD` — adapter scaffolding. The timeout values are yours to decide and defend.

**Why now:** Everything so far has been inbound. Deliveries have had nowhere real to go. This is where the hub starts depending on systems that are slower and less reliable than itself.

**Concepts:**
- **No default timeouts.** A missing connect or read timeout means a worker can block for minutes. Twenty workers, one hung partner, and your queue stops. Set both, explicitly, on every call.
- **Connect vs. read timeout** — different failures, different values, and why the read timeout must be shorter than your queue's visibility timeout
- **Outbound idempotency keys**: sending one so the *other* system can deduplicate your retries. You want from your partners exactly what step 6 gave yours.
- Adapter design: one class per external system, plain inputs and outputs, no Eloquent in the signature, so it can be faked in tests without a database
- Authentication shapes you will meet: bearer token, HMAC-signed request, OAuth client credentials with a cached token, and where the token cache lives
- Response handling: a 2xx that contains an error, a 200 with an empty body, and a 201 without the id you needed
- Recording the attempt: request id, status, duration, and a redacted body — enough to debug, never enough to leak

**Libraries:** Laravel HTTP client, Pest with HTTP fakes

**Expected outcome:** An adapter per outbound connection type, with explicit connect and read timeouts, an outbound idempotency key on every non-idempotent request, authentication resolved from the encrypted credential store, and every attempt recorded with timing. Meridian's invoice creation and WhatsApp confirmation both going out for real against a local fake. Cedar's three targets stubbed and wired.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — against a target that never responds, the adapter fails within the configured timeout, records the attempt with its duration, and releases the worker. Assert the elapsed time, not just the failure. |
| **L2 — Manual checks** | (a) Grep every outbound call in the project for an explicit timeout. One without is the bug this step exists to prevent. <br>(b) Point an adapter at a target that returns 200 with an HTML error page. Your code must not treat that as success. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and no HTTP call anywhere in the project relies on a default timeout |

---

## Step 11 — Rate limits, throttling, and someone else's budget

**Story:** *As Harborline's supplier API, I allow 60 requests a minute, and the hub stays inside that without me having to reject anything, so that our integration never gets my account suspended.*

**Mode:** `LEARN` — a generated throttle will be per-process and will not work.

**Why now:** Adapters exist and can now generate load. Step 14 will generate a great deal more of it on a schedule, at night, unattended.

**Concepts:**
- **Their limit, not yours.** Rate limiting here protects the other side. Being throttled is a self-inflicted outage, and being suspended is a client phone call.
- **Distributed rate limiting**: a limiter in process memory is wrong the moment you run two workers. Redis is the shared state.
- Laravel's rate-limited job middleware, and the difference between *delaying* a job and *releasing* it back to the queue
- **Reading the other side's signals**: `429`, `Retry-After`, and vendor-specific remaining-quota headers. Respecting `Retry-After` exactly rather than applying your own backoff on top.
- Token bucket vs. fixed window vs. sliding window — enough to pick one and say why
- **Concurrency limits are separate from rate limits.** "Five at a time" and "sixty a minute" are different constraints and you may need both.
- Fair sharing: one connection's backlog must not starve another's live traffic

**Libraries:** Redis, framework rate limiting and job middleware

**Expected outcome:** A per-connection rate limiter backed by Redis, configured as connection data. Jobs released rather than failed when the limit is reached. `Retry-After` honoured when the other side sends it. A concurrency cap per connection. A test proving that two workers running at once still respect a single shared limit.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — with a limit of 10/minute and 40 queued jobs across two workers, assert no more than 10 requests reach the target in the first minute and none are lost. |
| **L2 — Manual checks** | (a) Run the same test with the limiter in process memory instead of Redis, with two workers. Watch it break; that is why Redis. <br>(b) Make the fake target return `429` with `Retry-After: 30` and confirm you wait 30 seconds, not your own backoff. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and every outbound connection has a limit recorded even if it is generous |

---

## Step 12 — Circuit breaking and degrading on purpose

**Story:** *As an operator, when a partner has been failing for five minutes the hub stops calling it and says so, so that we are not burning workers on requests we know will fail.*

**Mode:** `LEARN` — the thresholds are judgement, and the half-open state is where generated implementations get it wrong.

**Why now:** Retries and rate limits are in place; both assume the other side will eventually answer. A circuit breaker is what you do when it will not, and it changes what "failed" means for everything downstream.

**Concepts:**
- **The three states**: closed, open, half-open. What each one does with a request, and why half-open must admit exactly one probe rather than everything at once
- Thresholds that mean something: failures in a window, not failures in a row, and a minimum request count so one failed call at 03:00 does not open the circuit
- **Fail fast vs. queue up.** An open circuit can reject immediately or park work for later — the right answer differs for Meridian's WhatsApp confirmation and Cedar's payment ledger, and you must decide per connection.
- Shared state again: a breaker per process is a breaker that does not work
- **Degrading deliberately**: which parts of each business's flow can be skipped, which must be queued, and which must stop the whole flow
- What the operator sees: an open circuit is a first-class status, not an error count
- Recovery: how the circuit closes, and how you avoid closing it into the same overload you just escaped

**Libraries:** Redis, your adapter layer from step 10

**Expected outcome:** A circuit breaker per connection with configured window, threshold, minimum volume and cooldown, backed by Redis. Open-circuit behaviour chosen per connection (reject, or park). The connection health from step 1 now reporting circuit state. A test covering all three states including exactly-one-probe in half-open.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — after the configured failure threshold, further calls fail immediately without reaching the target; after the cooldown exactly one probe is admitted; a successful probe closes the circuit and a failed one reopens it. |
| **L2 — Manual checks** | (a) Open Cedar's circuit and confirm the payment events park rather than being dropped, while Meridian's WhatsApp confirmations are skipped. If both behave the same way, you have not made the decision this step asks for. <br>(b) Watch the health endpoint while the circuit opens. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and every connection has a documented answer to "what do we do when this is down?" |

---

## Step 13 — Mapping, schema drift, and contract tests

**Story:** *As an operator, when a partner quietly adds a required field or renames one, the hub tells me on the first message rather than corrupting a week of data, so that the fix is an afternoon and not an archaeology project.*

**Mode:** `LEARN` — this is where the difference between a script and a system shows.

**Why now:** Data now flows in both directions. Before adding batch volume in step 14, the translation layer between their shape and yours needs to be a real thing with real failure behaviour.

**Concepts:**
- **The mapping layer as a boundary.** Their shape never reaches your domain, and your shape never reaches their API. One translation class per direction per connection, tested in isolation.
- **Schema drift**: fields added, removed, renamed, retyped, or newly nullable. Which of these you can survive silently, and which must fail loudly.
- **Fail loud on the first message, not the thousandth.** A missing field that maps to `null` becomes a database full of nulls nobody notices until reporting is wrong.
- Tolerant reading vs. strict validation, and where each belongs — tolerant at the edge for fields you do not use, strict for the fields you do
- **Contract tests** against recorded real payloads: capture a genuine response once, assert your mapper still handles it, and treat a change as a build failure
- Versioning a mapper when the partner versions their API, and running both during a transition
- Value objects for the things that matter — money with a currency, an instant with a timezone, an external id with its namespace

**Libraries:** Pest, recorded fixtures

**Expected outcome:** A mapper per direction per connection, taking and returning value objects, with no framework or Eloquent dependency. Strict validation for used fields, tolerance for unused ones. Recorded payload fixtures for all three businesses, including Harborline's supplier who quotes in a different currency. A drift test that fails when a fixture no longer maps. A quarantine path for a message that cannot be mapped, ready for step 16 to give it a screen.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — a payload missing a required field is rejected with a specific, named error and nothing is written; a payload with an unknown extra field maps successfully; a payload with a renamed field fails the drift test rather than mapping to null. |
| **L2 — Manual checks** | (a) Take Harborline's foreign-currency supplier fixture and follow the money through your mapper. If a currency is assumed anywhere, find it and fix it. <br>(b) Delete a field from a fixture and run the suite. The failure message must name the field. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and no external field name appears anywhere outside a mapper |
