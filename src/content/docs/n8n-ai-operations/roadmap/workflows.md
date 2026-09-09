---
title: Workflows
description: Steps 7–10. The first AI step and the contract around it, replay when a step is non-deterministic, human sign-off as a state, and what may leave the client's building.
sidebar:
  order: 4
---

## Step 7 — The first AI step, and its contract

**Story:** *As Fern & Oak, enquiries are classified and tagged automatically, and when the classification is nonsense the workflow fails loudly instead of writing it to my CRM.*

**Mode:** `LEARN` — the contract is the lesson. An agent will happily wire a model call into a node and call it done.

**Why now:** After a reliable deterministic workflow exists. Now the only new variable is non-determinism.

**Concepts:**
- **The call lives in your service.** n8n asks your service to classify; your service calls the model. That single decision makes validation, versioning, metering, caching, faking and testing ordinary rather than impossible.
- **Structured output against a schema, or the step fails.** Never free text a later node parses. The schema is also the prompt: the description on each field is what tells the model what your categories mean.
- **Three outcomes, not two**: valid and usable; invalid, so the step fails; valid but low confidence, so it routes to a person. A workflow with only the first two has nowhere to put uncertainty.
- **The categories must be closed and must include an escape.** A classifier with no *"none of these"* option will always pick one, confidently, for the out-of-office message and the spam.
- **Prompt versioning from the first call.** Every AI call records which prompt produced it. Step 11 compares versions and step 13 attributes cost to them; neither is possible retrospectively.
- **Caching the stable prefix.** Instructions and schema are identical across every enquiry; the enquiry is not. Verify with cache-read tokens rather than assuming.
- **Faking the model in tests.** Your workflow tests must be deterministic. The real model is called in the golden set at step 11 and nowhere else in CI.
- **The output is untrusted input.** It is going into a CRM field, an email draft, a database. Treat it exactly like data from a form: validated, escaped, length-limited.
- **What the client sees.** For Fern & Oak the draft reply is written by a model and sent by a person. Say so, in the tool and in the proposal. A client who discovers it later loses trust in all of it.

**Libraries:** the `anthropic` SDK — structured outputs, prompt caching

**Expected outcome:** A classify-and-draft AI step in your service with a validated schema, a closed category set with an escape hatch, three outcomes, prompt versioning, caching verified, and a fake for tests. The Fern & Oak workflow using it. Every AI call recorded in the ledger with tokens and cost. A test proving an invalid output never reaches the CRM.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — an AI output that fails schema validation fails the step and writes nothing; an out-of-office message is classified into the escape category rather than a real one; a second call with the same prefix records cache-read tokens above zero; no unit test calls the real model. |
| **L2 — Manual checks** | (a) Run the whole seeded inbox through and read every classification. The ones that are wrong are step 11's golden set. <br>(b) Force the model to return something malformed and confirm the workflow fails rather than continuing with a partial object. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and nothing a model produced can reach a client system unvalidated |

---

## Step 8 — Replay when a step is non-deterministic

**Story:** *As Fern & Oak, when a run fails after classification, replaying it uses the classification it already made rather than inventing a new one.*

**Mode:** `LEARN` — the consequence of non-determinism most people never think about.

**Why now:** Immediately after the first AI step, while the problem is small and there is one model call to reason about.

**Concepts:**
- **Replay after an AI step is not a re-run.** Re-calling the model produces a different classification, so the replayed run is a different run. If a person already saw the first output, or a partial write used it, you now have two versions of one job.
- **Reuse the recorded output.** The ledger holds it, keyed by step and input hash. Replay reads it. Re-generation happens only when explicitly requested, and that is a different operation with its own record.
- **The input hash has to be the right input.** Hash what the step actually consumed after the transform, not the trigger payload. Get this wrong and a replay either always misses or always hits.
- **Partial external writes.** A run that wrote to the CRM and then failed has already changed the client's world. Replay must skip that write, which is exactly what the external-write record with its key is for.
- **Idempotency and replay are different mechanisms for different problems.** Idempotency protects against the same action being delivered twice. Replay protects against a run being restarted. You need both, and a system with only one has a gap it cannot see.
- **What may never be replayed.** A step that sent an email to a customer. Replaying it sends a second email. Mark such steps and make replay stop rather than repeat.
- **Manual replay is a client-facing feature.** "It failed overnight, I replayed it, here is what happened" is worth more to a client than any dashboard.

**Libraries:** none new — your ledger

**Expected outcome:** Replay implemented over the ledger: successful steps skipped by input hash, AI outputs reused, external writes not repeated, non-replayable steps marked and refused. An explicit re-generate operation, recorded separately. A replay endpoint your service exposes and a small page listing failed runs with a replay button.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — replaying a run that failed after classification issues zero model calls and produces the original classification; replaying a run that already wrote to the CRM produces no second record; replaying a run containing a sent email refuses rather than resending. |
| **L2 — Manual checks** | (a) Fail a run at four different points and replay each. One of them will surprise you; that is the one to write a test for. <br>(b) Change the transform, then replay an old run. Decide deliberately whether the input hash should now miss, and write down why. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and you can replay any failed run without fear |

---

## Step 9 — Human sign-off as a workflow state

**Story:** *As Brightline Recruiting, no application outcome exists until a person has agreed to it, and the person has what they need to decide.*

**Mode:** `LEARN` — the design most often built wrong, as a notification with an approve button.

