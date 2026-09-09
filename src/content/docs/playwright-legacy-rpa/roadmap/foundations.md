---
title: Foundations
description: Steps 4–6. Tooling and the deliberately awful legacy portal, the run and evidence ledger, and the first read-only flow.
sidebar:
  order: 3
---

## Step 4 — Tooling, harness, and the legacy portal

**Story:** *As a developer, I have a realistic legacy system to automate that I am allowed to break, and one command that verifies everything I write.*

**Mode:** `BUILD` — infrastructure and a fixture. Building the portal teaches you what you are up against.

**Why now:** First code step. Everything runs against this portal, and building it yourself means you have met each of its behaviours deliberately before you have to survive them.

**Concepts:**
- **Why you build the adversary.** A clean sample application teaches nothing. Writing the session timeout yourself is the moment re-authentication stops being a paragraph.
- **What the portal has to do**, all of it from real systems: a fifteen-minute session, a "session expiring" modal one time in ten, element ids regenerated on deploy, a table whose column order differs between two screens, a submit that returns to a list with no confirmation, a five-page wizard that can fail on page four, inconsistent render timing, a rate limiter, and screens full of realistic personal data.
- **Deterministic awfulness.** Every behaviour must be forceable from a test, with a seed. A portal that fails randomly makes every test flaky and the suite gets disabled.
- **The vendor update, built now and hidden.** Write it at step 4, behind a flag, and do not look at it again until step 11. Knowing what changes in advance defeats the exercise.
- **Playwright's model**: browser, context, page. A context holds cookies and storage, which is how you save an authenticated session and reuse it instead of logging in a hundred times.
- **Headed and headless.** Develop headed — watching a bot work is the fastest debugging there is. Run headless. Confirm both behave the same, because they sometimes do not.
- **Tracing on from day one.** Playwright's trace is a recording of the run — DOM snapshots, actions, timings. It is your evidence, your debugger, and later your audit artefact.
- **Loop engineering**, and `any` banned: everything read off a page arrives as a string of unknown meaning.

**Libraries:** Playwright, TypeScript 5.9, Vitest, ESLint, Prettier, Docker + Compose (PostgreSQL 18, the portal), a small server framework for the portal

**Expected outcome:** A Compose stack with PostgreSQL and the legacy portal. The portal implementing every listed behaviour, forceable and seeded, with the vendor update written and hidden behind a flag. Playwright configured with tracing, headed and headless. `npm run verify` running lint → types → tests. `AGENTS.md` v1 + `CLAUDE.md` symlink pointing at the four documents from steps 0–3. CI.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — every listed portal behaviour can be forced deterministically from a test; `npm run verify` exits 0 clean and non-zero on a lint error, a type error and a failing test independently; a trace is produced for every Playwright run. |
| **L2 — Manual checks** | (a) Use the portal by hand for ten minutes as if you were the person doing this daily. Note what annoys you; that is what the bot has to survive. <br>(b) Ask your agent whether it may point a test at a real supplier's site. It must answer no, from `docs/authorisation.md`. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c`, `AP-04-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and the portal annoys you in the way a real one does |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The run ledger and the evidence store

**Story:** *As Marisol Foods, three years after a filing, I can show a regulator exactly what was submitted and what the portal said back.*

**Mode:** `LEARN` — this schema decides whether idempotency and evidence are possible at all, and both are impossible to retrofit.

**Why now:** Before any flow touches anything. A bot that has already submitted things you cannot account for is not fixable by a migration.

**Concepts:**
- **These systems give you nothing to deduplicate on.** No idempotency key, often no reference you control, sometimes no unique identifier at all until after submission. So the deduplication is yours: a **natural key** made from the client's own data — the purchase order number, the return period and client — recorded before you act.
- **The three-part write.** Check the ledger; check the remote system if you can see it; then act; then verify and record the remote reference. Any two of those without the third leaves a case you cannot resolve.
- **The rung used, on every step.** This single field makes the ladder measurable, and it is what step 11 and step 13 both read.
- **Evidence is a first-class record**, not a folder of files: a screenshot or trace reference, what it shows, when it was taken, whether it was masked, and its retention date. Retention is set at capture, because deciding later means never.
- **Masking is a capture-time concern.** Blurring a screenshot after storing it is too late; the unmasked version existed. For Kestrel this determines the shape of the evidence code, so it is designed now.
- **Interventions are records.** When a person had to step in — the ladder reached rung 4 — why, and what they did. That is your maintenance cost from step 0, measured rather than guessed, and step 13 prices it.
- **What must never be stored**: credentials, and any personal data beyond what the evidence needs. An evidence store is the easiest place in this whole material to create a breach.
- **Retention per client, enforced by a job**, not by intention.

