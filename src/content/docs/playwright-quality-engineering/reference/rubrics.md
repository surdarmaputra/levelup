---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items each step's **Verification** block only names by ID — a lookup you read one section of per step.

**`ACC-NN`** is the gating acceptance test: unambiguous pass/fail. **`AP-NN-x`** are named mistakes that pass the test and are still wrong.

**Why this exists.** Testing work reports on itself. A suite that checks nothing passes, and looks exactly like one that checks everything. So most acceptance tests here are stated as detection: switch these defects on, and the suite must go red and say which one.

**How to use it — three times per step:** read `ACC-NN` before building and know the bar; self-check every `AP-NN-x` once it passes; paste **only that step's section** into the [reviewer](../../setup/reviewer-setup/).

---

## Step 0 — What a failure costs

**ACC-00** — every product has at least six failure modes with direct cost, recovery cost, detection delay, frequency and non-money consequence filled in, each with a stated source; the ranking is across all three products; at least three failure modes are on an explicit "accepted, not tested" list with reasons.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Ranking by severity alone.** A catastrophic failure needing three rare conditions can matter less than a small daily one. Frequency is a column, not a footnote. |
| AP-00-b | **Ignoring detection delay.** A storefront bug is reported in twenty minutes; a wrong patient letter may surface in six months. The same direct cost is a different problem. |
| AP-00-c | **One cost model for all three products.** A wrong total, a leaked record and a misrouted lorry are not comparable on one scale, and pretending they are hides the product that needs the most attention. |

---

## Step 1 — What to test, and where

**ACC-01** — every strategy entry references a failure-mode ID from `docs/risk-model.md` and says why the next-cheaper level cannot answer the question; the "not automated" list has at least five entries with reasons; the oracle is stated for Trailhead's totals, Beechwood's letters and Polaris's allocation.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Quoting the pyramid instead of deriving it.** The shape follows from what each level costs and what it can answer in *these* products. A ratio inherited from a conference talk is not a strategy. |
| AP-01-b | **A test that points at no risk.** Either the risk is missing from step 0 or the test should not exist. Both are findings. |
| AP-01-c | **No oracle.** If nobody can say what the correct answer is, the test asserts current behaviour and will defend a bug forever. |
| AP-01-d | **No "not automated" list.** A strategy that implies full coverage gets treated as if it delivers it, and the gaps are discovered by a customer. |

---

## Step 2 — Environments, test data, and what you may use

**ACC-02** — the document forbids production copies without exception and states what replaces them per product; the isolation model says what a worker owns; the third-party position covers the payment provider and both carriers; the environment matrix says which environments may be shared and what breaks when they are.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **"Anonymised production data."** Free-text fields carry what the schema does not, re-identification is easier than people think, and every restore re-imports the problem. |
| AP-02-b | **Pretty data instead of awkward data.** Test data exists to hit edges: long and accented names, a patient at two clinics, a consignment with no weight. Tidy sample rows prove nothing. |
| AP-02-c | **Shared mutable state across workers.** Eight workers on one dataset produces real failures that nobody can reproduce, and the suite gets blamed instead of the setup. |

---

## Step 3 — What "ready to release" means

**ACC-03** — every condition names its source and owner and is marked blocking or warning with a reason; the three products have different bars and the difference is explained; there is a written accepted-failure path; the release record template fits on one page and contains no test-runner jargon.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Everything blocks.** A gate with no warnings is bypassed within a month, and then nothing blocks. |
| AP-03-b | **No accepted-failure path.** Real releases ship with known defects. Without a recorded route for that, people route around the gate instead. |
| AP-03-c | **"QA signs off" as a condition.** That is a person, not a criterion. Name what they are checking and where it comes from. |
| AP-03-d | **One bar for all three products.** Trailhead can fix in an hour; Beechwood needs evidence someone signs; Polaris cannot recall a lorry. Same bar means one product is over-tested and another under-tested. |

