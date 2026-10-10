# 09 — Admin DevOps (errors & codebase ops)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0035 — Admin DevOps error tracking](../backend/adr/0035-admin-devops-error-tracking.md)  
**Observability:** [`../backend/09-observability.md`](../backend/09-observability.md)  
**Admin coverage:** [`08-admin-case-coverage.md`](08-admin-case-coverage.md) · [ADR-0034](../backend/adr/0034-admin-full-case-coverage.md)  
**Screens:** [`screens/admin-console.md`](screens/admin-console.md) · catalog [`02-screen-catalog.md`](02-screen-catalog.md)  
**Deploy:** [05-pm2](05-pm2.md) · [06-nginx](06-nginx.md) · [mobile/07-fastlane](../mobile/07-fastlane.md)  
**MCP:** [`10-devops-mcp.md`](10-devops-mcp.md) · [ADR-0036](../backend/adr/0036-admin-devops-mcp.md)

> **DevOps in web admin** tracks **all runtime/codebase errors** (API + admin + marketing + mobile) and **manages release/codebase ops** (deployed versions, health, triage). Not a source-code editor. AI agents use the **DevOps MCP** (same Nest SoR).

---

## Verdict

| Topic | Stance |
| --- | --- |
| Required? | **Yes** — production admin nav section |
| Errors | Unified ingest + triage UI for every PartOn app |
| Codebase manage | Releases, SHAs, health, error↔release — **not** in-browser git edit |
| Store | Postgres-backed events (Nest admin APIs); optional OTLP/vendor export |
| Privacy | PII/secrets redacted at ingest |
| Access | `admin` role only |
| Agent access | **MCP required** — [`10-devops-mcp.md`](10-devops-mcp.md) · ADR-0036 |

---

## 1. Screens (`w.admin.devops.*`)

| ID | Route | Purpose | Cases |
| --- | --- | --- | --- |
| `w.admin.devops.overview` | `/devops` | Error rate, open issues, unhealthy deps, latest releases | `CASE-PERF`, operability |
| `w.admin.devops.errors.list` | `/devops/errors` | Fingerprinted issues; filter by app/release/status | `CASE-PERF`, `CASE-SECURITY` (no PII leak) |
| `w.admin.devops.errors.detail` | `/devops/errors/:fingerprint` | Stack, samples, `requestId`s, assign, resolve/ignore | same |
| `w.admin.devops.releases` | `/devops/releases` | Per-app version, git SHA, built_at, environment | deploy ops |
| `w.admin.devops.services` | `/devops/services` | Live/ready, Postgres, Redis, queue lag, SMS/FCM probe status | `CASE-PERF` |
| `w.admin.devops.clients` | `/devops/clients` | Mobile/admin/marketing min versions; crash/error rates by build | AO-12 force-update ties |

All **P0**. Recipe **R7**. Specs in [`screens/admin-console.md`](screens/admin-console.md).

---

## 2. Error ingest (all codebases)

| Source | How |
| --- | --- |
| Nest API | Global exception filter → `DevopsErrorsService.capture` (5xx + unexpected) |
| Admin SPA | `window.onerror` / React error boundary → `POST /api/v1/admin/devops/errors` |
| Marketing | Same client reporter (public endpoint rate-limited **or** only staging; prod marketing may use beacon to admin ingest with origin allowlist) |
| Mobile | RN `ErrorUtils` / global handler → authenticated or signed ingest |

Payload (Zod in `api-contracts`): `app`, `release`, `platform`, `message`, `stack` (truncated), `fingerprint` (client hint optional), `requestId`, `extra` (allowlisted keys only).

**Never ingest:** OTP, JWT, refresh cookies, full phone, document bytes, password fields.

---

## 3. Codebase / release management

| Capability | In admin | Outside admin |
| --- | --- | --- |
| See deployed SHA/version per app | ✅ `w.admin.devops.releases` | — |
| Register release on deploy | ✅ CI calls Nest admin API or writes row | Fastlane / PM2 / NGINX perform deploy |
| Rollback note / pin known-bad release | ✅ | Actual rollback = redeploy prior artifact |
| Edit source files | ❌ Hold | Git hosting |
| CI secrets / SSH | ❌ Hold | Secret manager |

Build pipeline stamps `PARTON_RELEASE` + `PARTON_GIT_SHA` into API env and client bundles.

---

## 4. Nest module sketch

```text
modules/devops/
  devops.module.ts
  errors.controller.ts      # admin list/detail/resolve + ingest
  releases.controller.ts
  services.controller.ts    # aggregates health
  errors.service.ts
  redaction.ts
```

Tables (illustrative): `devops_error_groups`, `devops_error_events`, `devops_releases`. Retention configurable; default sample noisy client errors.

---

## 5. Agent rules

1. Scaffold DevOps screens + Nest module + **`apps/devops-mcp`** in **S8** (with admin matrix).  
2. Wire Nest exception filter and admin/mobile reporters — **fully functional**, no Console-only sink ([agents/08](../agents/08-no-mocks-fully-functional.md)).  
3. Ground screen IDs and MCP tool names in docs before coding.  
4. Do not build a web IDE or shell into admin.  
5. Ask once for error-vendor dual-write or MCP admin credentials — never stub success.

---

## 6. DoD

- [ ] All six `w.admin.devops.*` screens in catalog + implemented  
- [ ] API + admin SPA + mobile errors appear in triage UI  
- [ ] Releases show SHA/version per app  
- [ ] Services page reflects real health/deps  
- [ ] **DevOps MCP** tools work against Nest ([10](10-devops-mcp.md))  
- [ ] PII redaction tests  
- [ ] Linked from admin nav + dashboard  

---

## Related

- [ADR-0035](../backend/adr/0035-admin-devops-error-tracking.md)  
- MCP: [`10-devops-mcp.md`](10-devops-mcp.md) · [ADR-0036](../backend/adr/0036-admin-devops-mcp.md)  
- Observability: [`../backend/09-observability.md`](../backend/09-observability.md)  
- Admin case coverage: [`08-admin-case-coverage.md`](08-admin-case-coverage.md)  
- Perf UI: `w.admin.perf.metrics` (metrics charts; DevOps owns **errors/releases**)  
