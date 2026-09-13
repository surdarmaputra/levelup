---
title: Release
description: Steps 15–16. A pipeline that finishes inside a budget, and a gate that blocks a build for a stated reason.
sidebar:
  order: 6
---

## Step 15 — The pipeline, inside a budget

**Story:** *As a developer, I get an answer from the pipeline in under twelve minutes, so I wait for it instead of merging around it.*

**Mode:** `BUILD` — mechanics, with one decision that is not mechanical: the budget.

**Why now:** The suite is now large enough to be slow. Every suite gets slower until people stop waiting for it, and the budget is what stops that.

**Concepts:**
- **A runtime budget is a commitment, not an aspiration.** Pick the number a developer will actually wait for, write it down, and fail the build when it is exceeded. Without the check, the pipeline grows by thirty seconds a week and nobody can name the week it became unbearable.
- **Stages by cost and signal.** Lint and types in seconds; unit and contract tests next; API tests; browser journeys; the performance smoke. Fail fast on the cheap ones so a typo does not cost twelve minutes.
- **Sharding is how browsers get fast.** Split the journeys across parallel jobs, merge the reports into one. Uneven shards are the usual waste — balance by measured duration, not by file count.
- **Selection, carefully.** Running only the tests affected by a change is a real gain and a real risk: a wrong dependency map silently skips the test that mattered. Selection on pull requests, everything on the main branch, always everything before a release.
- **Caching that helps and caching that lies.** Cache dependencies and browser binaries. Never cache test results in a way that lets a change skip a check it should have run.
- **Artefacts from every run**: traces for failures, the merged report, performance results, the accessibility output. These are the evidence for step 16, and they need retention limits.
- **The failure a developer reads.** The report has to say which test, in which product, with the trace one click away. Anything slower than that gets triaged by re-running.
- **Required checks.** The gate only exists if the branch protection enforces it. A gate that can be merged past is a suggestion.

**Libraries:** GitHub Actions, Playwright sharding and the merged reporter, k6 from step 13

**Expected outcome:** A staged pipeline with fail-fast ordering, sharded browser jobs balanced by measured duration, a merged report, artefacts with retention, dependency and browser caching, test selection on pull requests with everything on main, and a runtime budget checked by the pipeline itself. Required checks configured on the branch.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — a pull request pipeline completes inside the stated budget, and a deliberately slowed test makes the budget check fail; shards differ in duration by less than twenty percent; a merged report names the failing test and links its trace; a change that skips a test under selection is caught by the full run on main. |
| **L2 — Manual checks** | (a) Break one test and go through the pipeline as a developer who did not write it. Time how long it takes to know what broke. Anything over two minutes is a reporting problem. <br>(b) Try to merge with a failing required check. If you can, the gate does not exist yet. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and the budget is a number the team has agreed to |

---

## Step 16 — The gate, and the release record

**Story:** *As the person who signs the release, I block a build on Friday afternoon and point at the line that says why.*

**Mode:** `LEARN` — the definition from step 3 becomes a mechanism, and the judgement in it is the whole step.

**Why now:** Everything the gate reads now exists. This is where the material's deliverable is produced.

**Concepts:**
- **The gate implements step 3 and nothing else.** If a condition is not in `docs/release-readiness.md`, it does not block. If it is, it does. The place to argue is the document, not the pipeline at 17:00.
- **Blocking, warning, and the honest difference.** Functional failures and authorisation failures block everywhere. A Trailhead performance threshold missed by a small margin warns and is recorded, because a fix ships in an hour. New accessibility violations on Beechwood block, because the document says the obligation is legal. Polaris's cut-off tests block at any margin, because a lorry cannot be recalled.
- **Accepted failures, recorded not hidden.** A known defect can ship if someone names it and accepts it, and the acceptance goes in the record with who made it. Systems without this path get lied to.
- **Detection rate, the honest coverage number.** Run the pipeline against the defect catalogue: defects switched on, defects caught. That percentage is what your suite is worth, and it is the number to report instead of line coverage.
- **The metrics that mean something**: escaped defects per release, detection rate, flake rate, time from red to diagnosis, and pipeline duration against budget. Five numbers, each with an action attached.
- **The metrics that mislead.** Line coverage rises when you test getters. Test count rises when you duplicate. Bug counts fall when people stop reporting. Say plainly in the report why these are not used.
- **The release record is one page in plain language**: what ran, what failed, what was accepted and by whom, the accessibility and performance status, and the decision. A person who does not know what Playwright is has to be able to read it.
- **A gate that is never invoked is not trusted, it is untested.** Block a build deliberately, on purpose, and keep the record.

**Libraries:** the reporter, the defect catalogue runner, the pipeline from step 15

**Expected outcome:** A gate implementing the step 3 conditions per product, blocking or warning with a stated reason. An accepted-failure path recording the name and the acceptor. A detection-rate run against the full defect catalogue, reported per release. A generated one-page release record per build in plain language. Two records kept as the portfolio artefact: one build passed, one build blocked.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — every blocking condition in `docs/release-readiness.md` blocks a build when breached, and no condition outside the document blocks anything; an accepted failure lets the build through and appears in the record with the acceptor's name; the detection-rate run reports caught and missed per catalogue defect; the release record generates with no manual editing. |
| **L2 — Manual checks** | (a) Give a blocked build's record to someone non-technical and ask what they would do next. If they cannot say, rewrite it. <br>(b) Look at every catalogue defect the suite missed. For each, decide: a test, an accepted gap, or a risk the strategy was wrong about. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and you have one record of a build you blocked and one of a build you passed |
