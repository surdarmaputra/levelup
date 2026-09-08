---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is
the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only
names by ID — a lookup you read one section of per step, not a checklist you complete. It has two
parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It
states exactly what must be proven — *"500 deliveries, 4 dispatchers, every delivery processed
exactly once"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still
wrong: the goroutine started per delivery with nothing bounding it, the retry loop without jitter
that makes every worker hit the same dead endpoint in the same second. Most don't show up at
runtime until they do.

**Why this exists.** The common failure of self-directed learning is that everything *feels* like
it works. The rubric turns "done" into something you check rather than something you feel.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never
   the whole file. The full file leaks later steps and dilutes the reviewer's attention.

---

## Step 0 — Toolchain and harness

**ACC-00** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: an unformatted file, an ignored error return, a failing test. All three must be verified separately — a gate that only catches one thing gives false confidence about the other two.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over about 5 seconds gets bypassed with `--no-verify`, permanently, and then the gate exists only in theory. Move slow checks to CI. |
| AP-00-b | **Multiple verification commands.** If you (or the agent) must remember four commands, some will be skipped. One entry point, always. |
| AP-00-c | **Generic `AGENTS.md`.** Restating public Go documentation adds nothing — the model already knows it. The file's value is entirely in what is specific to this project: the package layout, the conventions, the deliberate deviations. |
| AP-00-d | **The race detector left off by default.** `go test ./...` without `-race` in the standard command means races are found by production, not by CI. |

---

## Step 1 — The language

**ACC-01** — A table-driven test over the subscription pattern matcher: `payment.*` matches `payment.succeeded`; `payment.*` does not match `payments.succeeded`; `*` matches anything; the empty pattern matches nothing. One test function, one table of named cases, `t.Run` per case.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Mixed value and pointer receivers on one type.** The method set differs between `T` and `*T`, so mixing them produces types that satisfy an interface only when addressable. Pick one per type and stay with it. |
| AP-01-b | **A map written from more than one place with no synchronisation.** Go maps are not safe for concurrent writes and the runtime will stop the program. Even before concurrency exists, treat a shared map as a decision to explain. |
| AP-01-c | **Stringly-typed states.** `d.State = "pending"` scattered across the code instead of a named type with constants. The compiler cannot help you with a typo in a string literal. |

---

## Step 2 — Errors and interfaces

**ACC-02** — An error created three call layers deep and wrapped with `%w` at each layer is still matched by `errors.Is` at the top layer, and a typed validation error is recovered by `errors.As` with its field name intact.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Errors compared by string.** `if err.Error() == "not found"` breaks the moment anyone rewords a message, and it cannot see a wrapped error at all. `errors.Is` and `errors.As` exist for this. |
| AP-02-b | **Dropped errors.** `_ = tx.Rollback()` or a bare call whose error return is ignored. If it genuinely cannot be handled, the underscore needs a comment saying why — otherwise `errcheck` is right. |
| AP-02-c | **The interface declared next to its implementation.** Declaring `DeliveryStore` in the store package forces every consumer to import the store. The consumer declares what it needs; Go's implicit satisfaction is what makes this work. |
| AP-02-d | **Wide interfaces.** A ten-method `Store` interface exists to describe a struct, not to describe a need. It makes fakes expensive and tells you nothing about what a caller actually uses. |

---

## Step 3 — HTTP service

**ACC-03** — A test starts the server, issues a request to a handler that sleeps 300ms, triggers shutdown while that request is in flight, and asserts the request completes with 200 *and* that new connections are refused afterwards.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **`http.ListenAndServe` with no timeouts.** Every timeout's zero value is "wait forever". One slow or malicious client then holds a connection indefinitely, and the service degrades in a way no test will show you. |
| AP-03-b | **No graceful shutdown.** Exiting on SIGTERM kills in-flight requests and, from step 8 on, in-flight deliveries. Every deploy then loses work. |
| AP-03-c | **A package-level logger or config variable.** A global makes the logger untestable, prevents per-request fields, and hides the dependency from every reader of the function signature. |
| AP-03-d | **Config read at point of use.** `os.Getenv` inside a handler means a missing value surfaces on a user's request instead of at startup. Read and validate all config in one place, before serving. |

