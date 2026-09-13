---
title: Getting Started
description: A guided path from "I write automated tests" to owning quality for a release — risk-based strategy, a suite proven by the defects it catches, flake treated as a defect, contract tests for the service with no UI, and a release gate you can defend.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I write automated tests"* to owning the quality of a release — built around
one real job: you are the quality engineer for three products that ship from one pipeline, every
week, and somebody has to say whether they are safe to release.

Eighteen steps. The first four are not code: what a failure costs in each product, what to test
and what to leave alone, where the test data comes from, and what "ready" has to mean before you
can ever say no. Take a step in an evening or over two weeks.

## Who this is for

- You write automated tests already — some UI, some API — and they mostly pass
- Comfortable with TypeScript or JavaScript, a terminal, git, and reading somebody else's code
- You have used CI, even if you did not configure it

**Not assumed:** Playwright, contract testing, performance testing, accessibility testing, or any
opinion about the test pyramid.

If your tests are green and you still cannot answer *"is this release safe?"*, this is the gap
the material is about. Writing the tests is step 5 of 18. The other seventeen are the difference
between a suite that runs and a suite that is trusted.

## What you are building, concretely

Not a test framework. A quality system for three products you do not control: a strategy that
says what gets tested, a suite proven against real defects, a pipeline that finishes inside a
budget, a gate that blocks a release for a stated reason, and the numbers you report afterwards.

The material ships the three products as one repository, with a catalogue of **seeded defects**
you can switch on. That is what makes the work checkable: a suite is not proven by passing, it is
proven by failing on a defect that is really there and naming it.

The portfolio artefact is unusual for a QA role and much stronger than a list of tools: **a
release record for a build you blocked and a build you passed**, each with the evidence behind
the decision, plus a defect catalogue showing what your suite catches and what it misses.

Three products are the running examples. They disagree on the axis that matters here — **how you
can verify them at all**:

| The product | What it is | What it forces you to handle |
|---|---|---|
| **Trailhead Outfitters** | An outdoor gear storefront: browse, basket, checkout, payment through a third party | The baseline. High volume, a real user interface, money that a customer notices in minutes. Deterministic journeys, state set up through the API rather than by clicking, and tests that can run in parallel without stepping on each other. |
| **Beechwood Health** | A patient portal for a group of clinics: appointments, letters, results | The awkward constraint. You cannot copy production data down, accessibility is a legal requirement rather than a preference, and a release needs written evidence someone signs. Test data has to be generated, and the suite has to produce an artefact a non-engineer can read. |
| **Polaris Freight** | A dispatch service that allocates consignments to carriers — no user interface at all | The one that does not fit. Nothing to click. Work arrives as events, carriers answer minutes later, webhooks come back out of order, and a cut-off time changes the correct answer. Contracts, bounded waiting and a clock you control, or you have nothing. |

One pipeline, one release train, three products with different rules. A strategy that only works
for the one with buttons is not a strategy.

Three questions to keep asking: **what would this test catch that nothing else would?** If it
fails, **do I know what broke without opening it?** And if I run it a hundred times, **do I get
the same answer a hundred times?**

Other systems in this shape: a payments dashboard, a school management system, a council
licensing portal, a warehouse scanner app, an insurance quote engine, a broadcaster's scheduling
backend. Every one of them has a UI half, a regulated half, and a half with no screen at all.

## Why quality engineering, and not "more tests"

Because the job changes at this level. A mid-level QA engineer is asked to write tests. The next
step up is being asked whether the release goes, and that question cannot be answered by a green
tick alone.

| Reality of the job | Forces you to learn |
|---|---|
| Nobody can test everything | Risk-based selection you can defend out loud, not by feel |
| A suite can be green and catch nothing | Proving detection with seeded defects; why coverage is not detection |
| Flaky tests get whole suites switched off | Flake as a defect with an owner, a policy and a root cause |
| Half the system has no user interface | API tests, event assertions, and consumer-driven contracts |
| Patient data cannot be copied into a test environment | Generated data, per-worker isolation, and data as a design problem |
| Accessibility is law in some sectors | Automated checks in the suite, and the larger part they cannot see |
| Somebody has to sign the release off | Evidence a person can read, and a gate with stated reasons |
| Pipelines get slower until people skip them | A runtime budget, test selection, sharding and artefacts |
| Bugs escape anyway | An escaped-defect review that changes the suite, every time |
| A manager asks whether quality improved | Metrics that mean something, and the popular ones that lie |

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | TypeScript 5.9 on Node 24, `strict`, `any` banned |
| UI testing | Playwright — locators, fixtures, projects, traces, parallel workers |
| API testing | Playwright's request context, a typed client, schema assertions against the API contract |
| Contract testing | Consumer-driven contracts between the services, and recorded stubs for third parties |
| Asynchronous systems | Bounded polling instead of sleeping, event assertions, a clock the test controls |
| Test data | Factories, per-worker isolation, and synthetic data for a system whose real data you may not touch |
| Accessibility | `axe-core` inside the suite, plus the keyboard and screen-reader checks it cannot do |
| Performance | k6 — a workload model, a question worth asking, and thresholds that fail a build |
| Permissions | An authorisation matrix generated from roles, tested rather than assumed |
| Exploratory testing | Charters, session notes, and a bug report that gets fixed instead of closed |
| Pipeline | GitHub Actions — sharding, selection, artefacts, required checks, a runtime budget |
| Release | A gate with stated reasons, and a release record a non-engineer can read |
| Metrics | Escaped defects, detection rate, flake rate, lead time — and the ones that mislead |
| AI workflow | An `AGENTS.md` harness, a `LEARN`/`BUILD` contract, a portable reviewer prompt |

