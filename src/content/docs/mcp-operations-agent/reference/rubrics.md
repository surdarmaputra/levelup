---
title: Rubrics
description: Acceptance criteria (ACC-NN) and anti-patterns (AP-NN-x) for every step.
sidebar:
  order: 1
---

Every roadmap step has a **rubric** here: the objective pass/fail bar for that step. This page is the full text of the `ACC-NN` and `AP-NN-x` items that each step's **Verification** block only names by ID — a lookup you read one section of per step, not a checklist you complete.

**`ACC-NN` — the gating acceptance test.** One test, unambiguous pass/fail — *"the same refund delivered twice results in exactly one charge"*. Write it, watch it fail, then make it pass.

**`AP-NN-x` — the anti-patterns.** Named mistakes that pass the acceptance test and are still wrong: an idempotency key generated inside the retry, an approval gate the agent can satisfy itself.

**Why this exists.** An agent that does the wrong thing looks exactly like one that does the right thing until somebody reads the ledger. The rubric turns "done" into something you check.

**How to use it — three times per step:** read `ACC-NN` before building and write that test first; self-check every `AP-NN-x` once it passes; paste **only that step's section** into the [reviewer](../../setup/reviewer-setup/).

Steps 0 to 3 produce documents rather than code. Their rubrics are still objective.

---

## Step 0 — What the manual process costs

**ACC-00** — every client has both numbers (cost to do by hand, cost of one wrong action), both derived rather than asserted, and one sentence per client saying what the ratio implies for oversight.

| ID | Anti-pattern |
|---|---|
| AP-00-a | **Only costing the labour.** The wrong action's cost — the double refund, the plan the business must honour, the wasted driver journey — is the number that decides the authority model. |
| AP-00-b | **Assuming the saving is the handling time.** If the action is one minute inside a ten-minute process, automating it saves nothing anyone notices. Find that out before building. |
| AP-00-c | **Unmarked assumptions.** Every number a client can challenge must be visibly an assumption, or the first challenge discredits the page. |

---

## Step 1 — How an agent loop behaves

**ACC-01** — the document names the point at which a tool call becomes an action, and gives a silent failure for each loop stage.

| ID | Anti-pattern |
|---|---|
| AP-01-a | **Treating a tool call as an action.** They are separated by your authority check. Collapsing them is the design mistake the whole material exists to prevent, and a demo never reveals it. |
| AP-01-b | **Assuming exactly-once delivery.** After a timeout you cannot know whether the write committed. A design that has no answer here has no answer in production. |
| AP-01-c | **Treating tool results as trusted.** A customer note is text a customer typed. Anywhere it can act as an instruction is an exploit. |

---

## Step 2 — What you could buy instead

**ACC-02** — five real options across the four layers with sources and dates; a per-client recommendation with a one-sentence deciding reason; an explicit list of which parts of this roadmap a platform would and would not have done.

| ID | Anti-pattern |
|---|---|
| AP-02-a | **Ignoring the client's existing vendors.** If their helpdesk ships this next quarter, your project is worth less, and they will not think to tell you. |
| AP-02-b | **Believing a platform removes the hard parts.** It removes the loop and the hosting. Authority, idempotency, compensation and evaluation remain yours. |
| AP-02-c | **Recommending "build" three times out of three.** The analysis was written to justify a decision already made. |

---

## Step 3 — The authority model

**ACC-03** — every action type appears with all seven columns; the refusal list has at least three entries with reasons; the document states what an approver is shown.

| ID | Anti-pattern |
|---|---|
| AP-03-a | **Approval as a confirmation dialog.** A prompt inside the loop that the agent can satisfy is not approval. It is a separate record with a separate author. |
| AP-03-b | **A single value limit.** Per action, per customer per day, and per client per day. One of the three alone is not a limit. |
| AP-03-c | **Writing the refusal list after building.** By then you will rationalise anything you have already made work. Write it while everything is equally hard. |
| AP-03-d | **Treating the requester as the authoriser.** A customer asking for a refund is a request, not an entitlement. Conflating them turns the agent into an exploit. |

---

## Step 4 — Harness and tooling bootstrap

**ACC-04** — `npm run verify` exits 0 on a clean tree and non-zero when a lint error, a type error and a failing test are each introduced independently.

| ID | Anti-pattern |
|---|---|
| AP-04-a | **`any` permitted anywhere.** Tool arguments arrive from a model and results from a system that lies. `unknown` plus a parse step at every boundary, or a wrong argument reaches a write. |
| AP-04-b | **A slow pre-commit hook.** Over ~5 seconds and it is bypassed permanently. |
| AP-04-c | **An `AGENTS.md` that does not point at the authority model.** It is the one document that stops an agent proposing tools which skip the gate. |

---

## Step 5 — The fake business system

