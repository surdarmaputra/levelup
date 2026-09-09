---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items each step's **Verification** block only names by ID — a lookup you read one section of per step.

**`ACC-NN`** is the gating acceptance test: unambiguous pass/fail. **`AP-NN-x`** are named mistakes that pass the test and are still wrong.

**Why this exists.** You cannot eyeball a voice agent. It sounds fine and mishears the postcode. From step 12 most acceptance tests run against recorded audio, because a system you can only test by phoning it is a system nobody tests.

**How to use it — three times per step:** read `ACC-NN` before building and write that test first; self-check every `AP-NN-x` once it passes; paste **only that step's section** into the [reviewer](../../setup/reviewer-setup/).

---

## Step 0 — What a missed call costs

**ACC-00** — every client has an annual missed-call figure and a current cost of answering, both derived; the out-of-hours case is costed separately where it applies.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Comparing against software.** The incumbent is a receptionist or an answering service, and that is the number the client will compare you to. |
| AP-00-b | **Assuming the client knows their unanswered rate.** Almost nobody does. Establishing it is itself valuable and it is the basis of the whole case. |
| AP-00-c | **Ignoring the reputational risk.** A bad agent is the last impression a customer has of the business. Leaving it out of the case makes the evaluation work at step 12 look optional. |

---

## Step 1 — Where the latency comes from

**ACC-01** — the document lists every hop with a sourced or clearly assumed range, states a target for time to first audio, and identifies endpointing as a tuned trade rather than a setting.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Optimising total response time.** The metric is time to *first* audio. A long answer that starts quickly feels fast. |
| AP-01-b | **Treating endpointing as a default.** It is the largest and least obvious cost, and the right value differs between a caller at a desk and a caller in the street. |
| AP-01-c | **Forgetting that a tool call is inside the turn.** A 400ms lookup spends most of the budget, and no component swap recovers it. |

---

## Step 2 — What you could buy instead

**ACC-02** — six real options with dated pricing; a per-client recommendation with a one-sentence reason; a three-way per-minute comparison against a managed platform and a human answering service.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Undated pricing.** This market re-prices frequently, and a stale per-minute figure quoted in a meeting is a credibility risk. |
| AP-02-b | **Ignoring the vertical products.** They are the closest competitor and the client may already have been pitched one. |
| AP-02-c | **Claiming a platform does not solve the hard parts without checking.** They solve the pipeline well. What they do not solve is your call policy, escalation, confirmation and evaluation — say that specifically. |

---

## Step 3 — The call policy

**ACC-03** — every client has all eight elements; the never-say list contains specific testable items rather than principles; Northgate has at least three immediate-escalation categories with the trigger written out.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **A never-say principle instead of a list.** "Be careful about prices" cannot be tested. "Never state a price or an estimate" can. |
| AP-03-b | **Burying or softening the disclosure.** The caller is told in the first sentence, in plain words. Anything else is evasive, and in some jurisdictions it is more than that. |
| AP-03-c | **Assuming you may record.** Recording has a legal basis that differs by jurisdiction, and it is a separate decision from storing a transcript. Ask. |
| AP-03-d | **An escalation destination that is a voicemail at 02:00.** That is not an escalation, and Northgate's callers are the ones who find out. |

---

## Step 4 — Tooling and the first call

**ACC-04** — `make verify` exits 0 clean and non-zero on a formatting error, a type error and a failing test independently; an automated test connects to a session and asserts the disclosure text is spoken.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **Writing your own audio transport.** Jitter, packet loss and echo cancellation are a specialist discipline and none of it is what this material teaches. |
| AP-04-b | **Iterating over the real phone number.** Every test call costs money on four meters. Use a browser client to iterate and the number to confirm. |
| AP-04-c | **Leaving the disclosure until later.** It is the first sentence of the first working call, or it becomes an afterthought nobody tests. |

---

## Step 5 — The latency budget

**ACC-05** — every turn records all six timestamps; the CI budget test fails when an artificial delay is added at any hop; the ninety-fifth percentile time to first audio on the fixture set is inside the budget.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Measuring only in development.** Timings belong on every turn in production, or the budget is an aspiration. |
| AP-05-b | **Reporting the average.** The median turn is fine and irrelevant. The slowest one in twenty is where the caller interrupts. |
| AP-05-c | **Trusting published component latencies.** They are best cases from a data centre. Your number on your connection is worse and it is the one that matters. |
| AP-05-d | **Filling silence with meaningless noise.** A short honest sentence buys time. Fake progress sounds are detected immediately and are worse than silence. |

---

## Step 6 — The call ledger and consent

