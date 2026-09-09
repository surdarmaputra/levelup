---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items each step's **Verification** block only names by ID — a lookup you read one section of per step.

**`ACC-NN`** is the gating acceptance test: unambiguous pass/fail. **`AP-NN-x`** are named mistakes that pass the test and are still wrong.

**Why this exists.** A browser bot that is subtly wrong looks identical to one that is right: the run went green and the value was wrong. The rubric turns "done" into something you check.

**How to use it — three times per step:** read `ACC-NN` before building and write that test first; self-check every `AP-NN-x` once it passes; paste **only that step's section** into the [reviewer](../../setup/reviewer-setup/).

---

## Step 0 — What the clicking costs

**ACC-00** — every client has a labour cost, a wrong-entry cost and an estimated monthly maintenance cost, all derived rather than asserted.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **No maintenance estimate.** This technique needs looking after. A business case that ignores your own hours is the one that turns out unprofitable in month three. |
| AP-00-b | **One wrong-entry cost for all three clients.** A duplicate order, a wrong regulatory return and a mis-scheduled patient are different events implying different amounts of verification. |
| AP-00-c | **Counting the task instead of the screens.** Nine screens per item is a different problem from one screen ninety times, and only the second is worth automating in the obvious way. |

---

## Step 1 — Why RPA breaks

**ACC-01** — the document states the ladder in order, gives the reason the model runs last in terms of signal rather than cost alone, and names an expected first breakage per client.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Justifying model-last on cost only.** The stronger reason is that a locator failing is a signal an interface changed, and model-first discards it. |
| AP-01-b | **Treating semantic locators as a minor detail.** They are the largest of the three changes that made this technique viable, and they are not the AI part. |
| AP-01-c | **Self-healing with no report.** Recovery buys the night. Without a report the drift accumulates until it fails completely, at a moment nobody chose. |

---

## Step 2 — What you could buy instead

**ACC-02** — the document records per client whether an API or export exists and how you established it, names four real vendor products with dates, and gives a per-client recommendation with a one-sentence deciding reason.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Not checking for an existing API.** A surprising share of "there is no API" is "nobody asked". Picking the lock beside an unlocked door is not a technique, it is an oversight. |
| AP-02-b | **Implying vendor bots do not break.** They break on interface changes too. The licence buys orchestration and support, not immunity. |
| AP-02-c | **Undated pricing.** Enterprise pricing moves and is often unpublished. Record what you verified and when. |

---

## Step 3 — Authorisation and refusal

**ACC-03** — every client has a named authoriser, a reference to the terms consulted, an account arrangement, pacing rules and permitted hours; the refusal list has at least four entries with reasons.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Automating a third party's system on the client's say-so alone.** The client is a customer with credentials. The supplier's terms govern automated access, and asking is cheap. |
| AP-03-b | **A bot using a real person's account.** It makes the client's audit trail wrong and turns that person leaving into a crisis. |
| AP-03-c | **Pacing treated as a performance setting.** You are consuming someone else's production capacity. A bot that behaves keeps its access. |
| AP-03-d | **Pointing any test at a live third-party site.** Not a sandbox, not "just to check". The material ships the target for exactly this reason. |

---

## Step 4 — Tooling and the legacy portal

