---
title: Foundations
description: Steps 4–6. Self-hosted n8n with the sidecar service and the client simulator, the run ledger, and a first workflow with no AI in it at all.
sidebar:
  order: 3
---

## Step 4 — Self-hosted n8n, the sidecar, and the quality gate

**Story:** *As a developer, I have n8n running on my own machine, a service beside it that I control, three simulated clients, and one command that verifies everything I wrote.*

**Mode:** `BUILD` — infrastructure and scaffolding. Generate, then read every line.

**Why now:** First code step. Everything after runs on this.

**Concepts:**
- **Self-hosting n8n**, and what it involves: the container, its database, its encryption key, and the fact that losing that key loses every stored credential. Learn this now, on your laptop, rather than at a client.
- **The sidecar, and why it exists.** n8n calls your service over HTTP. Your service owns validation, idempotency, the ledger, redaction, the model call, the cost meter and the golden-set runner. The rule for the rest of the material: **if it must be guaranteed, it is in your code.**
- **Workflows are code and belong in git.** Export them as JSON, commit them, and treat the n8n editor as a way to draft rather than the source of truth. An automation that exists only inside a running container is one restore away from gone.
- **The client simulator**: three seeded businesses with inboxes, a CRM-shaped API that duplicates without a key, a file drop, an applicant set, and an API that fails one call in fifteen. Build it deliberately hostile; a friendly fixture teaches nothing.
- **Loop engineering**: one command that verifies your service, so an agent can work without asking you.
- **Strict typing at the boundary.** Everything from n8n arrives as JSON of unknown shape. `unknown` plus a parse step, never `any`.
- `AGENTS.md` pointing at the four documents from steps 0–3.

**Libraries:** Docker + Compose (n8n, PostgreSQL 18, the simulator, your service), TypeScript 5.9, Hono, Vitest, ESLint, Prettier

**Expected outcome:** A Compose stack with n8n, PostgreSQL, the client simulator and your service. n8n's encryption key handled deliberately and documented. A workflow export script and a `workflows/` directory in git. `npm run verify` running lint → types → tests. `AGENTS.md` v1 + `CLAUDE.md` symlink. An ADR recording the n8n-versus-your-code split. CI running verify.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a workflow exported, deleted from n8n and re-imported from git runs identically; two writes to the simulator's CRM without a shared key produce two records. |
| **L2 — Manual checks** | (a) Destroy the n8n container and restore it from your exports and the encryption key. Whatever you had to redo by hand is a gap in handover, which is step 15. <br>(b) Ask your agent what belongs in n8n and what belongs in your service. It must answer from `AGENTS.md`. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and your whole environment comes back from git plus one secret |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The run ledger

**Story:** *As Fern & Oak, when a workflow fails at step seven, the run resumes at step seven rather than creating three more CRM records.*

**Mode:** `LEARN` — this schema decides whether replay is possible at all, and replay is what separates this from a script.

**Why now:** Before any real workflow. Retrofitting replay onto workflows already writing to a client's systems is not a migration.

**Concepts:**
- **n8n has its own execution history. It is not enough.** It tells you a run failed; it does not tell you which external writes committed, which AI outputs to reuse, what a step cost, or who signed off. That is your ledger.
- **Runs, steps and step results.** Each step result records its input hash, its output, its status, its cost and its duration. The input hash is what makes a replay able to say *this step already ran on this input and succeeded*.
- **Replay reuses recorded AI output.** Re-running a non-deterministic step during a replay produces a different answer, which means the replayed run is not the run you were fixing. This is the single most missed consequence of putting a model in a workflow.
- **External writes are their own records**, with a derived idempotency key and a verified outcome, because "did this actually happen?" cannot be answered from a step's status.
- **Sign-offs are separate rows with their own author** and no workflow path may write one.
- **The AI call record**: prompt version, model, tokens, cost, the validated output. Step 13 aggregates it and step 11 replays against it.
- **What must never be stored.** Ridgeway's contract text does not go in the ledger. Store hashes, references and redacted extracts. The ledger is the most tempting place to keep everything and the worst place to leak privileged material.
- **Retention per client**, applied.

**Libraries:** a migration tool and a query builder of your choice

**Expected outcome:** Migrations and models for `clients`, `workflows`, `runs`, `step_results`, `external_writes`, `sign_offs` and `ai_calls`. A unique constraint on the external-write idempotency key. Client-scoped throughout. A replay function that skips successful steps whose input hash matches and reuses recorded AI output. A log and storage configuration that never holds privileged document text.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — replaying a run that failed at step seven executes only steps seven onwards and produces no second external write, enforced by a database constraint; a replayed AI step reuses its recorded output rather than calling the model; a sign-off cannot be created by a workflow path. |
| **L2 — Manual checks** | (a) Write down how you would answer "what happened in run 812?" using only the ledger. Every gap is a missing column. <br>(b) Search your ledger for anything you would not want in a subpoena. Ridgeway's contract text is the thing to look for. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and a failed run can be resumed rather than re-run |

**Harness impact:** `AGENTS.md` v2 — record the replay rules, that AI output is reused on replay, that external writes carry derived keys enforced by a constraint, and that privileged text never enters the ledger.

---

## Step 6 — The first workflow, with no AI in it

**Story:** *As Fern & Oak, new enquiries reach my CRM automatically and reliably, before anything clever is involved.*

**Mode:** `BUILD` — wiring, deliberately boring.

**Why now:** Before any model call. A workflow that is unreliable without an AI step will be unreliable with one, and you will blame the model.

**Concepts:**
- **Get the boring part right first.** Trigger, fetch, transform, write, record. Every failure you meet here is a failure you would otherwise meet later while suspecting the model.
- **Triggers and their duplicates.** Polling triggers re-deliver, webhooks retry, a restart can replay. Assume every trigger fires twice.
- **Idempotency at the write, not at the trigger.** The derived key from step 5, passed to the simulator's CRM. This is the step where you watch two records appear and then make it one.
- **Error workflows.** n8n can route a failure to another workflow. Decide now what that does: record it, alert once, and leave the run resumable. A failure that silently disappears is the default and it is the worst option.
- **Retries that are safe.** A retry is a second delivery. Safe only because of the key.
- **Rate limits and politeness.** You are calling a client's production systems. Backoff, and a cap on how fast a workflow may hammer anything.
- **What n8n is genuinely good at**, so you use it for that: connectors, triggers, scheduling, retries, and a visual flow the client can look at. That last one matters more than engineers expect — a client who can see the workflow trusts it.
- **What goes in your service even now**: the transform with rules in it, the write with the key, the ledger entries.

**Libraries:** n8n nodes, your service, the simulator

**Expected outcome:** A Fern & Oak workflow, exported to git, that reads the simulated inbox, transforms with rules in your service, writes to the CRM idempotently, and records a run with step results. An error workflow that records and alerts once. Retries with backoff. Every failure the simulator offers, tested.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — the same enquiry delivered twice produces one CRM record, verified against the simulator; a forced mid-run failure leaves a resumable run and one alert, not zero and not five; a workflow re-imported from git behaves identically. |
| **L2 — Manual checks** | (a) Kill your service mid-run and watch what n8n does. Then replay from the ledger. That pair is the whole reason for step 5. <br>(b) Show the workflow canvas to someone non-technical and ask what it does. If they can tell you, that is a real asset in a client meeting. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and the workflow is boring and reliable with no model anywhere near it |
