---
title: Cost
description: Steps 13–14. Where the spend actually is — usually not where you expect — and the levers, with the golden set deciding whether each trade was acceptable.
sidebar:
  order: 6
---

Two steps. The first only measures. The second changes things, judged by the golden set from
step 11.

This material's cost lesson is different from the others in the catalog, and you should find it
out from your own numbers rather than from this paragraph: **on a workflow automation at
small-business volumes, the server usually costs more than the inference.** A developer who
spends a week trimming prompts to save four dollars while running three services nobody needs
has optimised the wrong thing.

---

## Step 13 — Where the money goes, and showing it to the client

**Story:** *As Fern & Oak, I can see what this costs me per month and per enquiry, and my developer sees it before I do.*

**Mode:** `LEARN` — this step changes no behaviour.

**Why now:** After the golden set, so there is something to protect while optimising. Also after all three clients run, because their cost shapes differ and one client's numbers would mislead you.

**Concepts:**

**The four places spend is visible.**

| Where | What it gives you | What it cannot do |
|---|---|---|
| The provider console | The bill. Daily and monthly totals per key and model. | Attribute anything. It cannot say Ridgeway costs eight times Fern & Oak per item. |
| The `usage` on every response | Per call: input, output, cache-creation and cache-read tokens. | Persist. Not recorded at the moment of the call, it is gone. |
| The token counting endpoint | An estimate before you spend — useful for sizing a batch or checking a document before sending it. | Predict output tokens. |
| **Your own ledger** | Cost per run, per client, per step, per prompt version. The only place a client's question is answerable. | Exist unless you build it. Step 5's `ai_calls` table already holds the data; this step aggregates it. |

**And a fifth, which this material insists on: the infrastructure bill.** The VPS, the volumes,
the backups. Put it in the same report. It is usually the larger number here, and leaving it out
makes every subsequent decision wrong.

**The units that mean something:**

- **Cost per run, per client.** Ridgeway's contract extraction over a long document costs many times a Fern & Oak enquiry. If your numbers say otherwise, something is sending more than you think.
- **Cost per step.** Which AI step dominates. Usually the one processing the longest input, which is a fixable input-hygiene problem rather than a model problem.
- **Cost per *completed* run** — including replays, failed runs that spent money before failing, and the human minutes spent in the sign-off queue. Brightline's real cost is mostly the reviewer's time, and a report that omits it is describing the wrong system.
- **Cost per prompt version.** A prompt change that improved accuracy and doubled input tokens is a trade someone should have made deliberately.

**The human minute again.** From step 0 you know the loaded hourly cost; from step 9 you measured
seconds per sign-off. One review costs more than several model calls. Any change that reduces
tokens while sending more items to sign-off is a loss that looks like a win on the API bill.

**Third-party tooling, honestly.** Platforms exist for per-request cost, tracing and dashboards:

| Option | What it is | When to adopt |
|---|---|---|
| Open-source observability platforms | Tracing, evaluation and cost dashboards; free to self-host, hosted tiers available | When several applications and several people need one dashboard. **Check the self-hosted resource requirements first** — some run five services and want several times the memory of this entire stack, on a server that is already your largest cost. |
| Proxy or gateway products | Sit between you and the provider for per-request cost, caching and limits | When you run several client systems and want one view across them — which is plausible here once you have three clients. Note the extra hop and check the product is actively developed. |
| Metering and billing tools | Turn usage into billable meters and invoices | If you bill clients by usage rather than a flat retainer. A pricing decision first. |

The default here is your ledger plus a page. Write down the trigger that would change it — for
this material, "a fourth client" is a reasonable one.

**The client-facing dashboard**, which is a deliverable rather than an internal tool: runs this
month, failures, items sent to a person, hours saved against the step 0 model, and cost. Five
numbers. A client who sees this monthly renews without a conversation.

**Alerts before invoices.** A spending limit, plus your own alert on cost per run leaving its
band. A prompt change that doubled the input, or a client whose documents got longer, shows up
here days before the bill.

**Libraries:** none new — the `ai_calls` records from step 5

