---
title: Java with Spring Boot
description: A guided path from "I know Java, new to Spring" to shipping a production-grade backend and fullstack application.
sidebar:
  order: 0
  label: Overview
---

Twenty-six steps, one real domain: an **event ticketing marketplace**, built with Java 21 and
Spring Boot 3.5. The domain was chosen because its hard parts — overselling, holds that expire,
payment webhooks arriving twice — are unavoidable rather than bolted on.

There's no timeline attached to any of it. The sequence matters, the pace doesn't.

## Start here

| Page | What it covers |
|---|---|
| [Getting Started](./getting-started/) | What this is, how the documents fit together, how to read a step |
| [Agent Harness](./setup/agent-harness/) | `AGENTS.md`, the `make verify` loop, the `LEARN`/`BUILD` mode contract |
| [Reviewer Setup](./setup/reviewer-setup/) | A portable AI code-reviewer prompt that works in any chat window |
| [Roadmap Overview](./roadmap/overview/) | Locked decisions, the domain model, global quality guardrails |

## The roadmap

| Section | Steps | Focus |
|---|---|---|
| [Foundations](./roadmap/foundations/) | 0–4 | Tooling, harness, Spring fundamentals, persistence, API contract, security |
| [Domain Depth](./roadmap/domain-depth/) | 5–8 | Admin UI, design system, seat maps, read performance, the concurrency problem |
| [Integration and Scale](./roadmap/integration/) | 9–14 | Hexagonal refactor, messaging, caching, horizontal scaling, observability, resilience |
| [Fullstack](./roadmap/fullstack/) | 15–18 | React storefront, seat map, checkout, frontend production readiness |
| [Advanced](./roadmap/advanced/) | 19–24 | OAuth2, service extraction, and the optional Kafka / Elasticsearch / event sourcing track |

## Reference

- [Rubrics](./reference/rubrics/) — `ACC-NN` acceptance criteria and `AP-NN-x` anti-patterns for every step
- [AGENTS.md Template](./reference/agents-template/) — the v1 harness file to copy into your project
- [Deliberate Omissions](./reference/omissions/) — what was left out, and why

## Who this is for

You are comfortable with Java — classes, generics, collections, streams, the concurrency
primitives — and new to Spring. You want to understand what the framework does rather than
which annotation makes the error go away.

If you are new to Java itself, this will move too fast. Learn the language first.

Ready? [Start with Getting Started](./getting-started/).
