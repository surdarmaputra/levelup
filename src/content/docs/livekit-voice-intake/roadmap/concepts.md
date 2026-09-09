---
title: Concepts
description: Steps 0–3. What missed calls cost, where the latency comes from, what the voice platforms already sell, and what the agent must never say.
sidebar:
  order: 2
---

Four steps, no code. Step 3 produces the call policy, and building a conversation before that
document exists means discovering the rules by breaking them on a live call.

---

## Step 0 — What a missed call costs

**Story:** *As someone about to build this, I can state what a business loses to unanswered calls, and what they pay today to avoid it.*

**Mode:** `LEARN` — nothing to build.

**Why now:** First. In this domain the comparison is not against software — it is against a person, and knowing what that person costs is the whole commercial case.

**Concepts:**
- **The missed call is the product.** Not efficiency. A dental practice with the phone engaged at 09:15 loses the booking to the practice down the road. Ask the client how many calls go unanswered; usually nobody knows, and finding out is itself valuable.
- **The arithmetic**: calls per day, share unanswered or abandoned, conversion rate of an answered call, average value of the outcome. That product is the annual figure.
- **The out-of-hours number is separate and often larger.** Northgate's emergency line at 23:00 either reaches someone or loses the job to whoever answers.
- **What they pay today.** A receptionist's time, an answering service per call or per minute, or an engineer answering their own phone at midnight. This is your real comparison, and it is usually a bigger number than any software price.
- **The interruption cost.** At Copper Kettle the phone ringing during service pulls someone off the floor. The saving is not only the minutes; it is the disruption.
- **Where a voice agent saves nothing.** If every call is a complicated negotiation, or the business answers everything already, there is no project. Find that out now.
- **The reputational risk, both ways.** A good agent answers instantly at 03:00. A bad one is the last impression a customer has of the business. This risk is real and it belongs in the business case honestly, because it also justifies the evaluation work later.
- **Who signs the cheque.** An owner or a practice manager. They think in bookings taken and calls missed.

**Libraries:** none. A spreadsheet, and if possible the client's call records.

**Expected outcome:** `docs/business-case.md` — per client: calls per period, unanswered share, conversion, value per outcome, annual loss; then what they pay today for answering; then the out-of-hours case separately. Every input sourced or marked as an assumption.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-00` — every client has an annual missed-call figure and a current cost of answering, both derived; the out-of-hours case is costed separately where it applies. |
| **L2 — Manual checks** | (a) Compare your Northgate figure against the cost of an answering service at their volume. That is the number they will compare you to, not a per-minute rate. <br>(b) Phone three local businesses of each type at a busy time and see how many answer. That is your market research and it takes twenty minutes. |
| **L4 — Anti-patterns** | `AP-00-a`, `AP-00-b`, `AP-00-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-00` green, and you can state what each client loses to the phone every year |

---

## Step 1 — Where the latency comes from

**Story:** *As a developer, I can name every hop between a caller finishing a sentence and hearing a reply, and say which one is the expensive one.*

**Mode:** `LEARN` — the mental model that shapes every later decision.

**Why now:** Before tooling. The budget decides component choices, model choices and conversation design, and discovering it after building is a rewrite.

**Concepts:**
- **The pipeline, in series:**

  ```text
  caller stops → endpointing → final transcript → model (+ maybe a tool call) → synthesis → audio out
  ```

  Every hop adds to the same wall clock. There is no parallelism to hide behind unless you create
  it deliberately.
- **The number that matters is time to first audio**, not total response time. A long answer that
  starts quickly feels responsive; a short one that starts late feels broken. This single reframing
  changes how you design every reply.
- **Endpointing is the hidden cost and the real trade.** Deciding the caller has finished means
  waiting for silence. Wait long and every turn carries dead air; wait little and you talk over
  someone drawing breath. There is no correct default — Copper Kettle's noisy caller and Bayside's
  quiet one want different settings.
- **A tool call adds a full round trip** inside the turn. An availability lookup that takes 400ms
  spends most of the budget. That is why step 10 cares about prefetching and about telling the
  caller something honest while it happens.
- **The threshold that matters.** Under roughly 800ms feels like a conversation. Around a second
  people notice. Beyond two they interrupt, repeat themselves, or hang up — and interrupting
  makes the next turn worse, so the failure compounds.
- **Streaming everywhere.** Partial transcripts, streamed model output, and synthesis that starts
  before the sentence is finished. Each of them removes a wait that would otherwise be in series.
- **What you can do while thinking.** A short honest acknowledgement — "let me check that" —
  buys real time and is what a person does. Faking progress, or filler that says nothing, is worse
  than silence and callers detect it immediately.
- **Where quality and latency genuinely conflict.** A better recogniser, a better voice, a
  stronger model: each may cost milliseconds. These are trades to measure at step 15, not to
  guess now — but knowing they exist stops you choosing components on quality alone.

**Libraries:** none yet. Read the documentation of one recogniser and one synthesiser, and find their published latency figures.

**Expected outcome:** `docs/latency.md` — the pipeline drawn out, every hop with the range you expect and where you got the figure, the total, and the three hops you would attack first. Plus a written target budget and what happens to the call when it is exceeded.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-01` — the document lists every hop with a sourced or clearly assumed range, states a target for time to first audio, and identifies endpointing as a tuned trade rather than a setting. |
| **L2 — Manual checks** | (a) Time a real conversation: how long does a person actually leave between turns? It is shorter than you think, and that is your bar. <br>(b) Call any automated phone system and note the exact moment it becomes annoying. Write down what it was doing. |
| **L4 — Anti-patterns** | `AP-01-a`, `AP-01-b`, `AP-01-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-01` green, and you can say which hop you would attack first and why |

