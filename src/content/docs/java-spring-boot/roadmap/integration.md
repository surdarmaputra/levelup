---
title: Integration and Scale
description: Steps 9–14. Hexagonal refactor, async messaging, caching, horizontal scaling, observability, resilience.
sidebar:
  order: 4
---

## Step 9 — Hexagonal refactor and the payment adapter

**Story:** *As a customer, I pay for my order via an external payment gateway. As the business, we must be able to switch gateways without rewriting the ordering module.*

**Mode:** `BUILD` — Mechanical refactor. But you draw the port boundary before the agent moves anything.

**Why now:** You now have a service class that would need a hardcoded gateway SDK inside it. **That pain is the prerequisite.** Ports and adapters taught before this point is cargo cult.

**Concepts:**
- Ports and adapters (hexagonal): domain at the centre, infrastructure at the edges
- Dependency inversion — the domain declares the interface, infrastructure implements it
- **Domain layer must not import Spring, JPA, or any framework.** Enforced, not suggested.
- Anti-corruption layer: the gateway's model is not your model
- Testing with fake adapters instead of mocks
- ArchUnit for enforcing all of the above
- `RestClient` (the modern replacement for `RestTemplate`) with proper timeouts
- Secrets handling — never in `application.yml` in the repo

**Libraries:** `archunit-junit5`, WireMock, a sandbox gateway (Stripe test mode or Midtrans sandbox)

**Build:** Refactor `ordering` to hexagonal. `PaymentGatewayPort` interface in domain. Two adapters: real gateway + in-memory fake. WireMock contract tests. ArchUnit rules.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — the entire ordering module's test suite passes using the fake adapter, with zero network access. Plus an ArchUnit test asserting no class in `**/domain/**` imports org.springframework or jakarta.persistence. |
| **L2 — Manual checks** | (a) Delete the real adapter class — the domain module still compiles <br>(b) Search for secrets in the repo history. Find any → rotate them. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, ArchUnit guardrails active in CI, gateway swappable |

**Harness impact:** `AGENTS.md` **v3** — module boundaries, the domain-purity rule, where adapters live. Encode the ArchUnit constraints in prose too; the agent should not need a failing build to learn them.

---

## Step 10 — Async, webhooks, idempotency, the outbox pattern

**Story:** *As a customer, I receive a confirmation email after payment succeeds. As the business, a payment webhook delivered three times must never issue three tickets, and a crash mid-process must never lose an order.*

**Mode:** `LEARN` — The dual-write problem must be understood, not pattern-matched.

**Why now:** Payment integration exists but is naively synchronous. This step makes it survive reality.

**Concepts:**
- **The dual-write problem** — why "save to DB, then publish to queue" loses messages, and why it's not fixable with try/catch
- **The transactional outbox pattern** — the actual solution
- Idempotency keys: client-supplied and gateway-supplied; storage and TTL
- Webhook security: signature verification, replay windows, timing-safe comparison
- At-least-once delivery, and why your consumers must therefore be idempotent
- RabbitMQ: exchanges, queues, bindings, acks, prefetch
- **Dead letter queues** and retry with exponential backoff
- `@TransactionalEventListener(AFTER_COMMIT)` and why the phase matters
- Async processing with virtual threads

**Libraries:** `spring-boot-starter-amqp`, `testcontainers:rabbitmq`, `spring-retry`

**Build:** Outbox table + relay. Webhook endpoint with signature verification and idempotency. Rabbit publisher/consumers. Email dispatch consumer. DLQ + retry policy.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — the same payment webhook payload delivered 5 times produces exactly 1 ticket issuance and 1 email dispatch. Plus: kill the app between DB commit and message publish (simulated) — the outbox relay recovers the message on restart, nothing is lost. |
| **L2 — Manual checks** | (a) Send a webhook with an invalid signature — rejected, and the rejection is logged <br>(b) Force a consumer to throw repeatedly — message lands in the DLQ after N attempts, does not loop forever |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d`, `AP-10-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, no dual-write anywhere, all consumers idempotent |

---

## Step 11 — Caching and the CQRS read model

**Story:** *As a customer, the event page with live seat availability loads in under 100ms, even when 50,000 people are viewing it simultaneously during an on-sale.*

