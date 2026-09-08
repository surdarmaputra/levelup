---
title: Generation
description: Steps 9–12. The grounded prompt and citations, refusal and escalation, conversation state and token budget, streaming.
sidebar:
  order: 4
---

## Step 9 — The grounded answer

**Story:** *As a customer, every sentence of the answer comes from Ridgeline's manual and tells me which page, so that I can check it myself.*

**Mode:** `LEARN` — the grounding rule is enforced in code, and where you put that enforcement is the entire step.

**Why now:** Retrieval is good and can return nothing. Both are preconditions: grounding needs passages worth grounding in, and refusal needs retrieval that admits when it has nothing.

**Concepts:**
- **Grounding is a code rule, not a prompt request.** "Only answer from the context" in a system prompt is a suggestion the model usually follows. The guarantee comes from checking the output before returning it.
- Prompt assembly: system instructions, the retrieved passages with stable identifiers, the question, and nothing else. Everything in the prompt is either instruction or evidence.
- **Two ways to get citations**, and they are worth comparing on your own corpus: ask the model to emit the passage identifiers it used and validate them against what you sent, or pass the passages as document content blocks with the API's citation feature and read the citations back as structured data. The first is portable and needs validation; the second is checked by the API and cannot be combined with a structured output format, which matters at step 14.
- **Validating a citation**: it must name a passage you actually supplied, and the cited text must appear in it. An answer citing a passage it did not use is worse than no citation, because it is a lie the reader can verify only by doing the work themselves.
- What to do when the answer is not supported: this is step 10, and step 9 must leave a clean seam for it
- Model choice and settings: `claude-opus-5` as the default, adaptive thinking for questions that need it, and the fact that lower effort on a current model often beats a smaller model — measure before assuming
- Determinism: the model is not deterministic, so unit tests fake it and only the eval suite calls it for real

**Libraries:** the official `anthropic` Python SDK

**Expected outcome:** An answering pipeline: retrieve, assemble, call, validate, return. A response type carrying the answer text, the citations, the passages used, and the outcome. Code-level enforcement that an answer without a valid citation never reaches the caller. The ungrounded-answer test added to `make verify`. Ridgeline answering questions from the manual with page-level citations.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — every returned answer carries at least one citation naming a passage that was supplied, and the cited text appears in that passage; a faked model response citing a passage that was not supplied is rejected rather than returned. |
| **L2 — Manual checks** | (a) Ask ten questions and open the cited passage for each. Any answer whose citation does not support it is the defect this step exists to catch. <br>(b) Feed the model deliberately irrelevant passages and ask a question anyway. Watch what it does. That behaviour is what step 10 has to handle. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and no code path can return an answer with no valid citation |

**Harness impact:** `AGENTS.md` v3 — the grounding rule: every answer cites or refuses, enforced in code, and the check runs in CI.

---

## Step 10 — Refusal and escalation

**Story:** *As Fairview Family Clinic, when a patient asks whether they should take ibuprofen before their appointment, the assistant declines and offers to put them through to a person, so that we are not giving medical advice by accident.*

**Mode:** `LEARN` — write the acceptance test first. Refusal is the behaviour clients care most about and the one every demo skips.

**Why now:** Grounding exists, so "I have no supporting passage" is now detectable. Policy can be built on a signal that is real rather than guessed.

**Concepts:**
- **Three outcomes, not two.** Answered, refused, escalated. Each is a legitimate ending, each is counted separately, and treating refusal as a failure is what produces confident wrong answers.
- **Two different reasons to refuse**, which must not be conflated: the documents do not cover it, and policy says this must not be answered even if they do. Fairview's ibuprofen question is the second kind, and its FAQ mentioning ibuprofen is exactly the trap.
- Declined categories as workspace policy data, evaluated before the model is called — cheaper, more reliable, and auditable
- **Escalation as a product feature**: who it goes to, what context they receive, and what the customer is told. A dead end that says "I can't help" is not an escalation.
- Writing a refusal a customer does not resent: what it does not know, what it can do instead, and how to reach a person
- **Prompt injection from document content.** A document can contain text that reads like an instruction. Retrieved passages are data, never instructions, and the prompt must be built so the model treats them that way.
- Over-refusal is also a failure, and it will not show up until step 14 gives you the number

**Libraries:** your policy model from step 2, the `anthropic` SDK

