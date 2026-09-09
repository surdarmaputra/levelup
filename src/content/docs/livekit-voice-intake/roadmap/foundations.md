---
title: Foundations
description: Steps 4–6. Tooling and the first real call, the latency budget measured hop by hop, and the call ledger with consent.
sidebar:
  order: 3
---

## Step 4 — Tooling, harness, and the first call

**Story:** *As a developer, I have a phone number that answers and says one sentence, and one command that verifies everything I write.*

**Mode:** `BUILD` — infrastructure and plumbing. Generate, then read every line.

**Why now:** First code step. Getting a real call working is the hardest setup in the catalog, and doing it before any conversation logic means every later problem is a conversation problem rather than a telephony one.

**Concepts:**
- **The three things that have to meet**: a phone number from a telephony provider, a real-time session, and your agent process. Most of the difficulty in this step is that they are three separate accounts with three separate configurations.
- **Why a real-time framework rather than raw audio.** Jitter, packet loss, echo cancellation and codec negotiation are a specialist discipline, and none of them are what this material teaches. Use the framework's transport and spend your attention on the conversation.
- **Sessions, rooms and participants.** The mental model: a call is a session, the caller and the agent are participants, and audio flows between them. Getting this model right now makes the handover at step 11 straightforward instead of confusing.
- **Local development without spending money on every test.** A browser-based client that joins the same session as a caller would. Use it constantly; use the real number to confirm, not to iterate.
- **The disclosure sentence from step 3 is the first thing you build**, not the last. Make the very first working call say it. That ordering keeps it from becoming an afterthought.
- **Secrets and accounts.** Telephony, real-time, recognition, synthesis and the model — five sets of credentials. Environment only, never in the repository, and a spending limit on each account that supports one.
- **Loop engineering**, and `mypy --strict` from the start: audio pipelines pass around shapes that are easy to get wrong and hard to debug at runtime.

**Libraries:** LiveKit Agents, a telephony provider's SDK or SIP configuration, `uv`, ruff, mypy, pytest, Docker + Compose (PostgreSQL 18)

**Expected outcome:** A phone number that, when dialled, connects to your agent and speaks the disclosure sentence. A browser client for local iteration. `make verify` running ruff, `mypy --strict` and pytest. `AGENTS.md` v1 + `CLAUDE.md` symlink pointing at the four documents from steps 0–3. Spending limits set on every account. CI.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-04` — `make verify` exits 0 clean and non-zero on a formatting error, a type error and a failing test independently; an automated test connects to a session and asserts the agent speaks the disclosure text. |
| **L2 — Manual checks** | (a) Phone the number. That call is worth more than any amount of reading, and it is the moment this material becomes real. <br>(b) Phone it from a mobile on a poor connection. Note what is different; that is the environment your callers are actually in. |
| **L4 — Anti-patterns** | `AP-04-a`, `AP-04-b`, `AP-04-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-04` green, and a stranger can dial your number and hear it answer |

**Harness impact:** this step *is* `AGENTS.md` v1. See the [template](../../reference/agents-template/).

---

## Step 5 — The latency budget, measured

**Story:** *As a caller, the reply comes back fast enough that I do not notice the machine thinking.*

**Mode:** `LEARN` — measurement and tuning. The budget is a design constraint, and one you set now.

**Why now:** Before any conversation logic. Every later choice — model, effort, tool design, how a reply is phrased — is constrained by this budget, and a budget discovered afterwards is a rewrite.

**Concepts:**
- **Instrument every hop, from the first day.** The moment speech ends, the moment endpointing fires, the moment the transcript is final, the moment the model's first token arrives, the moment the first audio is synthesised, the moment it leaves. Six timestamps per turn, stored on every turn including in production.
- **Time to first audio is the metric.** Not total turn duration. Optimise the start.
- **Endpointing is the tuning that matters most**, and it is a trade with no correct default: a long silence threshold means dead air on every turn; a short one means cutting people off, which makes them repeat themselves and makes the next turn worse. Tune it per client — Copper Kettle's caller in the street is not Bayside's caller at a desk.
- **Streaming removes waits from the series.** Partial transcripts let you start thinking before the caller stops; streamed model output lets synthesis start before the sentence is done; streamed synthesis lets audio leave before the sentence is complete. Each is worth more than any component swap.
- **Measure the components you chose, on your own connection.** Published figures are best cases from a data centre. Your number is what matters and it will be worse.
- **What to do when a turn will be slow.** A short honest acknowledgement before a tool call. Never filler that says nothing, and never a fake progress noise — callers detect both.
- **Percentiles, not averages.** The median turn is fine and irrelevant. The slowest one in twenty is where the caller interrupts, and that is the number to watch.
- **The budget is a test.** Once the numbers exist, a change that pushes the ninety-fifth percentile outside the budget fails CI, exactly like a failing assertion.

**Libraries:** your own timing instrumentation, the streaming interfaces of every component

**Expected outcome:** Six timestamps recorded per turn. A measured baseline per hop on your own setup, written into `docs/latency.md` beside the estimates from step 1 — with the differences noted. Endpointing tuned and the setting justified per client. Streaming enabled end to end. A latency budget test in CI on the ninety-fifth percentile. An acknowledgement pattern for slow turns.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-05` — every turn records all six timestamps; the CI budget test fails when an artificial delay is introduced at any hop; the ninety-fifth percentile time to first audio on the fixture set is inside the stated budget. |
| **L2 — Manual checks** | (a) Deliberately set endpointing too long, call it, and listen. Then too short. Both are unpleasant in different ways, and hearing them is what makes the trade real. <br>(b) Compare your measured numbers against your step 1 estimates. Where you were most wrong is where you should look first at step 15. |
| **L4 — Anti-patterns** | `AP-05-a`, `AP-05-b`, `AP-05-c`, `AP-05-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-05` green, and you know your slowest hop by measurement rather than belief |

