---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Kafka, RabbitMQ or any broker beyond Redis | The lessons here are idempotency, ordering, partial failure and reconciliation. A broker changes the delivery mechanics and none of the lessons, and it adds an operations burden a solo developer should not carry for a client this size. |
| n8n, Zapier, Make | The right answer for many real clients, and worth saying so out loud in a proposal. They teach nothing about why an integration fails, which is what you are being paid for the moment one does. |
| Event sourcing as an architecture | Step 18 derives state from events, which is the useful half. Full event sourcing with projections and replay tooling is a roadmap of its own. |
| Temporal or another durable-execution engine | Genuinely the best answer to this problem class, and the wrong first lesson: it hides the failure modes you are here to learn. Reach for it after you can name what it is solving. |
| Saga and two-phase commit across services | You do not control the other side, so you cannot coordinate it. Compensation — a recorded reversal — is the only mechanism available, and step 18 uses it. |
| GraphQL or gRPC for the partner APIs | Real, and the failure modes are the same ones REST has. Adds a protocol to learn without adding a lesson. |
| A multi-tenant control plane | This hub serves three businesses from one deployment with a `business_id`. Full tenant isolation is covered in [Laravel — Multi-Tenant Booking SaaS](../../../laravel-booking-saas/); doing it twice teaches nothing new. |
| OAuth provider implementation | Step 10 consumes OAuth client credentials, which is what integration work requires. Being an OAuth server is a different job. |
| Kubernetes | Step 21 deploys to one VPS with two worker pools. That is the correct size for this system, and pretending otherwise teaches the wrong instinct. |
| Machine-learning anomaly detection on the signals | Step 17's thresholds are simple and are almost always sufficient. Reach for something cleverer once you have a year of data and a specific alert that keeps being wrong. |

If someone tells you an integration roadmap is incomplete without these, ask them which of the
three example businesses needs it.
