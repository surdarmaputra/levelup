---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things an automation roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| n8n's built-in AI and agent nodes | Convenient, and they put the model call where you cannot validate, version, meter, cache or test it. Step 7 explains the trade in full. Use them for a throwaway; not for something a client pays for monthly. |
| A cloud-hosted automation platform | Faster to start and cheaper to run, and it makes Ridgeway impossible. Self-hosting is the differentiator that lets you serve the clients who pay retainers. Step 2 says plainly when the hosted option is the right advice. |
| Writing your own workflow engine | Tempting after two weeks with someone else's. It is a year of work to reach where n8n already is on connectors, triggers and retries, and none of that year teaches anything this material is about. |
| A message queue between n8n and your service | n8n has queue mode and retries. A broker in the middle is a third thing to run and monitor on a stack whose largest cost is already the server. |
| Fine-tuning a model per client | The prompt, the schema and the field descriptions are where behaviour is shaped here, they change in minutes, and they are inspectable by the client. |
| A full fairness or bias audit | Step 12 ships a near-identical-pair test, an input allow-list and an audit trail. A complete audit is a specialist discipline with its own methodology and, for a real engagement, its own budget. Claiming this material delivers one would be dishonest. |
| Legal advice on data protection | The material covers the technical shape — redaction, inference location, retention, what the ledger stores — and says explicitly that the contractual answer is a conversation with the client's own advisers. |
| A managed observability platform | Step 13 covers what they do and when to adopt one. At this size the ledger is a table in the database you already run, and some self-hosted options want several times the memory of this entire stack. |
| Multi-tenant SaaS packaging | Turning three client automations into a product is a different business with different problems. This material is about delivered engagements. |
| Kubernetes and horizontal scaling | Step 15 deploys to one small host. The bottleneck is a third-party API and a human in a sign-off queue. |

If someone tells you this roadmap is incomplete without one of these, ask them what their
automation does when the model changes and nobody deployed anything.
