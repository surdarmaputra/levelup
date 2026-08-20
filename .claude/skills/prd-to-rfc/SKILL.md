---
name: prd-to-rfc
description: "Automate PRD-to-RFC workflow. Use when asked to create an RFC from a PRD, convert PRD to technical spec, or phrases like 'prd to rfc', 'create rfc', 'rfc from prd'. Pipeline: gather PRD → explore codebase → grill open decisions → draft RFC (template) → humanize → output (markdown or Lark doc)."
allowed-tools: >
  Read, Write, Edit, Grep, Glob,
  mcp__lark-mcp__docx_v1_document_rawContent,
  mcp__lark-mcp__docx_builtin_import,
  mcp__lark-mcp__docx_builtin_search,
  mcp__lark-mcp__wiki_v2_space_getNode,
  mcp__lark-mcp__wiki_v1_node_search
---

# PRD → RFC Automation

Full pipeline: gather PRD → explore codebase → grill → draft RFC → humanize → output.

## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

MCP only — no browser fallback. Lark MCP call fails or not enabled → tell user, stop.

## Interaction Principles

Apply at every step, not just grilling:

- **Ask freely** — ambiguous/missing/RFC-changing → ask user, any step. Never silently guess.
- **One question at a time**, w/ recommended answer → user confirms/corrects in one word.
- **Announce each step** on entry, one-line result before moving on.
- **Confirm before irreversible/external actions** — publishing to Lark, writing files. State what'll happen, wait for yes.
- **MCP precheck (required)** — before first Lark MCP call, confirm server enabled. No blind calls.
- **Offer sensible defaults** — don't stall on optional metadata; propose default, say it's a default, let user override.

## Workflow

```
PRD source (file / Lark URL / chat context)
  ↓
1. Gather PRD context
  ↓
2. Explore codebase — Explore agent + Grep/Read/Glob
  ↓
3. Grill — settle open decisions (one Q at a time, recommended answers)
  ↓
4. Draft RFC — strict template (references/rfc-template.md), folding in grilling answers
  ↓
5. Humanize — banned-word sweep (references/humanizer-rules.md)
  ↓
6. Output — .md file OR Lark doc
```

---

## Step 1 — Gather PRD context

Ask user for PRD source. Accept, in this priority:
- **Local file path** — `.md`, `.pdf`, `.docx`
- **Lark URL** — read via Lark MCP
- **Chat context** — PRD already discussed/pasted earlier in the conversation, use as-is

### Lark URL path

**MCP precheck (ask first):**
> Before I read the PRD, is the **Lark MCP server enabled** in your client?

Only proceed once confirmed. If it can't be enabled, ask the user to paste the content instead.

Extract the document token from the URL:
- `https://gotocompany.sg.larksuite.com/docx/<TOKEN>` → token is `<TOKEN>`
- `https://gotocompany.sg.larksuite.com/wiki/<TOKEN>` → use wiki node tools instead

```
mcp__lark-mcp__docx_v1_document_rawContent
  path.document_id = <TOKEN>
  useUAT = true
```

For Lark meeting minutes (`/minutes/<id>`): same call — extra PRD walkthrough context.

Save PRD content for reference throughout the session.

---

## Step 2 — Explore codebase

Before drafting, map the affected code. Spawn the `Explore` agent (or the coding agent's default
exploration agent) on the lowest-cost model available (e.g. Haiku) for broad search; use direct
Grep/Read/Glob for targeted lookup.

Search for:
- Components, hooks, services mentioned in the PRD
- Existing API endpoints and data models
- Related tests and fixtures

Focus on:
- Files that **will be modified** — list them explicitly in the RFC
- Existing patterns to follow — check `AGENTS.md` and the docs it points to
  (`docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`) for the canonical rules to follow; don't
  reinvent conventions already documented there
- Feature flags and gates already in place

Output: a list of affected files + gaps between current state and PRD requirements.

---

## Step 3 — Grill the requirements (alignment gate)

Before drafting, interview the user to resolve every ambiguous decision the PRD leaves open. This
stops the RFC from silently guessing scope, trade-offs, or edge cases. The settled answers become
the input context that sharpens Step 4.

