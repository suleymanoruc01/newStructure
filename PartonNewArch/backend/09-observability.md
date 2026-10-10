# 09 — Observability & operations

**Status:** `proposed` (SLOs/vendor) · DevOps admin UI `accepted`  
**Last updated:** 2026-10-10  
**Admin DevOps:** [`../web/09-admin-devops.md`](../web/09-admin-devops.md) · [ADR-0035](adr/0035-admin-devops-error-tracking.md) · MCP [`../web/10-devops-mcp.md`](../web/10-devops-mcp.md) · [ADR-0036](adr/0036-admin-devops-mcp.md)

Detailed SLOs, capacity targets, and cloud-region ops remain **open** ([AO-4](../01-architecture-decisions.md)). This doc is a working minimum.

## Goals

Know when the API is healthy, why a request failed, and how case-test failures map to server logs. **Web admin DevOps** triages unified errors and releases for all PartOn codebases (API, admin, marketing, mobile).

## Health

| Endpoint | Meaning |
| --- | --- |
| `GET /health/live` | Process up |
| `GET /health/ready` | DB (and queue) reachable |

Readiness fails closed if PostgreSQL is down. When Stage B is enabled, also require Redis queue PING ([15-redis-management.md](15-redis-management.md)).

## Logging

- Structured JSON logs
- Fields: `requestId`, `userId` (if any), `route`, `latencyMs`, `errorCode`
- Never log OTP codes, access tokens, or full phone + code pairs
- Nest exception filter maps errors → stable codes + log severity

## Metrics (minimum)

- Request rate / latency / error rate by route
- OTP send / verify success ratio
- DB pool utilization
- Outbox / queue lag (when enabled)
- Redis queue: used memory, `evicted_keys` (must stay 0), connected clients, replication lag

## Tracing

OpenTelemetry → OTLP (Adopt on radar); start with request IDs end-to-end (RN header → API → worker). Correlate `requestId` with DevOps error events in admin.

## Error tracking (admin DevOps)

| Topic | Stance |
| --- | --- |
| UI | `w.admin.devops.errors.*` — in-app triage (not external-only) |
| Sources | Nest exception filter + admin/marketing/mobile reporters |
| Store | Postgres groups/events (+ optional vendor export) |
| Privacy | Redact OTP/tokens/phones/docs at ingest |
| Releases | Stamp `PARTON_RELEASE` / `PARTON_GIT_SHA`; show in `w.admin.devops.releases` |

Detail: [`../web/09-admin-devops.md`](../web/09-admin-devops.md) · ADR-0035.

## Environments & config

| Var (examples) | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `REDIS_QUEUE_URL` | Managed Redis for BullMQ (Stage B+) — TLS URL |
| `REDIS_CACHE_URL` | Optional separate cache Redis (eviction OK) |
| `JWT_ACCESS_SECRET` | Access tokens |
| `JWT_REFRESH_SECRET` | Refresh tokens |
| `SMS_*` | Provider |
| `FIREBASE_PROJECT_ID` + service account | FCM Admin SDK (HTTP v1) — [20](20-fcm-messaging.md) |
| APNs | Configured in Firebase console (iOS via FCM), not raw Nest APNs SDK |
| `LOG_LEVEL` | verbosity |

Use Nest `ConfigModule` with schema validation at boot.

## Deploy notes (high level)

- Run migrations before/at deploy, never after traffic hits new code that needs columns
- Rolling deploy with readiness gates
- Staging mirrors prod schema

## Case-test support

Staging seed profiles for WhatsApp / manual Parton runs:

- Worker ready to apply
- Employer with verified branch
- Manager scoped to that branch
- Open job within geo radius

Document seed IDs in a future `shared/fixtures.md`.

## Open questions

| ID | Question |
| --- | --- |
| OPS-1 | Hosting + managed Postgres vendor |
| OPS-2 | Log sink (CloudWatch, Axiom, Grafana Cloud, …) |
