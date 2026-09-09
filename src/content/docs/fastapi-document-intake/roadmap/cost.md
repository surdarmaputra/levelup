---
title: Cost
description: Steps 14–15. Where the money goes and how to see it, then making it cost less without losing accuracy — with the gold set deciding whether each trade was acceptable.
sidebar:
  order: 6
---

Two steps. The first one only measures; it changes nothing. The second one changes things, and
every change is judged by the gate from step 11.

The order is not negotiable. Optimising before measuring means spending a day on the stage that
turned out to be 4% of the bill, and this domain has a specific trap: **the most expensive part
of processing a document is usually not the model call.** You will not believe that until you
have your own numbers, which is what step 14 is for.

---

## Step 14 — Where the money goes, and how to see it

**Story:** *As the person selling this, I can show a client what one document costs to process, broken down, and I know it the day it changes rather than at the end of the month.*

**Mode:** `LEARN` — this step deliberately changes no behaviour. Its whole output is visibility.

**Why now:** After the system works and is measured. Optimising anything before this is guessing, and you now have an accuracy number to protect while you do it.

**Concepts:**

**The four places spend is visible, and what each is for.**

| Where | What it gives you | What it cannot do |
|---|---|---|
| The provider console | The bill. Daily and monthly totals, per API key, per model. The truth about what you owe. | Attribute anything. It cannot tell you that Coastline costs six times Meridian. |
| The `usage` on every response | Per call: input tokens, output tokens, cache-creation and cache-read tokens. The raw material for everything else. | Persist. If you do not store it at the moment of the call, it is gone. |
| The token counting endpoint | An estimate *before* you spend, for a request you are about to send. Useful for a budget check and for sizing a batch. | Tell you output tokens, which you cannot know in advance. |
| **Your own ledger** | Cost per document, per client, per stage, per model, per prompt version. The only place the question a client asks can be answered. | Exist unless you build it. This step builds it. |

The console is where you notice a problem. The ledger is where you find it. Teams that have only
the console discover a cost spike a week late and cannot say which change caused it.

**Attribution is the whole point.** An aggregate monthly figure tells you the bill and nothing
about what to do next. Store, per extraction: client, document, stage, model, prompt version,
input tokens, output tokens, cache-read tokens, cost, latency, outcome. Step 6 already made
extractions attempts rather than results precisely so this is possible. Now aggregate it:

- **Cost per document, per client.** Coastline's multi-page photographs cost several times what
  Meridian's single-page text extraction does. If your figure says otherwise, the routing from
  step 7 is not doing what you think.
- **Cost per stage.** Classification, reading, extraction, the second read used for agreement.
  Most people are surprised by which one dominates.
- **Cost per *completed* document**, which is the only number with commercial meaning. It
  includes re-runs after a failure, and it includes the human minutes when the document went to
  review. A cheaper extraction that pushes documents into the review queue is not cheaper.

**Put the human minute in the same currency.** This is the number that changes your decisions in
this domain. Take the reviewer's loaded hourly cost from step 0 and the seconds-per-document you
measured at step 12, and price one review. Compare it with what a model call costs. On almost
every configuration of this system, **one review costs more than several extractions** — which
means any change that saves a fraction of a cent per document while raising the review rate is a
loss, and it will look like a win on the API bill.

**Infrastructure is part of the bill, and here it usually dominates.** A small VPS, object
storage and a database cost more per month than the inference does at these volumes. Put both in
the same report. It is what stops you spending a week shaving prompt tokens to save a few
dollars while running a service you do not need.

**Third-party tooling — when it is worth it and when it is not.** Several platforms do
per-request cost tracking, tracing and dashboards. They are genuinely good and most of them are
not worth adopting at this size:

| Option | What it is | When to adopt |
|---|---|---|
| Open-source observability platforms (for example Langfuse) | Tracing, evaluation and cost dashboards. Free to self-host under a permissive licence, with hosted tiers. | When you need traces across many services and several people need the dashboard. Check the *self-hosted* resource requirements before committing — some run several services and want more memory than this whole application. |
| Proxy or gateway products | Sit between you and the provider, giving per-request cost, caching and rate limits with a one-line change | When you have several applications and want one place to see them. Note the extra hop, and check whether the product is still actively developed — this category consolidates fast. |
| Metering and billing tools | Turn usage events into billable meters, invoices and quotas | When you bill your own customers by usage. That is a business model decision, not an observability one. |

The honest default at this stage is a table in the PostgreSQL you already run, with the ledger
above. It costs nothing, it is queryable in the language you already use, and it answers the
question a client asks. Write down the trigger that would make you change your mind — a second
application, a second person needing the dashboard, or a volume where the queries get slow.

**Alerts before invoices.** A spending limit on the account, and a check of your own that fires
when today's cost per document moves outside its normal band. A supplier switching to
photographs, or a prompt change that doubles the input, both show up here days before the
monthly bill does.

**Libraries:** none new — the `usage` fields from step 8 are already recorded, plus the token
counting endpoint for estimation

