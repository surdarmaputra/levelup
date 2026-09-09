---
title: Reliability
description: Steps 11–13. Handing over to a human, the hostile-caller suite, and the failure modes that only voice has.
sidebar:
  order: 5
---

Three steps. They are what makes the difference between a demo you enjoy showing and a number a
business will put on its website.

---

## Step 11 — Handing over to a human

**Story:** *As a Northgate caller with a gas smell, I am talking to a person within seconds, and I do not have to explain it twice.*

**Mode:** `LEARN` — escalation is the primary path for one of the three clients, and the design most often left until last.

**Why now:** After the conversation works. Escalation needs something to escalate *from*, and it needs the facts from step 9 to pass on.

**Concepts:**
- **Escalation is a designed outcome, not an error path.** For Northgate it is the most important thing the system does. Building it as a fallback produces a fallback-quality experience on the calls that matter most.
- **The four triggers**, and they need different behaviour:
  1. **Policy** — an immediate-escalation category from step 3. A possible gas leak. No attempt to help, no questions, transfer now.
  2. **The caller asks.** "Can I speak to someone?" is an instruction, honoured immediately and without an argument. An agent that tries once more to help is the behaviour people hate most.
  3. **The agent cannot proceed** — repeated misunderstanding, an intent outside the set, a tool that will not work.
  4. **Confidence collapse** — several low-confidence turns in a row usually means a bad line or a caller the recogniser cannot handle. Hand over rather than persist.
- **Warm, not cold.** The person receiving the call gets the context: who is calling, what they want, what has been established. A caller repeating everything is a worse experience than never having reached the agent at all, and it is the thing that makes a business turn the system off.
- **The destination has to be real, and it has to be tested.** A number that rings someone who agreed to be rung, with a defined behaviour when they do not answer: another number, a queue, or a spoken apology and a promise with a time on it — never silence, and never a voicemail presented as success.
- **What the caller hears during the transfer.** Someone telling them what is happening, honestly. Silence during a transfer is where callers hang up.
- **Out of hours.** Northgate's on-call rota is a real thing with real people. Who is on call is data, and getting it wrong at 02:00 is worse than not having the system.
- **Escalation is a success metric, and it must be visible as one.** An agent that never escalates at Northgate is not confident; it is dangerous. Report it as an outcome, and treat a falling escalation rate as something to investigate rather than to celebrate.
- **Record what triggered it.** Step 17 reads these to find where the agent is failing, and the trigger distribution is the most informative thing in the whole ledger.

**Libraries:** the framework's transfer or dial-out capability, your ledger

**Expected outcome:** Escalation implemented for all four triggers, with warm context passed to the person. A real, tested destination per client with a defined no-answer behaviour. Honest speech during the transfer. Northgate's on-call rota as data. Escalation as a reported outcome with its trigger recorded. Immediate-escalation categories from the call policy enforced in code before any conversational reply.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-11` — a fixture caller matching an immediate-escalation category is transferred without the agent attempting to help, asserted on the outcome and the transcript; a caller asking for a person is transferred on the first request; a destination that does not answer produces the defined behaviour rather than silence; the receiving party is given the established facts. |
| **L2 — Manual checks** | (a) Call Northgate's number and describe a gas smell. Time how long until a person is on the line. If it is more than a few seconds, the policy check is in the wrong place. <br>(b) Be the person who receives a transfer. If you have to ask the caller anything they already said, the context is not sufficient. |
| **L4 — Anti-patterns** | `AP-11-a`, `AP-11-b`, `AP-11-c`, `AP-11-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-11` green, and you would put this number on Northgate's out-of-hours page |

---

## Step 12 — The hostile-caller suite

**Story:** *As the person selling this, I can play ten difficult callers at the agent on every change and show exactly how it handles each one.*

**Mode:** `LEARN` — a suite designed carelessly measures nothing, and here it is also the only way to test at all.

**Why now:** After escalation exists, so there is a full set of behaviours to assert. Before cost, because every cost change is a trade against these results.

**Concepts:**
- **You cannot phone your own agent sixty times.** That single fact is why this step exists, and it is why voice projects so often ship untested. Recorded audio played through the same pipeline a real call uses is the only repeatable option.
- **Record real audio, not synthesised audio.** Text to speech reading a difficult script is not a difficult caller: it has no noise, no hesitation, no accent, no overlapping speech. Record yourself and other people, badly, on a phone, outdoors. The suite is only as good as how unpleasant its audio is.
- **The ten callers** from the roadmap overview, at minimum: the mumbler, the interrupter, the barking dog, the one who changes their mind, the speller, the silent one, the ninety-second talker, the gas leak, the price asker, the one trying to get the agent off-script.
- **Assert outcomes and facts, not words.** The booking exists with the right date; the outcome is escalated; no price appeared in the transcript. Asserting exact phrasing produces a suite that fails on harmless variation and gets disabled within a month.
- **Two halves, as everywhere in this catalog.** Must-do: it takes the booking, it spells the name right. **Must-never**: it does not quote a price, it does not give safety advice, it does not book from an unconfirmed number, it does not keep talking over an interrupting caller. The second half is the one that stops the agent from optimising into being agreeable.
- **The latency budget runs in the suite too.** A change that makes the agent smarter and slower has to show up here, because slower means more interruptions and a worse call.
- **Cost per suite run, watched.** It exercises telephony, recognition, the model and synthesis. It is the most expensive test suite in this catalog, and step 14 will price it.
- **The gate.** A must-never failure blocks. A must-do failure needs a recorded decision.
- **The suite is half the portfolio artefact.** "It handles these ten callers — here they are, play them" is a claim a reviewer can check in five minutes.

