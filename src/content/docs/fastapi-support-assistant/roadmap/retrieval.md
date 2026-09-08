---
title: Retrieval
description: Steps 4–8. Ingestion and parsing, chunking, embeddings and pgvector, hybrid search, reranking.
sidebar:
  order: 3
---

## Step 4 — Ingestion: real documents, not clean text

**Story:** *As Ridgeline Cycles, I hand over the service manual PDF I already have, and the system reads it — including the tables — so that I do not have to rewrite my documentation to use this.*

**Mode:** `BUILD` — parsing is library work. The decisions about what to keep are yours.

**Why now:** Everything downstream is a function of what comes out of this step. Bad extraction cannot be fixed by better retrieval or a better prompt, and you will spend two steps blaming the wrong thing.

**Concepts:**
- **Garbage in is the whole problem.** A PDF's two-column layout read left-to-right across the page produces sentences that are grammatical and meaningless. Look at the extracted text before you trust it.
- What breaks in real documents: two-column layout, tables, headers and footers repeating on every page, footnotes, scanned pages with no text layer at all
- **Structure is signal.** A heading path ("Maintenance → Brakes → Hydraulic") is worth more than the paragraph in some queries, and it must survive extraction.
- Deciding what to drop: page furniture, navigation, cookie banners in scraped HTML
- Detecting a document you cannot handle — a scan with no text — and failing loudly rather than indexing an empty string
- Ingestion as a pipeline with a record per document: what was read, what was skipped, and why
- Idempotent ingestion: the same file ingested twice produces one version, not two

**Libraries:** a PDF text extractor, an HTML-to-text converter, a Markdown parser. Try two PDF libraries on the real manual and choose with evidence, not with reputation.

**Expected outcome:** An ingestion pipeline reading PDF, HTML and Markdown into a `DocumentVersion` with extracted text and a preserved heading path per section. Repeating page furniture removed. A no-text-layer document rejected with a specific error. An ingestion report per source. All three workspaces' corpora ingested: Ridgeline's manual and price list, Fairview's mixed HTML and PDF policies, Ledgerly's docs and changelog.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — ingesting the Ridgeline manual produces the expected number of sections with heading paths intact, a known table's contents survive extraction, and re-ingesting the identical file creates no new version. |
| **L2 — Manual checks** | (a) Print the extracted text of five random pages and read them. This is not optional and there is no substitute for it. <br>(b) Find the worst page in each corpus — the most complex table, the most awkward layout — and look at what came out. That page is your ceiling for the rest of the roadmap. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and you have personally read extracted text from every corpus |

---

## Step 5 — Chunking

**Story:** *As a customer asking about brake bleeding, the passage the system retrieves contains the whole procedure rather than half of it, so that the answer is not confidently incomplete.*

**Mode:** `LEARN` — write the acceptance test first. This is the step that decides how good the assistant can ever be.

**Why now:** Before embeddings, because embedding a bad chunk produces a perfectly retrievable bad chunk, and you will not be able to tell from the vector that anything is wrong.

**Concepts:**
- **A chunk is a unit of retrieval, not a unit of text.** The question is not "how long" but "does this passage answer a question on its own".
- Fixed-size chunking and why it is the default everywhere and wrong nearly everywhere: it cuts procedures in half and separates a table from its heading
- **Structure-aware chunking**: split on headings and sections first, then size within them
- Overlap: what it fixes, what it costs, and why heavy overlap is a way of paying for bad boundaries
- **Context that must travel with the chunk**: the document title and heading path prepended, so a chunk retrieved alone still says what it is about
- Tables, lists and code: units that must not be split, and what to do when one exceeds your size limit
- **Chunk size interacts with everything downstream** — retrieval precision, how many you can fit in a prompt, and cost per question. Changing it later means re-indexing.
- Evaluating a chunking strategy before you have an eval set: retrieval by hand over a list of questions you wrote first

**Libraries:** your own splitter. Read one library's implementation, then write yours — this is 150 lines and the details are the lesson.

**Expected outcome:** A structure-aware chunker producing chunks that carry their document title and heading path, never split a table or a numbered procedure, and fall back to size-based splitting only within a section. A written record of the size, overlap and reasoning. A fixture of 15 questions per workspace with the passage that should answer each, used by hand now and folded into the eval set at step 13.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — for a fixed list of 15 questions with known answer passages, the correct passage is contained whole within a single chunk for at least 13 of them; no chunk splits a table row from its header; every chunk carries a non-empty heading path. |
| **L2 — Manual checks** | (a) Print 20 random chunks and read them cold. For each, ask: what question does this answer? A chunk you cannot answer that for is a chunk that will be retrieved for the wrong reasons. <br>(b) Find the longest and shortest chunks and explain both. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and you can defend your chunk size with something other than "it's what the tutorial used" |

---

## Step 6 — Embeddings and vector search

**Story:** *As a customer who asked "how do I stop my brakes squeaking", the system finds the passage about brake noise even though it never uses the word "squeaking".*

**Mode:** `LEARN` — the mechanism matters more than the API call, and the API call is four lines.

**Why now:** Chunks exist and are good. Embedding them is now worth doing, and doing it earlier would have meant embedding twice.

**Concepts:**
- **What an embedding is**, at the level you need: a fixed-length vector where distance approximates semantic similarity, learned by a model that has never seen your documents
- **Distance metrics**: cosine, inner product, L2, and why the metric must match what the model was trained with
- Dimensions, and the storage and speed consequences of a larger vector
- **The model is a locked-in decision.** Vectors from two models are not comparable, so changing the model means re-indexing everything. Record it in an ADR at this step.
- Batching, rate limits, and re-embedding only what changed
- **Exact search first.** With tens of thousands of chunks, a sequential scan is fast and always correct. An approximate index trades recall for speed; add one when you can measure the need.
- What vector search is bad at: exact identifiers, part numbers, prices, names, negation, and "the latest version" — every one of which appears in these three corpora

