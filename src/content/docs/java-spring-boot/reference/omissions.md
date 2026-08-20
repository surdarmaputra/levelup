---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| GraphQL | Adds a query-language learning curve without teaching a Spring concept you'd otherwise miss |
| gRPC | Valuable, but only after you have several services. You'll have two. |
| Reactive stack (WebFlux) | Java 21 virtual threads solve most of what WebFlux was for, at a fraction of the cognitive cost. Learn WebFlux later, if a real backpressure requirement appears. |
| Service mesh | Solves problems you get at 20+ services |
| Multi-region / multi-tenancy | Each is a roadmap of its own |
| Micro-frontends | An organizational solution to an organizational problem you don't have |

If someone tells you a backend roadmap is incomplete without these, ask them which user story requires it.
