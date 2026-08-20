---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Lookup table for verification. `ACC-NN` = the gating acceptance test for step NN. `AP-NN-x` = anti-patterns for step NN.

**Usage:** the AI code reviewer loads **only the section for the step under review**. Do not paste this whole file into a review — it leaks future steps and dilutes the reviewer's attention.

**On anti-patterns:** these are the things that actually go wrong, drawn from how these mistakes appear in real codebases. Most are invisible at runtime until they aren't. Self-check against them before requesting review.

---

## Step 0 — Harness and tooling bootstrap

**ACC-00** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a NullAway violation, a failing test. All three must be verified separately — a gate that only catches one thing gives false confidence about the other two.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed with `--no-verify`, permanently, and then the gate exists only in theory. Move slow checks to CI. |
| AP-00-b | **Multiple verification commands.** If the agent (or you) must remember four commands, some will be skipped. One entry point, always. |
| AP-00-c | **Generic `AGENTS.md`.** Restating public Spring documentation adds nothing — the model already knows it. The file's value is entirely in what's *specific to this project*: your module layout, your conventions, your deliberate deviations from the default. |
| AP-00-d | **Warnings that don't fail the build.** A warning nobody is forced to address is noise, and it trains you to ignore the console — including on the day it matters. |

---

## Step 1 — Project skeleton

**ACC-01** — `@SpringBootTest` starts the application context successfully. `MockMvc` `GET /api/v1/ping` returns 200 with the expected body. Context load failure is itself a meaningful failure — most misconfiguration surfaces here.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Field injection.** `@Autowired` on a field instead of constructor injection. Hides dependencies, permits circular references to compile, makes the class untestable without a container, and prevents `final`. |
| AP-01-b | **`@Value` scattered across classes** instead of `@ConfigurationProperties` on a typed record. Untyped, unvalidated, undiscoverable, no IDE support. |
| AP-01-c | **Secrets or environment-specific values committed** in `application.yml`. Config that differs per environment belongs in profiles or environment variables. |

---

## Step 2 — Persistence

**ACC-02** — Save an `Event`, flush and clear the persistence context, reload by ID, assert every field round-trips including relationships. Must run against real Postgres via Testcontainers.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **`ddl-auto` set to anything but `validate` or `none`** outside local development. `update` silently diverges schema across environments and will eventually destroy data. |
| AP-02-b | **Self-invocation of `@Transactional`.** Calling `this.otherTransactionalMethod()` bypasses the Spring proxy entirely — no transaction is started, silently. Same applies to `@Transactional` on private, final, or static methods. This is the single most common Spring bug. |
| AP-02-c | **`FetchType.EAGER` on collections.** Every load drags the entire object graph. Cannot be overridden per query. Default `@ManyToOne` is EAGER — you must set it to LAZY explicitly. |
| AP-02-d | **Entities using H2 for tests** while production runs Postgres. H2 differs in locking, sequences, type coercion, and SQL dialect. Tests pass, production fails. |

---

## Step 3 — API contract

**ACC-03** — `POST /api/v1/events` with a blank title returns 400 with an RFC 9457 Problem Details body naming the offending field. `GET` on a non-existent ID returns 404 with the same envelope shape. Both asserted on structure, not just status.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Entity exposed directly as request or response body.** Couples your public API to your schema, risks lazy-loading serialization failures, and leaks fields you never intended to publish. |
| AP-03-b | **Per-controller `try/catch`** producing ad-hoc error shapes instead of a single `@RestControllerAdvice`. Consumers must then handle N error formats. |
| AP-03-c | **200 OK with an error payload.** Status codes are the machine-readable contract. `{"success": false}` inside a 200 breaks every HTTP client's error handling. |
| AP-03-d | **Exception messages leaked to clients** — stack traces, SQL text, internal class names. Information disclosure. Log detail internally, return a correlation ID externally. |

---

## Step 4 — Security I

**ACC-04** — Organizer A authenticated, attempts `PUT` on organizer B's event → 403. Unauthenticated request to a protected endpoint → 401. Both asserted with `spring-security-test`.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **CSRF disabled** because it "caused problems." With session auth, this is a live vulnerability, not a configuration convenience. |
| AP-04-b | **Role check without ownership check.** `@PreAuthorize("hasRole('ORGANIZER')")` lets any organizer edit any organizer's events. Role answers *what kind of user*; it does not answer *whose data*. |
| AP-04-c | **`permitAll()` as the default** with selective restriction. Default deny, then permit explicitly. One forgotten endpoint under default-allow is a breach. |
| AP-04-d | **Weak or absent password hashing** — plaintext, MD5, SHA-1, or BCrypt with a work factor below 10. |

