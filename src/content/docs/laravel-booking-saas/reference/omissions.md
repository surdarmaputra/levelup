---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a roadmap of this kind usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Filament or Nova for the back-office | They would build step 8 in an afternoon and teach you nothing about Livewire, forms, or authorisation. Reach for one on a paid project, after you can write the screens yourself. |
| A permissions package (`spatie/laravel-permission`) | Roles here are three values. Adding a package to model three values hides how gates and policies actually work. Adopt it when you have per-tenant custom roles. |
| Event sourcing on bookings | A genuinely good fit for this domain, and a roadmap of its own. The audit trail in step 11 covers the practical need. |
| Multi-region and read replicas | Solves a problem you get with real traffic in several continents. The index work in step 13 is what you actually need first. |
| Calendar sync (Google, Outlook, CalDAV) | Real product value, almost no new Laravel concepts — it is OAuth plus a lot of provider-specific detail. |
| SMS and WhatsApp reminders | The same queue and notification machinery as email, with a different driver and a per-country compliance problem. |
| Stripe disputes, payouts and tax reporting | Step 21 takes on the platform role honestly and stops at charges. The rest is finance work, not Laravel work. |
| Kubernetes | Step 23 deploys to one VPS. You have one application and two workers. |
| GraphQL | Adds a query language to learn without teaching a Laravel concept the REST API misses. |
| Octane / FrankenPHP | Faster, and it turns every static and container-scoped value into a possible leak between requests — including your tenant. Learn tenancy first; the failure modes are the same ones step 7 teaches. |

If someone tells you a SaaS roadmap is incomplete without these, ask them which user story
requires it.
