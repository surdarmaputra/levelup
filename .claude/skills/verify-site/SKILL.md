---
name: verify-site
description: "Run the LevelUp verify loop and diagnose its failures. Use before reporting work complete, before pushing, or when asked to check/verify/validate the site, fix a failing build, or debug broken links."
---

## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

## The loop

```bash
npm run verify
```

`astro check` → `astro build` → `node scripts/check-links.mjs`. Green = shippable.

Run it after every change. **Do not report work as complete without a green run.** Never
weaken a check to get green — if a rule looks wrong, raise it.

## Reading failures

| Symptom | Cause | Fix |
|---|---|---|
| `Entry <x> was not found` | `link:`/`slug:` in `astro.config.mjs` or `links` in `src/catalog.ts` points at a page that doesn't exist | Fix the slug, or add the page |
| `Could not find a content collection entry` | File missing frontmatter, or filename starts with `_` | Add `title`, rename the file |
| `Invalid frontmatter` | Schema violation — usually `sidebar.order` as a string | Match `docsSchema()` types |
| `broken internal link` + a resolved path | Wrong number of `../` | Count from the page **URL**, not the file path — see below |
| `missing base path` | An absolute `/foo/` link in content | Make it relative, or compute it from `import.meta.env.BASE_URL` in `.mdx` |
| `Incorrect integration order` | `mdx()` before `starlight()` | `starlight()` first |

### Counting `../`

Pages build to directories with trailing slashes, so the last URL segment is a directory.

| Page file | Served at | To reach `<slug>/reference/x` |
|---|---|---|
| `<slug>/index.md` | `/<slug>/` | `./reference/x/` |
| `<slug>/foo.md` | `/<slug>/foo/` | `../reference/x/` |
| `<slug>/setup/foo.md` | `/<slug>/setup/foo/` | `../../reference/x/` |

## Both deploy targets

The site ships to GitHub Pages under `/levelup/` and to a VPS under `/`. A change that only
works at one base is a bug. Check both:

```bash
npm run build && node scripts/check-links.mjs
BASE_PATH=/ npm run build && BASE_PATH=/ node scripts/check-links.mjs
```

## Before you say done

- [ ] `npm run verify` green
- [ ] Root-base build green
- [ ] New/changed pages render in `npm run dev` — sidebar, TOC, and the landing card
