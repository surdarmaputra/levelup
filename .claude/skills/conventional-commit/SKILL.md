---
name: conventional-commit
description: "Use when committing, pushing to a PR, or asked to write a commit message — formats commits as conventional commits (type(scope): desc), then updates the open PR title and description to reflect all branch changes."
---

## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

## Triggers

Activate when the user:
- Asks to commit or write a commit message
- Pushes to a branch that has an open PR
- Says "conventional commit", "update PR title/description", "sync PR"
- Is about to run `git commit` with no message specified

## Commit format

```
type(scope): short description

[optional body — why, not what]

[optional footer — BREAKING CHANGE: desc]
```

### Types

| Type       | Use when                                   |
|------------|--------------------------------------------|
| `feat`     | new feature or capability                  |
| `fix`      | bug fix                                    |
| `docs`     | documentation only                         |
| `style`    | formatting, no logic change                |
| `refactor` | restructuring, no feature/fix              |
| `test`     | adding or fixing tests                     |
| `chore`    | tooling, deps, config, build scripts       |
| `build`    | build system or dependency changes         |
| `ci`       | CI/CD pipeline changes                     |
| `perf`     | performance improvement                    |
| `revert`   | reverting a prior commit                   |

### Rules

- Subject: ≤72 chars, lowercase, no trailing period, imperative mood ("add" not "added")
- Scope: optional noun in parens — file area or feature (`auth`, `ui`, `api`); omit if change spans too many areas
- Body: wrap at 72 chars; explain why, not what
- Breaking change: `!` after type/scope OR footer `BREAKING CHANGE: <desc>`

## Workflow

### 1. Understand the change

Run `git diff --staged` (or `git diff HEAD`) to see what changed.

Pick `type` based on dominant change; if multiple types apply, use the most significant.

Pick `scope` from the primary directory or feature area; omit if too broad.

### 2. Commit

```bash
git commit -m "type(scope): short description

Body explaining why (optional).

BREAKING CHANGE: description (if applicable)"
```

### 3. After push — update PR

After `git push`, check for an open PR on this branch.

If one exists:

a. Read all branch commits:
```bash
git log <base-branch>..HEAD --oneline
```

b. **PR title** → `type(scope): one-line summary of all branch changes`
   - Summarizes the whole branch, not just the latest commit
   - Same conventional commit format as individual commits

c. **PR description** → replace with this structure:

```markdown
## Summary
<1-3 bullets: what this PR does at a high level>

## Changes
<bulleted list of notable changes, grouped by area if helpful>

## Breaking Changes
<list if any; omit section entirely if none>
```

Apply via the GitHub PR update tool or `gh pr edit --title "..." --body "..."`.

## Example

**Commit:**
```
feat(auth): add OAuth2 login with Google

Replaces email/password-only flow.
Adds google-auth-library dependency.
```

**PR title:** `feat(auth): add OAuth2 Google login`

**PR description:**
```markdown
## Summary
- Adds Google OAuth2 alongside existing email/password login
- Introduces token refresh for long-lived sessions

## Changes
- `auth/`: GoogleOAuthProvider, token refresh middleware
- `ui/login`: Google sign-in button, OAuth callback page
- `deps`: google-auth-library@9
```