---

## Step 2 — What you could buy instead

**Story:** *As someone quoting for this work, I know what the voice platforms sell and what they charge per minute, and sometimes my answer is that the client should buy one.*

**Mode:** `LEARN` — research and honesty. This market moves fast, so date everything.

**Why now:** Before building. This is the most commoditised of the five domains in this catalog, and pretending otherwise would be dishonest.

**Concepts:**
- **The four layers:**

  | Layer | What it is |
  |---|---|
  | Managed voice agent platforms | You configure an agent, they run the whole pipeline and bill per minute. Fast, and genuinely good. |
  | Component providers | Telephony, recognition, synthesis sold separately; you assemble them. More control, more work, usually cheaper per minute. |
  | Vertical answering products | A finished product for a sector — dental, restaurants, trades — with the integrations already built |
  | The human alternative | A receptionist, or an answering service per call. The actual incumbent. |
- **Know the per-minute economics before quoting.** All-in stacks land roughly between seven and thirty cents a minute depending on components, with a bring-your-own-keys assembly near the lower end and managed platforms bundling orchestration into a higher rate. Get current figures yourself and record the date; these prices move.
- **When buying a platform is right**: a standard flow, no unusual integration, no strict data requirement, and a volume the per-minute rate suits. Say so. You will be the person they call for the integration.
- **When building wins**: the booking system is bespoke or has no public API, the escalation logic is specific to the business, data may not leave a jurisdiction, or the client wants someone accountable at 03:00.
- **The honest middle**: use a platform for the pipeline and build the tools and integrations. That is a real engagement and often the right one.
- **What none of them solve**: your call policy, your escalation destination, your confirmation strategy, and your evaluation. Those are the hard parts of this roadmap.
- **The vertical products are your closest competitor** and the client may already have been pitched one. Ask.

**Libraries:** none. Vendor pricing pages, and an hour.