---

## Step 4 — Tooling and the products under test

**ACC-04** — every catalogue defect switches on individually and reproducibly, and the products behave identically with all flags off; `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a trace is produced for every run; the sleep rule fails a commit containing `waitForTimeout`.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **A defect catalogue documented by cause.** Reading the implementation before writing the test turns detection into transcription. Symptom only. |
| AP-04-b | **Test code exempt from the lint and type rules.** A helper accepting `any` accepts the wrong shape and passes. The suite is production code for the team that depends on it. |
| AP-04-c | **Adding the sleep ban later.** At step 4 it is a config line. At step 10 it is a hundred rewritten tests, so it does not happen. |
| AP-04-d | **Unseeded defect injection.** A defect that appears randomly makes every result ambiguous. One flag, one behaviour, every time. |

---

## Step 5 — The first journey

**ACC-05** — with `TRAIL-DISCOUNT-ROUNDING` on, the test fails and the message names expected and actual totals; with all flags off it passes ten consecutive runs; no fixed wait appears in it; the journey completes in under thirty seconds.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **Asserting the page, not the value.** "Confirmation is visible" passes with a penny wrong in the total. This is the single most common way a suite proves nothing. |
| AP-05-b | **Setting up state through the interface.** Registering by filling a form adds a second reason for the test to fail and minutes to every run. |
| AP-05-c | **Locators tied to structure.** A CSS path through four `div`s breaks when the layout changes and the behaviour does not. |
| AP-05-d | **A failure message only its author can read.** This runs at 02:00 for someone else. "Something went wrong in checkout" costs them an hour. |

---

## Step 6 — A suite that survives

**ACC-06** — the whole suite passes with `--shuffle` at maximum workers, three consecutive runs; any single test passes alone; deleting any one test does not break another; no test reads data created by another test.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **Order dependency.** A test relying on an earlier one cannot be run alone, in parallel, or trusted when it fails. Every suite has this until the shuffle run proves otherwise. |
| AP-06-b | **An abstraction that hides *what* failed.** Helpers may hide how a screen is driven. A `verifyEverything()` that wraps ten assertions turns a precise failure into a vague one. |
| AP-06-c | **Shared records across workers.** Per-worker namespaces or intermittent failures. There is no third option. |
| AP-06-d | **Test names that mean nothing in a report.** You read them where no other context exists. `test checkout 3` is a name you will curse. |

---

## Step 7 — The API level and the data factory

**ACC-07** — with `TRAIL-DISCOUNT-ROUNDING` and `BEECH-LETTER-LEAK` on, the API layer catches both and names the field; every strategy entry marked "API" has a test referencing its risk ID; the API suite completes in under ninety seconds; a killed run leaves no records the next run can see.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Testing business rules through the browser** because the journey already exists. Slower, flakier, and it fails for reasons unrelated to the rule. |
| AP-07-b | **Asserting the current response instead of the contract.** Hardcoding today's payload passes forever and says nothing about tomorrow's. |
| AP-07-c | **Happy paths only.** Most of the value at this level is the six branches of a validation rule, and they are cheap here and expensive anywhere else. |
| AP-07-d | **A shared sample-data file.** It becomes a dependency nobody can change, and every test quietly relies on a different part of it. |

---

## Step 8 — Testing a service with no interface

**ACC-08** — with `POLARIS-DOUBLE-BOOK` on, the duplicate-delivery test fails and reports two consignments; with `POLARIS-CUTOFF-OFF-BY-ONE` on, the boundary test fails and names the timestamp; no fixed sleep appears in the Polaris suite; the whole Polaris suite runs in under two minutes.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Sleeping for asynchronous work.** It is slow when it works and flaky when it does not, and it is the first thing anyone reaches for. |
| AP-08-b | **A timeout message with no state.** "Timed out after 5s" tells you nothing. "…waiting for ALLOCATED, last saw PENDING" tells you where to look. |
| AP-08-c | **Testing a boundary with the real clock.** A 16:00 cut-off tested by waiting until 16:00 runs once a day and is disabled by the end of the week. |
| AP-08-d | **Only in-order, once-only delivery.** Production delivers twice and out of order. A suite that never does has not tested the queue at all. |

---

## Step 9 — Contracts, stubs and third parties

**ACC-09** — with `POLARIS-CONTRACT-DRIFT` on, provider verification fails and names the field while the hand-written stub would have passed; removing a field a consumer uses fails the provider build; the scheduled recording check fails when the sandbox response shape changes.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Provider-written contracts.** A contract stating what the provider sends is documentation. The test is what the consumer needs. |
| AP-09-b | **Hand-written stubs nobody verifies.** They agree with what you believed the day you wrote them and report success forever afterwards. |
| AP-09-c | **Contracts over the whole payload.** They fail on changes that do not affect you, and a contract that cries wolf is ignored. |
| AP-09-d | **Replacing end-to-end tests entirely.** A few still earn their place. Contracts reduce them from fifty to five, not to zero. |

---

## Step 10 — Flake is a defect

**ACC-10** — the full suite passes a hundred-run repeat with zero non-quarantined failures; every quarantined test has an owner and an expiry, and the build warns when one expires; a retried test appears in the report as a flake, not a pass; with `TRAIL-STOCK-OVERSELL` on, the race test fails consistently.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Retrying instead of diagnosing.** Retries hide race conditions, which are exactly the bugs that present as intermittent. `TRAIL-STOCK-OVERSELL` is one. |
| AP-10-b | **Quarantine with no expiry.** It becomes a graveyard of tests nobody trusts and nobody deletes, and the risks they covered are silently uncovered. |
| AP-10-c | **Assuming the test is wrong.** Sometimes the product is genuinely intermittent and the test is the only thing that noticed. Rule that in or out first. |
| AP-10-d | **No flake rate.** Without the number, every conversation about flake is anecdote and the loudest opinion wins. |

---

## Step 11 — Accessibility, personal data and evidence

**ACC-11** — with `BEECH-FOCUS-TRAP` on, the automated checks pass and the documented keyboard pass catches it, and that outcome is written down as the reason the manual pass exists; a new contrast violation fails the build; the release record generates from a run with no hand editing.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Treating `axe-core` as the accessibility test.** It finds perhaps a third of real barriers and none of the ones that make a journey impossible. |
| AP-11-b | **Existing violations ignored rather than baselined.** Ignored means invisible. A recorded baseline means new ones fail and old ones have a number attached. |
| AP-11-c | **Forgetting the artefacts hold the data.** Screenshots and traces contain whatever was on screen. Retention and access apply to them as much as to the database. |
| AP-11-d | **A release record assembled by hand.** Anything assembled at 17:00 on a Friday is assembled wrong, and it is exactly then that it matters. |

---

## Step 12 — Exploratory testing

**ACC-12** — six sessions with charters, time boxes and notes; at least three findings the automated suite missed, each reproducible from a stated starting state; each finding has a written automate-or-not decision with a reason.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Clicking around and calling it exploratory.** No charter, no time box, no notes: nothing that can be reviewed, handed over, or repeated. |
| AP-12-b | **A bug report without a starting state.** That is what "cannot reproduce" usually means, and finding the missing precondition is part of the report. |
| AP-12-c | **Automating every finding.** The suite bloats with one-offs in features being replaced. Decide deliberately and write the reason down. |
| AP-12-d | **Exploring only the happy path you already automated.** The value is in the interrupted flow, the second tab, the back button and the thing "nobody would do". |

---

## Step 13 — Performance testing

**ACC-13** — each product has a written question, a workload model with rates and think times, and a threshold that fails the run when breached; a deliberately slow query makes the Trailhead scenario fail on p95 rather than on the average; results from at least five builds are stored and comparable.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **Measuring without a question.** "Is it fast?" produces a graph nobody acts on. A number, a condition and a consequence, or do not run it. |
| AP-13-b | **Averages.** They hide the slowest ten percent, which is where every complaint comes from. |
| AP-13-c | **A user count instead of a workload model.** Three hundred browsing and three hundred checking out are different systems under load. |
| AP-13-d | **Treating laptop numbers as production numbers.** Absolute values mean little here; the trend between builds on the same environment is what you gate on. |

---

## Step 14 — Permissions, proved

**ACC-14** — with `BEECH-LETTER-LEAK` on, the matrix fails and names the role, resource and clinic; every role–resource–action combination has an explicit allow or deny; adding a role generates its cases without new test code; horizontal cases exist for all three products.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **Only vertical checks.** "Can a receptionist do this" misses "can *this* receptionist do it to *that* clinic's patient", which is the case that leaks. |
| AP-14-b | **Route-level guards only.** A protected route with an unprotected record turns identifiers into a browsing interface. |
| AP-14-c | **Hand-written cases.** Roles times resources times actions is hundreds of rows; written by hand it is incomplete on the day it is finished. |
| AP-14-d | **Unspecified denials.** 403 and 404 are both defensible answers and they leak different things. Choosing without deciding is not. |

---

## Step 15 — The pipeline, inside a budget

**ACC-15** — a pull request pipeline completes inside the stated budget and a deliberately slowed test makes the budget check fail; shards differ in duration by under twenty percent; the merged report names the failing test and links its trace; a change that skips a test under selection is caught by the full run on main.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **A budget with no check.** Thirty seconds a week is invisible until the pipeline is unusable, and then it is too large to fix. |
| AP-15-b | **Sharding by file count.** One shard finishes in two minutes and another in nine, and you pay for the slowest. Balance by measured duration. |
| AP-15-c | **Test selection on the release build.** Selection is a risk taken for speed on a pull request. Before a release, everything runs. |
| AP-15-d | **A gate that can be merged past.** Without required checks it is a suggestion, and suggestions lose to deadlines. |

---

## Step 16 — The gate and the release record

**ACC-16** — every blocking condition in `docs/release-readiness.md` blocks when breached and nothing outside the document blocks anything; an accepted failure passes the build and appears in the record with the acceptor's name; the detection-rate run reports caught and missed per catalogue defect; the release record generates with no manual editing.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **Conditions invented in the pipeline.** If it is not in the readiness document, it has not been agreed, and the argument happens at the worst possible moment. |
| AP-16-b | **Reporting line coverage as quality.** It rises when you test getters. Detection rate against the catalogue is the number that means something. |
| AP-16-c | **A record full of runner output.** The reader signs releases; they do not know what a fixture is. One page, plain language, a decision. |
| AP-16-d | **Never blocking a build.** A gate that has never stopped anything is untested. Block one deliberately and keep the record. |

---

## Step 17 — After the release

**ACC-17** — each synthetic check runs on schedule, cleans up after itself and alerts with a runbook link on failure; a worked escaped-defect review exists with a category and a resulting change; the catalogue contains the escapes and detection rate covers them; the monthly report generates with an actions column; the handover document lets someone else run a release without asking you.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Synthetic checks that touch real records.** A check that creates real orders or reads real patients is an incident waiting for a bad night. |
| AP-17-b | **Alerts nobody acts on.** A synthetic failure that pages nobody is a log line; one that pages twice a week for a timeout gets muted, and so does the real one. |
| AP-17-c | **An escaped defect that only produces a test.** Sometimes the risk was never identified, or the level was wrong. Writing one test at the same wrong level repeats the escape. |
| AP-17-d | **Never deleting a test.** A test whose risk no longer exists costs runtime and maintenance forever. Owning the suite includes removing from it. |
