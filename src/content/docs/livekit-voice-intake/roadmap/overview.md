---
title: Roadmap Overview
description: Locked decisions, the latency budget, the hostile-caller suite, and the global quality guardrails.
sidebar:
  order: 1
  label: Overview
---

## Locked decisions

| Decision | Value |
|---|---|
| Assumed baseline | Comfortable with Python 3 and SQL. New to real-time audio and telephony. |
| Language / runtime | Python 3.13, `uv`, type hints everywhere |
| Real-time framework | LiveKit Agents. WebRTC transport, so audio plumbing, jitter buffers and echo cancellation are not yours to write. |
| Why not build the transport | Real-time audio over an unreliable network is a specialist discipline. Nothing in this material is about it, and every hour spent there is an hour not spent on the conversation. |
| Telephony | A programmable-voice or SIP provider bridging a real number into the session |
| Speech in | A streaming recogniser with partial results and configurable endpointing |
| Speech out | A streaming synthesiser chosen for first-audio latency, and it must be interruptible mid-sentence |
| Conversation | The Claude API via the `anthropic` SDK, with structured outputs and tools |
| Model choice | **Measured, not assumed.** Step 5 sets a latency budget; step 15 chooses per route against it. A model that is right for the reasoning and wrong for the budget is wrong. |
| The budget | Under ~800ms from the caller finishing to the first audio back. Above roughly a second the caller notices; above two they talk over it or hang up. |
| Database | PostgreSQL 18 — calls, turns, outcomes, consent, recordings index, cost |
| Recording | Off unless the client's disclosure and consent position permits it. Retention per client, enforced. |
| Escalation | A designed primary path with a real destination, not a fallback |
| Evaluation | A recorded hostile-caller suite from step 12, run in CI. You cannot phone yourself sixty times. |
| Testing | pytest with recorded audio fixtures. The model and the speech services are faked in unit tests and called for real only in the caller suite. |
| Quality | ruff, `mypy --strict`, pytest |
| Ops | Docker Compose on one host with a public endpoint; a managed real-time service where that is simpler |
| AI harness | `AGENTS.md` from step 4, evolving v1→v4 |

**Note on step count:** 18 numbered steps, 0 through 17. Steps 0–3 contain no code, and step 3 —
what the agent must never say — is not optional.

---

## Why this domain

Because voice removes every affordance text gives you. There is no scrollback, no edit, no
loading spinner and no back button. The caller is a person waiting, and everything below follows
from that:

- **A pause is noticed** → a latency budget, per hop, measured
- **Callers interrupt** → turn-taking, barge-in, stopping your own speech
- **Recognition mishears** → confirmation strategy, and knowing what is worth reading back
- **No undo** → get it right now, or hand over
- **Some calls must not be handled** → escalation as the primary path
- **A recording is personal data** → consent, disclosure, retention
- **Four meters run at once** → a cost breakdown where the model is not the biggest line
- **You cannot test by calling** → recorded callers, asserted

---

## The three example clients

| Client | What Switchboard does | The rule it exists to break |
|---|---|---|
| **Bayside Dental** `bayside` | Books, moves and cancels appointments; answers hours and location | The structured baseline. A closed intent set, a real availability system, and facts that must be exact — a name, a date, a phone number. Everything here is the easy version, which is why it is the baseline. |
| **Copper Kettle** `kettle` | Table reservations, taken at 19:00 from a caller in the street | The conversation itself is the difficulty. Noise, interruption, a party size that changes mid-sentence, a surname that must be spelled, and "actually, make it Friday" after Thursday was confirmed. Turn-taking and confirmation are the whole job. |
| **Northgate Plumbing** `northgate` | Triages a 24-hour emergency line, books routine work, gets an on-call engineer for anything urgent | Escalation is the *primary* outcome, not the fallback. The agent judges urgency, must never quote a price it cannot honour, and must never give safety advice it is not qualified to give. A design built around "take the booking" cannot represent this call. |

Questions to keep asking: did Bayside hear the phone number correctly, and how do you know? What
does Copper Kettle's agent do when the caller changes the day after confirmation? And when
Northgate's caller says something that might be a gas leak, how quickly is a person on the line?

None of the three may be special-cased in code.

---

## The latency budget

The organising constraint of the material. Every hop costs milliseconds, and they add up in
series:

