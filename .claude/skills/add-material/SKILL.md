---
name: add-material
description: "Add a new learning material to the LevelUp catalog. Use when asked to add/scaffold a course, guide, roadmap, or learning material, or to restructure an existing one — creates the content directories, Getting Started page, catalog entry, sidebar wiring, and follows the house step/rubric structure."
---

## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

## Boot sequence

Read before touching anything:
1. `AGENTS.md` — conventions, non-negotiables
2. `src/catalog.ts` — the `Material` type + existing entries
3. The reference material, `src/content/docs/spring-boot-ticketing/` — the shape to copy:
   - `index.md` — the Getting Started page (structure below)
   - `roadmap/foundations.md` — a step file (step anatomy below)
   - `reference/rubrics.md` — the rubric page (below)
   - `setup/agent-harness.md` — a setup page (Goal / Why / How)

## What a material is

One directory under `src/content/docs/<slug>/`. Owns its whole URL subtree. Gets its own
sidebar (scoped by `src/routeData.ts`). One card on the landing page.

```
src/content/docs/<slug>/
├── index.md            required — the Getting Started page. sidebar.order: 0, label: Getting Started
├── setup/              one-time setup pages (harness, reviewer, environment)
├── roadmap/            the sequenced steps — one section file per phase, plus overview.md
└── reference/          lookup material — rubrics, templates, deliberate omissions
```

`setup` / `roadmap` / `reference` is the default split for a stepped material. A non-stepped
material (chapters, modules) keeps `index.md` + its own `<section>/` dirs; the step-specific
parts below then don't apply.

Do **not** create a separate `getting-started.md` — `index.md` *is* that page (folded together
2026-09-07, RFC 0001 amendment).

## The Getting Started page (`index.md`)

Big-picture *what / why / how*, in this order. The reader should finish it knowing what they'll
build, why this domain, and how to work a step.

| Section | Contents |
|---|---|
| Intro (no heading) | One paragraph: the path, the domain, step count, "sequence matters, pace doesn't" |
| `## Who this is for` | Assumed knowledge; what's **not** assumed; who should skip ahead or stop |
| `## Why <the domain>` | Why this domain forces the hard topics — a table: *reality of the domain → what it makes you learn* |
| `## What you'll learn` | A table grouped by area (language, framework, persistence, …) → concrete tech |
| `## How this material is structured` | The Setup / Roadmap / Reference parts: what each is, when you read it. Then the roadmap-section table (section → step range → focus) |
| `## The two paths` (if any) | Ordering variants through the steps |
| `## How to read a <step/chapter>` | The part-by-part table (Story, Mode, Why now, Concepts, Libraries, Expected outcome, Verification) + the verification layers + the per-step loop |
| `## How to use the rubrics` | What `ACC-NN` / `AP-NN-x` are; use it 3× per step; paste only one section to the reviewer |
| `## Start here` | Numbered 1–5 kickoff |

## Step anatomy (roadmap section files)

Each step is one `## ` heading, same parts every time, so the reader can skim to the one they
need. Order:

````markdown
## Step N — Short title

**Story:** *As a <role>, I <goal>, so that <reason>.*   (user-story format, the demoable goal)

**Mode:** `LEARN` or `BUILD` — one line on why. (LEARN = agent tutors only; BUILD = agent may generate.)

**Why now:** What this step depends on, why it isn't earlier or later.

**Concepts:**
- the things being learned — the real payload; code is the vehicle

**Libraries:** what to add, occasionally why over the obvious alternative

**Expected outcome:** what you should have when the step is done — the pieces to build.
Where "where does this code go" is a real open question, add a **high-level** structure
sketch (show the shape, let the reader fill it in):

```text
module/
├── domain/      plain — no framework imports
├── application/ use-case services
└── adapter/     controllers, repositories, external adapters
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-NN` — one objective pass/fail test |
| **L2 — Manual checks** | (a) … then (b) … — what a test can't catch |
| **L4 — Anti-patterns** | `AP-NN-a`, `AP-NN-b` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-NN` green, + one-line completion bar |

**Harness impact:** (only when the step changes `AGENTS.md`) what to add
````

Rules:
- Heading is `## Step N — Title`. `N` is the number, parseable; a sub-step is `5b` (letter
  suffix only). The per-step progress tracker derives its unit list from these headings — see
  Progress tracking below.
- `**Expected outcome:**`, never `**Build:**` (renamed 2026-09-07). Steps that only produce a
  document use `**Expected outcome:**` for the deliverable too.
- The Verification table is L1 / L2 / L4 / **Done when** only. L3 (AI review) and L5 (CI
  guardrails) are global, described once in `index.md` and the roadmap overview.
- Separate steps with `---`.

## The rubric page (`reference/rubrics.md`)

One `## Step N — …` section per step. Each holds:
- **`ACC-NN`** — the gating acceptance test in full: objective, unambiguous pass/fail.
- **`AP-NN-x`** table — named anti-patterns: mistakes that pass the test but are still wrong.