**Expected outcome:** `docs/build-vs-buy.md` — at least six named options across the four layers, per-minute pricing where published, with dates. A per-client recommendation with the deciding reason. At least one "buy" or "buy the pipeline, build the tools". A comparison of your assembled per-minute cost against a managed platform and against an answering service.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-02` — six real options with dated pricing; a per-client recommendation with a one-sentence reason; and a three-way per-minute comparison against a managed platform and a human answering service. |
| **L2 — Manual checks** | (a) Work out what Bayside's call volume costs on a managed platform per year, and compare it to a part-time receptionist. Whichever surprises you is the number to remember. <br>(b) Call a vertical product's demo line. It is the best possible research and it takes five minutes. |
| **L4 — Anti-patterns** | `AP-02-a`, `AP-02-b`, `AP-02-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-02` green, and you can say what you sell that a platform does not |

---

## Step 3 — The call policy: what it says, and what it must never say

**Story:** *As Northgate Plumbing, this system never quotes a price it cannot honour and never tells someone what to do about a gas leak.*

**Mode:** `LEARN` — the most consequential document in the material.

**Why now:** Last before tooling. Everything in the conversation section implements this, and the never-say list becomes a test that runs on every change.

**Concepts:**
- **The intent set is closed, per client**, and it includes an explicit *"something else"* that hands over. An agent with an open-ended remit will attempt everything, confidently.
- **The never-say list, and why it is a list rather than a principle.** Per client, written as specific things: a price or a quote; a clinical or safety instruction; a promise about timing the business has not agreed; anything about another customer; a commitment that binds the business financially. Specific items can be tested; a principle cannot.
- **Northgate's is the hard one.** Urgency judgement, an immediate handover for anything that could be dangerous, and no safety advice — the correct behaviour on a suspected gas leak is to get a person now, not to be helpful. Write down the categories that trigger an immediate handover before you write any conversation.
- **Disclosure.** The caller is told they are speaking to an automated system, in the first sentence, in plain words. Not buried, not evasive. This is both the right thing and, in a growing number of places, required — and the requirement varies by jurisdiction, so it is a question for the client's own advisers rather than for you.
- **Consent and recording are separate decisions.** Recording a call is a decision with a legal basis behind it that differs by jurisdiction; storing a transcript is a different decision again. Some clients will record, some will not, and the system must work either way. Ask; do not assume you may record.
- **The escalation destination has to be real.** A phone number that rings someone who has agreed to be rung. An escalation to a voicemail at 02:00 is not an escalation, and that is a conversation to have with the client at scoping rather than at 02:00.
- **What to say when handing over.** The caller should not have to repeat themselves. What the agent passes to the person, and how, is part of the policy.
- **What the agent does when it does not know.** Say so and hand over. An agent that guesses on a phone call has no correction path — there is no edit button and the caller has already heard it.
- **What to refuse to build.** Anything giving medical, legal or safety advice. Any agent that hides being automated. Outbound calling that could be a nuisance, which carries its own regulatory weight. Anything where escalation has no real destination.

**Libraries:** none.

**Expected outcome:** `docs/call-policy.md` — per client: the closed intent set including the handover intent, the never-say list as specific items, the immediate-escalation categories, the disclosure sentence in the words it will be spoken, the recording and consent position, the escalation destination and what is passed to it, and what the agent says when it does not know. Plus a refusal list. Written so a client could sign it.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-03` — every client has all eight elements; the never-say list contains specific testable items rather than principles; Northgate has at least three immediate-escalation categories with the trigger written out. |
| **L2 — Manual checks** | (a) Read the disclosure sentence out loud. If it sounds evasive or takes more than four seconds, rewrite it. <br>(b) Take Northgate's escalation destination and ask what happens at 02:00 on a Sunday. If the answer is voicemail, the policy is not finished. |
| **L4 — Anti-patterns** | `AP-03-a`, `AP-03-b`, `AP-03-c`, `AP-03-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-03` green, and you would be comfortable if a recording of a call were played back to you |

**Harness impact:** none yet. Keep the four documents in `docs/`; step 4's harness points the agent at `call-policy.md`, and the never-say list becomes a test at step 7.
