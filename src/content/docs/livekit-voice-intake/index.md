---
title: Getting Started
description: A guided path from "I have built a chatbot" to a phone number that answers — a voice agent with a latency budget, a confirmation strategy, a handoff to a human, and a hostile-caller suite that proves it behaves.
sidebar:
  order: 0
  label: Getting Started
---

A guided path from *"I have built a chatbot"* to something you can hand a stranger and let them
try — built around one real system: **Switchboard**, a voice agent that answers a business's
phone, takes the booking, and knows when to get a human, on LiveKit and a telephony number you
can actually dial.

Eighteen steps. The first four are not code: what a missed call costs, where the latency comes
from, what the voice platforms already sell, and what the agent must never say. Take a step in an
evening or over two weeks.

## Who this is for

- Comfortable with Python 3 — async, type hints, virtual environments
- Comfortable with SQL, HTTP, a terminal, git and Docker
- You have called an LLM API and seen a tool call come back

**Not assumed:** real-time audio, WebRTC, telephony, speech recognition, text to speech,
turn-taking, or any opinion about whether voice agents are ready.

This is the **hardest** material in the catalog to get running and the one with the best demo.
Everything else here produces a link. This one produces a phone number.

## What you are building, concretely

Switchboard answers a real phone number. It greets the caller, understands what they want, checks
a real system, books or answers, confirms the details back, and hands over to a person the moment
it should not be handling the call. Every call leaves a transcript, an outcome and a cost.

The portfolio artefact is unmatched and it is very simple: **you give someone a phone number and
they call it.** No deployment link, no login, no explanation. Alongside it, the thing that makes
it credible rather than a party trick — a **hostile-caller suite** of recorded audio that proves
the agent handles the mumbler, the interrupter and the person who changes their mind, and hands
off when it must.

Three businesses are the running examples. They disagree on the axis that matters here — **what
the agent is allowed to decide on a live call**:

| The business | What Switchboard does | What it forces you to handle |
|---|---|---|
| **Bayside Dental** — a dental practice | Books, moves and cancels appointments; answers hours and location questions | The structured baseline. A closed set of intents, a real availability system, and facts that must be exactly right: a name, a date, a phone number. If this is wrong, nothing else matters. |
| **Copper Kettle** — a restaurant | Takes table reservations, at 19:00, from a caller standing in the street | The conversation is the problem. Background noise, an interrupting caller, a party size that changes mid-sentence, a name that has to be spelled, and a caller who says "actually, make it Friday" after you confirmed Thursday. |
| **Northgate Plumbing** — a 24-hour emergency line | Triages the call, books routine work, and gets an on-call engineer for anything urgent | The agent must decide how bad this is, and it must not be the thing that handles a gas leak. Escalation is the primary outcome, not the fallback; it must never quote a price it cannot honour or give safety advice it is not qualified to give. The booking model does not fit this call at all. |

Same agent, same pipeline, three sets of rules. One system, configured per client, never a branch
on which client it is.

Three questions to keep asking: how long did the caller wait? did the agent hear the name
correctly, and how do we know? and what happens when it should stop talking and get a person?

Other businesses in this shape: vets, opticians, garages, hair salons, letting agents, locksmiths,
out-of-hours GP lines, and anyone whose phone rings while everyone is busy.

## Why voice

Because the constraints are unforgiving in a way text never is, and every one of them teaches
something:

| Reality of the domain | Forces you to learn |
|---|---|
| A pause of a second is noticed; two seconds and they hang up | A latency budget as a first-class design constraint, measured per hop, not an afterthought |
| Callers interrupt | Turn-taking, barge-in, and stopping speech mid-sentence |
| Speech recognition mishears names and numbers | A confirmation strategy — what to read back, when, and how without sounding like a robot |
| There is no undo and no back button | Getting it right in the moment, or handing over |
| Some calls must not be handled by software at all | Escalation as a designed primary path, with a real human on the other end |
| The caller can hear the system thinking | Filling silence honestly, and never faking progress |
| A recording is personal data, and often regulated | Consent, disclosure, retention, and knowing what you may keep |
| Every second costs money on four separate meters | Cost per minute broken down, and finding out which meter is actually the big one |
| You cannot phone yourself sixty times | A recorded hostile-caller suite, so evaluation is repeatable |

## What you'll learn

| Area | Technology |
|---|---|
| Language / runtime | Python 3.13, `uv`, strict typing |
| Real-time | LiveKit Agents — WebRTC transport, so you are not writing audio plumbing |
| Telephony | A SIP or programmable-voice provider bridging a real phone number into the session |
| Speech in | Streaming speech recognition, partial results, endpointing, and what a bad transcript does downstream |
| Speech out | Streaming text to speech, first-audio latency, and interrupting your own output |
| Conversation | The Claude API for understanding and tool calls, with a latency budget shaping every choice |
| Turn-taking | Endpointing, barge-in, backchannels, and the difference between a pause and a finished sentence |
| Correctness | Confirmation strategy for names, dates, numbers; spelling; idempotent booking |
| Escalation | Warm handoff to a person, on-call routing, and the calls that must never be handled |
| Evaluation | A recorded hostile-caller suite with per-call assertions, run in CI |
| Cost | Four meters — telephony, speech in, the model, speech out — and which one is actually largest |
| Privacy | Consent and disclosure, recording retention, what a transcript may hold |
| Operations | Numbers, opening hours, out-of-hours routing, failure to a human, the monthly report |
| Business | What missed calls cost, what the voice platforms charge, what to promise |
| AI workflow | An `AGENTS.md` harness, a `LEARN`/`BUILD` contract, a portable reviewer prompt |

