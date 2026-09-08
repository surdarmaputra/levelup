---
title: Correctness Under Load
description: Steps 11–14. Rate limits and fairness, per-key ordering, circuit breaking, observability.
sidebar:
  order: 4
---

Four steps that separate a demo from a service. Everything here is about what happens when one
subscriber behaves badly and the other two must not notice.

---

## Step 11 — Rate limits and fairness

**Story:** *As Kirana Ledger, my deliveries go out on time even while Meridian is rate-limiting Relay and Pixel Forge is timing out on every attempt.*

**Mode:** `LEARN` — fairness is a scheduling problem. The obvious implementation starves somebody, and you should find out which one by building it.

**Why now:** Retries exist, so the traffic that a limit has to shape now exists too. And the isolation problem has to be solved before the dashboard, or the dashboard will just be a nice view of a starved queue.

**Concepts:**
- Token bucket, and why it is the right shape here: it allows a burst and then a steady rate, which is what receivers actually document
- `golang.org/x/time/rate`: `Limiter`, `Wait`, `Allow`, `Reserve`, and which one is safe inside a worker
- **Blocking a worker on a limiter is a trap.** A worker waiting 30 seconds for a Meridian token is a worker not delivering to Kirana. Options: check first and reschedule the delivery instead of waiting, or give each endpoint its own bounded lane.
- Head-of-line blocking, defined: one slow item at the front stops everything behind it, even work with nothing in common
- Per-endpoint limiter state in a `map[uuid.UUID]*rate.Limiter` guarded by a mutex — and the eviction question a long-lived map always raises
- Fair claiming: a claim query ordered only by `available_at` hands one busy endpoint every slot. Round-robin, per-endpoint caps in the claim query, or a limit on in-flight deliveries per endpoint — pick one and justify it.
- Concurrency caps per endpoint, separate from the rate limit: "at most 4 in flight to this host"
- What this looks like from step 18's angle: two instances each holding half the tokens is not the same limit

**Libraries:** `golang.org/x/time/rate`.

**Expected outcome:** Per-endpoint rate limits and in-flight caps, enforced without a worker parking on a limiter. The claim query changed so no single endpoint can take every slot. Metrics for deliveries deferred by a limit.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — queue 500 deliveries for Meridian (5 rps, every request answered `429`) and 20 for Kirana. Assert every Kirana delivery completes within 5 seconds of being queued, that Meridian's outbound rate never exceeds 5 per second in any one-second window, and that no worker is blocked for more than one delivery's duration. |
| **L2 — Manual checks** | (a) Remove the fairness rule from the claim query, rerun, and measure how long Kirana waits. Write the number down. <br>(b) Watch the in-flight count per endpoint while the test runs and confirm the cap holds. <br>(c) Delete an endpoint while its limiter is in the map, and check what removes the entry. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, no worker blocks on a limiter, and `context.Background()` appears nowhere outside `main` |

---

## Step 12 — Ordered delivery, and what it costs

**Story:** *As Pixel Forge Studio, events for one render job arrive in the order they happened — `render.started`, then every `render.frame`, then `render.finished` — even when one of them has to be retried.*

**Mode:** `LEARN` — ordering is the step where a design that was fine for eleven steps stops being fine. Do it yourself.

**Why now:** It has to come after retries and rate limits, because ordering conflicts with both. A retry of event 1 must hold back event 2, and that is precisely the head-of-line blocking you spent step 11 removing. Meeting the conflict is the lesson.

**Concepts:**
- Ordering is per key, never global. `ordering_key` on the event — for Pixel Forge that is the `job_id`.
- The claim query gains a rule: do not claim a delivery whose key already has an older undelivered delivery for the same endpoint
- Serialization per key, parallelism across keys. Ten thousand jobs still run wide; one job runs single-file.
- **The head-of-line decision, stated plainly.** When `render.started` fails and enters a six-hour backoff, `render.frame` behind it either waits (order preserved, throughput lost) or goes anyway (order broken). There is no third answer. Pick one per endpoint, make it a column, and document it.
- What a dead-lettered event does to the keys behind it — do they release, or stay blocked forever? Both are defensible; unhandled is not.
- Why ordering across two instances needs no coordination if the claim query enforces it, and how that breaks the moment you cache the decision in memory
- Cost: measure the throughput of ordered versus unordered delivery on the same data and write the number in the README

**Libraries:** none new.

**Expected outcome:** An `ordering_key` on events, an `ordered` flag on endpoints, a claim query that respects both, and a documented policy for what happens when an ordered delivery dead-letters. Ordered and unordered throughput both measured.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — 3 render jobs × 20 events each, interleaved into the queue, delivered to an ordered endpoint by 8 workers, with the receiver failing the 5th event of job 2 twice before accepting. Assert that within each `job_id` the receiver saw the events in sequence with no gaps, that events for the other two jobs were not delayed by job 2's retries, and that the test is clean under `-race`. |
| **L2 — Manual checks** | (a) Run the same 60 events against an unordered endpoint and compare total time. That ratio is the price of ordering. <br>(b) Force the blocked event into the dead-letter state and confirm the rest of the job does whatever your documented policy says — then check the dashboard would show why. <br>(c) Run two dispatchers against one ordered endpoint and confirm ordering still holds. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green with two dispatchers, and the ordering policy is written down where a customer could read it |

