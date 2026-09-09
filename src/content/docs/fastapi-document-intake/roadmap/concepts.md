---
title: Concepts
description: Steps 0–3. What re-keying costs a business, how a document pipeline actually works, what you could buy instead, and how to scope the job with a client.
sidebar:
  order: 2
---

Four steps, no code. They come first because a developer who can build this and cannot say what
it replaces, what it costs, or when it is the wrong answer has half a skill — and it is the
half that gets paid.

Each one produces a written document. Keep them; three of the four are things you will hand to
a client.

---

## Step 0 — What re-keying costs, and who pays it

**Story:** *As someone about to build this, I can state in hours and money what the manual process costs one real business, so I am solving a problem rather than demonstrating a technique.*

**Mode:** `LEARN` — there is nothing to build. Writing code here would be a way of avoiding the step.

**Why now:** First, because every later decision depends on it. What accuracy is good enough, whether a human reviews everything or nothing, how much a document may cost to process — all of those are answered by the arithmetic in this step and by nothing else.

**Concepts:**
- **Re-keying**: a person reading data off a document and typing it into a system that could have received it directly. The data already exists in digital form somewhere upstream; the format is what makes a human necessary.
- Where it happens in a small business: accounts payable, goods-in, claims reconciliation, payroll timesheets, expense claims, customs paperwork
- **The arithmetic.** Documents per month × minutes per document × loaded hourly cost. Loaded means salary plus employer costs, not the wage. Do this for all three example clients.
- **The error rate nobody measures.** Manual data entry produces errors at a rate that is small per field and large per document — and the cost of one wrong invoice total is not the cost of one field.
- **The second cost: latency.** A delivery note typed on Thursday for goods received on Monday means three days where stock levels are wrong. Ask what decisions are being made on stale data.
- **The third cost: the person.** This is the least interesting job in the building. Turnover in data-entry roles is high, and every departure costs recruitment and training.
- **Why it survives.** It is nobody's project. It is spread across roles, it never breaks loudly, and the person who could fix it is not the person doing it.
- **Who signs the cheque.** Usually a finance or operations manager, not IT. That changes how you present this entirely: hours saved, not architecture.

**Libraries:** none. A spreadsheet.

**Expected outcome:** A one-page written cost model, `docs/business-case.md`, covering all three example clients. Per client: documents per month, minutes each, loaded hourly cost, annual total, and one sentence on what else goes wrong because the data is late. Then the same model with your own assumptions for a real business you know — a family member's company, a former employer, anywhere you can get a real number rather than a guessed one.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — the cost model produces an annual figure for each of the three clients, and every input is either sourced or explicitly marked as an assumption. No unmarked guesses. |
| **L2 — Manual checks** | (a) Say the Meridian number out loud as a sentence a client would hear: *"This costs you about £X a year."* If it sounds small, the project is real but small, and knowing that now is worth more than finding out after you build it. <br>(b) Find one person who has done data entry and ask them what actually goes wrong. It will not be what you assumed. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, and you can state the annual cost of the manual process for each client without looking it up |

> **Where people skip.** This step has no repo, no test suite, and nothing to show a friend. It is also the only step that tells you whether anything after it is worth building. Do it properly and the rest of the roadmap has a purpose; skip it and you are writing an extraction script.

---

## Step 1 — How a document pipeline actually works

**Story:** *As a developer, I can name every stage a document passes through and describe how each one fails, so that when the output is wrong I know where to look.*

**Mode:** `LEARN` — the whole point is the mental model. Code arrives at step 4.

**Why now:** Before any tooling decision. The pipeline stages determine the schema at step 6, and a schema designed without them has to be migrated at step 9.

**Concepts:**
- **The five stages**, in order, and what each one owns:

  ```text
  classify  →  read  →  extract  →  validate  →  route
  ```

  - **Classify** — what is this document, and whose is it? An invoice and a remittance need different extraction. This is first because everything after it is conditional on the answer.
  - **Read** — get the content. Two entirely different paths, below.
  - **Extract** — turn content into named fields and repeating rows.
  - **Validate** — do the numbers agree with each other and with the outside world?
  - **Route** — accepted, to review, or rejected.
