# 02 — Defaults & non-asks (freeze open forks)

**Status:** `accepted` for **agent implementation**  
**Last updated:** 2026-10-09  
**Purpose:** Remove clarifying questions. Agents **must** use these defaults until a human ADR supersedes them.

> Mark code with `// agent-default: <id>` or `<!-- agent-default: <id> -->` when applying a row below.

---

## 1. Never ask (locked)

Do **not** ask the user about:

- Expo vs bare RN → **bare RN** (ADR-0006)  
- Nest vs Next admin → **Nest + Vite shadcn** (ADR-0001/0014)  
- REST vs GraphQL/gRPC → **REST `/api/v1`** (ADR-0004/0009)  
- RabbitMQ vs BullMQ → **BullMQ Stage B**; outbox Stage A (ADR-0007)  
- ORM → **Prisma 7+** on PostgreSQL 18 (ADR-0002/0003)  
- Validation → **Zod 4 latest** in `api-contracts` (ADR-0027)  
- Framework versions → **latest stable** Nest **12** / TS **6** / Node LTS / bare RN (ADR-0028)  
- Auth → **Phone OTP + JWT**; refresh Keychain / HttpOnly (ADR-0011/0018)  
- Push → **FCM** + inbox; SSE foreground (ADR-0012/0013)  
- i18n → **tr-TR primary** (ADR-0023)  
- UI stacks → NativeWind + Liquid Glass principles; admin dark shadcn  
- Visual language → **[`DESIGN.md`](../DESIGN.md)** (ADR-0039) — cream/forest/orange; no purple-glow  

---

## 2. Product fork defaults (gap-*)

| ID | Agent default | Implement |
| --- | --- | --- |
| `gap-email-auth` | **Phone-only** v1; email routes/screens **not** built (Hold — do not fake email auth) | Skip T-002 UI |
| `gap-password` | **OTP-only**; no password set/reset | Skip T-008/T-248 |
| `gap-night-shift` | **Support** midnight-crossing windows (store UTC instants; UI shows local TR) | Matching + availability |
| `gap-3h-no-response` | After confirm window: notify employer + worker; **auto-release seat** after **30 minutes** no-response (config `AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES=30`) | shifts + notifications |
| `gap-application-snapshot` | **Freeze** worker profile snapshot JSON on apply | applications |
| `gap-overlap-apply` | **Soft warn** on apply if overlap; **hard block** second **accept** that overlaps | applications |
| `gap-payments` | v1: **admin/manual credit** that **writes the real ledger** + `TopUpProvider` wired to a **sandbox PSP** when env set (no fake success); pick Twilio-style sandbox or admin-credit-only until PSP chosen — still **fully functional** balance changes | tokens |
| `gap-wifi-location` | **GPS-only** for hard geofence; network location **not** used for pass/fail | location |
| `gap-documents` | Implement upload + typed docs + signed GET; MIME/size limits in config | workers |
| `gap-profile-demographics` | Store age/gender; job filters optional; validate ranges | workers + matching |
| `gap-firm-verification` | `verification_status`; **block publish** unless `verified` (or `bypass` in local/staging env) | employers + jobs |
| `gap-favorites-only-job` | Job flag + matching hard filter | jobs + matching |
| `gap-checkin-dispute` | Dispute + manual confirm APIs + screens | shifts |
| `gap-geofence-policy` | Radii per [13-location-policy](../backend/13-location-policy.md) | location |
| `gap-mock-gps` | Read Android mock flag; set `risk_score`; admin queue later | location + moderation |
| `gap-device-fingerprint` | Hash device id on auth; store for abuse signals | auth |
| `gap-bot-protection` | Rate limits on apply/OTP; CAPTCHA **Hold** until abuse evidence | auth + applications |
| `gap-ban-reentry` | Ban by phone (+ tax id when present); check at OTP verify | users + auth |
| `gap-profanity-filter` | Basic word-list filter on rating text; queue for admin | ratings |
| `gap-attendance-fraud` | Increment risk counters; expose admin list | moderation |

---

## 3. Architecture open-topic defaults (AO-*)

