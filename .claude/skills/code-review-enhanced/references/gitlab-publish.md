# GitLab publish — reference

Loaded by SKILL.md Phase 11, only after the user has said `y` to the "Publish these findings to GitLab?" prompt. Do not read this speculatively during the main review — everything below, including finding selection, is dead weight on the (common) path where the answer is `n`.

Scope: self-hosted GitLab only. Any other provider → stop at Step 1, tell user, no MCP calls.

## Step 0 — select which findings to publish

Ask:
```
Pick findings to publish — reply with one of:
  pick all | drop all | pick <numbers> | drop <numbers>
(numbers are the file.finding numbers from the list above, e.g. 1.2, 2.1)
```

Parse against the Phase 7 numbering. **Only these four exact forms are accepted** — comma/space-separated numbers, no ranges (`1.1-1.4` is not a form):
- `pick all` → every finding included.
- `drop all` → every finding dropped, nothing to publish — confirm with user, likely means they changed their mind; treat as `n` on the original prompt, stop.
- `pick <numbers>` → only listed numbers included, everything else dropped.
- `drop <numbers>` → listed numbers dropped, everything else included.

Anything else (wrong verb, a range, mixed pick+drop, garbage) → do not guess intent. Re-show the four valid forms and re-ask.

**Re-render the full Phase 7 list**, same numbering, same content, unchanged for included findings. For each dropped finding, append to its headline/short-form line:
```
<i>.<j>) L<line> [<LABEL>] <issue> → <fix>  — IGNORED - NOT PUBLISHED
```
(expanded form: append the same suffix to the opening line only, body/bullets stay as-is or may be omitted — the marker is what matters).

Nothing left after drops → tell user, stop. Otherwise continue to Step 1 with only the included findings.

## Step 1 — determine provider

```bash
git remote get-url origin
```

Parse the host out of the URL. GitLab (self-hosted or gitlab.com) → continue. Anything else (github.com, bitbucket.org, unknown) → tell user this provider isn't supported yet, stop.

## Step 2 — check MCP readiness

