---
title: Go Foundations
description: Steps 0–5. Toolchain, the language, errors, interfaces, net/http, goroutines, testing.
sidebar:
  order: 2
---

Six steps on the language itself. You will not touch the webhook domain until step 6.

This is deliberate. Every later step assumes you know what a pointer receiver does, why a channel
can block forever, and what `context` cancellation actually cancels. Someone who skips ahead
writes a delivery worker that leaks a goroutine per request and cannot see why.

---

## Step 0 — Toolchain, quality gate, agent harness

**Story:** *As a developer, I have one command that verifies the whole project, and an AI agent that knows my conventions well enough to be useful rather than plausible.*

**Mode:** `BUILD` — but read every generated line. Tooling you don't understand fails silently later.

**Why now:** Everything downstream depends on a fast, reliable feedback signal. An agent is only as good as the loop it can run unsupervised — if it can't check its own work in one command, it will confidently hand you broken code. This is also the cheapest moment to switch the race detector on: turning it on at step 12 means meeting twenty races at once, and you won't fix them.

**Concepts:**
- **Loop engineering**: the agent's usefulness is bounded by its feedback signal, not its intelligence. Fast, deterministic, one-command verification is what matters most.
- Go modules: `go.mod`, `go.sum`, semantic import versioning, why the module path is a URL
- `gofmt` — there is one formatting style and it is not configurable. This is a feature; nobody on a Go team argues about braces.
- `go vet` versus a linter: `vet` finds likely bugs, `golangci-lint` runs the wider set
- The race detector: what it can and cannot see (it reports races it *observes*, so it needs tests that exercise concurrency)
- `AGENTS.md` as the convention contract; why generic agent instructions produce generic code
- Signal-to-noise as a design constraint on tooling

**Libraries:** none yet. Tools: `golangci-lint`, `goose`, `lefthook`, Docker + Compose. Install tool dependencies with the `tool` directive in `go.mod` so versions are pinned per project rather than per machine.

**Expected outcome:**
- `go.mod` with your module path, Go 1.25+
- `Makefile` exposing `make verify`, `make fmt`, `make test`, `make up`, `make down`
- `.golangci.yml` — staticcheck, errcheck, errorlint, ineffassign, bodyclose
- `lefthook.yml` — `gofmt` and `go vet` on commit
- `AGENTS.md` v1 + a `CLAUDE.md` symlink
- `docs/adr/0001-record-architecture-decisions.md`
- `docker-compose.yml` with Postgres 16 (the rest is added as needed)
- `.gitignore`, `.editorconfig`

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — `make verify` exits 0 on a clean tree and non-zero when each of these is introduced independently: an unformatted file, an ignored error return, a failing test. Check all three separately. |
| **L2 — Manual checks** | (a) Time `make verify` on the empty project. Note the number, and check it again at step 10. <br>(b) Time the pre-commit hook. Over 5 seconds → move checks to CI. <br>(c) Ask your agent "what Go version does this project use and how do I run all checks?" It must answer correctly from `AGENTS.md` alone. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c`, `AP-00-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, and `make verify` is the only command you need to remember |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/) and its v2–v4 checkpoints.

> **Where people quit.** Setting up tooling before writing any Go feels like procrastination. It isn't — it is what makes steps 1–19 fast. If you stall here, ship a minimal `AGENTS.md` plus `make verify` and add `golangci-lint` at step 3. Momentum beats completeness.

---

## Step 1 — The language: types, structs, slices, maps, zero values

**Story:** *As a developer, I can model the Relay domain as Go types, and I understand what my program does with memory when I pass one around.*

**Mode:** `LEARN` — your agent explains and questions. You type every line. This is the step that decides whether the rest of the roadmap is learning or copying.

**Why now:** Nothing else works without it. Go is a small language and this is most of it.

