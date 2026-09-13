---
title: Foundations
description: Steps 4–7. Tooling and the three products under test, the first journey done properly, a suite that survives parallel and shuffled runs, and the API level with a data factory.
sidebar:
  order: 3
---

## Step 4 — Tooling, harness, and the products under test

**Story:** *As a quality engineer, I have all three products running locally with a catalogue of switchable defects, and one command that checks my own work.*

**Mode:** `BUILD` — infrastructure. You are building the thing you will be testing, and meeting each defect deliberately before you have to catch it.

**Why now:** First code step. Everything later runs against this stack.

**Concepts:**
- **Why you bring up the products yourself.** A hosted demo site teaches nothing about test data, seeding or defect injection. You need to be able to break these products on purpose, on demand, reproducibly.
- **The defect catalogue is the deliverable, not a detail.** Each defect behind a named flag, switchable per run, listed in a file with an ID and one line of description — and the description says the symptom, never the cause. You will read the flag names for years; you may not read the implementations.
- **Test code is code.** Same lint rules, same strict types, same review. A test helper that accepts `any` will silently accept the wrong shape and pass.
- **The no-fixed-sleep rule, from the first day.** A lint rule banning `waitForTimeout` and bare `setTimeout` in the suite. Written at step 4 it costs nothing; added at step 10 it means rewriting a hundred tests.
- **Playwright's structure**: projects, fixtures, workers, traces, reporters. Projects are how three products share one configuration without sharing state. Traces are how you diagnose a CI failure you cannot reproduce.
- **One command.** `npm run verify` — lint, types, unit tests, the suite. It must fail loudly and separately for each.
- **CI from the first commit**, because a suite that has only ever run on your machine is untested software.
- **`AGENTS.md` v1**, pointing at the four documents from steps 0–3, so an agent argues from your strategy rather than its habits.

**Libraries:** Playwright, TypeScript 5.9, ESLint + Prettier, Docker + Compose (PostgreSQL 18, a message broker, the three products, the stub servers), GitHub Actions

