---
title: Agent Harness
description: Setting up AGENTS.md, the npm run verify loop, and the LEARN/BUILD mode contract.
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
├── package.json       defines `npm run verify`
├── lefthook.yml       pre-commit hook config
├── docker-compose.yml PostgreSQL + PostGIS, Redis, Mailpit
└── docs/
    ├── REVIEWER-PROMPT.md
    └── adr/           architecture decision records, newest wins
```

Concretely, you are done when:

- **`npm run verify` runs and exits 0** on a clean tree — Prettier check → ESLint →
  `tsc --noEmit` → Japa → the dispatch invariant sweep, in one command — and exits non-zero when
  a misformatted file, a type error, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, layout, the mode contract. It grows
  later; don't try to write all of it now.

The starting point for `AGENTS.md` is the
[`AGENTS.md` template](../../reference/agents-template/) — copy it to your project root and
fill in the placeholders.

The invariant sweep does not exist yet — it arrives in [step 8](../../roadmap/dispatch/). Wire
the command now with a placeholder test so that adding it later is one line, not a discussion.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own. Without one, it produces something that looks right and
hands it to you to find out it's broken. That is the whole of "loop engineering": make the
signal fast, repeatable, and one command long.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| `npm run verify` | ~30 seconds | The agent stops running it between changes, and so do you |
| Pre-commit hook | ~5 seconds | It gets bypassed with `--no-verify`, permanently |

**Why the compiler on day one.** TypeScript only helps as much as you let it. `strict` plus
`noUncheckedIndexedAccess` on an empty project costs nothing; the same settings on 20,000 lines
of existing code cost a week, and the usual outcome is a list of exceptions nobody ever
shortens. Also run `tsc --noEmit` in `verify` explicitly — the dev server transpiles rather than
type-checks, so a type error can sit in a file for days while your tests stay green.

**Why a project-specific `AGENTS.md`.** A file restating public AdonisJS documentation adds
nothing — the model already knows it, and every line of it dilutes attention on the lines that
matter. What the model cannot know is your module layout, your dispatch rules, the fact that
the dispatch engine may not import a model on purpose, and which step you are on right now.
That last line — the current step — is the single most useful line in the file.

## How

**1. Create the AdonisJS 7 project** on Node 24 and get it booting. Do not add any domain code.
The starter kits ship with Lucid and auth already wired; read what they generated before you
change any of it.

**2. Add the quality tools**: Prettier for formatting, ESLint with the AdonisJS config,
`tsc --noEmit` for types, Japa for tests. Point the test database at the PostgreSQL container,
never SQLite — steps 8 and 9 depend on row locking and PostGIS that SQLite does not have.

**3. Write the scripts.** One entry point, and a few obvious shortcuts:

```
npm run verify     # everything: format check, lint, types, tests
npm run fmt        # auto-fix formatting
npm run test       # tests only
npm run worker     # the queue worker, from step 11
```

**4. Add `docker-compose.yml`** with PostgreSQL 17 including the PostGIS extension, Redis 8 and
Mailpit. Redis is not used until step 11 and Mailpit not until step 11 either; adding them now
means the environment never changes underneath you.

**5. Install Lefthook** and put the fast subset on pre-commit — Prettier on changed files, and
nothing that takes seconds. Everything slower runs in CI.

**6. Add CI** that runs `npm run verify` on every push, plus a check that the generated schema
classes are committed and current. A gate that only exists on your machine stops existing the
first time you are in a hurry.

**7. Copy the [`AGENTS.md` template](../../reference/agents-template/)** to your project root,
fill in the placeholders, and symlink it:

```
ln -s AGENTS.md CLAUDE.md
```

**8. Save the [reviewer prompt](../reviewer-setup/)** as `docs/REVIEWER-PROMPT.md`.

**9. Verify the gate actually gates.** Introduce three failures, one at a time, and confirm
`npm run verify` catches each: a misformatted file, a type error, and a failing test. A gate you
have not tested is a belief.

## The mode contract

Every roadmap step is labelled `LEARN` or `BUILD`. The label is in `AGENTS.md`, and the current
step number is the line you update most often.

**`LEARN` — the agent does not write implementation code.** It explains, asks questions, and
reviews what you wrote against the rubric. It may write tests you ask for by name and throwaway
scripts that demonstrate a behaviour.

These are the steps where letting a model write the code costs you the step: the state machine,
the dispatch engine, assignment under concurrency, geography, idempotency, time, money, the
ledger, and the regional migration.

**`BUILD` — the agent may generate.** Scaffolding, config, components, wiring. Then it explains
what it generated, so you review it rather than absorb it.

The contract only works if you keep the current step line accurate. An agent that thinks you are
on step 6 while you are on step 8 will helpfully write your concurrency code for you.