## How this material is structured

| Part | What it is | When you read it |
|---|---|---|
| **[Setup](./setup/agent-harness/)** | The AI harness and a portable reviewer prompt. | Once, before step 4. |
| **[Roadmap](./roadmap/overview/)** | The 18 steps in six sections, plus the locked decisions, the latency budget, the caller suite, and the guardrails. | Skim the overview, then work in order. |
| **[Reference](./reference/rubrics/)** | Per-step rubrics, the `AGENTS.md` template, deliberate omissions. | One rubric section per step. |

| Section | Steps | Focus |
|---|---|---|
| [Concepts](./roadmap/concepts/) | 0–3 | What missed calls cost, where latency comes from, the platform market, what the agent must never say |
| [Foundations](./roadmap/foundations/) | 4–6 | Tooling and the first real call, the latency budget measured, the call ledger and consent model |
| [Conversation](./roadmap/conversation/) | 7–10 | The first booking, interruptions and turn-taking, getting facts right, tools and idempotent booking |
| [Reliability](./roadmap/reliability/) | 11–13 | Handoff to a human, the hostile-caller suite, and the failure modes only voice has |
| [Cost](./roadmap/cost/) | 14–15 | The four meters and which is largest, then the levers |
| [Operations](./roadmap/operations/) | 16–17 | Numbers, hours, out-of-hours, drift, transcript review, the monthly report |

**There is deliberately no implementation code in any of these documents.**

## The three paths

**Understand the job — steps 0–3.** No code. Ends with a written call policy: what the agent
says, what it never says, what it discloses, and when it hands over.

**Build the thing — steps 4–13.** The number, the budget, the ledger, the conversation,
turn-taking, confirmation, tools, handoff, the caller suite, the failure modes. Ends with a
number you would let a stranger dial.

**Run it — steps 14–17.** The four cost meters, the levers, deploy, hours, drift and the report.

## How to read a roadmap step

| Part | What it's for |
|---|---|
| **Story** | The user story driving the step. |
| **Mode** | `LEARN` or `BUILD` — see [the mode contract](./setup/agent-harness/#the-mode-contract). |
| **Why now** | What this step depends on. |
| **Concepts** | What you're actually learning. |
| **Libraries** | What to add, and sometimes why over the obvious alternative. |
| **Expected outcome** | What you should have. On steps 0–3 that is a written document. |
| **Verification** | How you prove it's done. |

### Proving a step is done

You cannot eyeball a voice agent. It sounds fine and mishears the postcode. Five layers:

| Layer | What it is |
|---|---|
| **L1 — Gating test** | The acceptance test, `ACC-NN`. Unambiguous pass/fail, usually against recorded audio. |
| **L2 — Manual checks** | What a test can't catch — calling it yourself, and listening to a recording with the transcript beside it. |
| **L3 — AI code review** | The [reviewer prompt](./setup/reviewer-setup/). |
| **L4 — Anti-patterns** | `AP-NN-x`: "you did it wrong if…". |
| **L5 — Automated guardrails** | CI, types, the latency budget test from step 5, the caller suite from step 12. See the [Roadmap Overview](./roadmap/overview/#global-guardrails-verification-layer-5). |

### The per-step loop

1. Check the **Mode**.
2. Read the step.
3. For latency, turn-taking, confirmation and handoff — **write the acceptance test first**. (Steps 5, 8, 9, 11 especially.)
4. Implement until it passes.
5. Run the L2 checks, which here means **calling it and listening**.
6. Self-check the `AP-NN-*` list.
7. Submit to the [reviewer](./setup/reviewer-setup/) with **that step's rubric section only**.
8. Fix, resubmit until `PASS`.

Expect to fail review the first time at steps 8, 9 and 11.

## A note on cost

This is the most expensive material in the catalog to run, and the numbers are knowable. An
all-in voice stack lands somewhere around **$0.07 to $0.30 per minute** depending on the
components, with a bring-your-own-keys stack near the lower end. A five-minute booking call is
therefore well under a dollar — but you will make hundreds of test calls, and the caller suite
runs on every change.

Two things follow, and step 14 makes you prove both: **the model is not the largest meter** —
text to speech usually is — and the comparison a client makes is not against software, it is
against a receptionist or an answering service. **Set a spending limit before step 7**, and budget
real money for this material in a way the others do not need.

## Start here

1. **Read this page to the end.**
2. **Skim the [Roadmap Overview](./roadmap/overview/)** — the locked decisions and the latency budget.
3. **Start [step 0](./roadmap/concepts/).** No repo, no number. A calculator and an hour.
4. **Set up the [agent harness](./setup/agent-harness/) and the [reviewer](./setup/reviewer-setup/) before step 4.**
5. **Get a phone number at [step 4](./roadmap/foundations/)** and make it say one sentence. That call is the moment this material becomes real.