**Concepts:**
- The basic types, and why `int` is not `int64` on every machine
- Structs, struct literals, embedding — and that Go has no classes and no inheritance
- **Zero values**: every type has one, and a `var d Delivery` is usable immediately. Go's designers made "declared but not initialised" safe on purpose.
- Pointers: `&` and `*`, and the two questions that matter — do I want the caller to see my change, and is this struct big enough that copying it is worth avoiding
- Value receivers versus pointer receivers, and the rule to pick one per type and stay with it
- Slices: length, capacity, what `append` does when capacity runs out, and why two slices can share the same array
- Maps: unordered, not safe for concurrent writes, and the `v, ok := m[k]` form
- `nil`: a nil slice is safe to append to, a nil map is not safe to write to. Learn the difference now, not at step 8.
- Named types and `iota` for enums: `type DeliveryState string` beats a bare string
- Exported versus unexported: the capital letter *is* the access modifier

**Libraries:** the standard library only.

**Expected outcome:** A package of the Relay domain types with no behaviour yet — `Event`, `Endpoint`, `Delivery`, `Attempt`, `DeliveryState` — plus a small set of functions over them (does this endpoint's pattern match this event type; what is a delivery's next state). Tests for each. Everything in memory; no database, no HTTP.

```text
internal/
└── delivery/
    ├── delivery.go     the types and their states
    ├── match.go        does "payment.*" match "payment.succeeded"
    └── *_test.go
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — a table-driven test over the pattern matcher covering `payment.*` vs `payment.succeeded` (match), `payment.*` vs `payments.succeeded` (no match), `*` vs anything (match), and the empty pattern (no match). One test function, one table, subtests named after the case. |
| **L2 — Manual checks** | (a) Write a function that takes a `Delivery` by value and changes a field. Prove with a test that the caller does not see the change; then switch to a pointer and prove it does. <br>(b) Append to a slice you obtained by slicing another one, and observe the original change. Explain why. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain out loud when you'd use a pointer receiver |

---

## Step 2 — Errors, interfaces, and package layout

**Story:** *As a developer, my code reports failures in a way a caller can act on, and my packages depend on behaviour rather than on each other.*

**Mode:** `LEARN` — error design and interface placement are judgement skills. An agent that writes them for you leaves you with code you cannot change.

**Why now:** Both show up in every remaining step. Getting them wrong is expensive to undo: retrofitting wrapped errors across forty call sites is a bad day, and an interface declared in the wrong package pulls a dependency through your whole tree.

**Concepts:**
- Errors are values. There are no exceptions, and `if err != nil` is not boilerplate you should hide — it is the control flow.
- Wrapping with `fmt.Errorf("...: %w", err)`, and what `%w` gives you that `%v` doesn't
- Sentinel errors (`var ErrNotFound = errors.New(...)`), custom error types, and choosing between them
- `errors.Is` for identity, `errors.As` for extracting a typed error. Never compare error strings.
- `errors.Join` for the "several things failed" case
- **Interfaces are satisfied implicitly.** There is no `implements` keyword.
- **The consumer declares the interface.** `internal/delivery` says what it needs from storage; `internal/store` just happens to satisfy it. This is the opposite of what Java and C# teach, and it is the single most important design habit in Go.
- Small interfaces: one or two methods. `io.Reader` has one, and it is the most reused type in the language.
- `any` and type assertions, and why you should want very few of them
- Package naming: `package delivery`, used as `delivery.Attempt` — the package name is part of every call, so `delivery.DeliveryAttempt` reads badly
- Why `internal/` is enforced by the compiler, not by convention

**Libraries:** standard library `errors`, `fmt`.

**Expected outcome:** A domain error set for Relay (`ErrEndpointNotFound`, a typed `ValidationError` carrying the field, a typed `DeliveryFailedError` carrying the status code) with wrapping through at least two call layers. A `DeliveryStore` interface declared in `internal/delivery` with an in-memory implementation in the test file. `errcheck` switches on in this step and stays on.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — an error produced three layers deep, wrapped at each layer, is still identified by `errors.Is` at the top, and a typed field error is recovered by `errors.As` with its field name intact. |
| **L2 — Manual checks** | (a) Delete a `%w` and change it to `%v`, watch `ACC-02` fail, and read the failure. <br>(b) Move your `DeliveryStore` interface into the package that implements it, and write down what new import that forces on the consumer. Then move it back. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c`, `AP-02-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, `errcheck` clean, no error compared by string anywhere |

---

## Step 3 — An HTTP service with the standard library

**Story:** *As an operator, I can start Relay, call a health endpoint, and stop it with Ctrl-C without killing an in-flight request.*

**Mode:** `BUILD` — wiring and configuration. Let the agent draft it; you read and question every line, especially the shutdown path.

**Why now:** You need something runnable before there is anything to deliver. Graceful shutdown belongs here rather than at the end, because every later component (workers, the queue, the dashboard) will have to join the same shutdown sequence, and retrofitting that is a rewrite.

**Concepts:**
- `http.Handler` and `http.HandlerFunc` — the whole HTTP model is one interface with one method
- `http.ServeMux` routing patterns since Go 1.22: `"POST /api/v1/events"`, `"GET /deliveries/{id}"`, and `r.PathValue("id")`
- Middleware as a function from `http.Handler` to `http.Handler`; chaining them
- **Server timeouts.** `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`. The zero value of each is "wait forever", which is how a service dies quietly.
- `http.Server.Shutdown(ctx)`: stop accepting, let in-flight requests finish, give up after a deadline
- `signal.NotifyContext` for SIGINT and SIGTERM
- Configuration from the environment into one typed struct, validated at startup. Fail fast and loudly on a missing value.
- `log/slog`: structured logging, handlers, `slog.Group`, and passing a logger rather than reaching for a global
- JSON encoding and decoding, struct tags, and why you should decode into a request type rather than a `map[string]any`

**Libraries:** standard library only — `net/http`, `log/slog`, `os/signal`, `encoding/json`. GitHub Actions CI turns on in this step.

**Expected outcome:** A `cmd/relay` binary that reads config from the environment, serves `GET /healthz` and `GET /readyz`, logs one structured line per request through middleware, and shuts down cleanly on SIGTERM with a deadline.

```text
cmd/relay/main.go        flags, config, wiring, signals
internal/platform/
├── config/              typed config, validated at startup
├── log/                 slog setup
└── httpserver/          server construction, timeouts, shutdown
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — a test starts the server, issues a request to a handler that sleeps 300ms, triggers shutdown while it is in flight, and asserts that the request completes with 200 *and* that the server refuses new connections afterwards. |
| **L2 — Manual checks** | (a) Start the service and `curl` `/healthz`. Then send SIGTERM during a slow request and read the log line ordering. <br>(b) Remove one required environment variable and confirm the process exits at startup with a message naming the variable — not on the first request. <br>(c) Set `WriteTimeout` to 1s, make a handler sleep 2s, and watch what the client sees. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, CI running on push, every server timeout set explicitly |

