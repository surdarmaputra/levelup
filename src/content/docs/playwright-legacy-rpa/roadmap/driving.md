---
title: Driving
description: Steps 7–10. The resilience ladder, the first write with idempotency you build yourself, the submission that cannot be undone, and screens full of personal data.
sidebar:
  order: 4
---

## Step 7 — The resilience ladder

**Story:** *As a developer, my bot finds elements the way a person recognises them, falls back only when that fails, and tells me every time it had to.*

**Mode:** `LEARN` — the central design of the material, and the one an agent will build upside down.

**Why now:** After a working read flow, before any write. The ladder is what makes everything after it survivable, and retrofitting it means rewriting every locator.

**Concepts:**
- **Rung 1 — semantic locators.** Find by role and accessible name: *the button called "Submit return"*, *the textbox labelled "Quantity"*. This is how a person identifies an element, and it survives layout changes, styling changes and most rewrites for free. It is also, quietly, the largest reason modern browser automation is more robust than the generation that gave RPA its reputation.
- **What never to use.** Generated ids — the portal changes them on every deploy, on purpose. Long CSS or XPath chains that encode the page's structure. Text that is a formatted value rather than a label. Position, unless there is genuinely nothing else.
- **Rung 2 — a structural fallback**, recorded deliberately per element: a stable nearby anchor, a header-relative table cell. One fallback, chosen and written down, not a pile of guesses.
- **Rung 3 — the vision model.** A screenshot and a description of what you are looking for; the model returns where it is. Used only after rungs 1 and 2 have both failed, which on a healthy bot is almost never.
- **Rung 4 — a person.** The page is not the page. Stop, capture evidence, alert. Guessing further from here is how a bot fills in the wrong form.
- **The three rules that make this a ladder rather than a fallback chain:**
  1. **Every rung-3 use is reported.** An interface changed. That is news.
  2. **A rung-3 success becomes a rung-1 fix**, committed. Healing buys you the night, not the year.
  3. **The rung-3 rate is monitored.** It rises before anything breaks, which makes it the earliest warning you have.
- **Why not model-first**, stated so you can defend it: it is slower, it costs money per step, it is non-deterministic on a task that has an exact answer — and worst, it *hides* interface changes. The locator failing is the signal. Model-first discards it.
- **Testing the ladder's order.** A test that asserts no model call happens when a locator succeeds. Under time pressure this is the discipline that slips first, so it is enforced in CI.
- **What the model is given.** A screenshot and a description. Not credentials, not the page's full text if it contains personal data — Kestrel's screens are masked before they go anywhere.

**Libraries:** Playwright locators, the `anthropic` SDK for rung 3 with a faked implementation for tests

**Expected outcome:** A locator abstraction implementing all four rungs, recording the rung used on every step result. Semantic locators throughout the Kestrel flow, with a written structural fallback per element. Rung 3 implemented, masked, faked in tests. A reporting path for every rung-3 use. A rung-3 rate metric. A CI test asserting the ladder's order and another rejecting id-based locators.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — no model call occurs when a semantic locator succeeds, asserted across a full flow run; when a locator is deliberately broken, rung 2 then rung 3 are used in order and the rung-3 use is reported exactly once; no locator in the codebase depends on a generated id. |
| **L2 — Manual checks** | (a) Break one locator and watch the ladder work headed. Then check that the report you receive tells you which element and which page. If it does not, you cannot fix it in the morning. <br>(b) Redeploy the portal so every id changes. Nothing should break. If something does, that locator was wrong. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and the rung-3 rate on a healthy run is zero |

---

## Step 8 — The first write, and idempotency you build yourself

**Story:** *As Halden Timber, when the bot runs twice, my supplier receives one order.*

**Mode:** `LEARN` — idempotency against a system with no support for it, which is a genuinely different problem from every other material in this catalog.

**Why now:** After the ladder, before the irreversible flow. Halden's writes are correctable, which makes this the safest place to learn.

