---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things an agent roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| A multi-agent architecture | Genuinely useful when work fans out across many sources. It is also the most common way a project acquires four times the cost and no more capability. One agent that can prove what it refuses beats five that cannot. Add a second when a measurement says one is the bottleneck. |
| An agent framework | They give you the loop, which the SDK's tool runner already gives you, and they hide the per-turn hook where authority belongs. The hard parts of this roadmap — authority, idempotency, compensation, evaluation — are yours in every framework. |
| A managed agent platform | Step 2 covers when it is the right answer, and it often is. It removes the loop and the hosting; everything this material is about remains. Use one on a paid project once you can build without it. |
| Retrieval over the client's documents | A different problem with a different failure shape, covered by its own material. An agent that answers from documents and an agent that changes the world need different proofs. |
| Fine-tuning | Almost never the answer for tool use. The tool surface and its descriptions are where behaviour is shaped, they change in minutes, and they are inspectable. |
| Long-running agents and schedules | A real direction — an agent that watches a queue overnight. It multiplies the authority problem before you have solved the synchronous one. Add it after step 12 exists. |
| Voice or chat channel integration | An integration problem, not an agent problem. Step 16 builds the smallest surface that makes the product usable. |
| A managed observability platform | Step 14 covers what they do and when to adopt one. At this size the traces from step 13 are a table in the database you already run, and some self-hosted options need five services and more memory than this entire application. |
| Computer use and browser-driving agents | The right answer when a system has no API at all — and a different discipline with different failures, covered by its own material. |
| Kubernetes and horizontal scaling | Step 16 deploys to one small host. The bottleneck is a third-party API and a human approver. |

If someone tells you this roadmap is incomplete without one of these, ask them how their agent
proves what it refuses to do.
