# 12 — API contracts (envelope, errors, pagination, Zod)

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**ADR:** [0027 — API contracts baseline](../backend/adr/0027-api-contracts-baseline.md)  
**REST style:** [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md) · [ADR-0004](../backend/adr/0004-rest-json-api.md)  
**Closes:** AO-6 (envelope/pagination/errors), AO-8 (Zod validation) for engineering defaults  
**Package:** `packages/api-contracts` (AO-7 name locked here)

> Shared **contract rules** for REST `/api/v1`. Nest validates inbound with Zod; clients may pre-validate. AuthZ and DB-state rules stay on the server.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Validation | **Zod 4** schemas in `packages/api-contracts` |
| Nest wiring | nestjs-zod / Standard Schema — reject before domain |
| Success | `{ "data": T, "meta": Meta }` |
| Error | `{ "error": { "code", "message", "details?" }, "meta": Meta }` |
| `error.code` | Stable **English** enum |
| `error.message` | Localized (default **tr-TR**) |
| Feeds | **Cursor** pagination |
| Admin tables | Offset/limit OK |
| Idempotency | `Idempotency-Key` on critical POSTs |
| OpenAPI | `@nestjs/swagger` + Zod → OpenAPI |

---

## 1. Meta object

```json
{
  "requestId": "uuid",
  "timestamp": "2026-10-09T12:00:00.000Z"
}
```

Optional on success: `meta.pagination` (see §3). Always include `requestId` (correlate with `X-Request-Id`).

---

## 2. Success envelope

```json
{
  "data": { },
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

| Rule | Detail |
| --- | --- |
| Lists | `data` is array **or** `{ items: [], … }` — pick one per resource family and stick |
| Empty list | `200` + `data: []` (not 404) |
| Create | `201` + created resource in `data` |
| No body | `204` without envelope (DELETE where appropriate) |

---

## 3. Pagination

### Cursor (feeds, inbox, notifications)

```http
GET /api/v1/jobs/feed?cursor=eyJ…&limit=20
```

```json
{
  "data": [ ],
  "meta": {
    "requestId": "…",
    "timestamp": "…",
    "pagination": {
      "nextCursor": "eyJ…",
      "limit": 20
    }
  }
}
```

`nextCursor: null` → end. Default `limit` 20; max 50 (feeds) / 100 (admin).

### Offset (admin)

```http
GET /api/v1/admin/users?offset=0&limit=50
```

`meta.pagination`: `{ offset, limit, total? }` — `total` optional if expensive.

---

## 4. Error envelope

```json
{
  "error": {
    "code": "TOKEN_INSUFFICIENT",
    "message": "Yetersiz jeton bakiyesi.",
    "details": [ { "path": "headcount", "code": "TOO_SMALL" } ]
  },
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

| HTTP | When | Example codes |
| --- | --- | --- |
| **400** | Validation / bad input | `VALIDATION_FAILED` |
| **401** | Missing/invalid access | `UNAUTHORIZED`, `SESSION_EXPIRED` |
| **403** | Authenticated but forbidden | `FORBIDDEN`, `WRONG_CONTEXT` |
| **404** | Resource missing (after AuthZ) | `NOT_FOUND` |
| **409** | Conflict / state machine | `CONFLICT`, `ALREADY_APPLIED`, `HOLD_EXISTS` |
| **422** | Semantic rule fail (optional vs 409) | `PROFILE_INCOMPLETE`, `TOKEN_INSUFFICIENT` |
| **429** | Rate limit | `RATE_LIMITED` |
| **503** | Maintenance / dependency | `MAINTENANCE`, `UPSTREAM_UNAVAILABLE` |
| **5xx** | Unexpected | `INTERNAL_ERROR` |

Never put stack traces or SQL in `message`/`details` in production.

---

## 5. Stable error code catalog (v1 starter)

Extend in `packages/api-contracts` as enums; keep this table as human index.

| Code | Typical HTTP | Domain |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Shared |
| `UNAUTHORIZED` | 401 | Auth |
| `SESSION_EXPIRED` | 401 | Auth |
| `FORBIDDEN` | 403 | AuthZ |
| `WRONG_CONTEXT` | 403 | AuthZ / AS-3 |
| `NOT_FOUND` | 404 | Shared |
| `CONFLICT` | 409 | Shared |
| `ALREADY_APPLIED` | 409 | Applications |
| `APPLICATION_CLOSED` | 409 | Applications |
| `HOLD_EXISTS` | 409 | Tokens |
| `TOKEN_INSUFFICIENT` | 422 | Tokens |
| `EMPLOYER_UNVERIFIED` | 422 | Employers |
| `PROFILE_INCOMPLETE` | 422 | Workers |
| `OUTSIDE_GEOFENCE` | 422 | Check-in |
| `CHECKIN_WINDOW_CLOSED` | 422 | Check-in |
| `AVAILABILITY_REQUIRED` | 422 | 3h |
| `RATE_LIMITED` | 429 | Security |
| `MAINTENANCE` | 503 | Ops |
| `INTERNAL_ERROR` | 500 | Shared |

Domain modules add codes with `DOMAIN_SNAKE` naming; document in module deep-dive when non-obvious.

---

## 6. Zod package rules

| Rule | Detail |
| --- | --- |
| Location | `packages/api-contracts` |
| Export | Schemas + inferred types + error code enum |
| Forbidden | Prisma models, Nest providers, secrets |
| Versioning | Additive fields OK in v1; breaking → `/api/v2` + new schema namespace |
| Dates | ISO-8601 UTC strings |
| IDs | UUID strings in JSON |

---

## 7. Idempotency

| Rule | Detail |
| --- | --- |
| Header | `Idempotency-Key: <client-uuid>` |
| Scope | Critical POSTs: apply, accept, check-in, token top-up, OTP verify |
| Storage | Nest stores response for key+user TTL (e.g. 24h) |
| Mismatch | Same key + different body → `409 CONFLICT` |

---

## Related

- [ADR-0027](../backend/adr/0027-api-contracts-baseline.md)  
- i18n errors: [07-i18n](07-i18n.md)  
- Auth routes: [18-auth-rbac](../backend/18-auth-rbac.md)  
