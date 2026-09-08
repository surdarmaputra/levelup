---
title: Production
description: Steps 18–19. Two instances, graceful drain, Docker, load test, and the README that sells the repository.
sidebar:
  order: 6
---

Two steps. The first proves the design survives a second copy of itself; the second turns the
repository into something a stranger can run and judge.

---

## Step 18 — Two instances

**Story:** *As the platform, I run two copies of Relay behind a load balancer, and every guarantee from steps 8 through 13 still holds.*

**Mode:** `LEARN` — this is where in-memory shortcuts taken earlier come due. Finding them yourself is the step.

**Why now:** Everything is built, so everything can be tested against a second instance at once. Doing this earlier means re-doing it after every feature.

**Concepts:**
- What is already safe and why: the queue claim is transactional, the retry schedule is a database column, the breaker state is a row. Each was chosen in its own step with this moment in mind.
- What is not safe, and finding it: the per-endpoint rate limiter is in memory. Two instances with 5 rps each deliver 10 rps to Meridian. Options — halve each instance's limit (simple, wrong when one instance dies), move the token bucket into Postgres (correct, a write per delivery), or accept the drift and document it. Pick one and defend it.
- The half-open breaker probe with two instances: without coordination both probe at once. A conditional update on the breaker row is enough — no leader election, no consensus library.
- Connection-pool arithmetic: instances × pool size must stay below Postgres `max_connections`, with room for migrations and your own `psql`.
- No leader election anywhere in this design. Say why in the README — it is a real design decision and interviewers ask about it.
- **Graceful drain end to end**: the load balancer stops sending traffic, the API finishes in-flight requests, the dispatcher stops claiming, workers finish their current delivery, uncommitted claims are released, and the process exits inside the deadline. Everything from step 3 onward joins this sequence.
- SIGTERM handling under Docker and what happens when the deadline passes
- Running migrations safely when two instances start at once: goose takes a lock, but you should know it does
- Clock skew between instances, and where it matters (signature timestamps, lease expiry)

**Libraries:** none new. nginx in front of two app containers via Compose.

**Expected outcome:** Compose running nginx plus two Relay instances against one Postgres. Shared rate-limit and breaker behaviour verified across both. A drain that loses nothing.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-18` — with two instances running: queue 1,000 deliveries for Meridian and assert the observed outbound rate never exceeds 5 per second in any one-second window across both instances combined. Then, mid-run, send SIGTERM to one instance and assert that every delivery still completes exactly once, that none is left `in_flight`, and that no delivery is sent twice. |
| **L2 — Manual checks** | (a) Count deliveries per instance and confirm the split is roughly even — a 95/5 split means your claim is not fair. <br>(b) Trip a breaker and confirm both instances see it open within one poll interval. <br>(c) Check total Postgres connections under load against `max_connections`. <br>(d) Kill an instance with SIGKILL instead of SIGTERM and confirm the reaper recovers its leases. |
| **L4 — Anti-patterns** | `AP-18-a`, `AP-18-b`, `AP-18-c`, `AP-18-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-18` green, no in-memory state affects correctness, and a drain loses nothing |

---

## Step 19 — Ship it, and write the README

**Story:** *As a stranger who found this repository, I can run it in one command, understand what it does in two minutes, and see the numbers that prove it works.*

**Mode:** `BUILD` — packaging and documentation. The load test numbers must be real ones you measured.

**Why now:** Last. A README written before the system is finished describes a system that does not exist.

**Concepts:**
- Multi-stage Docker: build with the Go toolchain, ship `CGO_ENABLED=0` static binary on a minimal base. Image size in the low tens of megabytes, and knowing why.
- Build metadata through `-ldflags` — version, commit, build time — exposed on a `/version` endpoint
- Running as a non-root user, a read-only filesystem, and a healthcheck the orchestrator can use
- Configuration in production: environment variables, secrets that never enter the image, and failing at startup on a missing value
- **A real load test.** Feed events at a known rate against controlled receivers and record: deliveries per second, p50/p95/p99 delivery latency, throughput of ordered versus unordered endpoints, behaviour with one endpoint dead. Use `k6`, `vegeta`, or a Go program you write — the tool matters less than the numbers being yours.
- Reading your own `pprof` output under load and fixing the one thing it points at. One is enough.
- Backup and retention: an attempts table grows without limit. A retention policy and a delete job, or an honest note in the README saying it is not there.
- **The README as the deliverable.** What it must contain: what Relay is in two sentences, a diagram of event → delivery → attempt, `docker compose up` and a `curl` that produces a visible delivery, the measured numbers, the design decisions with their trade-offs (why Postgres and not Kafka, why no leader election, why ordering costs what it costs), and what you would do next.
- Screenshots of the dashboard in the README. A reviewer who will not clone your repository will still scroll it.

**Libraries:** `k6` or `vegeta` for load testing. No new Go dependencies.

**Expected outcome:** A multi-stage `Dockerfile`, a `compose.yaml` that starts everything with one command, CI building and smoke-testing the image, a `docs/loadtest.md` with real numbers, and a README a stranger can act on.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-19` — a CI job that, on a clean checkout, runs `docker compose up`, waits for readiness, POSTs one event through the public API, and asserts that all three subscribers received their deliveries with valid signatures — with no step performed by hand. |
| **L2 — Manual checks** | (a) Give the README to someone who has not seen the project and watch them try to run it. Every question they ask is a README bug. <br>(b) Run the load test and record the numbers. Run it again with one receiver dead and record them again. <br>(c) Check the final image size and confirm the binary runs as a non-root user. <br>(d) Read `AGENTS.md` v1 next to v4. |
| **L4 — Anti-patterns** | `AP-19-a`, `AP-19-b`, `AP-19-c`, `AP-19-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-19` green, the README carries measured numbers, and a stranger can run the system in one command |

**Harness impact:** `AGENTS.md` **v4** — deployment facts, the configuration surface, the retention policy, and the load-test numbers to compare against after any change.

---

## After the roadmap

You have a Go service with a real concurrency model, a test suite that proves it, and a
dashboard that shows it working. That is a portfolio piece. Three directions from here, in
order of how much they teach:

- **Replace the Postgres queue with NATS JetStream or Redis Streams** behind the same interface
  you declared at step 2, then compare throughput and failure behaviour on the same load test.
  You will find out how much of your design was queue-specific.
- **Add a second binary** — a CLI (`relay deliveries list`, `relay replay <id>`) sharing the
  `internal/` packages. It is a small amount of work and shows you can structure a Go module for
  more than one entry point.
- **Publish the subscriber-side verification helper** as its own small module with its own tests
  and README. Writing a library for other people is a different skill from writing a service.

What not to do next: rewrite the dashboard in React, add Kubernetes, or introduce gRPC. None of
them teaches you anything this project has not already, and each makes the repository harder for
a reviewer to run.
