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
your-project/
├── AGENTS.md          conventions, stack, commands, the mode contract
├── CLAUDE.md          symlink → AGENTS.md, so every tool reads one file
├── Makefile           defines `make verify`
├── lefthook.yml       pre-commit hook config
└── docs/
    └── adr/           architecture decision records, newest wins
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — format check → compile (Error Prone +
  NullAway) → tests → ArchUnit → frontend lint, in one command — and exits non-zero when a
  misformatted file, a NullAway violation, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, package layout, the mode contract.
  It grows later; don't try to write all of it now.

The starting point for `AGENTS.md` is the
[`AGENTS.md` template](../../reference/agents-template/) — copy it to your project root and
fill in the placeholders.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own. Without one, it produces something that looks right and
hands it to you to find out it's broken. That is the whole of "loop engineering": make the
signal fast, repeatable, and one command long.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| Pre-commit hook | ~5 seconds | Gets bypassed with `--no-verify`, permanently |
| `make verify` | ~30 seconds | Stops being run between changes |

Cross either and move the slow parts to CI. A gate that gets skipped exists only in theory.

**The decision log** matters because agents make better choices given the reasoning, not just
the rule. So does future you.

## How

**1. Copy the template.** [`AGENTS.md` template](../../reference/agents-template/) → your
project root. Fill in stack, package layout, and commands.

**2. Symlink it** so every tool finds the same file:

```bash
ln -s AGENTS.md CLAUDE.md
```

Claude Code, Cursor, Copilot, and most other agents look for one of these names. One file, no
drift.

**3. Define `make verify`** — one target running format check → compile (Error Prone +
NullAway) → tests → ArchUnit → frontend lint. The same command runs locally, in CI, in the
pre-commit hook, and as the agent's feedback signal.

**4. Add the pre-commit hook** (Lefthook) running format plus the fast checks only. Keep it
under 5 seconds; push anything slower to CI.

**5. Create `docs/adr/`** and record decisions as you make them.

### The mode contract

An agent can write step 8's locking code in seconds. If you let it, you'll finish this roadmap
with a working application and no ability to debug it under pressure. So every step is
labelled:

| Mode | Agent role |
|---|---|
| **`LEARN`** | Tutor and reviewer. Explains, questions, reviews your code. **Does not write the implementation.** |
| **`BUILD`** | Pair or autonomous. Scaffolding, config, templates, wiring — generate freely, then review. |

The split isn't about difficulty. It's about whether the concept survives being handed to you.
Kafka wiring is fiddly but easy to read afterwards. A lock-ordering deadlock is something you
only understand by causing one.

`LEARN` steps: 2, 3, 4, 7, **8**, **10**, **11**, **12**, 16, 17, 20, 23, 24.

**This is an honour system.** Nothing enforces it. The cost of shortcutting step 8 stays
invisible until production.

### The harness grows

Don't write the full harness on day one. You don't yet know your own conventions, and a file
full of guessed rules is worse than a short honest one.

| Version | After step | What you add |
|---|---|---|
| v1 | 0 | Stack, commands, package layout, mode contract |
| v2 | 3 | API conventions: DTO naming, error envelope, status-code policy, versioning |
| v2b | 5b | Design tokens and the component-fragment inventory |
| v3 | 9 | Module boundaries, domain-purity rule, adapter locations |
| v4 | 13 | Metric and correlation-ID requirements; fields that must never be logged |
| v5 | 20 | Subagent roles, service boundaries, contract-test requirement |

Each roadmap step that triggers an update says so in its **Harness impact** note.

**At v5, read v1 again.** The gap between them is a fair measure of what you actually learned.
A harness is only as good as your understanding of the system it describes, which is exactly
why it couldn't be written well at the start.

## No agent required

Everything here is optional. The [reviewer prompt](../reviewer-setup/) works in a plain chat
window with no repo access, and the roadmap's verification layers are all human-runnable. The
harness makes the process better. It doesn't make it possible.
