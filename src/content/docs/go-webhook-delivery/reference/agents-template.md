---
title: AGENTS.md Template
description: The v1 agent harness template for Relay — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 0](../../roadmap/go-foundations/), and the file the
[agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 0.** Copy it to your repo root and fill the `<>` placeholders.
> Symlink it so every tool finds it: `ln -s AGENTS.md CLAUDE.md`
>
> Evolution checkpoints (v2–v4) are at the bottom. Tick them off as you reach those steps.
> **Do not write v4 on day 1.** You don't yet know your own conventions, and a harness full of
> guessed rules is worse than a short honest one.

---

## Project

**Relay** — a webhook delivery platform. Events come in over an HTTP API; Relay delivers them to
customer endpoints with retries, signing, rate limits and a replay dashboard. One Go binary,
PostgreSQL, no message broker.

Three subscribers are seeded and used in every test. They disagree on purpose:

- **Kirana Ledger** — one endpoint, `invoice.*`, answers 200 in about 40ms. The control case.
- **Meridian Bank Sandbox** — `payment.*`, requires a valid HMAC signature, 5 requests per second
  then `429` with `Retry-After: 30`, cuts the connection after 2 seconds.
- **Pixel Forge Studio** — three endpoints on `render.*`, events ordered per `job_id`, endpoint
  down for up to six hours at a time.

A feature works when it works for all three. **Never special-case one of them in code** — an
`if endpoint.Name == …` means a field is missing from the model.

This is a **learning project** following `docs/ROADMAP.md`. Correctness and comprehension matter
more than delivery speed. There is no deadline.

Current step: `<N>` — update this line every step. It is the single most useful line in this file.

---

## The mode contract — read this before writing code

Every roadmap step is labelled `LEARN` or `BUILD`. Check the current step's label before acting.

### `LEARN` steps — do not write implementation code

Steps 1, 2, 4, 5, 6, 7, **8**, 9, **10**, **11**, **12**, 13, 17, **18**.

Your role is tutor and reviewer:
- Explain concepts, mechanisms, and trade-offs
- Ask questions that expose gaps in the developer's reasoning
- Review code they wrote against the step's rubric
- Point at the relevant part of the problem — never hand over the solution

**Do not** produce the implementation, even when asked directly, even when it would be faster. If
asked, respond with the question that leads them there instead.

Rationale: the developer is new to Go. Go's syntax is small enough that reading generated code
feels like understanding it, right up to the moment they have to write it. These steps teach
concurrency, queueing and failure handling, and those only survive being struggled with.

You may still write: tests they specify, boilerplate config, migration scaffolding, and anything
in a `LEARN` step that is not the core concept.

### `BUILD` steps — pair or autonomous

Steps 0, 3, 14, 15, 16, 19.

Generate freely. Scaffolding, config, templates, wiring, boilerplate. Then explain what you
generated so it is reviewed rather than absorbed.

---

## The loop

`make verify` is the single source of truth. It runs `gofmt -l` → `go vet` → `golangci-lint` →
`go test ./... -race` → `go build ./...`.

**Run it after every change. Do not report work as complete without a green run.**

```
make verify     # everything. the one you care about.
make fmt        # gofmt -w
make test       # tests only, faster iteration
make up         # start Postgres
make down       # stop it
```

If `make verify` fails, fix it before continuing. Never disable a check to make it pass — if a
rule seems wrong, raise it, don't route around it. A gate that gets bypassed once gets bypassed
always.

---

## Stack

| Layer | Choice |
|---|---|
| Language | Go 1.25+, modules |
| HTTP | Standard library `net/http`, routing patterns, hand-written middleware |
| Database | PostgreSQL 16 via `pgx/v5` + `pgxpool`, hand-written SQL |
| Migrations | `goose`, embedded with `embed.FS` |
| Queue | PostgreSQL, `FOR UPDATE SKIP LOCKED` |
| Logging | `log/slog` — JSON in production, text locally |
| Metrics | `prometheus/client_golang`, `/metrics`, `pprof` on the internal listener only |
| Dashboard | `html/template` + `embed` + htmx (vendored) |
| Testing | `testing`, `httptest`, `testcontainers-go`, `testing/synctest`, `goleak`, `-race` |
| Rate limiting | `golang.org/x/time/rate` |
| Quality | `gofmt`, `go vet`, `golangci-lint` (staticcheck, errcheck, errorlint, ineffassign, bodyclose), `govulncheck` |

**Never suggest:** a web framework (Gin, Echo, Fiber, Chi), an ORM (GORM, ent), a message broker
(Kafka, NATS, RabbitMQ), Redis, or a JavaScript framework. Each is a recorded decision in
`docs/adr/`, not an oversight. Also never: `http.DefaultClient`, `panic` as error handling, or a
third-party retry library.

---

## Layout

```
cmd/relay/          main: flags, wiring, signal handling
internal/
├── ingest/         the events API — validation, idempotency
├── delivery/       the core: queue, worker pool, retry policy, breaker
├── endpoint/       endpoints, secrets, subscriptions, rate limits
├── httpx/          signing, the outbound client, middleware
├── store/          Postgres access, transactions
├── web/            dashboard handlers and templates
└── platform/       config, logging, metrics, shutdown
migrations/         goose SQL, embedded
```

`internal/delivery` holds the rules. It must not import `internal/web`, `net/http` handlers, or
`pgx` directly. What it needs from storage is an interface **it declares itself** — in Go the
consumer defines the interface, not the implementation.

---

## Non-negotiable conventions

**Errors**
- Wrap with `%w`, never `%v`, when the caller might want to inspect it
- `errors.Is` / `errors.As`. **Never compare error strings.**
- No ignored error returns. `_ = f()` requires a comment saying why.
- `panic` only for programmer errors at startup, never for a failed request or delivery

**Concurrency**
- Every goroutine has an owner that knows when it finished
- Concurrency is bounded by design. Never one goroutine per row.
- `context.Context` is the first parameter, never a struct field
- `context.Background()` only in `main`
- No shared mutable state without a mutex or a channel
- Never hold a database transaction open across an outbound HTTP call

**Database**
- Positional parameters only. **Never** build SQL with `fmt.Sprintf`.
- Every query takes a context
- Schema comes only from migrations; migrations are immutable once merged
- Business rules live in Go, not in SQL

**HTTP**
- Every server timeout set explicitly; the zero value means "wait forever"
- Every outbound call has a deadline and a per-endpoint timeout
- Always `defer resp.Body.Close()`, and drain the body so the connection is reused
- One error envelope across the whole API. Never 200 with an error payload.
- Never leak internal errors, SQL text, or stack traces to a client

**Security**
- Default deny. Every route gets an explicit rule.
- `hmac.Equal` for signature comparison, never `==`
- Secrets and API keys stored hashed, never readable
- Session cookies: `HttpOnly`, `Secure`, `SameSite`
- Role checks are insufficient — verify workspace ownership separately

**Testing**
- Table-driven with named subtests
- `-race` always; `goleak` in every package that starts goroutines
- Real Postgres via testcontainers. Never SQLite, never an in-memory fake.
- `testing/synctest` for anything involving time. **No `time.Sleep` in tests.**
- Never mock the thing under test

**Dashboard**
- `html/template` only. `template.HTML` requires a comment justifying it.
- Templates parsed once at startup, embedded in the binary
- Assets vendored — the service must run with no outbound internet access
- Keyset pagination, never `OFFSET`

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly, and review is the point.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** Go's standard library changes between versions — if you're unsure a function exists, say so rather than producing plausible code.
- **No scope creep.** Don't add a circuit breaker at step 8 or metrics at step 10. Later steps cover them deliberately.
- **Never bypass a quality gate.** No `//nolint`, no `--no-verify`, no skipped test, without explicit discussion.

---

## Decisions

Architecture decisions live in `docs/adr/`. Read them before proposing anything structural —
several were made deliberately and against the obvious default (no framework, no ORM, no broker,
no leader election).

When a decision is made in conversation, offer to record it as an ADR. Undocumented decisions get
silently reversed three steps later.

---

## Code review

The reviewer prompt is `docs/REVIEWER-PROMPT.md`. It is the source of truth for review behaviour —
this file does not duplicate it.

To review: load that prompt, the current step's section from `docs/RUBRICS.md`, and the code.
**Only the current step's rubric.** Loading the whole file leaks later steps and produces
off-scope findings.

---

## Evolution checkpoints

Update this file at these points. Each is a roadmap step's "harness impact" note.

- [ ] **v1 — Step 0.** This template, placeholders filled.
- [ ] **v2 — Step 3.** HTTP conventions: handler shape, where middleware lives, the error response shape, how config is read.
- [ ] **v2b — Step 7.** API conventions: the error envelope, status-code policy, the idempotency rule, the fan-out transaction boundary.
- [ ] **v3 — Step 14.** Every handler and worker gets a correlation ID and a metric. The fields that must never be logged. The metric label-cardinality rule.
- [ ] **v4 — Step 19.** Deployment facts, the configuration surface, the retention policy, and the load-test numbers to compare against after any change.

**At v4, reread v1.** The gap between them is a fair measure of what you actually learned — a
harness is only as good as your understanding of the system it describes, which is exactly why
this file could not be written well on day 1.
