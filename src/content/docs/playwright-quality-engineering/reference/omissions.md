---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a QA roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| A second test runner for API tests | One runner means one fixture system, one report and one answer to "did it pass". Two means reconciling two results at the gate, which is where the ambiguity always appears. |
| Cucumber and Gherkin | A syntax for writing tests, not a strategy for deciding what to test. Where a non-technical reader genuinely writes the cases it earns its cost; in most teams it adds a layer that only engineers touch. The release record at step 16 is the artefact non-engineers actually read. |
| A test case management tool | This material makes the strategy document and the risk IDs the source of truth. A tool that stores test cases separately from the tests goes stale in a month. |
| Manual regression scripts | A list of steps a person repeats every release is the thing automation exists to remove. Step 12 covers the human testing that is worth doing, which is exploration, not repetition. |
| Mobile and native app testing | Different tooling, different device problem, different failure modes. It deserves its own material rather than a chapter that only gestures at it. |
| Visual regression testing | Real value in a design system; in a product suite it produces a stream of diffs from intended changes, and teams approve them without looking within a month. Step 11's accessibility checks catch the visual problems that actually matter. |
| Security testing beyond authorisation | Step 14 covers the part a quality engineer genuinely owns: the access rules the team already wrote down and nobody proved. Penetration testing and threat modelling are a different discipline with different training. |
| Chaos engineering | Step 8 injects the third-party failures that a test suite can assert on. Killing infrastructure at random is an operations practice, and it needs production traffic to mean anything. |
| Model-generated test cases | Useful for the first draft of a boring matrix, and dangerous as a strategy: it generates tests for what is in the code rather than what the risk is, which is the failure this whole material is about. Use it inside a strategy you wrote. |
| A cloud device or browser grid | Step 15 runs on the CI runner. A grid earns its cost when you support many browser versions; for three products on two browsers it is a bill and a queue. |
| Kubernetes for the test environment | Compose on one host runs everything here. The constraint is a database and a broker, not orchestration. |
| Test coverage percentage as a target | Covered at step 16, as a metric that rises when you test getters. Detection rate against the defect catalogue is the honest replacement, so the percentage is not used anywhere in this material. |

If someone tells you this roadmap is incomplete without one of these, ask them what percentage of
their seeded defects their suite currently catches.