**Harness impact:** `AGENTS.md` **v2** — record your HTTP conventions: the handler signature you use, where middleware lives, the error response shape, how config is read. Generic agents produce generic Go; this is where yours starts producing *your* code.

---

## Step 4 — Goroutines, channels, context, and the race detector

**Story:** *As a developer, I can run many things at once on purpose, stop all of them on a signal, and prove there is no data race.*

**Mode:** `LEARN` — this is the step the whole roadmap exists for. A generated worker pool teaches nothing, and you will be debugging your own concurrency at step 8 either way.

**Why now:** Before any of it touches the database or a network. Concurrency bugs are hard enough without an external system in the picture. Learn the primitives against a fake workload you fully control, then apply them to real deliveries at step 8.

**Concepts:**
- Goroutines are cheap, but not free, and **nothing waits for them**. A `go f()` whose result nobody reads is a leak with extra steps.
- Channels: unbuffered as a handoff, buffered as a queue, `close` as a broadcast, and reading from a closed channel
- `select`, and the `case <-ctx.Done()` you will write a hundred times
- **Deadlock and leak shapes**: sending on a channel nobody reads, ranging over a channel nobody closes, a `WaitGroup` you forgot to `Done`
- `sync.WaitGroup` and `WaitGroup.Go`; `sync.Mutex` and `RWMutex`; `sync.Once`; `atomic` counters
- **`context.Context`**: cancellation, deadlines, values (used sparingly), and the rule that it is the first parameter and never stored in a struct
- Cancellation is cooperative. A `context` does not kill a goroutine — the goroutine has to check.
- Worker pool as a shape: N goroutines, one job channel, one results channel, a `WaitGroup`, one place that closes what it owns
- **Bounded concurrency is a design requirement, not a tuning knob.** Unbounded goroutines against a slow external server is how a service takes itself down.
- The race detector: `-race`, what it observes, and `goleak` for the goroutines that outlive a test