**ACC-06** — a client configured without recording completes a call with no recording row and no stored audio; every fact records its confirmation state; escalation is distinct from failure; retention removes transcripts as well as audio.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **Treating the transcript as the record.** What the agent *understood* is a separate thing, and separating them is what makes confirmation possible. |
| AP-06-b | **Recording by default.** Consent has a basis that varies by jurisdiction. Build so that a client who cannot record still gets a working system. |
| AP-06-c | **Counting escalation as a failure.** It is the most important outcome at one of the three clients, and burying it in an error report hides the metric that matters most. |
| AP-06-d | **Applying retention to audio only.** A transcript contains names, numbers and, at Northgate, the fact of an emergency at a private address. |

---

## Step 7 — The first conversation

**ACC-07** — a fixture conversation books an appointment with every fact recorded; a caller asking Northgate for a price receives none, asserted against model output rather than the prompt; an over-long reply fails.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **A never-say rule enforced only in the prompt.** The model usually complies. "Usually" is what puts a price quote on a recorded call. |
| AP-07-b | **Parsing the spoken sentence to work out what happened.** The model produces structure alongside speech. Reconstructing intent from prose is the thing that avoids. |
| AP-07-c | **No reply-length limit.** Long replies arrive when nobody set a limit, and they cost twice — in seconds the caller waits and in synthesis charges. |
| AP-07-d | **A rigid script.** The second real caller answers a question you did not ask or gives three facts at once. |

---

## Step 8 — Interruptions and turn-taking

**ACC-08** — an interrupting fixture stops synthesis within the threshold and state reflects only delivered audio; a backchannel does not stop the agent; a mid-sentence pause does not trigger a reply.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Finishing the sentence before listening.** The single most irritating behaviour in this domain — the one callers describe as "it wouldn't let me speak". |
| AP-08-b | **State that reflects generated audio rather than heard audio.** The agent then refers to something the caller never heard, and the conversation diverges. |
| AP-08-c | **Stopping for a cough or a dog.** A backchannel is not an interruption, and treating every noise as one makes the agent unusable in a restaurant. |
| AP-08-d | **Tuning turn-taking in a quiet room.** Everything works in a quiet room. Copper Kettle's caller is in the street. |

---

## Step 9 — Getting the facts right

**ACC-09** — no booking is created from an unconfirmed load-bearing fact, asserted in code; a caller changing the day after confirmation books the new day with both values recorded; a spelled surname is correct; an implausible date is challenged.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Confirming everything.** It is time, money and tedium, and it is why people hate phone menus. Confirm what would be expensive to get wrong. |
| AP-09-b | **Confirming nothing.** Recognition gets surnames and phone numbers wrong routinely, and a booking nobody can reach is worse than no booking. |
| AP-09-c | **Facts that cannot be superseded.** "Actually, make it Friday" is a normal thing to say after a confirmation, and a design that treats confirmation as final breaks on the second real caller. |
| AP-09-d | **Reading a phone number back as one long string.** Ungroupable and uncheckable. Read it back in the grouping the caller used. |

---

## Step 10 — Tools and booking once

**ACC-10** — a dropped call mid-booking followed by a call-back produces one booking; a slot taken between check and booking fails rather than overwrites; every tool call records its duration; a forced tool failure produces speech, never dead air.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **An idempotency key derived from the call.** The caller phones back on a different call. The key comes from the booking's content. |
| AP-10-b | **Trusting the availability check as the source of truth.** Three seconds passed. The booking call decides, and it must fail rather than overwrite. |
| AP-10-c | **Silence during a tool call.** The caller cannot tell whether it is thinking or gone, and they fill the silence by hanging up. |
| AP-10-d | **"An error occurred."** Either an honest human sentence and a retry, or a handover. Never a system message read aloud. |

---

## Step 11 — Handing over to a human

**ACC-11** — an immediate-escalation fixture is transferred with no attempt to help; a caller asking for a person is transferred on the first request; a destination that does not answer produces the defined behaviour; the receiving party gets the established facts.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Escalation built as an error path.** It is the primary outcome at Northgate, and a fallback-quality implementation shows on exactly the calls that matter most. |
| AP-11-b | **Trying once more after the caller asked for a person.** The behaviour people hate most, and it is the one thing they will tell the business about. |
| AP-11-c | **A cold transfer.** A caller repeating everything is worse than never reaching the agent, and it is what makes a business turn the system off. |
| AP-11-d | **Treating a falling escalation rate as success.** At Northgate it means the agent is handling calls it should be handing over. |

---

## Step 12 — The hostile-caller suite

