# AGENTS.md — LevelUp

## Project

LevelUp is a static site that publishes **guided learning materials** for software engineers.
One material per directory, each a sequenced roadmap rather than a reference dump.

Astro + Starlight, no server, no database, no runtime. Output is HTML in `dist/`, served from
GitHub Pages today and a VPS later.

The content is the product. The code exists to render it, stay out of its way, and make adding
the next material cheap.

Current release: **v0.3** — twelve materials. Six of them are the AI and automation set
(`fastapi-support-assistant`, `fastapi-document-intake`, `mcp-operations-agent`,
`n8n-ai-operations`, `playwright-legacy-rpa`, `livekit-voice-intake`), which carry two extra
conventions — see *AI materials* below.

---

## The loop

`npm run verify` is the single source of truth. It runs `astro check` → production build →
internal link check → org-specific-content check on the vendored skills.

**Run it after every change. Do not report work as complete without a green run.**

```
npm run verify    # everything. the one you care about.
npm run dev       # local dev server, hot reload
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
npm run check     # types + content schema only, faster
```

If it fails, fix it. Never disable a check to make it pass — if a rule looks wrong, raise it,
don't route around it. A gate that gets bypassed once gets bypassed always.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 7 (static output) |
| Docs theme | Starlight 0.41 |
| Content | Markdown + MDX in `src/content/docs/` |
| Search | Pagefind (bundled with Starlight, build-time) |
| Styling | Starlight CSS custom properties + one override file |
| Hosting | GitHub Pages via Actions; any static host for VPS |
| Hooks | Lefthook — `pre-push` runs `scripts/verify-project.sh` |

**Never add:** a UI framework (React/Vue/Svelte) — no page here needs client state; a CSS
framework — Starlight's tokens cover it; a CMS; SSR or any adapter — the site must stay
statically deployable; an analytics or font CDN without discussing the privacy and CSP cost.

---

## Layout

```
src/
├── catalog.ts                  material metadata — single source of truth
├── content.config.ts           Starlight docs collection
├── routeData.ts                scopes the sidebar to the current material
├── components/                 .astro components used by content pages
├── styles/custom.css           theme overrides, keep small
└── content/docs/
    ├── index.mdx               landing page — catalog listing
    ├── 404.mdx
    └── <material-slug>/        one directory per learning material
        ├── index.md            the Getting Started page (what / why / how / structure)
        └── <section>/          one dir per sidebar group; stepped material = setup/ roadmap/ reference/

scripts/                        bootstrap, verify, link check
docs/rfcs/                      design decisions, newest wins
.claude/skills/                 agent skills (see .claude/skills/README.md)
```

---

## Non-negotiable conventions

**Catalog**
- `src/catalog.ts` is the only place material metadata lives. The sidebar and the landing page
  both read from it. **Never** hardcode a material into `astro.config.mjs` or a component.
- Adding a material means: content directory + one `materials` entry. Nothing else.
- **Slug is `<framework>-<use-case>`**, kebab-case: `laravel-booking-saas`,
  `spring-boot-ticketing`. The framework, not the language — nobody searches "php laravel
  booking". Title is `Framework — System`: *Laravel — Multi-Tenant Booking SaaS*.
- Renaming a slug breaks shared links and orphans saved progress. Both are handled in one
  place each, and both must be updated together: `renamedMaterials` in `astro.config.mjs`
  (emits a redirect from every old page URL) and `RENAMED_MATERIALS` in `src/lib/progress.ts`
  (moves saved progress onto the new slug). Entries stay forever.

**Content**
- **Every material names its examples.** A domain category — "a booking system", "a ticketing
  system" — is not a domain. Name **three concrete instances** of it and run them through the
  whole material: *Northside Barbershop / Bright Smile Dental / Loft Yoga*, *Hamlet at the Lyric
  Theatre / Riverside Arena / The Foundry*. Rules:
  - Pick them so they **disagree** on the axes the material teaches. Each one exists to break a
    rule the others don't: one is the simple case, one carries the awkward constraint, one
    doesn't fit the obvious model at all. Write down, per example, which rule that is.
  - They live in four places: a `## What you are building, concretely` section on `index.md`
    (a table: the instance → its setup → what it forces you to handle), a
    `## The three example <things>` section in `roadmap/overview.md`, the stories, expected
    outcomes and gating tests of the steps, and the material's `AGENTS.md` template.
  - **Seed them in the first step that creates data**, and keep them for the rest of the
    roadmap. A reader must be able to run the thing, not just read about it.
  - State the rule that they are never special-cased in code. `if ($tenant->slug === …)` means
    the model is wrong, not the example.
  - Also list the wider real-world set (*driving schools, physiotherapists, vets…* /
    *cinema, conferences, museum timed entry…*) so a reader can point their own build at one.
- Frontmatter `title` and `description` on every page. `description` is what search and
  social cards show.
- **No `<h1>` in the body** — Starlight renders it from `title`.
- `sidebar.order` is scoped to the page's directory, starting at 1. The material's `index.md`
  is `sidebar.order: 0`, `label: Getting Started` — it *is* the Getting Started page (what /
  why / structure / how to read a step / start here); there is no separate `getting-started.md`.
