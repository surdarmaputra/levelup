---
title: Roadmap Overview
description: Locked decisions, the split between n8n and your code, the client simulator, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with a server language and SQL. New to n8n and to workflow automation. |
| Orchestrator | n8n, **self-hosted** via Docker |
| Why self-hosted | It is the differentiator, not the cheap option. Clients who need self-hosting are the ones with confidentiality requirements, and they are the ones who pay retainers. Ridgeway is impossible on a shared cloud tenant. |
| Your code | A TypeScript service on Hono, called by n8n over HTTP |
| The split | n8n owns connections, triggers, scheduling and retries. Your service owns anything that must be guaranteed — validation, idempotency, the ledger, redaction, the cost meter, the golden-set runner. |
| Why the split | This is the engineering argument of the whole material. A no-code operator can build the workflow. They cannot make it idempotent, replayable, auditable or measurable. That gap is what you are paid for. |
| Database | PostgreSQL 18 — the run ledger, sign-offs, the golden set, the cost meter. Also n8n's own store, in a separate schema. |
| Model | Claude via the `anthropic` SDK, called from your service and never directly from a workflow node. Default `claude-opus-5`; a cheaper model appears at step 14 as a measured decision. |
| Why not the built-in AI nodes | They are convenient and they put the model call somewhere you cannot validate, version, meter or test. The call belongs behind your contract. |
| Structured output | Every AI step returns a validated object against a schema, or the step fails. Never free text a later node parses. |
| Idempotency | Every external write carries a derived key. Workflows are assumed to run twice. |
| Confidentiality | Redaction before egress by default; inference location pinned where required; a local model only where the client permits nothing else, with its real hardware cost stated. |
| Decisions about people | Never automatic. Recorded reasoning, a human sign-off, and an audit trail. |
| Evaluation | A golden set per AI step from step 11, run on change **and on a schedule** — the model is not yours and neither is the client's data distribution. |
| Testing | Vitest against real PostgreSQL and the client simulator. The model is faked except in the golden-set run. |
| Ops | Docker Compose on one small VPS behind a reverse proxy. |
| AI harness | `AGENTS.md` from step 4, evolving v1→v3. |

**Note on step count:** 16 numbered steps, 0 through 15. Steps 0–3 contain no code.

---

## Why this domain

Because of one property no no-code tutorial handles: **a step whose output you cannot predict,
inside a process that needs guarantees.**

- **The process is not written down** → discovery, and a spec that turns out to be wrong
- **One step is non-deterministic** → a contract around it, validated, never trusted
- **Workflows fail halfway** → replay from a checkpoint and writes that happen once
- **Some outputs must not be automatic** → sign-off as a state, not a notification
- **Some documents may not leave** → redaction, inference location, and an honest local-model cost
- **A decision about a person is different** → recorded reasoning and a reviewable outcome
- **The model is not yours** → scheduled evaluation, because nobody tells you it changed
- **The client pays monthly** → cost per run and a report they read
- **The requirement changes** → and here, it will

---

## The three example clients

| Client | What Relay does | The rule it exists to break |
|---|---|---|
| **Fern & Oak** `fernoak` | Shared inbox → classify enquiry, create and tag a CRM record, draft a reply a human sends | The baseline. High volume, low stakes, a wrong tag costs seconds. Learn the mechanics here where nothing is at risk — and notice that this is the only client where an AI step may act without a person. |
| **Ridgeway Legal** `ridgeway` | Incoming contract → extract key terms, flag unusual clauses for a solicitor | Confidentiality. Documents are privileged. "Send it to an API" is not available, so the design must answer: what is redacted before egress, where does inference run, what does the contract with the client say, and what would a local model actually cost. |
| **Brightline Recruiting** `brightline` | Application → score against a role, produce a shortlist with reasons | The output is about a person. Nothing may be auto-rejected. The reasoning is recorded and reviewable, some inputs must not influence the outcome, and a human signs off every result. Any design where "the workflow decides" is wrong here — and quietly wrong for the others. |

Questions to keep asking: if Fern & Oak's workflow runs twice, how many CRM records exist? If
Ridgeway's contract text is redacted, is it still useful — and how do you know? If Brightline's
model changes next month, who finds out first?

None of the three may be special-cased in code. `if (client === "ridgeway")` means the
confidentiality model is a branch instead of a policy.

---

## The client simulator

The material ships its own adversary. You have no client, so we provide three, and they behave
like clients.

Step 4 brings up a `client-sim` service holding, per client:

| What | Why |
|---|---|
| A seeded inbox with real-shaped messages — including forwarded threads, an out-of-office, and one that is spam | The classifier's real inputs, not clean samples |
| A CRM-shaped API that creates duplicates if you write without a key | Idempotency, learned the hard way |
| A file drop with contracts, one of them a scan and one with an unusual clause | Ridgeway's real work |
| An applicant set for one role, including two near-identical applications differing in one irrelevant detail | The fairness check at step 12 has something to find |
| An API that fails one call in fifteen and sometimes times out after succeeding | Replay, and writes that must happen once |
| **A change request that arrives at step 12** | The requirement changes at week six. Here it changes on schedule, and step 15 makes you absorb it. |

The change request is not optional and it is not a footnote. Delivering an automation is easy;
absorbing a changed requirement without breaking three months of runs is the job.

---

## The run model (target state)

```
Client ──has──> Workflow (name, version, the steps it declares)
   │
   └──has──> Run ──has──> StepResult (step, input hash, output, status, cost, duration)
                │
                ├──has──> ExternalWrite (target, idempotency key, outcome)
                ├──has──> SignOff (who, when, decision, reason)      ← never written by a workflow
                └──has──> AiCall (prompt version, model, tokens, cost, validated output)
```

Three things worth stating:

- A **Run** is replayable. Step results are recorded with the hash of their input, so a replay
  can skip what already succeeded and resume at the failure. Without this, a workflow that
  failed at step seven is re-run from step one, and step three wrote to the CRM.
- An **ExternalWrite** is separate from the step that caused it, because that is where the
  idempotency key lives and where "did this actually happen?" is answered.
- A **SignOff** has its own author, and no workflow path may create one. Same rule, same reason,
  as everywhere else in this catalog.

---

## Global guardrails (Verification Layer 5)

| Guardrail | From step | What it catches |
|---|---|---|
| `npm run verify` — lint, types, tests, in one command | 4 | Everything below |
| `tsc --noEmit` strict | 4 | The shapes that arrive from n8n and from a model |
| Vitest against real PostgreSQL and the client simulator | 5 | Behaviour a mock would accept |
| The no-unvalidated-AI-output test | 7 | Any path where a model's output reaches an external write without validation |
| The replay test | 8 | A re-run producing a second external write |
| The no-auto-decision test | 12 | Any path where a decision about a person completes without a sign-off |
| The redaction test | 10 | Unredacted privileged content leaving the boundary |
| The golden set, on change and on a schedule | 11 | A change — or a model shift you did not make — moving an AI step's behaviour |
| CI on every push | 4 | The above, on a machine that is not yours |

The scheduled golden-set run is unusual and it is the point. Your code did not change; the model
underneath it might.

---

## Reading the steps

**Steps 0 to 3 have no code and are not optional.** Step 2 in particular — what the no-code
market already does — is the one that stops you building something a client could buy for £40 a
month.

**Mode is not a suggestion.** Replay, idempotency, redaction and fairness all produce code that
looks reasonable and is quietly wrong.

**Step 11 is the step.** Before it you have workflows that worked when you tried them. After it
you have workflows that tell you when they stop working, including for reasons that are not your
fault.