---

## Step 5 — Admin UI

**ACC-05** — Submitting an invalid event form returns 200 with the form redisplayed, the field-level error message present, and the user's previously typed input preserved.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **No POST-Redirect-GET.** Rendering directly from a POST means refresh re-submits. Users will duplicate data. |
| AP-05-b | **User input discarded on validation failure.** Forcing re-entry of a long form because one field failed. |
| AP-05-c | **Business logic in templates.** Thymeleaf expressions performing calculations or authorization decisions. Untestable and unreviewable. |

---

## Step 5b — Design system foundation

**ACC-05b** — Every list screen renders correctly in all four states. MockMvc asserts empty-state markup is present when the collection is empty, and error-state markup when the service throws — not a blank page, not a stack trace.

| ID | Anti-pattern |
|---|---|
| AP-05b-a | **Hardcoded design values.** A hex color or pixel font size in a template means the token layer is already bypassed. Dark mode and any future rebrand will then require touching every file. |
| AP-05b-b | **Only the populated state designed.** Empty, loading, and error states left as blank divs or raw stack traces. This is the single most common reason a portfolio UI reads as unfinished — and it's what reviewers check first. |
| AP-05b-c | **Component-level dark mode overrides** instead of theming at the token layer. Guarantees inconsistency and doubles every future style change. |
| AP-05b-d | **Contrast checked after choosing the palette.** WCAG AA is a constraint on selection, not a validation step. Discovering your brand color fails contrast after building 20 screens means rebuilding 20 screens. |
| AP-05b-e | **Layout that breaks on real data.** Designed against 12-character titles, shipped to users with 200-character ones. Test with hostile data before calling it done. |

---

## Step 6 — Seat maps

**ACC-06** — Generating a 5,000-seat map completes in under 3 seconds using batched inserts. Test asserts both wall time and that statement count is far below 5,000.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **`double` or `float` for money.** `0.1 + 0.2 != 0.3`. Use `BigDecimal`, or integer minor units. This is not pedantry — it produces real financial discrepancies. |
| AP-06-b | **`@Enumerated(ORDINAL)`** (the default). Reordering or inserting an enum constant silently reinterprets every existing row. Always `STRING`. |
| AP-06-c | **Looping `save()` per entity** instead of batching. 5,000 round-trips where 50 batches would do. |
| AP-06-d | **Uniqueness enforced only in application code.** Without a database constraint, concurrent requests will both pass the check and both insert. |

---

## Step 7 — Read performance

**ACC-07** — Fetching 50 events with venues and ticket types executes ≤3 SQL statements. Query count asserted programmatically so regressions fail CI.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Unnoticed N+1.** 1 query for the list plus 1 per row. Invisible in development with 10 rows, fatal at 10,000. If you aren't counting queries in tests, you have one. |
| AP-07-b | **`FetchType.EAGER` used as the N+1 fix.** It doesn't fix it; it makes it unconditional and unavoidable. Use `JOIN FETCH` or `@EntityGraph` per query. |
| AP-07-c | **Offset pagination on large datasets.** `OFFSET 100000` requires the database to scan and discard 100,000 rows on every request. |
| AP-07-d | **Indexes added by guesswork.** Every index costs write throughput and storage. Justify each with `EXPLAIN ANALYZE` before and after. |

---

## Step 8 — Concurrency

**ACC-08** — 100 concurrent purchase attempts against 10 available seats: exactly 10 succeed, 90 return 409, zero seats double-sold, zero deadlocks. Real Postgres. **Must pass 20 consecutive runs** — a race-condition test that passes once proves nothing.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Check-then-act without a lock.** `if (seat.isAvailable()) { seat.sell(); }` — two threads both read available, both sell. The canonical race condition. |
| AP-08-b | **Inconsistent lock ordering** across multi-seat purchases. Thread 1 locks seat 5 then 9; thread 2 locks 9 then 5 → deadlock. Sort identifiers before acquiring. |
| AP-08-c | **`synchronized` or a JVM-level lock** used to guard shared database state. Works on one instance, silently fails the moment you scale to two. |
| AP-08-d | **Transaction held open across an external call.** Holding row locks while awaiting a payment gateway means one slow third party stalls your entire inventory. |
| AP-08-e | **Race test using `Thread.sleep()` to coordinate.** Timing-dependent and flaky. Use `CountDownLatch` for deterministic simultaneous release. |

