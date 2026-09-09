---
title: Accuracy
description: Steps 11–13. The gold set and the number that makes this a portfolio piece, the human review queue, and the thresholds that decide what a person sees.
sidebar:
  order: 5
---

These three steps are what a client is actually buying. Everything before them is a pipeline you
hope works.

---

## Step 11 — The gold set and the accuracy number

**Story:** *As the person selling this, I can state field-level accuracy across three hundred real documents, and anyone can check my working.*

**Mode:** `LEARN` — a gold set built carelessly measures nothing, and every number after this one inherits the mistake.

**Why now:** After extraction and validation exist, so there is something to measure. Before the review queue, because the threshold that decides what a human sees is chosen from this number rather than guessed. Before cost, because every cost decision is a trade against this number.

**Concepts:**
- **Open the gold labels now, and not before.** The pack's labels have been sealed since step 5 for the same reason a test set is held out: a number produced against data you have been iterating on is a memory test.
- **What "accuracy" means, precisely.** Three different numbers that get called the same word:
  - **Field-level accuracy** — of all extracted fields, how many exactly match the label. The honest headline.
  - **Document-level accuracy** — how many documents got *every* field right. Always much lower, and the number a client intuitively means.
  - **Critical-field accuracy** — how many got the fields that matter right. The total and the invoice number matter; a supplier's address line two does not.
  Report all three. Reporting only the flattering one is the most common dishonesty in this market.
- **Exact match is not always right.** `£1,234.50` and `1234.5` are the same amount. `ACME Ltd.` and `ACME Limited` are the same supplier. Normalisation rules are part of the scoring and they must be written down, because a generous normaliser is how a bad extractor scores well.
- **Line items need their own metric.** Row recall — did we get all fourteen — is a different failure from row accuracy — were the fourteen correct. A system that returns thirteen perfect rows is worse than it looks.
- **The review rate is a metric, not a side effect.** What share of documents the system sends to a human. This is the number that decides whether the project saves money, and it moves in the opposite direction to accuracy every time you touch a threshold.
- **Never label with the model you are grading.** A gold set produced by the same model measures agreement with itself. Where the pack's labels are used, they were hand-checked; where you add your own documents, you label them by hand or you do not have a gold set.
- **The held-out split.** Tune on one part, report on another. Without it, the number measures how much you have tuned rather than how well it works.
- **A regression gate in CI.** From this step, a change that lowers the score does not merge. This is the guardrail the rest of the roadmap leans on — steps 14 and 15 exist to trade cost against quality, and without the gate you cannot tell what the trade cost.

**Libraries:** pytest, and a scoring module you write yourself

**Expected outcome:** The gold set loaded. A scorer producing field-level, document-level and critical-field accuracy, plus row recall, row accuracy and review rate, broken down per client. Written normalisation rules. A held-out split. A CI gate that fails a pull request lowering accuracy or raising the review rate outside a tolerance band. And `docs/accuracy-report.md` — the first real version of the document that is the portfolio artefact.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — the scorer reports all three accuracy figures separately, and a deliberately broken extraction — a field always returning null — moves field accuracy without moving row recall; two runs over the frozen set produce the same score for the deterministic paths. |
| **L2 — Manual checks** | (a) Read the twenty worst-scoring documents. Sort the causes into extraction faults, label faults and normalisation faults. There will be label faults; find them, fix them, and record the fix. <br>(b) Say your headline number as a sentence to a non-technical person and let them ask one question. It will be "so how many does someone still have to check?" — which is the review rate, which is why it is a metric here. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, the gate blocks a worse change, and you have a number you would put in a proposal |

> **This is the step.** From here you can answer the only question that matters — *how well does it work?* — with arithmetic instead of a demo. Everything after it is an improvement you can prove.

---

## Step 12 — The review queue

**Story:** *As Coastline's warehouse supervisor, the six documents the system was unsure about are on one screen, with the page and the value highlighted, and correcting one takes fifteen seconds.*

**Mode:** `BUILD` — forms and tables. Deliberately small.

**Why now:** After there is uncertainty worth reviewing and a number that says how much. Before thresholds, because you cannot choose a threshold until you know what reviewing one document actually costs in seconds.