---

## Step 4 — Concurrency

**ACC-04** — 200 jobs through a pool of 8 workers: every job runs exactly once, a shared counter ends at exactly 200, the test passes under `-race`, and `goleak` reports no goroutine outliving the test. Cancelling the context halfway stops the pool inside a deadline and reports how many jobs did not run.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Unbounded goroutines.** `go deliver(d)` per row means one dead endpoint and a large backlog turn into a hundred thousand goroutines, each holding a connection. Concurrency has to be bounded by design, not by luck. |
| AP-04-b | **A goroutine nobody waits for.** Started and forgotten, it either leaks or is killed mid-work at shutdown. Every goroutine needs an owner that knows when it finished. |
| AP-04-c | **`context.Context` stored in a struct field.** It is a per-call value with a per-call lifetime. In a field it outlives its request and cancels the wrong thing, or nothing. |
| AP-04-d | **`time.Sleep` used for coordination.** Sleeping until another goroutine is "probably ready" makes tests slow and flaky in the same change. Use a channel, a `WaitGroup`, or `synctest`. |
| AP-04-e | **A channel closed by a receiver, or closed twice.** The sender owns the close. Closing from the wrong side panics the moment the timing shifts. |

---

## Step 5 — Testing

**ACC-05** — A `synctest` test of a function that waits 30 seconds and then returns asserts both the return value and that the test's real duration is under 100ms. Plus a table-driven test with at least four named subtests where each failure message identifies its case without opening the source.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **`time.Sleep` in a test.** It is either too short (flaky) or too long (slow), and usually both on different machines. |
| AP-05-b | **A test that passes against an empty implementation.** If deleting the function body leaves the test green, it asserts nothing. Check this deliberately at least once per step. |
| AP-05-c | **Mocking the thing under test.** A queue test that fakes the claim query proves the fake works. Fake the boundary, not the subject. |
| AP-05-d | **Assertions with no message and no subtest name.** `if got != want { t.Fail() }` tells you a test broke and nothing else. Report got and want. |

---

## Step 6 — Persistence

**ACC-06** — Against a real Postgres container: an endpoint with a rate limit, timeout and subscription pattern round-trips every field, including UTC timestamps and nullable columns. The seed command run twice is idempotent — three subscribers, five endpoints, no duplicates.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **SQL built with string formatting.** `fmt.Sprintf("... WHERE id = '%s'", id)` is an injection vector even when today's caller is trusted. Positional parameters, always. |
| AP-06-b | **A query without a context.** No context means no cancellation and no deadline: a shutdown waits for it, and a client that has already gone away still costs you a connection. |
| AP-06-c | **An in-memory or SQLite substitute for tests.** The whole queue depends on `FOR UPDATE SKIP LOCKED`, which Postgres has and the substitutes do not. Tests pass, production breaks. |
| AP-06-d | **Business rules in SQL.** A retry decision expressed as a `CASE` in a query cannot be unit-tested, cannot be read by the next person, and will disagree with the Go code that also implements it. |

---

## Step 7 — Ingest and idempotency

**ACC-07** — The same event posted five times concurrently with one idempotency key produces exactly one event row, exactly the right number of delivery rows (three for `render.*`, one for `payment.*`), and five responses carrying the same event ID. Against real Postgres.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Idempotency by "check then insert".** Two concurrent requests both find nothing and both insert. The uniqueness has to be a database constraint; the check is an optimisation, not the mechanism. |
| AP-07-b | **The event and its deliveries written in separate transactions.** A crash between them leaves an accepted event that will never be delivered, and nothing in the system will ever notice. |
| AP-07-c | **An unbounded request body.** Reading a 40MB JSON body into memory per request is a denial-of-service with no attacker required. `http.MaxBytesReader` before decoding. |
| AP-07-d | **200 with an error payload.** Status codes are the machine-readable contract. `{"ok": false}` inside a 200 breaks every client's error handling, including the ones you will write. |