**Mode:** `LEARN` — Cache invalidation is judgement. Agent may implement once *you* specify the strategy.

**Why now:** You have domain events (step 10) to drive projection updates, and you've measured the read path (step 7). Both are prerequisites.

**Concepts:**
- **CQRS explained properly:** separating the write model (correctness, invariants, locks) from the read model (speed, denormalization). Not event sourcing — a different, separable idea.
- Why the same model can't serve both: your 1000:1 read/write ratio means read queries contend with purchase locks
- Building a projection from domain events; eventual consistency and its user-visible consequences
- Spring Cache abstraction: `@Cacheable`, `@CacheEvict`, `@CachePut` — and their limits
- Redis data structures: which one for which job (hash for seat availability, sorted set for rankings)
- **Cache invalidation strategies**: TTL, write-through, event-driven eviction
- **Cache stampede / thundering herd** — and the fix (probabilistic early expiry, or locking)
- Cache penetration (null caching) and cache avalanche (TTL jitter)
- What must never be cached, and how to reason about staleness budgets

**Libraries:** `spring-boot-starter-data-redis`, `spring-boot-starter-cache`, `testcontainers:redis`

**Build:** Redis-backed availability projection updated by domain events. Cached catalog reads. Stampede protection. Explicit staleness budget documented per cached item.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — purchase a seat, then assert the read projection reflects the new availability within the documented staleness budget. Plus: 50 concurrent requests for an expired cache key trigger exactly 1 database load, not 50 (stampede protection proven). |
| **L2 — Manual checks** | (a) Flush Redis entirely while under load — system degrades to database reads and recovers, rather than erroring <br>(b) Every @Cacheable in the codebase has a documented eviction trigger. Any without one is a leak. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, staleness budget documented, no unevictable cache entries |

---

## Step 12 — Horizontal scaling: load balancing and distributed state

**Story:** *As the platform, we run multiple application instances behind a load balancer, and a customer's session and seat holds behave correctly regardless of which instance serves each request.*

**Mode:** `LEARN` — This step exists to break your code. Let it break. Diagnose before asking.

**Why now:** **This step exists to break your step 11 code.** You will discover that assumptions which held on one instance don't hold on two. That discovery is the entire lesson and cannot be delivered by explanation.

**Concepts:**
- Stateless service design — what "stateless" actually means and where state really lives
- nginx as a reverse proxy and load balancer; round-robin vs least-connections
- **Why sticky sessions are a crutch that hides bugs**
- Distributed session storage (Spring Session + Redis)
- **Distributed locking** — Redis-based, and its correctness caveats. Read about Redlock and the criticism of it. Understand why "a lock with a TTL" is a lease, not a lock.
- Scheduled task duplication — your step 8 expiry sweeper now runs on every instance. This is a bug. (ShedLock)
- Local vs distributed cache coherence — the in-JVM cache that's now silently wrong
- Health checks, readiness vs liveness, graceful shutdown, connection draining
- Idempotency's role in a retrying load balancer

**Libraries:** `spring-session-data-redis`, ShedLock, nginx (Compose), Redisson (optional)

**Build:** Compose config with nginx + 2 app instances. Session externalization. ShedLock on scheduled jobs. Distributed hold locks. Graceful shutdown. Contract diff guardrail turns on.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — a scheduled expiry sweep runs exactly once across two simultaneously running instances, not twice. Verified with two contexts against shared Redis. |
| **L2 — Manual checks** | (a) Log in via instance 1, `docker compose stop app1`, refresh — still logged in, cart intact <br>(b) Run the `ACC-08` concurrency test against the load-balanced pair. If it fails, your locking was single-node — fix it. This failure is expected and is the point of the step. <br>(c) `docker compose stop app2` mid-request — no dropped connections (graceful shutdown working) |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, `ACC-08` passes against 2 instances, no in-memory state that must be shared |

---

## Step 13 — Observability

**Story:** *As an on-call engineer, when checkout latency spikes at 2am, I can determine which component is responsible within five minutes, without adding code or redeploying.*

**Mode:** `BUILD` — Config-heavy. Agent scaffolds the stack; you define which metrics matter.

