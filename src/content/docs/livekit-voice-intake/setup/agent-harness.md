---
title: Agent Harness
description: Setting up AGENTS.md, the make verify loop, and the LEARN/BUILD mode contract.
sidebar:
  order: 1
---

This roadmap is built to be worked through *with* an AI agent. That takes two things: a file
telling the agent your conventions, and a command it can run to check its own work. Both are
step 4.

Steps 0 to 3 need none of this. Do them first — `docs/call-policy.md` from step 3 is the document
this harness most needs to point at.

## The goal, and the end state

```
your-project/
├── AGENTS.md          conventions, the absolute rules, the mode contract
├── CLAUDE.md          symlink → AGENTS.md
├── Makefile           defines `make verify`
├── pyproject.toml     dependencies, ruff and mypy config
├── uv.lock            committed
├── docker-compose.yml PostgreSQL 18
└── docs/
    ├── business-case.md    from step 0
    ├── latency.md          from step 1, measured at step 5
    ├── build-vs-buy.md     from step 2
    ├── call-policy.md      from step 3 — what it says, never says, and when it hands over
    ├── REVIEWER-PROMPT.md
    └── adr/
```

You are done when:

- **`make verify` exits 0** on a clean tree — ruff → `mypy --strict` → pytest — and non-zero when
  a formatting error, a type error and a failing test are each introduced independently.
- **A browser client works**, so you can iterate without spending money on every test.
- **The number answers and speaks the disclosure sentence.**
- **Spending limits are set on all five accounts** — telephony, real-time, recognition, synthesis
  and the model.
- **`AGENTS.md` is v1 only**, containing the absolute rules and pointers to the step 0–3
  documents.

Start from the [`AGENTS.md` template](../../reference/agents-template/).

Two checks arrive later — the latency budget test at [step 5](../../roadmap/foundations/) and the
caller suite at [step 12](../../roadmap/reliability/). Wire both commands now with placeholders.

## Why

**The loop matters more than the file**, and this project has three harness problems specific to
it.

**An agent will suggest testing by phoning.** It is the natural suggestion and it is the reason
voice projects ship untested — nobody phones their agent sixty times per change. The harness says
plainly: manual calls are for listening, assertions run against recorded audio.

**An agent will trade latency for quality without noticing.** A better model, a richer reply, one
more tool call: each is a defensible improvement and each costs milliseconds. In voice, latency
*is* quality — a slow agent is interrupted, and an interrupted agent has worse calls. That is
unintuitive enough that it belongs in the file as a stated rule.

**An agent will put the never-say list in the prompt and consider it done.** It reads as a
solution. It is a request, and the model usually complies. "Usually" is what puts a price quote
on a recorded call at Northgate.

## How

**1. Do steps 0 to 3 first.**

**2. Copy the [template](../../reference/agents-template/)**, fill the placeholders, symlink
`CLAUDE.md`.

**3. Write the absolute rules in.** Latency is correctness. The never-say list is tested against
output. No booking from an unconfirmed fact. Never silence. Escalation is an outcome.

**4. Add the testing rule.** Manual calls are for listening; verification runs against recorded
audio.

**5. Build `make verify` before any conversation.** ruff, `mypy --strict`, pytest. One command.

**6. Set spending limits on all five accounts now.** This is the material where a loop is most
expensive, because four meters run simultaneously.

**7. Get the browser client working early.** Every iteration on the real number costs money on
four meters. Use the number to confirm, not to develop.

**8. Update the file at the four checkpoints**, not continuously.