---

## Step 9 — Hexagonal refactor

**ACC-09** — The full ordering module test suite passes against the fake payment adapter with no network access. ArchUnit asserts no class under `**/domain/**` imports `org.springframework` or `jakarta.persistence`.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Framework types in the domain.** JPA annotations, Spring annotations, or HTTP types inside domain classes. The domain must be testable as plain Java. |
| AP-09-b | **The gateway's model used as your domain model.** Their `PaymentIntent` shape becomes your business language; their breaking change becomes your refactor. Translate at the boundary. |
| AP-09-c | **Port interface defined by infrastructure.** If the port's method signatures mirror the vendor SDK, the abstraction is fictional and swapping providers will still require domain changes. |
| AP-09-d | **Missing timeouts on the outbound HTTP client.** Default `RestClient` configuration can block indefinitely. Every external call needs connect and read timeouts. |

---

## Step 10 — Async and idempotency

**ACC-10** — The same webhook payload delivered 5 times produces exactly 1 ticket issuance and 1 email dispatch. Separately: simulate a crash between DB commit and message publish — the outbox relay recovers the message on restart with nothing lost.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Dual write.** `repository.save(order); rabbitTemplate.send(event);` — if the process dies between them, the message is lost forever. `try/catch` does not fix this. The outbox does. |
| AP-10-b | **Non-idempotent consumer.** With at-least-once delivery, redelivery is guaranteed eventually, not hypothetically. A consumer that charges or issues on every receipt will double-issue. |
| AP-10-c | **Webhook signature unverified**, or verified with `==` / `String.equals` instead of a constant-time comparison. Unverified webhooks are an unauthenticated write endpoint. |
| AP-10-d | **Infinite retry with no dead-letter queue.** A poison message loops forever, consuming capacity and filling logs. |
| AP-10-e | **`@TransactionalEventListener` at the wrong phase**, or a plain `@EventListener` publishing before commit. The consumer then reads state that may still roll back. |

---

## Step 11 — Caching and CQRS

**ACC-11** — After a purchase, the read projection reflects new availability within the documented staleness budget. Separately: 50 concurrent requests for an expired key trigger exactly 1 database load, not 50.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Cache entry with no eviction path.** `@Cacheable` with neither TTL nor an eviction trigger. Serves stale data indefinitely. Every cached item needs a documented invalidation story. |
| AP-11-b | **No stampede protection.** When a hot key expires under load, every concurrent request stampedes the database simultaneously — often at exactly the moment you least want it. |
| AP-11-c | **Caching used to hide an N+1** rather than fixing it. The underlying query is still wrong; you've just moved the failure to cache-miss time, which is when you're already under load. |
| AP-11-d | **Cached data crossing an authorization boundary.** A cache key omitting the user or tenant dimension will serve one user's data to another. |

---

## Step 12 — Horizontal scaling

**ACC-12** — The scheduled expiry sweep executes exactly once across two simultaneously running instances. Verified with two contexts sharing Redis.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **In-memory session state** requiring sticky sessions to work. Sticky sessions hide the bug until an instance restarts and users are logged out. |
| AP-12-b | **`@Scheduled` without distributed coordination.** Every instance runs the job. Expiry sweeps double-execute; report jobs send duplicate emails. |
| AP-12-c | **Local in-JVM cache holding data that must be consistent across instances.** Instance 1 evicts, instance 2 keeps serving stale. Silent, and very hard to reproduce. |
| AP-12-d | **No graceful shutdown.** SIGTERM kills in-flight requests. Configure `server.shutdown=graceful` and a termination grace period. |

---

## Step 13 — Observability

**ACC-13** — A request that publishes a message, consumed asynchronously, produces consumer-side logs carrying the same correlation ID as the originating HTTP request.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Sensitive data in logs** — tokens, passwords, card numbers, full request bodies, PII. Logs are widely readable, long-retained, and frequently shipped to third parties. |
| AP-13-b | **Averages instead of percentiles.** A mean latency of 200ms is compatible with 5% of users waiting 8 seconds. Track p95 and p99. |
| AP-13-c | **Correlation ID dropped at async boundaries.** MDC is thread-local; it does not automatically survive a thread handoff or a queue hop. Propagate explicitly. |
| AP-13-d | **Alerts that fire without requiring action.** Alert fatigue means the real one gets ignored. Every alert must have a runbook entry and a human response. |