| ID | Agent default |
| --- | --- |
| AO-1 | Separate CI jobs: `mobile`, `backend`, `admin`, `marketing`, `packages` path filters |
| AO-marketing | **`apps/marketing` production-ready** — all `w.public.*` incl. pricing; prerender/SEO; no MVP gaps/bottlenecks — [web/07](../web/07-marketing.md) · ADR-0033 |
| AO-admin-cases | **Full admin matrix** for all 19 CASE-* groups — [web/08](../web/08-admin-case-coverage.md) · ADR-0034; not abuse-only |
| AO-devops | **Admin DevOps** in-app error tracking + releases/health for all apps — [web/09](../web/09-admin-devops.md) · ADR-0035; not Sentry-UI-only |
| AO-devops-mcp | **`apps/devops-mcp`** required — authenticated tools → Nest devops — [web/10](../web/10-devops-mcp.md) · ADR-0036 |
| AO-legal-audit | **Legal audit logger** + admin CSV/PDF reports required — [backend/22](../backend/22-legal-audit-logger.md) · [web/11](../web/11-legal-audit-reports.md) · ADR-0037; not DevOps errors; not app logs alone |
| AO-3 | Stage A outbox in-process until perf evidence; no separate worker process in P0–P2 |
| AO-4 | Use proposed SLOs in [05-quality-nfr](../05-quality-nfr.md) |
| AO-5 | Use module names in [04-domain-modules](../backend/04-domain-modules.md) as **final for v1** |
| AO-7 | **pnpm** + **Turborepo**; packages: `api-contracts`, `shared-utils`, `design-tokens` — [ADR-0038](../backend/adr/0038-monorepo-tooling.md) |
| AO-9 | Latest stable bare RN; Flipper optional off; ship `ios/` + `android/`; dual CI; **Fastlane** under `apps/mobile/fastlane/` — [mobile/06](../mobile/06-ios-android-platforms.md) · [mobile/07](../mobile/07-fastlane.md) · ADR-0029/0030 |
| AO-10 | Local/staging: Docker Compose Postgres (+ Redis optional). Cloud vendor: **do not block** — use Compose until human sets AO-10. Nest web: **PM2** + **NGINX** — [web/05](../web/05-pm2.md) · [web/06](../web/06-nginx.md) · ADR-0031/0032 |
| AO-11 | Manager is **first-class AuthZ role** with branch scope; ship manager tabs |
| AO-12 | Support last **2** mobile native releases; deprecate with response header `X-API-Deprecated` later |
| AO-13 | Eng controls on; **locked retention constants** from [17](../backend/17-privacy-kvkk-gdpr.md) / [22](../backend/22-legal-audit-logger.md) — **no TODOs**; supersede only via ADR |

---

## 4. Env & integrations (**no mocks** — see [08](08-no-mocks-fully-functional.md))

| Need | Agent default |
| --- | --- |
| SMS | Real sandbox provider (e.g. Twilio/Netgsm test) — **required**; boot fails if unset |
| FCM | Real Firebase project + HTTP v1 — **required**; boot fails if unset |
| Object storage | **MinIO** in Compose (real S3 API) or cloud bucket |
| JWT secrets | Generate into `.env` locally; document in `.env.example` |
| Admin auth | Same real OTP path; seed may insert user row but login still OTP |
| Missing creds | **Ask user once** for sandbox keys — **never** Noop/Console fallback |

---

## 5. When you may ask the user

Ask **only** if:

1. **Required sandbox credentials** (SMS, FCM, optional cloud storage) are missing — ask once, then wait; do not noop, or  
2. **Store / Fastlane secrets** (ASC API key, Play JSON, keystore, match) are missing when implementing upload lanes — ask once; build-only lanes may proceed, or  
3. **DevOps MCP / admin API credentials** for staging MCP are missing when wiring agent tools — ask once, or  
4. They asked to deploy to **production** and prod secrets are missing, or  
5. They explicitly ordered a change that **conflicts** with an ADR without saying “supersede”, or  
6. Destructive prod data action.

Otherwise: choose default → implement **fully functional** paths → mention briefly in the summary.

---

## Related

- Gap backlog: [`../cases/01-gap-backlog.md`](../cases/01-gap-backlog.md)  
- Decisions: [`../01-architecture-decisions.md`](../01-architecture-decisions.md)  
