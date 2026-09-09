---
title: AGENTS.md Template
description: The v1 agent harness template for Switchboard — copy it to your project root and fill in the placeholders.
sidebar:
  order: 3
---

Copy this into your own project root as `AGENTS.md`. It is the deliverable of
[step 4](../../roadmap/foundations/), and the file the [agent harness](../../setup/agent-harness/) page explains.

> **This is the v1 template from Step 4.** Fill the `<>` placeholders and symlink it:
> `ln -s AGENTS.md CLAUDE.md`

---

## Project

Switchboard — a voice agent that answers a business's phone, takes the booking, and knows when
to get a human.
Python 3.13, LiveKit Agents, a telephony provider, streaming speech recognition and synthesis,
PostgreSQL 18, the Claude API.

**Read `docs/call-policy.md` before suggesting anything about the conversation.** It says, per
client, what the agent may say, what it must never say, what triggers an immediate handover, and
what it discloses. `docs/latency.md` says what the budget is and where it goes.

Three example clients. They disagree on what the agent may decide on a live call:

- **Bayside Dental** — books, moves and cancels appointments. A closed intent set and facts that must be exact. The structured baseline.
- **Copper Kettle** — restaurant reservations taken at 19:00 from a caller in the street. Noise, interruption, spelling, and a caller who changes their mind after confirmation.
- **Northgate Plumbing** — a 24-hour emergency line. Escalation is the *primary* outcome. Never a price, never safety advice, and a real on-call engineer within seconds when it matters.

A feature works when it works for all three. Never special-case a client by slug.

Current step: `<N>` — update this line every step.

---

## The absolute rules

**Latency is a correctness property, not a performance one.** Under ~800ms to first audio. A
change that is smarter and slower is a regression, because a slow agent gets interrupted and an
interrupted agent has worse calls. Both gates apply to every change: the caller suite and the
latency budget.

**Never enforce the never-say list in the prompt alone.** It is tested against the model's actual
output on the fixture calls. A price quote at Northgate must fail CI.

**Never book from an unconfirmed load-bearing fact.** Enforced in code, not requested in the
prompt. A booking nobody can reach is worse than no booking.

**Never produce silence.** No path may leave the caller with more than the stated maximum of dead
air. The caller cannot tell thinking from broken from gone, and they hang up.

**Escalation is an outcome, not a failure.** Counted separately, reported to the client, and at
Northgate it is the most important thing the system does. A falling escalation rate there is a
warning.

---

## The mode contract

### `LEARN` steps — do not write implementation code

Steps 0, 1, 2, 3, **5**, 6, **8**, **9**, **10**, **11**, **12**, **14**, **15**, 17.

Tutor and reviewer: explain mechanisms and trade-offs, ask questions that expose gaps, review
against the step's rubric, point at the problem — never hand over the solution.

You may write: tests asked for by name, throwaway scripts, and configuration that is not the
subject of the step.

### `BUILD` steps

Steps 4, 7, 13, 16.

Generate freely: the telephony and session plumbing, the conversation loop, the failure handlers,
deploy. Then explain what you generated.

### One more rule

**Never suggest testing by phoning it.** Manual calls are for listening, not for verification.
Every assertion runs against recorded audio through the same pipeline, because a system you can
only test by phoning it is a system nobody tests.

---

## The loop

`make verify` runs ruff → `mypy --strict` → pytest → the never-say test → the latency budget test.

```
make verify      # everything. the one you care about.
make fmt         # auto-fix formatting
make test        # tests only, faster iteration
make up          # PostgreSQL and dependencies
make dev         # the agent with the browser client
make callers     # the hostile-caller suite (from step 12)
make cost        # the four-meter cost report (from step 14)
```

Never disable a check to make it pass.

---

## Stack

