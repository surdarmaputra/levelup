---
title: Roadmap Overview
description: Locked decisions, the domain model, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Can program in some language. Has never written Go. |
| Language | Go 1.25 or newer, modules, one `go.mod` |
| Framework | **None.** Standard library `net/http`, routing patterns from Go 1.22. No Gin, Echo, Fiber or Chi. |
| Domain | Webhook delivery platform (**Relay**) |
| Architecture | One binary, `cmd/` + `internal/` layout. API server and workers run in the same process, switchable by flag. |
| Database | PostgreSQL 16 via `pgx/v5`. Hand-written SQL, no ORM. |
| Migrations | `goose`, embedded in the binary |
| Queue | PostgreSQL, `SELECT … FOR UPDATE SKIP LOCKED`. **No Redis, no Kafka, no RabbitMQ.** |
| Dashboard | `html/template` + `embed` + htmx. No JavaScript framework, no build step, no CDN. |
| Auth | API keys for ingest; cookie sessions + CSRF for the dashboard |
| Logging | `log/slog`, JSON in production, text locally |
| Metrics | `prometheus/client_golang`, `/metrics`, plus `net/http/pprof` behind an internal route |
| Testing | Standard `testing`. Table-driven. `testcontainers-go` for Postgres, `testing/synctest` for time, `-race` always. |
| Go quality | `gofmt` → `go vet` → `golangci-lint` (staticcheck, errcheck, errorlint, bodyclose, ineffassign) → `govulncheck` |
| Ops | Multi-stage Docker to a static binary, Compose + nginx in front of 2 app instances, single VPS |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** 20 numbered steps, 0 through 19. Steps 0–5 are the language; they exist
because the audience is new to Go, and a service written by someone who has not yet met pointers,
interfaces and channels is a service that has to be rewritten at step 8.

**Note on dependencies:** the dependency list stays short on purpose. Go's culture is to reach
for the standard library first, and a `go.mod` with six direct dependencies is a stronger
portfolio signal than one with sixty. Every third-party package in this roadmap has to justify
itself against "what would the standard library do".

---

## Why this domain

Webhook delivery was chosen because it *forces* Go's real subject matter rather than decorating
with it:

- **Every delivery waits on somebody else's slow server** → goroutines, worker pools, `context` deadlines
- **Receivers fail, hang, and rate-limit you** → retries, backoff with jitter, circuit breaking, dead-letter
- **Work is claimed by more than one worker and more than one process** → transactions, `SKIP LOCKED`, leases
- **Delivery is at-least-once** → idempotency, signatures, replay windows
- **One customer must not slow down the others** → fairness and per-endpoint isolation
- **Some events have to arrive in order** → per-key serialization, and the throughput it costs

A CRUD app cannot teach these. Any goroutine you added to one would be for show.

---

## The three example subscribers

Every step is written against the same three subscribers. Seed them at step 6 and keep them for
the rest of the roadmap — they disagree with each other on purpose, and a feature that works for
all three is a feature that works.

| Subscriber | Setup | The rule it exists to break |
|---|---|---|
| **Kirana Ledger** | One endpoint, subscribed to `invoice.*`. Replies `200` in about 40ms. Accepts anything. | None — it is the control. If Kirana's deliveries are wrong, no later step's cleverness matters. Every change gets checked against it first. |
| **Meridian Bank Sandbox** | One endpoint, `payment.*`. Requires a valid HMAC signature or answers `401`. Caps at 5 requests per second, then `429` with `Retry-After: 30`. Cuts the connection after 2 seconds. | "Retry on your own backoff, as fast as it allows." A server can tell you to wait, and it outranks your schedule. Also: a limited endpoint must not consume the workers the other two need. |
| **Pixel Forge Studio** | **Three** endpoints on the same `render.*` events. Events for one `job_id` must arrive in order. The tunnel is down for up to six hours at a time. | "One subscription is one endpoint, deliveries are independent, workers are fully parallel." Fan-out, per-key ordering, head-of-line blocking, dead-letter after a long outage, ordered replay. |

**None of the three is ever special-cased in code.** An `if endpoint.Name == "Meridian"` means a
field is missing from your model — a rate limit, a signing requirement, an ordering key — not
that the customer is unusual.

Concrete questions to keep asking as you build: when Meridian answers `429`, does Kirana's next
delivery still go out immediately? While Pixel Forge is down for six hours, how many goroutines
and how many database connections is Relay holding? After a replay, does `render.finished` still
arrive last?

---

## The domain model (target state)

