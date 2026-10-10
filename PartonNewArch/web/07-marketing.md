# 07 — Marketing site (public web) — production-ready

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0033 — Marketing site](../backend/adr/0033-marketing-site.md)  
**Screens:** [`screens/public-auth.md`](screens/public-auth.md) · catalog [`02-screen-catalog.md`](02-screen-catalog.md)  
**UI:** [`../DESIGN.md`](../DESIGN.md) · [shared/09](../shared/09-modern-ui-principles.md) · [shared/01 colors](../shared/01-color-system.md) · [ADR-0025](../backend/adr/0025-modern-ui-principles.md) · [ADR-0039](../backend/adr/0039-design-md.md)  
**Edge:** [06-nginx.md](06-nginx.md) · **i18n:** [shared/07](../shared/07-i18n.md) · **a11y:** [shared/06](../shared/06-accessibility-wcag.md)  
**NFRs:** [`../05-quality-nfr.md`](../05-quality-nfr.md)

> Public **marketing** is a **production** surface — **not** an MVP stub. Ship **all** catalogued `w.public.*` screens with SEO, performance, a11y, and deploy path complete. **No intentional gaps. No known bottlenecks left unaddressed.**

---

## Verdict

| Topic | Stance |
| --- | --- |
| Bar | **Production-ready** — not MVP / not “soft-launch stub” |
| Gaps | **Forbidden** — every `w.public.*` catalog row ships; no “P2 later” for this site |
| Bottlenecks | **Forbidden** — static NGINX + prerender; no Nest-on-critical-path; no crawl-blind SPA |
| App | `apps/marketing` (Vite React TS) |
| Chrome | Brand surface — **not** admin dark shadcn shell |
| Host | NGINX static on `www` / apex |
| i18n | `tr-TR` primary; `en` secondary strings where cataloged |
| Banned | Next.js; landing inside `/admin`; Expo web; placeholder CTAs; “TODO pricing” |

---

## 1. Screens — full catalog (no deferrals)

| Screen ID | Route | Ship | Notes |
| --- | --- | --- | --- |
| `w.public.landing` | `/` | **Required** | Brand-first hero; dual CTAs; sections; footer |
| `w.public.pricing` | `/pricing` | **Required** | Token / provision explainer — `CASE-TOKEN` |
| `w.public.legal.privacy` | `/legal/privacy` | **Required** | Versioned copy aligned with `policies` |
| `w.public.legal.terms` | `/legal/terms` | **Required** | Versioned copy aligned with `policies` |

Do not invent new `w.public.*` IDs without catalog + this table. Do not ship marketing “done” with any row missing.

Footer / chrome (all pages): legal links, store badges, language switch if `en` present, contact email if product provides (ask once — do not invent address).

---

## 2. First viewport (landing)

- One composition (not a dashboard)  
- Brand as hero-level signal  
- Brand + one headline + one short sentence + one CTA group + one dominant visual  
- No card collage, stat strips, or floating promo badges on the hero  
- Avoid AI-generic purple glow / cream-terracotta clichés ([shared/09](../shared/09-modern-ui-principles.md))  

| CTA | Audience | Production rule |
| --- | --- | --- |
| Uygulamayı indir (iOS + Android) | Workers | Real store URLs from env/config — **no** `#` stubs |
| İşveren girişi | Employers | Real login URL (console or deep link) — **no** fake AuthZ |

---

## 3. Anti-gap / anti-bottleneck rules

