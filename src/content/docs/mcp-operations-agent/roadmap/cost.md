---
title: Cost
description: Steps 14–15. Where the money goes in an agent loop and how to see it, then budgets and levers with the scenario suite deciding whether each trade was acceptable.
sidebar:
  order: 6
---

Two steps. The first only measures. The second changes things, and every change is judged by the
suite from step 12.

An agent loop spends differently from a single call, and the difference is the thing to
understand: **cost grows with turns, and the history is re-sent on every one of them.** A
five-turn action does not cost five times a one-turn action. It costs more.

---

## Step 14 — Where the money goes, and how to see it

**Story:** *As the person selling this, I can show what one action costs, which client is expensive and why, and I find out the day it changes.*

**Mode:** `LEARN` — this step deliberately changes no behaviour.

**Why now:** After the suite exists, so you have something to protect while optimising. Optimising before this is guessing.

**Concepts:**

**Why an agent loop is different.** Each turn re-sends the whole conversation — the system prompt, the tool schemas, every previous tool result. Input tokens grow with every turn, so a loop's cost is roughly quadratic in turns, not linear. Two consequences: **the cheapest optimisation is fewer turns**, and a loop with no stop condition is an unbounded bill.

**The four places spend is visible.**

| Where | What it gives you | What it cannot do |
|---|---|---|
| The provider console | The bill. Daily and monthly totals per key and model. | Attribute anything. It cannot tell you Sable costs four times Northwind. |
| The `usage` on every response | Per turn: input, output, cache-creation and cache-read tokens. | Persist. Not stored at the moment of the call, it is gone. |
| The token counting endpoint | An estimate before you spend, for a request you are about to send. | Predict output, or predict how many turns the loop will take. |
| **Your own ledger** | Cost per action, per client, per tool, per turn. The only place a client's question is answerable. | Exist unless you build it. Step 13's traces already carry the data; this step aggregates it. |

**Attribution, and the units that mean something.**

- **Cost per action, per client.** Sable's reschedules take more turns than Northwind's refunds. If your figure says otherwise, check whether the loop is stopping when it should.
- **Cost per turn, and the turn distribution.** The mean hides the problem. The action that took fourteen turns is where the money went, and it is usually a tool that failed and was retried by the model.
- **Cost per tool.** A tool returning too much data is a cost you pay on every subsequent turn of that action, not once. This is the most common surprise in this section.
- **Cost per *completed* action** — the honest unit. It includes retries, the turns spent on actions that ended in refusal, and the actions that went to approval and were rejected. An agent that refuses cheaply still costs money.
- **The human minute, in the same currency.** An approval takes a person time. From step 0 you know their loaded cost. Any change that reduces token spend by raising the approval rate is probably a loss, and this is the number that shows it.

**Infrastructure alongside inference.** A small VPS, PostgreSQL and the MCP server cost more per
month than the inference at low volumes. Put both in the report. It stops you spending a week
trimming prompts to save a few dollars.

**Third-party tooling, and when it is worth it.** Several platforms give per-request cost,
tracing and dashboards. They are good and mostly premature here:

| Option | What it is | When to adopt |
|---|---|---|
| Open-source observability platforms | Tracing, evaluation and cost dashboards; free to self-host, with hosted tiers | When several services and several people need the same dashboard. **Check the self-hosted resource requirements first** — some run five services and want more memory than this entire application. |
| Proxy or gateway products | Sit between you and the provider for per-request cost, caching and limits | When you have several applications and want one place to see them. Note the extra hop and check the product is still actively developed. |
| Metering and billing tools | Turn usage into billable meters and invoices | When you bill your own customers by usage — a business model decision, not an observability one. |

The honest default here is the trace table you already built at step 13, aggregated. Write down
the trigger that would change your mind.

**Alerts before invoices.** A spending limit on the account, plus your own alert on cost per
action moving outside its band. A tool that started failing, or a prompt change that added two
turns to every action, shows up here days before the bill.

**Libraries:** none new — the usage fields recorded in step 13's traces

