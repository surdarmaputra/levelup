---
title: Resilience
description: Steps 11–12. The vendor update that breaks your bot on purpose, and unattended runs with an evidence pack and alerting that reaches you first.
sidebar:
  order: 5
---

Two steps. The first is the one this whole material was built for.

---

## Step 11 — The vendor update

**Story:** *As Halden Timber, the supplier redesigned their portal overnight and my orders still went in — and my developer knew about it before I did.*

**Mode:** `LEARN` — this is the event that defines the technique, and how you respond to it is the lesson.

**Why now:** After all three flows work. It has to happen to a bot you believe in, or it teaches nothing.

**Concepts:**

**Turn the flag on. Do not read the diff first.**

The portal has been carrying a vendor update behind a flag since step 4. Enable it and run your
three flows. Something will break. Work from the failures, exactly as you would at 07:00 on a
Tuesday when a client's supplier has shipped a redesign.

- **Triage first, fix second.** Which flows failed, at which step, on which rung? Did anything
  *succeed* that should not have — a field filled with the wrong value because the labels moved?
  A silent wrong success is worse than a failure and it is the one to look for first.
- **What semantic locators survived.** Most of them, if you did step 7 properly. That is the
  payoff, and noticing which ones survived and which did not is more instructive than the fixing.
- **Where rung 3 saved you, and where it should not have.** A model finding a renamed button is a
  good save. A model finding *a* button when the flow's meaning changed is a bad save — the
  ladder recovered and did the wrong thing. Design rung 3's prompt so it can answer "this is not
  here", and treat that as a rung-4 event.
- **The repair loop, which is the actual deliverable of this step:** the model found the element →
  the report told you where → you update the locator → you commit it → the rung-3 rate returns to
  zero. Overnight recovery buys you the morning. The commit is the fix.
- **A change that no ladder survives.** If the update added a required field, no locator strategy
  helps: the flow's meaning changed and a person has to decide what goes in it. Recognising this
  class quickly, and stopping rather than guessing, is a large part of doing this competently.
- **What you tell the client.** Same day: what changed, what the bot did, what you fixed, whether
  anything needs checking. This message is the single strongest argument for the retainer you
  will ever send, and it lands best when they had not noticed yet.
- **Then make it repeatable.** Keep the update as a permanent test scenario, so the next change
  to your bot is checked against both interface versions. A one-off exercise teaches once; a
  suite keeps teaching.

**Libraries:** none new — your ladder, your ledger, your reporting

**Expected outcome:** All three flows working against the updated portal. A written incident note: what broke, what survived, where rung 3 helped, where it helped wrongly, and what class of change no ladder survives. Locator repairs committed, with the rung-3 rate back to zero. A rung-3 prompt that can answer "not present". The vendor update kept as a permanent test scenario, with both versions in CI. The client-facing message drafted.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — all three flows pass against both the original and updated portal in CI; a rung-3 fallback that cannot find the element produces a rung-4 stop rather than a best guess; after repair, a full run on the updated portal makes zero model calls. |
| **L2 — Manual checks** | (a) Before fixing anything, list what broke and predict which ones the ladder would have recovered from. Then check. The gap between prediction and reality is the actual lesson of the step. <br>(b) Read your incident note as the client. If it does not say whether they need to check anything, it is not finished. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, both portal versions pass, and you have a message you would send a client |

> **This is the step.** Every bot works on the day it is written. This is the day the vendor shipped a redesign, and it is the only part of this material that cannot be faked by reading.

---

## Step 12 — Unattended runs, alerting, and the evidence pack

**Story:** *As Marisol Foods, the return is filed at 03:00 on the second of the month, and if it is not, somebody knows before I do.*

**Mode:** `BUILD` — scheduling, alerting and packaging.

**Why now:** After the bot survives change. Scheduling something that cannot survive an interface update just means it fails when nobody is watching.

**Concepts:**
- **Unattended is a different mode.** No human to notice a modal, retry a page, or spot that the numbers look wrong. Everything you did by eye during development has to be a check in code.
- **A schedule with a window, not a moment.** "Between 02:00 and 05:00, once" tolerates a slow night. A single fixed instant turns a five-minute delay into a missed filing.
- **The three failure signals, and they are not the same:**
  - **It failed** — an error, a rung-4 stop. Loud and easy.
  - **It did not run** — the scheduler died, the host rebooted, the container did not come back. Silent, and the worst of the three. A missing run needs its own alarm, because nothing generates it.
  - **It ran and did the wrong thing** — the count was zero when it should not be, the total looks wrong. Only sanity checks catch this.
- **Sanity checks per flow.** Halden: the order count matches the input. Kestrel: an empty list on a weekday is suspicious. Marisol: the filed totals match the source. These are cheap and they catch the failures that produce no error.
- **Alert to a person, once, with what they need.** Which flow, which client, which step, what the evidence shows, and whether a deadline is at risk. An alert that says "run failed" causes a login rather than a decision.
- **Escalation on a deadline.** Marisol's filing has a legal date. Failing on the second is fine if someone is told; failing silently until the fifteenth is not. Deadlines belong in the flow's configuration, and the alert says how long is left.
- **A concurrency lock.** Two runs of a write flow at once is a duplicate. One lock per flow per client, enforced.
- **The evidence pack** as a client deliverable: for a given run or period, the screenshots, the values, the references and the timestamps, in something a person can open. For Marisol this is the artefact a regulator asks for; for Halden it settles a dispute with a supplier.
- **Retention applied to the pack too.**

**Libraries:** a scheduler on the host, your ledger and evidence store, an alerting channel

**Expected outcome:** Scheduled unattended runs with windows, per-flow sanity checks, a missing-run alarm, single alerts carrying flow, client, step, evidence and deadline pressure, deadline escalation for Marisol, a concurrency lock per flow, and a generated evidence pack for a run or a period. All three flows running unattended for a week against the portal.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — a run that does not happen raises an alarm within its window; two concurrent runs of a write flow cannot both proceed; a Halden run whose order count does not match its input fails a sanity check rather than reporting success; the evidence pack for one run contains every screenshot, value and reference from the ledger. |
| **L2 — Manual checks** | (a) Stop the scheduler and confirm you find out. This is the failure people discover in month three. <br>(b) Give the evidence pack to someone and ask what happened in that run. If they cannot say, it is a folder, not a pack. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and you would leave it running while you are on holiday |
