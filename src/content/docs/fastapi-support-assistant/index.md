---
title: Getting Started
description: A guided path from "I know Python, new to FastAPI" to a grounded support assistant you can prove works — with an eval set, a scored report, citations, and a refusal rate.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I know Python, new to FastAPI"* to an AI feature you can put in front of a
paying client and defend — built around one real domain: **Anchor**, a support assistant that
answers from a business's own documents, cites where each answer came from, and refuses when
the documents do not say, on Python 3.13 and FastAPI.

Eighteen steps. There's no deadline on any of it — take a step in an evening or over two weeks.
The order matters, the pace doesn't.

## Who this is for

- Comfortable with Python 3 — type hints, `async`/`await`, virtual environments, packages
- Comfortable with SQL, HTTP, a terminal, and git; Docker installed
- You have called an LLM API at least once, even if only in a notebook

**Not assumed:** FastAPI, pgvector, embeddings, retrieval, prompt design, evaluation, or any
opinion about whether retrieval-augmented generation is a good idea.

If you have built a chatbot demo before, this will still be new. The demo is step 9 of 18. The
other seventeen are what separates a demo from something a clinic will let near its patients.

## What you are building, concretely

Anchor answers questions from one business's documents and nothing else. It quotes its source,
it says "the documents don't cover that" when they don't, and it hands over to a human when the
question should not be answered by software at all.

The thing that makes it a portfolio piece is not the chat window. It is the **evaluation
report**: a fixed set of questions, graded answers, and a number for accuracy, citation rate
and refusal rate that moves when you change the retrieval. Almost nobody publishes one. A
client who has been shown three chatbot demos will notice immediately.

Three businesses are used as the running examples all the way through the roadmap. They were
picked because they disagree with each other on exactly the points that are hard to build:

| The business | Its documents | What it forces you to handle |
|---|---|---|
| **Ridgeline Cycles** — a bike shop | One 40-page PDF service manual and a price list. Changes twice a year. | The simple case, done properly: parse a real PDF, chunk it usefully, retrieve the right passage, and cite the page. If this is wrong, nothing else matters. |
| **Fairview Family Clinic** — a medical practice | Opening hours, fees, insurance policies, patient FAQs. A wrong answer is a liability, and some questions must never be answered at all. | Refusal as the correct behaviour, mandatory citation, an escalation path to a human, and a category of question the system declines even when the documents seem to cover it |
| **Ledgerly** — a B2B SaaS | Product docs plus a changelog, shipping weekly, with two supported versions live at once | Freshness. A stale index answers confidently and wrongly, "which version are you on?" changes the correct answer, and re-indexing has to happen without downtime |

Same code, same pipeline, three corpora whose rules do not match. That is the whole exercise:
one system, configured per workspace, and never a line of
`if workspace.slug == "fairview"`.

Three questions to keep asking as you build: what does this answer cite? what happens when the
documents do not contain the answer? and how would I know if this got worse?

Other businesses in this shape, if you want to point your own version at one: law firms with
policy libraries, schools with parent handbooks, insurers with product wordings, manufacturers
with installation manuals, HR teams with employee handbooks, councils with permit rules,
software teams with runbooks. All of them have documents that people keep asking about, and all
of them are somebody's paying customer today.

## Why a grounded assistant

Most AI material stops at the demo: a vector store, a prompt, an answer that looks right. That
is the easy 20%, it is what everybody has already built, and it is worth nothing in a portfolio
because a reviewer cannot tell a good one from a bad one. This domain was chosen because the
hard parts are unavoidable:

| Reality of the domain | Forces you to learn |
|---|---|
| The answer must come from the client's documents, not the model's memory | Grounding, citation, and how to detect an answer that was not supported by the retrieved text |
| Real documents are PDFs with tables, headers and two columns | Parsing, layout, chunking that respects structure, and what a bad chunk does to an answer three steps later |
| "I don't know" is often the correct answer | Refusal as a designed behaviour with its own metric, rather than a failure |
| A wrong answer at a clinic is a liability | Escalation, question categories that are declined by policy, and an audit trail of what was said |
| Documents change weekly | Incremental re-indexing, version-aware retrieval, and staleness as a monitored property |
| Every request costs money | Token budgets, prompt caching, context that grows with the conversation, and cost per conversation as a number you watch |
| "It seems better" is not a measurement | An eval set, retrieval metrics separated from answer metrics, and a regression gate in CI |