**Expected outcome:** A cost ledger aggregating traces by client, action type, tool and turn count. `docs/cost-report.md` — cost per action per client, the turn distribution with the worst cases named, cost per tool, cost per completed action including refusals and rejected approvals, monthly infrastructure beside monthly inference, and the price of one human approval. A spending limit set and a drift alert. A written decision on third-party tooling with its trigger. **No behaviour changes.**

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-14` — every model call in a full scenario-suite run is attributed to a client, an action and a turn, and the attributed sum matches the run total; an action that ended in refusal appears with its cost. |
| **L2 — Manual checks** | (a) Find the action with the most turns and read its trace. There will be a reason, and it will be fixable at step 15. <br>(b) Put the cost of one approval and the cost of one action on the same line. Whichever surprises you is the one to remember. |
| **L4 — Anti-patterns** | `AP-14-a`, `AP-14-b`, `AP-14-c`, `AP-14-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-14` green, and you can answer "what does one action cost?" per client, with the arithmetic |

---

## Step 15 — Budgets, and making it cost less

**Story:** *As the person selling this, one action cannot cost more than a stated amount, and I cut the average without breaking a single must-refuse scenario.*

**Mode:** `LEARN` — every lever trades something, and the suite is what says whether the trade was acceptable.

**Why now:** After measurement and after the suite. Not one step earlier.

**Concepts:**

**The budget comes first, because it is a safety property.** A loop with no ceiling is an unbounded bill and, in a bad case, an agent looping on a failing tool at three in the morning. Two mechanisms, and both belong:

- A **hard stop in your executor**: turn limit, and a cost ceiling checked before each turn using the usage you already record. This is yours, it cannot be argued with, and it is what actually protects you.
- A **task budget passed to the model**, telling it how much room it has so it paces itself and finishes rather than being cut off mid-action. This produces a better ending than a hard stop — a hard stop leaves an action half-done, which for Sable means a partial success you now have to compensate.

Use both. The budget makes the ending graceful; the hard stop makes it certain.

**Then the levers, in this order. Free wins before anything that trades quality.**

1. **Fewer turns.** The largest lever, because of the re-sending. Read the traces of your longest actions: a tool that returns ambiguous data, a missing tool that forces two calls to work around it, a description that causes a wrong call and a correction. Every one of those is a turn removed by a fix that costs nothing at runtime.
2. **Smaller tool results.** A tool returning a whole record pays for it on every subsequent turn of that action. Trim to what the next decision needs — which step 8 already said, and which you can now price.
3. **Prompt caching on the stable prefix.** The system prompt and tool schemas are identical across every action of a type. Verify with cache-read tokens; a surface version string in the wrong place invalidates the cache silently and the feature appears to do nothing.
4. **Trim the tool surface per client.** Northwind's agent does not need Sable's delivery tools. Fewer schemas is fewer input tokens on every turn, and fewer wrong calls.
5. **Manage the history on long actions.** Old tool results can be cleared or the conversation compacted so a fourteen-turn action does not re-send everything. Note it is available; use it only if your turn distribution says you need it.
6. **Lower effort before changing the model.** Effort tunes how much the model spends thinking. Lower effort on a capable model frequently beats a smaller model, and it keeps one cache namespace instead of two.
7. **Then, and only then, the model.** Possibly a cheaper model for routine read-only lookups and the stronger one for anything that reaches a write. Measure; the suite decides.

**Cost per completed action, always.** A cheaper configuration that raises the refusal rate or the approval rate has moved cost onto a person. You priced that minute in step 14 for this decision.

**Every change through the suite.** One change per experiment, suite run before and after, result recorded. A change that breaks a must-refuse scenario is reverted regardless of what it saved.

**When the answer is "spend more."** If a stronger model on Lumen's payment plans is the difference between an approver trusting the proposals and not, that is correct. Say where you deliberately spent more.

**Then price it.** Cost per action × expected monthly volume, plus infrastructure, plus your time. Against the step 0 manual cost.

**Libraries:** the `anthropic` SDK — task budgets, prompt caching, effort settings, context management

**Expected outcome:** A hard cost and turn ceiling enforced in the executor, and a task budget passed to the model so long actions end gracefully. At least four cost changes, each as its own experiment with suite results before and after. Caching verified by cache-read tokens. Per-client tool surfaces. A tuning log. `docs/cost-report.md` finished with cost per action per client, a monthly total at a stated volume, and the comparison against step 0.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — an action cannot exceed its cost ceiling, asserted by forcing a loop against a failing tool; cost per completed action falls against the step 14 baseline while every must-refuse scenario still passes and the must-do pass rate stays inside the band; every change has a recorded before-and-after. |
| **L2 — Manual checks** | (a) For each change, name what it could have broken and point at the scenario result that says it did not. <br>(b) Force a budget exhaustion on a Sable reschedule. Confirm the action ends before the point of no return, or is compensated. A budget that stops a loop mid-irreversible-action is a bug, not a control. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d`, `AP-15-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, and no action can cost more than a number you chose |

> **The trap this step exists to prevent.** It is entirely possible to halve the token bill by making the agent refuse more and escalate more, and to report it as a saving. The client pays a person for those escalations. Cost per completed action catches it; nothing else does.
