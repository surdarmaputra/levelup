---
title: Advanced
description: Steps 19–24. OAuth2, service extraction, and the optional Kafka, Elasticsearch, and event sourcing track.
sidebar:
  order: 6
---

## Step 19 — Security II: OAuth2 and Spring Authorization Server

**Story:** *As a customer, I sign in with Google. As the platform, we issue standards-compliant tokens with proper scopes, and stop maintaining hand-rolled auth.*

**Mode:** `BUILD` — Standards-compliant config. Agent scaffolds; you verify every claim in the token.

**Why now:** You built JWT auth by hand in step 15 and hit its limits — revocation, rotation, scope granularity. **Now you'll understand what the standard is doing for you, rather than treating it as magic.**

**Concepts:**
- OAuth2 vs OIDC — authorization vs authentication, and why conflating them causes vulnerabilities
- Grant types: authorization code + **PKCE** (the only correct choice for browser clients), client credentials for service-to-service. Implicit and password grants are deprecated — understand why.
- Spring Authorization Server: issuing tokens, registered clients, consent
- Scopes vs roles vs claims — three different things, routinely confused
- Token introspection vs local JWT validation; the trade-off
- Refresh token rotation and reuse detection
- Social login federation
- Service-to-service auth (needed immediately in step 20)
- Migration strategy: running both auth systems during cutover without a big-bang switch

**Libraries:** `spring-security-oauth2-authorization-server`, `spring-boot-starter-oauth2-client`

**Build:** Authorization server module. Migrate storefront to authorization code + PKCE. Google federation. Scoped API access. Client credentials for internal calls.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-19` — full authorization code + PKCE flow completes and yields a valid access token; a token lacking the required scope is rejected with 403; a reused refresh token invalidates the entire token family |
| **L2 — Manual checks** | (a) Decode your access token at jwt.io — every claim is one you intended to expose. Any surprise is a leak. <br>(b) Attempt the flow without PKCE — rejected <br>(c) Sign in with Google end to end |
| **L4 — Anti-patterns** | `AP-19-a`, `AP-19-b`, `AP-19-c`, `AP-19-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-19` green, PKCE mandatory, hand-rolled JWT code deleted |

---

## Step 20 — Service extraction and production deployment

**Story:** *As the platform, notification delivery is independently deployable and scalable, and the entire system deploys to production through an automated pipeline.*

**Mode:** `LEARN` — Extraction seam and saga design are architecture decisions. Yours.

**Why now:** Final core step. You extract a service **because you now have a reason** — notification has a different scaling profile, different failure tolerance, and different deploy cadence. Extracting on day 1 would have been cosplay.

**Concepts:**
- **When to extract a service, and the far more common case: when not to.** Have honest criteria.
- Choosing the seam — why notification and not ordering
- Data ownership: no shared database. The extracted service owns its data.
- Synchronous vs asynchronous integration; prefer async at the seam
- **Distributed transactions are not available to you.** Saga pattern, choreography vs orchestration, compensating actions.
- Contract testing (Spring Cloud Contract or Pact) — catching breaking changes before deploy
- Distributed tracing across the service boundary (already instrumented in step 13 — now it pays off)
- Deployment: multi-stage Docker builds, layered JARs, image size, non-root user
- CI/CD: build → test → scan → push to GHCR → deploy
- Zero-downtime deploy on a single VPS; rolling restart behind nginx
- Database migrations under zero downtime — **expand/contract**, never a breaking migration
- Backups, restore drills (an untested backup is not a backup), secrets management
- Runbook and on-call basics
- **K8s: conceptual only.** What it adds, what it costs, the honest signals that a VPS is no longer enough. You will not build it.

**Libraries:** Spring Cloud Contract or Pact, Docker multi-stage, GitHub Actions

**Build:** `notification-service` extracted with its own database. Async integration via Rabbit. Saga with compensation for a failure path. Contract tests. Full CI/CD. Zero-downtime deploy to VPS. Runbook.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-20` — end-to-end purchase spanning both services produces a single trace with spans from both, visible in Tempo. Plus: notification-service fully down → orders still complete successfully, notifications are delivered on recovery. |
| **L2 — Manual checks** | (a) Deploy a new version under continuous k6 load — zero failed requests <br>(b) Restore your database from backup into a scratch environment and verify integrity. A backup you have not restored is not a backup. <br>(c) Introduce a breaking change to the notification contract — contract tests fail before deploy, not after |
| **L4 — Anti-patterns** | `AP-20-a`, `AP-20-b`, `AP-20-c`, `AP-20-d`, `AP-20-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-20` green, zero-downtime deploy proven under load, restore drill completed, runbook written |

