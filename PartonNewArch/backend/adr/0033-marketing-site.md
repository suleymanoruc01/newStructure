# ADR-0033: Marketing site (public web) — production-ready

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0014](0014-web-ui-shadcn-dark.md) · [ADR-0017](0017-color-system.md) · [ADR-0023](0023-i18n-turkish-primary.md) · [ADR-0025](0025-modern-ui-principles.md) · [ADR-0032](0032-nginx-reverse-proxy.md) · [web/07-marketing.md](../../web/07-marketing.md) · [web/screens/public-auth.md](../../web/screens/public-auth.md)

## Context

PartOn needs a public **marketing** surface for brand, store CTAs, employer entry, pricing clarity, and KVKK-facing legal pages. Treating marketing as an MVP stub (landing-only, deferred pricing/SEO, CSR-only SPA) leaves **gaps** and **bottlenecks** (crawl-blind pages, Nest on the hot path, placeholder CTAs). Admin remains Nest-hosted Vite shadcn dark (ADR-0014); marketing must be a separate production brand surface.

## Decision

1. Marketing is **production-ready**, not MVP. **No intentional gaps** on catalogued `w.public.*` screens; **no known bottlenecks** left unmitigated.  
2. **Required screens:** `w.public.landing`, `w.public.pricing`, `w.public.legal.privacy`, `w.public.legal.terms` — all ship together.  
3. Implement as **`apps/marketing`** — **Vite + React + TypeScript**, PartOn tokens (ADR-0017), Sept 2026 UI (ADR-0025). **Not** the admin dark shell.  
4. **Prerender / SSG** all public routes at build so HTML is crawlable (anti-bottleneck vs CSR-only).  
5. **Turkish (`tr-TR`) primary** via i18n (ADR-0023); secondary `en` where catalogs exist.  
6. **Hosting:** static `dist` on **NGINX** `www`/apex (ADR-0032). Nest is **not** on the marketing request path in production.  
7. CTAs use **real** store and employer-login URLs from config — never `#` stubs.  
8. SEO baseline: per-route meta/OG/canonical, `sitemap.xml`, `robots.txt`.  
9. Perf/a11y: LCP/CLS budgets and WCAG 2.2 AA per [web/07](../../web/07-marketing.md).  
10. **Hold:** Next.js/Remix for marketing; Expo web; landing under `/admin`; “ship landing, pricing later.”  
11. Employer **console** CRUD remains not locked for v1; marketing CTAs may deep-link to login/store without implementing employer web ops.

## Consequences

### Positive

- Launch-quality public funnel (ASO + employer entry + legal + pricing)  
- Separates brand chrome from admin ops UI  
- Static edge path avoids Nest load for anonymous traffic  

### Negative / tradeoffs

- Third Vite app + prerender pipeline in CI  
- Legal copy must stay synced with `policies` versions  

### Follow-ups

- Exact `server_name` / DNS / store URLs with AO-10 + product (ask once)  
- Optional privacy-safe analytics only with consent — never fake beacons  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| MVP landing only; pricing/SEO later | **Reject** — gaps forbidden |
| CSR SPA without prerender | **Reject** — SEO/LCP bottleneck |
| Marketing via Nest `/` | **Reject** for prod path — NGINX static |
| Landing inside admin SPA | **Reject** — wrong chrome |
| Next.js marketing | **Reject** (Hold) — Vite + prerender |
