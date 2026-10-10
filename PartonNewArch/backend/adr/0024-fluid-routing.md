# ADR-0024: Fluid routing baseline (React Navigation + React Router)

**Status:** Accepted  
**Date:** 2026-10-09  
**Deciders:** Product / Eng  
**Related:** [ADR-0006](0006-bare-react-native-no-expo.md) · [ADR-0014](0014-web-ui-shadcn-dark.md) · [ADR-0020](0020-wizard-state.md) · [ADR-0021](0021-push-notifications-ux.md) · [shared/08-routing.md](../../shared/08-routing.md)

## Context

PartOn needs navigation that feels native and “fluid” (fast transitions, preserved tab state, reliable deep links from FCM) while staying on the locked stacks: **bare React Native** (no Expo Router) and **Vite admin SPA** (no Next.js App Router). Without a routing ADR, teams risk Expo Router, JS stacks everywhere, URL-less admin, or deep-link handlers that skip auth/role gates (T-109).

## Decision

1. **Mobile:** **React Navigation** with **native stack** + **bottom tabs**; enable **`react-native-screens`**. Nested graph: Root → gates → AuthStack | Role tabs → per-tab stacks → modals.
2. **Deep links / push:** Single **linking** config + `DeepLinkRouter`; pipeline **session → role → onboarding → AuthZ → screen**. Params = entity ids only.
3. **Fluid motion:** Prefer platform native transitions; Reanimated for sheets/chrome; honor **Reduce Motion**.
4. **Web admin (and future employer console):** **React Router** data APIs (`createBrowserRouter`, nested layouts, loaders). Nest serves the SPA.
5. **Hold:** Expo Router · Next.js App Router for admin · HashRouter as default · JS stack as primary mobile navigator.
6. **Canonical IDs:** Product docs keep `m.*` / `w.*`; navigators alias them. Wizard draft state stays out of the URL (ADR-0020).

## Consequences

### Positive

- Matches Apple/Android expectations and Liquid Glass chrome (translucent bars)
- Push / Universal Links share one map with [`mobile/03`](../../mobile/03-flows-and-deep-links.md)
- Admin URLs are bookmarkable and filterable via querystring
- Clear ban on Expo file-based routing

### Negative / tradeoffs

- Manual linking config (no file-based routes) — acceptable for owned RN
- Role switch requires `reset` (intentional — no multi-role stacks)
- RR loaders need care with Nest cookie/Bearer session

### Follow-ups

- Typed route map package shared with screen catalog
- Freeze inactive tabs for heavy lists
- Employer web console reuses same RR pattern when product locks it

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Expo Router | **Reject** — Expo ban |
| Next.js App Router admin | **Reject** — Nest SPA (ADR-0014) |
| React Navigation JS stack only | **Reject** as default — less fluid |
| TanStack Router | **Assess** later if RR insufficient |
| File-based custom RN router | **Reject** — reinvent Expo Router poorly |