| Layer | Choice |
|---|---|
| Language | Python 3.13, type hints everywhere, `mypy --strict` |
| Real-time | LiveKit Agents. Do not write the audio transport. |
| Telephony | `<provider>` — a real number bridged into the session |
| Speech in | `<recogniser>`, streaming, partial results, tuned endpointing per client |
| Speech out | `<synthesiser>`, streaming, interruptible mid-sentence, fixed utterances cached |
| Conversation | `anthropic` SDK, `claude-opus-5` by default, structured output alongside speech, effort and model measured against the latency budget at step 15 |
| Database | PostgreSQL 18 — calls, turns with six timings, facts with confirmation, escalations, recordings with consent |
| Testing | pytest with recorded audio fixtures; the model and speech services faked outside the caller suite |
| Quality | ruff, `mypy --strict` |

**Never suggest:** writing the audio transport; outbound calling campaigns; emotion or sentiment
scoring as a basis for decisions; capturing card details; recording without an established
consent basis; verifying behaviour by phoning the number.

---

## Layout

```
src/switchboard/
├── session/        the call lifecycle, turn state machine, interruption
├── conversation/   prompts, structured output, intents, the never-say check
├── facts/          extraction, confirmation strategy, supersession
├── tools/          availability, booking, idempotency
├── escalation/     triggers, transfer, warm context, on-call rota
├── ledger/         calls, turns, timings, outcomes, consent
├── cost/           the four meters
└── support/        settings, logging, clock, ids
```

The conversation layer never talks to a telephony or synthesis API directly, and the session
layer never decides what to say.

---

## Non-negotiable conventions

**Latency**
- Six timestamps per turn, recorded in production as well as tests.
- The metric is time to first audio, reported at the ninety-fifth percentile.
- Endpointing is tuned per client and the value is justified in writing.
- A slow turn gets a short honest acknowledgement. Never filler, never fake progress.

**Conversation**
- Structured output alongside speech. Never parse the spoken sentence to recover intent.
- A reply-length limit, enforced.
- The intent set is closed and includes an explicit handover intent.
- The never-say list is tested against model output, per client.

**Facts**
- Load-bearing facts are confirmed; the list is per client and written down.
- Confirmation is folded into a reply, not a separate interrogation.
- Facts can be superseded after confirmation, with both values recorded.
- No booking proceeds from an unconfirmed load-bearing fact.

**Turn-taking**
- Barge-in stops synthesis mid-word and state reflects only delivered audio.
- Backchannels do not stop the agent.
- Tuning happens against noisy fixtures, never in a quiet room.

**Escalation**
- Policy categories are checked in code before any conversational reply.
- A caller asking for a person is transferred on the first request.
- Transfers are warm: the receiving person gets the established facts.
- The destination is real and its no-answer behaviour is defined.

**Failure**
- No path produces silence beyond the maximum.
- Turn limit, duration limit, and per-call and per-client cost ceilings.
- Hang-up stops all generation immediately.
- Every call ends with a recorded outcome, including after a crash.

**Privacy**
- Recording requires an established consent basis; the system works without it.
- Retention applies to transcripts as well as audio.
- Card details are never captured or stored.

**Cost**
- Four meters recorded per call: telephony, speech in, model, speech out.
- The unit is cost per completed call, including abandoned and escalated calls.
- The caller suite's own cost is a reported line item.

---

## Working style

- **Small changes.** One concern per change.
- **Explain before generating.**
- **Say when you're unsure.**
- **Don't invent APIs.** The framework and provider surfaces change between versions.
- **No scope creep.** Don't add escalation at step 7 or caching at step 10.
- **Never bypass a quality gate.** Both gates, every change.

---

## Decisions

Architecture decisions live in `docs/adr/`. The endpointing values and the voice choice are
recorded there, with the measurements behind them.

---

## Code review

`docs/REVIEWER-PROMPT.md`. Load it with **the current step's rubric section only**.

---

## Evolution checkpoints

- [ ] **v1 — Step 4.** This template, placeholders filled, the absolute rules, pointing at the step 0–3 documents.
- [ ] **v2 — Step 6.** Facts separate from transcripts, escalation as an outcome, timings in production, recording requires a consent basis.
- [ ] **v3 — Step 10.** No booking from an unconfirmed fact, content-derived booking keys, barge-in state rules, never silence during a tool call.
- [ ] **v4 — Step 13.** No silence anywhere, every call ends with an outcome, and no change ships without a caller-suite run and a latency check.

**At v4, reread v1.** The gap is a fair measure of what you learned.
