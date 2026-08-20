# AGENTS.md — LevelUp

## Project

LevelUp is a static site that publishes **guided learning materials** for software engineers.
One material per directory, each a sequenced roadmap rather than a reference dump.

Astro + Starlight, no server, no database, no runtime. Output is HTML in `dist/`, served from
GitHub Pages today and a VPS later.

The content is the product. The code exists to render it, stay out of its way, and make adding
the next material cheap.

Current release: **v0.1** — one material, `java-spring-boot`.

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
        ├── index.md            material overview
        └── <section>/          one directory per sidebar group

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

**Content**
- Frontmatter `title` and `description` on every page. `description` is what search and
  social cards show.
- **No `<h1>` in the body** — Starlight renders it from `title`.
- `sidebar.order` is scoped to the page's directory, starting at 1.
- One `##` per top-level unit (step, chapter) so the right-hand TOC is a real table of contents.
- Content is the author's voice. Fix broken links, frontmatter, and structure — **do not
  rewrite prose** unless asked.

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
| Adding or restructuring a learning material | `add-material` |
| Checking the site before saying done | `verify-site` |
| Reviewing a diff | `code-review-enhanced` |
| Writing a commit or syncing a PR | `conventional-commit` |
| Stress-testing a plan before building | `grill-me` |
| Turning a settled plan into a design doc | `prd-to-rfc` |