**Why now:** Before resilience (step 14). You cannot tune a circuit breaker you can't observe. Also before deploy — shipping unobservable code to a VPS is how you get 3am mysteries.

**Concepts:**
- The three pillars, and why logs alone stop scaling at 2 instances
- Actuator: endpoints, security exposure, custom health indicators
- Micrometer: counters, gauges, timers, distribution summaries; **percentiles over averages** (p99 is the truth, mean is a comfortable lie)
- Prometheus scraping; RED method (Rate, Errors, Duration) and USE method
- **Structured JSON logging** with MDC; correlation ID propagation through async boundaries and message queues
- OpenTelemetry + Micrometer Tracing; spans, context propagation, sampling strategy
- Grafana dashboards and alert rules that are actionable rather than noisy
- Business metrics vs technical metrics — track tickets-sold-per-minute, not just HTTP 200s
- What must never be logged: PII, tokens, payment details, full request bodies

**Libraries:** `micrometer-registry-prometheus`, `micrometer-tracing-bridge-otel`, `opentelemetry-exporter-otlp`, `logstash-logback-encoder`. Compose: Prometheus, Grafana, Loki, Tempo.

**Build:** Full local observability stack. Custom business metrics. Correlation IDs surviving Rabbit hops. Grafana dashboard. Three alert rules.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — a request that publishes a message, consumed asynchronously, carries the same correlation ID in the consumer's log output as in the originating HTTP request |
| **L2 — Manual checks** | (a) Trigger a slow checkout; find the responsible span in Tempo without reading source code <br>(b) grep your logs for any token, password, or card number. Any hit is a P0 defect. <br>(c) Every alert you defined would wake you for a real problem. Delete any that wouldn't. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, RED metrics dashboarded, zero sensitive data in logs |

**Harness impact:** `AGENTS.md` **v4** — "every new endpoint gets a metric and a correlation ID; never log these fields." Observability decays fastest, and this is what keeps the agent from adding blind endpoints.

---

## Step 14 — Resilience and rate limiting

**Story:** *As the platform, when the payment gateway degrades, we fail fast and degrade gracefully rather than exhausting our threads. During an on-sale, bots cannot consume the entire inventory.*

**Mode:** `BUILD` — Resilience config is boilerplate. You choose the thresholds and justify them.

**Why now:** Last step of the API path. Requires observability to tune, and integrations to protect.

**Concepts:**
- Failure modes: slow is worse than down (a hung dependency exhausts your pool; a fast failure doesn't)
- **Circuit breaker** — states, thresholds, half-open probing, and how to size the window
- Retry with exponential backoff + **jitter**; which operations are safe to retry (only idempotent ones)
- **Bulkhead** isolation — one failing dependency must not sink the whole service
- Timeouts everywhere; a missing timeout is an unbounded liability
- Fallbacks and graceful degradation — decide what to show when the gateway is down
- Rate limiting: token bucket vs sliding window; per-IP vs per-user vs per-endpoint
- Distributed rate limiting with Redis; **why per-instance rate limits are wrong behind a load balancer**
- Queue-based virtual waiting room for on-sale spikes
- Load testing with k6 — establishing a baseline you can regress against

**Libraries:** `resilience4j-spring-boot3`, Bucket4j + Redis, k6

**Build:** Circuit breaker + retry + timeout + bulkhead on the payment adapter. Distributed rate limiting. Virtual waiting room for high-demand on-sales. k6 load test suite. Dependency scanning guardrail on.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — with the gateway stubbed to hang, the circuit opens after the configured threshold, subsequent calls fail fast in <50ms rather than blocking, and the fallback response is returned. Plus: rate limit of 10 req/min is enforced across both instances, not 10 per instance. |
| **L2 — Manual checks** | (a) k6 run at 500 RPS — record p50/p95/p99 and error rate. This is your baseline; every future step must not regress it. <br>(b) Audit every outbound call for an explicit timeout. Any without one is a defect. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, load-test baseline recorded, every external call has timeout + circuit breaker |

> **Path 1 complete.** You now have a production-grade API. Steps 15–18 build the customer-facing frontend against it.

---
