---
title: Roadmap Overview
description: Locked decisions, the resilience ladder, the deliberately awful legacy portal, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with TypeScript and SQL. New to Playwright and to browser automation as an integration technique. |
| Language / runtime | TypeScript 5.9 on Node 24, `strict`, `any` banned |
| Browser | Playwright, Chromium. Contexts, stored authentication state, locators, tracing. |
| The ladder | Deterministic locators first, structural fallback second, a vision model third, a person fourth. In that order, always. |
| Model | Claude via the `anthropic` SDK, **used only when a locator has failed** — never as the primary way to find an element |
| Why not model-first | Slow, expensive and non-deterministic for a job a locator does exactly and instantly. Model-first also hides interface changes instead of reporting them. |
| Database | PostgreSQL 18 — the run ledger, evidence index, and what each run already did |
| Evidence | Screenshots and Playwright traces stored per run, masked before capture where the screen holds personal data |
| Idempotency | Implemented by you, because these systems have no support for it: a ledger, check-before-write, verify-after-write |
| Irreversible steps | A named point of no return per flow, with a defined behaviour for a failure after it |
| Target system | **The shipped legacy portal only.** Never a third party's live site. |
| Scheduling | A scheduler and a worker on one host. A failed run reaches a person before it reaches the client. |
| Testing | Vitest and Playwright's own runner against the legacy portal. The vision model is faked except in the ladder tests. |
| Quality | ESLint + Prettier, `tsc --noEmit` strict |
| Ops | Docker Compose on one host with enough memory for a browser |
| AI harness | `AGENTS.md` from step 4, evolving v1→v3 |

**Note on step count:** 16 numbered steps, 0 through 15. Steps 0–3 contain no code, and step 3 —
authorisation and refusal — is not optional.

---

## Why this domain

Enterprises run roughly a thousand applications each and only a minority are integrated. Most of
the rest will never get an API. That gap does not close, and the work to bridge it is
unglamorous, which is exactly why it pays.

- **No API and never will** → driving an interface as a real integration technique
- **Interfaces change silently** → a ladder that recovers *and reports*
- **No idempotency support** → doing it yourself, against a system that will happily take the order twice
- **Some submissions cannot be undone** → a point of no return on an actual page
- **An auditor will ask** → evidence as a feature
- **The screen holds personal data** → masking before capture, not after
- **Sessions expire mid-task** → resuming rather than restarting
- **It is someone else's software** → authorisation, politeness, and the jobs to refuse

---

## The three example clients

| Client | What Hinge does | The rule it exists to break |
|---|---|---|
| **Halden Timber** `halden` | Enters the day's purchase orders into a supplier's web-only ordering portal, then reads back the confirmation numbers | The write baseline. High volume, correctable — but the portal has no idempotency, no reference you control, and no way to ask "did I already submit this?" except by looking. You build all three. |
| **Marisol Foods** `marisol` | Files a monthly regulatory return: a five-page wizard, a session that expires in fifteen minutes, and a final submit that cannot be withdrawn | One shot. The point of no return is a real button on a real page. A failure on page four of five leaves a half-filled return and a decision to make. And the evidence must survive years, because that is what a regulator asks for. |
| **Kestrel Clinic** `kestrel` | Reads tomorrow's appointment list from a scheduling system with no export | Read-only, and still the hardest. Every screenshot contains patient names. Masking has to happen *before* capture, the evidence trail has to be useful without being a data breach, and retention is a rule rather than a preference. |

Questions to keep asking: if Halden's run repeats, how many orders exist at the supplier? If
Marisol's session dies on page four, what does the bot do? And if you handed Kestrel's evidence
pack to someone, what would they learn that they should not?

None of the three may be special-cased in code.

---

## The resilience ladder

The central design of the material, and the thing most people get backwards:

| Rung | What it is | When it runs |
|---|---|---|
| **1. Semantic locator** | Find by role, label, or accessible name — what the element *is* | Always first. Fast, exact, free, and resilient to layout changes. |
| **2. Structural fallback** | A recorded alternative — a nearby stable anchor, a table position | When rung 1 finds nothing, and only then |
| **3. Vision model** | A screenshot goes to the model: *find the field labelled Quantity for row three* | When rungs 1 and 2 both fail. Rare on a healthy bot. |
| **4. A person** | Stop, capture the evidence, alert | When the model cannot find it either, or when the page is not the page we expected at all |