---

## Step 14 — Resilience

**ACC-14** — With the gateway hanging, the circuit opens after the configured threshold and subsequent calls fail fast in under 50ms with the fallback returned. Rate limit of 10 req/min is enforced across both instances collectively, not per instance.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Retrying non-idempotent operations.** Retrying a charge that actually succeeded but timed out will double-charge. Retry requires idempotency first. |
| AP-14-b | **Retry without jitter.** Synchronized backoff means all clients retry simultaneously, producing a thundering herd against a service that is already struggling. |
| AP-14-c | **Per-instance rate limiting** behind a load balancer. With 2 instances, your 100/min limit is actually 200/min — and it changes when you scale. |
| AP-14-d | **Circuit breaker with no fallback.** Failing fast into an unhandled exception is a faster error, not graceful degradation. Decide what the user sees. |

---

## Step 15 — React foundation and token auth

**ACC-15** — An expired access token triggers a transparent refresh; the original request then succeeds without user-visible interruption. A revoked refresh token is rejected.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **Tokens in `localStorage` or `sessionStorage`.** Readable by any injected script. One XSS anywhere on the origin — including in a third-party dependency — exfiltrates every session. Use httpOnly + Secure + SameSite cookies. |
| AP-15-b | **`Access-Control-Allow-Origin: *` with credentials enabled.** Browsers reject this combination; working around it by reflecting the Origin header without an allowlist makes any site able to call your API with the user's cookies. |
| AP-15-c | **Refresh tokens that never rotate or expire.** A leaked long-lived refresh token is permanent account access. Rotate on use and detect reuse. |
| AP-15-d | **Authorization enforced only on the client.** Hiding a button is not access control. Every protected operation must be authorized server-side. |
| AP-15-e | **TypeScript `strict` disabled**, or `any` used to silence the generated API client. Defeats the entire purpose of generating a typed client from OpenAPI — you now have the ceremony without the safety. |

---

## Step 16 — Seat map

**ACC-16** — Two browser contexts on the same showtime: context A holds a seat, context B's map reflects unavailability within 2 seconds without reload. Playwright, two contexts.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Client-computed hold expiry.** Using the browser clock lets a user extend a hold by changing their system time, and breaks legitimately for anyone with clock skew. The server is authoritative. |
| AP-16-b | **No request cancellation.** Rapid selections produce out-of-order responses; a stale response overwrites fresh state. Use `AbortController`. |
| AP-16-c | **Optimistic update with no rollback path.** The UI shows a seat as held, the request fails, and the user proceeds believing they have it. |
| AP-16-d | **Rendering thousands of DOM nodes without virtualization or canvas.** Frame rate collapses; interaction becomes unusable on mid-range devices. |

---

## Step 17 — Checkout

**ACC-17** — Submit checkout, terminate the browser tab before the payment callback, reopen the order page: state is correct and recoverable, no orphaned hold, no double charge.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Double submission possible.** Button not disabled, or disabled only on the client with no server-side idempotency key. Users double-click; networks retry. |
| AP-17-b | **Card data touching your server.** Any handling of raw PAN expands PCI scope enormously. Use hosted fields or a redirect flow. |
| AP-17-c | **Payment success treated as ticket issuance.** They are separated by an async boundary. Telling the user "done" before issuance completes creates support tickets when it fails. |
| AP-17-d | **Unrecoverable flow state.** Closing the tab mid-checkout orphans the hold and strands the order in limbo. |

---

## Step 18 — Frontend production

**ACC-18** — Playwright E2E covering browse → select → checkout → ticket, passing against the real load-balanced backend in CI.

| ID | Anti-pattern |
|---|---|
| AP-18-a | **No error boundary.** One render exception blanks the entire page with no recovery and no report. |
| AP-18-b | **E2E tests for everything.** Slow, flaky suites get disabled and then deleted. E2E covers critical journeys only; push the rest down the pyramid. |
| AP-18-c | **Unbounded bundle growth.** Without a CI budget, bundle size only increases, and nobody notices until mobile users leave. |
| AP-18-d | **Lint or type errors suppressed rather than fixed.** `biome-ignore`, `@ts-expect-error`, or `any` used to get past CI. Each one is a permanent hole with no expiry date. |