**Expected outcome:** A cost ledger aggregating by client, workflow, step and prompt version. `docs/cost-report.md` — cost per run per client, cost per step, cost per completed run including replays and sign-off minutes, monthly infrastructure beside monthly inference, and the price of one sign-off. A client-facing dashboard page with the five numbers. A spending limit and a drift alert. A written decision on third-party tooling with its trigger. **No behaviour changes.**

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — every model call in a full run of all three clients is attributed to a client, workflow, step and prompt version, and the attributed sum matches the total; a replayed run appears once as a completed run with its original call counted once. |
| **L2 — Manual checks** | (a) Put monthly infrastructure and monthly inference on the same line. If infrastructure is larger — it probably is — note it, and let it decide what you optimise in step 14. <br>(b) Show the client dashboard to someone non-technical and ask whether they would pay for it. Anything they do not care about comes off the page. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and you can answer "what does this cost me?" per client with the arithmetic |

---

## Step 14 — Making it cost less

**Story:** *As the person on the retainer, I cut what this costs to run and can prove with the golden set that nothing got worse.*

**Mode:** `LEARN` — every lever trades something.

**Why now:** After measurement and after the golden set. Not one step earlier.

**Concepts:**

**Start where the money is, which step 13 just told you.** If infrastructure dominates, the first
lever is not a prompt — it is removing a service you do not need, sizing the host correctly, or
moving the golden-set runs off a schedule that runs them more often than anything changes. Say
this in the report; it is the honest engineering answer and it is the one nobody writes.

**Then the model levers, in this order. Free wins before anything that trades quality.**

1. **Do not call the model.** A rules-based pre-filter removes the obvious cases before any call — the out-of-office, the automated notification, the duplicate. At Fern & Oak this can be a large share of the inbox, for free.
2. **Send less.** Ridgeway's clause flagging does not need the whole contract for every clause type. Fern & Oak's classifier does not need the forwarded thread's full history. Input hygiene is usually the biggest model-side saving here, because these inputs are long.
3. **Prompt caching on the stable prefix.** Instructions and schema are identical per step. Verify with cache-read tokens; a prompt version string in the wrong place invalidates it silently.
4. **Cap the output.** A reasoning field with no limit will fill.
5. **Batch what is not urgent.** Overnight scoring and backfills go through the asynchronous batch path at half the price with no quality trade. Anything a person is waiting for stays synchronous.
6. **Lower the effort before changing the model.** Lower effort on a capable model often beats a smaller model, and keeps one cache namespace.
7. **Then the model.** Possibly a cheaper model for Fern & Oak's classification and the stronger one for Ridgeway's clauses and Brightline's scoring. Measure per step; the golden set decides. This is the one place where different steps genuinely warrant different models, because their stakes differ by an order of magnitude.

**Cost per completed run, always.** A cheaper configuration that sends more items to sign-off has
moved cost onto a person, and at Brightline that person is expensive.

**Every change through the golden set.** One change per experiment, before and after recorded. A
change that moves a step outside its band is reverted regardless of the saving.

**Where to deliberately spend more.** Brightline's scoring affects people and its reasoning has
to survive being read by a candidate. That is not the place to save a cent per run, and the
report should say you decided that rather than missed it.

**Then price the retainer.** Cost per run × volume, plus infrastructure, plus your hours. Against
the step 0 model. If the margin is thin, the answer is usually fewer services rather than a
higher price.

**Libraries:** the `anthropic` SDK — batch, prompt caching, effort settings, token counting

**Expected outcome:** At least four changes, each an experiment with golden-set results before and after. A rules-based pre-filter with its hit rate measured. Batch for the non-urgent paths. Caching verified. A per-step model decision with the measurement behind it. A tuning log. `docs/cost-report.md` finished with cost per run per client, a monthly total including infrastructure, and the comparison against step 0.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — cost per completed run falls against the step 13 baseline while every AI step stays inside its golden-set band and the sign-off rate does not rise; every change has a recorded before-and-after. |
| **L2 — Manual checks** | (a) For each change, name what it could have broken and point at the number that says it did not. <br>(b) Work out the monthly margin on Ridgeway's retainer. If it is thin, list what you would remove rather than what you would charge. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d`, `AP-14-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and you can quote a monthly retainer for each client with the arithmetic |

> **The trap this step exists to prevent.** Spending a week on prompt tokens when the server is the bill. Step 13 exists so that you know which one you are looking at, and this step exists so that you act on the answer rather than on habit.