**ACC-05** — each of the seven behaviours can be forced deterministically from a test; two payment requests without a shared key produce two charges, with a shared key one.

| ID | Anti-pattern |
|---|---|
| AP-05-a | **A friendly fake.** A stub that always succeeds teaches nothing and every later test passes for the wrong reason. |
| AP-05-b | **Unseeded randomness.** Unreproducible failures make every test flaky, and a flaky suite is disabled within a week. |
| AP-05-c | **Pointing the material at a real third-party system.** Not a sandbox with real money, not a client's trial account. We ship the target. |

---

## Step 6 — The action ledger

**ACC-06** — a second attempt with the same idempotency key is rejected by the database rather than application code; an approval cannot be created by the agent's write path; a query under client A never returns client B's rows.

| ID | Anti-pattern |
|---|---|
| AP-06-a | **No action/attempt distinction.** Retries then create actions, the ledger becomes a history, and idempotency has nowhere to live. |
| AP-06-b | **Enforcing idempotency with a `SELECT` before the `INSERT`.** Two workers both see nothing and both proceed. The unique constraint is the only thing that holds. |
| AP-06-c | **Approval as a column on the action.** It must be a separate row with a separate author, structurally unwritable by the agent's path. |
| AP-06-d | **Compensation as a boolean.** Compensation is an action that can fail. A flag means its failure has nowhere to go. |

---

## Step 7 — The MCP server

**ACC-07** — an argument not in the schema fails validation before the handler; a backend 500 returns an error result rather than throwing; a Northwind session cannot read a Sable delivery.

| ID | Anti-pattern |
|---|---|
| AP-07-a | **Loose tool schemas.** Without strict validation a plausible wrong argument reaches your code and is acted on. |
| AP-07-b | **Read-only by naming convention.** Enforce it at the boundary, or it disappears in a refactor nobody flagged. |
| AP-07-c | **Tool results that return everything.** Personal data enters a context window, a trace and possibly a log, for a question about an order status. |

---

## Step 8 — The tool surface

**ACC-08** — every argument description resolves a named ambiguity; no two tools share a one-sentence purpose; every trace records the surface version.

| ID | Anti-pattern |
|---|---|
| AP-08-a | **Descriptions that restate the argument name.** "amount: the amount" leaves currency, scope and units to a guess, and the guess will be plausible. |
| AP-08-b | **Two tools that could both apply.** Every call becomes a coin flip. If you cannot say when each is used, neither can the model. |
| AP-08-c | **One tool that both proposes and executes.** Separating them is the cheapest safety mechanism in the surface. |
| AP-08-d | **An unversioned surface.** A trace from three weeks ago was taken against different tools and cannot be reconstructed. |

---

## Step 9 — The first write and idempotency

**ACC-09** — the same refund delivered twice produces exactly one charge, asserted through the verification endpoint; a forced timeout then retry produces one charge; ten concurrent identical requests produce one charge.

| ID | Anti-pattern |
|---|---|
| AP-09-a | **Generating the key inside the retry.** A fresh key per attempt is the same as no key. It looks correct in review and the fake system charges twice. |
| AP-09-b | **Not passing the key downstream.** Your ledger is idempotent and the client's payment system still charges twice. |
| AP-09-c | **Recording the attempt after the call.** A crash mid-call then leaves no evidence, which is exactly the case the record existed for. |
| AP-09-d | **Trusting a 200.** Real systems return success for writes that did not commit. Verify the ones that matter. |

---

## Step 10 — Irreversible actions

**ACC-10** — a reschedule whose notification fails after commit produces a compensation attempt and is recorded as partially succeeded; a failed compensation escalates exactly once; no path attempts to undo past the point of no return.

| ID | Anti-pattern |
|---|---|
| AP-10-a | **Assuming rollback exists.** It is a database idea and it does not cross a system boundary. Most of what an operations agent does cannot be rolled back. |
| AP-10-b | **A two-value outcome.** Partial success is a real state; without it, it is being recorded as one of the other two, incorrectly. |
| AP-10-c | **Compensation that cannot fail.** The slot was taken, the driver left. A compensation with no failure path has not been designed. |
| AP-10-d | **Silent self-healing.** A compensation nobody sees means nobody learns the action is unreliable. |

---

## Step 11 — The loop, authority and approval

**ACC-11** — a Lumen plan does not exist until an approval written by another author exists; an over-limit action is refused before any tool call; a tool result containing an instruction changes nothing; a restart during awaiting-approval loses nothing.

| ID | Anti-pattern |
|---|---|
| AP-11-a | **Authority in the system prompt.** A prompt instruction is a request. The executor's check is the rule. |
| AP-11-b | **Blocking the loop for a human.** One restart loses the action. Awaiting approval is a persisted state, not a pause. |
| AP-11-c | **An approval queue showing an action id.** It gets rubber-stamped within a week, which is worse than no gate because it looks like control. |
| AP-11-d | **The model deciding when to stop.** A turn limit, a budget and a repeated-call rule are stopping conditions. "It said it was done" is not. |

