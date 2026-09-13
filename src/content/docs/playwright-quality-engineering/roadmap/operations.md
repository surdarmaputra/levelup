---
title: Operations
description: Step 17. Life after the release — synthetic checks in production, the escaped-defect review that changes the suite, the monthly report, and handover.
sidebar:
  order: 7
---

## Step 17 — After the release

**Story:** *As the quality engineer, a bug that reached a customer changes the suite within a week, and I can hand all of this to someone else.*

**Mode:** `BUILD` — the loop that keeps the previous seventeen steps from going stale.

**Why now:** Last. Everything before it decides what ships; this decides what happens once it has.

**Concepts:**
- **Testing does not stop at the gate.** Production is an environment your suite never sees: real data volumes, real third parties, real traffic patterns. A small number of checks running against it catches what no pre-release test can.
- **Synthetic checks, chosen narrowly.** One journey per product, on a schedule, on real infrastructure: a Trailhead checkout with a test card, a Beechwood login and appointment read, a Polaris consignment through a carrier's sandbox. They must be safe to run repeatedly and must clean up after themselves.
- **What a synthetic check may touch.** No real customer records, no real payments, a clearly marked test account, and a documented answer to "what if this runs while production is broken".
- **The alert has to reach a person and mean something.** A synthetic failure at 03:00 that pages nobody is a log line. One that pages someone twice a week for a timeout gets muted, and then the real one is muted too.
- **The escaped-defect review.** Every defect that reached a customer gets one question: why did nothing catch it? The answer is one of four — the risk was not identified, the level was wrong, the test existed and was weak, or it was a deliberate accepted gap. Each has a different fix, and only one of them is "write a test".
- **Every escape becomes a catalogue entry.** Add it to the defect catalogue so that detection rate measures it forever, not once.
- **The monthly report.** Detection rate, escaped defects with their four categories, flake rate, pipeline duration against budget, and what changed as a result. One page. The last column is the one that matters: a report with no actions is a report nobody reads twice.
- **Handover.** Someone else has to run this. The strategy, the data rules, the flake policy, the gate conditions, the catalogue and the runbook for a red pipeline at 02:00 — written, in the repository, current.
- **When to delete tests.** A test whose risk no longer exists, or which has never failed for a real reason in a year, costs runtime and maintenance. Deleting it deliberately is part of owning the suite; letting it rot there is not.

**Libraries:** the scheduler in CI, an alerting channel, the reporter

**Expected outcome:** One synthetic check per product running on a schedule against a production-like environment, cleaning up after itself, alerting a person on failure with a runbook link. A written escaped-defect review process with the four categories and a worked example. The defect catalogue extended with at least two escapes. A one-page monthly quality report, generated, with an actions column. A handover document covering strategy, data, flake policy, gate, catalogue and the 02:00 runbook. A written rule for deleting tests, applied to at least three.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — each synthetic check runs on schedule, cleans up, and alerts with a runbook link on failure; a worked escaped-defect review exists with a category and a resulting change; the catalogue contains the escapes and detection rate covers them; the monthly report generates with an actions column; the handover document lets someone else run a release without asking you. |
| **L2 — Manual checks** | (a) Hand the handover document to someone who has not worked on this and have them run a release. Every question they ask is a missing section. <br>(b) Read your last three months of reports as a manager. If nothing visibly improved, either the numbers are wrong or the actions were not taken. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and an escaped defect has already changed the suite once |