**Expected outcome:** A cost ledger aggregating every extraction attempt by client, stage, model and prompt version. A cost report — `docs/cost-report.md` — giving cost per document per client, cost per stage, cost per completed document including re-runs and review minutes, monthly infrastructure alongside monthly inference, and the price of one human review in the same units. A spending limit set on the account and an alert on cost-per-document drift. A written decision on third-party tooling with the trigger that would change it. **No behaviour changes in this step.**

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — the ledger attributes every model call in a full run of the document pack to a client, a stage and a prompt version, and the sum of attributed costs matches the run's total; a document that was extracted twice appears once as a completed document with both attempts counted. |
| **L2 — Manual checks** | (a) Work out what one review costs and what one extraction costs, and write both on the same line of the report. Whichever surprises you is the number to remember. <br>(b) Take your monthly infrastructure figure and your monthly inference figure and put them side by side. If infrastructure is larger, note it — you are about to spend step 15 optimising the smaller one, and the report should say you knew that. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and you can answer "what does one document cost?" per client, with the arithmetic |

---

## Step 15 — Making it cost less without losing accuracy

**Story:** *As the person selling this, I cut the cost per document and can prove with the gold set that accuracy and the review rate did not move.*

**Mode:** `LEARN` — every lever here trades something. The gate from step 11 is what tells you whether the trade was acceptable, and this is the step where it earns its keep.

**Why now:** After measurement, and after the accuracy gate exists. Not one step earlier. Every change in this step risks making the system worse, and until step 11 you had no way to find out.

**Concepts:**

**Pull the levers in this order. Free wins before anything that trades quality.**

1. **Do not call the model at all.** The largest lever in this material and it is already built: step 7's text-layer path costs nothing. Check what share of documents actually take it. A misconfigured density threshold sending Meridian down the vision path is a several-fold cost increase that no prompt tuning will recover.
2. **Prompt caching on the stable prefix.** The instructions and schema are identical across every document of a type. Verify with cache-read tokens rather than assuming — a version string or a timestamp in the prefix silently invalidates it on every call, and the feature appears to do nothing.
3. **Send less.** A 40-page remittance where the data is on pages one and two. A photograph at full camera resolution when a smaller one reads identically. Input hygiene is free and usually the second-biggest saving.
4. **Cap the output.** A schema that permits an unbounded notes field will get one.
5. **Batch what is not urgent.** The Batch API processes asynchronously at half the price. Overnight document runs are the perfect fit: nobody is waiting, and the saving is 50% with no quality trade at all. Interactive re-extraction from the review queue stays synchronous.
6. **Upload once.** The Files API means a document extracted twice — and step 15 extracts everything twice, to compare — is uploaded once.
7. **Lower the effort before changing the model.** Effort tunes how much the model spends thinking. Dropping it on a capable model frequently beats switching to a smaller one, and it keeps one cache namespace instead of splitting into two.
8. **Then, and only then, the model.** A cheaper model on the documents that do not need a stronger one. Measure; do not assume in either direction.

**The cascade, done honestly.** Extract with a cheaper model first; escalate to the stronger one when validation fails or confidence is low. It is the right shape and it has a trap: escalation means paying for both calls. If 40% of documents escalate, the cascade costs more than always using the stronger model. Compute the break-even escalation rate before building it, then measure the real one.

**Cost per completed document, always.** A cheaper extraction that raises the review rate by three points may cost more in reviewer minutes than it saves in tokens. You priced the human minute in step 14 for exactly this decision. This is the single most useful idea in this section, and it is the one most often missed.

**Every change goes through the gate.** One change per experiment, gold set run before and after, result recorded. Two changes at once cancel out and you have spent a run learning nothing.

**When the answer is "spend more".** If accuracy on Alder's rejection codes is the difference between the client using this and not, a more expensive model on that document type is correct. Cost optimisation is not a one-way ratchet, and the report should say where you deliberately spent more.

**Then price it.** Cost per document × expected monthly volume, plus infrastructure, plus your maintenance time. Set against the step 0 manual cost. That comparison is the last page of the accuracy report and the first page of a proposal.

**Libraries:** the `anthropic` SDK — the Batch API, the Files API, prompt caching, effort settings, token counting

**Expected outcome:** At least four cost changes applied, each as its own experiment with the gold-set score before and after. Batch processing for the non-urgent path with the saving measured. Prompt caching verified by cache-read tokens. A cascade either built with its break-even arithmetic and measured escalation rate, or explicitly rejected with the arithmetic that rejected it. A tuning log — every experiment, what changed, cost before and after, accuracy before and after, kept or reverted. `docs/cost-report.md` finished with a cost per document per client, a monthly total at a stated volume, and the comparison against step 0.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — cost per completed document falls against the step 14 baseline while field accuracy, critical-field accuracy and review rate all stay inside the tolerance band on the held-out split; every applied change has a recorded before-and-after in the tuning log. |
| **L2 — Manual checks** | (a) For each change, name the quality it could have cost and point at the number that says it did not. A change you cannot do this for gets reverted, however good it looks. <br>(b) Work out what Coastline at their real monthly volume costs you and what you would charge. If the gap is not comfortable, the design needs changing, not the price. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d`, `AP-15-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and you can quote a monthly price for each client with the arithmetic behind it |

> **The trap this step exists to prevent.** It is entirely possible to halve the API bill, raise the review rate by four points, and report a success. The client pays a person for those extra reviews. Cost per completed document is the only number that catches it, which is why step 14 built it before this step was allowed to start.