---

## Step 8 — The queue

**ACC-08** — 500 pending deliveries, 4 concurrent dispatchers against one Postgres, 8 workers each: every delivery is processed exactly once, no delivery is claimed twice, clean under `-race`, `goleak` clean. Killing one dispatcher mid-run leaves no work undone — its claims are reclaimed and completed by the others.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **A transaction held open across the outbound HTTP call.** A six-hour Pixel Forge timeout then holds a database connection for six hours. Claim, commit, *then* call. |
| AP-08-b | **`SELECT` without `FOR UPDATE SKIP LOCKED`.** Either every worker gets the same row, or every worker queues behind the first one. Both look fine with one dispatcher running. |
| AP-08-c | **No lease or lease expiry.** A worker killed mid-delivery leaves the row `in_flight` forever, and nothing retries it. Silent, permanent data loss. |
| AP-08-d | **Claiming more work than the pool can run.** A batch of 500 claimed by 8 workers means 492 rows leased and idle, invisible to the other instance and expiring for no reason. |
| AP-08-e | **Polling with no idle backoff.** A tight loop against an empty queue burns CPU and database connections doing nothing. Back off when idle, reset when work appears. |

---

## Step 9 — Signed delivery

**ACC-09** — A delivery reaches an `httptest` receiver that verifies the signature exactly as the shipped example does. A correct signature is accepted; a modified body is rejected; a signature timestamped six minutes ago is rejected; a request signed with a rotated-out secret is still accepted while both secrets are active.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **`http.DefaultClient`, or any client without a timeout.** Its zero timeout means a hanging receiver holds a worker until the process restarts. |
| AP-09-b | **Signature compared with `==`.** A byte-by-byte comparison that exits early leaks timing information. `hmac.Equal` exists for exactly this and costs nothing. |
| AP-09-c | **No timestamp inside the signed string.** A signature over the body alone is replayable forever: anyone who captured one request can resend it tomorrow and it verifies. |
| AP-09-d | **Response body not closed, or not drained.** Leaking a body leaks a connection; not draining it prevents connection reuse, so a thousand deliveries to one host open a thousand connections. |
| AP-09-e | **Retrying a permanent failure.** A `400` or `422` will fail identically in six hours. Retrying it wastes twelve attempts and hides the real problem from the customer. |

---

## Step 10 — Retries and backoff

**ACC-10** — With `synctest`: a receiver failing with 503 for six simulated hours, then succeeding. The delivery eventually succeeds, the attempt count matches the schedule, no two consecutive intervals are identical, no interval exceeds the 6-hour cap, and the test runs in under a second of real time. Separately: `429` with `Retry-After: 30` is retried at roughly 30 seconds rather than at the backoff value, and a `400` is never retried.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Backoff without jitter.** Everything that failed together retries together, forever, in a thundering herd that keeps the recovering endpoint down. This is the single most common webhook bug. |
| AP-10-b | **Ignoring `Retry-After`.** The receiver told you when to come back. Retrying sooner is how a rate limit becomes a ban. |
| AP-10-c | **Retry scheduled by a sleeping goroutine.** The process restarts, the goroutine dies, the retry never happens. The schedule belongs in a column, not in memory. |
| AP-10-d | **No cap on backoff or attempts.** Without a ceiling, an interval grows into days; without a maximum attempt count, dead deliveries accumulate forever and nobody is ever told. |
| AP-10-e | **Dead-lettering with no reason recorded.** "Failed" without the last status, the last error and the attempt count leaves an operator with nothing to act on, which makes the whole retry system unmaintainable. |

---

## Step 11 — Rate limits and fairness

