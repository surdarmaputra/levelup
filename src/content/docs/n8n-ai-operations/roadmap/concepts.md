---
title: Concepts
description: Steps 0–3. What the manual operations work costs, how a non-deterministic step behaves inside a workflow, what the no-code market already does, and how to scope a retainer.
sidebar:
  order: 2
---

Four steps, no code. Step 2 is the one that stops you building something a client could buy for
£40 a month, and step 3 is the one that gets you paid monthly instead of once.

---

## Step 0 — What the daily process costs

**Story:** *As someone about to build this, I can state what a business's daily operations work costs, and which parts of it are actually worth automating.*

**Mode:** `LEARN` — nothing to build.

**Why now:** First. Automation projects fail most often not because the technology did not work but because the automated part was not the expensive part.

**Concepts:**
- **Map the process before costing it.** Who touches it, in what order, and where it waits. The waiting is usually longer than the doing, and it is invisible when you ask "how long does this take?"
- **The arithmetic.** Items per month × minutes each × loaded hourly cost. Per step, not per process — the point is to find which step is expensive.
- **Where automation saves nothing.** If the classification takes ten seconds inside a task that takes eight minutes, you can automate it perfectly and nobody will notice. Find that out before quoting.
- **The delay cost.** An enquiry answered in four hours instead of two days is a conversion difference at Fern & Oak, and it is often worth more than the labour saved. It is also the number a marketing agency actually cares about.
- **The consistency cost.** Three people screening applications produce three standards. At Brightline that is a legal exposure as well as an inefficiency.
- **The concentration cost.** One person knows how the process works. When they are on holiday, it stops. Automation as documentation is a real argument and clients recognise it immediately.
- **Who signs the cheque.** An owner or an operations manager. They buy hours back and headaches removed, in that order.
- **What a retainer is worth.** Ongoing value, not the build. The build is a week. The reason they keep paying is that it keeps working and someone watches it.

**Libraries:** none. A spreadsheet and a process map.

**Expected outcome:** `docs/business-case.md` — a process map per client with time and cost per step, the total, and a marked column for which steps are worth automating and which are not. At least one step per client marked "not worth it", with the reason. Every input sourced or marked as an assumption.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — every client has a per-step process map with time and cost, a total, and at least one step explicitly marked as not worth automating with a reason. |
| **L2 — Manual checks** | (a) For Fern & Oak, work out the value of answering an enquiry four hours sooner. If it is larger than the labour saving, that is your pitch and it is not the one you were going to make. <br>(b) Ask what happens today when the person who runs the process is away. Their answer is a selling point you did not have to invent. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, and you can name the one step per client that is worth automating most |

---

## Step 1 — How an AI step behaves inside a workflow

**Story:** *As a developer, I can describe what changes when one step of a deterministic process becomes non-deterministic, and what has to be built around it.*

**Mode:** `LEARN` — the mental model.

**Why now:** Before tooling. This is the decision that separates the material from every n8n tutorial, and it shapes the ledger at step 5.

**Concepts:**
- **A workflow is a sequence of steps with a guarantee: given the same input, the same thing happens.** One AI step removes that guarantee for the whole workflow, and everything after it inherits the uncertainty.
- **What that breaks, specifically:**
  - **Testing.** You cannot assert an exact output. You assert a validated shape, a set of acceptable outcomes, and a measured rate.
  - **Replay.** Re-running the AI step may produce something different, so a replay must reuse the recorded output rather than re-generating it — or you have two different runs of the same job.
  - **Branching.** A workflow branching on an AI step's output takes a different path on a different day for the same input. Every branch needs a defined behaviour, including the one nobody expected.
  - **Debugging.** "It worked yesterday" is now literally true and not a clue.
- **The contract around the step.** Structured output validated against a schema; an explicit failure when it does not validate; a defined behaviour when the output is valid but wrong; and a recorded input, output and prompt version for every call. The step is a function with a contract, not a magic node.
- **Where the AI step must not be.** Anywhere its output is the last thing before an irreversible external effect with no validation between. That is not a style preference; it is the failure mode.
- **Confidence and thresholds.** Where the output can carry a usable confidence — from validation, agreement or an explicit uncertainty in the schema — a threshold routes low-confidence items to a person. Where it cannot, the answer is that everything goes to a person, and that may still be worth building.
- **The model is not yours.** It can change under you with no deploy on your side. That is not paranoia, it is the reason step 11 runs the golden set on a schedule.
- **Why the call belongs in your code, not in a workflow node.** A built-in AI node is one line of configuration and it puts the call where you cannot validate, version, meter, cache or test it. Behind your service, all five are ordinary.

**Libraries:** none yet.

**Expected outcome:** `docs/ai-steps.md` — what changes when a step becomes non-deterministic, the four things it breaks with a concrete example each, the written contract every AI step in this project must satisfy, and the rule about where an AI step may not sit. Plus a per-client list of which steps are AI steps and which are not.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — the document states the AI-step contract in a form you could hand to another developer, and for each client identifies which steps are non-deterministic. |
| **L2 — Manual checks** | (a) Take Brightline's workflow and mark the point where a wrong AI output would reach a person. Then mark where it would reach an applicant. The distance between them is your safety margin. <br>(b) Write down what your workflow does when the AI step returns valid output that is wrong. If the answer is "nothing", that is the gap. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can say why the model call does not belong in a workflow node |

