---
title: Roadmap Overview
description: Locked decisions, the corpus model, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with Python 3 and SQL. New to FastAPI and to retrieval. |
| Language / runtime | Python 3.13, `uv` for dependencies, type hints everywhere, `mypy --strict` |
| Framework | FastAPI, async throughout |
| Domain | Anchor — a support assistant answering from one business's own documents |
| Database | PostgreSQL 17 with the `pgvector` extension. One database for documents, chunks, vectors and full-text search. |
| Why not a dedicated vector database | One dependency instead of two, transactional consistency between a document and its vectors, and BM25 in the same query engine. Revisit past roughly ten million chunks, which no client in this material has. |
| Generation model | Claude via the official `anthropic` Python SDK. Default `claude-opus-5`; a cheaper model is introduced deliberately in step 16, not by default. |
| Embeddings | Anthropic does not serve an embeddings endpoint, so this is a separate dependency. Pick one hosted or local model at step 6, record the decision and its dimensions in an ADR, and do not change it without re-indexing. |
| Grounding rule | Every answer either cites a retrieved passage or refuses. There is no third option, and this is enforced in code, not requested in a prompt. |
| Refusal | A first-class outcome with its own metric, not an error |
| Evaluation | A hand-built eval set from step 13, run in CI from step 15. A change that lowers the score does not merge. |
| Testing | pytest against real PostgreSQL with pgvector. The model API is faked in unit tests and called for real only in the eval suite. |
| Quality | ruff (format + lint), `mypy --strict`, pytest. One formatter, one type checker. |
| Ops | Docker Compose → single VPS behind nginx. No GPU, no model hosting. |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

**Note on step count:** the roadmap is 18 numbered steps, 0 through 17. Evaluation gets three
of them (13–15) rather than a paragraph at the end, because it is the part that makes the rest
provable.

---

## Why this domain

A grounded assistant was chosen because it *forces* the topics that separate a demo from a
product:

- **The answer must come from the documents** → grounding, citation, and detecting an answer the retrieved text does not support
- **Real documents are messy** → PDF layout, tables, headers, and chunking that respects structure
- **Sometimes there is no answer** → refusal as designed behaviour with a measured rate
- **Documents change** → incremental re-indexing, version-aware retrieval, staleness signals
- **Every call costs money** → token budgets, caching, and a cost figure per conversation
- **Fluent text hides errors** → evaluation, because reading three answers tells you nothing

A demo cannot teach these. Nothing in a demo ever has to be right twice.

---

## The three example workspaces

Every step is written against the same three businesses. Ingest them in step 4 and keep them
for the rest of the roadmap — they disagree with each other on purpose, and an assistant that
works for all three is an assistant that works.

| Workspace | Corpus | The rule it exists to break |
|---|---|---|
| **Ridgeline Cycles** `ridgeline` | One 40-page PDF service manual with tables and diagrams, plus a two-page price list. Updated twice a year. | The simple case. One static corpus, no versions, no liability. If retrieval is wrong here, nothing else matters. |
| **Fairview Family Clinic** `fairview` | Opening hours, fee schedule, insurance and cancellation policies, patient FAQs. Mixed HTML and PDF. | Refusal is the correct answer more often than not. Citations are mandatory. Some categories — anything that reads as medical advice — are declined by policy even when a document appears to cover them, and the user is handed to a human. |
| **Ledgerly** `ledgerly` | Product documentation plus a weekly changelog, two supported product versions live at once. | Freshness and versions. The right answer depends on which version the asker is on, yesterday's index gives a confidently wrong answer, and re-indexing happens while people are asking questions. |

Concrete questions to keep asking as you build: does Ridgeline's answer cite the right page of
the manual? Does Fairview refuse "should I take ibuprofen before my appointment?" even though
its FAQ mentions ibuprofen? Does Ledgerly answer differently for version 2 and version 3, and
what happens to an answer given mid-re-index?

None of the three may ever be special-cased in code. If you find yourself writing
`if workspace.slug == "fairview"`, the policy model is wrong, not the workspace.

---

## The corpus model (target state)

```
Workspace ──has──> Policy (declined categories, escalation target, citation rule)
    │
    ├──has──> Source (a folder, an upload, a URL — where documents come from)
    │             │
    │             └──has──> Document ──has──> DocumentVersion (content hash, ingested_at)
    │                                              │
    │                                              └──has──> Chunk (text, position, metadata)
    │                                                            │
    │                                                            └──has──> Embedding (vector)
    │
    ├──has──> Conversation ──has──> Turn (question, answer, citations, outcome)
    │
    └──has──> EvalRun ──has──> EvalResult (question, expected, actual, scores)
```

Two words that look alike and are not:

- a **Document** is the thing the business owns — "the 2026 fee schedule". It has an identity
  that survives an edit.
- a **DocumentVersion** is one state of it. Chunks and embeddings belong to a version, never to
  a document, which is what makes re-indexing without downtime possible.

An **outcome** on a turn is one of: answered with citations, refused because the documents do
not cover it, or escalated because policy says a human must handle it. Those three are counted
separately for the rest of the roadmap, and step 14 turns them into metrics.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each one at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, lint, types, tests, in one command | 0 | Everything below, in one place |
| ruff format + lint | 0 | Formatting arguments and obvious defects |
| `mypy --strict` | 0 | The type errors that a dynamically typed pipeline hides until runtime |
| pytest against real PostgreSQL + pgvector | 3 | Vector operator behaviour, index usage and SQL that a mock would accept |
| The ungrounded-answer test | 9 | Any answer path that can return text without a citation or a refusal |
| The eval regression gate | 15 | A change that lowers accuracy, citation rate, or raises the wrong-answer rate |
| A no-secrets-in-logs test | 2 | An API key or a full document reaching the log channel |
| CI on every push | 0 | The above, on a machine that is not yours |

The eval regression gate is the one that matters most. From step 15, a pull request that lowers
the score does not merge without an explicit, recorded decision. It is the difference between
"I think this prompt is better" and knowing.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Two things to keep in mind while
working through them:

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. Chunking, grounding, refusal policy, eval design and judging all produce
code that looks obviously reasonable and is subtly wrong, and the wrongness is invisible
without the measurement you have not built yet.

**Steps 13 to 15 are not optional.** Everything before them is a demo. Everything a client is
actually buying is in them.