**Why now:** After replay, because a workflow that waits for a person can wait for days and must survive a restart.

**Concepts:**
- **Waiting for a human is a state, not a pause.** The run stops. The item sits in a queue. Someone decides, possibly tomorrow, and the run resumes from there — possibly in a different process. Any implementation that blocks a workflow execution waiting for a person loses the item on the next restart.
- **What the approver is shown.** The input, the model's output, the reasoning, the confidence, what happens if they do nothing, and what the decision will cause. A queue showing a name and two buttons gets rubber-stamped within a week, which is worse than no gate because it looks like control.
- **Batch review without batch rubber-stamping.** Fifty applications need to be reviewable quickly, and *"accept all"* has to be scoped so it cannot approve something nobody looked at. Design the fast path and its limit together.
- **The queue must not become the bottleneck.** If sign-off takes longer than the manual process did, you have automated nothing. Measure seconds per decision, as a number, and put it in the report.
- **Expiry and defaults.** An item nobody touches for a week: what happens? For Brightline the only safe default is *nothing happens and someone is told*. Never default to the automatic outcome.
- **Sign-off is written by a person's session, never by a workflow.** Structurally, in a different write path.
- **Who may sign off what.** Per client, per workflow, per value. Rows, not branches.
- **Recording the disagreement.** When a person overrides the model, record both. It is the most useful data in the system: it is step 11's golden-set candidates and step 12's fairness evidence.

**Libraries:** your service, a template renderer

**Expected outcome:** Sign-off as a persisted state surviving restarts. A queue page showing input, output, reasoning, confidence and consequence. A scoped bulk action. Per-client sign-off permissions as data. Expiry with a safe default and a notification. Overrides recorded with both values. Brightline's workflow unable to complete without a sign-off.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a Brightline application outcome does not exist until a sign-off row written by a person's session exists; restarting every service while items await sign-off loses nothing; an expired item takes no automatic action and raises exactly one notification. |
| **L2 — Manual checks** | (a) Review twenty items yourself and time it. If it is slower than doing the task manually, redesign the screen, not the model. <br>(b) Try to approve something without reading it. However you managed it, a real reviewer will manage it faster. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and there is no path where a workflow decides something about a person |

---

## Step 10 — What may leave the building

**Story:** *As Ridgeway Legal, I can tell a client exactly what happens to their contract, and the answer is one a solicitor accepts.*

**Mode:** `LEARN` — an architecture decision with legal weight, and the step that decides whether you can serve this kind of client at all.

**Why now:** After the mechanics work. Confidentiality is a constraint on a working system, and designing it into a system that does not work yet produces theatre.

**Concepts:**
- **Ask what the actual rule is.** "It can't go to the cloud" is rarely the rule. Usually it is a professional obligation, a client contract, or a regulator's guidance, and each permits different things. The real rule is narrower and more workable than the first answer.
- **Four answers, in the order to try them:**
  1. **Send less.** Redact names, references and identifiers before egress. Often the model does not need them to find an unusual clause.
  2. **Control where inference runs.** Pin the region so processing stays in a permitted jurisdiction.
  3. **Contract and retention.** A processing agreement, a stated retention posture, and a written description of the flow. This is what most compliance conversations actually need, and it is paperwork rather than architecture.
  4. **Keep it in the building.** A locally hosted model. Only when nothing above is acceptable.
- **Redaction is a pipeline with a failure mode.** It can miss. Test it against documents built to defeat it — a name in a footer, a reference in a filename, an address in a signature block. And check the redacted text is still usable, because over-redaction produces a model that cannot do the job.
- **The honest cost of a local model.** It needs hardware. A small shared server cannot run a useful one at a usable speed; you are looking at a machine with an accelerator, bought or rented, plus your time to run it. State the number in the proposal. This material's recommendation is that it is the last resort, not the default — and that recommending it without pricing it is how an engagement goes wrong.
- **Self-hosting n8n is part of this answer.** It is why Ridgeway can hire you.
- **What the ledger and logs may hold.** Hashes, references and redacted extracts. Never the contract text.
- **Write the paragraph a solicitor will read.** Plain language, no architecture. Where the document goes, what is removed first, who could see it, how long anything is kept, and what happens if you stop working with them.

**Libraries:** your redaction implementation, the SDK's inference-location control, and a locally hosted model only if the client requires it

**Expected outcome:** A redaction stage before every egress on Ridgeway's workflow, tested against adversarial documents and checked for usability. Inference location pinned. Retention and a written data-flow description. `docs/confidentiality.md` — the four options, what this client chose, why, and the honest cost of the local-model path with hardware named. The solicitor-readable paragraph. A test that unredacted privileged text cannot leave the boundary.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — no request leaving the service for Ridgeway contains an unredacted identifier, asserted over the adversarial document set including footers, filenames and signature blocks; redacted documents still produce correct clause flags on the seeded set; the ledger contains no contract text. |
| **L2 — Manual checks** | (a) Read three redacted contracts. If you cannot tell what they are about, the model cannot either, and over-redaction has quietly broken the product. <br>(b) Give the solicitor paragraph to someone non-technical and ask what happens to a contract. Rewrite until they can say it back. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and you could answer a solicitor's questions without hedging |

**Harness impact:** `AGENTS.md` v3 — record that AI output is validated before any external write, that sign-offs are never written by a workflow, and that privileged text is redacted before egress and never stored.
