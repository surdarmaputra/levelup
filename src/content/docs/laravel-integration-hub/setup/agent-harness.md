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
├── docker-compose.yml PostgreSQL, Redis, MinIO, SFTP, Mailpit
└── docs/
    ├── REVIEWER-PROMPT.md
    └── adr/           architecture decision records, newest wins
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — Pint check → Larastan → Pest → the
  replay-safety sweep → frontend lint, in one command — and exits non-zero when a misformatted
  file, a Larastan violation, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, layout, the mode contract. It grows
  later; don't try to write all of it now.

The starting point for `AGENTS.md` is the
[`AGENTS.md` template](../../reference/agents-template/) — copy it to your project root and
fill in the placeholders.

The replay-safety sweep does not exist yet — it arrives in
[step 9](../../roadmap/inbound/). Wire the command now with a placeholder test so that adding
it later is one line, not a discussion.

**Bring up every dependency now, including the ones you will not use for two weeks.** MinIO
and the SFTP container are not needed until step 15. Adding them then means every problem in
step 15 looks like an SFTP problem, when most of them will be yours.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own. Without one, it produces something that looks right and
hands it to you to find out it's broken.

That matters more here than in most projects. Almost everything this system does happens on a
queue, at night, against somebody else's API. There is no page to refresh and no screen that
turns red. The test suite is the only place failure is visible early, so it has to be fast
enough that you actually run it.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| `make verify` | ~30 seconds | The agent stops running it between changes, and so do you |
| Pre-commit hook | ~5 seconds | It gets bypassed with `--no-verify`, permanently |

**Why static analysis on day one.** Laravel is a dynamic framework and PHP is a forgiving
language. Larastan at level 8 on an empty project costs nothing; on 20,000 lines it costs a
week, and the usual outcome is a baseline file nobody ever shrinks. Start strict.

**Why a project-specific `AGENTS.md`.** A file restating public Laravel documentation adds
nothing. What the model cannot know is your module layout, that every consumer in this project
must be idempotent, that credentials are never passed into jobs, and which step you are on
right now. That last line — the current step — is the single most useful line in the file.

## How

**1. Create the Laravel 13 project** on PHP 8.5 and get it booting. Do not add any domain code.

**2. Add the quality tools**: Pint for formatting, Larastan at level 8, Rector in dry-run mode,
Pest 4 for tests. Configure Pest to run against the PostgreSQL and Redis containers, never
SQLite and never the array cache driver — steps 6, 11 and 12 all depend on behaviour that fakes
do not have.

**3. Write the `Makefile`.** One entry point, and a few obvious shortcuts:

```
make verify     # everything: format check, static analysis, tests, lint
make fmt        # auto-fix formatting
make test       # tests only
make up         # start Docker dependencies
make down       # stop them
make work       # run a queue worker locally
```

**4. Add `docker-compose.yml`** with PostgreSQL 17, Redis 8, MinIO, an SFTP server and Mailpit.

**5. Install Lefthook** and put the fast subset on pre-commit — Pint on changed files, and
nothing that takes seconds. Everything slower runs in CI.

**6. Add CI** that runs `make verify` on every push, with real PostgreSQL and Redis services.

**7. Copy the [`AGENTS.md` template](../../reference/agents-template/)** to your project root,
fill in the placeholders, and symlink it:

```
ln -s AGENTS.md CLAUDE.md
```

**8. Save the [reviewer prompt](../reviewer-setup/)** as `docs/REVIEWER-PROMPT.md`.

**9. Verify the gate actually gates.** Introduce three failures, one at a time, and confirm
`make verify` catches each: a misformatted file, a Larastan violation, and a failing test. A
gate you have not tested is a belief.

## The mode contract

Every roadmap step is labelled `LEARN` or `BUILD`. The label is in `AGENTS.md`, and the current
step number is the line you update most often.

**`LEARN` — the agent does not write implementation code.** It explains, asks questions, and
reviews what you wrote against the rubric. It may write tests you ask for by name and
throwaway scripts that demonstrate a behaviour.

These are the steps where letting a model write the code costs you the step: the message model,
idempotency, retry policy, dead-letter and replay, rate limiting, circuit breaking, mapping,
file ingestion, out-of-order events, and reconciliation. Every one of them produces code that
looks obviously correct and is wrong in a way that only appears during somebody else's outage.

**`BUILD` — the agent may generate.** Scaffolding, config, queue wiring, Livewire screens. Then
it explains what it generated, so you review it rather than absorb it.

The contract only works if you keep the current step line accurate. An agent that thinks you
are on step 4 while you are on step 18 will helpfully write your reconciliation for you.
