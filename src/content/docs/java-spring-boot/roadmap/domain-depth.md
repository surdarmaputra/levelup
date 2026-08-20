---
title: Domain Depth
description: Steps 5–8. Admin UI, design system, seat maps, read performance, and the concurrency problem.
sidebar:
  order: 3
---

## Step 5 — Admin back-office (Thymeleaf + HTMX)

**Story:** *As an organizer, I manage my events through a web interface instead of curl.*

**Mode:** `BUILD` — Templates and forms. Agent-generated, you review for AP-05-*.

**Why now:** You need something to click. It also teaches server-side rendering while your auth is still session-based — the two fit together naturally.

> **This is Path 2's first deliverable.** Thymeleaf here is a permanent choice, not a stepping stone. Internal CRUD back-offices are genuinely faster to build and maintain server-rendered. The React storefront (step 15+) is a different surface with different needs.

**Concepts:**
- Server-side rendering, template composition, fragments, layout dialect
- Form binding, `BindingResult`, redisplaying validation errors without losing input
- POST-Redirect-GET, flash attributes
- HTMX: partial updates without a build step — `hx-get`, `hx-post`, `hx-target`, `hx-swap`
- Progressive enhancement vs SPA — the actual trade-off
- CSRF tokens in forms and in HTMX requests

**Libraries:** `spring-boot-starter-thymeleaf`, `thymeleaf-extras-springsecurity6`, HTMX, Tailwind 4 + daisyUI 5

**On daisyUI over an admin template:** the good free templates (TailAdmin, Flowbite Admin) ship Alpine.js, which overlaps heavily with HTMX — running both means two competing interactivity models and a step spent debugging their interaction instead of learning Spring. daisyUI is CSS-only with zero JS, so nothing fights HTMX, and its semantic classes (`btn btn-primary`, `card`, `drawer`) keep Thymeleaf fragments readable. Utility-class soup inside a `.html` fragment is genuinely painful to review. **Steal layout and page composition** from the template demos — that's the part worth taking.

**Build:** Login page. Event list with server-side pagination and search. Create/edit forms. HTMX inline delete + live search.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — MockMvc submits an invalid event form; response is 200 with the form redisplayed, the error message present, and the user's typed input preserved (not blanked) |
| **L2 — Manual checks** | (a) Create an event, refresh the browser — no duplicate submission dialog (proves PRG) <br>(b) Disable JavaScript — core CRUD still works |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, full event lifecycle manageable from the browser |

---

## Step 5b — Design system foundation

**Story:** *As an organizer, the admin panel looks like a product someone designed, not a bootstrapped internal tool — and every screen behaves predictably when data is missing, loading, or broken.*

**Mode:** `BUILD` — agent generates components against your tokens. You make the taste decisions.

**Why now:** Immediately after the first UI exists and before there are 20 screens to retrofit. Design systems applied late are never applied consistently.

**Why this step exists at all:** you asked for portfolio-grade output. Portfolio-grade UI is overwhelmingly *consistency and state coverage*, not fancy components. The reason most portfolio dashboards read as amateur isn't the button styling — it's that nobody designed the empty state, the loading state, or the 40-character-title overflow. Reviewers notice.

**Concepts:**
- Design tokens: color, type scale, spacing rhythm, radius, elevation. Define once, never hardcode.
- **Custom daisyUI theme** via its theme generator — a recognizable stock theme reads as "used a template"; a custom palette reads as "designed this"
- Type scale (a modular ratio, not arbitrary sizes) and vertical rhythm
- **The four states every data surface needs**: empty, loading, error, populated. Most UIs ship one.
- Skeleton loaders vs spinners, and when each is honest
- Dark mode via daisyUI theming — done at the token layer, not with per-component overrides
- Data density for admin surfaces — dashboards are not marketing pages
- Charts that inform rather than decorate: axis labels, units, no 3D, no gratuitous animation
- Responsive tables — the hardest common admin problem
- Accessible color contrast (WCAG AA) as a constraint on palette selection, applied *before* you fall in love with a color

**Libraries:** Tailwind 4, daisyUI 5, ApexCharts, Lucide icons

**Build:** Token definitions + custom daisyUI theme. Reusable Thymeleaf fragments: page shell, data table, form field, empty state, error state, skeleton, toast. Organizer dashboard with 3 charts. Dark mode toggle. Retrofit step 5's screens onto the system.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05b` — every list screen renders correctly in all four states. MockMvc asserts the empty-state and error-state markup is present when the collection is empty or the service throws — not a blank page, not a stack trace. |
| **L2 — Manual checks** | (a) grep the templates for hardcoded hex colors or pixel font sizes. Any hit is a token violation. <br>(b) Contrast-check every text/background pair — WCAG AA minimum <br>(c) Toggle dark mode on every screen. Any unreadable element is a token-layer bug, not a component bug. <br>(d) Load a screen at 320px wide. Tables must degrade, not overflow. <br>(e) Insert a 200-character event title. Nothing may break layout. |
| **L4 — Anti-patterns** | `AP-05b-a`, `AP-05b-b`, `AP-05b-c`, `AP-05b-d`, `AP-05b-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05b` green, zero hardcoded design values, all four states covered on every data surface |

**Harness impact:** add design tokens and the component-fragment inventory to `AGENTS.md` (v2 checkpoint). Without this, the agent invents a new button style on every screen — the single fastest way to make a UI look amateur.

---