**Concepts:**
- **There is no idempotency key, and there never will be.** The portal will accept the same order twice, cheerfully, and give you two references. Everything below exists because of that.
- **The natural key.** Made from the client's own data — order number plus supplier plus date — recorded in your ledger *before* you submit. It is the only stable identity available.
- **Check the ledger, then check the remote system.** Your ledger says whether *you* think you submitted. The remote system says whether it happened. They disagree exactly when it matters: after a crash between submit and record.
- **The crash window is real and cannot be eliminated, only narrowed and handled.** Write the intent before acting, so a crash leaves a record saying *I was about to*. On the next run, that record means "go and look" rather than "submit again".
- **Verify after write, always.** The portal returns you to a list with no confirmation, so the only way to know is to search for the order and read back its reference. This is the step where "the screen said saved" stops being evidence.
- **Record the remote reference.** It is what a person uses to resolve any dispute, and without it your ledger and the supplier's system cannot be reconciled.
- **What to do when verification says the write did not happen.** Retry once, then stop and alert. Retrying blindly is how a supplier receives four orders.
- **What to do when verification is ambiguous** — the search returns two matching orders. Stop. This is a rung-4 event with a person, not something to resolve automatically.
- **Rate limits and the burst.** Fifty orders is a burst. Pace it, and handle the lockout that happens anyway.
- **A dry run mode.** Every step except the submit. It is how you demonstrate the bot to a client without touching their supplier, and it will be the most used feature you build.

**Libraries:** Playwright, your ledger

**Expected outcome:** A Halden flow entering orders with a natural key recorded before submission, a check against the ledger and the remote system, verify-after-write reading back the remote reference, one retry then alert, an explicit stop on ambiguity, pacing with lockout handling, and a dry run mode. Tests forcing a crash between submit and record.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — running the same day's orders twice results in one order per line at the portal, verified by reading the portal rather than the ledger; a forced crash between submit and record results in the next run finding the existing order rather than submitting again; two matching orders on verification stops with an intervention rather than choosing. |
| **L2 — Manual checks** | (a) Kill the process at five different points in the write and re-run each time. One of them will produce a duplicate; that is the test you are missing. <br>(b) Run the dry mode in front of someone and see whether they trust it more than a description. They will. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and you would let it run unattended against a supplier |

---

## Step 9 — The submission that cannot be undone

**Story:** *As Marisol Foods, when the filing fails on page four of five, the bot does the right thing — and I can prove what was and was not submitted.*

**Mode:** `LEARN` — the point of no return is a real button on a real page, and that changes how you think about it.

**Why now:** After idempotency, because a one-shot submission needs everything from step 8 plus a plan for the half-finished case.

**Concepts:**
- **The wizard is state you do not own.** Five pages, a server-side session, and a partially completed return sitting in the portal. Abandoning it does not clear it; the next run may find it half-filled.
- **Find the point of no return and name it.** For Marisol it is the confirm button on page five. Before it, everything is recoverable — abandon, start again, no harm. After it, the return is filed and the only remedy is whatever the regulator's amendment process is, which is a person's job.
- **Order the flow so the irreversible step is last**, and so everything checkable is checked before it. Most of the hard cases disappear by ordering alone.
- **Validate before submitting, not after.** Read the summary page and compare it against what you intended to file, field by field. This is the cheapest and most valuable check in the whole flow, and it is the one a person doing this manually also does.
- **A failure on page four**: the return is half-filled and the session may die. The options are resume the existing draft, abandon and restart cleanly, or stop for a person. Choose per flow, write it down, and implement one — not a mixture decided at runtime.
- **Resuming a draft is harder than it looks.** You must establish what the draft already contains rather than assuming it matches your intent. Read it back.
- **Never retry past the point of no return.** A retry there is a second filing. Mark the step, and make retry refuse structurally rather than by convention.
- **Evidence at the boundary.** Screenshot the summary before confirming, and the receipt after. Those two images are what a regulator asks for, three years later, and they are the reason evidence was designed at step 5.
- **The dry run matters most here**, and it must stop exactly at the point of no return — proving the whole flow works without filing anything.