```
Workspace ──owns──> Endpoint ──subscribes to──> event type pattern ("payment.*")
                       │
                       └──has──> secret, rate limit, timeout, ordering setting

Event ──fans out to──> Delivery ──has many──> Attempt
  │                       │
  │                       └── state: pending → in_flight → succeeded
  │                                                     └→ failed → (retry) → dead
  └── type, payload, ordering_key, idempotency_key
```

- **Event** — what came in through the ingest API. Immutable once accepted.
- **Delivery** — one event aimed at one endpoint. The unit of work in the queue. One event to
  Pixel Forge's three endpoints creates three deliveries.
- **Attempt** — one HTTP request: when it went out, the status code, the response body prefix,
  the duration, the error. This is what the dashboard shows and what makes debugging possible.

Package layout (enforced by review from step 2, by import rules from step 9):

```
relay/
├── cmd/relay/          main: flags, wiring, signal handling
├── internal/
│   ├── ingest/         the events API — validation, idempotency
│   ├── delivery/       the core: queue, worker pool, retry policy
│   ├── endpoint/       endpoints, secrets, subscriptions, rate limits
│   ├── httpx/          signing, the outbound client, middleware
│   ├── store/          Postgres access, migrations, transactions
│   ├── web/            dashboard handlers and templates
│   └── platform/       config, logging, metrics, shutdown
└── migrations/         goose SQL files, embedded
```

`internal/delivery` holds the rules and must not import `net/http` handlers, the dashboard, or
the database driver directly. Everything it needs from storage arrives through a small interface
it declares itself — Go's convention is that the *consumer* defines the interface, not the
implementation.

---

## Global guardrails (Verification Layer 5)

These are continuous, not per-step. Each switches on at a specific step and stays on. CI fails on
violation.

| Guardrail | On from | Rule |
|---|---|---|
| `gofmt -l` | Step 0 | Build fails on unformatted code. Auto-fixable, never argued about. |
| `go vet` | Step 0 | Catches printf mistakes, lost struct tags, unreachable code. Free, always on. |
| `golangci-lint` | Step 0 | staticcheck, errcheck, errorlint, ineffassign, bodyclose. Start with this set; add a linter only when it catches a bug you actually had. |
| `go test -race` | Step 0 | The race detector runs on every test run, locally and in CI. Not an occasional check. |
| Lefthook pre-commit | Step 0 | `gofmt` + `go vet` + fast tests. Must run in under 5 seconds or it gets bypassed. |
| `make verify` | Step 0 | One command: format → vet → lint → test with race → build. Local, CI, and the agent loop all use it. |
| GitHub Actions CI | Step 3 | Runs `make verify` on every push. Nothing else. |
| No ignored errors | Step 2 | `errcheck` fails the build on a dropped error return. `_ = f()` requires a comment saying why. |
| Testcontainers Postgres | Step 6 | Integration tests run real Postgres. No SQLite, no in-memory fake — the queue depends on `SKIP LOCKED`, which only Postgres has. |
| `goleak` in package teardown | Step 8 | Every test package fails if a goroutine outlives the test. A leaked goroutine is the most common Go bug and the hardest to notice. |
| Coverage gate | Step 10 | ≥80% on `internal/delivery` only. Not global — a global target produces tests written for the number. |
| Import boundary check | Step 9 | `internal/delivery` must not import `internal/web`, `internal/store` internals, or `github.com/jackc/pgx`. A small `go test` over `go list` output is enough; no extra tool. |
| `govulncheck` | Step 14 | Fails on a known vulnerability that your code actually reaches. |
| Context discipline | Step 11 | Every outbound call and every query takes a `context.Context` from the caller. No `context.Background()` outside `main`. |
| No CDN in the dashboard | Step 15 | htmx and CSS are vendored and served by the binary. The service must run with no outbound internet access. |
| Static binary build | Step 19 | CI builds `CGO_ENABLED=0` for `linux/amd64` and fails if the binary does not start with `--help`. |

**On what's deliberately absent: a web framework.** Since Go 1.22 the standard library's
`http.ServeMux` handles method and path patterns (`"POST /api/v1/events"`, `"GET /deliveries/{id}"`),
which is most of what people used a router for. Middleware in Go is a function that takes an
`http.Handler` and returns one — you will write it in ten lines and understand every one of them.
Adding a framework here would hide exactly the interfaces you're here to learn, and every Go team
you might join expects you to read standard-library HTTP code.

---

## Reading the steps

Each step's structure, the `LEARN`/`BUILD` mode contract, and the five verification layers are
explained in [Getting Started](../../#how-to-read-a-roadmap-step). Read that first if you haven't.
