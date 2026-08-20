# RFC Heading Structure (mirrors rfc-template.md)

Structural skeleton only — no invented facts. This is the section tree to follow, not a real RFC
to imitate. One example, matching `rfc-template.md` exactly, so there's nothing to reconcile
between two diverging shapes.

```
📖 Glossary
📌 Background
🖋️ Requirements
 ├─ Functional Requirements (numbered; always tag [BE][service-name] or [FE][service-name])
 └─ Non-Functional Requirements (numbered)
🚫 Out of scope
💡 Solution
 ├─ Approach #1 (Preferred)
 │   ├─ Overview (Optional)
 │   ├─ Sequence Diagram (mermaid — mandatory for almost every solution)
 │   ├─ Block Diagram (Optional, mermaid)
 │   └─ Database Modelling (Optional)
 └─ Approach #2 (rejected — trade-offs vs #1)
📋 User Stories
 ├─ Story 1: As a [role], I want [feature] so that [benefit] (+ Edge Cases if relevant)
 │   ├─ Task 1.1: [BE][service-name] <Task title> → AC first, then API Contract / DB Changes
 │   └─ Task 1.2: [FE][service-name] <Task title> → AC first, then fe-build checklist (css-tokens →
 │       l1-service → l2-hook → core-component → feature-component → translation → test-file)
 └─ Story 2: ...
🗓️ Timeline
🚀 Rollout Plan (Optional)
🤝 Decision (left empty in draft)
❓ Open questions
🔗 References
🪑 RFC review meeting notes (left empty in draft)
📎 Follow-up
🗄️ Appendix (AI can ignore unless referenced elsewhere)
```

Every top-level heading carries the emoji shown here — apply the same emoji when drafting or
publishing, whether output is a `.md` file or a Lark doc.