**ACC-04** — every listed portal behaviour can be forced deterministically from a test; `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a trace is produced for every run.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **A well-behaved portal.** A clean fixture means every later test passes for the wrong reason and the vendor update at step 11 has nothing to break. |
| AP-04-b | **Unseeded randomness.** Unreproducible failures make the suite flaky, and a flaky suite is disabled within a week. |
| AP-04-c | **Reading the vendor update early.** Knowing what changes in advance defeats step 11 entirely. Write it, flag it, do not look. |
| AP-04-d | **Developing headless only.** Watching a bot work is the fastest debugging available, and headed-versus-headless differences are real. |

---

## Step 5 — The ledger and evidence store

**ACC-05** — a second remote write with the same natural key is rejected by a database constraint; every evidence item has a retention date and the job removes expired items; an unmasked screenshot cannot be stored for a client that requires masking.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Waiting for the remote system to provide a key.** It will not. The natural key is made from the client's own data and recorded before you act. |
| AP-05-b | **Evidence as a folder of files.** Without an index, a retention date and a record of what each image shows, it is storage, not evidence. |
| AP-05-c | **Retention decided later.** Later means never, and by then the store holds a year of patient names. |
| AP-05-d | **Not recording the rung used.** That one field makes the ladder measurable and drift visible. Adding it retrospectively means starting the measurement from zero. |

---

## Step 6 — The first read flow

**ACC-06** — a forced session expiry mid-run re-authenticates and resumes at the interrupted step; three pages of appointments are all returned, asserted individually; a failed page load produces a distinct outcome from an empty list; no fixed-duration sleep appears in the flow.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **Waiting for a duration.** The single most common cause of a flaky bot. Wait for a condition. |
| AP-06-b | **Position-relative table reading.** The portal changes column order between two screens on purpose, and a real one will too. |
| AP-06-c | **Conflating empty with failed.** The clinic is told there is nothing tomorrow on a day that is full, and nothing errors. |
| AP-06-d | **Restarting the run after re-authentication.** Harmless on a read. The same reflex on a write flow is a duplicate. |

---

## Step 7 — The resilience ladder

**ACC-07** — no model call occurs when a semantic locator succeeds, asserted across a full run; a deliberately broken locator causes rung 2 then rung 3 in order with the rung-3 use reported exactly once; no locator depends on a generated id.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Model-first.** Slower, costlier, non-deterministic, and it hides the interface change that the locator failure would have told you about. |
| AP-07-b | **Generated ids or long structural chains as locators.** They break on the next deploy, which the portal demonstrates deliberately. |
| AP-07-c | **A rung-3 success that never becomes a locator fix.** The bot is then permanently dependent on the fallback and the rate never returns to zero. |
| AP-07-d | **Sending an unmasked screenshot to the model.** The fallback path is exactly where a privacy rule gets forgotten. |

---

## Step 8 — The first write

**ACC-08** — running the same day's orders twice results in one order per line at the portal, verified by reading the portal; a forced crash between submit and record results in the next run finding the existing order; two matching orders on verification stops with an intervention.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Trusting your ledger alone.** It records what you believe you did. After a crash between submit and record, only the remote system knows. |
| AP-08-b | **No verify-after-write.** The portal returns to a list with no confirmation. "The screen said saved" is not evidence on a system with no API. |
| AP-08-c | **Retrying blindly on an unverified write.** This is how a supplier receives four orders. One retry, then stop. |
| AP-08-d | **Resolving an ambiguous verification automatically.** Two matching orders is a person's decision, not a heuristic's. |

---

## Step 9 — The irreversible submission

**ACC-09** — a forced failure on page four applies the written policy and records no partial filing as complete; retrying past the point of no return is structurally refused; summary validation fails the run on a differing value; both evidence images exist for a successful filing.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **No named point of no return.** It is a specific button on a specific page. Without naming it, retry logic will eventually cross it. |
| AP-09-b | **Resuming a draft without reading it back.** The half-filled return may not contain what you assume, and filing it is irreversible. |
| AP-09-c | **Validating after submission.** The summary page exists to be checked before confirming, which is what a person doing this manually also does. |
| AP-09-d | **A dry run that does not stop exactly at the boundary.** Either it files something, which is catastrophic, or it stops early and proves less than it claims. |

---

## Step 10 — Personal data on screen

**ACC-10** — no stored screenshot or trace from a Kestrel run contains an unmasked name; a forced exception produces a log entry with no page content; a rung-3 fallback sends a masked image; retention removes Kestrel evidence past its window.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Masking after capture.** The unmasked image existed and was written somewhere. Mask in the page, then capture. |
| AP-10-b | **Forgetting the trace.** It records DOM snapshots, so a trace of a clinic run is a full copy of the appointment list. |
| AP-10-c | **Exceptions carrying page content.** An error object with the page's HTML in an error tracker is the most common real breach in this kind of work. |
| AP-10-d | **Capturing everything because it might be useful.** Decide what question the evidence must answer, then capture the minimum that answers it. |

---

## Step 11 — The vendor update

**ACC-11** — all three flows pass against both the original and the updated portal in CI; a rung-3 fallback that cannot find the element produces a rung-4 stop rather than a best guess; after repair, a full run on the updated portal makes zero model calls.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Reading the diff before running.** The exercise is triage from failures, which is what the real morning looks like. |
| AP-11-b | **Only looking at what failed.** A silent wrong success — a field filled from a moved label — is worse than a failure and it is what to look for first. |
| AP-11-c | **Leaving the bot on rung 3.** Healing buys the night; the commit is the fix. A permanent fallback is a permanent cost and a blind spot. |
| AP-11-d | **A rung-3 prompt that cannot say "not present".** It will find *a* button, and the ladder will confidently do the wrong thing. |

---

## Step 12 — Unattended runs

**ACC-12** — a run that does not happen raises an alarm within its window; two concurrent runs of a write flow cannot both proceed; a Halden run whose order count does not match its input fails a sanity check; the evidence pack contains every screenshot, value and reference.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **No missing-run alarm.** A failure generates a signal; a run that never started generates nothing, and that is the failure people discover in month three. |
| AP-12-b | **No sanity checks.** They catch the runs that succeed and are wrong, which no error handler will ever see. |
| AP-12-c | **A schedule at a fixed instant.** A five-minute delay becomes a missed filing. Use a window. |
| AP-12-d | **An alert that says "run failed".** It causes a login, not a decision. Flow, client, step, evidence, deadline pressure. |

---

## Step 13 — Where the money goes

**ACC-13** — every run in a week of unattended operation is attributed to a client and flow with duration, rung usage, interventions and model cost; attributed model cost matches the provider figure for the period.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Leaving your own hours out.** Human intervention is the dominant cost of this technique. A cost report without it describes a different system. |
| AP-13-b | **Treating the model bill as the AI cost.** It is the smallest number on the page. Its main value is as a drift alarm. |
| AP-13-c | **Not recording five-minute interventions.** They are most of the total, and they are the ones nobody logs. |
| AP-13-d | **Adopting an observability platform for four model calls a month.** Check what it costs to run; several want more memory than the browser. |

---

## Step 14 — Making it cost less

**ACC-14** — interventions per hundred runs fall against the step 13 baseline while all three flows still pass on both portal versions; no politeness pacing limit was reduced; every change has a recorded before-and-after.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Optimising the model spend.** It is the last lever by size. Interventions are the first, and they are not usually thought of as a cost optimisation at all. |
| AP-14-b | **Reducing politeness pacing to save time.** That limit came from step 3 and is not a performance budget. It is how the bot keeps its access. |
| AP-14-c | **Trimming verification for wall-clock.** A page load prevents a duplicate order. This is the one place to spend more. |
| AP-14-d | **Removing a wait that seemed unnecessary.** The classic way a bot becomes flaky on a slow night, and the suite is what catches it. |
| AP-14-e | **Two changes in one experiment.** They cancel out and the run teaches nothing. |

---

## Step 15 — Deploy, handover, and stopping

**ACC-15** — a full rebuild from git, backups and documented secrets reproduces every flow and passes the two-portal suite; a rising rung-3 rate on one flow alerts against that flow's own baseline; no credential appears in any screenshot, trace, log or ledger row across a week.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **An unpinned browser version.** It updates underneath you, changes rendering and timing, and does it on a night you are not watching. This is preventable drift. |
| AP-15-b | **The evidence store left out of backups.** It is "just files" right up until an auditor asks for it. |
| AP-15-c | **Keeping the portal's quirks in your head.** That knowledge was one person's before you arrived. Writing it down is worth more to the client than the code. |
| AP-15-d | **Improvising a two-factor workaround.** Whatever the arrangement, it is made with the client and written down, not invented by you. |
| AP-15-e | **Never revisiting whether the bot should exist.** If an API or export appears, migrating to it is the right advice, and being the person who says so is how you keep the client. |