**Harness impact:** `AGENTS.md` **v5** — split into subagent roles (implementer / test-writer / reviewer), add service boundaries and the contract-test requirement. By now you know enough to write a harness that genuinely outperforms a generic one — compare against your v1 and note the difference.

---

> Each of these earns its place with a user story the existing stack genuinely cannot serve well. If you find yourself unable to articulate why the current stack is insufficient, skip the step. That judgement is itself the lesson.

## Step 21 — Kafka: the event stream

**Story:** *As an organizer, I watch a live on-sale dashboard. Simultaneously, the fraud team scores the same events for bot behaviour, and finance builds revenue rollups. Each consumer processes independently and can replay history after a bug fix.*

**Mode:** `BUILD` — Agent scaffolds Kafka wiring. You justify why Kafka over Rabbit here.

**Why RabbitMQ isn't enough here:** Rabbit destroys messages on ack. Three independent consumers over the same stream, each with its own position, each able to rewind and reprocess — that's a log, not a queue. **You'll feel the difference specifically because you used Rabbit first.**

**Concepts:** Log vs queue semantics · topics, partitions, keys, ordering guarantees · consumer groups and rebalancing · offset management, replay, retention · exactly-once semantics and why it's narrower than it sounds · Kafka Streams for aggregation · schema evolution with Avro/Protobuf + Schema Registry · **when Kafka is the wrong tool** (this matters as much as when it's right)

**Libraries:** `spring-kafka`, `testcontainers:kafka`, optional Schema Registry

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-21` — three consumer groups process the same topic independently; resetting one group's offset to zero replays history for that group only, without affecting the others |
| **L2 — Manual checks** | (a) Add a partition; observe rebalancing and reason about ordering implications for your keys <br>(b) Write down the specific reason Kafka beats Rabbit for this use case. If you can't, you don't need Kafka. |
| **L4 — Anti-patterns** | `AP-21-a`, `AP-21-b`, `AP-21-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-21` green, three independent consumers, replay demonstrated |

---

## Step 22 — Elasticsearch: real search

**Story:** *As a customer, I search "jazz concert near jakarta next weekend under 500k", misspell "concert", and still get relevant results — filtered by six facets, ranked by relevance, returning in under 50ms.*

**Mode:** `BUILD` — Agent handles mappings and queries. You tune relevance by hand.

**Why Postgres FTS isn't enough here:** You hit its ceiling in step 7 and know exactly where. Fuzzy matching, multi-field relevance tuning, faceted aggregation, and geo-distance scoring in a single sub-50ms query is outside what `tsvector` does well.

**Concepts:** Inverted indexes · analyzers, tokenizers, stemming per language · relevance scoring (BM25) and boosting · fuzzy matching and typo tolerance · faceted aggregation · geo queries · **index synchronization via the outbox** (reusing step 10's pattern — the two-datastore consistency problem) · reindexing with zero downtime via alias swapping · mapping design and why dynamic mapping will hurt you

**Libraries:** `spring-data-elasticsearch`, `testcontainers:elasticsearch`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-22` — a misspelled multi-term query returns the correct event in the top 3 results; applying 4 facet filters simultaneously returns correct counts and results; p95 under 50ms with 100k indexed events |
| **L2 — Manual checks** | (a) Update an event in Postgres; confirm the search index reflects it within the documented lag <br>(b) Reindex from scratch with zero search downtime using alias swapping <br>(c) Compare against your step 7 Postgres FTS query — record concrete numbers, not impressions |
| **L4 — Anti-patterns** | `AP-22-a`, `AP-22-b`, `AP-22-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-22` green, index sync via outbox, zero-downtime reindex proven |

