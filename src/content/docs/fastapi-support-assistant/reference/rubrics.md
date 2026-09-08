---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"an answer citing a passage that was not supplied is rejected, not returned"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test but are still wrong: the eval set written by the model being evaluated, the citation that points at a passage the answer never used.

**Why this exists.** This system produces fluent, confident text whether or not it is correct, so "it looks right" is worth less here than anywhere else. The rubric turns "done" into something you check rather than something you feel.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never the whole file. The full file leaks later steps and dilutes the reviewer's attention.

---

## Step 0 — Harness and tooling bootstrap

**ACC-00** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a type error, a failing test. All three verified separately.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed permanently, and then the gate exists only in theory. |
| AP-00-b | **Multiple verification commands.** If you must remember four commands, some will be skipped. One entry point. |
| AP-00-c | **`mypy` in non-strict mode "for now".** Strict on an empty project is free; strict on a pipeline of untyped dictionaries is a week of work you will not do. |
| AP-00-d | **pgvector added later.** Installing the extension for the first time at step 6 means every step-6 problem looks like a retrieval problem. |

---

## Step 1 — FastAPI skeleton

**ACC-01** — a test client boots the app and asserts `GET /health` reports database and pgvector status; starting without a required setting fails at startup with a clear message.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **A blocking call inside an async handler.** One synchronous HTTP or file read stalls every other request on that worker, and the symptom looks like a slow model. |
| AP-01-b | **Configuration read from the environment at point of use.** Validate once at startup into typed settings; a missing key must fail at boot, not at the first paid request. |
| AP-01-c | **A global database connection instead of a lifespan-managed pool.** Works in development, leaks or exhausts under any concurrency. |

---

## Step 2 — Workspaces, policy and secrets

**ACC-02** — a query under workspace A never returns workspace B's rows, asserted for every table; a full request run at debug level logs no API key and no document body.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Policy expressed as `if workspace.slug == …`.** The third workspace is then a code change, and the fourth is a release. |
| AP-02-b | **Workspace filtering applied per query by hand.** One forgotten `where` is a data leak between two of your client's competitors. Make the scoping structural. |
| AP-02-c | **Logging whole documents or prompts at debug level.** A client's fee schedule in a log aggregator is a confidentiality breach even though no credential leaked. |

---

## Step 3 — The corpus schema

**ACC-03** — a second version of a document leaves the first version's chunks intact and queryable; switching the active version changes what a chunk query returns; asserted against real PostgreSQL with pgvector.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Chunks attached to the document instead of the version.** Re-indexing then means deleting first, which means a window where the assistant knows nothing. |
| AP-03-b | **Hashing the file bytes rather than the extracted text.** A re-saved PDF with identical content re-indexes the whole corpus for nothing. |
| AP-03-c | **An approximate vector index on an empty table.** It changes recall, it is tuned for a data distribution you do not have yet, and exact search is fast at this size. |
| AP-03-d | **Chunk metadata that cannot render a citation.** If "Service Manual, page 27" needs a field you did not store, every answer is unverifiable. |

---

## Step 4 — Ingestion

**ACC-04** — ingesting the Ridgeline manual produces the expected sections with heading paths intact, a known table survives extraction, and re-ingesting the identical file creates no new version.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Trusting extraction without reading the output.** Two-column PDFs produce grammatical nonsense, and no downstream step can recover from it. |
| AP-04-b | **Silently indexing an empty extraction.** A scanned document with no text layer becomes a document that exists and answers nothing, with no error anywhere. |
| AP-04-c | **Discarding structure.** Heading paths are the cheapest quality gain in the whole pipeline, and once extraction has flattened them they cannot be recovered. |

---

## Step 5 — Chunking

**ACC-05** — for 15 fixed questions with known answer passages, the correct passage is contained whole within a single chunk for at least 13; no chunk splits a table row from its header; every chunk carries a non-empty heading path.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Fixed-size chunking on character count alone.** It cuts procedures in half, and half a procedure retrieved confidently is worse than nothing. |
| AP-05-b | **Chunks with no context of their own.** Retrieved alone, a paragraph that begins "This must be done every 500km" is unusable — the title and heading path have to travel with it. |
| AP-05-c | **Heavy overlap to compensate for bad boundaries.** It inflates the index and the bill, and the boundaries are still bad. |
| AP-05-d | **A chunk size copied from a tutorial.** The right size depends on your documents and your questions, and this is the one parameter that is expensive to change later. |

