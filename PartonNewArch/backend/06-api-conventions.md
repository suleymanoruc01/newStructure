# 06 — REST API conventions

**Status:** `accepted` (style + path); details below marked `proposed` / `open`  
**Last updated:** 2026-10-07  
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
| Old-client support / sunset | Policy TBD | `open` (AO-12) |
| Shape | Resource-oriented URLs; plural nouns | `proposed` |
| Commands | State-machine actions as sub-resources (`POST .../accept`) | `proposed` |
| Schemas | Shared packages; backend validates at runtime before domain rules | locked |
| Client pre-check | Mobile may reuse schemas; never replaces server validation | locked |
| AuthZ / DB rules | Backend only — not in shared schemas | locked |
| Validation library | **Proposed Zod 4** (shared package) via nestjs-zod / Standard Schema | `open` → proposed ([radar](../03-tech-radar-2026.md)) |
| Response runtime validation | Optional in CI / client; server remains source of truth | `open` (AO-8) |
| Error format | Envelope / codes — draft `{ error, meta }` | `open` → draft ([roadmap](../02-product-roadmap.md)) |
| Pagination | Cursor for feeds; offset OK for admin | `open` → draft |
| Documentation | **Proposed** `@nestjs/swagger` + Zod → OpenAPI | `open` → proposed |

Admin panel uses the **same Nest domain services**; it is not a second public API style.

## Illustrative routes (provisional)

Paths follow `/api/v1/...`. Resource list is **illustrative** until domain modules are named after feature scoping.

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

Module → resource sketch: [04-domain-modules.md](04-domain-modules.md) (names provisional).

## Versioning

- `/api/v1` for the first public major version
- Additive fields are non-breaking within a major
- Incompatible changes → `/api/v2` (and a later deprecation policy for `/api/v1`)

## Draft request / response notes (`proposed` / `open`)

These are working defaults for discussion — **not** locked (AO-6):

| Topic | Working default | Status |
| --- | --- | --- |
| Dates | ISO-8601 UTC | `proposed` |
| IDs | string UUIDs in JSON | `proposed` |
| Partial update | `PATCH` | `proposed` |
| Idempotency | `Idempotency-Key` on critical `POST`s | `proposed` |
| Success envelope | `{ "data", "meta" }` | `open` |
| Error envelope | `{ "error": { "code", "message", "details" }, "meta" }` | `open` |
| Pagination | cursor for feeds; offset for admin lists | `open` |
| HTTP status map | 400/401/403/404/409/429/5xx as usual | `proposed` |

## Auth header (`proposed`)

```http
Authorization: Bearer <access_token>
```

Refresh via a dedicated REST route (exact path TBD with auth module). Never put refresh tokens in query strings or deep links.

## Nest controller conventions

- Paths under `/api/v1`
- Validate inbound bodies/queries with **shared schemas** before use-cases run
- Guards enforce authN + authZ before handlers
- Controllers thin; domain services own rules (shared with admin)

## Correlation (`proposed`)

Prefer a request id on every response for support + logs (`X-Request-Id` and/or body meta) — finalize with AO-6.

## Out of scope for the public REST API (v1)

| Approach | Status |
| --- | --- |
| GraphQL | Rejected (ADR-0004) |
| gRPC / Connect to clients | Rejected |
| Client Firestore / BaaS SDK | Rejected |
| Separate worker HTTP API | Deferred |

## Related case groups

`CASE-UX`, `CASE-SECURITY`, `CASE-PERF`, `CASE-E2E` (acceptance still mapped via [`../cases/`](../cases/))
