---
title: Agent Harness
description: Setting up AGENTS.md, the npm run verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 4.

Steps 0 to 3 need none of this. Do them first.

## The goal, and the end state

```
your-project/
├── AGENTS.md          conventions, the n8n/service split, commands, the mode contract
├── CLAUDE.md          symlink → AGENTS.md
├── package.json       scripts, including `verify`
├── tsconfig.json      strict
├── docker-compose.yml n8n, PostgreSQL 18, the client simulator, your service
├── workflows/         exported n8n workflows, committed
└── docs/
    ├── business-case.md    from step 0
    ├── ai-steps.md         from step 1 — the AI-step contract
    ├── build-vs-buy.md     from step 2
    ├── REVIEWER-PROMPT.md
    └── adr/
```

You are done when:

- **`npm run verify` exits 0** on a clean tree — ESLint → `tsc --noEmit` → Vitest — and non-zero
  when a lint error, a type error and a failing test are each introduced independently.
- **`any` is banned by a lint rule.** Everything arriving from n8n is JSON of unknown shape.
- **Workflows export to `workflows/` and import back**, and that round trip is tested.
- **`AGENTS.md` is v1 only**, and it states the n8n-versus-your-code split explicitly.

Start from the [`AGENTS.md` template](../../reference/agents-template/).

Two checks arrive later — the no-unvalidated-AI-output test at
[step 7](../../roadmap/workflows/) and the golden set at
[step 11](../../roadmap/trust/). Wire both commands now with placeholders.

## Why

**The loop matters more than the file**, as always. But this project has a specific harness
problem the others do not.

**An agent will keep proposing the convenient thing.** n8n ships AI nodes. Wiring one in is a
single node and it looks finished. It is also the decision that makes validation, versioning,
metering, caching and testing impossible for the rest of the project. An agent that has not been
told the split will suggest it, helpfully, every time — so the split goes in `AGENTS.md` in
plain words, and it is the first thing in the file after the project description.

The same is true of the other two absolute rules: a sign-off written from a workflow, and a
model re-called on replay. Both are the shortest correct-looking implementation, and both remove
a guarantee.

## How

**1. Do steps 0 to 3 first.**

**2. Copy the [template](../../reference/agents-template/)**, fill the placeholders, symlink
`CLAUDE.md`.

**3. Write the split down in plain words.** n8n owns connections, triggers, scheduling, retries
and the canvas. Your service owns anything that must be guaranteed. One paragraph, near the top.

**4. Write the three absolute rules in.** The model call is never in a node. Sign-offs are never
written by a workflow. The model is never re-called on replay.

**5. Build `npm run verify` before any workflow.** Lint, types, tests. One command.

**6. Ban `any` now.** Everything from n8n arrives as unknown JSON, and a parse step at the
boundary is much easier to start with than to retrofit.

**7. Set up the workflow export and import scripts immediately**, and commit the exports. The
canvas is a place to draft; git is the source of truth. This is the convention people abandon
first and regret most.

**8. Update the file at the three checkpoints**, not continuously.
