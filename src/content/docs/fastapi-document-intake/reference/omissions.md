---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a document-extraction roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Training or fine-tuning an extraction model | The expensive mistake of this field. A general model with a good schema and good field descriptions beats a fine-tuned one on almost every small-business document set, updates in minutes rather than weeks, and needs no labelled corpus you do not have. |
| A document-AI framework or orchestration library | They would build steps 7 to 10 in an afternoon and teach you none of it — and every abstraction they add is one you have to debug when a table crosses a page break. Reach for one on a paid project after you can write the pipeline. |
| Layout-analysis models and specialist table transformers | Real, and genuinely better on dense scientific documents. On invoices and delivery notes a vision-capable general model reaches the same place with one dependency instead of four. |
| A message broker and a distributed worker pool | A Postgres job queue carries these volumes. Step 16 names the signal that would change the answer; adding it earlier is a second service to run, monitor and explain to a client for no gain. |
| A managed observability platform | Step 14 covers what they do and when to adopt one. At this size the ledger is a table in the database you already run, and some self-hosted options need several services and more memory than this whole application. |
| A single-page review application | Step 12 builds the smallest thing that makes the product usable. A build pipeline and a state layer to render six rows is a different project with different skills. |
| Handwriting recognition | A real requirement in some domains and a different accuracy problem with a different ceiling. It deserves its own gold set and its own honest number, not a paragraph here. |
| Multi-language documents | Worth doing and it multiplies the evaluation problem before you have solved the single-language one. Add it after step 11 exists, with labels in each language. |
| An e-invoicing standard integration | If the client's supplier can send structured data, take it — step 17 says so explicitly. Implementing a standard is an integration project, not an extraction one. |
| Kubernetes and autoscaling | Step 16 deploys to one small host. The bottleneck is a third-party API and a human reviewer, not your CPU. |

If someone tells you this roadmap is incomplete without one of these, ask them what the accuracy
number is with and without it.
