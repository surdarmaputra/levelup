---
title: Conversation
description: Steps 7–10. The first booking, interruptions and turn-taking, getting names and numbers right, and tools that book once.
sidebar:
  order: 4
---

## Step 7 — The first conversation

**Story:** *As a Bayside Dental patient, I can phone up and book an appointment, and the system knows what I asked for.*

**Mode:** `BUILD` — the conversation loop. Generate, then read carefully, because the never-say test lands here.

**Why now:** After the budget and the ledger. Now there is somewhere to put facts and a constraint to design within.

**Concepts:**
- **The turn loop**: transcript in, decide, speak, record. Everything else in this section is a refinement of it.
- **The system prompt is a call policy, not a personality.** It carries the closed intent set, the never-say list, the disclosure, and what to do when it does not know. Write it from `docs/call-policy.md` rather than from imagination.
- **Structured output alongside speech.** The model produces both what to say and what it understood — intent, facts, confidence. The words go to synthesis; the structure goes to the ledger. Parsing the spoken sentence afterwards to work out what happened is the thing this avoids.
- **Short replies.** Everything the agent says is time the caller waits and money on the synthesis meter. Two sentences is usually plenty; a paragraph read aloud is unbearable and nobody writes one on purpose — they arrive when nobody set a limit.
- **The never-say test, from step 3, enforced here.** It runs against the model's actual output on the fixture calls, not against the prompt. A price quote at Northgate must fail CI, and a prompt instruction not to quote is not enforcement.
- **Numbers and dates in speech.** "The third" and "Thursday" and "next week" all need resolving against a real calendar and a real time zone. The model is good at this and it is not reliable at it, which is why step 9 exists.
- **The caller controls the conversation.** They will answer a question you did not ask, give three facts at once, or ask something unrelated. Handle all three; a rigid script fails on the second real caller.
- **Faking the pipeline in tests.** Text in, text out, no audio, no real model. Fast deterministic tests of the conversation logic, with real audio reserved for the caller suite at step 12.

**Libraries:** the `anthropic` SDK — structured outputs and tools

**Expected outcome:** A working Bayside booking conversation: greeting with disclosure, intent recognition across the closed set, fact extraction into the ledger, a reply, and a completed booking against a stub availability system. A reply-length limit. The never-say test running against model output on a fixture set. A text-level test harness with the audio faked.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — a fixture conversation books an appointment with every fact recorded; a caller asking Northgate for a price receives no price, asserted against the model's output rather than the prompt; a reply exceeding the length limit fails. |
| **L2 — Manual checks** | (a) Phone it and try to book. Then try to book badly — three facts at once, an unrelated question. Note every place it becomes rigid. <br>(b) Read the transcript of your own call. Where the agent was verbose, cut it; you are paying for those words twice, in seconds and in cents. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c`, `AP-07-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and you can book an appointment by phone |

---

## Step 8 — Interruptions and turn-taking

**Story:** *As a Copper Kettle caller, I can interrupt, and the system stops talking and listens — like a person would.*

**Mode:** `LEARN` — the thing that most separates a voice agent that feels human from one that feels like a phone menu.

**Why now:** After a working conversation, before confirmation. Confirmation involves reading things back, which is exactly when callers interrupt.

**Concepts:**
- **Barge-in**: the caller starts speaking while the agent is talking. The agent must stop — immediately, mid-word — and listen. An agent that finishes its sentence first is the single most irritating behaviour in this domain, and the one callers describe as "it wouldn't let me speak".
- **Stopping is more than muting.** The synthesiser is streaming, the audio is buffered, and the agent believes it has said things the caller never heard. The conversation state must reflect **what was actually heard**, not what was generated, or the next turn refers to something the caller does not know about.
- **Not every noise is an interruption.** A cough, a "mm-hm", a barking dog. Distinguishing a backchannel from a real interruption is the tuning of this step, and getting it wrong in either direction is bad: stopping for a dog, or ignoring a real interruption.
- **Endpointing again, harder now.** People pause mid-sentence to think. "I'd like a table for… four." Cutting in at the pause produces a reply to half a sentence, and the caller repeats themselves, and the turn gets worse.
- **Noise is Copper Kettle's whole problem.** A restaurant caller is in the street. Test with the noisy fixtures, not in a quiet room, because in a quiet room everything works.
- **Overlap is normal in human speech.** Perfect strict alternation is not the target; recovering gracefully is.
- **The state machine matters.** Listening, thinking, speaking, interrupted. Transitions between them are where bugs live — particularly interrupted-while-thinking, which is easy to forget and produces an agent that answers a question nobody asked any more.
- **Latency and interruption interact.** A slow agent gets interrupted more, because the caller assumes it did not hear. Fixing latency reduces interruptions; this is the payoff from step 5.

**Libraries:** the framework's turn detection and interruption handling, your own tuning

**Expected outcome:** Barge-in that stops synthesis mid-word and updates conversation state to what was actually heard. Backchannel detection so a "mm-hm" does not stop the agent. Endpointing tuned per client against the noisy fixtures. An explicit conversation state machine including interrupted-while-thinking. Tests using recorded interrupting and noisy audio.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — an interrupting fixture causes synthesis to stop within the stated threshold and the conversation state reflects only the audio actually delivered; a backchannel fixture does not stop the agent; a mid-sentence pause fixture does not trigger a reply. |
| **L2 — Manual checks** | (a) Call and interrupt it rudely, repeatedly. If you can make it talk over you or lose track of the conversation, so can a caller. <br>(b) Call from a noisy place. This is Copper Kettle's normal condition, not an edge case. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and interrupting it feels natural rather than like fighting it |

---

## Step 9 — Getting the facts right

**Story:** *As a Bayside patient, the appointment is under my actual name, on the day I actually asked for, with a phone number that actually reaches me.*

