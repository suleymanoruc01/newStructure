# 01 — Backend overview

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**Application architecture:** [`../04-application-architecture.md`](../04-application-architecture.md)  
**Decisions:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

## Mission

Provide a single NestJS application that:

- Owns PartOn business rules (shared by **REST API** and **admin panel**)
- Persists all authoritative state in PostgreSQL
- Serves the bare React Native client over versioned **REST / JSON** (`/api/v1`)
- Stays mappable to Parton case groups for acceptance when features are built

This overview is the **backend slice** of the platform architecture. For C4 views, client boundaries, and the PR review checklist, use [`../04-application-architecture.md`](../04-application-architecture.md).

## Architectural style

**Modular monolith** (not microservices) — [ADR-0001](adr/0001-nestjs-modular-monolith.md).

| Pillar | ADR / doc |
| --- | --- |
| Nest API + admin, one deployable | [0001](adr/0001-nestjs-modular-monolith.md) |
| PostgreSQL system of record | [0002](adr/0002-postgresql-owned-db.md) |
| REST `/api/v1` public edge | [0004](adr/0004-rest-json-api.md), [0009](adr/0009-rest-vs-grpc.md) |
| Monorepo | [0005](adr/0005-monorepo.md) |
| Async Stage B = BullMQ + managed Redis | [0007](adr/0007-bullmq-over-rabbitmq.md), [0008](adr/0008-managed-redis.md) |
| Privacy — KVKK primary, GDPR-ready | [0010](adr/0010-privacy-kvkk-gdpr.md), [17](17-privacy-kvkk-gdpr.md) |
| AuthN + RBAC + resource scope | [0011](adr/0011-auth-rbac.md), [18](18-auth-rbac.md) |
| FCM mobile push + inbox/outbox | [0013](adr/0013-fcm-push.md), [20](20-fcm-messaging.md) |
| SSE foreground realtime | [0012](adr/0012-sse-foreground-realtime.md), [19](19-sse.md) |
| Admin Web UI shadcn/ui dark | [0014](adr/0014-web-ui-shadcn-dark.md), [web/04](../web/04-shadcn-dark-ui.md) |
| Mobile UI NativeWind | [0015](adr/0015-mobile-ui-nativewind.md), [mobile/04](../mobile/04-nativewind-ui.md) |
| Mobile Liquid Glass / WWDC | [0016](adr/0016-mobile-ui-wwdc-liquid-glass.md), [mobile/05](../mobile/05-wwdc-liquid-glass.md) |
| Shared color tokens | [0017](adr/0017-color-system.md), [shared/01](../shared/01-color-system.md) |

Nest organizes the app as a graph of modules: each module encapsulates REST controllers (and admin surfaces as needed), providers, and exports a public surface for other modules. Cross-module access only through `exports` + `imports` — never by reaching into another module’s internals. Detail: [`03-modular-monolith.md`](03-modular-monolith.md).

Why monolith first:

- Domain is tightly coupled (job → apply → match → check-in → rate)
- API and admin must share one rule layer
- Separate worker process deferred until need is proven
- Clear module boundaries still allow a future extract if measured demand appears

## Design principles

| Principle | Practice |
| --- | --- |
| Domain modules | One Nest module per bounded context (names finalize with feature scope) |
| Thin REST controllers | Validate with shared schemas + map HTTP; services own use-cases |
| Same rules for admin | Admin UI calls domain services; no parallel business logic |
| Explicit exports | Cross-module access only through exported providers |
| DB ownership | Schema + migrations in-repo; mobile never imports models |
| AuthN / AuthZ at edge | OTP + JWT; RolesGuard + branch/org scope; domain asserts — [18](18-auth-rbac.md) |
| Privacy-by-design | Minimization, notices/acceptances, DSR/retention (KVKK); no PII in logs/jobs |
| Outbox first | Side effects after commit; BullMQ only at Stage B |
| Case linkage | When implementing features, note related `CASE-*` groups |

## Backend document map

| Topic | Doc |
| --- | --- |
| System context | [02](02-system-context.md) |
| Module layout | [03](03-modular-monolith.md) |
| Domain catalog | [04](04-domain-modules.md) |
| Data / Postgres | [05](05-data-layer.md) |
| REST conventions | [06](06-api-conventions.md) |
| Auth & security | [07](07-auth-security.md) |
| Async / outbox / queues | [08](08-async-events.md) |
| Observability | [09](09-observability.md) |
| Legacy Firebase map | [10](10-legacy-firebase-mapping.md) |
| Tokens / matching / location | [11](11-tokens-and-provision.md) · [12](12-matching-rules.md) · [13](13-location-policy.md) |
| BullMQ vs RabbitMQ | [14](14-bullmq-vs-rabbitmq.md) |
| Redis management | [15](15-redis-management.md) |
| REST vs gRPC | [16](16-rest-vs-grpc.md) |
| ADR log | [adr/](adr/) |

## Quality bars (backend v1)

- TypeScript strict mode  
- Inbound validation via **shared Zod 4 schemas** before domain rules — [ADR-0027](adr/0027-api-contracts-baseline.md) · [shared/12](../shared/12-api-contracts.md)  
- Unit tests for domain services; e2e HTTP tests for auth + critical paths  
- Migrations required for every schema change  
- No Firebase Admin SDK as system of record  
- No gRPC/GraphQL public edge; no Expo in the mobile app  

## Out of scope until later decisions

- Concrete cloud vendor / region (AO-10)  
- Exact SMS vendor  
- Full ERD (after feature + domain workshops)  
- Separate worker process (after Stage B evidence)  

## Open questions

| ID | Question | Status |
| --- | --- | --- |
| BQ-1 | Monorepo | **Accepted** — [ADR-0005](adr/0005-monorepo.md) |
| BQ-2 | Prisma vs TypeORM | **Accepted** Prisma latest stable — [ADR-0003](adr/0003-orm-choice.md) |
| BQ-3 | Redis day-1 | **No** — Stage B only; managed Redis when introduced — [ADR-0008](adr/0008-managed-redis.md) |
| BQ-4 | Admin UI presentation | **Accepted** — Vite + shadcn/ui dark — [ADR-0014](adr/0014-web-ui-shadcn-dark.md) |
| BQ-5 | Monorepo tool | **Accepted** pnpm + Turborepo — [ADR-0038](adr/0038-monorepo-tooling.md) |
