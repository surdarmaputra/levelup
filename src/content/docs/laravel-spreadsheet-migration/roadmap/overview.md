---
title: Roadmap Overview
description: Locked decisions, the fixture spreadsheets, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | You have shipped a Laravel application before. Comfortable with Eloquent, migrations and jobs. |
| Language / runtime | PHP 8.5, `declare(strict_types=1)` everywhere |
| Framework | Laravel 13.x |
| Domain | Fieldbook — the operations back office that replaces a business's spreadsheets |
| Admin UI | **Filament.** Pin a version at step 1 and record it in an ADR; this material does not depend on any version-specific API. |
| Why Filament here | See below — this is a deliberate reversal of the choice made in `laravel-booking-saas`, and the reasoning is the point. |
| Database | PostgreSQL 17. Constraints encode rules the spreadsheet could not. |
| Import format | `.xlsx` and `.csv`, streamed. The fixtures are deliberately messy and are part of the material. |
| Source of truth during migration | The spreadsheet, until step 13 says otherwise. Your database is a copy that must prove itself every day. |
| Entity resolution | Never fully automatic. Above the confidence threshold, propose; below it, leave alone. A merge is always recorded and always reversible. |
| Reconciliation | The client's own report, regenerated from your schema, matching their sheet exactly. Runs in CI against the fixtures from step 7. |
| Cutover | Parallel run → dual entry → freeze → switch, with a written rollback at every stage |
| Testing | Pest 4 against real PostgreSQL, with the three fixture spreadsheets as test data |
| Quality | Pint (format), Larastan level 8, Rector, the reconciliation suite in CI |
| Ops | Docker Compose → single VPS behind nginx. Daily backups, restored once before go-live. |
| AI harness | `AGENTS.md` from step 0, evolving v1→v4. Two-mode contract per step. |

### Why Filament, when the booking material refuses it

[Laravel — Multi-Tenant Booking SaaS](../../../laravel-booking-saas/) leaves Filament out on
purpose: it would build that material's back-office step in an afternoon and teach nothing about
Livewire, forms or authorisation.

This material makes the opposite call, and both are right, because the lesson is somewhere else
each time. Here the lesson is discovery, entity resolution, reconciliation and cutover.
Hand-building CRUD would consume half the roadmap re-teaching what the other material already
teaches, and it would also train the wrong professional instinct: on a real job of this shape,
hand-rolling the admin screens is how you lose money on a fixed price.

The rule that survives both decisions: **reach for the tool that removes work you already know
how to do, and never for one that removes the work you are being paid to understand.** Filament
here removes the first kind. In the booking material it would have removed the second.

**Note on step count:** the roadmap is 16 numbered steps, 0 through 15. Cutover gets four of
them rather than a closing paragraph, because that is where projects of this shape actually
fail.

---

## Why this domain

A spreadsheet migration was chosen because it *forces* the topics that no greenfield project
can:

- **The requirements do not exist in writing** → discovery, profiling, and interviewing
- **The rules are inside formulas** → extraction, and confirming them against what the owner believes
- **The data is real and therefore wrong** → messy import, quarantine, and a human review path
- **The same entity appears many times** → resolution with a confidence threshold and a reversible merge
- **The client can check your work** → reconciliation to the cent, which is the only honest test of understanding
- **The business does not stop** → parallel run, dual entry, freeze, switch, rollback

A greenfield app cannot teach these, because in a greenfield app you invent the domain and it
is therefore never wrong.

---

## The three example businesses

Every step is written against the same three businesses, and the three fixture spreadsheets
that come with them. Build the fixtures in step 2 and keep them for the rest of the roadmap —
they disagree with each other on purpose.

