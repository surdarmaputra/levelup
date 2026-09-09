---
title: Agent Harness
description: Setting up AGENTS.md, the npm run verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent — while you build one. That takes
two things: a file telling the agent your conventions, and a command it can run to check its own
work. Both are step 4.

Steps 0 to 3 need none of this. Do them first; the four documents they produce are the most
useful context this harness can point an agent at, and `docs/authority-model.md` in particular
changes what an agent proposes.

## The goal, and the end state

```
your-project/
├── AGENTS.md          conventions, stack, commands, the mode contract
├── CLAUDE.md          symlink → AGENTS.md
├── package.json       scripts, including `verify`
├── tsconfig.json      strict
├── docker-compose.yml PostgreSQL 18 + the fake systems service
└── docs/
    ├── business-case.md    from step 0 — what the manual process and a mistake cost
    ├── agent-loop.md       from step 1 — the loop and its silent failures
    ├── build-vs-buy.md     from step 2
    ├── authority-model.md  from step 3 — what the agent may do, per client
    ├── REVIEWER-PROMPT.md
    └── adr/
```

You are done when:

- **`npm run verify` exits 0** on a clean tree — ESLint → `tsc --noEmit` → Vitest — and non-zero
  when a lint error, a type error and a failing test are each introduced independently.
- **`any` is banned by a lint rule**, not by intention.
- **A pre-commit hook** runs the fast subset in under ~5 seconds.
- **`AGENTS.md` is v1 only** — stack, commands, layout, the mode contract, the three absolute
  rules, and pointers to the step 0–3 documents.

Start from the [`AGENTS.md` template](../../reference/agents-template/).

Two checks arrive later — the no-unauthorised-action test at
[step 11](../../roadmap/safety/) and the scenario suite at
[step 12](../../roadmap/safety/). Wire both commands now with placeholders so adding them later
is one line.

## Why

**The loop matters more than the file.** An agent is only as good as the feedback it can get
without asking you.

**There is a second reason specific to this project.** You are asking a language model to help
build a system that constrains a language model. Left to itself it will reach for the elegant
answer — put the rule in the system prompt, let the agent confirm its own action, generate a
fresh idempotency key where the retry happens. Each of those is plausible, readable, and
removes a safety property. The three absolute rules in the template exist because these are the
specific mistakes an agent makes helpfully and confidently.

**Point it at the authority model.** An agent that has read `docs/authority-model.md` stops
proposing tools that bypass the gate, because it knows Lumen's plans need a human. One line in
`AGENTS.md` buys that.

## How

**1. Do steps 0 to 3 first.** They need no tooling and they change what you build.

**2. Copy the [template](../../reference/agents-template/)** to `AGENTS.md`, fill the
placeholders, symlink `CLAUDE.md`.

**3. Fill in the mode contract honestly.** Steps 9, 10, 11, 12, 14 and 15 are `LEARN`. Those are
the ones where letting an agent write the implementation costs you the step — idempotency and
compensation especially, because wrong versions of both look right.

**4. Write the three absolute rules in.** Authority is never a prompt. Keys are never generated
at call time. Approvals are never written by the agent's path.

**5. Build `npm run verify` before any domain code.** Lint, types, tests. One command. Time it.

**6. Ban `any` in the lint config now.** Tool arguments arrive from a model and results arrive
from a system that lies. `unknown` plus a parse step at every boundary is the discipline, and it
is much easier to start with than to retrofit.

**7. Add the pre-commit hook** running only the fast subset.

**8. Update the file at the four checkpoints**, not continuously.
