# 01 — Backend overview

**Status:** `accepted`  
**Last updated:** 2026-10-07  
**Decisions:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

## Mission

Provide a single NestJS application that:

- Owns PartOn business rules (shared by **REST API** and **admin panel**)
- Persists all authoritative state in PostgreSQL
- Serves the React Native client over versioned **REST / JSON** (`/api/v1`)
- Stays mappable to Parton case groups for acceptance when features are built

## Architectural style

**Modular monolith** (not microservices) — [ADR-0001](adr/0001-nestjs-modular-monolith.md), REST — [ADR-0004](adr/0004-rest-json-api.md), monorepo — [ADR-0005](adr/0005-monorepo.md).

Nest organizes the app as a graph of modules: each module encapsulates REST controllers (and admin surfaces as needed), providers, and exports a public surface for other modules. Cross-module access only through `exports` + `imports` — never by reaching into another module’s internals.

Why monolith first:

- Domain is tightly coupled (job → apply → match → check-in → rate)
- API and admin must share one rule layer
- Separate worker process deferred until need is proven
- Team size is not the driver; clear module boundaries still allow later extract

## Design principles

| Principle | Practice |
| --- | --- |
| Domain modules | One Nest module per bounded context (names finalize with feature scope) |
| Thin REST controllers | Validate with shared schemas + map HTTP; services own use-cases |
| Same rules for admin | Admin UI calls domain services; no parallel business logic |
| Explicit exports | Cross-module access only through exported providers |
| DB ownership | Schema + migrations in-repo; mobile never imports models |
| AuthZ at edge | Guards/policies on mutating routes and admin actions |
| No day-1 worker app | Prefer in-process / outbox; add worker when load requires it |
| Case linkage | When implementing features, note related `CASE-*` groups |

## Quality bars (backend v1)

- TypeScript strict mode
- Inbound validation via **shared schemas** before domain rules (library `open` — AO-8)
- Unit tests for domain services; e2e HTTP tests for auth + critical paths
- Migrations required for every schema change
- No Firebase Admin SDK as system of record

## Out of scope until later decisions

- Concrete cloud vendor / region
- Exact SMS vendor
- Full ERD (after feature + domain workshops)
- Separate worker / queue productization
- Error envelope, pagination, OpenAPI policy (AO-6)

## Open questions

| ID | Question | Status |
| --- | --- | --- |
| BQ-1 | Monorepo | **Accepted** — [ADR-0005](adr/0005-monorepo.md) |
| BQ-2 | Prisma vs TypeORM | See [ADR-0003](adr/0003-orm-choice.md) |
| BQ-3 | Redis / cache day-1 | Open (scalability follow-ups) |
| BQ-4 | Admin UI presentation (SPA served by Nest, AdminJS, …) | Open |
| BQ-5 | Monorepo tool (pnpm / Nx / Turborepo) | Open (AO-7) |
