---
title: The Dashboard
description: Steps 15–17. A server-rendered operations UI with html/template and htmx, replay, and authentication.
sidebar:
  order: 5
---

Three steps that make the system visible. This is the part a reviewer will click through, so it
has to work and it has to load fast — but it is still Go: templates compiled into the binary,
htmx for interaction, no build step and no framework.

---

## Step 15 — Server-rendered pages with `html/template`

**Story:** *As an operator, I can open a page and see every delivery, its state, and how many attempts it has taken.*

**Mode:** `BUILD` — templates and handlers. Generate the scaffolding, then read the escaping rules yourself.

**Why now:** After the system behaves correctly. A dashboard over a queue that starves Kirana would just make the bug prettier.

**Concepts:**
- `html/template` versus `text/template`, and the reason to never use the second one for HTML: contextual auto-escaping. The template knows whether it is inside an attribute, a URL, or a script block, and escapes accordingly.
- **Parsing templates once at startup**, not per request. `template.Must` plus `embed.FS` so the binary carries its own views.
- Template composition: a base layout, `{{define}}` and `{{template}}`, and blocks for the page body
- Passing one typed view-model struct per page rather than a `map[string]any`. The compiler cannot check a template, so the struct is where you get your safety back.
- `template.HTML` and why marking something safe is a decision you make deliberately, in one place, with a comment
- Serving static assets from `embed.FS` with cache headers, and vendoring htmx rather than loading it from a CDN — the service must run with no outbound internet access
- Pagination over a table that will hold millions of rows: keyset pagination on `(created_at, id)`, not `OFFSET`
- Handling the empty, loading and error states of every list. A dashboard that renders nothing when a query fails is worse than an error page.

**Libraries:** standard library `html/template` and `embed`. htmx and a small CSS file, both vendored into the repository.

**Expected outcome:** A dashboard at `/app` with a deliveries list (filterable by state and endpoint, keyset-paginated), a delivery detail page showing the attempt timeline with status codes and response prefixes, and an endpoints page showing each endpoint's breaker state and rate limit. All three subscribers visible with real seeded data.

```text
internal/web/
├── handlers.go     one handler per page, one view-model per handler
├── render.go       parse once, execute with a typed model
├── templates/      base layout + pages, embedded
└── static/         htmx, css, embedded
```

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — seed a delivery whose endpoint name is `<script>alert(1)</script>` and whose response body prefix contains raw HTML. Render the detail page and assert the output contains the escaped form and not the raw tags. Plus: the deliveries list renders correctly with zero rows, with one row, and with a page full. |
| **L2 — Manual checks** | (a) Load the deliveries page with 100,000 seeded rows and time it. Then check that page 500 is as fast as page 1 — if it is not, you used `OFFSET`. <br>(b) Run the binary with no network access and confirm every asset still loads. <br>(c) Break a template and confirm the failure happens at startup, not on the first user request. |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, templates parsed once at startup, no asset loaded from a CDN |

---

## Step 16 — htmx: live state and the replay button

**Story:** *As an operator, I can watch a delivery retry in real time and replay a dead one without reloading the page.*

**Mode:** `BUILD` — the interaction layer. This is the step that turns the repository into something you can screenshot.

**Why now:** After the pages exist. htmx adds behaviour to HTML that already renders; there is nothing to enhance before this point.

**Concepts:**
- htmx's model: an attribute on an element issues a request, and the server answers with **HTML**, not JSON. Your existing handlers already produce HTML; this is why the choice was made at step 15.
- Partial rendering: one handler returns a full page for a normal request and a fragment for an htmx request, decided by the `HX-Request` header
- `hx-get` with `hx-trigger="every 3s"` for the live delivery list, and why polling is the correct first answer for an operations dashboard used by four people
- `hx-post` for the replay action, and returning the updated row so the page reflects the new state
- **Replay semantics**, the real content of this step: replaying a dead delivery creates a *new* delivery for the same event, it does not resurrect the old one — so history stays intact. For an ordered endpoint, replay must respect the ordering key, which is where step 12's decision comes back.
- Bulk replay of a whole endpoint's dead letters, and why it must be rate-limited by the same limiter as normal traffic
- CSRF on every state-changing request — set up properly in step 17, stubbed here
- Progressive enhancement: the replay button is a `<form>` that works without htmx. Test it with JavaScript disabled once.

**Libraries:** htmx (vendored). No JavaScript beyond what htmx needs.

**Expected outcome:** A live-updating delivery list, a replay button on dead deliveries, bulk replay per endpoint, and a filter bar that updates the list without a full page load. Every action works without JavaScript as a plain form post.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — replay a dead Pixel Forge delivery: assert a new delivery row is created, the original dead row is unchanged, the new delivery carries the same event and ordering key, and it is delivered after any other pending delivery for that key. Assert the htmx response is a fragment, not a full document, when `HX-Request` is set. |
| **L2 — Manual checks** | (a) Take a receiver down, watch the list update through several retries without touching the browser. <br>(b) Disable JavaScript and confirm replay still works as a form post. <br>(c) Bulk-replay 500 dead Meridian deliveries and confirm the 5 rps limit still holds. |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, replay preserves history, and every action degrades to a plain form |

---

## Step 17 — Authentication: sessions, CSRF, and API keys

**Story:** *As the platform, an anonymous visitor can reach nothing, an operator signs in to the dashboard, and a producer application authenticates with a key that is never stored in readable form.*

**Mode:** `LEARN` — authentication written by an agent and not understood is a liability you cannot review later.

**Why now:** Last, and on purpose. Adding auth to finished pages means visiting every handler and deciding what it needs, which is a useful exercise. Adding pages to finished auth means never thinking about it again.

**Concepts:**
- **Default deny.** One middleware wraps everything; public routes are the explicit exception. The opposite order leaves one endpoint open and you will not find it.
- Password hashing with `bcrypt` or `argon2id`, cost parameters, and why a fast hash is the vulnerability
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, a server-side session record, rotation on login, and expiry
- **CSRF**: what it is, why cookie-authenticated forms need it, and the double-submit or synchronizer-token pattern. `SameSite` alone is not the whole answer.
- Why the dashboard uses sessions and the ingest API uses keys — they have different clients, different threat models, and different lifetimes
- API keys: generated with `crypto/rand`, shown once, stored as a hash, compared in constant time, prefixed so a leaked key is identifiable in a log, and revocable
- Timing attacks on key lookup, and why the prefix is what makes a constant-time compare practical
- Authorization beyond authentication: an operator may replay their workspace's deliveries and nobody else's. A role check alone does not answer *whose data*.
- Rate-limiting the login endpoint

**Libraries:** `golang.org/x/crypto/bcrypt`. Sessions and CSRF hand-written — both are short, and both are worth having read.

**Expected outcome:** Login and logout, server-side sessions, CSRF on every state-changing request, API key issue and revoke through the dashboard, default-deny middleware over every route, and workspace ownership checks on replay.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — an unauthenticated request to every non-public route returns 401 or a redirect, enumerated from the route table so a new route added later fails the test until it is classified. A valid session posting the replay form without a CSRF token gets 403. An operator of workspace A replaying a delivery of workspace B gets 403, not 404 and not 200. A revoked API key is rejected. |
| **L2 — Manual checks** | (a) Inspect the database — passwords are hashes, API keys are hashes, neither is readable. <br>(b) Read the `Set-Cookie` header and confirm all three flags. <br>(c) Add a new route without a rule and confirm `ACC-17` fails. That is the test doing its job. |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d`, `AP-17-e` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, default deny in place, and no secret is stored in a readable form |