You cannot fake an eval. Either the score went up when you changed the chunking, or it went
down, and either way you now know something you cannot get from looking at three answers.

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | Python 3.13, `uv`, strict typing throughout |
| Framework | FastAPI — dependency injection, lifespan, background tasks, streaming responses |
| Data | PostgreSQL 17 + pgvector, SQLAlchemy 2, Alembic migrations |
| Ingestion | PDF, HTML and Markdown parsing; layout-aware chunking; document versioning |
| Retrieval | Embeddings, vector search, BM25 full-text search, hybrid fusion, reranking |
| Generation | The Claude API via the `anthropic` SDK, grounded prompting, citations, structured outputs, streaming |
| Safety | Refusal design, declined categories, human escalation, prompt-injection from document content |
| Evaluation | A hand-built eval set, retrieval metrics vs. answer metrics, LLM-as-judge and its failure modes, regression gating |
| Cost | Token accounting, prompt caching, context budgets, cost per conversation |
| Operations | Incremental re-index, freshness signals, structured logs, tracing a single answer end to end |
| Quality | pytest, ruff, mypy strict, deterministic tests against a non-deterministic dependency |
| AI workflow | An `AGENTS.md` harness (v1→v4), a `LEARN`/`BUILD` mode contract, a portable code-reviewer prompt |

## How this material is structured

