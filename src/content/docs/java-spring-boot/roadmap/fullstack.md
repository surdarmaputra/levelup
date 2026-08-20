---
title: Fullstack
description: Steps 15–18. React storefront, seat map, checkout, and frontend production readiness.
sidebar:
  order: 5
---

> Step 5 (Thymeleaf admin) is Path 2's first deliverable and stays in place — it's the internal back-office. Steps 15–18 build the customer storefront as a separate React application. Two surfaces, two rendering models, two auth models, by design.

## Step 15 — React storefront foundation and token auth

**Story:** *As a customer, I browse events and sign in on a fast, modern storefront that talks to the same API the admin panel is backed by.*

**Mode:** `BUILD` — Scaffolding, typed client, styling. Agent-heavy. You own the token-storage decision.

**Why now:** Requires a stable, versioned API (step 12's contract guardrail) and real resilience (step 14). Building a frontend against a shifting API wastes both.

**Concepts:**
- SPA vs SSR trade-offs, revisited now that you've built server-rendered pages and can compare honestly
- Vite + React 19 + TypeScript project setup
- **Generating a typed API client from your OpenAPI spec** — the contract becomes compile-time-checked
- TanStack Query: server state is not client state; caching, invalidation, background refetch
- **CORS properly understood**: preflight, credentials, `Access-Control-Allow-Credentials`, and why `*` is incompatible with credentials
- **Token storage: httpOnly + Secure + SameSite cookies, not localStorage.** localStorage is readable by any XSS payload.
- Hand-rolled JWT issuance: claims, signing, expiry, refresh rotation
- **Why "stateless JWT" collapses the moment you need logout or revocation** — you will build a denylist and understand the trade-off you actually made
- Route protection and auth state on the client

**Libraries:** Vite, React 19, TypeScript (`strict`), TanStack Query v5, React Router v7, `openapi-typescript`, Tailwind 4, **shadcn/ui**, **Biome** + minimal ESLint (`react-hooks` only). Backend: `spring-boot-starter-oauth2-resource-server`, JJWT.

**Tooling note:** Biome replaces ESLint + Prettier as one Rust binary — lint, format, and import organization from a single config, roughly 10–20x faster. That speed matters practically: a 2-second pre-commit hook survives, a 30-second one gets bypassed. Keep a minimal ESLint config alongside it purely for the React Hooks rules, which Biome's coverage doesn't fully replace. TypeScript `strict` is the highest-value setting available to you and costs nothing at project start.

**Why shadcn over a component library:** you copy the components into your repo and own them. For step 16's seat map you'll need to modify component internals, which is painful with an installed library and trivial with shadcn. It also means your storefront doesn't look like every other shadcn site — you'll retheme the tokens the same way you did for daisyUI in step 5b.

**Build:** Vite app. Generated typed API client. JWT issuance + refresh rotation + revocation denylist. CORS config. Login, protected routes, event browsing.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-15` — an expired access token triggers a transparent refresh and the original request succeeds without the user noticing. A revoked refresh token is rejected. Backend integration test + frontend test. |
| **L2 — Manual checks** | (a) DevTools → Application → Local Storage contains no tokens <br>(b) Change a DTO field name in the backend; regenerate the client; the frontend fails to compile. This is the contract working. <br>(c) Observe the OPTIONS preflight in the Network tab and explain what it negotiated |
| **L4 — Anti-patterns** | `AP-15-a`, `AP-15-b`, `AP-15-c`, `AP-15-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-15` green, no tokens in JS-readable storage, typed client generated from OpenAPI in CI |

---

## Step 16 — Interactive seat map and hold timer

**Story:** *As a customer, I see a live seat map for my showtime, select seats, and watch a countdown showing how long they're held before release.*

**Mode:** `LEARN` — Client-side race conditions are subtle. Debug them yourself.

**Why now:** The genuinely hard frontend problem, and the one that justifies choosing React for this surface.

**Concepts:**
- Rendering thousands of interactive elements performantly — SVG vs canvas, virtualization
- Client state vs server state — which library owns what, and why mixing them causes bugs
- **Optimistic updates and rollback on failure**
- Race conditions on the client: stale responses arriving out of order, request cancellation with `AbortController`
- Polling vs SSE vs WebSocket — the actual decision criteria, not a preference
- **Server-Sent Events** for live availability; reconnection with `Last-Event-ID`
- Timer synchronization: the server owns hold expiry, the client only displays it. **Never trust client clocks.**
- Handling the hold-expired-while-you-were-choosing case gracefully
- Accessibility for a spatial widget — keyboard navigation, screen reader alternative

**Libraries:** SVG + `react-zoom-pan-pinch` or canvas, TanStack Query, native `EventSource`. Backend: `SseEmitter`.

**Build:** Zoomable seat map. Seat selection with optimistic feedback. SSE availability stream. Countdown timer driven by server-supplied expiry. Expiry recovery UX.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-16` — two browser contexts on the same showtime; context A holds a seat; context B's map reflects unavailability within 2 seconds without a page reload. Playwright, two contexts. |
| **L2 — Manual checks** | (a) Set your OS clock forward 20 minutes — the hold timer stays correct (server-driven, not client-driven) <br>(b) Kill the SSE connection; confirm automatic reconnection and state resynchronization <br>(c) Complete a seat selection using only the keyboard |
| **L4 — Anti-patterns** | `AP-16-a`, `AP-16-b`, `AP-16-c`, `AP-16-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-16` green, 5,000-seat map renders at 60fps, expiry is server-authoritative |

---

## Step 17 — Checkout, payment, and the confirmation flow

**Story:** *As a customer, I complete payment and receive my tickets, and the experience is unambiguous even when payment is slow, fails, or the browser closes mid-flow.*

**Mode:** `LEARN` — Flow-state recovery design is judgement, not codegen.

**Why now:** Ties the frontend to the async backend built in step 10. Eventual consistency becomes a UX problem, not just an architecture one.

**Concepts:**
- Multi-step flows with resumable state
- **Idempotency from the client** — generating and reusing an idempotency key across retries
- Hosted payment fields / PCI scope — why your server should never see a card number
- The redirect-and-return dance; handling the user closing the tab mid-payment
- **Presenting eventual consistency honestly**: payment succeeded, ticket issuance is in flight. Polling vs SSE for terminal state.
- Error taxonomy on the client: retryable vs terminal vs needs-user-action
- Preventing double submission at every layer
- Post-purchase: ticket delivery, QR generation, wallet passes

**Libraries:** Gateway SDK (hosted fields), `zod` for runtime validation at the API boundary

**Build:** Checkout flow with resumable state. Client idempotency keys. Payment redirect handling. Pending → confirmed transition UI. Ticket view with QR.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-17` — submit checkout, kill the browser tab before the callback, reopen the order page: state is correct and recoverable, no orphaned hold, no double charge. Playwright + backend integration test. |
| **L2 — Manual checks** | (a) Double-click the pay button rapidly — exactly one order is created <br>(b) Throttle the network to Slow 3G and complete a purchase — the UI never leaves the user uncertain about what happened <br>(c) Confirm no card data ever reaches your server logs |
| **L4 — Anti-patterns** | `AP-17-a`, `AP-17-b`, `AP-17-c`, `AP-17-d` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-17` green, double-submission impossible, no PCI data touches your backend |

---

## Step 18 — Frontend production readiness

**Story:** *As the business, the storefront is fast, monitored, accessible, and deployable with confidence.*

**Mode:** `BUILD` — Test setup, CI, budgets. Agent-heavy.

**Why now:** Closes the fullstack path.

**Concepts:**
- Error boundaries and client-side error reporting
- Core Web Vitals: LCP, INP, CLS — measuring and fixing
- Code splitting, route-level lazy loading, bundle analysis
- Image optimization and responsive loading
- Testing pyramid for frontends: Vitest units, React Testing Library, MSW for API mocking, Playwright E2E
- **What to E2E test and what not to** — E2E suites that test everything become suites nobody runs
- Frontend CI: typecheck, lint, test, build, bundle-size budget
- Serving the SPA: nginx static + SPA fallback routing, cache headers, cache busting
- Content Security Policy, Subresource Integrity
- Accessibility audit and remediation

**Libraries:** Vitest, React Testing Library, MSW, Playwright, `vite-bundle-visualizer`, axe-core

**Build:** Error boundaries. Full test suite. Frontend CI with bundle budget. nginx static serving. CSP headers. Accessibility fixes.

**Verification**

| | |
|---|---|
| **L1 — Gating test** | `ACC-18` — Playwright E2E covering the complete browse → select → checkout → ticket journey, passing against the real load-balanced backend stack in CI |
| **L2 — Manual checks** | (a) Lighthouse: Performance ≥90, Accessibility ≥95 <br>(b) Deep-link directly to /events/123 — routing works, no 404 (SPA fallback configured) <br>(c) Bundle budget enforced; CI fails if exceeded |
| **L4 — Anti-patterns** | `AP-18-a`, `AP-18-b`, `AP-18-c` — [full text](../../reference/rubrics/) |
| **Done when** | `ACC-18` green, Lighthouse targets met, frontend CI enforcing budgets |

---