**ACC-11** — 500 deliveries queued for Meridian (5 rps, every request `429`) alongside 20 for Kirana: every Kirana delivery completes within 5 seconds of being queued, Meridian's outbound rate never exceeds 5 in any one-second window, and no worker is blocked longer than one delivery's duration.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **A worker blocking on `limiter.Wait`.** Thirty seconds waiting for a Meridian token is thirty seconds not delivering to Kirana. Check and reschedule instead of parking the worker. |
| AP-11-b | **A claim query ordered only by due time.** One busy endpoint takes every slot and the quiet ones starve. Fairness has to be in the query, not in hope. |
| AP-11-c | **A limiter map that only grows.** An entry per endpoint that is never evicted is a slow leak, and a `map` read and written from many workers without a mutex is a crash. |
| AP-11-d | **`context.Background()` inside a worker.** It detaches the call from shutdown and from every deadline above it, so a drain waits for a request nobody can cancel. |

---

## Step 12 — Ordering

**ACC-12** — 3 render jobs × 20 events, interleaved, delivered to an ordered endpoint by 8 workers, with the receiver failing job 2's fifth event twice. Within each `job_id` the receiver saw the events in sequence with no gaps; jobs 1 and 3 were not delayed by job 2's retries; clean under `-race`.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Ordering enforced in memory.** A per-key mutex or an in-process map works until the second instance starts, then silently stops working. The claim query is the only place it can live. |
| AP-12-b | **Global ordering instead of per-key.** Serialising every delivery to preserve one job's order turns an 8-worker pool into one worker, and no customer asked for it. |
| AP-12-c | **Ordering applied to endpoints that did not ask for it.** Kirana pays Pixel Forge's throughput cost for nothing. It is a per-endpoint setting. |
| AP-12-d | **No policy for a dead-lettered ordered event.** The events behind it either block forever with nobody told, or skip ahead and break the guarantee you sold. Either is fine documented; neither is fine by accident. |

---

## Step 13 — Circuit breaking

**ACC-13** — With `synctest`: a permanently failing endpoint trips the breaker after the configured consecutive failures; no deliveries are attempted during the cooldown; exactly one probe follows it; a failed probe reopens without letting others through; a successful probe closes it and the backlog drains. Asserted on exact attempt counts.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Breaker state in memory only.** It resets on every restart and disagrees between instances, so the endpoint is "healthy" again after each deploy regardless of reality. |
| AP-13-b | **A half-open probe per instance.** Two instances probing a struggling endpoint at once is exactly the load the breaker exists to prevent. One conditional update on the row is enough. |
| AP-13-c | **A breaker used as a substitute for backoff.** They solve different problems: backoff spaces one delivery's attempts, a breaker stops spending workers on a dead endpoint. Removing either leaves a real failure mode. |
| AP-13-d | **A trip threshold with no reason behind it.** "Five failures" chosen at random either trips on normal noise or never trips at all. Tie it to something you measured. |

---

## Step 14 — Observability

**ACC-14** — One correlation ID appears in the ingest log line, the worker log line, the outbound request header the receiver observed, and the attempt row. After 50 deliveries with 10 failures, the attempts counter reads exactly 50, split 40/10 by outcome.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Log messages instead of log fields.** `slog.Info(fmt.Sprintf("delivery %s failed with %d", id, code))` cannot be filtered or aggregated. Fields exist so a machine can read them. |
| AP-14-b | **Secrets, signatures or full payloads in logs.** Logs are copied to places the database never goes. Once a signing secret is in a log line it is compromised. |
| AP-14-c | **Unbounded metric labels.** A label carrying a delivery ID or an event type from customer input creates a new time series per value and takes the metrics system down. |
| AP-14-d | **`pprof` on the public listener.** `net/http/pprof` registers on the default mux by accident more often than on purpose. It exposes memory contents and a free CPU-burn endpoint. |

---

## Step 15 — Dashboard pages

**ACC-15** — A delivery whose endpoint name is `<script>alert(1)</script>` and whose stored response prefix contains raw HTML renders escaped, with no raw tags in the output. The deliveries list renders correctly with zero rows, one row, and a full page.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **`text/template` for HTML, or `template.HTML` on user data.** Both disable the contextual escaping that makes `html/template` safe, and both produce a cross-site scripting hole from a customer-controlled string. |
| AP-15-b | **Templates parsed per request.** It re-reads and re-compiles on every page load, and a broken template then fails for a user instead of at startup. |
| AP-15-c | **`OFFSET` pagination over a large table.** Page 500 scans everything before it. It looks fine on seeded data and stops working on real data. |
| AP-15-d | **Assets loaded from a CDN.** The dashboard then breaks in an environment with no outbound internet access, and every page load reports a visit to a third party. |

