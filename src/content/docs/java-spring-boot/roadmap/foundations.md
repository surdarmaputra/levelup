---
title: Foundations
description: Steps 0–4. Tooling, harness, Spring fundamentals, persistence, API contract, security.
sidebar:
  order: 2
---

## Step 0 — Development environment, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the entire project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated config. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. An agent is only as good as the loop it can run unsupervised — if it can't verify its own work in one command, it will confidently hand you broken code. This is also the cheapest possible moment to add quality gates; retrofitting Error Prone onto 20k lines means fixing 400 warnings at once, and you won't.

**Concepts:**
- **Loop engineering**: the agent's effectiveness is bounded by its feedback signal, not its intelligence. Fast, deterministic, single-command verification is the whole game.
- Why formatting must be auto-fixed, not argued about
- **Error Prone** — compile-time bug detection, distinct from style linting. It catches defects, not preferences.
- **NullAway** — null-safety enforcement without adopting Kotlin
- Pre-commit hooks and the 5-second rule: a hook slower than 5s gets bypassed with `--no-verify`, permanently
- `AGENTS.md` as the convention contract; why generic agent instructions underperform project-specific ones
- Architecture Decision Records — agents (and future you) make better choices given the *why*
- Signal-to-noise as a design constraint on tooling

**Libraries:** Gradle (Kotlin DSL), Spotless + Palantir Java Format, Error Prone, NullAway, Lefthook, Docker + Compose

