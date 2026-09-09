---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete. It has two parts.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail, no judgement call. It states exactly what must be proven — *"an invoice whose line items do not sum to its total is never accepted"*. You write the test, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test and are still wrong: a confidence score that is really the model's opinion of itself, a gold set labelled by the model being graded.

**Why this exists.** An extraction that is 80% right looks exactly like one that is 99% right until you check three hundred documents. "It looks right" is worth less here than almost anywhere, so the rubric turns "done" into something you check rather than something you feel.

**How to use it — three times per step:**

1. Before you build, read `ACC-NN` and write that test first. Watch it fail.
2. Once it passes, self-check against every `AP-NN-x` in the step's section.
3. Paste **only that step's section** into the [AI reviewer](../../setup/reviewer-setup/) — never the whole file. The full file leaks later steps and dilutes the reviewer's attention.

Steps 0 to 3 produce documents rather than code. Their rubrics are still objective: a document either contains the five required elements or it does not.

---

## Step 0 — What re-keying costs

**ACC-00** — the cost model produces an annual figure for each of the three clients, and every input is either sourced or explicitly marked as an assumption. No unmarked guesses.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Using a wage instead of a loaded cost.** Employer costs, holiday, cover and desk space are real, and leaving them out understates the problem by a third or more. |
| AP-00-b | **Counting only the typing.** The correction of a wrong entry, the phone call to the supplier, and the decisions made on three-day-old stock levels are part of the cost, and often the larger part. |
| AP-00-c | **A model with no assumptions marked.** Every number a client can challenge must be visibly an assumption, or the first challenge discredits the whole page. |

---

## Step 1 — How a document pipeline works

**ACC-01** — the document names all five stages, and for each one states a failure that produces a *wrong answer with no error*. Loud failures do not count.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Treating reading as one stage.** Text layer and vision are different code paths, different costs and different failure shapes. Collapsing them is the decision that sets the cost floor, made by accident. |
| AP-01-b | **Skipping classification.** Extracting a remittance against an invoice schema produces confident nonsense that no later check catches. |
| AP-01-c | **Describing only the happy path.** The whole value of this document is the quiet failures; a pipeline description with no failure modes is a diagram. |

---

## Step 2 — What you could buy instead

**ACC-02** — the comparison names at least five real products with sources and check dates, and gives a per-client recommendation whose deciding reason is stated in one sentence.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Recommending "build" for all three.** If the analysis never reaches "buy", it was written to justify a decision already made, and the client will notice. |
| AP-02-b | **Comparing a licence price against a build with no maintenance.** Like for like means vendor price plus your integration versus your build plus your ongoing time. |
| AP-02-c | **Pricing with no date.** This market re-prices within a year. An undated figure quoted in a meeting is a credibility risk, not a data point. |

---

## Step 3 — Scoping the job

**ACC-03** — the pilot proposal states the document sample, the accuracy definition and how it is measured, the target review rate, what is out of scope, and what happens if measured accuracy misses the target. All five present, none vague.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Quoting before seeing fifty real documents.** Three clean samples hide the layout count, the photograph quality and the one document type nobody mentioned. |
| AP-03-b | **Promising a percentage with no definition.** "99% accurate" without *at what* and *measured on what* is a number that cannot be met and cannot be argued with. |
| AP-03-c | **An out-of-scope list nobody would have asked for.** A scope boundary that excludes nothing anyone wanted is decoration. |

---

## Step 4 — Harness and tooling bootstrap

**ACC-04** — `make verify` exits 0 on a clean tree, and non-zero when each of the following is introduced independently: a misformatted file, a type error, a failing test.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Slow pre-commit hook.** Anything over ~5 seconds gets bypassed permanently, and then the gate exists only in theory. |
| AP-04-b | **`mypy` in non-strict mode "for now".** Strict on an empty project is free; strict on a pipeline where every stage transforms a shape is a week you will not spend. |
| AP-04-c | **An `AGENTS.md` that does not mention the business.** The four documents from steps 0–3 are the most useful context an agent can have here, and pointing at them costs one line. |

---

## Step 5 — Skeleton and document store

**ACC-05** — uploading a document stores the original byte-identical, records a hash, and creates exactly one job; the re-saved copy of the same invoice produces one document, not two; killing the worker mid-job leaves the job claimable.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Reading the upload into memory.** Works on a two-page invoice, fails on a forty-page scan, and fails in production rather than in your tests. |
| AP-05-b | **Hashing the file bytes.** A re-saved PDF with identical content is a different file and the same document. Hash what you extract from. |
| AP-05-c | **"Fixing" the original on the way in.** Rotating or re-compressing the stored file destroys the evidence and makes a later dispute unanswerable. Normalise a copy. |