**Mode:** `LEARN` — recognition errors are certain, and the design question is what you do about them.

**Why now:** After turn-taking, because confirming things is where callers interrupt most. Before booking, because a booking made from a wrong fact is a wrong booking.

**Concepts:**
- **Recognition gets names and numbers wrong.** Not sometimes — routinely. Surnames, postcodes, phone numbers and email addresses are the worst cases, and they are exactly the fields a booking needs.
- **Confirm the load-bearing facts, and only those.** Everything read back is time and money. A rule of thumb worth writing down: confirm what would be expensive to get wrong — the date, the phone number, the party size — and not what would be obvious in context.
- **How to confirm without sounding like a machine.** Fold it into the reply — *"Thursday the fourth at ten, under Marchetti?"* — rather than a separate interrogation. A machine that reads back every field individually is unbearable, which is why people hate phone menus.
- **Spelling.** A surname the recogniser is unsure of has to be spelled, and the phonetic alphabet is how humans do it. The agent should be able to accept a spelling gracefully and, when it must, ask for one.
- **Digits are their own problem.** Phone numbers grouped into chunks and read back are checkable; a fifteen-digit string read as one number is not. Read back in the grouping the caller used.
- **Use the recogniser's confidence, where it gives you one.** A low-confidence surname is worth confirming; a high-confidence "yes" is not. This is where a confidence signal earns its place, and it is one of the few in the catalog that is genuinely informative.
- **The change after confirmation** — Copper Kettle's *"actually, make it Friday"*. Facts are not append-only. Superseding a confirmed fact is a normal event with its own record, and a design that treats confirmation as final breaks on the second real caller.
- **Never book from an unconfirmed load-bearing fact.** This is the gating test, and it is enforced in code rather than requested in the prompt.
- **Cross-check against reality.** A date in the past, a party of forty at a twelve-table restaurant, a phone number with the wrong number of digits. Cheap checks that catch what confirmation misses.

**Libraries:** the recogniser's confidence scores, your fact model from step 6

**Expected outcome:** A confirmation strategy implemented per client: which facts are load-bearing, how they are confirmed, and how confidence affects it. Confirmation folded into replies. Spelling handling. Digit grouping. Supersession of confirmed facts with both values recorded. Plausibility checks. A hard rule that no booking proceeds from an unconfirmed load-bearing fact.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — no booking is created when a load-bearing fact is unconfirmed, asserted in code; a fixture caller who changes the day after confirmation results in a booking on the new day with both values recorded; a spelled surname fixture produces the correct spelling; an implausible date is challenged rather than booked. |
| **L2 — Manual checks** | (a) Call and give a difficult surname and a mobile number quickly. Read the transcript. This is the failure your client will report first. <br>(b) Count how many times the agent reads something back on a normal call. More than two or three and it is tedious; zero and it is unsafe. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and it gets your own surname right over the phone |

---

## Step 10 — Tools, and booking exactly once

**Story:** *As Copper Kettle, a caller who is cut off mid-booking does not end up with two tables reserved.*

**Mode:** `LEARN` — idempotency inside a real-time conversation, where you also cannot afford the round trip.

**Why now:** After facts are trustworthy. A tool call from a wrong fact is a wrong booking made efficiently.

**Concepts:**
- **A tool call is inside the latency budget.** An availability lookup taking 400ms spends half of it. Three approaches, all worth having: prefetch what you can predict, tell the caller something honest while it runs, and make the tool fast.
- **Say something honest while waiting.** "Let me check that" is what a person says, and it buys a real second. Filler that says nothing, or a fake typing noise, is worse than silence.
- **Idempotency, with a twist.** A call drops mid-booking; the caller phones back. The natural key has to be derived from the booking's content — client, date, time, name — not from the call, because it is a different call.
- **The double-booking window.** Availability checked at 14:32:01 and booked at 14:32:04 may already be gone. The booking call, not the availability call, is the source of truth, and it must fail rather than overwrite.
- **What to say when the tool fails.** Not "an error occurred". Either an honest human sentence and a retry, or a handover. The caller is on the line; silence while you retry is dead air they will fill by hanging up.
- **Tool results are untrusted input**, same as everywhere else in this catalog. A customer note field in the booking system is text somebody typed.
- **Read-only tools are safe to call speculatively.** Opening hours, location, whether tomorrow has any space — these can be prefetched or cached per client and cost nothing on the call.
- **Recording every tool call in the ledger**, with its timing, because step 14 will want to know how much of the budget tools are eating.

**Libraries:** the `anthropic` SDK's tool use, your booking stub, your ledger

**Expected outcome:** Availability and booking tools for all three clients with timings recorded. Prefetching for predictable lookups and caching for static answers. An honest acknowledgement pattern before slow calls. Booking idempotency on a content-derived key that survives a dropped call and a call-back. A booking that fails rather than overwrites when the slot went. Human sentences for tool failure with a retry-or-handover decision.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — a dropped call mid-booking followed by a call-back produces one booking, not two; a slot taken between the availability check and the booking causes a failure and a spoken alternative rather than an overwrite; every tool call records its duration; a forced tool failure produces a spoken sentence and never dead air. |
| **L2 — Manual checks** | (a) Add a two-second delay to the availability tool and call. Listen to what the silence feels like. Then add the acknowledgement and listen again. <br>(b) Hang up mid-booking and phone back. Whatever the agent does is what a real caller will experience, and it should not be two tables. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and a tool call does not make the conversation feel slow |

**Harness impact:** `AGENTS.md` v3 — record that no booking proceeds from an unconfirmed load-bearing fact, that booking keys are content-derived, that the agent stops speaking on barge-in and updates state to what was heard, and that silence during a tool call is never acceptable.