**Libraries:** an embedding model — hosted or local. Anthropic does not serve embeddings, so this is a separate dependency; choose one, record the choice and the dimension count in an ADR, and note what changing it would cost.

**Expected outcome:** An embedding stage in ingestion, batched and resumable, storing vectors on chunks. A vector search returning the top *k* chunks for a query within a workspace, with distances. A re-embed path for a changed document version only. A recorded ADR naming the model, dimensions and metric. A written list of the queries you found that vector search handles badly — that list is the argument for step 7.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — for the 15-question fixture, vector search returns the correct chunk in the top 5 for at least 11; a query in a different workspace never returns these chunks; re-running ingestion on an unchanged document issues zero embedding calls. |
| **L2 — Manual checks** | (a) Search for a part number that appears in exactly one chunk. Note where it ranks. That result is why step 7 exists. <br>(b) Search for something the corpus does not contain at all, and look at what comes back. Nothing is ever empty — the top result always has a distance, and understanding that is the point of step 9. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and you have written down three queries vector search gets wrong |

---

## Step 7 — Hybrid search

**Story:** *As a Ledgerly customer asking about error code `LG-4021`, the system finds the exact paragraph mentioning that code, not three paragraphs that are vaguely about errors.*

**Mode:** `LEARN` — the fusion step is where generated implementations quietly produce nonsense.

**Why now:** You have now personally watched vector search fail on exact terms. Building the fix before seeing the failure teaches you nothing.

**Concepts:**
- **Two searches with different strengths.** Lexical (BM25) is exact and literal; vector is fuzzy and semantic. Most real questions need both, and the mix differs per corpus.
- PostgreSQL full-text search: `tsvector`, `websearch_to_tsquery`, ranking, and language configuration
- **Fusing two ranked lists.** Scores from different systems are not comparable and normalising them is fragile. Reciprocal rank fusion combines by *position*, is three lines, and is hard to get wrong — start there.
- Weighting one retriever over the other, and why the weight belongs in workspace configuration
- **Candidate count vs. final count**: retrieve widely, then narrow. Retrieving 5 from each and keeping 5 is not the same as retrieving 50 from each and keeping 5.
- Metadata filters that must apply before ranking: workspace, active version, and for Ledgerly the product version the asker is on
- Measuring the change: the same 15-question fixture, before and after, with the number written down

**Libraries:** PostgreSQL full-text search, your own fusion — do not add a search engine

**Expected outcome:** A BM25 search over the same chunks, a fusion layer combining both ranked lists, per-workspace weighting held as configuration, and filters applied before ranking. The retrieval interface unchanged from the answering side's point of view — hybrid is an implementation detail. A before-and-after number on the fixture.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — an exact-identifier query returns the chunk containing that identifier at rank 1; a paraphrased conceptual query still returns the correct chunk in the top 5; hybrid scores at least as well as either retriever alone on the 15-question fixture. |
| **L2 — Manual checks** | (a) Take the three queries you wrote down in step 6 and rerun them. If they are not fixed, your fusion is not doing what you think. <br>(b) Disable each retriever in turn and rerun the fixture. If disabling one changes nothing, it is not contributing and you should find out why. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and you have numbers for vector-only, lexical-only and hybrid |

---

## Step 8 — Reranking and the retrieval contract

**Story:** *As a customer, the three passages the assistant reads are the three most relevant ones, not the three that happened to rank highest on a keyword.*

**Mode:** `LEARN` — the cost and latency trade-off is the lesson, and it is a judgement call.

**Why now:** Last in the retrieval section. Reranking improves an ordering that must already be roughly right; applying it to bad candidates just reorders bad candidates.

**Concepts:**
- **Retrieve wide, rerank narrow.** Fusion gives 50 plausible candidates cheaply; a reranker scores each against the question properly and keeps the best 5.
- What a cross-encoder does differently from an embedding: it reads the question and the passage together instead of comparing two independent summaries
- **The cost of reranking**: latency and money per question, scaling with candidate count. This is the first place where a quality decision has a per-question price, and step 16 will come back to it.
- Using a small model as a reranker, and why the cheapest option is often good enough for this
- **The retrieval contract**: retrieval returns passages with scores and provenance, and never anything else. Answering does not know how they were found. This boundary is what lets you change everything in this section later without touching steps 9 to 12.
- Knowing when to stop: a score threshold below which you return nothing, which is what makes refusal possible in step 10
- Diversity: three chunks from the same page are usually one chunk's worth of information

**Libraries:** a reranking model, or a scored call to a small generation model. Compare both on the fixture; the cheaper one often wins.

**Expected outcome:** A reranking stage over the fused candidates, a configurable candidate and result count, a minimum-score threshold below which retrieval returns empty, and near-duplicate suppression. A stable `RetrievalResult` type carrying text, score, and everything a citation needs. Latency and cost per query measured and written down.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — reranking improves top-3 accuracy on the 15-question fixture over fusion alone; a question with no relevant content returns an empty result rather than the least-bad chunk; two near-identical chunks do not both appear in the final set. |
| **L2 — Manual checks** | (a) Measure latency with and without reranking and write both numbers down. Decide, out loud, whether the improvement is worth the milliseconds and the cents. <br>(b) Ask a question the corpus cannot answer and confirm retrieval returns nothing. If it returns something, step 10 will hallucinate on top of it. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, retrieval can return empty, and answering knows nothing about how retrieval works |
