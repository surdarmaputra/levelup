---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Real route optimisation (a travelling-salesman solver) | Atlas Hardware's three stops make it tempting. It is an optimisation problem, not an AdonisJS problem, and it would take a week that teaches you nothing about the framework. Step 9 gives you the distance; ordering stops by hand is fine. |
| A routing and traffic service (road distance, live ETA) | It changes the product and adds one API client. Straight-line distance plus a written note about its error is honest and free. Add it when a customer complains about an ETA, not before. |
| A native courier app | The API in step 10 is the interesting half, and it is fully testable with HTTP calls. Building a React Native app teaches React Native. |
| Push notifications to phones | The same queue and notification machinery as email, plus two vendor SDKs and a certificate problem. Step 11 covers the part that generalises. |
| An admin UI framework or a generated back-office | It would build step 17 in an afternoon and teach you nothing about Edge, forms, or authorization. Reach for one on a paid project, after you can write the screens yourself. |
| Multi-tenancy by database or schema | Antar has merchants, not tenants — one platform, shared data, scoped by ownership. If you want the tenancy exercise, the [Laravel material](../../../laravel-booking-saas/) is built entirely around it. |
| Event sourcing on the job aggregate | A genuinely good fit for this domain, and a roadmap of its own. The append-only `JobEvent` log in step 10 covers the practical need. |
| Courier onboarding, background checks, document verification | Real product work, almost no new framework concepts — file uploads and a review queue you already know how to build after steps 10 and 17. |
| Stripe Connect, payouts, tax reporting | Step 16 builds the ledger honestly and stops before moving money to a bank. The rest is finance work, not AdonisJS work. |
| Surge pricing and demand forecasting | Interesting, and a data problem rather than a backend one. The scoring weights in step 7 are where it would attach. |
| Kubernetes | Step 23 deploys to one VPS with three process roles. You have one application, one worker pool and a scheduler. |
| GraphQL | Adds a query language to learn without teaching a framework concept the REST API in step 19 misses. |

If someone tells you a dispatch roadmap is incomplete without these, ask them which user story
requires it.
