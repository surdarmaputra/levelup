---
title: Operations
description: Step 15. Deploy, credentials, handover, drift, the monthly report — and knowing when to tell the client to stop paying you for this.
sidebar:
  order: 7
---

## Step 15 — Deploy, handover, and knowing when to stop

**Story:** *As Halden Timber, this runs every night without me, my developer tells me when the supplier changes something, and if the supplier ever ships an export, my developer tells me that too.*

**Mode:** `BUILD` for the deployment, `LEARN` for the rest.

**Why now:** Last. It needs the ladder, the ledger, the evidence, the two-portal suite and the cost report.

**Concepts:**

**Deploy.**
- **What has to run**: the scheduler, the worker with a browser, PostgreSQL, and the evidence store. One Compose file, one host — but a host with enough memory for the browsers, which is the one place this material's infrastructure is not the cheapest option available.
- **Browsers in a container.** Pin the image and the browser version together. A browser that updates underneath you changes rendering and timing, and it will do it on a night you are not watching. This is drift you can prevent, unlike the vendor's.
- **Credentials.** Scoped to a service account where the system allows one, from the environment, rotatable, and never in a screenshot, a trace, a log or the ledger. A bot logging in as a named person makes the client's own audit trail wrong, and step 3 already said to ask.
- **Two-factor authentication**, which many portals now have. Whatever the arrangement is — an exempted service account, a shared token held properly, a person completing a step monthly — it is a decision made with the client and written down, never a workaround you invented.
- **Backups**, restored and verified. The evidence store is the part a regulator asks for, and it is the part most likely to be excluded from a backup because it is "just files".
- **The runbook**: a failed nightly run, a locked-out account, a portal redesign, an evidence request from an auditor, a run that filed something wrong. Five pages.

**Handover.**
- The ledger, the evidence and the flows are the client's. Exports must exist and be readable.
- **Write down the portal's quirks.** The modal, the column order, the fifteen-minute session. That knowledge was one person's before; do not let it become yours alone. This document is more valuable to the client than the code.
- Whatever the client cannot do without you, name it in the handover rather than leaving it implicit.

**Drift, ongoing.**
- **The rung-3 rate is the leading indicator.** Rising means the interface is moving. Watch it per flow, against its own baseline.
- Also watch: run duration creeping up, sanity checks failing more often, and interventions clustering on one flow.
- **Re-run the two-portal suite on a schedule**, not only on change. Your bot did not change; the browser did, or the portal did.

**The monthly report.**
Runs, success rate, interventions and what caused them, hours saved against step 0, your
maintenance hours, and anything that changed at the supplier's end. One page, generated, sent
whether or not anything happened. Publishing your own maintenance hours is unusual and it is
what makes the retainer legible.

**Knowing when to stop.**
This is the last idea in the material and it is the one that keeps clients.

- **If an API or an export appears, take it.** Migrate the flow and retire the bot. A browser bot
  is a workaround, not an achievement, and the client is better off.
- **If the vendor ships an integration tier**, price it against your retainer honestly.
- **If a flow is not worth its maintenance**, say so. Step 14's numbers make that a calculation
  rather than an opinion.
- Ask the client's software vendor once a year whether anything has changed. Step 2 said to check
  for a door before picking the lock; this is the same check, repeated, because doors get built.

**Libraries:** Docker Compose, a scheduler, your CI

**Expected outcome:** A deployment on one host sized for the browsers, with pinned browser and image versions, scoped credentials from the environment, a documented two-factor arrangement, and backups restored and verified including the evidence store. `docs/RUNBOOK.md` with five scenarios. A portal-quirks document. Per-flow rung-3 rate monitoring with alerts, and the two-portal suite on a schedule. An automatically generated monthly report per client including your maintenance hours. A written retirement policy: the conditions under which you would tell each client to stop paying for this.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — a full rebuild from git, backups and documented secrets reproduces every flow and passes the two-portal suite; a rising rung-3 rate on one flow raises an alert against that flow's own baseline; no credential appears in any screenshot, trace, log or ledger row across a week of runs. |
| **L2 — Manual checks** | (a) Hand the portal-quirks document to someone and ask them to complete one flow by hand. Every question they ask is a missing line. <br>(b) Write the retirement note for Halden — the message you would send the day their supplier launches an API. Having written it, you will send it. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d`, `AP-15-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and you know exactly when you would tell each client to stop |

> **What you have at the end.** A recording of a bot filing fifty records into an awful legacy system, the evidence pack that proves what it did, a run where the vendor changed the interface and the bot survived, and a cost report that includes your own hours honestly. The middle two are the ones nobody else has.