Intro says plainly: this is the full text of the IDs each step's Verification block only names;
a lookup you read one section of per step, not a checklist; the reviewer gets **one** section,
never the whole file.

## Setup pages

Three fixed headings: `## The goal, and the end state` (what's configured + the concrete files
/ end state, with a tree where it's project files) · `## Why` · `## How` (numbered steps).

## Writing style

- Plain, common English. Assume a competent non-native reader. Short sentences over clever ones.
- No AI-slop idioms or figures of speech ("the whole game", "long dead", "cargo cult", "under
  the hood", "battle-tested"). Say the plain thing.
- Keep it terse — don't pad with "In this step we will…". Fragments are fine.
- Split run-on sentences that stack two or more em-dash asides.
- Content is the author's voice. Fix links, frontmatter, structure. **Don't rewrite prose**
  unless asked; when asked, keep the register and every technical claim.
- Don't invent code, APIs, or library names. Check `node_modules/@astrojs/starlight/` before
  claiming a Starlight option exists.

## Workflow

### 1. Settle the shape (ask, don't guess)

One question at a time, recommended answer with each.
- Slug — **`<framework>-<use-case>`**, kebab-case, becomes the URL segment: `laravel-booking-saas`, `spring-boot-ticketing`. Framework, not language.
- Title — **`Framework — System`**: *Laravel — Multi-Tenant Booking SaaS*. Then the one-line description, level, size ("26 steps", "9 chapters")
- Stepped roadmap or chapter-style? Section list in reading order.

If source markdown already exists, derive answers from it and confirm.

### 2. Place the content

- One `.md` per page. Frontmatter: `title`, `description`, `sidebar.order` (1..n **within its
  directory**, not globally). `index.md` → `sidebar.order: 0`, `label: Getting Started`.
- No `<h1>` in the body — Starlight renders it from `title`.
- One `##` per step / chapter so the right-hand TOC is a real table of contents.
- Internal links **relative**, never absolute. Count `../` from the page's **URL**, not its
  file path: `<slug>/setup/foo.md` serves at `/<slug>/setup/foo/`, so a sibling section is
  `../../reference/bar/`. `scripts/check-links.mjs` fails the build on a wrong one.
- Follow the step / rubric / setup structures above.

### 3. Register it

Append to `materials` in `src/catalog.ts`. Every field required:

```ts
{
  slug, title, description, tagline, level, size, tags, status,
  entry: '<slug>',                                   // catalog card → the Getting Started page
  links: [{ label: 'Getting Started', slug: '<slug>' }],
  sections: [
    { label: 'Setup', directory: 'setup' },
    { label: 'Roadmap', directory: 'roadmap' },
    { label: 'Reference', directory: 'reference' },
  ],
}
```

`status: 'planned'` → dimmed, unlinked card, stays out of the sidebar. `astro.config.mjs`
builds the sidebar from `sections`; `src/routeData.ts` scopes it. Nothing else to edit.

### 4. Verify

```bash
npm run verify
```

Green before "done". Then eyeball `npm run dev`:
- Card on `/` — status, level, tags, working CTA → lands on the Getting Started page
- Sidebar on a material page shows **only** that material
- Right-hand TOC populated on a step page, one entry per `## Step`
- On a `roadmap/` step page: a mark-as-learned / note control under every `## Step` heading and
  at its end; a `✓` on completed steps in the on-this-page list
- Progress FAB count denominator = setup pages + roadmap steps

## Progress tracking

Per-step, client-side, localStorage. `src/lib/roadmapSteps.ts` builds the tracked-unit list at
build time by parsing `## Step N — …` headings out of every file under `<slug>/roadmap/`, plus
each `<slug>/setup/` page. Consequences for a new material:
- Stepped content must live under `roadmap/` and use `## Step N — Title` headings, or the
  tracker won't see the steps.
- `roadmap/overview.md` is not a step (no `## Step` headings) — it stays lookup-only.
- `reference/` is never tracked.
- Changing a heading's wording is safe (the id is `roadmap/<section>/step-<N>`, keyed on the
  number). Renumbering a step orphans that step's saved progress — avoid it.

## Edge cases

| Case | Do this |
|---|---|
| Section with one page | Still give it a directory — a bare page at material root has no sidebar group |
| Page that shouldn't appear in the sidebar | `sidebar: { hidden: true }` in its frontmatter |
| Chapter-style material (no steps) | `index.md` + `<section>/` dirs; skip the step/rubric/tracker parts; `## Chapter N` headings still one-per-unit |
| Renaming a slug | Grep the whole repo — `catalog.ts`, cross-material links, RFCs under `docs/`. Then add the old→new pair to **both** `renamedMaterials` in `astro.config.mjs` (redirects the old URLs) and `RENAMED_MATERIALS` in `src/lib/progress.ts` (keeps saved progress). Entries stay forever. |
| Source docs written for GitHub | Strip the leading `<h1>`, add frontmatter, rewrite links to relative |
| Recording the decision | Structural change → new RFC or amend `docs/rfcs/0001`; see AGENTS.md "Decisions" |