**Libraries:** Playwright, your ledger and evidence store

**Expected outcome:** A Marisol flow with a named point of no return, the irreversible step last, a field-by-field summary validation before confirming, one written and implemented policy for a mid-wizard failure, a structural refusal to retry past the boundary, before-and-after evidence captured, and a dry run that stops exactly at the boundary.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — a forced failure on page four results in the written policy being applied and no partial filing recorded as complete; retrying a run past the point of no return is refused structurally; the summary validation fails the run when a value differs from intent; both evidence images exist for a successful filing. |
| **L2 — Manual checks** | (a) Fail the wizard on each of the five pages. Write down what happened. If any two are handled the same way and should not be, you have a gap. <br>(b) Read the evidence pack for one filing as if you were a regulator. If you cannot tell what was submitted, it is not evidence. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and you could explain to Marisol exactly what happens on a bad night |

---

## Step 10 — Screens full of personal data

**Story:** *As a patient at Kestrel Clinic, my name is not sitting in a screenshot on a developer's server.*

**Mode:** `LEARN` — a design constraint that decides what your evidence code can look like.

**Why now:** After the flows work. Masking is a constraint on a working system, and designing it into one that does not work yet produces theatre.

**Concepts:**
- **Evidence and privacy pull in opposite directions**, and this step is where you resolve it deliberately rather than by accident. You need proof of what happened; you must not accumulate a database of patient names.
- **Mask before capture, not after.** Apply the mask in the page — hide or overlay the sensitive regions — then take the screenshot. Capturing and then blurring means the unmasked image existed, was written somewhere, and may be in a temporary file or a trace.
- **Playwright's trace is the trap.** It records DOM snapshots, which contain the text. A trace of a Kestrel run is a full copy of the appointment list. Either mask before the trace is recorded, or do not trace this flow — and know which you chose.
- **What evidence is actually needed.** Usually: that the bot reached the right page, that the count matched, and that the run completed. That can often be satisfied without a single name on screen. Ask what question the evidence must answer before deciding what to capture.
- **Structured data has the same problem.** The appointment list you produce is patient data. Where does it go, how is it transferred, who can read it, how long does it live.
- **Logs and error messages leak most.** An exception carrying the page's HTML into an error tracker is the most common real breach in this kind of work.
- **Retention as a job, per client.** Kestrel's evidence lives for days; Marisol's for years. Both are enforced, not aspirational.
- **Where the model fits.** If a rung-3 screenshot goes to a model, it goes masked. This is the specific case where the fallback and the privacy rule meet, and it needs a test.
- **Say it plainly to the client.** What is captured, what is masked, where it lives, how long, and who can see it. One paragraph, in the language they use.

**Libraries:** Playwright masking options, your evidence store

**Expected outcome:** Capture-time masking for Kestrel across screenshots, traces and any page text that leaves the process. A written statement of what evidence must prove and the minimum capture that proves it. Error handling that cannot carry page content into a log or tracker. Per-client retention enforced by a job. A test that a rung-3 screenshot is masked before it leaves. `docs/evidence-and-privacy.md`, including the client-facing paragraph.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — no stored screenshot or trace from a Kestrel run contains an unmasked name, asserted by searching the stored artefacts; a forced exception mid-run produces a log entry with no page content; a rung-3 fallback on a Kestrel page sends a masked image; retention removes Kestrel evidence past its window. |
| **L2 — Manual checks** | (a) Open every artefact from one Kestrel run and read it as if you found it on a lost laptop. Anything that would matter comes out. <br>(b) Read the client paragraph to someone non-technical and ask what is kept. Rewrite until they can say it back. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and the evidence store would be unremarkable if someone read all of it |

**Harness impact:** `AGENTS.md` v3 — record the ladder order and its reporting rule, the natural-key idempotency pattern, the point-of-no-return convention, and that masking happens at capture including for traces and rung-3 images.
