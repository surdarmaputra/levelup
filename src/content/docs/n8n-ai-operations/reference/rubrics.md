---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items each step's **Verification** block only names by ID — a lookup you read one section of per step.

**`ACC-NN`** is the gating acceptance test: unambiguous pass/fail, no judgement call. **`AP-NN-x`** are named mistakes that pass the test and are still wrong.

**How to use it — three times per step:** read `ACC-NN` before building and write that test first; self-check every `AP-NN-x` once it passes; paste **only that step's section** into the [reviewer](../../setup/reviewer-setup/).

Steps 0 to 3 produce documents. Their rubrics are still objective.

---

## Step 0 — What the daily process costs

**ACC-00** — every client has a per-step process map with time and cost, a total, and at least one step explicitly marked as not worth automating, with a reason.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Costing the process instead of its steps.** The point is to find which step is expensive. A single total cannot tell you what to automate. |
| AP-00-b | **Ignoring the waiting.** An item sitting in a queue for two days is usually a larger cost than the minutes spent handling it, and it is invisible if you only ask how long a task takes. |
| AP-00-c | **Believing the description of the process.** What people say they do and what they do differ, always. Watch it. |

---

## Step 1 — How an AI step behaves

**ACC-01** — the document states the AI-step contract in a form another developer could implement, and identifies the non-deterministic steps per client.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Treating the AI step as just another node.** Its output cannot be predicted, which breaks testing, replay, branching and debugging for everything downstream. |
| AP-01-b | **No defined behaviour for "valid but wrong".** Schema validation catches malformed output. It does not catch a confident wrong answer, and something has to. |
| AP-01-c | **Putting the model call in a workflow node.** It is one line of configuration and it puts the call where you cannot validate, version, meter, cache or test it. |

---

## Step 2 — What the no-code market does

**ACC-02** — six real options across the four layers with sources and dates; a per-client recommendation with a one-sentence deciding reason; an explicit list of what a no-code operator could not deliver.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Not pricing the no-code operator.** They are your actual competitor and they are cheaper. Your case is guarantees, not skill with the tool. |
| AP-02-b | **Ignoring the client's existing software.** If their CRM or ATS ships this next quarter, the project is worth much less, and they will not think to tell you. |
| AP-02-c | **Never recommending "buy".** An analysis that always concludes "build" was written to justify a decision already made. |

---

## Step 3 — Scoping a retainer

**ACC-03** — the proposal states the pilot scope, the confidentiality answer, the success measure, what the retainer includes, the change-versus-new-workflow boundary, and what is out of scope.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **No stated number of change requests.** Unstated means unlimited, and the retainer becomes unprofitable in month three. |
| AP-03-b | **Leaving confidentiality until the build.** For a client like Ridgeway it decides the architecture and the price; asking late means re-estimating. |
| AP-03-c | **Selling the build and not the watching.** The build is a week. The retainer is somebody watching, and if you do not sell that you have sold a one-off. |
| AP-03-d | **Quoting a process you have not watched.** The description is always wrong in the place that matters. |

---

## Step 4 — n8n, the sidecar, the quality gate

