# 01 — Architecture decisions (locked vs open)

**Status:** `accepted` (process)  
**Last updated:** 2026-10-07  
**Source:** partOn mimari kararları (team Q&A)

This file records **locked** starting decisions and **open** topics. Feature scope, detailed domain names, and deep API/security design follow after app boundaries and tooling are set.

> **Nest vs Next:** The source decision text names Nest.js for API + admin, then later says “Next.js” for the same modular monolith. PartonNewArch treats that as **NestJS** (API + admin in one Nest app). If the intent was literally Next.js, supersede [ADR-0001](backend/adr/0001-nestjs-modular-monolith.md) explicitly.

## Locked starting decisions

| Decision | Detail |
| --- | --- |
| Monorepo | One repository; mobile and backend as separate apps in different folders |
| Product | Mobile app matching part-time job seekers with employers |
| User groups (v1 product) | Job seekers (workers) and employers |
| Backend stack | **NestJS** for REST API **and** admin management panel |
| Deployable shape | API + admin run in the **same NestJS application** |
| Mobile | React Native (**bare**); targets **iOS and Android**; **Expo forbidden** |
| Market | Turkey only at start; cloud region **not** chosen yet |
| Language | TypeScript in mobile, backend, and shared packages |
| Database | PostgreSQL |
| Project size | Broad / comprehensive product over time |
| App boundaries | Two components: **mobile** and **backend** (API + admin) |
| Feature depth | Feature catalog later; **architecture boundaries and repo structure first** |
| Hosting | Cloud provider (vendor TBD) |
| Team size | Does not drive architecture choices at this stage |
| Background workers | **No** separate worker app/process at start; revisit when needed |
| Modular monolith | Backend organized as Nest modules; each domain owns rules + data access |
| Shared rules | REST API endpoints and admin panel use the **same** server-side business-rule layer |
| Module boundaries | Cross-module deps only through **explicit exports**; no reaching into internals |
| Client ↔ server | **REST API** only |
| API versioning path | `/api/v1/...`; breaking changes → new major (`/api/v2/...`) |
| Shared packages | Request/response schemas, derived TS types, platform-agnostic helpers |
| Backend-only | DB access, business rules, authorization, server secrets |
| Mobile-only | Screens, navigation, device operations |
| Mobile ↔ DB | Mobile **must not** depend on DB models; API contract only |
| Shared package safety | No backend-only code or secrets in shared packages |
| Validation | Backend validates requests at runtime with shared schemas; invalid requests rejected before domain rules |
| Client validation | Mobile **may** reuse the same schema rules pre-submit; never replaces server validation |
| Schema vs AuthZ | Shared schemas describe **data shape**; AuthZ and DB-state rules stay on the backend |

## Scalability requirement

| Topic | Stance |
| --- | --- |
| Design intent | Architecture should accommodate growing traffic and data volume |
| Long-term ambition | Serve on the order of millions of users |
| Capacity metric | Total user count alone is **not** the capacity measure; concurrent actives / RPS TBD |
| SLOs | Latency and availability targets **not** set yet |
| Proof | Load behavior validated by capacity planning and load tests — architecture choice ≠ guarantee under every load |
| Later decisions | Horizontal scaling, Postgres connection management, background jobs, cache, observability |

## Open architecture topics

| ID | Topic |
| --- | --- |
| AO-1 | Independent develop/deploy boundaries for mobile vs backend |
| AO-2 | ~~Expo vs bare~~ → **Accepted: bare RN only; Expo forbidden** — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md) |
| AO-3 | Separate worker process (deferred until need) |
| AO-4 | Target traffic, data volume, availability SLOs, deploy region |
| AO-5 | Domain module names, data model, authorization matrix (after feature scoping) |
| AO-6 | Detailed REST conventions (error envelope, pagination, docs) beyond path versioning |
| AO-7 | Shared package names and folder layout |
| AO-8 | Validation library and whether responses are validated at runtime |
| AO-9 | Mobile tooling, infra, deploy, and ops requirements |
| AO-10 | Cloud vendor |
| AO-11 | Whether branch **manager** is a first-class role or employer capability (case catalog has managers; product lock lists two user groups) |
| AO-12 | Support window for old mobile clients / API deprecation policy |

## Clarification order

1. App boundaries, monorepo layout, shared packages, deploy approach  
2. When features are scoped → domain modules, data model, detailed API/security  

## Roadmap & Sep 2026 proposals

Delivery plan: [`02-product-roadmap.md`](02-product-roadmap.md)  
Technology radar: [`03-tech-radar-2026.md`](03-tech-radar-2026.md)

These **propose** (do not silently lock) closures for several open items:

| Open ID | Proposed default (confirm in ADR / workshop) |
| --- | --- |
| AO-2 | **Locked:** bare React Native — Expo banned ([ADR-0006](backend/adr/0006-bare-react-native-no-expo.md)) |
| AO-7 | pnpm workspaces + Turborepo; `api-contracts` + `shared-utils` |
| AO-8 | Zod 4 shared schemas; Nest runtime validation before domain rules |
| AO-6 | `{ data, meta }` / `{ error, meta }` envelope + cursor feeds + OpenAPI from Nest |
| AO-3 | Keep in-process outbox until P4 load evidence |
| ADR-0003 | Prisma 7+ with Postgres driver adapter on PostgreSQL 18 |

## Related

- Product & runtime: [`00-product-and-stack.md`](00-product-and-stack.md)  
- Backend ADRs: [`backend/adr/`](backend/adr/)  
- REST notes: [`backend/06-api-conventions.md`](backend/06-api-conventions.md)  
- Shared packages: [`shared/`](shared/)  