---

## Step 2 — What the no-code market already does

**Story:** *As someone quoting for this work, I know what a client could buy for a small monthly fee, and I only charge for what that cannot do.*

**Mode:** `LEARN` — research and honesty.

**Why now:** Before building. This is the step that stops you spending three weeks rebuilding a £40-a-month product.

**Concepts:**
- **The layers, and what each one really solves:**

  | Layer | What it is |
  |---|---|
  | Hosted automation platforms | Connect apps, trigger on events, some AI steps built in. Fast, cheap, enormous connector libraries. |
  | Vertical AI tools | A finished product for one job — inbox triage, CV screening, contract review — with its own interface |
  | The client's existing software | Their CRM, ATS or practice-management system shipping AI features into what they already pay for |
  | Agencies and no-code operators | People who build on the hosted platforms, quickly, without code |
- **The fourth layer is your actual competitor**, and they are cheaper than you. Know what they charge before you quote. Your case is not that you are better at n8n; it is that guarantees, confidentiality, auditability and measurement are not things a no-code build has.
- **The third layer is your biggest risk.** If Brightline's applicant tracking system ships AI screening next quarter, your project is worth much less. Ask what their vendors have shipped this year.
- **When buying is the right advice**: a standard job, standard tools, no confidentiality constraint, no decisions about people, and a volume the licence covers. Say so — you will be the person they call for the part it cannot reach.
- **When building wins**: self-hosting is required, the process is specific to how this business works, the outputs need an audit trail, several systems must stay consistent, or the client wants someone accountable when it breaks at 08:00.
- **What self-hosting is really worth.** For Ridgeway it is not a preference, it is the whole engagement. Price that honestly: it is more work to run, and it is the reason they can hire you at all.
- **Total cost of ownership**, both ways. Licence plus their staff time versus your build plus your retainer plus a server.

**Libraries:** none. Vendor pricing pages and an hour.

**Expected outcome:** `docs/build-vs-buy.md` — at least six named options across the four layers, with pricing where verifiable and the date checked. A per-client recommendation with the one deciding reason. At least one "buy" or "buy plus a small custom piece". An explicit list of what a no-code build could not do, because that list is your proposal.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — six real options with sources and dates; a per-client recommendation with a one-sentence deciding reason; and an explicit list of what a no-code operator could not deliver. |
| **L2 — Manual checks** | (a) Price the Fern & Oak workflow as a hosted-platform subscription. If it is much cheaper than you, your pitch for that client is the parts they cannot buy, or there is no project. <br>(b) Check what each client's existing software shipped this year. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and you can say in one sentence what you sell that a no-code operator does not |

---

## Step 3 — Scoping a retainer

**Story:** *As a freelancer, I can propose an engagement that pays monthly, and I know what I will refuse.*

**Mode:** `LEARN` — the deliverable is a document you would send.

**Why now:** Last before tooling. It uses all three previous steps, and the retainer shape decides what you build.

**Concepts:**
- **The discovery questions that change the price:** how many items a month and what is the peak; how many systems must stay consistent; does anything need to stay on their infrastructure; are any outputs decisions about people; what happens today when the process breaks; and who will use the sign-off queue.
- **Watch the process before believing the description.** An hour beside the person who does it beats any interview. What they actually do differs from what they say they do, always, and the difference is where your automation breaks.
- **Build fee plus retainer, and be clear what each buys.** The build is the workflows. The retainer is: it keeps running, someone watches the golden set, new senders and small changes are absorbed, and a report arrives monthly. Sell the watching, because that is the part that is genuinely ongoing.
- **What the retainer must include or you will resent it**: a stated number of change requests, a definition of what counts as a new workflow rather than a change, and the model cost either passed through or capped.
- **What to refuse.** Fully automatic decisions about people. Anything where you cannot see the source system. A fixed price on a process you have not watched. Access to production credentials with no scope. "Just make it do whatever the person does" without the person available.
- **The confidentiality conversation, early.** For Ridgeway it decides the architecture. Ask what may leave their infrastructure before designing anything, because the answer changes the estimate.
- **The pilot.** One workflow, one client, four weeks, an agreed measure. It de-risks both sides and it is far easier to sell than a full engagement.

**Libraries:** none.

**Expected outcome:** A retainer proposal for **Ridgeway Legal** — the hardest to scope: the pilot workflow, what happens to their documents in one paragraph a solicitor would accept, the measure of success, what is in the monthly fee, what counts as a change versus a new workflow, and what is out of scope. Plus an internal note on what you refuse and why.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — the proposal states the pilot scope, the confidentiality answer, the success measure, what the retainer includes, the change-versus-new-workflow boundary, and what is out of scope. All six present, none vague. |
| **L2 — Manual checks** | (a) Give the confidentiality paragraph to someone and ask what happens to a contract. If they cannot say, a solicitor will not accept it. <br>(b) Count how many change requests a month your fee assumes. If you did not write a number, you have agreed to unlimited. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and the proposal contains no number you could not defend |

**Harness impact:** none yet. Keep the four documents in `docs/`; step 4's harness points the agent at them.
