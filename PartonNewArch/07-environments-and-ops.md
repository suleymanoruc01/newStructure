# 07 — Environments & operations

**Status:** `accepted` (ops patterns) · AO-10 cloud **vendor brand** still open (non-blocking)  
**Last updated:** 2026-10-10  
**Related:** [09-observability](backend/09-observability.md) · [15-redis](backend/15-redis-management.md) · [05-quality-nfr](05-quality-nfr.md) · [agents/10-production-ready](agents/10-production-ready.md)  
**Index:** [`DOC-INDEX.md`](DOC-INDEX.md)

> One Nest deployable (API + admin static) + bare RN clients + marketing. Ops patterns are **production-ready**. Cloud **vendor brand** (AO-10) does not block coding — use Compose + PM2 + NGINX.

---

## 1. Environments

| Env | Purpose | Data | Push / SMS |
| --- | --- | --- | --- |
| **local** | Dev | Docker Postgres (+ Redis if Stage B; **MinIO** for docs) | **Real SMS/FCM sandbox** — no Noop ([agents/08](agents/08-no-mocks-fully-functional.md)) |
| **ci** | Automated tests | Ephemeral Postgres | SMS/FCM **sandbox/test mode** (no Noop app providers) |
| **staging** | QA / E2E | Anonymized or synthetic | FCM staging project; SMS sandbox |
| **production** | Live | Real | FCM prod; SMS prod |

No shared credentials across envs. Staging must not point at prod FCM/SMS.

---

## 2. Deployable units

| Unit | Contents |
| --- | --- |
| `apps/backend` | Nest REST `/api/v1` + serves `apps/admin` static — **PM2** in staging/prod ([web/05](web/05-pm2.md) · ADR-0031) |
| `apps/admin` | Vite build artifact (served by Nest under PM2) |
| `apps/marketing` | Vite static marketing — NGINX www — [web/07](web/07-marketing.md) · ADR-0033 |
| `apps/mobile` | iOS/Android store builds (bare RN) via **Fastlane** — [mobile/07](mobile/07-fastlane.md) · ADR-0030 |
| Stage B workers | **Same** Nest codebase as worker process when promoted — not a separate domain app day-1 |

Mobile ≠ backend deploy cadence (AO-1 path filters / separate pipelines). CI invokes `bundle exec fastlane` for beta/release; local `run-ios` / `run-android` for debug.

**Web runtime:** staging/prod Nest via **PM2** (`ecosystem.config.cjs`, `pm2 reload`); edge **NGINX** TLS + reverse proxy ([web/06](web/06-nginx.md) · ADR-0032). Local still Nest watch. Default `instances: 1` until SSE affinity ([web/05](web/05-pm2.md)).

---

## 3. Runtime dependencies

| Dep | Role | Notes |
| --- | --- | --- |
| PostgreSQL 18 | SoR | Managed preferred; migrations via Prisma |
| Redis (Stage B) | BullMQ | Managed; `noeviction` + AOF; not cache-mixed |
| FCM | Push | HTTP v1 service account |
| SMS provider | OTP | Subprocessor register |
| Object storage | Documents | Signed URLs; private buckets |

---

## 4. Configuration

| Pattern | Stance |
| --- | --- |
| Secrets | Env / secret manager — never in git or shared packages |
| Config module | Nest `@nestjs/config` + schema validation at boot |
| Feature flags | Optional later; do not invent client-only flags for AuthZ |
| App config | Force-update / maintenance via admin-config endpoint |

Minimum env groups: `DATABASE_URL`, JWT secrets, SMS, Firebase, `REDIS_QUEUE_URL` (B), public app URLs for deep links.

---

## 5. Health & readiness

| Probe | Checks |
| --- | --- |
| `/health/live` | Process up |
| `/health/ready` | Postgres reachable (+ Redis if Stage B required) |
| Admin | Separate readiness not required if same process |

Ready failure → remove from LB. Do not bind readiness to FCM/SMS (degraded mode OK).

---

## 6. Observability (ops view)

| Signal | Use |
| --- | --- |
| Logs | Structured JSON; `requestId`; **PII redaction** |
| Traces | OpenTelemetry → vendor |
| Metrics | RPS, p95, 5xx, outbox lag, FCM fail, queue depth |
| Alerts | Error budget burn; outbox lag; OTP spike; queue stuck |

Detail: [`backend/09-observability.md`](backend/09-observability.md).

---

## 7. Backup & migrations

| Topic | Stance |
| --- | --- |
| DB backups | Managed automated + tested restore |
| Migrations | Expand/contract; no break `/api/v1` casually |
| Rollback | App rollback + forward-fix migrations preferred |
| Documents | Bucket versioning / lifecycle per privacy retention |

---

## 8. Incident basics

| Severity | Example | First response |
| --- | --- | --- |
| SEV-1 | Auth/OTP down; data loss risk | Page; maintenance flag if needed |
| SEV-2 | Push degraded; partial 5xx | Inbox path; retry outbox |
| SEV-3 | Single feature bug | Ticket; no silent AuthZ weaken |

Client security incidents: rotate JWT/refresh; revoke sessions — [21](backend/21-client-security.md).

---

## 9. Still open (non-blocking)

| ID | Topic |
| --- | --- |
| AO-10 | Cloud vendor **brand** + region — coding uses Compose + PM2 + NGINX |
| AO-4 | Contractual multi-AZ / RPO-RTO (eng SLO defaults already in [05](05-quality-nfr.md)) |

---

## Related

- System context: [`backend/02-system-context.md`](backend/02-system-context.md)  
- Testing: [`06-testing-strategy.md`](06-testing-strategy.md)  
- Mobile Fastlane: [`mobile/07-fastlane.md`](mobile/07-fastlane.md)  
- Web PM2: [`web/05-pm2.md`](web/05-pm2.md)  
- Web NGINX: [`web/06-nginx.md`](web/06-nginx.md)  
- Marketing: [`web/07-marketing.md`](web/07-marketing.md)  
- Admin DevOps: [`web/09-admin-devops.md`](web/09-admin-devops.md)  
- Privacy subprocessors: [`backend/17-privacy-kvkk-gdpr.md`](backend/17-privacy-kvkk-gdpr.md)  
