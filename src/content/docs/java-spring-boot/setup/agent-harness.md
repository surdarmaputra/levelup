---
title: Agent Harness
description: Setting up AGENTS.md, the make verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That requires two things: a file telling the agent your conventions, and a command it can run to check its own work.

The template lives at [`AGENTS.md` template](../../reference/agents-template/). Copy it to your project root and fill in the placeholders. This page explains what it's for and why it's shaped that way.

## What you set up

Three things, all in step 0:

**`AGENTS.md` at your project root.** Symlink it so every tool finds the same file:

```bash
ln -s AGENTS.md CLAUDE.md
```

Claude Code, Cursor, Copilot, and most other agents look for one of these names. One file, no drift.

**`make verify` — the loop.** One command running format check → compile (Error Prone + NullAway) → tests → ArchUnit → frontend lint. Same command locally, in CI, in the pre-commit hook, and as the agent's feedback signal.

**`docs/adr/` — the decision log.** Agents make better choices given the reasoning, not just the rule. So does future you.

## Why the loop matters more than the file

An agent's usefulness is bounded by the feedback it can get without asking you. Given a single reliable command, it writes code, runs the command, sees the failure, and fixes it — unattended. Without one, it produces something plausible and hands it over for you to discover is broken.

That's the whole of "loop engineering": make the signal fast, deterministic, and one command long.

Two thresholds that decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| Pre-commit hook | ~5 seconds | Gets bypassed with `--no-verify`, permanently |
| `make verify` | ~30 seconds | Stops being run between changes |

If you cross either, move the slow parts to CI. A gate that gets skipped exists only in theory.

## The mode contract

An agent can write step 8's locking code in seconds. If you let it, you'll finish this roadmap with a working application and no ability to debug it under pressure.

So every step is labelled:

| Mode | Agent role |
|---|---|
| **`LEARN`** | Tutor and reviewer. Explains, questions, reviews your code. **Does not write the implementation.** |
| **`BUILD`** | Pair or autonomous. Scaffolding, config, templates, wiring — generate freely, then review. |

The split isn't difficulty. It's whether the concept survives being handed to you. Kafka wiring is fiddly but readable after the fact. A lock-ordering deadlock is only ever understood by causing one.

`LEARN` steps: 2, 3, 4, 7, **8**, **10**, **11**, **12**, 16, 17, 20, 23, 24.

**This is an honour system.** Nothing enforces it. The cost of shortcutting step 8 stays invisible until production.

## The harness grows

Don't write the full harness on day one — you don't yet know your own conventions, and a file full of guessed rules is worse than a short honest one.

| Version | After step | What you add |
|---|---|---|
| v1 | 0 | Stack, commands, package layout, mode contract |
| v2 | 3 | API conventions: DTO naming, error envelope, status-code policy, versioning |
| v2b | 5b | Design tokens and the component-fragment inventory |
| v3 | 9 | Module boundaries, domain-purity rule, adapter locations |
| v4 | 13 | Metric and correlation-ID requirements; fields that must never be logged |
| v5 | 20 | Subagent roles, service boundaries, contract-test requirement |

Each roadmap step that triggers an update says so in its **Harness impact** note.

**At v5, reread v1.** The gap between them is a fair measure of what you actually learned — a harness is only as good as your understanding of the system it describes, which is exactly why it couldn't be written well at the start.

## No agent required

Everything here is optional. The [reviewer prompt](../reviewer-setup/) works in a plain chat window with no repo access, and the roadmap's verification layers are all human-runnable.

The harness makes the process better. It doesn't make it possible.