---

## Step 12 — The scenario suite

**ACC-12** — removing the authority check fails at least five must-refuse scenarios; every scenario asserts world state rather than agent output; the deterministic scenarios agree across runs; CI blocks a must-refuse failure.

| ID | Anti-pattern |
|---|---|
| AP-12-a | **Only must-do scenarios.** Every measure improves by making the agent more willing to act, so a suite without must-refuse cases optimises toward an agent that does everything asked. |
| AP-12-b | **Asserting what the agent said.** "I've issued the refund" is text. Assert the ledger and the fake system. |
| AP-12-c | **Asserting an exact tool sequence.** The suite then fails on harmless variation and gets disabled. Assert the outcome. |
| AP-12-d | **An uncalibrated judge.** Without agreement measured against your own grading, the number is generated rather than measured. |

---

## Step 13 — Traces

**ACC-13** — the trace answers what was asked, decided, called and returned, proven by reconstructing a specific decision in a test; no trace contains a credential or full payment detail; retention removes traces past a client's window.

| ID | Anti-pattern |
|---|---|
| AP-13-a | **A log instead of a trace.** Logs rotate and are for operators. "Why did it do that?" arrives weeks later about one action, and needs a queryable record. |
| AP-13-b | **Storing the whole request because it is easier.** Traces are the most tempting place to keep everything and the most expensive place to leak it. |
| AP-13-c | **Presenting recorded reasoning as proof.** It is useful context about a decision, not a guarantee about it. Say which to a client. |

---

## Step 14 — Where the money goes

**ACC-14** — every model call in a suite run is attributed to a client, an action and a turn, and the attributed sum matches the run total; a refused action appears with its cost.

| ID | Anti-pattern |
|---|---|
| AP-14-a | **The console as the only source.** It is the bill. It cannot say which client, which tool or which change, so a spike is noticed late and never explained. |
| AP-14-b | **Reporting the mean turns per action.** The mean hides the fourteen-turn action, which is where the money went and where the fixable problem is. |
| AP-14-c | **Leaving the approver's minute out.** A change that shifts cost onto a person then looks like a saving. |
| AP-14-d | **Adopting an observability platform before there is anything to observe.** Check what it costs to *run* — some are five services and want more memory than this whole application. |

---

## Step 15 — Budgets and cost

**ACC-15** — an action cannot exceed its cost ceiling, asserted by forcing a loop against a failing tool; cost per completed action falls against baseline while every must-refuse scenario passes; every change has a recorded before-and-after.

| ID | Anti-pattern |
|---|---|
| AP-15-a | **No hard ceiling in your own executor.** A model-side budget makes an ending graceful; only your check makes it certain. |
| AP-15-b | **A budget that can stop an action mid-irreversible-step.** That is a bug, not a control — it manufactures exactly the partial success step 10 exists to avoid. |
| AP-15-c | **Optimising tokens before turns.** Cost grows with turns because the history is re-sent. One removed turn beats a week of prompt trimming. |
| AP-15-d | **Cost per request instead of per completed action.** A configuration that refuses and escalates more looks cheaper and is not. |
| AP-15-e | **Two changes in one experiment.** They cancel out and the run teaches nothing. |

---

## Step 16 — Deploy and credentials

**ACC-16** — restarting mid-action produces no second attempt; an unauthenticated request to the HTTP transport is rejected; no credential appears in any trace, log or tool result across a full suite run.

| ID | Anti-pattern |
|---|---|
| AP-16-a | **A credential as a tool argument.** It then travels through the model's context, the trace and possibly a log. Tools hold credentials; the model never sees them. |
| AP-16-b | **An unauthenticated hosted MCP server.** Anyone who can reach it can spend the client's money. |
| AP-16-c | **No export of the ledger and traces.** They are the client's evidence, and a dispute is exactly when they need to read them without you. |

---

## Step 17 — Drift and the monthly report

**ACC-17** — changing a fake-system response shape raises a drift signal for the affected action type only; a fourth action needs configuration, a tool and scenarios but no loop change; the scheduled suite run fails loudly on a broken must-refuse scenario.

| ID | Anti-pattern |
|---|---|
| AP-17-a | **Watching the aggregate.** One action type drifting does not move the overall number, which is why the client notices first. |
| AP-17-b | **A new action requiring the loop to change.** It caps how many clients you can carry and makes every addition a redesign. |
| AP-17-c | **Adding an action without must-refuse scenarios.** It is an action nobody has proven is safe, and the scenarios are part of its price. |
| AP-17-d | **Counting compensations instead of reading them.** Each one is a case where the world went wrong. The pattern is the finding. |
