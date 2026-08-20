---
name: skill-creator-compact
description: "Create, edit, or iterate on Claude skills for any part of the project (frontend, backend, infra, etc). Use when user wants to add/update/capture a workflow as a skill or improve triggering — even if they say 'document this', 'save this as a skill', 'make a skill for X'. Always reads AGENTS.md first."
---

# skill-creator-compact

Skill creator for project skills. Terse. No fluff.

## Boot sequence (always run first)

1. Read `AGENTS.md` → agents, roles, stack, conventions
2. Read `README.md` → project context, file structure
3. Scan existing skills → avoid duplication, match naming patterns
4. Proceed

Missing files → note it, continue.

---

## This skill's voice

Terse. Fragments OK. No articles, filler, hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.

---

## Step echo (always)

Before running any step, print which step you're executing.
Format: `▶ Step N: <name>`. One line, then proceed.

---

## Mandatory finalize (every action)

After ANY action completes — create OR update, including after asking a confirmation and executing on the user's answer — always run, in order:

1. `▶ Step 5: Compress` → apply compress
2. `▶ Step 6: Skill quality checklist` → run checklist
3. `▶ Step 7: Simulate` → run simulation

These three are non-negotiable. No action ends without them.

---

## Output skill comm style
Always include this exact block in generated skills:

```md
## Comm style
Terse. Fragments OK. No articles, no filler, no hedging.
Abbreviate: fn/impl/req/res/auth/DB/UI/prop/comp.
Arrows for flow: A → B. One word when enough.
Code blocks: unchanged, always.
```

---

## Workflow

### 1. Capture intent

Extract from conversation — don't re-ask what's there.

Derive from user's description:
- Infer name, purpose, triggers, output format from what they wrote
- Stack mentioned → use it, skip asking
- Stack-specific skill → check AGENTS.md; ask only if still unclear
- Stack-agnostic skill → don't ask about stack

Ask only missing gaps (one at a time):
- What does it do? (if vague)
- Trigger phrases? (if not obvious)
- Output format? (if ambiguous)
- Test cases? (verifiable → yes; subjective → skip)

---

### 2. Write SKILL.md

```
skill-name/
├── SKILL.md          ← required
├── references/       ← optional, load on demand
└── assets/           ← optional, templates/snippets
```

Frontmatter:
- `name` — kebab-case
- `description` — single-line quoted; trigger + action; pushy ("use this whenever X, even if user doesn't say 'skill'"); no multiline `>` or `|`

Body sections (use only what's needed): boot sequence, comm style, workflow, output format, edge cases, examples.

Stack conventions → AGENTS.md. No hardcoded framework assumptions.

---

### 3. Iterate

User feedback → update SKILL.md → compress (step 5) → quality checklist (step 6) → simulate (step 7) → repeat.
Track: "Changed: X → Y".

---

### 4. Output

Ask where to save: project path / download / show in chat.
No answer → output in chat as code block.
`.skill` file only if `present_files` available and user wants download.

---

### 5. Compress

Shrink the SKILL.md:
- Prose → arrows: "Read file, then check type" → "Read file → check type"
- Drop articles where intent stays clear
- Abbreviate: fn/impl/req/res/comp/prop/auth/DB/UI
- Merge short bullets where meaning survives
- Remove hedging: "you might", "consider", "it is recommended"

Don't compress: code blocks, frontmatter, `## Comm style` block (must stay exact).

---

### 6. Skill quality checklist

Run after compress (step 5). Before finalizing:
- [ ] description triggers reliably (verb + context + "even if user doesn't say X")
- [ ] AGENTS.md / README.md referenced if needed
- [ ] no hardcoded stack assumptions (defer to AGENTS.md)
- [ ] no redundant sections
- [ ] compressed (step 5 applied)
- [ ] simulated (step 7 run after last change)
- [ ] under 500 lines

---

### 7. Simulate

Run yourself:
1. Read SKILL.md fresh
2. Follow instructions on test prompt
3. Show output to user
4. Ask: "Good? What to change?"

No quantitative benchmarks. Qualitative only.

---

## Updating existing skill

- Keep original `name` + dir name unchanged
- Copy to writable location if read-only
- Show diff: changed sections only
- After every update → mandatory finalize: compress (step 5) → quality checklist (step 6) → simulate (step 7)