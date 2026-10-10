# 06 — REST API conventions

**Status:** `accepted` — shape locked with [ADR-0027](adr/0027-api-contracts-baseline.md) · [shared/12](../shared/12-api-contracts.md) · [agents/10](../agents/10-production-ready.md)  
**Last updated:** 2026-10-09  
**ADR:** [0004 — REST / JSON public API](adr/0004-rest-json-api.md)  
**Decisions:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

## Style (locked)

PartOn’s mobile ↔ backend contract is a **REST / JSON API** over HTTPS.

| Rule | Detail | Status |
| --- | --- | --- |
| Protocol | HTTPS | locked |
| Format | `application/json` (UTF-8) | locked |
| Base path | **`/api/v1`** | locked |
| Breaking changes | New major version path (`/api/v2`, …) | locked |
| Old-client support / sunset | Last **2** native releases; `X-API-Deprecated` on sunset | **accepted** (AO-12) |
| Shape | Resource-oriented URLs; plural nouns | **accepted** |
| Commands | State-machine actions as sub-resources (`POST .../accept`) | **accepted** |
| Schemas | Shared packages; backend validates at runtime before domain rules | locked |
| Client pre-check | Mobile may reuse schemas; never replaces server validation | locked |
| AuthZ / DB rules | Backend only — not in shared schemas | locked |
| Validation library | **Zod 4** in `packages/api-contracts` via nestjs-zod / Standard Schema | **accepted** — [ADR-0027](adr/0027-api-contracts-baseline.md) · [shared/12](../shared/12-api-contracts.md) |
| Response runtime validation | Optional in CI / client; server remains source of truth | accepted (optional) |
| Error format | `{ error: { code, message, details? }, meta }` | **accepted** — ADR-0027 |
| Pagination | Cursor for feeds; offset OK for admin | **accepted** — ADR-0027 |
| Documentation | `@nestjs/swagger` + Zod → OpenAPI | **accepted** — ADR-0027 |

Admin panel uses the **same Nest domain services**; it is not a second public API style.

## Baseline routes (v1 inventory)

Paths follow `/api/v1/...`. Canonical module map: [04-domain-modules.md](04-domain-modules.md).

```http
POST   /api/v1/auth/otp/request
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/token/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me
PATCH  /api/v1/workers/me
POST   /api/v1/employers
GET    /api/v1/branches
POST   /api/v1/branches/:branchId/jobs
GET    /api/v1/jobs/feed
GET    /api/v1/jobs/:jobId
POST   /api/v1/jobs/:jobId/applications
POST   /api/v1/applications/:id/accept
POST   /api/v1/shifts/:id/check-in
GET    /api/v1/notifications
```

## Versioning

- `/api/v1` for the first public major version
- Additive fields are non-breaking within a major
- Incompatible changes → `/api/v2`; support last **2** mobile native releases on `/api/v1` with `X-API-Deprecated` when sunsetting

## Request / response contract (`accepted` — ADR-0027)

Full catalog: [`../shared/12-api-contracts.md`](../shared/12-api-contracts.md).

| Topic | Default | Status |
| --- | --- | --- |
| Dates | ISO-8601 UTC | accepted |
| IDs | string UUIDs in JSON | accepted |
| Partial update | `PATCH` | accepted |
| Idempotency | `Idempotency-Key` on critical `POST`s | accepted |
| Success envelope | `{ "data", "meta" }` | accepted |
| Error envelope | `{ "error": { "code", "message", "details?" }, "meta" }` | accepted |
| Pagination | cursor for feeds; offset for admin lists | accepted |
| HTTP status map | 400/401/403/404/409/422/429/5xx | accepted |

## Auth header (`accepted`)

```http
Authorization: Bearer <access_token>
Accept-Language: tr-TR, tr;q=0.9, en;q=0.8
```

Refresh: `POST /api/v1/auth/token/refresh` (cookie on web; body/header per [18-auth-rbac](18-auth-rbac.md)). Never put refresh tokens in query strings or deep links.

## i18n (`accepted` baseline)

| Rule | Detail |
| --- | --- |
| Primary locale | **`tr-TR`** — [ADR-0023](adr/0023-i18n-turkish-primary.md) · [shared/07](../shared/07-i18n.md) |
| `error.code` | Stable English enum |
| `error.message` | Localized user text; default Turkish |
| Resolution | Profile locale → `Accept-Language` → `tr-TR` |

## Nest controller conventions

- Paths under `/api/v1`
- Validate inbound bodies/queries with **shared schemas** before use-cases run
- Guards enforce authN + authZ before handlers
- Controllers thin; domain services own rules (shared with admin)

## Correlation (`accepted`)

Every response includes `meta.requestId` and echo `X-Request-Id` — [ADR-0027](adr/0027-api-contracts-baseline.md) · [shared/12](../shared/12-api-contracts.md).

## Out of scope for the public REST API (v1)

| Approach | Status |
| --- | --- |
| GraphQL | Rejected (ADR-0004) |
| gRPC / gRPC-Web / Connect to clients | Rejected (ADR-0009) |
| Dual REST + gRPC public surfaces | Rejected while modular monolith |
| Client Firestore / BaaS SDK | Rejected |
| Separate worker HTTP API | Deferred |

See [`16-rest-vs-grpc.md`](16-rest-vs-grpc.md) for REST vs gRPC vs both.

## Related case groups

`CASE-UX`, `CASE-SECURITY`, `CASE-PERF`, `CASE-E2E` (acceptance still mapped via [`../cases/`](../cases/))
