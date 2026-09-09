---
title: Extraction
description: Steps 7–10. The two reading paths, structured extraction with a schema, line-item tables, and validation with real confidence.
sidebar:
  order: 4
---

## Step 7 — Classification and the two reading paths

**Story:** *As Meridian Print Co, my clean supplier invoices are read without a model call at all, and Coastline's warehouse photographs go down the path that can actually read them.*

**Mode:** `LEARN` — the routing decision here sets the cost floor for the whole system, and getting it wrong is invisible until step 14.

**Why now:** Before extraction, because *what you read with* changes what extraction receives. Also before cost, because this is where most of the money is either spent or saved.

**Concepts:**
- **Classify first.** Which client, which document type. The pack contains a document filed under the wrong client on purpose. Extracting it against the wrong schema produces confident nonsense, and no downstream check will catch it.
- **Detecting a text layer**, and the trap: a scanned PDF can contain a *small amount* of real text — a header, a page number — so "has any text" is the wrong test. Measure text density per page, and decide per page rather than per document.
- **The text-layer path.** `pypdfium2` for extraction, `pdfplumber` where layout and table structure matter. Exact, free, and the correct answer for Meridian.
- **The vision path.** Claude accepts a PDF directly as a document content block — base64, up to 32 MB and 600 pages on a large-context model — so for a digital PDF there is no rasterising step at all. For a phone photograph you send the image. Either way the model reads layout as well as characters, which is what a warehouse photo needs.
- **Where OCR still fits.** Tesseract is free and local. On clean high-volume scans it can be the cheapest correct answer; on Coastline's photographs it produces text that looks like text and means nothing. Measure both on the same twenty documents rather than believing either claim, including this one.
- **The Files API for repeated reads.** A document you will extract more than once — and every document in this material is extracted more than once, because step 15 compares models — is uploaded once and referenced by id rather than re-sent.
- **The empty extraction is the dangerous failure.** A scanned page with no text layer, read down the text path, produces an empty string, a successful job, and a document that quietly says nothing. There is no exception anywhere. This needs an explicit test and an explicit outcome.
- **Rotation, skew and multi-page.** What to normalise before reading and what to leave alone. The upside-down photograph is the case that decides your answer.

**Libraries:** `pypdfium2`, `pdfplumber`, `pytesseract` (for the comparison), the `anthropic` SDK

**Expected outcome:** A classifier assigning client and document type, with a low-confidence outcome rather than a guess. A per-page reading-path decision with a measured density threshold. Both paths implemented. A written comparison, `docs/reading-paths.md`, of text layer, Tesseract and vision over the same twenty documents: accuracy, cost and latency for each, with the numbers you measured. An explicit `empty_extraction` outcome that fails loudly.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — every Meridian invoice takes the text path and issues zero model calls; every Coastline photograph takes the vision path; the no-text-layer scan produces an `empty_extraction` outcome rather than a successful empty result; the misfiled document is classified as low-confidence rather than extracted against the wrong schema. |
| **L2 — Manual checks** | (a) Read the Tesseract output for three Coastline photographs next to the vision output for the same three. This is the comparison the whole industry argued about for two years; make your own judgement from your own documents. <br>(b) Take the scanned page with a page number and nothing else. Check that your density threshold sends it down the vision path. If "has text" was your test, it did not. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and you can state the cost difference between the two paths per document |

---

## Step 8 — Structured extraction

**Story:** *As Meridian Print Co, an invoice comes back as a validated object with an invoice number, a date, a supplier and a total — never as prose I have to parse.*

**Mode:** `BUILD` — the schema is the contract and the SDK enforces it. This is the step that feels like the whole project and is about a tenth of it.

**Why now:** After reading, because it consumes what reading produced. Before line items, because a repeating table is harder and the flat case has to work first.

