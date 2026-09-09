---
title: Concepts
description: Steps 0–3. What the clicking costs, why RPA has a reputation for breaking, what the vendors sell, and whose permission you need before you automate anything.
sidebar:
  order: 2
---

Four steps, no code. Step 3 is the one that separates this from scraping, and it is not
optional.

---

## Step 0 — What the clicking costs

**Story:** *As someone about to build this, I can state what a business spends on operating this software by hand, and what a wrong entry costs.*

**Mode:** `LEARN` — nothing to build.

**Why now:** First. Every design decision — how much verification, how much evidence, whether a person checks — comes from these two numbers.

**Concepts:**
- **Count the screens, not the task.** Nine screens to file one order is a different problem from one screen ninety times. Watch someone do it and count.
- **The arithmetic.** Items per period × minutes each × loaded hourly cost. Per flow, per client.
- **The wrong-entry cost, which is different every time.** Halden's duplicate order is stock that arrives and money that leaves. Marisol's wrong return is a regulatory problem. Kestrel's is a mis-scheduled patient. Each one implies a different amount of verification, and that is the point of costing them separately.
- **The concentration cost.** Usually one person knows the portal's quirks. That knowledge is undocumented and it leaves with them.
- **The out-of-hours cost.** A bot can file at 03:00. Sometimes the value is not the labour but the fact that the work is done before the day starts.
- **Where automation saves nothing.** If the clicking is five minutes of a two-hour process that also involves phone calls and judgement, automating the clicking is a rounding error.
- **The maintenance cost, honestly, on your side.** This technique needs looking after. A bot that saves ten hours a month and costs you three to maintain is a different proposition from one that costs you twenty minutes. Estimate it now, badly, and correct it at step 15.

**Libraries:** none. A spreadsheet and an hour beside the person doing it.

**Expected outcome:** `docs/business-case.md` — per client: the flow, screens per item, items per period, minutes each, loaded cost, annual total; then the cost of one wrong entry with the reasoning; then your honest estimate of monthly maintenance. Every input sourced or marked as an assumption.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — every client has a labour cost, a wrong-entry cost, and an estimated maintenance cost, all derived rather than asserted. |
| **L2 — Manual checks** | (a) Work out Halden's annual figure and then subtract your maintenance estimate. If what remains is small, say so now — a small real project is fine; a small project you discover after building is not. <br>(b) Ask what happens today when the person who knows the portal is away. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, and you can state the net annual value of each bot after maintenance |

---

## Step 1 — Why RPA has a reputation for breaking

**Story:** *As a developer, I can explain why this technique became notorious, and what specifically has changed.*

**Mode:** `LEARN` — the mental model.

**Why now:** Before tooling. The ladder at step 7 is the answer to this step's question, and it will not make sense without it.

**Concepts:**
- **What RPA is**: software operating other software's interface because there is no other way in. No robots. The name is bad and it stuck.
- **The five stages** — locate, act, read, verify, recover — and why the last two are the ones people skip.
- **Why it broke, historically.** Bots were pinned to coordinates or generated ids. A vendor shipped a UI update, a button moved twenty pixels, and every bot in the company failed at once, silently. Maintaining them became a full-time job, which is the origin of the joke that RPA saved ten hours of clerical work and created ten hours of bot maintenance.
- **The three things that changed:**
  1. **Semantic locators.** Finding an element by its role and accessible name — what it *is* rather than where it sits — survives most layout changes for free. This is the largest of the three and it predates the AI part.
  2. **Vision fallback.** When the locator genuinely fails, a model can look at the screenshot and find the element. The bot recovers instead of dying.
  3. **Better waiting.** Modern tooling waits for a condition rather than a duration, which removes an entire family of flaky failures.
- **The discipline that makes the AI part work: use it last.** Model-first is slow, expensive, non-deterministic, and — worst — it *hides* interface changes, because the bot keeps working and nobody learns the page changed. The value of a locator failing is the signal, and model-first throws that signal away.
- **Self-healing must report.** Recovery buys you the night. The fix is a locator update committed in the morning. A bot that heals silently accumulates drift until it fails completely, at a moment nobody chose.
- **Verification is what makes it an integration rather than a demo.** The screen said "saved". Was it saved? On a system with no API, the only answer is to go and look.
- **Where this technique is the wrong answer**: if an API exists, use it; if the vendor sells an export, buy it; if the client's supplier can send a file, ask for one. Reaching for a bot when a door exists is a fault, and step 15 says the same thing again at the other end.

**Libraries:** none. Open a page and read its accessibility tree in the browser's dev tools.

**Expected outcome:** `docs/how-rpa-breaks.md` — the five stages, the historical failure and its cause, the three changes, and the ladder written out with the rule that the model runs last and always reports. Plus, for each of the three clients, one specific thing about their flow you expect to break first.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — the document states the ladder in order, gives the reason the model runs last in terms of signal rather than cost alone, and names an expected first breakage per client. |
| **L2 — Manual checks** | (a) Open any complex web application and find three elements by role and accessible name in the dev tools. That gesture is rung 1 of the ladder. <br>(b) Write down what a model-first bot would fail to tell you. That is the argument you will make to the next person who suggests it. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can explain in one minute why the model is the third rung and not the first |

---

## Step 2 — What you could buy instead

**Story:** *As someone quoting for this work, I know what the RPA vendors sell and what it costs, and sometimes my answer is that the client should ask their software vendor for an export.*

