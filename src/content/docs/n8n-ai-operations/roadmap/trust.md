---
title: Trust
description: Steps 11–12. The golden set that catches a model changing under you, and fairness and audit for decisions about people.
sidebar:
  order: 5
---

Two steps. They are what a client is actually paying the retainer for: somebody is watching, and
somebody can explain a decision.

---

## Step 11 — The golden set, and a model you do not control

**Story:** *As the person on the retainer, when the classification quietly gets worse — for a reason that is not my change — I know within a day.*

**Mode:** `LEARN` — a golden set built carelessly measures nothing.

**Why now:** After all three AI steps exist. Before cost, because every cost change is a trade against these numbers.

**Concepts:**
- **You do not control the model, the prompt inputs, or the client's data.** All three drift. Your code can be untouched for a month and the behaviour still change. That is the specific reason this material runs the golden set **on a schedule as well as on change**, which is unusual and is the point.
- **A golden set per AI step**, not per workflow. Fern & Oak's classifier, Ridgeway's clause flagger, Brightline's scorer each need their own, because they fail differently and their acceptable answers differ.
- **Where the items come from**: the seeded data you ran at step 7 and read by hand, the items a person overrode at step 9 — the most valuable source in the system — and deliberately awkward cases you construct.
- **Label by hand.** A set labelled by the model being measured records agreement with itself.
- **Metrics per step type.** Classification: accuracy and the confusion between the two categories that actually get confused. Extraction: field accuracy. Scoring: rank agreement with a human ordering, not an exact score match. One overall number tells you nothing about which step moved.
- **Include the escape category and the refusals.** A classifier that never uses "none of these" scores well and is useless on the out-of-office.
- **A tolerance band, not an exact threshold.** The system is non-deterministic; an exact threshold flaps, people start ignoring the alert, and then it is not a gate.
- **On change and on a schedule.** On change catches you. On schedule catches everything else — a model update, a prompt input that shifted, a client whose enquiries changed shape in January.
- **Cost of a run**, watched. The golden set calls the real model, several times a day.
- **What to do when it moves and you changed nothing.** Have the answer written before it happens: compare against the recorded prompt version and model, check the item-level differences, and tell the client before they tell you. That message is the retainer justifying itself.

**Libraries:** Vitest as the runner, your prompt versions, the real model

**Expected outcome:** A golden set per AI step, hand-labelled, including escape-category and awkward items, with overrides from step 9 feeding a candidate queue. Per-step-type metrics. A tolerance band. A CI gate on change and a scheduled run with an alert. `docs/golden-set.md` — what is measured, the current numbers, and the written procedure for when a number moves without a change from you.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — each AI step reports its own metric separately, and degrading one step moves only that step's number; the scheduled run alerts on a band breach; two runs of the set agree within the band. |
| **L2 — Manual checks** | (a) Read the ten worst items per step. Some will be label errors. Fix them and record the fix. <br>(b) Change a prompt in a way you believe is neutral and run the set. It will move something. That is why the gate exists. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and you would find out about a model shift before your client did |

> **This is the step.** Before it, three workflows that worked when you tried them. After it, three workflows that tell you when they stop working — including for reasons that are not your fault, which is most of them.

---

## Step 12 — Decisions about people

**Story:** *As a candidate, a machine did not reject me, and Brightline can show exactly why I was shortlisted or not.*

**Mode:** `LEARN` — the most consequential step in the material, and the one where an agent's suggestions need the most scepticism.

**Why now:** Last of the build. It needs sign-off from step 9 and measurement from step 11, and it is where those two combine into something defensible.

**Concepts:**
- **A decision about a record and a decision about a person are not the same thing**, however similar the code looks. Mis-tagging an enquiry costs seconds. Mis-scoring an application affects someone's employment, and it is the kind of decision people are entitled to question.
- **Never automatic, and never a silent default.** Nothing is rejected without a person. An expiry that quietly discards is an automatic rejection with extra steps.
- **Recorded reasoning, in the model's own output, per candidate.** Structured — which criteria were met, which were not, evidence for each — not a paragraph of prose. Structured reasoning is reviewable, comparable across candidates and checkable against the criteria; prose is not.
- **Inputs that must not influence the outcome.** Decide explicitly what the model may see. Name, address, photograph, school, dates that imply age — none of these are needed to assess whether someone has done the work. Removing them is cheap; arguing about it later is not.
- **Test it with near-identical pairs.** The simulator ships two applications differing only in an irrelevant detail. If the outcomes differ, you have a finding. This is not a complete fairness audit and it is not nothing — it is a test that fails loudly and belongs in CI.
- **Consistency over time is part of fairness.** The same application scored differently in March and April is a problem even if both scores are defensible. The golden set is what catches it.
- **The audit trail**: the inputs used, the criteria, the reasoning, the score, who signed off, when, and whether they agreed with the model. Retained per the client's obligations, exportable, readable by someone who is not you.
- **What to tell the client, in writing.** That a model assists screening, that a person decides, what the model sees, and what is recorded. If they will not say that to candidates, do not build it.
- **What to refuse.** Fully automatic rejection. Inferring protected characteristics for any purpose. Scoring on inputs the client cannot justify. These belong on step 3's refusal list, and this is where they become concrete.

**Libraries:** none new — structured outputs, your ledger, your sign-off queue

**Expected outcome:** Brightline's scorer producing structured per-criterion reasoning with evidence. An explicit allow-list of inputs the model may see, enforced in code. A near-identical-pair test in CI. Consistency tracked through the golden set. A per-candidate audit record, exportable and readable. `docs/decisions-about-people.md` — what the model sees, what it produces, who decides, what is recorded and for how long, and what you refuse to build.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — no code path completes an application outcome without a sign-off; the near-identical pair produces the same outcome, failing CI if not; a field outside the allow-list cannot reach the model, asserted over the whole applicant set; the audit record for any candidate reconstructs the decision. |
| **L2 — Manual checks** | (a) Read five audit records as if you were the candidate asking why. If the reasoning does not survive that reading, it is not reasoning. <br>(b) Take your allow-list and justify each field out loud as something needed to assess the work. Anything you cannot justify comes off. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and you would be comfortable explaining this system to a candidate |

> **The change request arrives here.** The client simulator delivers Brightline's changed requirement during this step: they want a new criterion, applied to applications already scored. Read it now. Step 15 is where you absorb it, and thinking about it while the fairness work is fresh is deliberate.