---

## Step 19 — OAuth2

**ACC-19** — Authorization code + PKCE flow completes and yields a valid token. A token lacking the required scope is rejected with 403. A reused refresh token invalidates the entire token family.

| ID | Anti-pattern |
|---|---|
| AP-19-a | **Implicit or password grant** for a browser client. Both deprecated for well-documented reasons. Authorization code + PKCE is the answer. |
| AP-19-b | **PKCE optional rather than required** for public clients. Without it, an intercepted authorization code is directly exchangeable. |
| AP-19-c | **Sensitive claims in the token payload.** JWTs are signed, not encrypted — anyone holding one can read every claim. |
| AP-19-d | **Scopes conflated with roles.** Scope is what the *client application* may request; role is what the *user* may do. Treating them as one grants clients user-level authority. |

---

## Step 20 — Extraction and deployment

**ACC-20** — An end-to-end purchase spanning both services produces one trace containing spans from both. With notification-service fully down, orders still complete and notifications deliver on recovery.

| ID | Anti-pattern |
|---|---|
| AP-20-a | **Shared database between services.** The most common failed extraction. You gain deployment complexity while keeping every coupling. This is a distributed monolith. |
| AP-20-b | **Synchronous coupling at the seam.** If ordering blocks on a notification HTTP call, notification's downtime is now ordering's downtime — worse than before extraction. |
| AP-20-c | **Distributed transaction attempted** across service boundaries. Not available. Use a saga with explicit compensating actions. |
| AP-20-d | **Breaking database migration deployed directly.** Dropping or renaming a column while the old version is still running breaks it mid-deploy. Expand, migrate, contract — three deploys. |
| AP-20-e | **Backups never restored.** An untested backup is a belief, not a capability. Restore drills on a schedule. |

---

## Step 21 — Kafka

**ACC-21** — Three consumer groups process the same topic independently. Resetting one group's offset to zero replays history for that group only, with no effect on the others.

| ID | Anti-pattern |
|---|---|
| AP-21-a | **Kafka used as a task queue.** If you have one consumer and need per-message ack, retry, and DLQ semantics, Rabbit is the correct tool and Kafka is operational overhead. |
| AP-21-b | **Ordering assumed across partitions.** Kafka orders within a partition only. Messages requiring relative order must share a partition key. |
| AP-21-c | **No schema management on the topic.** Producers evolve, consumers break. Schema Registry with a compatibility policy, or explicit versioned events. |

---

## Step 22 — Elasticsearch

**ACC-22** — A misspelled multi-term query returns the correct event in the top 3. Four simultaneous facet filters return correct counts and results. p95 under 50ms with 100k indexed events.

| ID | Anti-pattern |
|---|---|
| AP-22-a | **Elasticsearch as the system of record.** It is a search index — not durable, not transactional, and reindexable by design. Postgres remains the source of truth. |
| AP-22-b | **Index synchronized by dual write.** Same failure mode as AP-10-a. Reuse the outbox; the index will otherwise silently drift from the database. |
| AP-22-c | **Reliance on dynamic mapping.** Field types get inferred from the first document seen, then become wrong and unfixable without a reindex. Define mappings explicitly. |

---

## Step 23 — Event sourcing

**ACC-23** — Replaying a ticket's event stream reproduces its current state, matching the projection exactly. A brand-new projection is then built from historical events alone, with no write-side schema change.

| ID | Anti-pattern |
|---|---|
| AP-23-a | **Scope creep beyond the `Ticket` aggregate.** The most expensive mistake in this entire roadmap. If it feels like a natural extension, that feeling is the anti-pattern. |
| AP-23-b | **Events mutated or deleted.** The log is append-only. Correcting history means appending a compensating event, never editing. |
| AP-23-c | **No snapshotting strategy.** Replaying thousands of events per read makes the aggregate progressively slower until it becomes unusable. |
| AP-23-d | **No event versioning plan.** Old events persist forever in their original shape. Without upcasting, a schema change breaks the ability to read your own history. |

---

## Step 24 — Kubernetes ADR

**ACC-24** — None. Deliverable is a written architecture decision record.

| ID | Anti-pattern |
|---|---|
| AP-24-a | **Recommending migration without numeric thresholds.** "When we scale up" is not a decision criterion. Name the metric and the value. |
| AP-24-b | **No serious consideration of not migrating.** An ADR that only argues one side is advocacy, not analysis. |
