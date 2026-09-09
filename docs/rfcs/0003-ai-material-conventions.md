# RFC: AI Material Conventions

| Field | Value |
|-------|-------|
| **Authors** | @surdarmaputra |
| **Reviewers** | — |
| **Approvers** | @surdarmaputra |
| **RFC** | `docs/rfcs/0003-ai-material-conventions.md` |
| **Status** | ACCEPTED |
| **Impact** | HIGH |
| **Outcome** | Five AI and automation materials added under these rules |
| **Created Date** | 2026-09-09 |

---

## 📌 Background

The catalog grew an AI material (`fastapi-support-assistant`) and then five more in one release.
Working through what those five should be surfaced three problems the existing conventions did
not cover.

**Readers could build the thing and not sell it.** The existing step anatomy is excellent at
"what to build and how to prove it works" and silent on "what does this replace, what does it
cost, and when is it the wrong answer". A reader who finishes a document-extraction roadmap and
cannot explain what re-keying costs a business has learned a technique, not a job.

**Stacks drifted toward overkill without anyone noticing.** A first draft of these five
recommended a self-hosted observability platform on two of them. Checking it afterwards: that
platform's own documented minimums are roughly 21 GiB of RAM across five services, on projects
whose entire application fits in one. It had been proposed because it is what a large company
would run, not because a reader or their first customer needed it. Nothing in the conventions
forced that check.

**Cost was an afterthought.** `fastapi-support-assistant` handles cost well — step 16 — but it
handles it as one step near the end, and only because the author happened to care. There was no
rule making it mandatory, so the next material would have dropped it.

---

## 💡 Solution

Three changes: two conventions in `AGENTS.md`, one new skill.

### 1. Theory lives inside the roadmap, and it comes first

**Rejected alternative: a separate `concepts/` sidebar section.** It was the obvious shape and
it is wrong. A fourth sidebar group signals "optional reading", which is exactly how it would be
treated; and it splits a reader's place in the material across two sections. The roadmap is
already the spine, and the `LEARN`/`BUILD` mode contract already distinguishes "understand this"
from "write this".

**Decision:** the first roadmap section of an AI material is `concepts.md`, holding numbered
`LEARN` steps that come before tooling. They are real steps — tracked by
`src/lib/roadmapSteps.ts` like any other, with their own `ACC-NN`. Their deliverable is a
written document, which the existing `**Expected outcome:**` convention already permits.

What they cover, in order:

| Step | Covers |
|---|---|
| The problem | What the business loses today, in hours and money. The manual process being replaced. |
| How it works | The pipeline and its vocabulary. Where it fails and why. |
| The landscape | What you could buy instead, roughly what it costs, and when buying is right. |
| Scoping | Discovery questions, what to promise, what to refuse, how to price it. |

The "what you could buy instead" page is not optional. A reader who does not know the commercial
products exist will be asked "why not just buy it?" by their first client and will lose the
conversation.

**Consequence:** numbering shifts. Tooling and harness are no longer step 0. The concept steps
take 0–3, foundations start at 4. This is fine for new materials and is not being backported —
renumbering an existing material orphans saved progress (RFC 0002).

### 2. Cost monitoring and optimisation is a mandatory section

Not a paragraph, not a step folded into operations. Its own roadmap section, in every material
whose product calls a model at runtime.

Minimum content:

- **Where the spend is visible.** The provider console; the usage fields returned on every
  response; the token-counting endpoint for estimating before spending; a per-request ledger in
  the reader's own database, which is the only place cost can be attributed per customer.
- **Attribution.** Per customer, per stage, per route. An aggregate monthly figure tells you the
  bill and nothing about what to do next.
- **Third-party tooling, honestly.** What the open-source and hosted options do, what they cost
  to run, and the point at which one is worth adopting instead of a table you already have.
- **Lever order.** Free wins before anything that trades quality: caching, input hygiene, output
  caps, not retrieving what will not be used, batch. Then effort, then model choice, then a
  cascade. Cost per *completed task*, never per request.
- **A written decision.** The reader records what they changed, what it saved, and what quality
  measurement says it did not cost them.

The rule holds even where the AI spend is small. On several of these materials infrastructure
costs more than inference, and knowing that is itself the lesson — it is what stops a reader
optimising prompts to save $4 while paying $40 for a service they do not need.

### 3. A `brainstorm` skill

The six-point bar that produced these five, written down so the next five are held to it:

1. The problem is real and belongs to someone who is not a developer
2. Demand is evidenced from three independent kinds of source, each dated
3. The portfolio artefact is verifiable by a stranger — a measured number or a thing they can
   drive, never a UI screenshot
4. It survives a cost and go-live check done from the customer's side, with arithmetic
5. Three named examples that disagree
6. The material ships its own adversary — a hostile local environment to practise against

Point 4 is the one that was missing and would have shipped the 21 GiB dependency.

The skill also records what is **not** an objection, because good ideas were nearly rejected for
each of these: overlap with an existing material, a duplicated stack, being integration-heavy
rather than code-heavy, and being unglamorous.

---

## 🔨 Ship it as

`AGENTS.md` gains an **AI materials** block under *Content*. `.claude/skills/brainstorm/`
is added and listed in `.claude/skills/README.md` and the `AGENTS.md` skills table. The five
new materials are the first to follow both rules; `fastapi-support-assistant` predates them and
is left alone.

---

## ⚠️ Risks and what we accept

**Concept steps get skipped.** Some readers will jump to the build. That is acceptable — the
steps are numbered and tracked, so skipping them is visible in their own progress, and a reader
who already knows the domain *should* skip them.

**Sourced figures go stale.** Market sizes and rate cards move within months. Mitigation: every
figure in a material carries its source and the date it was checked, so a stale one is visible
rather than authoritative. The reference page shipped alongside these materials exists to be
re-checked rather than trusted forever.

**Shipped adversaries are maintenance.** A fake legacy portal and a document pack are code and
data that can rot. Accepted: the alternative is a material nobody can practise, and a broken
fixture fails loudly in a way a bad lesson does not.