**ACC-12** — removing the immediate-escalation check fails the gas-leak caller; removing the confirmation rule fails the mumbler; every assertion is about an outcome, a fact or an absence rather than exact wording; two runs agree on every deterministic assertion.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Synthesised audio as the test input.** No noise, no hesitation, no accent, no overlap. It is not a difficult caller; it is a clean recording of a difficult script. |
| AP-12-b | **Asserting exact phrasing.** The suite fails on harmless variation and gets disabled within a month. |
| AP-12-c | **Only must-do callers.** Every measure improves by making the agent more willing to help, so the must-never half is what stops it optimising into being agreeable about a gas leak. |
| AP-12-d | **Not adding the caller who defeated you.** Real failures belong in the suite more than anything you invented. |

---

## Step 13 — Voice failure modes

**ACC-13** — no fixture call contains silence beyond the stated maximum; a silent caller is prompted twice and closed politely; a forced synthesis failure produces speech; hang-up stops all generation within the threshold; killing the process leaves a call with an outcome.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Any path that can produce long silence.** The caller cannot tell thinking from broken from gone. This is the failure with no equivalent in text. |
| AP-13-b | **No turn or duration limit.** An agent that re-asks the same question forever is possible, expensive on four meters, and unbearable. |
| AP-13-c | **Continuing after hang-up.** Money spent generating audio for nobody, and a nonsense outcome recorded. |
| AP-13-d | **Calls left without an outcome.** Every call ends as abandoned, escalated, completed or failed — including when the process died. |

---

## Step 14 — Four meters

**ACC-14** — every call in a suite run has all four meters attributed and the per-provider sums match; an escalated call appears with the cost incurred before transfer.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Assuming the model is the biggest meter.** Speech out usually is, and optimising the wrong meter is the specific failure this step prevents. |
| AP-14-b | **Reporting cost per minute only.** A client thinks in calls, and a forty-second wrong number and a three-minute booking cost very differently. |
| AP-14-c | **Leaving the caller suite out of the bill.** It is ten real calls through four meters, several times a day — the most expensive test suite in this catalog. |
| AP-14-d | **Comparing against a software price.** The comparison a client makes is an answering service per call, or a receptionist's hour. |

---

## Step 15 — Making it cost less

**ACC-15** — cost per completed call falls against the step 14 baseline while every must-never assertion still passes and the ninety-fifth percentile time to first audio stays inside budget; every change has a before-and-after on both gates.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **Trading latency for cost.** A slower agent is interrupted more and has worse calls. Both gates apply, and this is the only material in the catalog where that is true. |
| AP-15-b | **Optimising prompt tokens first.** It is the third or fourth largest meter. Saying less is first, and it improves the conversation as well. |
| AP-15-c | **Not caching fixed utterances.** The greeting, the disclosure and the hold phrases are identical every call, and caching them removes cost *and* first-audio latency at once. |
| AP-15-d | **An unbounded conversation history.** A twelve-turn call re-sends everything each turn for value that turn three no longer has. |
| AP-15-e | **Two changes in one experiment.** They cancel out across two gates and the run teaches nothing. |

---

## Step 16 — Numbers, hours, and failure

**ACC-16** — with the agent stopped, a call still reaches the fallback destination; a call outside hours follows the client's rule; calls beyond the concurrency limit fall back rather than queue; no secret appears in a log or transcript.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Failover implemented in your code.** Your code is the thing that is down. It belongs in the telephony provider's routing. |
| AP-16-b | **The number in your account instead of the client's.** If they leave, their phone number leaves with you, and moving a number later is slow and sometimes impossible. |
| AP-16-c | **Queueing at the concurrency limit.** A caller listening to silence because you are full is a missed call with extra steps. |
| AP-16-d | **An on-call rota in code.** It changes weekly, and being wrong at 02:00 is worse than having no system. |

---

## Step 17 — Drift and the monthly report

**ACC-17** — a sustained shift in escalation rate, abandonment or latency percentile alerts against that client's own baseline; a call added from a real failure runs unchanged in the suite; the scheduled run fails loudly on a must-never regression.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Not listening to calls.** No dashboard tells you what a transcript does, and the random sample of *successful* calls is where the surprises are. |
| AP-17-b | **Reading a falling escalation rate as improvement.** At Northgate it is a warning, and the report needs a sentence saying which direction is good. |
| AP-17-c | **Investigating a rising abandonment rate as a conversation problem.** It is usually latency. Check the percentiles first. |
| AP-17-d | **A monthly report that does not lead with calls answered.** For a business that was missing calls, that first line is the entire argument for the system. |