---

## Step 6 — The call ledger, and consent

**Story:** *As Bayside Dental, I can see what was said on a call and what was booked — and nothing is recorded that we have no basis to record.*

**Mode:** `LEARN` — the schema decides whether facts, escalation and evaluation are possible, and the consent model decides what you may keep.

**Why now:** Before the conversation. Retrofitting a fact model onto a transcript is a rewrite, and retrofitting consent onto stored recordings is a deletion exercise.

**Concepts:**
- **A transcript is not a record of what happened.** It is words. What the agent *understood* — the date, the name, the party size — is separate, and separating them is what makes step 9's confirmation strategy possible.
- **Facts carry their confirmation.** Value, whether it was read back, whether the caller agreed, and the recogniser's confidence. A booking made from an unconfirmed phone number is a different event from one made from a confirmed one, and only the ledger can tell them apart.
- **Turn timings live on the turn.** From step 5, in production too — the budget is only real if it is measured on real calls.
- **Outcomes are a closed set**: booked, answered, escalated, abandoned by the caller, failed. Escalation is not a failure and must not be counted as one, or the metric that matters most will live in your error report.
- **Recording is optional and consent-based.** The schema treats "no recording" as normal. A recording row carries its consent basis and its retention date, set at creation. If the client's basis does not permit recording, the system still works — and building it that way round is much easier than removing it later.
- **A transcript is personal data too.** It contains names, numbers, and at Northgate the fact someone had an emergency at 02:00. Retention applies to transcripts, not only to audio.
- **What must never be stored**: payment details spoken aloud, and anything the call policy says the agent will not handle. If a caller reads out a card number, that is a moment to handle deliberately rather than to store.
- **The client's own view.** They will want to see calls, outcomes and transcripts. Design for that reader now; it is step 17's report and step 11's handover context.

**Libraries:** SQLAlchemy 2 and Alembic, or your preferred equivalents

**Expected outcome:** Migrations and models for `clients`, `call_policies`, `calls`, `turns` (with the six timings), `facts` (with confirmation state), `tool_calls`, `escalations` and `recordings` (with consent basis and retention). Client-scoped throughout. Retention enforced by a job, for transcripts as well as audio. A configuration where a client may run with no recording at all, tested.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-06` — a client configured without recording completes a full call with no recording row and no stored audio; every fact records its confirmation state; escalation is a distinct outcome from failure; retention removes both transcripts and audio past their window. |
| **L2 — Manual checks** | (a) Write down how you would answer "what happened on the call at 14:32?" using only the ledger. Every gap is a missing column. <br>(b) Look at what a month of Northgate calls would contain. Emergencies at private addresses at 02:00 is sensitive data; reduce what you keep now. |
| **L4 — Anti-patterns** | `AP-06-a`, `AP-06-b`, `AP-06-c`, `AP-06-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-06` green, and the system runs correctly for a client who does not permit recording |

**Harness impact:** `AGENTS.md` v2 — record that facts are separate from transcripts and carry confirmation, that escalation is an outcome rather than a failure, that turn timings are recorded in production, and that recording requires a consent basis.