**Expected outcome:** A Compose stack running Trailhead, Beechwood, Polaris, the database, the broker and the third-party stubs. A defect catalogue file with at least twelve entries, each switchable by flag and each documented by symptom only. Playwright configured with three projects, traces on, a reporter that writes an artefact. `npm run verify` running lint → types → unit → suite. The no-fixed-sleep lint rule. CI green. `AGENTS.md` v1 with a `CLAUDE.md` symlink.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — every catalogue defect can be switched on individually and reproducibly, and the products behave identically with all flags off; `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a trace is produced for every run; the sleep rule fails a commit containing `waitForTimeout`. |
| **L2 — Manual checks** | (a) Switch on three defects at random and use the products by hand. Two will be obvious. The third is the kind that reaches production. <br>(b) Ask your agent to write a checkout test. Keep it as evidence: at step 6 you will see what is wrong with it. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and you can turn any single defect on from one command |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The first journey, and what it is allowed to prove

**Story:** *As Trailhead Outfitters, a customer can put two items in a basket and pay, and I find out within ten minutes if they cannot.*

**Mode:** `BUILD` — the first real test, with tight limits on what it is allowed to do.

**Why now:** One journey teaches the mechanics — locators, waiting, assertions — before step 6 turns them into an architecture.

**Concepts:**
- **One journey, one question.** This test proves a customer can complete a purchase. It does not prove discount arithmetic, stock rules or email delivery. Those are cheaper elsewhere, and bundling them means a failure tells you nothing.
- **Locators that describe the element, not the page.** Role, label, accessible name. A CSS path through four `div`s is a promise that the test breaks the next time someone changes the layout, and it breaks without the behaviour changing.
- **Waiting for a condition, never for a duration.** Playwright's assertions retry on their own. The temptation to add "just one second" is the beginning of every flaky suite.
- **Assert the value, not the page.** `TRAIL-DISCOUNT-ROUNDING` is one penny. A test asserting "order confirmation is visible" passes with the defect on, and that is the failure mode this whole material exists for.
- **Set up state through the API, not the UI.** Registering a user by filling a form makes the test slower and gives it a second way to fail for a reason you are not testing.
- **A failure message that names the fault.** When this runs at 02:00 in CI, someone who did not write it has to read the failure. The assertion message, the trace and the screenshot are part of the deliverable.
- **Traces on failure, always.** A CI failure you cannot reproduce locally is normal; a trace turns it from a mystery into a recording.

**Libraries:** Playwright

**Expected outcome:** One Trailhead checkout journey: state seeded through the API, semantic locators, an assertion on the order total and the paid amount to the penny, no fixed waits, a named failure message, trace on failure. The defect-catalogue run script from step 4 wired to it: the suite runs with a chosen defect on and reports what it caught.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — with `TRAIL-DISCOUNT-ROUNDING` on the test fails and the message names the expected and actual total; with all flags off it passes ten consecutive runs; no fixed wait appears anywhere in it; the journey completes in under thirty seconds. |
| **L2 — Manual checks** | (a) Read your own failure message as if you had never seen the code. Does it say what broke, or only that something did? <br>(b) Compare it with the test your agent wrote at step 4. Count the assertions that prove nothing. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and the test fails for exactly one reason |

---

## Step 6 — A suite that survives: fixtures, independence, abstraction

**Story:** *As a developer, I can run the whole suite shuffled, on eight workers, and get the same result as running one test on my laptop.*

**Mode:** `LEARN` — this is the architecture step, and a plausible wrong answer here costs a year of maintenance.

**Why now:** Two tests is a pair; twenty is a suite. The structure is chosen now, while changing it is cheap.

**Concepts:**
- **Independence is the property everything else rests on.** A test that needs another test to have run first cannot be run alone, cannot be run in parallel, and cannot be trusted when it fails. The shuffle-and-parallel run is how you find out, and almost every suite fails it the first time.
- **Fixtures over setup code.** Playwright's fixtures give each test what it needs, tear it down afterwards, and make the dependency visible in the signature. A `beforeAll` that fills a shared variable is the order dependency you will be hunting at step 10.
- **The abstraction that pays and the one that does not.** Wrapping a screen's controls in one place pays, because the page changes. Wrapping every assertion in a helper called `verifyEverything` does not, because it hides which thing failed. The rule: abstractions hide *how*, never *what*.
- **Per-worker data namespaces.** Each worker gets its own clinic, its own customer, its own consignments. Shared records plus parallel workers equals failures that are real and unreproducible.
- **Naming for the failure list.** You read test names in a CI report where nothing else is visible. `checkout > applies multi-item discount to the order total` beats `test checkout 3`.
- **The same structure for three different products**, without branching on the product. Trailhead has screens, Polaris has none. If the shared layer can only describe clicking, it is the wrong layer.
- **What belongs in `verify` and what belongs in the pipeline.** The fast subset runs on every save; the full suite runs in CI. Deciding this now keeps the local loop usable.

**Libraries:** Playwright fixtures; a small factory helper

**Expected outcome:** A fixture layer providing per-worker isolated data and authenticated contexts. Screen abstractions for Trailhead and Beechwood, and a service client for Polaris, all behind one shared test API. Test naming convention documented in `AGENTS.md`. The `--shuffle` full-parallel run added to CI. The step 5 journey refactored onto the fixtures without changing what it asserts.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — the whole suite passes with `--shuffle` on the maximum worker count, three consecutive runs; any single test passes when run alone; deleting any one test does not break another; no test reads data created by another test. |
| **L2 — Manual checks** | (a) Pick your largest abstraction and ask what a failure inside it would tell you. If the answer is "that something in checkout failed", split it. <br>(b) Read ten test names as a CI report, with no other context. Rewrite the ones you cannot interpret. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and no test cares what ran before it |

---

## Step 7 — The API level and the data factory

**Story:** *As a quality engineer, most of what I check runs in milliseconds against an API, so the browser only does what only a browser can do.*

**Mode:** `BUILD` — applying the strategy from step 1 where most of the value is.

**Why now:** The architecture exists, so the bulk of the suite can now be written where it is cheap.

**Concepts:**
- **The level a check belongs at**, from step 1, now spent for real. Discount arithmetic, stock rules, validation, permissions on a resource: all API. Only "can a person actually do this" stays in the browser.
- **One request context, shared fixtures.** Playwright's request API means API tests use the same fixtures, the same reporting and the same gate as the journeys. One answer to "did it pass".
- **Asserting against the contract, not the current response.** Check the shape against the published schema, and the values against the rule. A test that hardcodes today's response passes forever and proves nothing about tomorrow's.
- **Error cases outnumber happy paths.** A validation rule with six branches is six tests at this level and none in the browser. This is where the count grows, and it should.
- **Factories, not fixtures files.** A factory takes what the test cares about and invents the rest, seeded and reproducible. A shared JSON file of sample records becomes a dependency nobody can change.
- **Beechwood's data is manufactured**, per step 2, and the factory is where that rule is enforced rather than remembered.
- **Cleanup that survives a crash.** A test killed halfway leaves records behind. Per-worker namespaces plus a cleanup pass makes the next run identical to the first.
- **Speed is a feature at this level.** Two hundred API tests in forty seconds changes how people work. Two hundred taking twelve minutes get skipped.

**Libraries:** Playwright request context, a seeded data-generation library, a schema validator

**Expected outcome:** API test coverage for the risks step 1 assigned to that level across all three products, including the error branches. Factories for customers, orders, patients, appointments and consignments, seeded and per-worker isolated. Schema assertions against each product's published contract. A cleanup pass that leaves the environment as it found it. The fast local subset defined.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — with `TRAIL-DISCOUNT-ROUNDING` and `BEECH-LETTER-LEAK` on, the API layer catches both and names the field; every strategy entry marked "API" has a test referencing its risk ID; the API suite completes in under ninety seconds; a killed run leaves no records behind the next run can see. |
| **L2 — Manual checks** | (a) Count your browser tests against your API tests. If the ratio does not match the shape you committed to in step 1, one of the two documents is wrong. <br>(b) Change a field name in a product's response by hand. If no test notices, your schema assertions are decorative. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and the browser tests are the few that have to be |

**Harness impact:** `AGENTS.md` v2 — record the level rule (what may never be tested in a browser), the factory rule (no shared sample data, no production copies), and that every test references a risk ID.
