# Skills

Two kinds of skill live here.

## Vendored from `surdarmaputra/agent-skills`

Copied verbatim from [`surdarmaputra/agent-skills`](https://github.com/surdarmaputra/agent-skills)
at commit `2b3eaea` so the repo works offline and every contributor gets the same behaviour.
**Don't edit these in place** — fix them upstream, then re-run the installer:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/surdarmaputra/agent-skills/main/scripts/install-remote.sh) \
  --project --update
```

| Skill | What it does |
|---|---|
| `code-review-enhanced` | Evidence-led review with CRITICAL/LOGIC/HARNESS/FE/NITPICK labels and a 5-dimension score |
| `conventional-commit` | Conventional-commit formatting, keeps PR title and description in sync after a push |
| `grill-me` | One-question-at-a-time interrogation of a plan before any code is written |
| `prd-to-rfc` | Turns a PRD (or a settled discussion) into a structured RFC under `docs/rfcs/` |
| `skill-creator-compact` | Create and iterate on skills |

Two notes on `prd-to-rfc`: its `references/rfc-template.md` opens with a "move this to the
Lending Engineering folder" line and `references/humanizer-rules.md` calls itself
"cash-loans" — both are upstream artefacts of where the skill was written. Ignore them; the
section structure and the banned-word list are what matter here.

## Project-local

Written for this repo, maintained here.

| Skill | What it does |
|---|---|
| `add-material` | Scaffold a new learning material: content directories, index page, catalog entry, sidebar wiring |
| `verify-site` | Run the verify loop and interpret its failures |