## Step 6 — Venues, seat maps, and bulk operations

**Story:** *As an organizer, I define a venue with a 5,000-seat map (sections, rows, seats) and create showtimes against it.*

**Mode:** `BUILD` — Bulk generation is mechanical. But you decide the aggregate boundaries.

**Why now:** You need meaningful data volume before performance work (step 7) or concurrency work (step 8) means anything. 20 rows teaches nothing.

**Concepts:**
- Modeling composition and hierarchy in JPA; when *not* to use inheritance
- Aggregate boundaries (DDD-lite): what's loaded together, what's a separate transaction
- Bulk insert performance: JDBC batching, `hibernate.jdbc.batch_size`, `saveAll` and its limits
- Long-running transactions and why they're dangerous
- Enums and state fields; `@Enumerated(STRING)` — never `ORDINAL`
- Optimistic locking basics: `@Version`
- Value objects: `Money` as a type, `BigDecimal` for currency — **never `double`**

**Libraries:** none new

**Build:** `Venue` → `SeatMap` → `Section` → `Row` → `Seat`. Bulk seat generator. `Showtime` linked to venue. `TicketType` with price and quota. Admin UI for seat map upload/preview.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — generate a 5,000-seat map in a single request; assert it completes under 3 seconds and produces batched inserts, not 5,000 individual round-trips |
| **L2 — Manual checks** | (a) Log SQL statement counts and confirm batching is active <br>(b) Attempt to create a duplicate seat label in the same row — DB constraint rejects it (not just application code) |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, JaCoCo domain gate on, money is never a floating-point type |

---

## Step 7 — Read performance: N+1, projections, indexing

**Story:** *As a customer, I browse the public event catalog with filters, and pages load fast even with thousands of events.*

**Mode:** `LEARN` — You must feel the N+1 and read the EXPLAIN output yourself.

**Why now:** You now have enough data for performance problems to be measurable rather than theoretical. And you must feel the N+1 problem before caching, or you'll use caching to hide it instead of fix it.

**Concepts:**
- **The N+1 problem** — how to detect it, and the three real fixes (`JOIN FETCH`, `@EntityGraph`, projections)
- Why `FetchType.EAGER` is not a fix — it just moves the problem
- DTO projections: interface-based and constructor-expression; fetching only what you need
- Specifications / Criteria API for dynamic filtering; when to just write SQL
- **Keyset (cursor) pagination vs offset pagination** — why `OFFSET 100000` destroys your database
- Index design: composite index column order, covering indexes, `EXPLAIN ANALYZE`
- Postgres full-text search — and precisely where its ceiling is (you'll hit it in Track X)
- Read-only transactions and their actual benefit

**Libraries:** none new. Add `datasource-proxy` or `p6spy` for query counting in tests.

**Build:** Public catalog API with filtering (city, date range, category, price band), sorting, keyset pagination. Query-count assertions in tests. Flyway migration adding indexes.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — fetching 50 events with their venues and ticket types executes ≤3 SQL queries total. Test asserts the count programmatically and fails if it regresses. |
| **L2 — Manual checks** | (a) EXPLAIN ANALYZE your main catalog query — confirm index scans, not sequential scans <br>(b) Compare page 1 vs page 2000 response times under offset pagination, then again under keyset. Record both numbers. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, query counts asserted in tests, indexes justified by EXPLAIN |

---

## Step 8 — Concurrency: seat holds and the overselling problem

**Story:** *As a customer, when I select seats they're held for me for 10 minutes; two customers can never be sold the same seat, even under a 10,000-request-per-second on-sale.*

**Mode:** `LEARN` — **Strictly no agent implementation.** This step is the reason the roadmap exists.

**Why now:** This is the hardest step and the reason the domain was chosen. Everything before it was setup.

**Concepts:**
- Why "check then act" is broken under concurrency — the read-modify-write race
- **Optimistic locking** (`@Version`, `OptimisticLockException`) — good for low contention
- **Pessimistic locking** (`@Lock(PESSIMISTIC_WRITE)` → `SELECT ... FOR UPDATE`) — good for high contention
- Choosing between them; the actual decision criteria
- Lock ordering and **deadlock** — why sorting seat IDs before locking prevents it
- Transaction isolation levels: READ COMMITTED vs REPEATABLE READ, what each actually prevents
- Postgres advisory locks
- Hold expiry: TTL semantics, and why a scheduled sweeper is not enough on its own
- Idempotency at the domain level
- **Writing tests that reliably reproduce race conditions** — `CountDownLatch`, `ExecutorService`, virtual threads

**Libraries:** none new — this is deliberately done with just Postgres first. Redis-backed distributed holds arrive in step 12, once you can feel why single-node locking breaks.

**Build:** `SeatHold` with expiry. Hold/release/confirm operations. Scheduled expiry sweeper. Purchase transaction converting holds to tickets. Concurrent test harness.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — 100 concurrent purchase attempts against 10 available seats: exactly 10 succeed, 90 receive 409, zero seats sold twice, zero deadlocks. Real Postgres. Test must be run 20 times consecutively without a flake. |
| **L2 — Manual checks** | (a) Hold seats, wait past TTL, confirm they return to the pool <br>(b) Deliberately reverse your lock ordering and observe a deadlock — then restore the fix. Understanding the failure is the point. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d`, `AP-08-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green across 20 consecutive runs, and you can articulate why you chose optimistic or pessimistic locking here |

---