---

## Step 6 — Embeddings and vector search

**ACC-06** — vector search returns the correct chunk in the top 5 for at least 11 of the 15 fixture questions; a query in another workspace never returns these chunks; re-running ingestion on an unchanged document issues zero embedding calls.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **A distance metric that does not match the model.** Silently produces plausible, subtly wrong rankings — the worst failure shape there is. |
| AP-06-b | **No record of the model and dimensions.** Changing embedding model means re-indexing everything; not knowing which model produced the vectors means you cannot tell whether you have to. |
| AP-06-c | **Re-embedding the whole corpus on every ingest.** Money and time for nothing, and it makes frequent re-indexing too expensive to do. |
| AP-06-d | **Assuming vector search handles exact identifiers.** Part numbers, error codes and prices are exactly where it is weakest, and all three corpora are full of them. |

---

## Step 7 — Hybrid search

**ACC-07** — an exact-identifier query returns the containing chunk at rank 1; a paraphrased conceptual query still returns the correct chunk in the top 5; hybrid scores at least as well as either retriever alone on the fixture.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Adding scores from two retrievers together.** They are on different scales with different distributions; the sum is arithmetic, not meaning. Fuse by rank. |
| AP-07-b | **Filtering after ranking.** Retrieving the top 5 and then dropping the wrong-version ones leaves you with two results and no idea what you missed. |
| AP-07-c | **Retrieving few candidates and keeping most of them.** Fusion needs something to fuse; retrieve wide, then narrow. |

---

## Step 8 — Reranking and the retrieval contract

**ACC-08** — reranking improves top-3 accuracy over fusion alone; a question with no relevant content returns empty rather than the least-bad chunk; near-duplicate chunks do not both appear.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Retrieval that can never return empty.** There is always a nearest neighbour. Without a threshold, refusal in step 10 is impossible and every question gets an answer. |
| AP-08-b | **Answering code that knows how retrieval works.** The moment the prompt builder reads a vector distance, you can no longer change retrieval without changing answering. |
| AP-08-c | **Reranking every candidate the index can produce.** Latency and cost scale with candidate count; pick a number and measure what it buys. |

---

## Step 9 — The grounded answer

**ACC-09** — every returned answer carries at least one citation naming a supplied passage, and the cited text appears in it; a faked model response citing an unsupplied passage is rejected rather than returned.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Grounding requested in the prompt and not enforced in code.** The model usually complies, and "usually" is what puts a wrong answer in front of a patient. |
| AP-09-b | **Citations returned without validation.** A citation nobody checks is decoration, and a wrong one is worse than none because it looks verifiable. |
| AP-09-c | **Retrieved passages and instructions mixed in the prompt with no separation.** Document text then reads as instruction, which is the injection vector step 10 tests for. |
| AP-09-d | **Unit tests that call the real model.** Slow, expensive, non-deterministic, and they fail for reasons that have nothing to do with your change. Fake it here; call it for real in the eval suite. |

---

## Step 10 — Refusal and escalation

**ACC-10** — a declined-category question is escalated without any model call; a question with no supporting passage is refused; a passage containing an injected instruction does not change behaviour.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Refusal treated as an error.** It is a correct outcome. Logging it as a failure means the metric that matters most is buried in your error tracker. |
| AP-10-b | **Conflating "no passage found" with "policy says no".** They need different messages, different escalation behaviour and different metrics. Fairview's ibuprofen question is the second kind and its FAQ makes it look like the first. |
| AP-10-c | **A declined category enforced only by asking the model nicely.** Policy checks run in code, before the call, or they are not policy. |
| AP-10-d | **An escalation that just says "I can't help".** With no handover, no context and no route to a person, it is a dead end wearing an escalation's name. |

---

## Step 11 — Conversation state and the token budget

**ACC-11** — a follow-up referring to the previous turn retrieves the correct passage; a ten-turn conversation stays within the token budget; recorded cache-read tokens exceed zero from the second turn.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Retrieving on the raw follow-up.** "What about the rear one?" retrieves nothing useful, and the answer that follows is confident and unrelated. |
| AP-11-b | **Resending the whole conversation every turn with no budget.** Cost grows linearly per turn for value that does not, and nobody notices until the invoice. |
| AP-11-c | **Volatile content before the cache breakpoint.** A timestamp or a request id in the cached prefix invalidates it every single turn, and the cache silently does nothing. |
| AP-11-d | **Assuming the cache works.** Read `cache_read_input_tokens` from the response. If it is zero, something in the prefix is changing. |

