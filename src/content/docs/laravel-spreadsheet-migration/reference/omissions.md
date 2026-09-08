---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Hand-building the admin CRUD | The opposite of the choice made in [Laravel — Multi-Tenant Booking SaaS](../../../laravel-booking-saas/), and deliberately so — see the [overview](../../roadmap/overview/#why-filament-when-the-booking-material-refuses-it). Here the screens are not the lesson, and building them by hand would consume half the roadmap re-teaching another material's content. |
| A live two-way sync with Google Sheets | Tempting, and it removes the client's reason to switch. The parallel run in step 12 is deliberately a comparison, not a sync: the point is to end the spreadsheet's life, not extend it. |
| Machine-learning entity resolution | Trigram matching plus a phone number gets you most of the way, and the middle band needs a human regardless. A model here adds opacity to a decision the client must be able to audit. |
| A generic import mapper UI | Every client wants one and almost nobody uses it twice. Mapping as configuration per business, edited by you, is the right size for this job. |
| Multi-tenancy | This is one business per deployment. Tenant isolation is covered properly in [Laravel — Multi-Tenant Booking SaaS](../../../laravel-booking-saas/); doing it again would add a chapter and teach nothing new. |
| An API for the client's other systems | That is the [integration hub](../../../laravel-integration-hub/) material, and it is the natural follow-on project once this one has landed. |
| Data warehousing and BI tooling | Step 11 reproduces the one report the client actually looks at. A warehouse solves a problem this business does not have yet, and the export in step 14 covers the ad-hoc case. |
| OCR and scanned-document import | A real request from some clients, an entirely different discipline, and an accuracy problem that would need its own evaluation. |
| Kubernetes | Step 15 deploys to one VPS for one business with a handful of users. |
| Real-time collaborative editing | The spreadsheet's one genuine advantage that this system does not reproduce. Say so honestly to the client rather than building it: row-level locking and a fast form solve the real problem, which was overwriting each other. |

If someone tells you a migration roadmap is incomplete without these, ask them which of the
three example businesses would pay for it.