---

## Step 6 — The extraction schema

**ACC-06** — one document holds two extractions from different models without either overwriting the other; a forty-row remittance stores forty line items each with its own confidence; a query under client A never returns client B's rows.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **One document, one record.** Alder's remittance cannot be represented, and every workaround ends as JSON in a notes column. |
| AP-06-b | **Overwriting the previous extraction.** Steps 11 and 15 both compare two extractions of the same document. Overwrite and neither is possible. |
| AP-06-c | **Confidence on the document rather than the field.** One uncertain value then contaminates thirty certain ones, and the review queue becomes useless. |
| AP-06-d | **Everything stored as text.** A total without a currency and a date without a resolved format move the ambiguity into the client's accounting system, where it is someone else's problem and still your fault. |

---

## Step 7 — Classification and reading paths

**ACC-07** — every Meridian invoice takes the text path with zero model calls; every Coastline photograph takes the vision path; the no-text-layer scan produces `empty_extraction`; the misfiled document is classified low-confidence rather than extracted against the wrong schema.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **"Has any text" as the text-layer test.** A scan with a header and a page number passes it, and then extracts nothing from a document that appeared to work. |
| AP-07-b | **Sending everything to the model.** It works, it is simple, and it multiplies the bill for documents whose text was already there for free. |
| AP-07-c | **An empty extraction recorded as success.** No error, no exception, a document that quietly says nothing. The most dangerous failure in the pipeline. |
| AP-07-d | **Choosing between OCR and vision from a blog post.** Including this material's. Measure both on twenty of your own documents; the answer depends on your documents. |

---

## Step 8 — Structured extraction

**ACC-08** — a response not matching the schema fails rather than being stored; an absent field returns null rather than invented; every stored field carries a page number; the second extraction of a document type records cache-read tokens above zero.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Parsing JSON out of a text response.** Structured outputs exist so the response validates or fails. Hand-parsing accepts valid-looking JSON with a renamed field. |
| AP-08-b | **A schema with no field descriptions.** The description is what tells the model which of the three totals on the page is *the* total. It is where most extraction quality lives. |
| AP-08-c | **Fixing extraction quality in code.** The first fix for a wrong field is the description, not a post-processing rule that will need one per supplier. |
| AP-08-d | **Unit tests that call the real model.** Slow, costly, non-deterministic, and they fail for reasons unrelated to your change. Fake here; call for real in the accuracy suite. |

---

## Step 9 — Line items and tables

**ACC-09** — the note whose table crosses a page break returns all fourteen rows, asserted individually; a repeated header does not become a line item; the forty-row remittance returns forty rows; an artificially truncated response fails rather than storing a short table.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Asserting a row count instead of the rows.** Fourteen wrong rows pass. This is the test that gives false confidence in exactly the place you need real confidence. |
| AP-09-b | **Per-page extraction with no stitching.** Every row that spans the break is lost, silently, and the totals still look plausible. |
| AP-09-c | **Treating a totals row as a line item.** It inflates every quantity and breaks the reconciliation you are about to build at step 10. |
| AP-09-d | **No truncation check.** A long table hitting an output limit returns a valid object with fewer rows and no complaint. |

---

## Step 10 — Validation and confidence

**ACC-10** — an invoice whose line items do not sum to its total is never accepted whatever the confidence; a missing supplier produces review; an ambiguous date is flagged rather than resolved; no path writes an unvalidated value to a client-facing table.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Asking the model for a confidence score.** Fluent, correlates weakly with being right, and feels exactly like the answer. The most common mistake in this domain. |
| AP-10-b | **Confidence that does not sort the documents.** If the ten lowest-confidence documents are not the ten hardest, the score is decoration and every threshold built on it is arbitrary. |
| AP-10-c | **Validation rules as code branching on a client.** The fourth client is then a release, and the rules that encode the client's trade knowledge are invisible to them. |
| AP-10-d | **Failing open.** When a check cannot run, the outcome is review. Accepting because validation was unavailable is how the one unverified document is the one that is wrong. |

---

## Step 11 — The gold set and the number

**ACC-11** — the scorer reports field, document and critical-field accuracy separately, and a deliberately broken extraction moves field accuracy without moving row recall; two runs over the frozen set produce the same score for deterministic paths.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Labels produced by the model being graded.** The set then measures agreement with itself and scores well on a system that is wrong. |
| AP-11-b | **Reporting only field-level accuracy.** It is always the flattering one. Document-level is what the client means, and omitting it is the standard dishonesty of this market. |
| AP-11-c | **A generous normaliser.** Every rule that makes two different values "equal" raises the score. Write them down, or the number measures your normaliser. |
| AP-11-d | **No held-out split.** Tune against everything and the number measures how much you tuned, not how well it works. |

