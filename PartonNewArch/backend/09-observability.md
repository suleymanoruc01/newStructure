# 09 — Observability & operations

**Status:** `proposed`  
**Last updated:** 2026-10-07

Detailed SLOs, capacity targets, and cloud-region ops remain **open** ([AO-4](../01-architecture-decisions.md)). This doc is a working minimum.

## Goals

Know when the API is healthy, why a request failed, and how case-test failures map to server logs.

## Health

| Endpoint | Meaning |
| --- | --- |
| `GET /health/live` | Process up |
| `GET /health/ready` | DB (and queue) reachable |

Readiness fails closed if PostgreSQL is down.

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

## Tracing

Optional OpenTelemetry later; start with request IDs end-to-end (RN header → API → worker).

## Environments & config

| Var (examples) | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `JWT_ACCESS_SECRET` | Access tokens |
| `JWT_REFRESH_SECRET` | Refresh tokens |
| `SMS_*` | Provider |
| `FCM_*` / `APNS_*` | Push |
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