---

## Step 13 — Endpoint health and circuit breaking

**Story:** *As the platform, when an endpoint has been failing for an hour I stop spending workers on it every few seconds, and I notice within a minute of it coming back.*

**Mode:** `LEARN` — a breaker with the wrong thresholds is worse than none, because it takes a healthy endpoint offline and you trust it while it does.

**Why now:** After retries and rate limits, because a breaker is the coarse control that sits above both. Before observability, so that step 14 has a state worth exposing.

**Concepts:**
- The three states — closed, open, half-open — and what each does to a delivery attempt
- Choosing a trip condition: consecutive failures, a failure ratio over a window, or a rolling error rate. Consecutive failures is the simplest thing that works; know why you might outgrow it.
- Half-open as a probe: let exactly one delivery through, and what "exactly one" costs in coordination across two instances
- Breaker state in the database rather than in memory, so both instances agree and a restart does not reset it
- The interaction with backoff: a breaker is not a substitute for it. Backoff spaces out one delivery's attempts; a breaker stops spending *workers* on an endpoint that is clearly down.
- Endpoint auto-disable after a long outage, notification, and manual re-enable
- What Pixel Forge's six-hour tunnel outage should look like on the dashboard: one open breaker, not four thousand failing attempts

**Libraries:** none new — write the breaker. It is a state machine with three states, and an imported one will not know about your database.

**Expected outcome:** A per-endpoint breaker with database-backed state, wired into the claim path so an open breaker's deliveries are not claimed at all. Automatic half-open probing. An endpoint status visible via the API.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — using `synctest`: an endpoint failing every request trips the breaker after the configured number of consecutive failures; while open, no further deliveries are attempted for the cooldown; after the cooldown exactly one probe goes out; a failed probe reopens without letting others through; a successful probe closes the breaker and the backlog drains. Assert total attempt count against the expected number, not a range. |
| **L2 — Manual checks** | (a) Take Pixel Forge's receiver down for six simulated hours and count the attempts made. Compare with the same run with the breaker disabled. <br>(b) Run two dispatchers and confirm that a half-open probe is one request in total, not one per instance. <br>(c) Check that Kirana's and Meridian's deliveries are untouched throughout. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, breaker state survives a restart, and an open breaker costs no workers |

---

## Step 14 — Observability: logs, metrics, profiles

**Story:** *As an on-call engineer, I can answer "why did this delivery fail" and "what is slow right now" without adding a print statement and redeploying.*

**Mode:** `BUILD` — mostly wiring. Generate it, then check that every metric answers a question you would actually ask.

**Why now:** After the behaviour is complete and before production. Instrumenting a finished system takes an afternoon; instrumenting a system you are still redesigning wastes the afternoon twice.

**Concepts:**
- Structured logging with `slog`: fields not sentences, so `delivery_id=… endpoint=… status=503` is greppable
- **Correlation IDs across goroutines.** An ID assigned at ingest travels on the `context`, into the queue row, into the worker, into the outbound request header, and into every log line. Without it, concurrent deliveries produce interleaved logs nobody can read.
- `slog.Handler` and a small middleware that puts the logger on the context, plus the rule about which fields must never be logged (secrets, signatures, full payloads)
- Log levels that mean something: a failed delivery attempt that will be retried is not an error
- The four metrics that matter here — queue depth by state, delivery attempts by outcome, delivery duration histogram by endpoint, and breaker state. Everything else is optional.
- Counters versus gauges versus histograms, and label cardinality: a label per endpoint is fine, a label per delivery ID will take your metrics system down
- `net/http/pprof`: heap, goroutine and CPU profiles. The goroutine profile is the one that tells you about a leak.
- Reading a goroutine profile while Pixel Forge is down — this is the concrete skill

**Libraries:** `github.com/prometheus/client_golang`, standard `log/slog` and `net/http/pprof`. `govulncheck` joins CI in this step.

**Expected outcome:** A correlation ID from ingest through to the outbound request header. A `/metrics` endpoint with the four metrics. `pprof` on an internal listener, never on the public one. A short `docs/runbook.md` naming the three things to check first when deliveries stop.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — a delivery is ingested and delivered; the test asserts that the same correlation ID appears in the ingest log line, the worker log line, the outbound request header the receiver saw, and the attempt row. Plus: after a run of 50 deliveries with 10 failures, the attempts counter shows exactly 50 with the outcome split 40/10. |
| **L2 — Manual checks** | (a) With Pixel Forge's receiver hanging, take a goroutine profile and find how many goroutines are parked on delivery. <br>(b) Grep the logs for a secret or a signature. Finding one is the failure. <br>(c) Check `/metrics` label cardinality with 5,000 deliveries queued — the series count must not grow with delivery count. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, `pprof` is not reachable from the public listener, and the runbook exists |

**Harness impact:** `AGENTS.md` **v3** — every new handler and worker gets a correlation ID and a metric; the list of fields that must never be logged; the label-cardinality rule.
