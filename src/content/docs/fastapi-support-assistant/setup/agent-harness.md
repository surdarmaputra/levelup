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
├── pyproject.toml     dependencies, ruff and mypy config
├── uv.lock            committed
├── docker-compose.yml PostgreSQL + pgvector, Redis, MinIO
└── docs/
    ├── REVIEWER-PROMPT.md
    └── adr/           architecture decision records, newest wins
```

Concretely, you are done when:

- **`make verify` runs and exits 0** on a clean tree — ruff format check → ruff lint →
  `mypy --strict` → pytest, in one command — and exits non-zero when a misformatted file, a
  type error, or a failing test is introduced independently.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is the v1 version only** — stack, commands, layout, the mode contract. It grows
  later; don't try to write all of it now.

The starting point for `AGENTS.md` is the
[`AGENTS.md` template](../../reference/agents-template/) — copy it to your project root and
fill in the placeholders.

Two checks that arrive later — the ungrounded-answer test at
[step 9](../../roadmap/generation/) and the eval regression gate at
[step 15](../../roadmap/evaluation/) — do not exist yet. Wire both commands now with
placeholders so that adding them later is one line, not a discussion.

**Install the pgvector extension now**, at step 0, and confirm `CREATE EXTENSION vector;`
succeeds. Discovering it is missing at step 6 means spending an afternoon debugging retrieval
that was never running.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you. Given a single reliable command, it writes code, runs the command, sees the
failure, and fixes it, all on its own.

That matters more here than in most projects, for an unusual reason: the thing you are building
produces fluent text whether or not it is correct, so your own judgement is a weak signal. From
step 13 the eval set becomes the real feedback loop, and everything before it is preparation
for having one.

Two thresholds decide whether this works:

| | Threshold | What happens past it |
|---|---|---|
| `make verify` | ~30 seconds | The agent stops running it between changes, and so do you |
| Pre-commit hook | ~5 seconds | It gets bypassed permanently |

**Why strict typing on day one.** This is a pipeline: text becomes chunks becomes vectors
becomes candidates becomes a prompt becomes an answer. Every stage transforms a shape, and
without types those shapes become `dict[str, Any]` and every bug is found at runtime, in a
paid API call. `mypy --strict` on an empty project costs nothing.

**Why a project-specific `AGENTS.md`.** A file restating the FastAPI documentation adds
nothing. What the model cannot know is that every answer in this project must cite or refuse,
that unit tests never call the real model, that the eval gate must run before a retrieval
change merges, and which step you are on right now. That last line — the current step — is the
single most useful line in the file.

## How

**1. Create the project with `uv`** on Python 3.13 and get FastAPI serving. No domain code.

**2. Add the quality tools**: ruff for formatting and linting, `mypy --strict`, pytest with
`pytest-asyncio`. Configure pytest against the PostgreSQL container with pgvector installed,
never SQLite — steps 3, 6 and 7 all depend on behaviour SQLite does not have.

**3. Write the `Makefile`.** One entry point, and a few obvious shortcuts:

```
make verify     # everything: format check, lint, types, tests
make fmt        # auto-fix formatting
make test       # tests only
make up         # start Docker dependencies
make down       # stop them
make dev        # run the app with reload
make eval       # placeholder until step 13
```

**4. Add `docker-compose.yml`** with PostgreSQL 17 including pgvector, Redis and MinIO. Connect
to each by hand once.

**5. Add a pre-commit hook** running ruff on changed files and nothing slower.

**6. Add CI** that runs `make verify` on every push against a real PostgreSQL service.

**7. Copy the [`AGENTS.md` template](../../reference/agents-template/)** to your project root,
fill in the placeholders, and symlink it:

```
ln -s AGENTS.md CLAUDE.md
```

**8. Save the [reviewer prompt](../reviewer-setup/)** as `docs/REVIEWER-PROMPT.md`.

**9. Set a spending limit on your model API account.** You will not call it until step 9, but a
loop that retries a failing request is cheaper to discover with a cap in place.

**10. Verify the gate actually gates.** Introduce three failures, one at a time, and confirm
`make verify` catches each.

## The mode contract

Every roadmap step is labelled `LEARN` or `BUILD`. The label is in `AGENTS.md`, and the current
step number is the line you update most often.

**`LEARN` — the agent does not write implementation code.** It explains, asks questions, and
reviews what you wrote against the rubric. It may write tests you ask for by name and
throwaway scripts that demonstrate a behaviour.

These are the steps where letting a model write the code costs you the step: the corpus schema,
chunking, embeddings, hybrid fusion, reranking, grounding, refusal policy, the token budget,
the eval set, the metrics and the judge, the regression gate, and cost. Nearly all of them,
because nearly all of them produce code that looks obviously reasonable and is wrong in a way
you cannot see without a measurement you have not built yet.

**`BUILD` — the agent may generate.** Scaffolding, config, ingestion plumbing, streaming, the
deploy. Then it explains what it generated, so you review it rather than absorb it.

There is one more rule specific to this material: **an agent must never write your eval set.**
A set generated by a model measures agreement with that model. Drafting is allowed if you edit
every item; unedited generated questions make the entire second half of the roadmap worthless.