---

## Step 16 — htmx and replay

**ACC-16** — Replaying a dead Pixel Forge delivery creates a new delivery row, leaves the dead row unchanged, carries the same event and ordering key, and is delivered after any other pending delivery for that key. With `HX-Request` set, the response is a fragment rather than a full document.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Replay that mutates the dead delivery.** Resetting the row to `pending` destroys the history of what happened, which is the only reason the record was kept. |
| AP-16-b | **Replay that ignores ordering and rate limits.** A bulk replay of 500 Meridian deliveries at full speed is the outage you built step 11 to prevent, triggered by your own dashboard. |
| AP-16-c | **A state-changing action behind `GET`.** A replay link that a browser prefetch, a crawler, or a preview fetcher can trigger will eventually be triggered by one of them. |
| AP-16-d | **Full pages returned to htmx requests.** Nesting a whole document inside a target produces duplicated `<html>` elements and a page that degrades a little more with every swap. |

---

## Step 17 — Authentication

**ACC-17** — Every non-public route, enumerated from the route table, returns 401 or a redirect when unauthenticated. A valid session posting a form without a CSRF token gets 403. An operator of workspace A replaying workspace B's delivery gets 403. A revoked API key is rejected.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Default allow.** Restricting selected routes rather than permitting selected ones means the next route added is public, and nobody will notice. |
| AP-17-b | **Role check without ownership check.** "Is an operator" does not answer "whose workspace". It lets any customer replay any other customer's deliveries. |
| AP-17-c | **API keys stored in readable form.** A database dump or a stray log line then hands over every producer's credentials. Store a hash; show the key once. |
| AP-17-d | **Session cookies without `HttpOnly`, `Secure` and `SameSite`.** Each missing flag is a separate, well-documented attack. |
| AP-17-e | **A fast hash for passwords.** SHA-256 or MD5 over a password is a list of plaintext passwords with extra steps. Use bcrypt or argon2id with a defensible cost. |

---

## Step 18 — Two instances

**ACC-18** — With two instances running: 1,000 Meridian deliveries never exceed 5 outbound requests per second across both instances combined. SIGTERM to one instance mid-run leaves every delivery completed exactly once, none `in_flight`, and none sent twice.

| ID | Anti-pattern |
|---|---|
| AP-18-a | **In-memory state that affects correctness.** A rate limiter, breaker or ordering decision held in one process gives two instances two different answers, and the customer sees the sum. |
| AP-18-b | **Leader election added to avoid the problem.** It introduces a new failure mode and a dependency to operate, when a conditional update on a row already gives you what you need here. |
| AP-18-c | **Claims not released on shutdown.** Every deploy then parks a batch of deliveries until their leases expire, and the reaper hides a bug you could have avoided. |
| AP-18-d | **A connection pool sized without arithmetic.** Instances × pool size above Postgres `max_connections` fails at the worst moment — during a deploy, when both old and new instances are running. |

---

## Step 19 — Shipping

**ACC-19** — A CI job on a clean checkout runs `docker compose up`, waits for readiness, POSTs one event through the public API, and asserts all three subscribers received their deliveries with valid signatures. No manual step anywhere.

| ID | Anti-pattern |
|---|---|
| AP-19-a | **A README with no numbers.** "Handles high throughput" says nothing. The measured deliveries per second, the p99 latency and the ordered-versus-unordered ratio are the whole point of having built this. |
| AP-19-b | **Secrets baked into the image.** They stay in the layer history after you remove them, and the image is the thing you push to a registry. |
| AP-19-c | **A container running as root with a writable filesystem.** Neither is needed by a static Go binary, and both are the first thing a reviewer notices. |
| AP-19-d | **A "just run these six commands" setup.** If a stranger cannot start it with one command, most of them will not start it at all, and the repository is judged on the README alone. |