**Concepts:**
- **The review queue is the product.** The extraction is the interesting part and the queue is the part that decides whether anyone uses this. A client evaluates the queue, not the pipeline.
- **Fifteen seconds per document is the design target.** Everything follows: the original page beside the field, the uncertain value focused, keyboard-first, no navigation between screens. If a reviewer has to hunt for the number in a 40-page document, they will stop and the system fails quietly.
- **Show the provenance.** The page from step 8, rendered, with the value's location marked. This is why provenance was collected then rather than added now.
- **Only show what is uncertain.** A queue that presents every field of every document is a re-typing job with extra steps.
- **Corrections are training data and evidence.** Every correction is stored with who, when, the old value and the new. It is how step 17 detects drift, and how you prove to a client what changed.
- **Corrections do not silently become gold.** A reviewer is right most of the time, not always. Corrections feed a candidate queue for the gold set, not the gold set itself.
- **Why htmx and Jinja2.** Server-rendered forms with partial updates. A single-page application here adds a build pipeline, a state layer and a second deployment target to render a table of six rows. The constraint is the lesson: build the smallest thing that makes the product usable.
- **Bulk actions, carefully.** *Accept all from this supplier* saves real time and is also how forty wrong rows get approved at once. Scope it and record it.
- **Who may see what.** Alder's documents contain patient data. The queue is where an access rule stops being theoretical.

**Libraries:** Jinja2, htmx, and the PDF page renderer from step 7

**Expected outcome:** A review queue listing documents needing attention, ordered by something defensible. A review screen showing the rendered page beside the uncertain fields, keyboard navigable, with accept, correct and reject. Corrections stored with full attribution. Line-item review that does not force a reviewer through fourteen correct rows to reach row nine. An access rule keeping Alder's documents to permitted users. A measured figure: seconds per document, timed by you on twenty real ones.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — a corrected field is stored with old value, new value, user and timestamp, and never overwrites the original extraction; a user without access to Alder cannot open an Alder document by guessing its URL; a document with one uncertain line item presents that row, not all forty. |
| **L2 — Manual checks** | (a) Time yourself reviewing twenty documents. Write the number in the accuracy report. If it is over thirty seconds each, the saving in your step 0 model is smaller than you think and the screen needs work, not the model. <br>(b) Have someone who has never seen the project review five documents with no explanation. Watch where they hesitate. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and you have a measured seconds-per-document figure |

---

## Step 13 — Thresholds, routing, and what "done" means

**Story:** *As the finance manager, I decide how much checking my team does, and the system's settings follow that decision instead of the other way round.*

**Mode:** `LEARN` — this is a business decision expressed in code, and the arithmetic behind it is the thing being learned.

**Why now:** Last of the accuracy steps, because it needs the accuracy number from step 11 and the review cost from step 12. With both, the threshold is a calculation. With neither, it is a guess someone will call a hyperparameter.

**Concepts:**
- **The threshold is an economic decision, not a technical one.** It trades error cost against review cost, and both are numbers you now have.
- **The arithmetic.** For a candidate threshold: how many documents go to review, how many seconds that costs, and how many wrong values escape. Sweep the threshold across your gold set and plot both curves. The intersection is a proposal; the client picks the point.
- **Not all errors cost the same.** A wrong total on a £12,000 invoice is not a wrong address line. Weight the error side by what the field is worth, and route on value as well as confidence — every invoice above a figure gets reviewed regardless of confidence.
- **Three outcomes, counted separately**: accepted, review, rejected. Rejected means the system could not produce a usable result at all — an unreadable photograph, a document type it does not handle — and it needs a different destination from "please check this".
- **Per client, and per field.** Alder's rejection codes need more certainty than Meridian's supplier address. Thresholds are rows.
- **Over-refusal is the failure nobody measures.** Every other metric improves by sending more documents to review. Without watching the review rate as a first-class number, the system optimises straight into being a slower version of the manual process. This is the same trap as over-refusal in an assistant, in a different costume.
- **What you promise a client.** Not "99% accurate". A stated review rate, a stated accuracy on the fields that matter, measured on a named sample, with a defined process for when it drifts. Step 3's proposal said this; now you have the numbers to fill it in.

**Libraries:** none new — this is arithmetic over what step 11 produces

**Expected outcome:** Confidence and value thresholds stored per client and per field, not hardcoded. A threshold sweep over the gold set with both curves plotted and the trade written down. Three distinct outcomes with distinct handling. A review-rate metric on the dashboard beside accuracy. `docs/accuracy-report.md` completed: accuracy three ways, row metrics, review rate, seconds per document, the threshold chosen and why, and the resulting monthly hours saved against the step 0 cost model.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — the same document produces different routing under two different client threshold rows with no code change; an invoice above the value threshold goes to review even at maximum confidence; a document that cannot be read is rejected rather than queued for review. |
| **L2 — Manual checks** | (a) Take your chosen threshold to the step 0 cost model and work out the actual saving. If reviewing at this threshold costs more than half the manual process, say so plainly in the report — a documented honest number is a better portfolio piece than a flattering one. <br>(b) Set the threshold to accept everything and read the accuracy report. That is what the client gets with no review, and it is the number they should see before choosing. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and you can defend the threshold with the two curves rather than an opinion |

**Harness impact:** `AGENTS.md` v4 — record that thresholds are per-client data, that the review rate is watched alongside accuracy, and that no change ships without a gold-set run.
