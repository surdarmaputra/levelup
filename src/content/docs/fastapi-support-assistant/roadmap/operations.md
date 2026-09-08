---
title: Operations
description: Steps 16–17. Cost control and caching, re-indexing, freshness, deploy and observability.
sidebar:
  order: 6
---

## Step 16 — What it costs, and making it cost less

**Story:** *As the person selling this, I can quote a monthly price with confidence because I know what one conversation costs and where the money goes.*

**Mode:** `LEARN` — every lever here trades quality for money, and the eval set is what tells you whether the trade was acceptable.

**Why now:** After the eval gate, and not one step before it. Every optimisation in this step risks making the assistant worse, and until step 15 you had no way to find out whether it had.

**Concepts:**
- **Measure before optimising.** Token usage per turn is already recorded from step 11. Break the bill down by stage — embedding, reranking, answering, judging — before touching anything.
- **The free wins first**, in this order: prompt caching on the stable prefix, trimming input that earns nothing, not retrieving more passages than the answer uses, and capping output length
- **Effort before model.** Lowering the effort level on a capable model often beats switching to a smaller one, and keeps one cache namespace instead of two. Try it first and measure both.
- Where a cheaper model genuinely belongs: reranking, query rewriting, and the eval judge — high volume, narrow task, low judgement
- **Cost per completed task, not per request.** A cheaper call that needs a retry or produces an answer the customer has to re-ask is not cheaper.
- Batching and caching at the application level: identical questions within a workspace, and embeddings for text that has not changed
- **Every change goes through the eval gate.** This is the step where the gate earns its keep: you will be tempted by a change that halves the cost and quietly drops accuracy four points.
- Pricing the result: cost per conversation, expected conversations per month, and the margin between that and what you charge

**Libraries:** the `anthropic` SDK — token counting, prompt caching, effort settings

**Expected outcome:** A cost breakdown per stage from real usage. Prompt caching verified by cache-read tokens. At least three cost changes applied, each with its eval score before and after. A cheaper model used deliberately for reranking, rewriting or judging, with the quality effect measured. A documented cost per conversation for each workspace, and a monthly figure at an assumed volume.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — cost per conversation is reduced against the recorded baseline while the held-out eval score stays inside the tolerance band; the report attributes cost per stage. |
| **L2 — Manual checks** | (a) Take your three cost changes and, for each, name the quality it could have cost and the eval number that says it did not. <br>(b) Work out what a workspace at 500 conversations a month costs you, and what you would charge. If the second number is not comfortably larger, the design needs a change, not the price. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and you can quote a monthly price with the arithmetic behind it |

---

## Step 17 — Re-indexing, freshness, and deploy

**Story:** *As Ledgerly, I publish documentation every week and the assistant is right about it the same day, without anyone taking the service down.*

**Mode:** `BUILD` — the deploy is wiring, the re-index strategy is a decision you make and record.

**Why now:** Last. Re-indexing without downtime depends on the version model from step 3, and knowing whether a re-index made things worse depends on the eval gate from step 15.

**Concepts:**
- **Re-index by version, not in place.** Ingest the new version, embed it, verify it, then switch the active pointer. Deleting and rebuilding means a window where the assistant confidently knows nothing.
- Incremental work: content hashes decide what changed, so a weekly changelog costs one document, not a corpus
- **Staleness as a monitored property.** A source that has not been checked for seven days is a silent failure, exactly like the missing supplier file in a batch system: no error, no alert, wrong answers.
- Verifying an index before promoting it: run the eval subset against the new version and refuse to switch if the score falls outside the band
- **Observability for an answer**: one trace showing the rewritten query, the candidates, the reranked set, the prompt tokens, the outcome and the cost. Answering "why did it say that?" three weeks later is a support requirement, not a nice extra.
- What to log and what never to log: the question and the outcome yes, the customer's personal details and whole documents no
- Rate limiting and abuse: an endpoint that costs money per request needs a per-workspace quota
- Deploy: containers, migrations that run before the new version serves, and a rollback that does not orphan a half-built index
- **Handover**: the corpus is the client's, so ingestion must be re-runnable by them, and the eval report is theirs to keep

**Libraries:** Docker Compose, your CI, structured logging

**Expected outcome:** Incremental re-indexing driven by content hash, with atomic version promotion gated on an eval subset. Per-source freshness signals with alerting. A trace per answer, retrievable by id. Per-workspace rate limits. A deploy that runs migrations safely and can roll back. A `docs/RUNBOOK.md` covering a failed re-index, a stale source, a cost spike and a bad answer report.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — a document updated mid-conversation does not change answers until its version is promoted; promotion is refused when the eval subset falls outside the band; a source not refreshed within its window raises a stale signal exactly once. |
| **L2 — Manual checks** | (a) Re-index Ledgerly's corpus while asking questions continuously. No question may return an empty or half-indexed answer. <br>(b) Take one answer from a week ago and reconstruct exactly why it said what it said, using only what you log. Any gap is a missing field. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, a re-index cannot make the assistant worse without failing loudly, and any answer can be explained after the fact |