**Mode:** `LEARN` — research and judgement.

**Why now:** Before building. The cheapest outcome for the client is often not a bot at all, and finding that out is worth more than the project.

**Concepts:**
- **The four things that compete with your bot:**

  | Option | What it is |
  |---|---|
  | Enterprise RPA suites | Established vendors with recorders, orchestrators and their own runtimes. Per-bot or per-runtime licensing, enterprise sales, and a real ecosystem. |
  | Newer AI-driven automation tools | Products that promise a bot from a description, aimed at less technical users |
  | **An API or export you did not know existed** | The one to check first, every time |
  | A person continuing to do it | The honest baseline, and sometimes correct |
- **Check for the door before picking the lock.** Ask the vendor directly whether an API, an export, a file drop or a paid integration tier exists. Ask the client whether anyone else has integrated with this system. A surprising share of "there is no API" turns out to be "nobody asked" or "it costs £200 a year".
- **When an enterprise suite is right**: many bots across a large organisation, a governance requirement, and a budget with a licence line in it. Their orchestration, credential handling and audit are real and mature.
- **When your build wins**: a handful of flows, a small business, a system nobody's product supports, and a client who wants someone accountable rather than a platform.
- **What the vendors do not solve.** Their bots break on interface changes too. The licence buys orchestration and support, not immunity. Say that plainly rather than implying your approach is uniquely fragile or uniquely robust.
- **Price honestly, with dates.** Enterprise pricing is often "contact us"; record what you could verify and when.
- **Total cost of ownership includes maintenance on both sides.** Their licence plus their maintenance versus your build plus your retainer.

**Libraries:** none. Vendor sites, and one email to the client's software vendor.

**Expected outcome:** `docs/build-vs-buy.md` — the four options with at least four named vendor products, pricing where verifiable with dates. **Evidence that you checked for an existing API or export for each of the three clients**, and what you found. A per-client recommendation with the deciding reason. At least one client where the right answer is "ask the vendor for the export first".

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — the document records, per client, whether an API or export exists and how you established it; names four real vendor products with dates; and gives a per-client recommendation with a one-sentence deciding reason. |
| **L2 — Manual checks** | (a) For the client where you were most sure there is no API, write the email you would send their vendor. Sending it is the cheapest possible way to avoid three weeks of work. <br>(b) Price an enterprise suite for a three-bot deployment and compare it to your build plus a retainer. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and you have actually checked for a door before deciding to pick the lock |

---

## Step 3 — Authorisation, politeness, and what you refuse

**Story:** *As a developer, I can say who authorised this bot, what it is permitted to do, how fast, and which jobs I will not take.*

**Mode:** `LEARN` — the step that separates this from scraping.

**Why now:** Last before tooling, and before you write a single line that touches anything. This is also where the material's own rule comes from: you will automate the portal we ship, and nothing else.

**Concepts:**
- **Whose software is it, and who can authorise a bot on it?** Three different cases:
  - **The client's own system**, self-hosted or licensed to them. Their authorisation is usually enough, and their licence may still say something. Read it.
  - **A supplier's portal the client has an account on** — Halden's case. The client is a customer with credentials, and the supplier's terms govern automated access. Ask. Suppliers are often fine with it, and being the customer who asked is worth more than being the one who was caught.
  - **A government or regulated portal** — Marisol's case. Terms are usually explicit, sometimes prohibitive, occasionally supportive with a published interface nobody uses. Read them properly, and if it is prohibited, that is the answer.
- **Get authorisation in writing, from someone who can give it.** An operations manager saying "sure" is not the client's agreement to breach a supplier's terms. Name the authoriser in your scoping document.
- **Credentials belong to a named account, not a shared one.** A bot logging in as a real person makes every audit trail wrong and every departure a crisis. Ask for a service account; if the system cannot do it, record that as a risk with a name on it.
- **Politeness is a technical requirement.** Human-rate pacing, backoff on errors, no parallel sessions against one account, no runs during their peak hours. You are consuming someone else's production capacity, and a bot that behaves is a bot that keeps its access.
- **Rate limits are also a self-defence.** The portal locks you out after a burst, and so will a real one — at the worst possible moment.
- **What to refuse.** Automating a system whose terms prohibit it. Anything where you cannot see the target system before quoting. Credentials with more privilege than the flow needs. Anything that circumvents an access control rather than using an account properly. Bypassing a security check of any kind. Fixed price on a portal you have not used.
- **The material's own rule**: every step here runs against the shipped legacy portal. Not a sandbox with real money, not a client's trial account, not a live site "just to check". We ship the target.

**Libraries:** none.

**Expected outcome:** `docs/authorisation.md` — per client: whose system it is, who can authorise, what the terms say and where you read them, what account the bot uses, the pacing rules, and the hours it may run. Then a refusal list with reasons. Written so a client could sign it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — every client has a named authoriser, a reference to the terms consulted, an account arrangement, pacing rules and permitted hours; the refusal list has at least four entries with reasons. |
| **L2 — Manual checks** | (a) Write the paragraph you would send a supplier asking permission to automate their portal. It is short, and being able to send it is a professional advantage. <br>(b) Take one item off your refusal list and try to argue it is fine. If you can, it was not a principle. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and you would be comfortable showing the authorisation document to the owner of each system |

**Harness impact:** none yet. Keep the four documents in `docs/`; step 4's harness points the agent at `authorisation.md`, which is the one that stops it suggesting you point a test at a real site.