**Libraries:** your recorded fixtures, the framework's ability to feed audio into a session, pytest

**Expected outcome:** At least ten recorded audio callers across all three clients, played through the real pipeline. Assertions on outcomes, facts and the transcript's absences rather than exact wording. Must-do and must-never halves. The latency budget asserted per suite run. A CI gate. `docs/caller-suite.md` — the callers, what each proves, current results and the cost of a run.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-12` — removing the immediate-escalation check fails the gas-leak caller; removing the confirmation rule fails the mumbler; every assertion is about an outcome, a fact or an absence rather than exact wording; two runs agree on every deterministic assertion. |
| **L2 — Manual checks** | (a) Listen to all ten recordings. If any of them sounds like a person reading a script in a quiet room, re-record it outdoors. <br>(b) Add the caller who defeated you most during manual testing. It belongs in the suite more than anything you invented. |
| **L4 — Anti-patterns** | `AP-12-a`, `AP-12-b`, `AP-12-c`, `AP-12-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-12` green, and you would run the suite in front of a client |

> **This is the step.** Before it, an agent that worked when you phoned it. After it, an agent whose behaviour you can demonstrate on ten difficult callers, repeatedly, including the ones it must refuse to handle.

---

## Step 13 — The failure modes only voice has

**Story:** *As a caller, nothing about this call ever leaves me listening to silence wondering whether it is still there.*

**Mode:** `BUILD` — handling, over behaviours you have now seen.

**Why now:** After the suite, because the suite is what proves each handler works. These are the failures that never occur in development and always occur in production.

**Concepts:**
- **Dead air is the worst failure in voice**, and it has no equivalent in text. The caller cannot tell whether the system is thinking, broken, or gone. Every path that could produce more than a couple of seconds of silence needs something to say — honest, short, and never repeated identically.
- **The silent caller.** Nothing at all: a pocket dial, a caller who cannot hear you, a bad line. Prompt once, prompt again differently, then close the call politely. Sitting there costs money on four meters simultaneously.
- **The agent that will not stop.** A loop where it keeps talking, re-asks the same question, or restarts the conversation. A hard turn limit per call and a repeated-question detector, both of which end in a handover rather than another attempt.
- **The maximum call duration.** A call that has run for fifteen minutes is not going well. A cap, with a graceful ending or a handover, protects the caller and the bill.
- **A component dying mid-call**: recognition drops, synthesis fails, the model times out. Each needs a spoken response and a decision — retry once, or hand over. None of them may produce silence.
- **The caller who hangs up mid-turn.** Stop everything immediately. A synthesiser still generating audio for a caller who left is money spent on nobody, and an agent that finishes its turn into a dead line will also record a nonsense outcome.
- **Network degradation.** Audio quality drops and recognition confidence falls with it. Recognising the pattern — several low-confidence turns in a row — and handing over is better than three more attempts.
- **Cost circuit breakers.** A per-call cost ceiling and a per-client daily ceiling. This is the material where a loop is most expensive, because four meters run at once.
- **Everything ends with an outcome.** Never an unfinished call in the ledger. Abandoned, escalated, completed, failed — one of them, always, even when the process died.

**Libraries:** your ledger, your framework's session events

**Expected outcome:** No path producing more than the stated maximum silence. Silent-caller handling with two different prompts and a polite close. A turn limit and a repeated-question detector ending in handover. A maximum call duration. Spoken handling for each component failure. Immediate teardown on hang-up. A degradation detector that hands over. Per-call and per-client cost ceilings. Every call ending with a recorded outcome, including on a crash.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-13` — no fixture call contains silence longer than the stated maximum; a silent-caller fixture is prompted twice and closed politely; a forced synthesis failure produces speech rather than silence; a caller hanging up mid-turn stops all generation within the stated threshold; killing the process mid-call leaves a call with an outcome, not an open row. |
| **L2 — Manual checks** | (a) Call and say nothing. Then call and hang up mid-sentence. Then call and talk for two minutes without pausing. All three will be worse than you expect. <br>(b) Break each component in turn and call. Anything that produces silence is the finding. |
| **L4 — Anti-patterns** | `AP-13-a`, `AP-13-b`, `AP-13-c`, `AP-13-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-13` green, and you cannot produce dead air however hard you try |

**Harness impact:** `AGENTS.md` v4 — record that escalation is an outcome rather than a failure, that no path may produce silence beyond the maximum, that every call ends with an outcome, and that no change ships without a caller-suite run.
