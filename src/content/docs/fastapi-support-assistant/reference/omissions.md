---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| LangChain, LlamaIndex or a comparable framework | They would build steps 4 to 9 in an afternoon and teach you none of it. Every abstraction they provide is one you need to be able to debug, and their surfaces change faster than this material could track. Reach for one on a paid project after you can write the pipeline yourself. |
| A dedicated vector database | pgvector in the database you already run gives transactional consistency between a document and its vectors, and full-text search in the same query engine. Revisit past roughly ten million chunks. None of these three clients is close. |
| Fine-tuning | Almost never the answer for "answer from my documents", and it is the most common expensive mistake in this space. Retrieval is cheaper, updatable in minutes, and citable. |
| Training or hosting your own model | A different discipline with a different cost structure. Nothing in this roadmap needs it, and a client paying SMB prices cannot fund it. |
| Agents and tool use | A real and useful direction — an assistant that books the appointment rather than describing the booking policy. It is a second roadmap, and it should not be attempted before evaluation exists. |
| Multimodal answering over document images | Genuinely useful for the Ridgeline manual's diagrams, and it multiplies the evaluation problem before you have solved the text one. |
| Graph retrieval | Strong on corpora with dense cross-references. These three are not, and it would add a data model without adding a lesson these steps do not already teach. |
| A production frontend | Step 12 builds enough interface to demonstrate the product. A polished client application is a separate project with separate skills. |
| Voice input and telephony | The clinic will ask for it. It is an integration problem, not a retrieval problem, and the transcription errors it introduces deserve their own evaluation. |
| Kubernetes and autoscaling | Step 17 deploys to one VPS. The bottleneck in this system is a third-party API, not your CPU. |

If someone tells you an assistant roadmap is incomplete without these, ask them what the
evaluation score is with and without.
