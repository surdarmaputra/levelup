# LevelUp

A catalog of guided, production-minded learning materials for software engineers, published as
a static site built with [Astro Starlight](https://starlight.astro.build).

Each material is a sequenced roadmap around one real domain — every step states why it comes
where it does, what you should be able to explain afterwards, and how to verify you got it.

**Live:** https://surdarmaputra.github.io/levelup/

## Materials

| Material | Level | Size | Status |
|---|---|---|---|
| [Java with Spring Boot](src/content/docs/java-spring-boot/) — production roadmap around an event ticketing marketplace | Intermediate | 26 steps | Available |

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321/levelup/
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run check` | Types + content-schema check |
| `npm run verify` | check → build → link check → skill content check. **The one that gates a push.** |

## Structure

```
src/
├── catalog.ts                  material metadata — drives the landing page and the sidebar
├── routeData.ts                scopes the sidebar to the material being read
├── components/                 .astro components used by content pages
├── styles/custom.css           theme overrides
└── content/docs/
    ├── index.mdx               landing page — the catalog
    └── java-spring-boot/       one directory per learning material
        ├── index.md            material overview
        ├── getting-started.md
        ├── setup/              agent harness, reviewer prompt
        ├── roadmap/            steps 0–24, split into five sections
        └── reference/          rubrics, AGENTS.md template, omissions

docs/rfcs/                      design decisions
scripts/                        bootstrap, verify, link check
.claude/skills/                 agent skills
```

### Adding a material

1. Create `src/content/docs/<slug>/` with an `index.md` and one directory per sidebar section.
2. Append an entry to `materials` in `src/catalog.ts`.
3. `npm run verify`.

The sidebar, the landing-page card, search, and the per-material navigation all follow from
those two steps. The `add-material` skill in `.claude/skills/` walks an agent through it.

## Deployment

The site builds to plain static files, so any host that serves a directory works. Two knobs:

| Variable | Default | Meaning |
|---|---|---|
| `SITE_URL` | `https://surdarmaputra.github.io` | Origin, used for canonical URLs and the sitemap |
| `BASE_PATH` | `/levelup` | Subdirectory the site is served from |

### GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. Enable it once
under **Settings → Pages → Source → GitHub Actions**. The workflow derives `SITE_URL` and
`BASE_PATH` from the repository, so a rename needs no config change.

### VPS

Build at the root base path and copy `dist/` to the web root:

```bash
SITE_URL=https://learn.example.com BASE_PATH=/ npm run build
rsync -av --delete dist/ user@host:/var/www/levelup/
```

Any static server works. With nginx, point `root` at that directory and add
`try_files $uri $uri/ /404.html;`.

## Contributing

`npm run verify` must be green before pushing — Lefthook runs it as a `pre-push` hook, installed
by `scripts/bootstrap.sh`.

Conventions for both humans and agents are in [`AGENTS.md`](AGENTS.md).

## License

Site code: MIT. Learning content: © its authors, all rights reserved unless stated otherwise
in the material.