Three parts. Read them in this order the first time, then jump back as needed.

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness — `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract — and a portable code-reviewer prompt. This is step 0. | Once, before step 1. Configure it, then leave it. |
| **[Roadmap](./roadmap/overview/)** | The 18 sequenced steps in five sections, plus the locked decisions, the corpus model, and the always-on quality guardrails. | Skim the overview first. Work the steps in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics (acceptance criteria + anti-patterns), the `AGENTS.md` template, and a list of deliberate omissions. | One rubric section per step. The rest, as questions come up. |

The roadmap sections:

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–3 | Tooling, harness, the FastAPI mental model, the corpus and workspace model |
| [Retrieval](./roadmap/retrieval/) | 4–8 | Ingestion and parsing, chunking, embeddings and pgvector, hybrid search, reranking |
| [Generation](./roadmap/generation/) | 9–12 | The grounded prompt and citations, refusal and escalation, conversation state and token budget, streaming |
| [Evaluation](./roadmap/evaluation/) | 13–15 | Building the eval set, retrieval vs. answer metrics, LLM-as-judge, regression gating in CI |
| [Operations](./roadmap/operations/) | 16–17 | Cost control and caching, re-indexing, freshness, deploy and observability |

**There is deliberately no implementation code in any of these documents.** Handing you working
code gives you the feeling of understanding, and you remember almost none of it later. The
roadmap tells you what to build and how to prove it works; the building is yours.

## The two paths

**Build the thing — steps 0–12.** Tooling, the corpus model, ingestion, retrieval, and a
grounded assistant that cites its sources and refuses when it should. Ends with something that
works and that you cannot yet prove.

**Prove the thing — steps 13–17.** The eval set, the metrics, the regression gate, cost
control, and re-indexing. Ends with the artefact that makes this a portfolio piece rather than
another demo.

Do not skip the second path. It is shorter than the first and it is the entire differentiator.

## How to read a roadmap step

Every step has the same parts. Once you know them you can skim to whichever one you need.

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. This is the *goal* — if you can't demo it, you haven't finished. |
| **Mode** | `LEARN` or `BUILD` — whether an AI agent may write the implementation. See [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on, and why it isn't earlier or later. The ordering encodes dependencies you can't see yet. |
| **Concepts** | What you're actually learning. This is the real point of the step; the code is just the vehicle. |
| **Libraries** | What to add, and sometimes why that choice over the obvious alternative. |
| **Expected outcome** | What you should have when the step is done — the pieces to build, and where useful a high-level project structure. The *how* is yours to work out. |
| **Verification** | How you prove it's done — see below. |

Some steps also carry a **Harness impact** note: what to add to `AGENTS.md` afterwards.

### Proving a step is done

The common failure of self-directed learning is that everything *feels* like it works. In this
domain that failure is worse than anywhere else, because the system produces fluent, confident
text whether or not it is right. Five verification layers exist to prevent it:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail. Write it, watch it fail, then make it pass. |
| **L2 — Manual checks** | What a test can't catch — reading twenty retrieved chunks by hand, asking the clinic's ten worst questions, checking that a citation actually says what the answer claims. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/), run by you at the end of every step. |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". This is where most of the real learning is. |
| **L5 — Automated guardrails** | CI, ruff, mypy strict, the eval regression gate from step 15. Continuous rather than per-step; listed in the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The step's Verification block vs. the Rubrics page

These are two views of the same thing. Be clear which is which:

- **The Verification block** ends every step. It's the checklist you work through to close
  *that* step: the `ACC-NN` test to write, the L2 checks to run by hand, the `AP-NN-x` IDs to
  self-check against, and a one-line *Done when*. This is the thing you *do*.
- **The [Rubrics page](./reference/rubrics/)** holds the full text of the `ACC-NN` criteria and
  the `AP-NN-x` anti-patterns that each step only names by ID. It lives in one place so the AI
  reviewer can be handed exactly one step's section without seeing the others. This is a
  *lookup* — you read one section per step while working that step's Verification block. You
  don't "complete" it.

### The per-step loop

1. Check the step's **Mode**. `LEARN` → your agent tutors only. `BUILD` → it may generate.
2. Read the step: story, why now, concepts.
3. For chunking, refusal, evaluation and cost steps — **write the acceptance test first**, watch it fail. (Steps 5, 10, 13, 15 especially.)
4. Write the implementation until the test passes.
5. Run the L2 manual checks.
6. Self-check against the step's `AP-NN-*` list in the [rubrics](./reference/rubrics/).
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix findings, resubmit until `PASS`.
9. Next step.

Expect to fail review the first time at steps 5, 10 and 14. That's the design, not a setback.

## How to use the rubrics

Each step has a **rubric** in [Reference → Rubrics](./reference/rubrics/) — the objective
pass/fail bar for that step, in two parts:

- **`ACC-NN`** — one gating acceptance test. Objective, no judgement call. You write it, watch
  it fail, then make it pass.
- **`AP-NN-x`** — named anti-patterns: mistakes that pass the tests but are still wrong (a
  citation that points at a chunk the answer did not use; an eval set written by the same model
  that is being evaluated).

Use it three times per step: read `ACC-NN` before you build and write that test first;
self-check against every `AP-NN-x` once it passes; then paste **only that step's section**
into the reviewer. Never paste the whole file — it leaks later steps.

## A note on cost

Every step from 9 onwards spends real money on API calls, and steps 13 to 15 spend the most
because an eval run calls the model once per question. The amounts are small — a full eval run
over 50 questions is cents, not dollars — but they are not zero, and they are the reason step
16 exists. Set a spending limit on your API account before step 9, watch the number in your own
dashboard from step 13, and treat "what does one conversation cost?" as a question with an
answer rather than a shrug.

## Start here

1. **Read this page to the end.** The step format only makes sense once.
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the corpus model. Don't memorise it; know it's there.
3. **Set up the [agent harness](./setup/agent-harness/).** This is step 0. Setting up tooling before any domain code feels like procrastination; it's what makes every later step fast.
4. **Set up the [reviewer](./setup/reviewer-setup/).** Configure once, run at the end of every step. Works in a plain chat window — no repo access needed.
5. **Start [step 1](./roadmap/foundations/).** A health endpoint and typed settings. Small on purpose.

If you're still tuning `AGENTS.md` after a couple of sessions, you're procrastinating. Ship a
minimal version and move on — it's designed to grow.
