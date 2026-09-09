---
name: brainstorm
description: "Generate and pressure-test ideas for new LevelUp learning materials. Use when asked to brainstorm, ideate, or propose materials/courses/roadmaps, to find what to build next, or to check whether a material idea is worth building — enforces evidence, a verifiable portfolio artefact, a cost and go-live reality check, and the three-disagreeing-examples rule before anything reaches add-material."
---

## Comm style

Terse. Fragments OK. No filler, no hedging, no pitch language.
Every number carries its source. An unsourced number is an opinion wearing a costume.

## What this skill is for

Deciding **what** to build. `add-material` builds it. Do not scaffold anything from here —
this ends with a ranked shortlist the author picks from.

## Boot sequence

1. `AGENTS.md` — conventions, the AI-material rules
2. `src/catalog.ts` — what already exists (overlap is allowed; ignorance of it is not)
3. `docs/rfcs/0003-ai-material-conventions.md` — where these constraints came from

## The bar

A material earns a slot when **all six** hold. Any one missing kills it, or sends it back to be
reshaped. Check them in this order — the cheap ones first.

### 1. The problem is real, and it belongs to someone who is not a developer

Name the business that has it and what it costs them **today**, in hours or money. "Developers
find X interesting" is not a problem statement. "Two people spend six hours a day re-typing
invoices" is.

Kill test: if the only person harmed by the problem is the person building the solution, stop.

### 2. Demand is evidenced, not asserted

Three independent kinds of evidence, minimum. One kind alone is a trend piece.

| Kind | Looks like |
|---|---|
| Employment | job-posting growth, fastest-growing-title rankings, salary premium |
| Freelance | rate cards, retainer ranges, category growth on the marketplaces |
| Industry | market size and CAGR, adoption and blocker studies, budget surveys |

Record the figure, the source URL, and the **date checked**. Numbers in this space go stale in
months, and a stale number quoted confidently is worse than no number.

### 3. The portfolio artefact is verifiable by a stranger

The output of the material must be something a reviewer can check **without trusting the
reader**. Rank the shapes:

| Shape | Example | Strength |
|---|---|---|
| A measured number | "94.2% field accuracy over 300 documents, 6% to human review" | Strongest — arithmetic, not a claim |
| A thing they can drive | a phone number they ring; an MCP server they install | Strong — they test it themselves |
| A running system | a workflow live at a real business, with a cost dashboard | Strong |
| A screenshot of a UI | — | **Rejected.** Every bootcamp has one. |

Ask: what does the reviewer *do* to check this? If the answer is "look at it", reshape the idea.

### 4. It survives the cost and go-live check — from the customer's side

This is the gate that kills the most ideas, and it is the one that is easiest to skip. Do it
before falling in love with a stack.

Work out, in real numbers:

- **Infra per month** at the smallest realistic customer. Count every service. A dependency
  that needs 8 GiB of RAM to run beside an app that needs 1 GiB is disqualifying unless the
  material is *about* that dependency.
- **AI spend per unit of work** — per document, per action, per call, per run. Show the
  arithmetic: tokens × rate. Then multiply by a plausible monthly volume.
- **The customer's sentence.** Write the line the reader will say to a client: *"$25 a month,
  and it replaces about thirty hours of typing."* If you cannot write that line, the economics
  do not work yet.
- **Friction to first live use.** How many accounts, credentials, phone numbers, public
  endpoints and approvals stand between a finished build and a customer using it? More friction
  is allowed; unacknowledged friction is not.

Then cut. For every component ask: *what breaks if this is a table in the Postgres we already
run?* Managed observability, brokers, workflow engines and object stores are usually the answer
to a problem the reader does not have yet. Teach the simple version, and put the upgrade in its
own step with the trigger that justifies it.

### 5. Three named examples that disagree

Per `AGENTS.md`. Not three skins of the same business — three that break different rules: the
simple case, the awkward constraint, the one that does not fit the obvious model. Write the
rule each one breaks. If you cannot, you have one example three times.

### 6. The material ships its own adversary

A reader has no client, no legacy system, no supplier invoices and no incoming phone calls.
Real-world practice is impossible against sample data that works. So the material must ship a
hostile environment the reader runs locally:

- a document pack that includes the skewed photo, the changed layout and the upside-down page
- a fake upstream that charges twice without an idempotency key and fails one call in twenty
- a legacy portal with a session timeout, an intermittent modal, and a scheduled "vendor
  update" in a later step that deliberately breaks what the reader built
- a scripted client who changes the requirement at step 12

Gold labels where accuracy is claimed, so the number in the portfolio is measurable rather than
asserted.

**Never** point a reader's automation at a third party's live site. If practice needs a target,
we ship the target.

## What is explicitly allowed

Authors reject good ideas for the wrong reasons. These are not objections:

- **Overlap with an existing material.** Two materials may teach idempotency. They teach it
  against different failures.
- **A duplicated stack.** Reusing Postgres, Docker and the same model across materials means a
  reader re-learns nothing about tooling and spends all their attention on the new problem.
- **Integration-heavy, light on code.** Most paid work is integration. A material that is
  mostly wiring, if the wiring is the hard part, is more honest than one that invents an
  algorithm to have something to write.
- **Unglamorous.** Nobody wants to automate a 2011 ERP. That is why it pays.

## What is disqualifying

- The artefact is a UI screenshot
- Demand evidence is one blog post
- The stack costs more to run than the problem costs to endure
- The examples are a category ("a booking system") rather than three named instances
- Practice requires a real client the reader does not have, and nothing is shipped to stand in
- It teaches a vendor's product rather than the problem underneath it

## Workflow

1. **Read the catalog.** Say what already exists and where the gap is.
2. **Research.** Pull the three kinds of evidence. Keep every URL and the date checked.
3. **Draft more candidates than needed** — six to eight for a shortlist of three.
4. **Run the six-point bar** over each. State plainly which point kills the ones that die.
5. **Do the cost check with real arithmetic** before recommending any stack. Expect to cut
   something you proposed an hour earlier; say so when you do.
6. **Rank, and say why.** A ranking with no losers is not a ranking.
7. **Hand over.** Per idea: slug (`<framework>-<use-case>`), title (`Framework — System`), the
   one-line problem, the three named examples with the rule each breaks, the trimmed stack with
   a reason per component, the portfolio artefact, the shipped adversary, and the monthly cost
   sentence. That is `add-material`'s input.

## Output shape

Per idea, in this order — no preamble, no summary paragraph:

```
### <slug> — <Title>

**What.**            two or three sentences, plain
**Named examples.**  table: instance → setup → the rule it breaks
**Why listed.**      the evidence, each figure with a source
**Stack.**           table: layer → choice → why this over the obvious alternative
**Cost.**            infra + AI spend + the customer's sentence
**Go live.**         the friction, named
**The artefact.**    what a stranger does to verify it
**The adversary.**   what ships so the reader can practise
```

End with the ranking and one line per idea on why it sits there.

## Recording the outcome

An accepted shortlist is a decision. Offer to record it — an RFC under `docs/rfcs/` for a new
category of material, an amendment otherwise. Ideas rejected at the cost check are worth
writing down too; they get proposed again in six months otherwise.