- **The two reading paths, and why the split matters more than anything else in this material:**

  | Path | When | Cost | Failure shape |
  |---|---|---|---|
  | Text layer | The PDF was generated by software and carries its own text | Effectively zero | Rare, and loud when it happens |
  | Vision | A scan or a photograph, no text layer | A model call per page | Plausible and quiet — a misread digit looks like a correct one |

  A pipeline that sends every document down the second path works and wastes money. One that
  assumes the first path silently produces empty extractions for every photograph.
- **OCR, and why it is now the third choice.** Optical character recognition converts pixels to characters with no understanding of layout or meaning. It was the only option for twenty years. A vision-capable model reads a skewed warehouse photo better and returns structured fields directly. Tesseract still wins on cost for clean high-volume scans, which is why step 7 measures both instead of assuming.
- **Why template-based extraction died.** The previous generation of this software worked by drawing boxes on a sample invoice: *the total is always here*. A new supplier meant a new template; a layout change broke it silently. Onboarding took weeks per supplier. Model-based extraction has no templates, which is the entire reason this is worth building in 2026 and was not in 2019.
- **Confidence is not the model's opinion.** Asking a model how confident it is produces a number that is fluent and uninformative. Real confidence comes from validation that can fail: does the arithmetic reconcile, does the supplier exist, is the date plausible, do two reads agree.
- **Why the human review queue is the product.** A system that is right 94% of the time and knows which 6% it is unsure about is useful. A system that is right 97% of the time and cannot tell you which 3% is dangerous, because someone has to check all of it.
- **Straight-through processing rate** — the share of documents needing no human touch. This is the number the commercial vendors advertise and the number your client will ask for.

**Libraries:** none yet. Open three PDFs and look at them.

**Expected outcome:** A written pipeline description, `docs/pipeline.md`: the five stages, what each owns, and for each stage one concrete failure you expect from the shipped document pack. Plus a decision table for the two reading paths — given a document, what decides the path, and what happens when that decision is wrong in each direction.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — the document names all five stages, and for each one states a failure that produces a *wrong answer with no error*. Loud failures do not count; the quiet ones are the subject. |
| **L2 — Manual checks** | (a) Open three documents from the pack in a PDF reader and try to select the text. Note which ones let you. That gesture is the entire reading-path decision. <br>(b) Take the Coastline delivery note whose table crosses a page break. Write down, before building anything, how you would know if row nine went missing. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain the two reading paths to a non-technical person in under a minute |

---

## Step 2 — What you could buy instead

**Story:** *As someone quoting for this work, I can answer "why not just buy an off-the-shelf product?" with specifics, and sometimes my answer is "you should".*

**Mode:** `LEARN` — research and judgement.

**Why now:** Before you build, while the answer can still change what you do. This question is asked in the second client meeting, every time.

**Concepts:**
- **The market has three layers**, and they are not competing with each other:

  | Layer | What it is | Typical shape |
  |---|---|---|
  | Document AI APIs | Extraction as a service — send a document, get fields | Per-page pricing, you build everything around it |
  | Vertical IDP products | A whole workflow for invoices or claims, with a review UI | Per-document or seat pricing, opinionated, fast to start |
  | RPA and automation suites | Broad platforms where document handling is one module | Enterprise licensing, long sales cycle, heavy |
- **What you are actually competing with.** Not the technology — the products above extract well. You are competing on the parts they cannot do: connecting to *this* client's twelve-year-old accounting system, the validation rules that are specific to their trade, the review workflow their staff will actually use, and the fact that a small business cannot get a person on the phone from a vendor.
- **When buying is the right advice**, and saying so is worth more than the project: high volume of a standard document type, no unusual validation, an integration the vendor already supports, and a budget that covers per-document pricing. Tell them. You will be the person they call for the thing the product cannot do.
- **When building wins**: an odd document type, validation rules that encode the client's trade knowledge, a target system with no API, data that may not leave the country or the building, or a volume too low to clear a vendor's minimum.
- **The hybrid answer**, which is often correct: buy the extraction, build the validation, the review queue and the integration. Know what that costs before recommending it.
- **How to price research honestly.** Vendor pricing pages are frequently "contact us". Note what you could confirm, what you could not, and the date you checked. A number without a date is worthless within a year in this market.
- **Total cost of ownership.** A per-document price looks cheap until you add the integration work, the review time that does not disappear, and the annual increase. Compare like with like: the vendor's price plus your integration versus your build plus your maintenance.

