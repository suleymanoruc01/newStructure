# Web / admin notes

**Status:** `proposed` (aligned to architecture decisions)  
**Locked shape:** Admin **management panel** lives in the **same NestJS application** as the REST API and uses the **same domain services** — [ADR-0001](../backend/adr/0001-nestjs-modular-monolith.md).  
**Primary users:** Platform admins  
**Mobile-first product users:** Job seekers and employers use React Native; a separate employer **web console** is **not** a locked starting boundary (may revisit later).

Worker day-of flows (check-in, geo) stay **mobile-only**.

## How this folder relates

Screen catalogs below remain useful capability inventories from the case catalog. Treat **admin** screens as targets for the Nest-hosted admin panel. Treat **employer console** screens as optional / future unless product re-locks a web employer channel.

## Read order

| # | Doc | Purpose |
| --- | --- | --- |
| — | [Architecture decisions](../01-architecture-decisions.md) | Locked vs open |
| 01 | [Information architecture](01-information-architecture.md) | Sites, shells, nav |
| 02 | [Screen catalog index](02-screen-catalog.md) | Inventory |
| — | [Public & auth](screens/public-auth.md) | Landing, login, policies |
| — | [Employer console](screens/employer-console.md) | Not locked for v1 boundaries |
| — | [Admin console](screens/admin-console.md) | Nest admin panel targets |
| 03 | [Parity with mobile](03-parity-with-mobile.md) | Channel ownership |
| — | [Cases folder](../cases/) | Traceability |

## Conventions

See [`../shared/screen-conventions.md`](../shared/screen-conventions.md).

## Why admin exists in Nest

| Need | Why same Nest app |
| --- | --- |
| Abuse / user restrict | Same AuthZ + domain services as API |
| Catalog / remote config | One rule layer |
| Ops tooling | No duplicate backend |