Call `mcp__gitlab__health_check` (fall back to `mcp__gitlab__whoami` if health_check isn't available) before touching anything else.

- Errors, times out, or reports not-authenticated → tell user the GitLab MCP server isn't ready, stop. Do not attempt a raw HTTP call as a substitute — that would need a token this skill has no business handling.
- OK → continue.

## Step 3 — find the MR for the current branch

```bash
git branch --show-current
```

Derive the project from the remote URL's path (the part between host and `.git`). Call `mcp__gitlab__list_merge_requests` scoped to that project, filtered by `source_branch` = current branch **and `state=opened`**. Closed/merged MRs are never listed as pickable targets — posting review comments there is pointless.

- Zero results → tell user no open MR exists for this branch, stop. Do not create one — that's a separate, bigger action outside this skill's scope.
- One result → that's the target MR.
- More than one open MR for the same branch (rare) → list iid/title for each, ask user to pick.

Fetch full details on the chosen MR via `mcp__gitlab__get_merge_request` (need `iid`, `web_url`, `target_branch`, `state`, and the SHAs for the position block — `diff_refs.base_sha`/`start_sha`/`head_sha` if present, otherwise fall back to the `git merge-base` / `git rev-parse HEAD` values already captured in Phase 2 of SKILL.md).

## Step 4 — confirm with user

Show exactly this before any write call, and wait for explicit confirmation. Re-render the **full** finding list from Step 0 (all findings, dropped ones still shown, marked `IGNORED - NOT PUBLISHED`) directly above this block — the count alone is not a sufficient last check before a write to a shared MR:

```
GitLab remote: <remote url from step 1>
MR: !<iid> — <title>
Link: <web_url>
Branch: <source_branch> → <target_branch>
Publishing <n> of <total> findings (see list above)
Proceed? [y/n]
```

`n` → stop, no write calls made, no partial posting.

## Step 4.5 — duplicate guard

Before building anything to post, fetch existing notes on the MR (`mcp__gitlab__get_merge_request_notes` or `mr_discussions`). For each included finding, compare its body text against existing notes anchored to the same `new_path` + the same line, or a line immediately adjacent inside the same statement/hunk (e.g. a ternary's branch line one below the line the finding cites), that raises the same underlying issue.

A match → **skip posting a new comment** and instead react to the existing note with the `plus` emoji (➕) via `mcp__gitlab__create_merge_request_note_emoji_reaction`, passing that note's `note_id`. This acknowledges agreement — someone already flagged it — without piling a near-duplicate comment onto the thread. Record it as "skipped (already posted) — reacted ➕" for the final report (Step 5.2).

Emoji reaction call quirk: pass `note_id` only. The tool schema says `discussion_id` is required for "notes that are discussion replies," but a normal diff-note discussion's first (and often only) note 404s when `discussion_id` is included — omit it on the first attempt, and only add it back if the plain call fails.

This prevents re-running review+publish on an unchanged finding from double-posting, while still leaving a visible signal that the finding was seen and agreed with.

Reaction call fails (both with and without `discussion_id`) → don't block on it. Record the finding as skipped (duplicate) without the reaction note, and move on — a missing ➕ is cosmetic, not worth stopping the batch over.

## Step 4.6 — re-verify before writing

Right before the Step 5 loop starts (i.e. after Step 4's confirmation, immediately before the first write call), re-fetch the MR via `mcp__gitlab__get_merge_request` and check:
- `state` is still `opened`
- `head_sha` is unchanged from Step 3's lookup

Either changed (MR merged/closed, or branch force-pushed) between confirmation and execution → stop, post nothing, tell user to re-run the review against the current state.

## Step 5 — execute

Each included, non-duplicate finding maps to a `POST /projects/:id/merge_requests/:iid/discussions` body, posted via `mcp__gitlab__create_merge_request_discussion_note`:

```jsonc
{
  "body": "**[CRITICAL][LOGIC]** Guard flipped: cancelled applications now editable\n\n- ...\n\nRef: src/.../status.ts:14",
  "position": {
    "position_type": "text",
    "base_sha":  "<from Step 3>",
    "start_sha": "<same as base_sha>",
    "head_sha":  "<from Step 3>",
    "new_path":  "src/features/financing/hooks/use-application.ts",
    "old_path":  "src/features/financing/hooks/use-application.ts",
    "new_line":  34,          // omit for deleted lines
    "old_line":  null         // set instead of new_line for deleted lines
  }
}
```

For each included, non-duplicate finding, in numbering order:

1. Build the body: `**[<LABEL(s)>]** <headline>\n\n<bullets if any>\n\nRef: <ref if any>` — same content the user already saw in Phase 7, minus the file-grouping.
2. Line-anchored (Phase 6 of SKILL.md produced a real line, not a dropped one) → `mcp__gitlab__create_merge_request_discussion_note` with the `position` block above.
3. No verified line (Phase 6 step 4 fallback) → `mcp__gitlab__create_merge_request_note` instead — a general MR comment, not inline.
4. One MCP call per finding. Do not batch multiple findings into a single comment body.

Notes on the position block:
- `old_path` = `new_path` unless the file was renamed (`git diff --find-renames`).
- Added line → `new_line` only, `old_line: null`. Deleted line → `old_line` only, `new_line: null`. Context line → both.
- Multi-line range (`L34-38`) → GitLab anchors to a single line; use the **first** line of the range.
- `[QUESTION]` posts as a normal inline discussion like any other finding — it is line-anchored by Phase 6.
- Auth/token config is the GitLab MCP server's concern, not this skill's — never hardcode a token in a call.

### Failure handling

- A single post fails → retry once. Still fails → record as failed (with error), move to the next finding.
- **Two consecutive findings fail with the same error type** → stop the loop early (don't grind through the rest against a systemic failure — auth expiry, rate limit, locked MR). Report what posted so far, what didn't, and why.
- One-off failures (different error types, not consecutive) never abort the batch — keep going.

## Step 5.2 — final report

Structured, per-outcome number-lists keyed to the Phase 7 numbering. Omit any line whose list is empty:

```
Published: 1.1, 1.3, 2.1
Skipped (already posted, reacted ➕): 1.4
Failed: 1.5 (error: <reason>)
```

Include the MR link after this block.
