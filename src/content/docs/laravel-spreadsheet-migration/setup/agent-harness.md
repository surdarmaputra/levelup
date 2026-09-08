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
├── docker-compose.yml PostgreSQL, Redis, Mailpit
└── docs/
    ├── REVIEWER-PROMPT.md
    ├── adr/           architecture decision records, newest wins
    └── discovery/     findings and rules per business, from steps 2 and 3
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — Pint check → Larastan → Pest → the
  reconciliation suite, in one command — and exits non-zero when a misformatted file, a
  Larastan violation, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, layout, the mode contract.

The starting point is the [`AGENTS.md` template](../../reference/agents-template/) — copy it to
your project root and fill in the placeholders.

The reconciliation suite does not exist yet — it arrives in
[step 7](../../roadmap/modelling/). Wire the command now with a placeholder test so that adding
it later is one line, not a discussion.

`docs/discovery/` is unusual and it matters. In this material a large part of what you produce
is not code: column profiles, extracted rules, exceptions, sign-offs, the cutover runbook.
Those documents are deliverables, they belong in the repository beside the code, and the client
will ask for them.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own.

There is a second reason specific to this material. From step 7 onwards you have an external
oracle: the client's spreadsheet. `make verify` running the reconciliation suite means every
change is checked not only against your intentions but against the client's own numbers. That
is a stronger signal than most projects ever get, and it is worth wiring into one command.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| `make verify` | ~30 seconds | The agent stops running it between changes, and so do you |
| Pre-commit hook | ~5 seconds | It gets bypassed with `--no-verify`, permanently |

**Why static analysis on day one.** Larastan at level 8 on an empty project costs nothing; on
20,000 lines it costs a week, and the usual outcome is a baseline nobody shrinks.

**Why a project-specific `AGENTS.md`.** A file restating public Laravel documentation adds
nothing. What the model cannot know is that discovery precedes schema in this project, that
derived columns are never stored, that a merge is never automatic below the threshold, and
which step you are on. That last line — the current step — is the single most useful line in
the file.

## How

**1. Create the Laravel 13 project** on PHP 8.5 and get it booting. No domain code.

**2. Add the quality tools**: Pint, Larastan at level 8, Rector in dry-run, Pest 4. Configure
Pest against the PostgreSQL container, never SQLite — step 4's constraints and step 6's
unique-violation handling both depend on real PostgreSQL behaviour.

**3. Write the `Makefile`.** One entry point, and a few obvious shortcuts:

```
make verify     # everything: format check, static analysis, tests, reconciliation
make fmt        # auto-fix formatting
make test       # tests only
make up         # start Docker dependencies
make down       # stop them
make profile    # run the column profiler (from step 2)
make reconcile  # run reconciliation against the fixtures (from step 7)
```

**4. Add `docker-compose.yml`** with PostgreSQL 17, Redis and Mailpit.

**5. Install Lefthook** and put the fast subset on pre-commit.

**6. Add CI** running `make verify` on every push against a real PostgreSQL service.

**7. Copy the [`AGENTS.md` template](../../reference/agents-template/)**, fill in the
placeholders, and symlink it:

```
ln -s AGENTS.md CLAUDE.md
```

**8. Save the [reviewer prompt](../reviewer-setup/)** as `docs/REVIEWER-PROMPT.md`.

**9. Verify the gate actually gates.** Introduce three failures, one at a time, and confirm
`make verify` catches each. A gate you have not tested is a belief.

## The mode contract

Every roadmap step is labelled `LEARN` or `BUILD`. The label is in `AGENTS.md`, and the current
step number is the line you update most often.

**`LEARN` — the agent does not write implementation code.** It explains, asks questions, and
reviews what you wrote against the rubric. It may write tests you ask for by name and
throwaway scripts that demonstrate a behaviour.

These are the steps where letting a model write the code costs you the step: discovery, rule
extraction, the schema, entity resolution, import, reconciliation, permissions, the audit
trail, the headline report, the parallel run and the cutover plan.

**`BUILD` — the agent may generate.** Tooling, the panel, resources and forms, the export, the
deploy. Then it explains what it generated, so you review it rather than absorb it.

### Two rules specific to this material

**An agent must never invent a business rule.** In steps 2, 3 and 4 a model will happily
produce a confident, plausible, entirely fictional pricing rule, and it will read exactly like
the real ones. Every rule must trace to a formula reference or to a named person who said it.
"The model suggested it" is not a source, and a fictional rule discovered during a parallel run
costs you the client's trust at the worst possible moment.

**An agent must never propose a merge threshold from intuition.** Entity resolution thresholds
come from running against a hand-labelled answer key and reading the results. A number that
sounds reasonable is how two customers become one.