**Libraries:** none. Vendor sites, pricing pages, and an hour.

**Expected outcome:** A written comparison, `docs/build-vs-buy.md`. At least five named commercial options across the three layers, what each does, what you could establish about pricing and what you could not, and the date checked. Then a recommendation per example client — buy, build, or hybrid — each with the one reason that decides it. At least one of your three recommendations should be "buy". If all three are "build", re-read your own analysis; you are arguing for the outcome you already wanted.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — the comparison names at least five real products with sources and check dates, and gives a per-client recommendation whose deciding reason is stated in one sentence. |
| **L2 — Manual checks** | (a) Take the client where you recommended "build" most confidently and argue the opposite case for ten minutes. If it collapses immediately, you have not understood the products. <br>(b) Work out what a vendor at a plausible per-document price would charge Coastline per year, and compare it to your step 0 figure for their manual cost. If the vendor is cheaper than the problem, there is no project — and that is a finding, not a failure. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and you can answer "why not just buy it?" in three sentences for each client |

---

## Step 3 — Scoping the job with a client

**Story:** *As a freelancer, I can run a first meeting that produces a scope I can price, and I know which requests to refuse.*

**Mode:** `LEARN` — the deliverable is a document you would actually send.

**Why now:** Last of the concept steps, because it uses all three before it. This is also the last moment before tooling; from step 4 you are building, and the scope should be settled first.

**Concepts:**
- **The discovery questions that change the price**, and why each one does:
  - How many documents a month, and what is the peak? Volume decides architecture and pricing model.
  - How many distinct senders or layouts? One supplier is a weekend; forty is a project.
  - What does the data go into, and does that system have an API? This is usually the largest unknown and the largest risk.
  - What happens today when a document is wrong? Their existing correction process is the review queue you have to fit into.
  - Who checks the output, and how much of their time can it have? This sets your accuracy target from the other end.
  - Where must the documents live, and for how long? Retention and residency are cheap to design in and expensive to retrofit.
- **Ask for fifty real documents before quoting.** Not three, and not the clean ones. Fifty tells you the layout count, the photograph quality, and whether the hard case you were told about is the hard case that exists. A client who will not share documents will not sign off an accuracy number either.
- **Accuracy targets are negotiated, not promised.** "99% accurate" means nothing without: accurate at what — field, document, or the fields that matter — and measured on what set. Define the number with them, in writing, against a specific document sample.
- **The review rate is the real commercial term.** A client cares how many documents a human still touches. Quote a target review rate and how it is measured, and make it a shared number rather than a promise you carry alone.
- **What to refuse.** Legal or medical judgement dressed as extraction. Anything where a wrong number causes irreversible harm with no human in the path. "Just make it 100%." Fixed-price work on documents you have not seen.
- **Pricing shapes**: build fee plus monthly, per-document with a floor, or a retainer that includes new senders. Each fails differently — say how before choosing.
- **The pilot as the answer to every unknown.** A paid pilot on fifty documents with an agreed accuracy measurement de-risks both sides and is easier to sell than the full build.

**Libraries:** none.

**Expected outcome:** A scoping pack you would genuinely send: a one-page questionnaire, a pilot proposal for **Coastline Freight** with a defined accuracy measurement and an explicit list of what is out of scope, and a short internal note on what you would refuse and why. Coastline specifically, because it is the one with the awkward documents — scoping Meridian is too easy to be practice.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — the pilot proposal states the document sample, the accuracy definition and how it is measured, the target review rate, what is out of scope, and what happens if the measured accuracy misses the target. All five present, none of them vague. |
| **L2 — Manual checks** | (a) Give the proposal to somebody non-technical and ask what they are buying. If they cannot tell you, rewrite it. <br>(b) Read your out-of-scope list and check that at least one item is something a client would plausibly want. A list of things nobody asked for is not a scope boundary. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and the pilot proposal contains no number you could not defend in a meeting |

**Harness impact:** none yet — `AGENTS.md` arrives at step 4. Keep the four documents from these steps in `docs/`; step 4's harness will point the agent at them, and an agent that knows the business case makes noticeably better suggestions than one that does not.
