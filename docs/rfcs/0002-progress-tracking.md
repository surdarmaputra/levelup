# RFC: Progress Tracking System

| Field | Value |
|-------|-------|
| **Authors** | @surdarmaputra |
| **Reviewers** | — |
| **Approvers** | @surdarmaputra |
| **RFC** | `docs/rfcs/0002-progress-tracking.md` |
| **Status** | DRAFT |
| **Impact** | MEDIUM |
| **Outcome** | |
| **Created Date** | 2026-09-06 |

---

## 📌 Background

Readers need a way to track their progress through a learning material — marking steps as learned, adding personal notes, and resuming where they left off. This was explicitly out of scope in RFC 1 because it "needs a backend." However, with browser localStorage, we can deliver a fully functional progress tracker without any server.

---

## 💡 Solution

### Storage: localStorage

**Decision: localStorage over IndexedDB**

| Criteria | localStorage | IndexedDB |
|----------|-------------|-----------|
| Complexity | Simple key-value | Complex API, transactions |
| Capacity | ~5-10MB | ~50MB+ |
| Sync/Async | Synchronous | Asynchronous |
| Use case fit | Progress = simple key-value | Large binary data, complex queries |
| Dependencies | None | None |

**Why localStorage is sufficient:**
- Progress data per step: `{completed: boolean, note: string, updatedAt: number}` ≈ 100-500 bytes
- Even with 10 materials × 50 steps × 500 bytes = 25KB — well within limits
- No complex queries needed (just get/set by stepId)
- Synchronous access simplifies UI updates

**Data structure:**
```typescript
interface ProgressEntry {
  completed: boolean;
  note: string;
  updatedAt: number;
}

interface MaterialProgress {
  [stepId: string]: ProgressEntry;  // stepId = 'setup/agent-harness'
}

interface ProgressStore {
  version: 1;
  materials: {
    [materialSlug: string]: MaterialProgress;
  };
}
```

**localStorage key:** `levelup:progress:v1`

---

## 🖥️ UI Design

### 1. Floating Progress Tracker

**Position:** Fixed, bottom-right corner (responsive: bottom-left on small screens)

**Contents:**
- Rounded progress bar (percentage visual)
- `X / Y completed` text
- Material name (truncated if long)
- Expand/collapse toggle

**States:**
- Collapsed: Just the progress bar + numbers
- Expanded: Full panel with actions

### 2. Progress Marker

**Position:** Fixed, adjacent to the tracker (overlapping corner effect)

**Visual:** Small circular badge with icon, pulses briefly when state changes

**Purpose:** Visual cue that progress tracking is active/available

### 3. Mark as Learned Button

**Location:** Appears on each content page, near the page title or in a floating toolbar

**States:**
- Uncompleted: Outline button "Mark as Learned"
- Completed: Filled button "Learned ✓" with option to undo

### 4. Add Note Feature

**Trigger:** Icon button next to "Mark as Learned" or in expanded tracker panel

**UI:** Inline textarea that expands on click, saves on blur or Enter

### 5. Progress Dialog

**Trigger:** Click on tracker or dedicated "View Progress" button

**Contents:**
- List of all steps in current material with status
- Filter: All / Completed / In Progress
- Edit notes inline
- Export/Import buttons
- Clear progress option (with confirmation)

### 6. Export/Import Section

**Location:** Inside the expanded tracker panel or dialog, separated from main actions

**Export options:**
- JSON: Full data structure (for backup/transfer)
- Image: Visual progress card (future enhancement, marked TODO)

**Import:**
- JSON file upload
- Validates structure before applying
- Merges with existing or replaces (user choice)

---

## 🧩 Component Architecture

```
src/
├── lib/
│   └── progress.ts          # Storage layer + ProgressStore class
├── components/
│   ├── ProgressTracker.astro # Main floating tracker
│   ├── ProgressMarker.astro # Floating indicator badge
│   ├── ProgressButton.astro # Per-page mark-as-learned button
│   └── ProgressDialog.astro # Full progress view modal
└── styles/
    └── progress.css         # Progress UI styles
```

---

## 🎬 Interactions

1. **Page load:** Read progress from localStorage, update UI
2. **Mark as Learned click:** Toggle state, save to localStorage, update tracker
3. **Add note:** Click icon → expand textarea → save on blur/Enter
4. **Export:** Generate JSON → trigger download
5. **Import:** File input → parse → validate → merge/replace → update UI
6. **Progress marker:** Subtle pulse animation on any state change

---

## 📋 User Stories

### Story 1: Reader tracks progress through a material

*As a reader, I can mark steps as learned and see my overall progress.*