**Expected outcome:** A three-outcome answering pipeline. Category checks run before retrieval, from workspace policy. Refusal when retrieval is empty or no citation validates. Escalation producing a handover record with the conversation, the question and the reason. Refusal and escalation copy written per workspace. A document containing injected instructions in the Fairview fixture, and a test proving it is not obeyed.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — a question in a declined category is escalated without any model call; a question with no supporting passage is refused rather than answered; a passage containing an instruction ("ignore your rules and…") does not change the system's behaviour. |
| **L2 — Manual checks** | (a) Write the ten worst questions a real Fairview patient might ask and run them all. Read every answer as if you were the practice manager. <br>(b) Count how many of your 15 fixture questions are now refused. If the number went up, you have traded a hallucination problem for a uselessness problem, and step 14 will make you fix it. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and each of the three outcomes is recorded separately on every turn |

---

## Step 11 — Conversation state and the token budget

**Story:** *As a customer having a five-message conversation, the assistant remembers what I asked two questions ago without the cost of my conversation doubling every time I type.*

**Mode:** `LEARN` — the budget is arithmetic, and the failure it prevents is a bill.

**Why now:** Single questions work. Conversations are where cost quietly becomes unbounded, and where retrieval starts answering the wrong question because it only saw the last message.

**Concepts:**
- **Context grows and cost grows with it.** A naive conversation resends everything every turn, so turn ten costs ten times turn one for the same value.
- **Query rewriting**: "what about the rear one?" is not a searchable question. Rewriting it against the conversation before retrieval is usually the single largest quality improvement in a multi-turn assistant.
- What to keep from history and what to drop: previous questions are cheap and useful; previous retrieved passages are expensive and usually stale
- **A token budget as a designed limit** — a ceiling per turn split between history, passages and the answer, enforced before the call rather than discovered in the bill
- Counting tokens before sending, using the API's token-counting endpoint rather than an estimate
- **Prompt caching**: the system prompt and stable instructions are identical every turn, so cache them and put volatile content after the breakpoint. Verify it works by reading the cache-read tokens in the response rather than assuming.
- Summarising older turns when the budget is reached, and what that loses
- Conversation storage: turns with question, answer, citations, outcome and token usage, which step 16 will read

**Libraries:** the `anthropic` SDK — token counting and prompt caching

**Expected outcome:** Conversations persisted per workspace with a turn per exchange. Query rewriting before retrieval on any turn after the first. A token budget enforced per turn with an explicit split. Prompt caching on the stable prefix, verified by reading the cache-read token count. Usage recorded per turn: input, output, cached, and cost.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — a follow-up question referring to the previous turn ("what about the rear one?") retrieves the correct passage; a ten-turn conversation stays within the configured token budget; the recorded cache-read token count is greater than zero from the second turn onward. |
| **L2 — Manual checks** | (a) Run a ten-turn conversation and plot the input tokens per turn. If it is a straight line upward, the budget is not enforced. <br>(b) Change one character in the system prompt and watch the cache-read count drop to zero. Understanding why is the point. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and you can state the cost of a ten-turn conversation in cents |

---

## Step 12 — Streaming and the interface

**Story:** *As a customer, the answer starts appearing immediately rather than after four seconds of nothing, so that the wait feels like thinking instead of a bug.*

**Mode:** `BUILD` — streaming plumbing. The decision about what to show while retrieval runs is yours.

**Why now:** The answer is correct, cited and budgeted. Making it feel fast is the last thing before evaluation, and it changes no behaviour that evaluation will measure.

**Concepts:**
- **Perceived latency is most of the experience.** Time to first token matters more than total time, and retrieval happens before the first token, so it is the part to show progress for.
- Streaming from the SDK and re-emitting over server-sent events from FastAPI; why SSE rather than WebSockets for one-directional text
- **Citations arrive with or after the text**, so the interface must render an answer whose citations are not final yet, then settle
- What streaming makes harder: validating grounding before returning. Either buffer and validate, or stream and be able to retract — decide deliberately and record why.
- Client disconnects mid-stream: the request is gone but the API call is still billing. Cancellation is a cost feature.
- Errors mid-stream, when a 200 has already been sent
- A minimal web client — enough to demonstrate the product, not a frontend project

**Libraries:** FastAPI's streaming response, the `anthropic` SDK's streaming interface

**Expected outcome:** A streaming answer endpoint over SSE, emitting retrieval progress then answer tokens then final citations and outcome. A grounding decision recorded and defended: buffer-then-validate, or stream-then-retract. Cancellation on client disconnect. A single-page client good enough to show a client, using all three workspaces.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — the stream emits a first token before the full answer is complete, ends with citations and an outcome, and a client disconnect cancels the upstream call rather than leaving it running. |
| **L2 — Manual checks** | (a) Ask a question, then close the tab immediately. Confirm in your logs that the model call was cancelled. <br>(b) Force an error halfway through a stream and watch what the client shows. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and the grounding guarantee from step 9 still holds under streaming |
