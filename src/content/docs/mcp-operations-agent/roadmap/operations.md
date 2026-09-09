---
title: Operations
description: Steps 16–17. Deploy, credentials and the customer's surface, then drift, new tools, and the monthly report.
sidebar:
  order: 7
---

## Step 16 — Deploy, credentials, and the customer's surface

**Story:** *As Northwind Tools, my staff use this without installing anything, and the credentials it uses to reach my systems are scoped to what it may do.*

**Mode:** `BUILD` — wiring, with two decisions to record.

**Why now:** After the agent's behaviour is proven and priced. Deploying something whose refusals you cannot demonstrate is how a pilot becomes an argument.

**Concepts:**
- **The demo surface and the customer surface are different, and both are needed.** The MCP server is how a reviewer or an engineer drives this — it is half the portfolio artefact and it stays. It is not how a customer-service agent at Northwind uses it. They get a small server-rendered page: the approval queue, a way to start an action, and the trace of what happened. Deliberately small.
- **Credentials are the largest risk in the whole project.** This system holds keys that can move a client's money. Scope them to exactly the actions in the authority model, rotate them, and never let them reach a trace, a log or a tool result.
- **Least privilege at the system boundary too.** If the client's payment system can issue a credential limited to refunds under a value, use it. Your authority check and their credential scope should agree, and the second one holds when the first has a bug.
- **Never put a credential in the model's context.** Tools hold credentials; the model never sees them. Any design where a key travels as a tool argument is broken.
- **Authentication on the HTTP transport.** A hosted MCP server that anyone can reach is a system anyone can spend the client's money with.
- **What has to run**: the MCP server, the agent service, the approval page, PostgreSQL. Four things, one Compose file, one small host.
- **Idempotency survives deploy.** A rolling deploy mid-action must not produce a second attempt. The derived key from step 9 is what makes this safe — confirm it under an actual restart.
- **The runbook**: a stuck approval, a tool failing repeatedly, a cost spike, a compensation that failed, a customer disputing an action. Five pages, written before they happen.
- **Hand-over.** The ledger and the traces are the client's records. Export must exist. A system whose evidence only its author can read is worth less in a dispute, which is when they need it most.

**Libraries:** Docker Compose, your CI, a template renderer

**Expected outcome:** A deployment on one small host with the four services, run by CI. Scoped, rotatable credentials from the environment, never in a trace. Authenticated HTTP transport. The approval and trigger page. Idempotency verified across a restart mid-action. `docs/RUNBOOK.md` with the five scenarios. An export of the ledger and traces the client can read without you.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — restarting mid-action produces no second attempt in the fake system; an unauthenticated request to the HTTP transport is rejected; no credential appears in any trace, log or tool result, asserted across a full suite run. |
| **L2 — Manual checks** | (a) Delete your local environment and bring the system up from the repository and runbook alone. <br>(b) Have someone who is not you approve a Lumen plan from the page, with no explanation. Watch where they hesitate. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, and a reviewer can drive the MCP server while a customer uses the page |

---

## Step 17 — Drift, new tools, and the monthly report

**Story:** *As Lumen Energy, when the agent starts behaving differently, my developer tells me before my team notices — and adding a new action does not mean a new project.*

**Mode:** `LEARN` — this is what turns a delivered build into a retainer.

**Why now:** Last. It needs the suite, the traces, the cost ledger and a running system.

**Concepts:**
- **Drift here is not the model changing.** It is the world changing: a tool starts returning a new field, the client adds an order status nobody mentioned, volumes shift, customers start asking in a new way. The agent's behaviour changes and nothing errors.
- **What to watch**: refusal rate per client, approval rate, turns per action, tool error rates, compensation frequency, and the distribution of refusal reasons. A shift in any of them against its own baseline is the signal.
- **Per client and per action type, against itself.** One action type drifting does not move the aggregate enough to see, which is exactly why the client sees it first.
- **A rising refusal rate is the most useful early signal.** It usually means the world stopped matching the tools, and it is visible days before anyone complains.
- **Compensations are an incident feed, not a metric.** Every one is a case where the world went wrong and the system tried to fix it. Read them; do not just count them.
- **Re-run the suite against reality periodically.** The scenario suite runs on every change. Also run it on a schedule against the current fake system and the current tool surface, because both drift under you.
- **Adding an action should be data plus a tool, never a redesign.** An authority rule, a tool with a schema and a description, a compensation if it is irreversible, and scenarios in both halves of the suite. If a new action needs the loop changed, the design is wrong — and it is also the difference between a retainer that scales and one that eats you.
- **New scenarios are part of the price of a new action.** Say so when quoting. An action added without must-refuse scenarios is an action nobody has proven is safe.
- **The monthly report is the retainer.** Actions taken, refused, approved and compensated; the cost; hours saved against the step 0 model; the suite result; anything that changed. One page, generated, sent whether or not anything happened.
- **When to retire an action.** If the client's own software ships the same capability, hand it over. Saying so is how you stay their developer.

**Libraries:** none new — metrics over your own ledger and traces

**Expected outcome:** Per-client, per-action-type baselines with alerts on sustained shifts in refusal rate, approval rate, turns per action and tool error rate. A compensation feed a human reads. A scheduled suite run. A documented new-action path — authority rule, tool, compensation, scenarios — exercised by adding a fourth action end to end. An automatically generated monthly client report. A note in the runbook on when to retire an action.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — changing a fake-system response shape raises a drift signal for the affected action type and not the others; adding a fourth action through configuration, a tool and scenarios requires no change to the loop; the scheduled suite run fails loudly when a must-refuse scenario breaks. |
| **L2 — Manual checks** | (a) Generate the monthly report for Sable and read it as the client. Every number must be one they asked for. <br>(b) Take a drift alert and write the email you would send. If you cannot say what changed and what you propose, the signal is not actionable. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, and a behaviour change is caught by you rather than reported by the client |

> **What you have at the end.** An MCP server a reviewer installs and drives themselves, a suite that proves twenty things the agent refuses to do, a trace that explains any decision months later, and a cost per action with the arithmetic. Very few people who have built an agent have any of those four.