---

## Step 12 — Streaming

**ACC-12** — the stream emits a first token before completion, ends with citations and an outcome, and a client disconnect cancels the upstream call.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Streaming that bypasses the grounding check.** The guarantee from step 9 must survive; if you stream before validating, you need a retraction path and a recorded decision. |
| AP-12-b | **No cancellation on disconnect.** The customer closed the tab; you are still paying for tokens nobody will read. |
| AP-12-c | **Errors after the response has started with no client handling.** The status code was already 200, so the failure has to be in the stream and the client has to render it. |

---

## Step 13 — The eval set

**ACC-13** — the runner executes the full set, produces one result per item with retrieved passages and outcome, and is reproducible: two runs over the frozen set differ only in model output.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Questions generated by the model being evaluated, unedited.** The set then measures agreement with itself, and scores high on a system that is wrong. |
| AP-13-b | **Only answerable questions.** Optimising against this set produces a system that answers everything, which is precisely the failure Fairview cannot have. |
| AP-13-c | **No held-out split.** Tune against everything and the score measures memorisation, not quality. |
| AP-13-d | **An eval set that changes whenever it is inconvenient.** Editing the set to make a change look good is the most comfortable way to learn nothing. Version it; record every edit. |

---

## Step 14 — Metrics and judging

**ACC-14** — the scorer reports retrieval recall, citation validity and outcome accuracy separately; breaking retrieval moves the retrieval metric and not citation validity; the judge agrees with hand grades on at least 80% of calibration items.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **One overall score.** It cannot tell you whether the passage was missing or the model ignored it, and those have opposite fixes. |
| AP-14-b | **An uncalibrated judge.** Without agreement measured against your own grading, the number is generated rather than measured. |
| AP-14-c | **Asking the judge "is this a good answer?"** Vague criteria produce inconsistent scores that move between runs. One criterion per call, with a written rubric. |
| AP-14-d | **No over-refusal metric.** Every other metric improves by refusing more, so without this one the system optimises straight into uselessness. |

---

## Step 15 — The regression gate

**ACC-15** — a deliberately worse change fails the gate; a neutral change passes; the gate reports which metric moved and by how much.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **An exact threshold on a non-deterministic system.** It flaps, people start ignoring it, and then it is not a gate. |
| AP-15-b | **Two changes in one experiment.** They cancel out and look like no effect, and you have spent a run learning nothing. |
| AP-15-c | **Lowering the threshold to make the build pass.** The one thing that must require a written decision, because it is always the easiest option at 18:00. |
| AP-15-d | **No tuning log.** Six months later nobody knows what was tried, so it gets tried again. The log is a large part of what the client is buying. |

---

## Step 16 — Cost

**ACC-16** — cost per conversation is reduced against the recorded baseline while the held-out eval score stays inside the tolerance band; the report attributes cost per stage.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Optimising before measuring.** The stage you assume is expensive usually is not, and you will spend a day on 4% of the bill. |
| AP-16-b | **A cost change shipped without an eval run.** This is the exact scenario the gate exists for, and skipping it here wastes steps 13 to 15. |
| AP-16-c | **Downgrading the model as the first lever.** Caching, input hygiene and a lower effort level are free or nearly free; the model swap costs quality and splits your cache. |
| AP-16-d | **Cost per request instead of per completed conversation.** A cheaper answer the customer has to ask twice is more expensive. |

---

## Step 17 — Re-indexing and deploy

**ACC-17** — a document updated mid-conversation does not change answers until promotion; promotion is refused when the eval subset falls outside the band; a stale source raises a signal exactly once.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Delete-then-rebuild re-indexing.** There is a window, possibly minutes long, in which the assistant confidently knows nothing. |
| AP-17-b | **Promotion with no verification.** A bad extraction ships straight to production and the first person to notice is the client. |
| AP-17-c | **No freshness signal on a source.** A feed that silently stopped produces no error and steadily worse answers — the same failure shape as a missed batch job. |
| AP-17-d | **An answer that cannot be reconstructed.** "Why did it say that?" three weeks later is a normal support question, and without the trace the only answer is a shrug. |