Three rules that make the ladder work, and without which it is just a fallback chain:

1. **Every drop to rung 3 is reported, not absorbed.** A bot that silently heals hides the fact
   that the interface changed, and the next change breaks it completely.
2. **A rung-3 success becomes a rung-1 fix.** The model tells you where the element went; you
   update the locator and commit it. Self-healing is a way to survive the night, not a way to
   live.
3. **The rung-3 rate is a monitored number.** Rising means the interface is drifting under you,
   and it rises before anything breaks.

Get this backwards — model first, locator as backup — and you have a bot that is slow,
expensive, non-deterministic, and blind to the one thing it most needs to notice.

---

## The legacy portal

The material ships its own adversary, and here that solves two problems at once: it gives you
something realistic to automate, and it means you never point this work at a third party's live
site.

Step 4 brings up a deliberately awful web application, serving all three clients' screens:

| Behaviour | What it teaches |
|---|---|
| A session that expires after fifteen minutes, mid-task | Re-authentication that resumes rather than restarts |
| A "your session will expire" modal that appears about one time in ten | Interruptions that are not errors, and waiting for the right thing |
| Element ids regenerated on every deploy | Why ids are the worst possible locator, learned rather than asserted |
| A table whose column order changes between two screens | Structural fallbacks, and why "third cell" is fragile |
| A submit that returns you to a list with no confirmation | Verify-after-write, because the interface will not tell you |
| A five-page wizard that can fail on page four | The point of no return, and half-finished state |
| A page that renders slowly and inconsistently | Waiting for a condition, never for a duration |
| A rate limiter that locks you out after a burst | Politeness toward a system you do not own |
| Screens full of realistic personal data | Masking before capture |
| **A scheduled "vendor update" at step 11** | The whole of RPA in one event: the buttons move, the labels change, and your bot has to survive it |

The vendor update is the centrepiece. It is the failure this technique is famous for, it is
impossible to stage against a live site, and it is why the portal is ours.

---

## The run model (target state)

```
Client ──has──> Flow (name, version, the steps it declares, its point of no return)
   │
   └──has──> Run ──has──> StepResult (step, rung used, duration, status)
                │
                ├──has──> Evidence (screenshot or trace ref, masked, retention date)
                ├──has──> RemoteWrite (natural key, submitted at, verified at, remote reference)
                └──has──> Intervention (why a person was needed, what they did)
```

- A **RemoteWrite** carries a **natural key** — the client's own order number, the return period
  — because the remote system gives you nothing to deduplicate on. That key plus the ledger is
  your idempotency, and it is the only one available.
- **Evidence** has a retention date from the moment it is captured. Kestrel's screenshots cannot
  live forever, and deciding that later means deciding it never.
- The **rung used** is recorded on every step result. That single field is what makes the
  rung-3 rate measurable and drift visible.

---

## Global guardrails (Verification Layer 5)

| Guardrail | From step | What it catches |
|---|---|---|
| `npm run verify` — lint, types, tests | 4 | Everything below |
| `tsc --noEmit` strict | 4 | The shapes returned from a page |
| Playwright tests against the legacy portal | 6 | Real waiting, real timing, real failures |
| The no-id-locator test | 7 | A locator that will break on the next deploy |
| The ladder-order test | 7 | A model call made before a locator was tried |
| The no-unverified-write test | 8 | A submission recorded as done without being read back |
| The masking test | 10 | Personal data in a stored screenshot |
| The vendor-update suite | 11 | A change to the interface that the bot cannot survive |
| CI on every push | 4 | The above, on a machine that is not yours |

The ladder-order test is the one that keeps the design honest. It is very easy, under time
pressure, to reach for the model first.

---

## Reading the steps

**Steps 0 to 3 have no code and are not optional.** Step 3 is authorisation: whose software this
is, what you are permitted to do, how fast you may do it, and which jobs to refuse.

**Mode is not a suggestion.** The ladder, idempotency without server support, the point of no
return, and masking all produce code that looks reasonable and is quietly wrong.

**Step 11 is the step.** Every bot works on the day it is written. Step 11 is the day the vendor
ships an update, and it is the only part of this material that cannot be faked with a tutorial.