**ACC-04** — `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a workflow exported, deleted and re-imported from git runs identically; two writes to the simulator's CRM without a shared key produce two records.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Workflows living only in n8n.** Not in git means one restore away from gone, and no review of a change anyone made in the editor. |
| AP-04-b | **Not handling the encryption key deliberately.** Losing it loses every stored credential, and the time to learn that is on your laptop. |
| AP-04-c | **Guarantees implemented in n8n nodes.** Validation, idempotency, the ledger and redaction belong in your code. That split is the whole engineering argument. |
| AP-04-d | **A friendly client simulator.** A fixture that always succeeds means every later test passes for the wrong reason. |

---

## Step 5 — The run ledger

**ACC-05** — replaying a run that failed at step seven executes only steps seven onwards and produces no second external write, enforced by a database constraint; a replayed AI step reuses its recorded output; a sign-off cannot be created by a workflow path.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Relying on n8n's execution history.** It says a run failed. It does not say which external writes committed, what an AI step produced, what it cost, or who signed off. |
| AP-05-b | **Re-calling the model on replay.** The replayed run is then a different run, and if a person already saw the first output you now have two versions of one job. |
| AP-05-c | **Hashing the trigger payload instead of the step's actual input.** The replay then always misses or always hits, and neither is replay. |
| AP-05-d | **Privileged text in the ledger.** Hashes, references and redacted extracts. A contract body in a run record is the leak nobody planned. |

---

## Step 6 — The first workflow, no AI

**ACC-06** — the same enquiry delivered twice produces one CRM record, verified against the simulator; a forced mid-run failure leaves a resumable run and exactly one alert; a workflow re-imported from git behaves identically.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **Deduplicating at the trigger.** Triggers re-deliver, retries re-deliver, restarts re-deliver. The key belongs at the write. |
| AP-06-b | **No error workflow.** The default is that a failure disappears quietly, which is the worst available behaviour. |
| AP-06-c | **Adding the AI step before the boring part is reliable.** Every failure then looks like a model problem, and you will spend a day proving it is not. |

---

## Step 7 — The first AI step

**ACC-07** — an AI output failing schema validation fails the step and writes nothing; an out-of-office message lands in the escape category; a second call with the same prefix records cache-read tokens above zero; no unit test calls the real model.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Free text a later node parses.** Structured output validates or fails. Parsing prose downstream accepts anything that looks close enough. |
| AP-07-b | **A closed category set with no escape.** The classifier will pick a real category for the out-of-office, confidently, every time. |
| AP-07-c | **No prompt version recorded.** Step 11 compares versions and step 13 attributes cost to them. Neither can be done retrospectively. |
| AP-07-d | **Treating model output as trusted.** It is going into a CRM field and an email draft. Validate, escape and limit it like any other input. |

---

## Step 8 — Replay with a non-deterministic step

**ACC-08** — replaying a run that failed after classification issues zero model calls and produces the original classification; replaying a run that already wrote to the CRM produces no second record; replaying a run containing a sent email refuses rather than resending.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Re-generating on replay.** The output differs, so the replayed run is not the run you were fixing. |
| AP-08-b | **Replaying a step that sent something to a person.** A second email to a customer is not a retry, it is a mistake. Mark and refuse. |
| AP-08-c | **Assuming idempotency covers replay.** They solve different problems — one action delivered twice, versus a run restarted. A system with only one has a gap it cannot see. |
| AP-08-d | **No explicit re-generate operation.** Sometimes you do want a fresh answer. It is a different operation with its own record, not a flag on replay. |

---

## Step 9 — Human sign-off

**ACC-09** — a Brightline outcome does not exist until a sign-off written by a person's session exists; restarting every service while items await sign-off loses nothing; an expired item takes no automatic action and raises exactly one notification.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Blocking a workflow execution waiting for a person.** One restart and the item is gone. Waiting is a state. |
| AP-09-b | **A queue showing a name and two buttons.** It is rubber-stamped within a week, which is worse than no gate because it looks like control. |
| AP-09-c | **An expiry that applies the automatic outcome.** That is an automatic decision with extra steps, and for a decision about a person it is the thing you promised not to do. |
| AP-09-d | **Not recording overrides.** A person disagreeing with the model is the most valuable data in the system — golden-set candidates and fairness evidence in one row. |

---

## Step 10 — What may leave the building

**ACC-10** — no request leaving the service for Ridgeway contains an unredacted identifier, asserted over the adversarial set including footers, filenames and signature blocks; redacted documents still produce correct clause flags; the ledger contains no contract text.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Accepting "it can't go to the cloud" as the rule.** The real obligation is usually narrower and more workable, and finding it out is the difference between an engagement and a refusal. |
| AP-10-b | **Redaction with no adversarial test.** It will miss the name in the footer and the reference in the filename, and nothing will tell you. |
| AP-10-c | **Over-redaction nobody checked.** A document the model can no longer understand produces confident useless output, and the redaction test passed. |
| AP-10-d | **Proposing a local model without pricing the hardware.** It needs a machine with an accelerator. Recommending it without that number is how an engagement goes wrong in month two. |

---

## Step 11 — The golden set

**ACC-11** — each AI step reports its own metric separately, and degrading one step moves only that step's number; the scheduled run alerts on a band breach; two runs agree within the band.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Running the set only on change.** The model is not yours and neither is the client's data. Both drift while your code sits still. |
| AP-11-b | **One overall number.** It cannot say which step moved, and the steps have different fixes. |
| AP-11-c | **Labels produced by the model being measured.** The set then records agreement with itself. |
| AP-11-d | **An exact threshold instead of a band.** It flaps on a non-deterministic system, people start ignoring it, and then it is not a gate. |

---

## Step 12 — Decisions about people

**ACC-12** — no path completes an application outcome without a sign-off; the near-identical pair produces the same outcome, failing CI otherwise; a field outside the allow-list cannot reach the model; the audit record reconstructs any decision.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Reasoning as prose.** Unreviewable, incomparable across candidates, and uncheckable against the criteria. Structure it per criterion with evidence. |
| AP-12-b | **A deny-list instead of an allow-list.** You will forget one, and the one you forget is the one that matters. State what the model may see. |
| AP-12-c | **Treating this like the enquiry classifier.** The code looks the same. A mis-tagged enquiry costs seconds; a mis-scored application affects someone's employment. |
| AP-12-d | **An audit record that does not survive being read by the candidate.** That is the reader it exists for. |

---

## Step 13 — Where the money goes

**ACC-13** — every model call in a full run of all three clients is attributed to a client, workflow, step and prompt version, and the sum matches the total; a replayed run appears once as a completed run with its original call counted once.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Leaving infrastructure out of the cost report.** Here it is usually the larger number, and omitting it makes every optimisation decision wrong. |
| AP-13-b | **The console as the only source.** It is the bill. It cannot say which client, which step or which prompt version. |
| AP-13-c | **Leaving the sign-off minute out.** At Brightline the reviewer's time is most of the real cost. |
| AP-13-d | **A client dashboard full of numbers the client did not ask for.** Runs, failures, items to a person, hours saved, cost. Anything else is you talking to yourself. |

---

## Step 14 — Making it cost less

**ACC-14** — cost per completed run falls against the step 13 baseline while every AI step stays inside its band and the sign-off rate does not rise; every change has a recorded before-and-after.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Optimising tokens when the server is the bill.** Step 13 told you which. Acting on habit instead of the number is the specific failure this material exists to prevent. |
| AP-14-b | **No rules-based pre-filter.** The cheapest model call is the one not made, and a large share of an inbox is obviously not worth a call. |
| AP-14-c | **Downgrading the model first.** Pre-filtering, input hygiene, caching and lower effort come first, and cost nothing in quality. |
| AP-14-d | **Cost per run instead of per completed run.** A configuration that sends more to sign-off looks cheaper and is not. |
| AP-14-e | **Two changes in one experiment.** They cancel out and the run teaches nothing. |

---

## Step 15 — Deploy, handover, and the change

**ACC-15** — a full restore from backup plus the encryption key reproduces every workflow and credential and passes the golden set; runs created before the change keep their prompt and workflow version; the backfill produces sign-off items rather than decisions and cannot alter an application already signed off.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **Backing up the database and not the encryption key.** The restore comes back with every credential unreadable. |
| AP-15-b | **A backfill as a one-off script.** No ledger, no idempotency, no sign-off, no audit trail — at Brightline, precisely the thing that had to exist. |
| AP-15-c | **Shipping the new criterion before extending the golden set.** You then have no way to say whether anything else moved, which is the question the client will ask. |
| AP-15-d | **Re-deciding what a person already signed off.** Not yours to do. Flag it for a human instead. |
| AP-15-e | **Absorbing the change silently.** If it fell outside the retainer, say so. A boundary you never enforce is a boundary you did not set. |