**Build:**
- Gradle project with Spotless, Error Prone, NullAway wired in
- `Makefile` (or Gradle task) exposing `make verify`, `make fmt`, `make up`, `make test`
- `.lefthook.yml` — format + fast checks on commit
- `AGENTS.md` v1 + `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with Postgres (the rest arrives as needed)
- `.gitignore`, `.editorconfig`, `.git-blame-ignore-revs`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when a deliberately misformatted file, a NullAway violation, and a failing test are each introduced. Verify all three independently. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number. If it exceeds ~30s once you have real code, fix it — a slow gate gets skipped. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) Ask your agent "what formatter does this project use and how do I run all checks?" It must answer correctly from AGENTS.md alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See `AGENTS.md` for the template and the v2–v5 evolution checkpoints.

> **Where people quit.** Setting up tooling before any domain code feels like procrastination. It isn't — it's what makes steps 1–24 fast. But if you stall here, ship a minimal `AGENTS.md` + `make verify` and add Error Prone at step 3. Momentum beats completeness.

---

## Step 1 — Project skeleton and the Spring mental model

**Story:** *As a developer, I need a running service that exposes a health endpoint, so I have a verified baseline before adding any domain logic.*

**Mode:** `BUILD` — Scaffolding and config. Let the agent generate; you read and question every line.

**Why now:** Everything else assumes you understand what a bean is and when it's created. Skipping this is why people find Spring "magic."

**Concepts:**
- Spring's actual value proposition: inversion of control, and why it exists
- ApplicationContext, bean lifecycle, `@Component` vs `@Bean` vs `@Configuration`
- Constructor injection and why field injection (`@Autowired` on a field) is wrong
- Auto-configuration: what `spring-boot-starter-*` actually does, how to inspect it
- Externalized config: `application.yml`, profiles, `@ConfigurationProperties` over `@Value`
- Virtual threads: `spring.threads.virtual.enabled=true`, and what problem it solves

**Libraries:** `spring-boot-starter-web`, `spring-boot-starter-actuator`, `spring-boot-starter-validation`, Lombok (optional), Spotless

**Build:** Empty modular package structure. One `GET /api/v1/ping`. Actuator health exposed. Profiles for `local` / `test` / `prod`.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — @SpringBootTest context loads; MockMvc GET /api/v1/ping returns 200 |
| **L2 — Manual checks** | (a) Run with --debug, read the auto-configuration report, identify 3 things auto-configured you did not ask for <br>(b) Run `./gradlew bootRun --args='--spring.profiles.active=local'`, confirm the correct config is loaded |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, Spotless passing, you can explain in your own words what happens between `main()` and the first request being served |

---

## Step 2 — Persistence and schema migration

**Story:** *As an organizer, I can create an event with a title, description, and venue, and it survives a restart.*

**Mode:** `LEARN` — Persistence context and proxy semantics only land by being surprised by them.

**Why now:** Data modeling before API design. Getting the entity model wrong is expensive to undo; getting the JSON shape wrong is cheap.

**Concepts:**
- JPA/Hibernate: entity lifecycle, persistence context, dirty checking, flush timing
- `@Transactional`: propagation, boundaries, and the **proxy self-invocation trap**
- Why `spring.jpa.hibernate.ddl-auto` must never be anything but `validate` outside local
- Flyway migrations: versioned, immutable, forward-only
- Repository abstraction: `JpaRepository`, derived queries, when to drop to `@Query`
- Lazy vs eager loading; why `FetchType.EAGER` is almost always a mistake
- Testcontainers: real Postgres in tests

**Libraries:** `spring-boot-starter-data-jpa`, `flyway-core`, `postgresql`, `spring-boot-testcontainers`, `testcontainers:postgresql`

**Build:** `Event`, `Venue`, `Organizer` entities. Flyway V1 migration. Repositories. `@DataJpaTest` slice tests against Testcontainers Postgres.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — save an Event, clear the persistence context, reload it, assert all fields round-trip. Runs against real Postgres via Testcontainers, not H2. |
| **L2 — Manual checks** | (a) Enable show-sql; observe that updating a loaded entity inside a transaction issues an UPDATE without you calling save() <br>(b) Delete a Flyway migration file and try to start — confirm it fails |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, ddl-auto=validate, schema comes only from Flyway |

---

## Step 3 — API contract: DTOs, validation, error model

**Story:** *As an API consumer, I get consistent, machine-readable errors and a documented contract, so I can integrate without reading your source code.*

**Mode:** `LEARN` — Error-model design is a judgement skill. Agent reviews your choices, doesn't make them.

**Why now:** The error model must exist before you have many endpoints. Retrofitting it across 40 endpoints is miserable.

**Concepts:**
- **Never expose entities as JSON.** Why: lazy-loading serialization explosions, accidental field leaks, and your DB schema becoming your public contract
- Java records as DTOs; explicit mapping (MapStruct or hand-written — prefer hand-written until it hurts)
- Bean Validation: `@Valid`, `@NotBlank`, custom validators, validation groups
- `@RestControllerAdvice` and **RFC 9457 Problem Details** (`ProblemDetail`, built into Spring 6)
- HTTP status discipline: 400 vs 404 vs 409 vs 422
- API versioning strategy — URI versioning (`/api/v1`), and why header versioning sounds cleaner but isn't
- OpenAPI generation via springdoc

**Libraries:** `springdoc-openapi-starter-webmvc-ui`, MapStruct (optional)

**Build:** Request/response records for Event CRUD. Global exception handler producing Problem Details. Domain exception hierarchy. `@WebMvcTest` slice tests. CI pipeline turns on here.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — POST an event with a blank title returns 400 with a Problem Details body listing the offending field; GET a non-existent event returns 404 with the same envelope shape |
| **L2 — Manual checks** | (a) /swagger-ui.html renders and every endpoint has a described error response <br>(b) grep the codebase — zero entity classes appear in any controller signature |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, CI running on push, no entity crosses the HTTP boundary |

**Harness impact:** `AGENTS.md` **v2** — record your API conventions: DTO naming, the error envelope, status-code policy, versioning rule. Generic agents produce generic Spring; this is where yours starts producing *your* code.

---

## Step 4 — Security I: session auth, CSRF, RBAC

**Story:** *As a platform, only authenticated organizers may manage their own events; a customer must never modify catalog data.*

**Mode:** `LEARN` — Trace the filter chain yourself. Generated security config you don't understand is a liability.

**Why now:** Before any UI exists. Building screens first and bolting auth on afterwards produces authorization holes at every endpoint you forgot.

**Concepts:**
- The **filter chain** — the single most important thing to understand in Spring Security. Trace a request through it.
- `SecurityFilterChain` bean configuration (the modern lambda DSL; `WebSecurityConfigurerAdapter` is long dead)
- `UserDetailsService`, `PasswordEncoder`, BCrypt work factor
- Session management, session fixation protection
- **CSRF: what it is, why session auth needs it, why it's the default and you should not disable it**
- Authentication vs authorization
- RBAC: `@PreAuthorize`, roles vs authorities
- **Ownership checks** — role alone is insufficient. "Organizer" doesn't mean "this organizer's event."

**Libraries:** `spring-boot-starter-security`, `spring-security-test`

**Build:** User/Role entities. Form login. Roles `CUSTOMER` / `ORGANIZER` / `ADMIN`. Method-level authorization. Ownership rule: organizers only touch their own events.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — organizer A authenticated, attempts PUT on organizer B's event, receives 403 (not 404, not 200). Plus: unauthenticated request to a protected endpoint returns 401. |
| **L2 — Manual checks** | (a) Inspect the DB — passwords are BCrypt hashes, not plaintext, not MD5 <br>(b) Submit a form without a CSRF token, confirm rejection |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, every non-public endpoint has an explicit authorization rule |

---

## Phase B — Domain depth (5–8)
