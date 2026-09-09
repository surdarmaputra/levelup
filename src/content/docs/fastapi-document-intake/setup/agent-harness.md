---
title: Agent Harness
description: Setting up AGENTS.md, the make verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 4.

Steps 0 to 3 need none of this — they produce written documents, not code. Do them first. The
four documents they produce are the most useful context this harness can point an agent at.

## The goal, and the end state

After this section, your project root looks like this:

```
your-project/
├── AGENTS.md          conventions, stack, commands, the mode contract
├── CLAUDE.md          symlink → AGENTS.md, so every tool reads one file
├── Makefile           defines `make verify`
├── pyproject.toml     dependencies, ruff and mypy config
├── uv.lock            committed
├── docker-compose.yml PostgreSQL 18
└── docs/
    ├── business-case.md    from step 0 — what the manual process costs
    ├── pipeline.md         from step 1 — the five stages and how each fails
    ├── build-vs-buy.md     from step 2
    ├── REVIEWER-PROMPT.md
    └── adr/                architecture decision records, newest wins
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — ruff format check → ruff lint →
  `mypy --strict` → pytest, in one command — and exits non-zero when a misformatted file, a
  type error, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, layout, the mode contract, and a
  pointer to the step 0–3 documents. It grows later; don't try to write all of it now.

The starting point is the [`AGENTS.md` template](../../reference/agents-template/) — copy it to
your project root and fill in the placeholders.

Two checks that arrive later — the no-unvalidated-write test at
[step 10](../../roadmap/extraction/) and the accuracy regression gate at
[step 11](../../roadmap/accuracy/) — do not exist yet. Wire both commands now with placeholders
so adding them later is one line, not a discussion.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own.

That matters more here than in most projects for a specific reason: extraction produces output
that is *shaped* correctly whether or not the values are right. A test suite that checks shapes
passes on a system extracting the wrong numbers. Until step 11 gives you a real measurement,
`make verify` is the only honest signal you have, and it is a weaker one than it feels.

**Point the agent at the business, not just the stack.** The step 0–3 documents say what this
replaces and what a review minute costs. An agent that has read them proposes different things —
it stops suggesting a model call for documents whose text was already free, because it knows
what that costs. Three lines in `AGENTS.md` buy that.

## How

**1. Do steps 0 to 3 first.** They need no tooling and they change what you build.

**2. Copy the [template](../../reference/agents-template/)** to `AGENTS.md` and fill the
placeholders. Symlink it: `ln -s AGENTS.md CLAUDE.md`.

**3. Fill in the mode contract honestly.** The `LEARN` step list is the part that does the work.
On `LEARN` steps the agent tutors and reviews; it does not write the implementation. Steps 9,
10, 11, 14 and 15 are the ones where letting it write costs you the step.

**4. Write the two absolute rules in.** The agent never labels the gold set, and it never
proposes a confidence score that comes from the model. Both are in the template. Both are
mistakes an agent will otherwise make confidently and helpfully.

**5. Build `make verify` before any domain code.** ruff format check, ruff lint,
`mypy --strict`, pytest. One command. Time it and write the number down.

**6. Add the pre-commit hook** running only the fast subset. Over five seconds and it gets
bypassed, permanently.

**7. Update the file at the four checkpoints**, not continuously. They are marked in the
template and in each step's *Harness impact* note. A harness rewritten every session is a
harness nobody trusts.