---

## Step 23 — Event sourcing (scoped to `Ticket` only)

**Story:** *As a compliance officer investigating a resale dispute, I reconstruct the complete history of a specific ticket — every transfer, refund, and state change with cause and actor — and I can build a new report over historical data that nobody thought to collect at the time.*

**Mode:** `LEARN` — Event sourcing punishes shallow understanding. No shortcuts.

**Why the current model can't do this:** Your `Ticket` table stores current state. History is lost on update. An audit table gets you partway but can't answer questions you didn't anticipate — and its rows can drift from reality. Event sourcing makes the history *be* the truth.

> **Hard scope limit: `Ticket` aggregate only.** System-wide event sourcing is a well-documented way to destroy a project. If you're tempted to extend it, that temptation is the anti-pattern. Reread this line.

**Concepts:** Events as the source of truth; state as a derived fold · event store design, streams, versions · **the aggregate rebuild and snapshotting** · projections; building a new one retroactively (the actual superpower) · event versioning and upcasting — you cannot change history, so you must handle old shapes forever · eventual consistency, again · **the honest cost:** debugging difficulty, GDPR deletion conflicts, onboarding burden · relationship to CQRS (step 11) — separate ideas, often confused, deliberately learned apart here

**Libraries:** Hand-rolled event store on Postgres (recommended — the mechanics are the lesson) or Axon Framework

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-23` — rebuild a ticket's current state by replaying its event stream; assert it matches the projection exactly. Then build a brand-new projection ("tickets transferred more than twice") from historical events alone, with no schema change to the write side. |
| **L2 — Manual checks** | (a) Introduce a v2 event schema and upcast v1 events on read <br>(b) Write down how you'd satisfy a GDPR deletion request against an immutable event log. There is no clean answer — that's the point. |
| **L4 — Anti-patterns** | `AP-23-a`, `AP-23-b`, `AP-23-c`, `AP-23-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-23` green, retroactive projection built, scope still limited to Ticket |

---

## Step 24 — Kubernetes: conceptual only

**Story:** *As an architect, I can articulate precisely when this system should move to Kubernetes and when doing so would be a costly mistake.*

**Mode:** `LEARN` — A written analysis. Agent may research; the recommendation is yours.

**No implementation. Deliberately.** This step is a written decision document, not code.

**Concepts:** What K8s actually provides (declarative desired state, self-healing, rolling deploys, service discovery, autoscaling) · what it costs (operational complexity, expertise, debugging surface, spend) · **the honest signals you've outgrown a VPS** — and the far more common case where you haven't · alternatives that are frequently better: managed container platforms, Nomad, or simply a bigger VPS · mapping your existing Compose stack onto K8s primitives on paper · stateful workloads and why running your own Postgres on K8s is a decision requiring real justification

**Deliverable:** A written architecture decision record: current capacity ceiling, the specific metrics that would signal migration, an honest cost estimate, and a recommendation.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | none — this step produces a document |
| **L2 — Manual checks** | (a) Your ADR names specific numeric thresholds, not vague conditions <br>(b) It includes a recommendation *against* migrating under current load. If it doesn't, you've rationalized rather than analyzed. |
| **L4 — Anti-patterns** | `AP-24-a`, `AP-24-b` — [full text](../../reference/rubrics/) |
| **Done when** | ADR written, reviewed, and defensible to a skeptical CTO |

---