Invoke the `grill-me` skill for the interview mechanics (one question at a time, recommended
answer, walk the decision tree top-down). Below is what's specific to an RFC grill:

- **If a question can be answered from the codebase**, answer it yourself — don't ask the user.
  Grilling is for genuine product/scope/design gaps only.
- Stop when the open decisions for **Requirements**, **Out of scope**, and **Solution**
  (Approach #1 vs #2) are all resolved. Don't grill past the point of diminishing returns.

**When to skip:** if the PRD is already unambiguous and the codebase context fills the rest, skip
grilling and tell the user why. Don't force a long interview on a trivial change.

**What to probe** (only what the PRD/codebase leave open):
- Requirement edge cases, acceptance criteria, and which segments are in scope
- The Approach #1 vs #2 trade-off — confirm the preferred approach and the rejected one's reason
- Out-of-scope boundaries and explicit non-goals
- Feature flags / rollout gating, backward-compat, and data/contract changes
- Milestone/story granularity for the task breakdown

**Output:** a settled decision list (decision → chosen answer → source: user vs codebase). Carry
it verbatim into Step 4.

---

## Step 4 — Draft RFC

Follow `references/rfc-template.md`. All sections are mandatory unless marked Optional. If RFC
metadata (Authors, Reviewers, Approvers, Pod, Stream, Closing Date) isn't in the PRD, ask once with
sensible defaults.

**Mandatory sections:**
1. Title: `RFC: <Short description>`
2. Metadata table
3. Glossary
4. Background
5. Requirements
6. Out of scope
7. Solution (Approach #1 preferred + Approach #2 rejected with trade-offs)
8. User Stories (Milestones → Stories → Tasks)
9. Rollout Plan (Optional)
10. Open questions
11. RFC review meeting notes (left empty in draft)

**Writing rules:**
- Fold the Step 3 grilling decisions into Requirements, Out of scope, and Solution — every
  settled answer should be reflected, not re-guessed
- Codebase-specific: include real file paths, component names, hook names
- Images: use `[IMAGE: filename.png — description]` placeholder, user adds manually
- Mermaid for block/sequence diagrams
- Task breakdown must be granular enough to hand off to an engineer/agent directly

See `references/examples.md` for the canonical heading tree (with emojis) if the shape is unclear —
it's a structural skeleton, not a real RFC; don't invent facts to fill it.

---

## Step 5 — Humanize writing

Sweep the draft against `references/humanizer-rules.md` (banned-word list, e.g. leverage → use)
and fix every hit.

---

## Step 6 — Output

Ask user:
> **Where should the RFC be saved?**
> 1. **Markdown file** — `docs/rfcs/<short-name>.md` in the workspace
> 2. **Lark doc** — publish via Lark MCP

### Option 1 — Markdown file

Save to `docs/rfcs/` using the Write tool. Filename: kebab-case of RFC title.

### Option 2 — Lark

Use `mcp__lark-mcp__docx_builtin_import` to create a new Lark doc with the RFC content. If it
requires a parent folder token, ask the user for the Lark folder URL and extract the token.

---

## Error Handling

| Error | Action |
|-------|--------|
| Lark MCP auth error | Re-run OAuth: `mcp__lark-mcp__authenticate` → open URL in browser → `complete_authentication` |
| Lark MCP not enabled | Ask the user to enable it in their client (the precheck should catch this first); if they can't, fall back to pasted text |
| MCP tool not in session | Verify the Lark MCP server is running |

---

## Maintainability Guide

| File | Purpose | Update when |
|------|---------|-------------|
| `SKILL.md` | Main skill workflow (this file) | New MCP tools, workflow steps change |
| `references/rfc-template.md` | RFC section structure | Team's RFC template is updated |
| `references/humanizer-rules.md` | Writing style word list | Team writing conventions evolve |
| `references/examples.md` | Canonical heading-tree skeleton | `rfc-template.md` section structure changes |

**Adding a new Lark MCP tool:** add to `allowed-tools` in the frontmatter, then document its use
in the relevant step.
