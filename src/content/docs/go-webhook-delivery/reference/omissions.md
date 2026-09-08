---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a Go roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| A web framework (Gin, Echo, Fiber, Chi) | Since Go 1.22 the standard library routes by method and path pattern, and middleware is a function returning an `http.Handler`. A framework here would hide the interfaces you are here to learn. |
| An ORM (GORM, ent) | The queue's correctness lives in one `SELECT … FOR UPDATE SKIP LOCKED`. Writing it by hand is the step. Reach for an ORM later, on a project whose hard part is not the SQL. |
| `sqlc` | A good tool, and a reasonable thing to add afterwards. It is left out so the first version of every query is one you wrote and can explain. |
| Kafka, NATS, RabbitMQ | Postgres is correct up to throughput this project will never reach, and it is one system to operate instead of two. Swapping the queue behind the step 2 interface is suggested as an after-the-roadmap exercise, where the comparison is the lesson. |
| Redis | Only two things wanted it — rate-limit state and breaker state — and both belong in the database you already run, transactionally with the row they describe. |
| gRPC | Valuable once you have several internal services. You will have one. |
| Multi-tenancy in depth | Relay has a workspace column and stops there. Real tenant isolation is a roadmap of its own — see the Laravel material for it. |
| Kubernetes | It solves deployment problems that start at several services and several teams. Two containers behind nginx is the honest scale of this system. |
| Generics beyond the obvious | Go's generics are worth knowing, but a codebase that reaches for them early is usually solving a problem it invented. Use them where the standard library does. |
| A JavaScript framework | The dashboard is four pages that render a table. `html/template` plus htmx keeps the repository about Go, which is what it is being read for. |
| OpenTelemetry tracing | Correlation IDs plus Prometheus answer this system's questions. Tracing earns its setup cost when a request crosses several services. |

If someone tells you a Go roadmap is incomplete without these, ask them which user story requires it.