| Business | The spreadsheet | The rule it exists to break |
|---|---|---|
| **Willow Lane Nursery** `willowlane` | One sheet, ~4,000 stock rows, one editor, tidy. Two date formats, a total row at the bottom, and about 30 rows where the price was typed with a currency symbol. | The simple case. It really is a table. If the import and the stock report are wrong here, nothing later matters. |
| **Cavendish Tutors** `cavendish` | Six per-tutor sheets plus a master joined by `VLOOKUP`. The customer list exists six times and the six copies disagree. Two people edit simultaneously and overwrite each other. | It is a relational model that has been denormalised by hand. The work is joining six divergent copies of one list, which is entity resolution, and it cannot be automated to zero. |
| **Portside Freight** `portside` | One sheet. The `notes` column carries real business logic in free text. Pricing lives in nested `IF` formulas nobody has written down, and one person knows why. | The model is not in the data. It is in the formulas and in a person's head. Some rows are genuine exceptions and must remain exceptions rather than being modelled away. |

Concrete questions to keep asking as you build: does Willow Lane's stock report match the
number at the bottom of their sheet? Are Cavendish's "S. Whitfield" and "Sarah Whitfield" one
person, and how confident are you? Which of Portside's 12 pricing formulas is a rule, and which
is a mistake nobody noticed?

None of the three may ever be special-cased in code. If you find yourself writing
`if ($business->slug === 'portside')`, the model is wrong, not the business.

### The fixtures are part of the material

You will build three deliberately messy spreadsheets in step 2 and they are used by every test
from then on. Building them is not busywork — deciding *which* mess to include is how you learn
what mess looks like. A clean fixture makes every later step pass for the wrong reason.

---

## The domain model (target state)

The model is not given to you. It is what you derive in steps 2 to 4, and this is the shape it
usually converges on:

```
Business ──has──> User ──has──> Role

Business ──has──> Party            (customer, supplier, tutor, driver — one real person or firm)
   │                  │
   │                  └──has──> PartyAlias (a spelling that appeared in the sheet)
   │
   ├──has──> Item              (stock line, service, lane — the thing being sold or tracked)
   │
   ├──has──> Transaction ──for──> Party
   │              └──has──> TransactionLine ──> Item
   │
   ├──has──> Rule              (a pricing or classification rule extracted from a formula)
   │
   ├──has──> ImportRun ──has──> ImportRow (applied | quarantined | skipped)
   │
   └──has──> Reconciliation (a comparison against the source sheet, with drift)
```

Two words that look alike and are not:

- a **Party** is the real person or firm. There is one.
- a **PartyAlias** is a spelling that appeared somewhere in the source data. There may be six,
  and keeping them is what makes a merge reversible and an import repeatable.

Deleting the aliases after import feels tidy and destroys your only record of why two rows
became one.

---

## Global guardrails (Verification Layer 5)

These run continuously, not per step. Add each one at the step named, then never turn it off.

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, static analysis, tests, in one command | 0 | Everything below, in one place |
| Laravel Pint | 0 | Formatting arguments |
| Larastan level 8 | 0 | Type errors, undefined properties, wrong Eloquent return types |
| Pest against real PostgreSQL | 4 | Constraint behaviour, unique violations and locking that SQLite hides |
| The reconciliation suite | 7 | Any change that makes your numbers stop matching the fixture spreadsheets |
| The no-silent-merge test | 5 | An entity-resolution change that merges below the confidence threshold, or merges without an audit record |
| Rector, dry-run in CI | 3 | Dead code and outdated idioms after a framework upgrade |
| CI on every push | 0 | The above, on a machine that is not yours |

The reconciliation suite is the one that matters most. It imports all three fixtures and
asserts that every headline figure matches the sheet exactly. It is the closest thing this
material has to a proof that you understood the business, and it must stay green from step 7 to
the end.

---

## Reading the steps

Every step carries the same parts, described on the
[Getting Started page](../../#how-to-read-a-roadmap-step). Two things to keep in mind while
working through them:

**Mode is not a suggestion.** `LEARN` steps are the ones where letting an agent write the code
costs you the step. Discovery, rule extraction, entity resolution, reconciliation and the
cutover plan all produce output that looks confident and reasonable, and being wrong about any
of them means being wrong about the client's business rather than about your code.

**Steps 12 to 15 are not optional.** A migration that works on your machine and never switches
over is not a migration. Everything the client is actually paying for happens in the last
quarter of this roadmap.
