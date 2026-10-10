# ADR-0035: Admin DevOps — error tracking & codebase ops

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0014](0014-web-ui-shadcn-dark.md) · [ADR-0034](0034-admin-full-case-coverage.md) · [ADR-0028](0028-latest-stable-stack.md) · [ADR-0036](0036-admin-devops-mcp.md) · [web/09-admin-devops.md](../../web/09-admin-devops.md) · [web/10-devops-mcp.md](../../web/10-devops-mcp.md) · [09-observability.md](../09-observability.md)

## Context

Platform ops need a first-class **DevOps** area inside Nest-hosted admin (`apps/admin`) to **track production/runtime errors across the codebase** (API, admin SPA, marketing, mobile clients) and to **manage deploy/release state** of those codebases. CASE-PERF and operability already require metrics; without an in-product error/release surface, teams rely on ad-hoc log grepping or external dashboards that agents never wire. “Manage codebase” must not mean editing source files in the browser (AuthZ/security risk).

## Decision

1. Web admin includes a **DevOps** nav section (`w.admin.devops.*`) — production-required, not optional.  
2. **Error tracking:** Capture and triage runtime errors from:
   - Nest API (exception filter → error store)  
   - Admin SPA + marketing SPA (client error reporter)  
   - Mobile (RN global handler → same ingest API)  
3. Errors are stored with: fingerprint, message, stack (redacted), `requestId`, release/git SHA, app (`api`|`admin`|`marketing`|`mobile`), platform, count, first/last seen, status (`open`|`resolved`|`ignored`). **No OTP, tokens, full phones, or document contents** in payloads (ADR-0010 / ADR-0018).  
4. **Codebase / release management (ops):** Admin shows deployed release per app (version + git SHA + built_at), links errors to releases, supports mark-deployed / rollback **notes** (actual deploy remains PM2/NGINX/Fastlane — ADR-0030/0031/0032).  
5. **Service health:** DevOps overview surfaces `/health/*`, queue lag, dependency status (Postgres, Redis when Stage B, FCM/SMS probe results where safe).  
6. Implementation: Nest `devops` (or `observability`) admin module + Postgres tables for events/releases; optional export to OTLP/Sentry-compatible sink — **UI SoR is PartOn admin**, not “open Sentry in another tab” as the only path.  
7. Access: role `admin` only; sensitive stacks masked for support-tier if introduced later.  
8. **Hold:** In-browser source-code editor, arbitrary shell, or CI secret management inside admin.

## Consequences

### Positive

- Single ops console for errors + releases + health  
- Aligns client + API failures with `requestId`  
- Clear agent scaffold for S8/S9  

### Negative / tradeoffs

- Additional storage/volume for error events (retention + sampling required)  
- Must keep PII redaction strict  

### Follow-ups

- Retention days for `error_events` (counsel/ops)  
- Sample rates for high-volume client noise  
- Optional vendor dual-write (Sentry/GlitchTip) once AO-10 lands  
- **DevOps MCP** for agents — [ADR-0036](0036-admin-devops-mcp.md)  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| External Sentry UI only | **Reject** as sole path — admin must have in-app DevOps |
| Logs-only (no error store) | **Reject** — no triage/fingerprint/release link |
| Edit git repo from admin | **Reject** — security |
| Mobile-only crash tool (Firebase Crashlytics alone) | **Reject** as sole path — unify ingest under Nest |