**Concepts:**
- **The schema is the contract.** A Pydantic model per document type, enforced through the SDK's structured outputs so the response either validates or fails. Parsing JSON out of a text response is the thing this replaces, and the failure mode it removes — a model that returns valid-looking JSON with a renamed field — is one you will otherwise meet in production.
- **Field descriptions are prompt.** The description on each schema field is what tells the model what `total` means when the document says *Amount Due*, *Balance*, and *Total inc VAT* in three places. This is where most extraction quality lives, and it is the cheapest thing to iterate on.
- **Citations as provenance.** With citations enabled on the document block, the response carries the page each cited value came from. That is the pointer your reviewer needs at step 12, and you get it without a second call.
- **Nulls are answers.** A field that is genuinely absent must come back null, not invented. A model asked for a purchase order number on a document with no purchase order will supply one unless the schema and the prompt make absence legitimate.
- **Prompt caching on the stable prefix.** The instructions and the schema are identical for every document of a type; the document is not. Order the request so the stable part is cached and verify it with the cache-read token count rather than assuming.
- **Deterministic tests against a non-deterministic dependency.** Unit tests fake the model. The real model is called only in the accuracy suite from step 11. Tests that hit the API are slow, cost money, and fail for reasons unrelated to your change.
- **What "it worked" means at this step.** It means the shape is right on three documents. It does not mean the values are right, and you have no way to know that until step 11. Resist concluding otherwise; this is exactly where a demo stops and thinks it has finished.

**Libraries:** the `anthropic` SDK (structured outputs, document blocks, citations, prompt caching), Pydantic 2

**Expected outcome:** Extraction schemas for the three document types. A model call that returns a validated object with per-field page provenance, recorded as an `Extraction` with its model, prompt version, token counts, cost and latency. Prompt caching enabled and verified by cache-read tokens above zero. A faked model in unit tests. Extraction working end to end for Meridian and single-page Coastline notes.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — a response that does not match the schema fails the extraction rather than being stored; an absent field comes back null rather than invented; every stored field value carries a page number; the second extraction of the same document type records cache-read tokens above zero. |
| **L2 — Manual checks** | (a) Take one invoice where the total appears three times under different labels and check which one you got. Then fix the field description rather than the code. <br>(b) Remove the purchase order number from a document and re-extract. If a number comes back, your schema permits invention and step 10 cannot save you. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and a new document type is a new schema plus descriptions, not new code |

---

## Step 9 — Line items and tables

**Story:** *As Coastline Freight, my delivery note has fourteen line items and the system returns fourteen, including the ones either side of the page break.*

**Mode:** `LEARN` — this is the step where extraction quietly loses rows, and where an agent writes something that looks correct and drops row nine.

**Why now:** After flat extraction works, because a repeating structure is strictly harder. Before validation, because the reconciliation rules at step 10 only exist if there are rows to reconcile.

**Concepts:**
- **Repeating structures are the hard part of every real document.** Almost all extraction demos show named fields, because named fields nearly always work. Line items are where the money is and where the failures are.
- **The page break is the bug.** A table continuing onto page two, often with a repeated header row, is where rows silently disappear. Nothing errors. The total still looks plausible. This is the single most common real defect in this domain.
- **Repeated headers and continuation rows.** *Carried forward* subtotals, headers that reappear, and a final row that is a total rather than an item. Each of them becomes a fake line item if you do not name them.
- **Row count as its own signal.** If the document states a count — *14 items* — extract it as a field and compare. When it does not, the reconciliation at step 10 is your only check.
- **One call or several?** Whole document in one call, versus per-page calls stitched together. Per page loses cross-page rows; whole document costs more and risks truncation on a long document. Decide with the pack, record the decision, and state the page count at which it changes.
- **Alder's remittance is the general case.** Forty rows, each with an amount, a status and sometimes a reason code, where the "document total" is the payment and the rows explain it. Build for this shape and Coastline's fourteen rows are a special case of it, not the other way round.
- **Line-item confidence is per row.** Row nine can be uncertain while the other thirteen are fine. Sending the whole document to review because of one row is how a review queue becomes ignored.
- **Truncation is silent.** A long remittance can hit an output limit mid-table. The result is a valid object with fewer rows. Check for it explicitly rather than trusting the response to complain.

**Libraries:** the `anthropic` SDK — structured outputs with nested arrays, streaming for long outputs