---

## Step 12 — The review queue

**ACC-12** — a corrected field is stored with old value, new value, user and timestamp and never overwrites the extraction; a user without Alder access cannot open an Alder document by URL; a document with one uncertain row presents that row, not all forty.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **A queue that shows every field.** It is re-typing with extra steps, and the client will correctly conclude the system saves nothing. |
| AP-12-b | **No page beside the value.** A reviewer hunting through forty pages for the number they are checking stops checking within a week. |
| AP-12-c | **Corrections written straight into the gold set.** Reviewers are right most of the time. A correction is a candidate, not truth. |

---

## Step 13 — Thresholds and routing

**ACC-13** — the same document routes differently under two client threshold rows with no code change; an invoice above the value threshold goes to review at maximum confidence; an unreadable document is rejected rather than queued.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **A threshold picked because it looked reasonable.** It is an economic decision with two curves and an intersection. Anything else is a hyperparameter nobody can defend. |
| AP-13-b | **Treating all errors as equal cost.** A wrong total on a large invoice and a wrong address line are not the same event, and one threshold for both gets both wrong. |
| AP-13-c | **No over-refusal metric.** Every other number improves by sending more to review, so without watching the review rate the system optimises into a slower manual process. |
| AP-13-d | **Rejection and review sharing a destination.** "I could not read this" and "please check this" need different handling, different messages and different counts. |

---

## Step 14 — Where the money goes

**ACC-14** — the ledger attributes every model call in a full pack run to a client, a stage and a prompt version, and the attributed sum matches the run total; a twice-extracted document appears once as a completed document with both attempts counted.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **The provider console as the only source.** It is the bill. It cannot tell you which client, which stage or which change, so a spike is noticed a week late and never explained. |
| AP-14-b | **Not storing `usage` at the moment of the call.** The token counts are on the response and nowhere else afterwards. |
| AP-14-c | **Leaving the human minute out.** In this domain a review usually costs more than several extractions, and a cost report without it drives every later decision the wrong way. |
| AP-14-d | **Adopting an observability platform before there is anything to observe.** Check what it costs to *run*: some are several services and want more memory than this whole application. |

---

## Step 15 — Making it cost less

**ACC-15** — cost per completed document falls against the step 14 baseline while field accuracy, critical-field accuracy and review rate stay inside the tolerance band on the held-out split; every applied change has a recorded before-and-after.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **Optimising before measuring.** The stage you assume is expensive usually is not, and a day goes on 4% of the bill. |
| AP-15-b | **Downgrading the model first.** Not calling the model, caching, sending less and lowering effort are free or nearly free. The model swap costs quality and splits the cache. |
| AP-15-c | **A cascade with no break-even arithmetic.** Escalation pays for both calls. Above some escalation rate the cascade costs more than always using the stronger model — compute that rate first. |
| AP-15-d | **Cost per request instead of per completed document.** A change that saves a fraction of a cent and raises the review rate is a loss that looks like a win on the API bill. |
| AP-15-e | **Two changes in one experiment.** They cancel out, the run shows no effect, and you have spent money learning nothing. |

---

## Step 16 — Deploy and hand over

**ACC-16** — the same document ingested twice results in one row reaching the client-facing table; a deploy applies migrations before serving and a rollback leaves no job unclaimable; a restore from backup passes the step 11 accuracy suite unchanged.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **A backup that has never been restored.** It is a belief, not a backup, and this system holds the client's documents. |
| AP-16-b | **Idempotency checked at upload rather than at the write.** A retry, a re-queue or a re-run then produces a second row in the client's accounts. |
| AP-16-c | **A system only its author can operate.** No export, no re-runnable ingestion, no runbook. Worth less to the client and, when they move on, worth nothing to you. |

---

## Step 17 — Drift and the monthly report

**ACC-17** — replaying the changed-layout invoices raises a drift signal for that sender and not the others; three identical corrections on one sender's field raise a signal before the accuracy proxy moves; a fourth sender added through configuration alone extracts correctly.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Watching the aggregate only.** One supplier out of forty changing layout does not move the overall number enough to see, which is precisely why the client sees it first. |
| AP-17-b | **A new sender requiring code.** It caps how many clients you can carry and turns every onboarding into a release. |
| AP-17-c | **Ignoring correction patterns.** The same field corrected repeatedly on one sender is drift days before any metric moves, and you already store it. |
| AP-17-d | **A monthly report full of numbers the client did not ask for.** Documents processed, accuracy, review rate, hours saved, cost. Anything else is you talking to yourself. |
