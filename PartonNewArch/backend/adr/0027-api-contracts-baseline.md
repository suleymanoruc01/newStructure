# ADR-0027: API contracts baseline (envelope, Zod, pagination)

**Status:** Accepted  
**Date:** 2026-10-09  
**Deciders:** Eng / Architecture  
**Related:** [ADR-0004](0004-rest-json-api.md) · [ADR-0005](0005-monorepo.md) · [ADR-0023](0023-i18n-turkish-primary.md) · [shared/12-api-contracts.md](../../shared/12-api-contracts.md)

## Context

AO-6 (error envelope, pagination, docs) and AO-8 (validation library) stayed open while every other client/server concern hardened. Draft envelopes existed in roadmap/radar but were not binding, so implementers risk divergent shapes (`items` vs bare arrays, ad-hoc error strings, offset-only feeds).

## Decision

1. Adopt **[shared/12-api-contracts.md](../../shared/12-api-contracts.md)** as the REST contract baseline.
2. **Zod 4** in `packages/api-contracts`; Nest validates inbound before domain rules.
3. Success `{ data, meta }` · Error `{ error: { code, message, details? }, meta }`.
4. **Cursor** pagination for consumer feeds; offset allowed for admin.
5. Stable English `error.code`; localized `error.message` (tr-TR default).
6. OpenAPI via Nest + Zod. Idempotency-Key on critical POSTs.
7. Package name **`api-contracts`** (AO-7 package names fully closed with `shared-utils` + `design-tokens` in [ADR-0038](0038-monorepo-tooling.md)).

## Consequences

### Positive

- One client/server shape; codegen-friendly
- Closes AO-6 / AO-8 engineering defaults
- Aligns with i18n ADR-0023

### Negative / tradeoffs

- Migrating any early prototypes that used bare JSON
- Cursor encoding must be opaque and stable

### Follow-ups

- Expand error code enum per module as features land
- Client support: last **2** native releases; `X-API-Deprecated` on sunset (AO-12 **accepted**)

## Alternatives considered

| Option | Verdict |
| --- | --- |
| GraphQL errors / Relay connections | **Reject** — REST locked |
| Problem Details RFC 7807 only | **Reject** as sole shape — envelope keeps meta/requestId consistent |
| Yup / Joi | **Reject** — Zod matches TS inference + Nest 2026 ecosystem |
| Offset-only everywhere | **Reject** for feeds — unstable under inserts |