**Expected outcome:** Line-item extraction for all three document types, storing each row with its own confidence and page. Explicit handling of repeated headers, carried-forward rows and total rows. A row-count check where the document states one. A truncation check. A written decision, in an ADR, on whole-document versus per-page extraction, with the measurement behind it and the page count at which the answer flips.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — the Coastline note whose table crosses a page break returns all fourteen rows, asserted individually rather than by count alone; a repeated header row does not become a line item; the forty-row Alder remittance returns forty rows; an artificially truncated response is detected and fails rather than storing a short table. |
| **L2 — Manual checks** | (a) Print the extracted rows next to the document and read them side by side. Every time you do this you will find something; the day you stop finding things is the day the measurement at step 11 takes over. <br>(b) Delete row nine from your assertion and confirm the test still passes. If it does, you are asserting a count, not the rows. Then put it back. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and a table crossing a page break is a case you have tested rather than one you hope about |

---

## Step 10 — Validation, confidence and what "unsure" means

**Story:** *As the finance manager, nothing reaches my accounting system unless the numbers on it agree with each other, and the things the system is unsure about arrive on my desk instead.*

**Mode:** `LEARN` — confidence is the concept most often got wrong in this whole domain, and getting it wrong makes every later number meaningless.

**Why now:** After extraction produces values, before the review queue that consumes the uncertainty. Step 11 measures accuracy, and without validation there is nothing to measure the confidence against.

**Concepts:**
- **Confidence is not what the model says.** Asking a model for a confidence score returns a fluent number that correlates weakly with being right. It feels like the answer and it is the most common mistake in the field.
- **Real confidence is earned by checks that can fail.** Four sources, in rough order of value:
  1. **Arithmetic.** Do the line items sum to the subtotal? Subtotal plus tax to the total? Do Alder's forty rows sum to the payment? This catches more real errors than anything else and costs nothing.
  2. **Referential.** Does this supplier exist? Is this a known purchase order? Is the currency one the client uses?
  3. **Plausibility.** Is the date within a sensible window? Is the total within the range this supplier normally invoices? Is the quantity a whole number of pallets?
  4. **Agreement.** Two reads — text layer and vision, or two models — agreeing on a value is strong evidence. Disagreeing is stronger evidence still, of the opposite.
- **The ambiguous date.** `03/04/2026` is March or April depending on the supplier's country. This is not a confidence problem, it is a knowledge problem: it is resolved by knowing the supplier, and where it cannot be resolved it must be flagged rather than picked.
- **Per-field, not per-document.** One uncertain field should not send a whole document to review, and one certain field should not rescue a document whose total does not reconcile.
- **Validation rules are the client's trade knowledge.** *This supplier never invoices over £5,000.* *Pallet counts are whole numbers.* *A rejection code must have a reason.* This is the part no product ships with, and it is a large share of why the client is paying you rather than a vendor.
- **Rules as data.** Per client, per schema, in rows. The moment a rule is an `if` naming a client, adding the fourth client is a release.
- **Failing closed.** When validation cannot run — the supplier list is unavailable, the arithmetic is impossible because a field is missing — the outcome is review, never accept.

**Libraries:** Pydantic 2 validators, plus a small rules table of your own

**Expected outcome:** A validation layer running arithmetic, referential and plausibility checks per client, driven by rules stored as data. A confidence score per field and per line item derived only from checks that can fail. A documented agreement check on at least one field, with the cost of the second read measured. An explicit `unresolvable` state for the ambiguous date. Nothing may be written to a client-facing table without passing validation.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — an invoice whose line items do not sum to its total is never accepted, whatever any confidence score says; a missing supplier produces review rather than acceptance; an ambiguous date is flagged rather than resolved; no code path writes an unvalidated value to a client-facing table. |
| **L2 — Manual checks** | (a) Take twenty documents, sort by confidence, and read the ten lowest. If they are not obviously the harder ones, your confidence is measuring nothing. This check is the whole step. <br>(b) Break one validation rule deliberately and confirm the affected documents move to review rather than silently scoring lower. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and confidence sorts your documents in the order a human would |

**Harness impact:** `AGENTS.md` v3 — record that confidence never comes from the model, that validation rules are data, and that validation failure means review rather than a lower score.