**Libraries:** standard library plus `go.uber.org/goleak` (test only) and `golang.org/x/sync/errgroup`. Compare `errgroup` against a hand-written `WaitGroup` and decide which you prefer — write down why.

**Expected outcome:** A reusable worker pool in `internal/delivery` with a fake job type: bounded workers, a job channel, per-job `context` deadline, cancellation of everything on shutdown, and a results channel the caller drains. No HTTP, no database.

```text
internal/delivery/
├── pool.go        the worker pool: start, submit, drain, stop
└── pool_test.go   race + leak tests
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — 200 jobs through a pool of 8 workers: every job runs exactly once, a shared counter ends at exactly 200, the test passes under `-race`, and `goleak` reports no goroutine outliving the test. Then cancel the context halfway and assert that the pool stops within a deadline and reports how many jobs it did not run. |
| **L2 — Manual checks** | (a) Remove the mutex around the shared counter and run with `-race`. Read the report — the two stack traces are the point. Put it back. <br>(b) Remove one `Done()` call and watch the test hang; find it with `go test -timeout 5s` and read the goroutine dump. <br>(c) Raise the worker count to 5,000 and watch memory. Write down what bounded concurrency is protecting. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d`, `AP-04-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green under `-race`, `goleak` clean, and you can draw the pool's shutdown sequence on paper |

---

## Step 5 — Testing in Go, properly

**Story:** *As a developer, I can prove behaviour with tests that fail for the right reason, including behaviour that depends on time.*

**Mode:** `LEARN` — a test you did not write is a test you do not trust, and this roadmap gates every step on one.

**Why now:** Steps 6 onward are gated by tests against real infrastructure and real timing. Learn the tools before the domain gets complicated enough to hide behind.

**Concepts:**
- Table-driven tests and `t.Run` subtests — the standard Go shape, and why a slice of cases beats five near-identical functions
- `t.Cleanup`, `t.Helper`, `t.Parallel`, and `t.Context`
- `testing.TB` as the parameter type for test helpers
- `httptest.NewServer` and `httptest.NewRecorder`: a fake receiver you fully control is how every delivery test in this roadmap works
- **Fakes over mocks.** Go's implicit interfaces make a small hand-written fake cheap; a mocking framework mostly adds a DSL you have to learn.
- Golden files for response bodies, and `-update` as a flag
- `testing/synctest`: testing code that sleeps, backs off or times out **without** sleeping in real time. This is what makes step 10's retry schedule testable in milliseconds.
- `testcontainers-go`: a real Postgres per test run, and why an in-memory substitute would invalidate everything from step 8 on
- Benchmarks and `testing.B`, briefly — enough to measure, not to tune
- What not to test: standard-library behaviour, getters, and the shape of your own mocks

**Libraries:** standard `testing`, `net/http/httptest`, `testing/synctest`, `testcontainers-go` (added properly at step 6), `goleak`. `testify/require` is optional — if you take it, take only `require` and never `mock`.

**Expected outcome:** The step 4 pool retested as a table. A shared test helper package that spins up an `httptest` receiver which can be told to answer slowly, answer `429`, or hang. A first `synctest` test proving a function that waits 30 seconds completes in a test run measured in milliseconds.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — a `synctest` test of a function that sleeps for 30 seconds and then returns, asserting both the return value and that the wall-clock duration of the test is under 100ms. Plus a table-driven test with at least four named subtests where each failure message names the case. |
| **L2 — Manual checks** | (a) Break the implementation on purpose and check that each subtest failure tells you *which case* failed without you opening the code. <br>(b) Run `go test ./... -count=1 -race` and note the runtime. If it is already over a minute, fix it now. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, no `time.Sleep` in any test, and every test helper takes `testing.TB` |