```
caller stops speaking
   → endpointing decides the turn ended      (this is where most of the delay hides)
   → final transcript                        
   → the model thinks and may call a tool    (a tool call adds a whole round trip)
   → first audio synthesised                 
   → first audio reaches the caller          (network and telephony)
```

Two things to hold onto:

- **Endpointing is usually the largest and least obvious cost.** Waiting to be sure the caller
  finished is dead air, and being too eager means talking over them. It is a tuned trade, not a
  default.
- **Streaming everywhere changes the number that matters.** You are optimising *time to first
  audio*, not total response time. A long answer that starts quickly feels fast; a short one that
  starts late feels broken.

Step 5 makes you measure every hop before writing a conversation, because a budget discovered
afterwards is a rewrite.

---

## The hostile-caller suite

The material ships its own adversary, and here it solves a problem nothing else can: **you cannot
phone your own agent sixty times on every change.**

Step 12 assembles a suite of recorded audio callers, played into the agent through the same
pipeline a real call uses:

| The caller | What it tests |
|---|---|
| The mumbler | Poor recognition, and what the agent does with a low-confidence transcript |
| The interrupter | Barge-in, and stopping mid-sentence without losing the turn |
| The one with a barking dog | Noise, false endpointing, and speech that is not the caller |
| The one who changes their mind | State that is not append-only — "actually, Friday" after Thursday was confirmed |
| The one who spells a surname | Character-level accuracy, and confirmation without sounding robotic |
| The silent caller | Dead air, prompting, and eventually giving up gracefully |
| The one who talks for ninety seconds | Long turns, and not losing the point |
| The one with a gas leak | Immediate escalation, with no attempt to help |
| The one who asks for a price | Refusing to quote, without sounding useless |
| The one who tries to get the agent off-script | Staying inside the call policy |

Each has assertions about the outcome and the transcript, not about the exact words. This suite
is half the portfolio artefact: "it handles these ten callers, here they are, run it."

---

## The call model (target state)

```
Client ──has──> CallPolicy (intents, what is never said, escalation destination, disclosure)
   │
   └──has──> Call ──has──> Turn (speaker, transcript, confidence, timings per hop)
                │
                ├──has──> Fact (name, date, number — value, confirmed, how)
                ├──has──> ToolCall (what was checked or booked, idempotency key, result)
                ├──has──> Escalation (why, to whom, when, whether they answered)
                └──has──> Recording (reference, consent basis, retention date)   ← may not exist
```

- **Timings live on the turn**, per hop. The budget is only enforceable if it is recorded on
  every turn of every call, including in production.
- **A Fact is separate from the transcript** and carries whether and how it was confirmed. A
  booking made from an unconfirmed phone number is a different event from one made from a
  confirmed one, and the ledger has to know which.
- **A Recording may not exist**, and the schema treats that as normal rather than as an error.

---

## Global guardrails (Verification Layer 5)

| Guardrail | From step | What it catches |
|---|---|---|
| `make verify` — format, lint, types, tests | 4 | Everything below |
| `mypy --strict` | 4 | The shapes flowing through a real-time pipeline |
| The latency budget test | 5 | A change that pushes time-to-first-audio outside the budget |
| The no-unconfirmed-booking test | 9 | A booking made from a fact nobody read back |
| The escalation test | 11 | A call that should have reached a person and did not |
| The hostile-caller suite | 12 | Everything a happy-path call never exercises |
| The never-say test | 3, enforced from 7 | A price quote, safety advice, or anything on the client's forbidden list |
| A no-recording-without-consent test | 6 | A recording stored where the client's basis does not permit it |
| CI on every push | 4 | The above, on a machine that is not yours |

The never-say test is the unusual one and it matters most at Northgate. It runs against the
caller suite and against the model's actual output, not against the prompt.

---

## Reading the steps

**Steps 0 to 3 have no code and are not optional.** Step 3 produces the call policy — what the
agent says, what it must never say, what it discloses, and when it hands over. Building the
conversation before that document exists means discovering the rules by breaking them.

**Mode is not a suggestion.** Turn-taking, confirmation strategy, escalation and evaluation all
produce code that sounds fine on your own test call and fails on the tenth real one.

**Step 12 is the step.** Before it, an agent that worked when you phoned it. After it, an agent
whose behaviour you can demonstrate on ten callers, repeatedly, including the ones it must refuse
to handle.
