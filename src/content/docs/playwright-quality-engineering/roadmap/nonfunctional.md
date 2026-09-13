---
title: Non-functional
description: Steps 13–14. Performance testing that answers a written question, and an authorisation matrix that proves who can see what.
sidebar:
  order: 5
---

## Step 13 — Performance testing that answers a question

**Story:** *As Trailhead Outfitters, I know the checkout holds up on the first morning of the sale, because somebody asked that question and measured the answer.*

**Mode:** `LEARN` — most performance testing produces numbers nobody can act on, and the reason is the question, not the tool.

**Why now:** After the functional suite, because a load test against a broken feature measures nothing. Before the gate, because a threshold that fails a build has to exist first.

**Concepts:**
- **Start with a question somebody will act on.** "Is it fast?" is not one. "Can checkout hold 300 concurrent customers with the 95th percentile under 800ms?" is: it has a number, a condition and a consequence.
- **A workload model, not a number of users.** What are people doing, in what proportion, at what rate, with what think time? Three hundred users browsing is a different system load from three hundred checking out, and the second one is the sale morning.
- **The three questions worth asking**, one per product: Trailhead's sale-morning peak, Beechwood's Monday-morning appointment rush, and Polaris's cut-off surge at 15:55 when everyone submits at once.
- **Percentiles, never averages.** An average hides the slowest ten percent, which is where every complaint comes from. Report p50, p95 and p99, and state which one the threshold uses.
- **Thresholds that fail a build.** A performance test with no pass condition is a graph nobody opens. k6 thresholds turn it into a check, and step 16 decides whether it blocks or warns.
- **What you are measuring against.** Compose on a laptop is not production, so absolute numbers mean little. Trends between builds on the same environment mean a great deal, and that is what you gate on.
- **Where the time goes.** A slow response is a database query, a third-party call, or waiting on a lock. Measure it inside the system, not only at the edge, or you will report "checkout is slow" and stop.
- **Cost and duration.** Performance runs are long. Decide what runs per commit (a short smoke), per night (the full model), and per release.

**Libraries:** k6, with the Compose stack from step 4

**Expected outcome:** One written question per product with a workload model, a scenario implementing it, and thresholds on p95 and error rate. Results stored per build so trends are visible. A short performance smoke for CI and a full nightly run. A written statement of what the environment does and does not tell you about production.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — each product has a written question, a workload model with rates and think times, and a threshold that fails the run when breached; a deliberately introduced slow query makes the Trailhead scenario fail on p95, not on the average; results from at least five builds are stored and comparable. |
| **L2 — Manual checks** | (a) Show a result to a developer and ask what they would change. If they cannot say, the report lacks the internal timings. <br>(b) Run the Trailhead model twice on the same build and compare. If the two runs disagree more than the threshold margin, the environment is too noisy to gate on. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and each number has a decision attached to it |

---

## Step 14 — Permissions, proved

**Story:** *As Beechwood Health, no member of staff can open a patient record belonging to another clinic, and there is a test for every combination.*

**Mode:** `BUILD` — the matrix is mechanical, which is exactly why it is never done by hand.

**Why now:** The highest-consequence defect in the catalogue is `BEECH-LETTER-LEAK`, and it is invisible to every test written so far. Functional tests run as one user and see one user's world.

**Concepts:**
- **Authorisation defects are silent.** Nothing errors. The wrong person simply sees something, and no test written from the happy path will ever notice.
- **The matrix**: every role, against every resource, for every action, with an expected allow or deny. Written out, it is large and boring; generated, it is a table you can read and a suite you can run.
- **Generate the cases, do not write them.** Roles times resources times actions is hundreds of cases. A generated matrix makes adding a role one line and adding a resource one line.
- **Deny is the assertion that matters**, and it needs to be specific: 403 rather than 404, or 404 deliberately to avoid confirming a record exists. Both are defensible; picking without deciding is not.
- **The horizontal case is the one that leaks.** Not "can a receptionist do this", but "can *this* receptionist do it to *that* clinic's patient". Same role, different tenant, and it is the case `BEECH-LETTER-LEAK` exploits.
- **Object-level, not just route-level.** A guard on the route with none on the record is how identifiers become a browsing interface.
- **Trailhead and Polaris have the same problem in smaller clothes**: another customer's order, another shipper's consignment. The matrix is shared, the resources differ.
- **This is the security work a quality engineer genuinely owns.** Not penetration testing — the authorisation rules the team already wrote down and nobody proved.

**Libraries:** the API layer from step 7, the factories, a table-driven test generator

**Expected outcome:** A role and resource matrix per product, generated into tests for every role, resource and action including the horizontal cases. Explicit expected status codes for denials, with the choice documented. The matrix as a readable artefact for the release record. Failures that name the role, resource and action.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — with `BEECH-LETTER-LEAK` on, the matrix fails and names the role, the resource and the clinic; every role–resource–action combination is covered with an explicit allow or deny; adding a role to the matrix definition generates its cases without new test code; horizontal cases exist for all three products. |
| **L2 — Manual checks** | (a) Take the three worst leaks you can imagine and find their row in the matrix. Any that is missing is a gap in the definition, not the tests. <br>(b) Ask a developer to add a resource. If they have to write test code, the generation is not finished. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and every denial in the matrix is asserted rather than assumed |