**Libraries:** a migration tool and a query builder, plus object storage or a disk volume for evidence

**Expected outcome:** Migrations and models for `clients`, `flows`, `runs`, `step_results` (including the rung used), `evidence`, `remote_writes` (with a natural key and a unique constraint) and `interventions`. An evidence store with capture-time masking, a retention date on every item, and a job that enforces it. Client-scoped throughout. A log configuration that never holds credentials or page content.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — a second remote write with the same natural key is rejected by a database constraint rather than by application code; every evidence item has a retention date and the job removes expired items; an unmasked screenshot cannot be stored for a client configured to require masking. |
| **L2 — Manual checks** | (a) Write down how you would answer a regulator asking what Marisol filed in March, using only the ledger and evidence. Every gap is a missing field. <br>(b) Look at what your evidence store would contain after a month of Kestrel runs. If that set leaking would be a serious problem, reduce what you capture now. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and a run's evidence answers "what happened?" without the code |

**Harness impact:** `AGENTS.md` v2 — record the natural-key rule, that the rung used is recorded on every step, that masking happens at capture, and that credentials and page content never reach a log.

---

## Step 6 — The first flow: log in, read, record

**Story:** *As Kestrel Clinic, tomorrow's appointment list arrives as a file every evening, from a system that has no export.*

**Mode:** `BUILD` — the first real automation, deliberately read-only.

**Why now:** Read-only first. A bot that cannot change anything is safe to get wrong while you learn the mechanics, and Kestrel's flow teaches waiting, tables and sessions without any risk of a duplicate write.

**Concepts:**
- **Authentication once, reused.** Log in, save the storage state, and start subsequent runs from it. Logging in on every run is slow, noisy on the client's system, and a good way to trigger a lockout.
- **Waiting for a condition, never a duration.** `sleep(3000)` is the single most common cause of a flaky bot. Wait for the element, the response, or the state — and set timeouts that are generous but finite.
- **Reading a table properly.** Header-relative, not position-relative, because the portal changes column order between two screens on purpose. This is a small lesson that saves a large amount of pain.
- **Pagination and completeness.** How do you know you read *all* the appointments? A count on the page, a last-page marker, or a deliberate check. A bot that silently reads the first page is wrong in a way nothing reports.
- **The empty result is ambiguous.** No appointments tomorrow, or a page that failed to load? These need different outcomes, and conflating them is how a clinic's staff get told there is nothing on a day that is full.
- **Session expiry mid-run**, and the modal. Detect, re-authenticate, resume at the step you were on — not restart the run. Restarting a read is merely wasteful; the same reflex on a write flow is a duplicate.
- **Politeness in practice**: pacing between pages, one session at a time, and the permitted hours from step 3 enforced in code.
- **Evidence on a read flow too.** A screenshot of what you read, masked, plus the parsed output. When the clinic says "that appointment was not on the list", you can look.

**Libraries:** Playwright, your ledger

**Expected outcome:** A Kestrel flow that authenticates once and reuses state, reads the full appointment list with a completeness check, distinguishes empty from failed, handles the expiry modal and mid-run re-authentication with a resume, paces itself, records step results with the rung used, and stores masked evidence. Output written as a file the clinic can use.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — a forced session expiry mid-run re-authenticates and resumes at the interrupted step rather than restarting; a page with three pages of appointments returns all of them, asserted individually; a failed page load produces a distinct outcome from an empty list; no `sleep` with a fixed duration appears in the flow. |
| **L2 — Manual checks** | (a) Run it headed and watch. Everywhere you tense up is a place the bot is guessing. <br>(b) Force the modal to appear at five different points in the flow. One of them will break it; that is the test to write. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and the flow survives every interruption the portal can produce |