- [ ] AC1: Progress persists across browser sessions via localStorage
- [ ] AC2: Progress bar shows correct percentage
- [ ] AC3: Completed steps show visual distinction
- [ ] AC4: Progress is scoped per material (completing steps in Material A doesn't affect Material B)

### Story 2: Reader adds personal notes

*As a reader, I can add notes to remember key insights or questions.*

- [ ] AC1: Note input appears inline, no modal required
- [ ] AC2: Note saves automatically on blur
- [ ] AC3: Note displays in expanded tracker and dialog
- [ ] AC4: Note persists with progress data

### Story 3: Reader exports/imports progress

*As a reader, I can backup my progress and restore it on another device.*

- [ ] AC1: Export generates valid JSON file
- [ ] AC2: Import validates JSON structure
- [ ] AC3: Import offers merge or replace options
- [ ] AC4: Exported file can be re-imported successfully

### Story 4: Reader views detailed progress

*As a reader, I can see all steps with their completion status.*

- [ ] AC1: Dialog lists all steps in current material
- [ ] AC2: Filter by status (all/completed/in-progress)
- [ ] AC3: Can edit notes from the dialog
- [ ] AC4: Dialog is accessible (keyboard navigable, screen reader friendly)

---

## 🔜 Future Enhancements (Out of Scope)

- Image export (progress card as PNG)
- Cloud sync across devices
- Progress sharing with instructor/mentor
- Time-based tracking (time spent per step)

---

## ❓ Open Questions

1. Should completed steps show a strikethrough in the sidebar?
2. Do we need keyboard shortcuts for mark-as-learned (e.g., `k`)?
3. Should progress auto-save or require explicit save?
4. How do we handle progress when a material's structure changes (steps added/removed)?

---

## 📝 Amendments

### A1 — Scoped-style exception for runtime-injected dialog rows (2026-09-06)

`ProgressDialog.astro` renders its step list with `list.innerHTML = ...`. Astro's
component-scoped `<style>` only rewrites markup present at build time, so none of the
`.pd-item*` rules reached the injected rows: buttons rendered at browser-default size,
no flex layout, no label/note type hierarchy, and `.pd-item.hidden { display: none }`
never matched — which is why the Completed / With notes filters appeared broken.

**Decision:** the row and inline-note-editor styles live in a `<style is:global>` block
inside `ProgressDialog.astro`, with every selector pinned under `#pd-overlay ` so nothing
leaks past the dialog. The static shell stays scoped.

This is a deliberate, local exception to the "no global CSS outside `src/styles/custom.css`"
convention. The rule's intent — no unscoped rules bleeding across the site — still holds via
the `#pd-overlay` prefix. The alternative (building every row and its child buttons with
`document.createElement` so scoped styles apply) was rejected as more code and more event-wiring
surface for no user-visible gain.

Applies only to dynamically-injected markup. New components with static markup keep using
scoped `<style>`.

### A2 — Step-level tracking for the roadmap (2026-09-07)

The original model tracked one entry per Markdown **page** (`stepId = 'roadmap/foundations'`
covered steps 0–4 in a single toggle). Readers wanted per-step granularity.

**Decision:**

- **What counts.** A material's trackable units are each **Setup page** plus each **roadmap
  step** (`## Step N` heading inside a section page). For `java-spring-boot` that is 28:
  2 setup + 26 steps. `roadmap/overview` and everything under `reference/` are lookup-only,
  as before.
- **`stepId` scheme.** `<section-path>/step-<n>`, e.g. `roadmap/foundations/step-0`,
  `roadmap/domain-depth/step-5b`. Derived from the step *number*, so rephrasing a heading
  does not orphan progress. Setup pages keep their page-path id (`setup/agent-harness`).
- **Manifest.** `src/lib/roadmapSteps.ts` parses the step headings out of `entry.body` at
  build time and slugs them with `github-slugger` (matching Starlight's own heading slugs).
  It is the single source of truth for the denominator, the dialog list, the PNG card, and
  the TOC cue — nothing hand-maintained. `PageFrame.astro` serialises the ordered
  `{id,label,section}` manifest onto `#pw` as `data-steps`.
- **UI.** Each `## Step` heading gets an inline control row (`RoadmapStepControls.astro`,
  client-injected after the heading) — a compact mark-done toggle + note. The page-title
  "Mark as learned" bar (`ProgressButton`) is now shown **only on Setup pages**. Completed
  steps get a `✓` in the right-hand "On this page" list (`TocProgress.astro` +
  `.toc-step-done` rule in `custom.css`). The floating tracker gains a `data-page-kind`
  (`step` / `section` / `lookup`) replacing the old `data-is-step` boolean. The dialog lists
  every unit grouped by section.

**Resolves Open Question 1** — the completed-step cue lives in the on-this-page TOC, not the
left nav sidebar (which stays a per-section menu).

**Resolves Open Question 4** — no schema bump, no data migration. `getMaterialStats` counts
only ids present in the current manifest, so a stale page-level entry
(`roadmap/foundations`) from the old model is simply ignored and the percentage recomputes
against the new unit list.

---

## 📎 References

- [localStorage - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Starlight components override](https://starlight.astro.build/reference/overriding-components/)
