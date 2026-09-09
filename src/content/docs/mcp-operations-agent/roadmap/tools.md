---
title: Tools
description: Steps 7–10. The MCP server and the first read-only tool, tool surface design, the first write with idempotency, and actions that cannot be undone.
sidebar:
  order: 4
---

## Step 7 — The MCP server and the first read-only tool

**Story:** *As a reviewer, I install this server in my own client, ask "what is the status of Northwind order 4471?", and get a real answer from a real system.*

**Mode:** `BUILD` — protocol plumbing. Generate, then read every line.

**Why now:** Read-only first. A server that can only look things up is safe to get wrong, and it teaches the whole protocol before anything can cost money.

**Concepts:**
- **What an MCP server is**: a process that advertises tools with schemas and executes them when a client asks. The client is someone else's — a coding tool, a chat application, your own loop at step 11.
- **Transports.** stdio for a local process, streamable HTTP for a hosted one. Which you use changes deployment and authentication, not tool design. Build both; you need stdio for the reviewer demo and HTTP for step 16.
- **Tool schemas are the contract.** Strict, with `additionalProperties: false`, so arguments either validate exactly or fail. A loosely typed tool accepts a plausible wrong argument and passes it to your code.
- **Read-only means read-only.** Enforce it at the boundary rather than by naming convention. A tool that reads today and writes after a refactor is how a safety property disappears in a diff nobody flagged.
- **Errors are results, not exceptions.** A tool that fails returns a result marked as an error, so the model can see it and react. Throwing across the protocol boundary loses that.
- **What a tool result must not contain**: more data than the task needs. A customer lookup returning a full record puts personal data in a context window, in a trace, and possibly in a log, for a question that was about an order status.
- **The portable demo.** Once this works, a reviewer connects and drives it with no interface built. That property is worth designing for from the start — it is half the portfolio artefact.

**Libraries:** `@modelcontextprotocol/sdk`, Zod for schemas

**Expected outcome:** An MCP server exposing three read-only tools against the fake systems — order status, customer history, delivery lookup — with strict schemas, error-as-result handling, and both transports working. Client-scoped: a session for Northwind cannot read Sable's data. A README with the exact configuration a reviewer pastes into their own client.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-07` — a tool called with an argument not in its schema fails validation rather than reaching the handler; a tool whose backend returns 500 returns an error result rather than throwing; a Northwind-scoped session cannot read a Sable delivery. |
| **L2 — Manual checks** | (a) Install the server in your own client and use it for ten minutes. Note every place the tool descriptions were unclear — that is step 8's input. <br>(b) Read one tool's result and ask what you would not want in a log. Remove it now. |
| **L4 — Anti-patterns** | `AP-07-a`, `AP-07-b`, `AP-07-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-07` green, and someone else can drive your server from their own machine |

---

## Step 8 — Designing the tool surface

**Story:** *As the agent, the tools available to me make the right action easy to take and the wrong one hard, so I fail safely rather than creatively.*

**Mode:** `LEARN` — this is design, and it is the highest-leverage step in the material.

**Why now:** After you have used your own tools and found them confusing, before you add a tool that can spend money. A bad surface is cheap to fix now and expensive after three write tools depend on it.

**Concepts:**
- **The model reads your tool descriptions and cannot ask a question.** Every ambiguity is resolved by guessing. A description that says *"amount: the refund amount"* leaves currency, units and whether it is the full order or a part unresolved — and the guess will be plausible.
- **Design for the wrong call being hard.** Separate tools for *propose* and *execute*. A required reason argument. An explicit customer id rather than a name. Enumerations instead of free text. Each of these removes a class of mistake at the schema level rather than catching it later.
- **Fewer, sharper tools beat many overlapping ones.** Two tools that could both plausibly apply is a coin flip on every call. If you cannot say in one sentence when each is used, the model cannot either.
- **Return what the next decision needs.** A tool that returns everything makes the model sift, costs tokens, and leaks data. A tool that returns too little forces another call.
- **Names are part of the interface.** `refund_order` and `issue_refund` in the same surface is a bug. Make the naming a written convention.
- **Make the dangerous ones look dangerous.** A destructive tool's description should say what cannot be undone. The model reads it, and — more importantly — so does the human reviewing your surface.
- **When there are many tools.** A large surface can be deferred and searched rather than sent in full on every call, which saves tokens and reduces confusion. Note the mechanism now; you do not have enough tools yet to need it, and that is worth saying out loud rather than building for.
- **Version the surface.** Tool schemas change. A traced action from three weeks ago was taken against a different surface, and reconstructing it needs to know which.

**Libraries:** none new — this is design over what step 7 built

**Expected outcome:** A written tool-surface document, `docs/tools.md`: every tool, its purpose in one sentence, its arguments with the ambiguity each one closes, what it returns and why that is the minimum. A naming convention. A surface version recorded with every trace. Then step 7's tools rewritten against it — descriptions in particular.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-08` — every tool argument's description resolves at least one named ambiguity; no two tools can be described by the same sentence; every trace records the surface version. |
| **L2 — Manual checks** | (a) Give your tool list to someone who has not seen the project and ask which tool they would use for three scenarios. Every hesitation is a description to fix. <br>(b) Re-run your ten minutes from step 7 with the new descriptions and count the improvement. |
| **L4 — Anti-patterns** | `AP-08-a`, `AP-08-b`, `AP-08-c`, `AP-08-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-08` green, and you would hand this surface to another engineer without explaining it |

---

## Step 9 — The first write, and idempotency

