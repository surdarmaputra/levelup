---
name: add-material
description: "Add a new learning material to the LevelUp catalog. Use when asked to add/scaffold a course, guide, roadmap, or learning material, or to restructure an existing one — creates the content directories, index page, catalog entry, and sidebar wiring."
---

## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

## Boot sequence

Read before touching anything:
1. `AGENTS.md` — conventions, non-negotiables
2. `src/catalog.ts` — the material type + existing entries
3. `src/content/docs/java-spring-boot/` — the reference material's shape

## What a material is

One directory under `src/content/docs/<slug>/`. Owns its whole URL subtree. Gets its own
sidebar (scoped by `src/routeData.ts`). Appears as one card on the landing page.

```
src/content/docs/<slug>/
├── index.md            required — overview + link tables. sidebar.order: 0, label: Overview
├── getting-started.md  optional — "what this is, how to read it"
└── <section>/          one dir per sidebar group
    └── <page>.md
```

## Workflow

### 1. Settle the shape (ask, don't guess)

One question at a time. Recommended answer with each.
- Slug (kebab-case, becomes the URL segment)
- Title, one-line description, level, size ("26 steps", "9 chapters")
- Section list, in reading order

If source markdown already exists, derive answers from it and confirm rather than interrogate.

### 2. Place the content

- One `.md` per page. Frontmatter: `title`, `description`, `sidebar.order` (1..n **within its
  directory**, not globally).
- No `<h1>` in the body — Starlight renders it from `title`.
- One `##` per top-level unit (step/chapter) so the right-hand TOC is useful.
- Internal links must be **relative**, never absolute — the site is served from `/` on a VPS
  and `/levelup/` on GitHub Pages. Count `../` from the page's URL, not its file path: a page
  at `<slug>/setup/foo.md` is served at `/<slug>/setup/foo/`, so a sibling section is
  `../../reference/bar/`. Get this wrong and `scripts/check-links.mjs` fails the build.

### 3. Register it

Append to `materials` in `src/catalog.ts`. Every field is required:

```ts
{
  slug, title, description, tagline, level, size, tags, status,
  entry: '<slug>/getting-started',        // where the catalog card points
  links: [{ label: 'Overview', slug: '<slug>' }, ...],
  sections: [{ label: 'Setup', directory: 'setup' }, ...],
}
```

`status: 'planned'` renders a dimmed, unlinked card and stays out of the sidebar — use it to
announce a material before its content exists.

Nothing else needs editing. `astro.config.mjs` builds the sidebar from `sections`, and
`src/routeData.ts` scopes it to the material being read.

### 4. Verify

```bash
npm run verify
```

Must be green before you report done. Then eyeball `npm run dev`:
- Card on `/` — status, level, tags, working CTA
- Sidebar on a material page shows **only** that material
- Right-hand TOC populated on a step page

## Edge cases

| Case | Do this |
|---|---|
| Section with one page | Still give it a directory — a bare page at material root has no sidebar group |
| Page that shouldn't appear in the sidebar | `sidebar: { hidden: true }` in its frontmatter |
| Material with no sections | `sections: []`, list every page in `links` |
| Renaming a slug | Grep the whole repo — `catalog.ts`, cross-material links, RFCs under `docs/` |
| Source docs written for GitHub | Strip the leading `<h1>`, add frontmatter, rewrite links to relative |
