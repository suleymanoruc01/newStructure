# ADR-0014: Nest-hosted Vite admin UI with shadcn/ui (dark default)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../web/04-shadcn-dark-ui.md`](../../web/04-shadcn-dark-ui.md)  
**Upstream:** https://github.com/shadcn-ui/ui

## Context

ADR-0001 requires the admin management panel to live in the **same NestJS application** as the REST API and share domain services. Presentation tooling was open (BQ-4): AdminJS vs custom SPA vs separate Next.js. Ops screens (abuse, risk, catalog, policies, broadcast, audit) need a dense, accessible, customizable UI. The product direction for web chrome is **[shadcn/ui](https://github.com/shadcn-ui/ui)** with a **dark** default theme.

## Decision

1. Build the admin UI as a **React + Vite + TypeScript** SPA in the monorepo (`apps/admin`).  
2. Use **shadcn/ui** (Tailwind CSS + Radix; components via CLI into `components/ui`) as the design system.  
3. **Dark theme is the default** (class-based `.dark` + CSS variables); light optional.  
4. Nest **builds and serves** the SPA static assets; the SPA talks to **`/api/v1`** under admin AuthZ — no duplicate business rules.  
5. Use **SSE** for foreground live updates; do not use FCM/WebSocket for admin v1.  
6. **Reject** AdminJS and a separate Next.js admin app for v1.  
7. Employer web console remains **not locked**; if added later, reuse this stack.

## Alternatives

### AdminJS / Refine-style auto admin
- **Pros:** Fast CRUD  
- **Cons:** Poor fit for PartOn queues, geo config, broadcast, audit UX  
- **Why not:** Custom SPA with shadcn  

### Separate Next.js admin (App Router)
- **Pros:** Familiar SSR story  
- **Cons:** Second deployable; drifts from “same Nest app” lock  
- **Why not:** Hold unless ADR supersedes 0001  

### Light-first shadcn theme
- **Pros:** Default marketing look  
- **Cons:** Ops preference is dark; user asked for dark  
- **Why not:** Dark default; light toggle optional  

## Consequences

### Positive
- Closes BQ-4 with a clear stack  
- Matches locked monolith + shared AuthZ  
- Components owned in-repo for PartOn branding  

### Negative / risks
- Must maintain shadcn/Tailwind upgrades  
- SPA Auth (cookie/CSRF) needs careful Nest alignment  

### Follow-up
- Scaffold `apps/admin` with current shadcn Vite guide  
- Wire Nest static + SPA fallback  
- Confirm WEB-1…WEB-5 at scaffold  