**Story:** *As Northwind Tools, when a refund is retried after a timeout, my customer is refunded once.*

**Mode:** `LEARN` — the single most important correctness property in the material, and the one an agent will get plausibly wrong.

**Why now:** After the surface is designed and before anything irreversible. Northwind is the reversible client, so this is the safest possible place to learn it.

**Concepts:**
- **At-least-once is not pessimism, it is the situation.** After a timeout you cannot know whether the write committed. Retrying may duplicate; not retrying may lose. Only idempotency makes the choice safe.
- **Where the key comes from.** Derived deterministically from the client, the action type and the identifying content of the request. The same intent produces the same key on every attempt, including from a different process after a restart.
- **The key is generated once, at the top.** Not inside the retry, not inside the HTTP client. A key created where the retry happens is a fresh key per attempt — the exact bug the fake system's double-charge exists to catch, and the one that looks correct in review.
- **The database constraint is the enforcement.** Check-then-insert loses the race. The unique constraint from step 6 is what actually holds under concurrency, and the code path has to treat a constraint violation as *this already happened* rather than as an error.
- **Pass the key downstream too.** Your ledger being idempotent does not stop the client's payment system charging twice. The key goes on the outbound call as well.
- **Three outcomes for a write, not two**: committed, definitely did not commit, and unknown. The third is the real one after a timeout, and it needs verification rather than a guess — which is what the fake system's verification endpoint is for.
- **Never trust a 200.** The fake system returns success for writes that did not commit, because real systems do. Verify writes that matter.
- **Recording before acting.** Write the attempt with its key *before* the outbound call, so a crash mid-call leaves evidence. An attempt recorded afterwards loses exactly the case you needed it for.

**Libraries:** none new — your database and HTTP client

**Expected outcome:** A refund tool for Northwind that derives an idempotency key, records the attempt before calling, passes the key downstream, treats a constraint violation as already-done, and verifies after a timeout. Retry with backoff. Tests that force every failure the fake system offers.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-09` — the same refund delivered twice results in exactly one charge in the fake system, asserted through the verification endpoint; a forced timeout followed by a retry produces one charge; ten concurrent identical requests produce one charge. |
| **L2 — Manual checks** | (a) Move the key generation inside the retry loop and watch the test fail. Then move it back. That failure is the entire lesson and it is worth causing on purpose. <br>(b) Force the 200-without-commit case and confirm your code notices. |
| **L4 — Anti-patterns** | `AP-09-a`, `AP-09-b`, `AP-09-c`, `AP-09-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-09` green, and you can explain why a `SELECT` before the `INSERT` is not enough |

---

## Step 10 — Actions that cannot be undone

**Story:** *As Sable Logistics, when a reschedule half-succeeds, the system does the thing that makes it right rather than pretending it can undo it.*

**Mode:** `LEARN` — the model most developers do not have, and the one Sable exists to force.

**Why now:** After idempotency, because compensation is only meaningful once delivery is exactly-once. Before authority, because what cannot be undone is what most needs a gate.

**Concepts:**
- **Rollback is a database idea and it does not cross a system boundary.** Once the driver's route changed and the notification went out, there is no transaction to abort. This is not an edge case; it is most of what an operations agent does.
- **Compensation instead.** A second action that makes the world acceptable again: re-notify, revert the slot if it is still free, credit the customer, escalate to a human. It is business logic, not infrastructure, and it has to be designed with the client — usually at step 3.
- **Compensation can fail.** The slot was taken, the driver already left. So compensation has attempts and outcomes of its own, and a failed compensation is an incident with a destination, not a logged warning.
- **The partial success.** Reschedule committed, notification failed. The customer does not know. The state that needs handling is not "failed" and not "succeeded" — and if your outcome enum has two values, this case is being recorded as one of them incorrectly.
- **Design the compensation before shipping the action.** An irreversible action with no compensation route is one that must be approved by a person or not automated at all. That is the rule, and it is what makes step 3's refusal list operational rather than theoretical.
- **The point of no return, named explicitly.** For each action, the moment after which compensation is the only option. Everything before it can still fail safely; everything after it needs a plan. Writing this down per action is the deliverable.
- **Ordering matters.** Do the reversible parts first and the irreversible part last. Half the partial-success cases disappear by ordering alone, and this is the cheapest defence in the step.
- **Tell someone.** Every compensation, successful or not, is visible to a human. Silent self-healing means nobody learns the action is unreliable.

**Libraries:** none new

**Expected outcome:** A reschedule tool for Sable with an explicitly named point of no return, ordering that puts the irreversible part last, a designed compensation with its own attempts and outcomes, and an escalation destination when compensation fails. The partial-success state modelled distinctly. `docs/compensation.md` recording, per action type, the point of no return and the compensation.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-10` — a reschedule whose notification fails after commit produces a compensation attempt and is recorded as partially succeeded, not as failed; a failed compensation raises an escalation exactly once; no code path attempts to "undo" an action past its point of no return. |
| **L2 — Manual checks** | (a) For each action type, say out loud where the point of no return is. Any hesitation is a design gap, not a documentation gap. <br>(b) Force a compensation failure and read what a human receives. If it does not say what state the world is in, they cannot act on it. |
| **L4 — Anti-patterns** | `AP-10-a`, `AP-10-b`, `AP-10-c`, `AP-10-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-10` green, and every irreversible action has either a compensation or an approval gate |

**Harness impact:** `AGENTS.md` v3 — record the idempotency rules, the point-of-no-return convention, and that an irreversible action without a compensation must be approved by a person.