| Risk | Required mitigation |
| --- | --- |
| Crawl-blind CSR SPA | **Prerender / SSG** all public routes at build (e.g. vite-ssg or equivalent) — HTML must contain content for bots |
| Marketing via Nest | **Forbidden** on prod path — NGINX static only ([06](06-nginx.md)) |
| Uncached assets | NGINX `expires` / `Cache-Control` for hashed assets; HTML short/no-cache |
| Huge JS | Route-level code split; no admin/Nest client deps |
| Slow LCP | Optimized hero image (modern format + dimensions); font subset; critical CSS discipline |
| Missing SEO | Per-route `title`, `description`, Open Graph, canonical; `sitemap.xml` + `robots.txt` in `dist` |
| Legal drift | Build-time or documented sync with Nest `policies` versions — stale legal = gap |
| A11y debt | WCAG 2.2 AA on all marketing pages — labels, contrast, keyboard, focus |
| i18n holes | Every UI string keyed; `tr-TR` complete before release |
| Stub analytics | Either real privacy-safe analytics + consent, or **none** — no fake beacons |
| Single-platform store | Both iOS **and** Android badges (ADR-0029) |

Agents may **not** mark the marketing slice complete with “MVP enough” or deferred pricing/SEO/prerender.

---

## 4. Performance budgets (engineering targets)

Align with [`05-quality-nfr`](../05-quality-nfr.md); marketing-specific:

| Metric | Target (lab / staging) |
| --- | --- |
| LCP (landing, mid-tier mobile) | ≤ **2.5s** |
| CLS | ≤ **0.1** |
| Initial JS (gzip, route `/`) | Keep lean — fail review if admin/app bundles leak in |
| TTFB (static via NGINX) | Dominated by edge/static — not Nest |

CI: Lighthouse (or equiv.) on prerendered landing + pricing in staging; axe/a11y smoke on all four routes.

---

## 5. Layout in monorepo

```text
apps/marketing/
  index.html
  public/
    robots.txt
    # sitemap generated at build
  src/
    app/                 # React Router + prerender entry
    pages/               # landing, pricing, legal/*
    components/
    i18n/
  dist/                  # prerendered static → NGINX www root
```

Share **design-tokens** only. Do **not** import admin AuthZ, Prisma, or Nest modules.

---

## 6. NGINX (production)

```text
server_name www…;   # per env — ask once; do not invent prod DNS
root …/parton-marketing;   # apps/marketing/dist
try_files $uri $uri/ /index.html;   # SPA fallback only for client nav; prerendered files preferred

# hashed assets: long cache
# index.html / legal HTML: short cache or must-revalidate
```

Deploy: `pnpm --filter marketing build` (prerender) → sync `dist` → `nginx -t && reload`. Same release train as soft/public launch — not a follow-up ticket.

---

## 7. Agent rules

1. Scaffold + **complete** `apps/marketing` in S2 — production DoD, not stubs.  
2. Implement **all** `w.public.*` rows including **pricing**.  
3. Enable **prerender/SSG** before calling SEO done.  
4. Ground screen IDs in [`screens/public-auth.md`](screens/public-auth.md).  
5. No Next.js; no marketing under `/admin`.  
6. Ask once for store URLs, employer login URL, contact email, `server_name` — never stub.  
7. If a catalog public screen is missing implementation → **gap** → do not close the slice.

---

## 8. Production DoD (marketing)

- [ ] All four `w.public.*` routes live and linked  
- [ ] Prerendered HTML for each route (view-source shows content)  
- [ ] `robots.txt` + `sitemap.xml`  
- [ ] Per-route meta / OG / canonical  
- [ ] Real store + employer login CTAs (env-configured)  
- [ ] Legal pages version-aligned with `policies`  
- [ ] WCAG 2.2 AA  
- [ ] `tr-TR` complete; no hardcoded UI copy  
- [ ] NGINX www serves `dist` with asset caching  
- [ ] Lighthouse/a11y smoke in CI or documented staging run  
- [ ] No secrets in bundle; no fake analytics  

---

## Related

- [ADR-0033](../backend/adr/0033-marketing-site.md)  
- Public screens: [`screens/public-auth.md`](screens/public-auth.md)  
- IA: [`01-information-architecture.md`](01-information-architecture.md)  
- NGINX: [`06-nginx.md`](06-nginx.md)  
- Admin (separate): [`04-shadcn-dark-ui.md`](04-shadcn-dark-ui.md)  
- NFR: [`../05-quality-nfr.md`](../05-quality-nfr.md)  