- One `##` per top-level unit (step, chapter) so the right-hand TOC is a real table of contents.
  A roadmap step heading is `## Step N — Title` (`N` parseable; a sub-step is `5b`). The per-step
  progress tracker builds its unit list from these headings under `roadmap/` — see
  `src/lib/roadmapSteps.ts` and RFC 0002 amendment A2.
- Step anatomy, in order: **Story** (user-story format) · **Mode** (`LEARN`/`BUILD`) ·
  **Why now** · **Concepts** · **Libraries** · **Expected outcome** (the pieces to build; add a
  *high-level* structure sketch where "where does this go" is open — never `**Build:**`) ·
  **Verification** (L1/L2/L4/Done-when table) · optional **Harness impact**. Rubrics live in
  `reference/rubrics.md` as `ACC-NN` + `AP-NN-x`, one section per step, a lookup not a checklist.
  Setup pages use `## The goal, and the end state` / `## Why` / `## How`.
- Prose is plain, common English for a non-native reader — short sentences, no AI-slop idioms
  ("the whole game", "cargo cult", "under the hood"). Terse is fine; fragments are fine.
- Content is the author's voice. Fix broken links, frontmatter, and structure — **do not
  rewrite prose** unless asked; when asked, keep the register and every technical claim.
- Use the `add-material` skill for a new material or a structural restructure.

**AI materials** — anything whose product calls a model at runtime. Two extra rules, both
non-negotiable, both recorded in [RFC 0003](docs/rfcs/0003-ai-material-conventions.md).

- **Theory lives inside the roadmap, and it comes first.** A reader who can build the thing but
  cannot say what it costs a business, what it replaces, or when it is the wrong answer, has
  half a skill. So the first roadmap section is `concepts.md`: numbered `LEARN` steps covering
  the problem in business terms, how the technique works, what you could buy instead, when
  *not* to build it, and how to scope it with a client. They are real steps — numbered,
  tracked, with their own `ACC-NN` — and their deliverable is a written document, not code.
  There is **no separate `concepts/` sidebar section**: a reader who can skip the theory does.
- **Every AI material has a cost monitoring and optimisation section.** Not a paragraph in an
  operations step — its own roadmap section, with at minimum: where the spend is visible
  (provider console, the usage fields on each response, your own per-request ledger), how to
  attribute it per customer and per stage, the order the levers are pulled in (free wins before
  anything that trades quality), and a decision the reader has to write down and defend. A
  material that teaches someone to build a thing whose bill they cannot explain is not finished.

**Links**
- Internal links in Markdown are **relative**, never absolute. The site is served from `/` on a
  VPS and `/levelup/` on GitHub Pages; an absolute link works on exactly one of them.
- Count `../` from the page's **URL**, not its file path. `<slug>/setup/foo.md` is served at
  `/<slug>/setup/foo/`, so a sibling section is `../../reference/bar/`.
- When a link must be absolute (the 404 page), build it from `import.meta.env.BASE_URL` in an
  `.mdx` or `.astro` file.
- `scripts/check-links.mjs` enforces both rules. It runs in `verify` and in CI.

**Deployment**
- Both base paths must build. `BASE_PATH` and `SITE_URL` are the only knobs; never hardcode a
  domain or a subdirectory anywhere else.
- Output stays static. No adapter, no server-rendered route, no runtime env var.

**Components**
- `.astro` only, scoped `<style>` blocks, Starlight CSS custom properties for colour and
  spacing. No hardcoded hex, no global CSS outside `src/styles/custom.css`.
- A component that exists to render catalog data reads it from `src/catalog.ts`.

---

## Working style

- **Small changes.** One concern per change. Large diffs can't be reviewed properly.
- **Explain before generating.** State the approach; get agreement; then write.
- **Say when you're unsure.** A flagged uncertainty is useful. A confident wrong answer costs hours.
- **Don't invent APIs.** Starlight's config surface changes between minor versions — check
  `node_modules/@astrojs/starlight/` before claiming an option exists.
- **No scope creep.** Don't add i18n, versioning, or a blog because the framework supports it.
- **Never bypass a quality gate.** No `--no-verify`, no skipped link check.

---

## Decisions

Design decisions live in `docs/rfcs/`, numbered and newest-wins. Read them before proposing
anything structural — the sidebar scoping, the base-path handling, and the catalog module were
each chosen against a plausible alternative.

When a decision is made in conversation, offer to record it — a new RFC for a structural
change, an amendment to the existing one otherwise. Undocumented decisions get silently
reversed three PRs later.

---

## Skills

Agent skills live in `.claude/skills/`. See [`.claude/skills/README.md`](.claude/skills/README.md)
for what each one does and which are vendored from
[`surdarmaputra/agent-skills`](https://github.com/surdarmaputra/agent-skills). `prd-to-rfc`
carries a local patch removing the organisation it was written in; `verify` fails if an
upstream update reverts it.

Reach for them rather than improvising:

| Task | Skill |
|---|---|
| Deciding *what* material to build next | `brainstorm` |
| Adding or restructuring a learning material | `add-material` |
| Checking the site before saying done | `verify-site` |
| Reviewing a diff | `code-review-enhanced` |
| Writing a commit or syncing a PR | `conventional-commit` |
| Stress-testing a plan before building | `grill-me` |
| Turning a settled plan into a design doc | `prd-to-rfc` |
