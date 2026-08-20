# Skills

Two kinds of skill live here.

## Vendored from `surdarmaputra/agent-skills`

Copied from [`surdarmaputra/agent-skills`](https://github.com/surdarmaputra/agent-skills) at
commit `2b3eaea` so the repo works offline and every contributor gets the same behaviour.

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

### Local patch: `prd-to-rfc`

One skill is **not** byte-identical to upstream. `prd-to-rfc` arrived carrying the org it was
written in, and those details are wrong here and would leak into any RFC generated from it:

| File | Removed | Now |
|---|---|---|
| `references/rfc-template.md` | "Move this document to Lending Engineering → MGR Pinjam → RFC folder" | line deleted |
| `references/rfc-template.md` | Reviewers pre-filled with that org's teams | left blank |
| `references/rfc-template.md` | "RFC Jira Link" | "Issue/ticket link" |
| `references/humanizer-rules.md` | "banned-word list for cash-loans RFCs" | "banned-word list for RFC writing" |
| `SKILL.md` | that org's Lark hostname in the URL examples | `<your-org>.larksuite.com` |

`--update` overwrites the whole skill, so it will bring the org-specific lines back. Either
re-apply this patch after updating, or land the change upstream and drop this note. The
`grep` in `scripts/verify-project.sh` fails the build if any of it reappears.

## Project-local

Written for this repo, maintained here.

| Skill | What it does |
|---|---|
| `add-material` | Scaffold a new learning material: content directories, index page, catalog entry, sidebar wiring |
| `verify-site` | Run the verify loop and interpret its failures |
