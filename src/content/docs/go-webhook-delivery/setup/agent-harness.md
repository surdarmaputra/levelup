---
title: Agent Harness
description: Setting up AGENTS.md, the make verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 0.

## The goal, and the end state

After this section, your project root looks like this:

```
relay/
├── AGENTS.md          conventions, stack, commands, the mode contract
├── CLAUDE.md          symlink → AGENTS.md, so every tool reads one file
├── Makefile           defines `make verify`
├── .golangci.yml      the linter set
├── lefthook.yml       pre-commit hook config
└── docs/
    └── adr/           architecture decision records, newest wins
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — `gofmt` check → `go vet` →
  `golangci-lint` → `go test ./... -race` → `go build`, in one command — and exits non-zero when
  an unformatted file, an ignored error return, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under about 5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, package layout, the mode contract.
  It grows later; don't try to write all of it now.

The starting point is the [`AGENTS.md` template](../../reference/agents-template/) — copy it to
your project root and fill in the placeholders.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own. Without one, it produces something that looks right and
hands it to you to find out it is broken. That is the whole of "loop engineering": make the
signal fast, repeatable, and one command long.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| Pre-commit hook | about 5 seconds | Gets bypassed with `--no-verify`, permanently |
| `make verify` | about 30 seconds | Stops being run between changes |

Cross either and move the slow parts to CI. A gate that gets skipped exists only in theory.

Go helps here more than most languages: compilation is fast, `gofmt` is not configurable so
nobody argues about it, and `go test -race` is a real correctness check rather than a style one.
The one thing that will get slow is the Testcontainers Postgres suite from step 6 — keep one
container per test package, not one per test.

**The decision log** matters because agents make better choices given the reasoning, not just the
rule. So does future you.

## How

**1. Copy the template.** [`AGENTS.md` template](../../reference/agents-template/) → your project
root. Fill in the module path, package layout, and commands.

**2. Symlink it** so every tool finds the same file:

```bash
ln -s AGENTS.md CLAUDE.md
```

Claude Code, Cursor, Copilot and most other agents look for one of these names. One file, no
drift.

**3. Define `make verify`** — one target running `gofmt -l` → `go vet` → `golangci-lint run` →
`go test ./... -race` → `go build ./...`. The same command runs locally, in CI, in the pre-commit
hook, and as the agent's feedback signal.

**4. Add the pre-commit hook** (Lefthook) running `gofmt` and `go vet` only. Keep it under 5
seconds; push the linter and the race-detector tests to `make verify` and CI.

**5. Pin your tools in `go.mod`** with the `tool` directive so `golangci-lint` and `goose` are the
same version for you, for CI, and for the agent. A tool installed globally is a version mismatch
waiting to happen.

**6. Create `docs/adr/`** and record decisions as you make them.

### The mode contract

An agent can write step 8's claim loop in seconds. If you let it, you will finish this roadmap
with a working service and no ability to debug it under pressure. So every step is labelled:

| Mode | Agent role |
|---|---|
| **`LEARN`** | Tutor and reviewer. Explains, questions, reviews your code. **Does not write the implementation.** |
| **`BUILD`** | Pair or autonomous. Scaffolding, config, templates, wiring — generate freely, then review. |

The split is not about difficulty. It is about whether the concept survives being handed to you.
Docker and template wiring are fiddly but easy to read afterwards. A claim loop that works with
one dispatcher and breaks with four is something you only understand by causing it.

`LEARN` steps: 1, 2, 4, 5, 6, 7, **8**, 9, **10**, **11**, **12**, 13, 17, **18**.

`BUILD` steps: 0, 3, 14, 15, 16, 19.

This roadmap is more `LEARN` than most, because the audience is new to the language. You cannot
learn Go by reading Go that an agent wrote for you — the syntax is small enough that reading it
feels like understanding it, right up until you have to write it yourself.

**This is an honour system.** Nothing enforces it. The cost of shortcutting step 8 stays invisible
until production.

### The harness grows

Don't write the full harness on day one. You don't yet know your own conventions, and a file full
of guessed rules is worse than a short honest one.

| Version | After step | What you add |
|---|---|---|
| v1 | 0 | Stack, commands, package layout, mode contract |
| v2 | 3 | HTTP conventions: handler shape, middleware location, error responses, config |
| v2b | 7 | API conventions: the error envelope, status-code policy, idempotency rule, transaction boundaries |
| v3 | 14 | Correlation ID and metric requirements; fields that must never be logged; the label-cardinality rule |
| v4 | 19 | Deployment facts, the configuration surface, retention policy, load-test numbers to compare against |

Each roadmap step that triggers an update says so in its **Harness impact** note.

**At v4, read v1 again.** The gap between them is a fair measure of what you actually learned. A
harness is only as good as your understanding of the system it describes, which is exactly why it
could not be written well at the start.

## No agent required

Everything here is optional. The [reviewer prompt](../reviewer-setup/) works in a plain chat
window with no repo access, and the roadmap's verification layers are all human-runnable. The
harness makes the process better. It does not make it possible.