## How this material is structured

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness and a portable reviewer prompt. | Once, before step 4. |
| **[Roadmap](./roadmap/overview/)** | The 18 steps in six sections, plus the locked decisions, the products under test, and the proof rule. | Skim the overview, then work in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics, the `AGENTS.md` template, deliberate omissions. | One rubric section per step. |

| Section | Steps | Focus |
|---|---|---|
| [Strategy](./roadmap/strategy/) | 0–3 | What a failure costs, what to test, where the data comes from, what "ready" means |
| [Foundations](./roadmap/foundations/) | 4–7 | Tooling and the products under test, the first journey, a suite that survives, the API level |
| [Depth](./roadmap/depth/) | 8–12 | The service with no UI, contracts and third parties, flake, regulated surfaces, exploratory testing |
| [Non-functional](./roadmap/nonfunctional/) | 13–14 | Performance that answers a question, and permissions proved rather than assumed |
| [Release](./roadmap/release/) | 15–16 | The pipeline inside a budget, and the gate that blocks a build |
| [Operations](./roadmap/operations/) | 17 | After the release: synthetic checks, escaped defects, the report, handover |

**There is deliberately no implementation code in any of these documents.**

## The three paths

**Decide what to test — steps 0–3.** No code. Ends with a quality strategy, a test data
position, and a written definition of "ready to release" that you could show a manager.

**Build the suite — steps 4–14.** The products under test, the first journey, the architecture,
the API level, the service with no UI, contracts, flake, accessibility and evidence, exploratory
testing, performance, permissions. Ends with a suite that catches the defect catalogue.

**Ship and keep it honest — steps 15–17.** The pipeline, the gate, and what happens after a
release goes out wrong.

Step 0 is not optional. Every later decision about what to automate is an argument about cost,
and you cannot make it without numbers.

## How to read a roadmap step

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. |
| **Mode** | `LEARN` or `BUILD` — see [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on. |
| **Concepts** | What you're actually learning. |
| **Libraries** | What to add, and sometimes why over the obvious alternative. |
| **Expected outcome** | What you should have. On steps 0–3 that is a written document. |
| **Verification** | How you prove it's done. |

### Proving a step is done

Testing work has a problem no other discipline has this badly: **the deliverable reports on
itself.** A suite that tests nothing passes. So the bar here is detection, not execution — five
layers:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Usually: switch on named seeded defects, the suite must fail and say what broke. |
| **L2 — Manual checks** | What a test can't catch — reading a failure message as a developer who did not write it, watching a run, reading your own evidence as the person who signs. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/). |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". |
| **L5 — Automated guardrails** | CI, types, the flake detector and the runtime budget. See the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The per-step loop

1. Check the **Mode**.
2. Read the step.
3. **Turn on the seeded defects for that step first, and watch your suite miss them.** That is the
   failing test this material starts from.
4. Build until the suite catches them, and names them.
5. Run the L2 checks.
6. Self-check the `AP-NN-*` list.
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix, resubmit until `PASS`.

Expect to fail review the first time at steps 6, 8 and 10.

## How to use the rubrics

Each step's **Verification** block names IDs — `ACC-07`, `AP-07-a` — and nothing more. The full
text lives in [Rubrics](./reference/rubrics/), one section per step.

Use it three times per step: read `ACC-NN` **before** building, so you know the bar; self-check
every `AP-NN-x` once it passes; then paste **only that step's section** into the reviewer. Never
the whole file — a reviewer given twenty rubrics reviews none of them.

## A note on proof

Most test suites have never been checked. They pass, and passing is taken as evidence that they
would fail if something broke. It is not evidence, and the gap is usually enormous.

So this material ships a **defect catalogue** with the products under test: real bugs, switchable
one by one, from an off-by-one in a discount to a carrier webhook that arrives twice. Every
acceptance test in the roadmap is stated the same way — turn these defects on, and your suite has
to go red and say which one. A suite you have never seen fail is a suite you know nothing about.

## Start here

1. **Read this page to the end.**
2. **Skim the [Roadmap Overview](./roadmap/overview/).**
3. **Start [step 0](./roadmap/strategy/).** No repo. A spreadsheet and an hour.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.**
5. **Bring up the three products** at [step 4](./roadmap/foundations/) — a storefront, a patient portal, a dispatch service with no screen, one pipeline, and a defect catalogue waiting to be switched on.
