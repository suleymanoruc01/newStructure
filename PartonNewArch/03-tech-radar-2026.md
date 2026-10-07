# 03 — Technology radar (September 2026 baseline)

**Status:** `proposed`  
**As-of:** 2026-09 (reviewed 2026-10-07)  
**Scope:** Choices that fit PartOn’s **locked** boundaries (monorepo, Nest modular monolith API+admin, **bare** RN — **no Expo**, Postgres, REST `/api/v1`, no day-1 worker).

Radar rings (ThoughtWorks-style):

| Ring | Meaning |
| --- | --- |
| **Adopt** | Default for PartOn greenfield; use unless blocked |
| **Trial** | Use in a spike / one module; promote after evidence |
| **Assess** | Watch; do not bet the platform yet |
| **Hold** | Avoid for PartOn v1–v2 |

## Snapshot

```text
                    ADOPT
         ┌─────────────────────────┐
         │ NestJS 11 · Postgres 18 │
         │ Bare React Native       │
         │ pnpm + Turborepo        │
         │ Zod 4 shared contracts  │
         │ Prisma 7+ · OTel        │
         │ @nestjs/swagger OpenAPI │
         └───────────┬─────────────┘
                     │
         TRIAL       │      ASSESS
    ┌────────────────┼────────────────┐
    │ Fastify adapter│ Nest 12 line    │
    │ PgBouncer      │ Prisma 8        │
    │ BullMQ worker  │ RN New Arch flag│
    │ Maestro E2E    │ Drizzle/Kysely  │
    └────────────────┴────────────────┘
                     │
                   HOLD
         Expo / EAS / Expo Router
         GraphQL · microservices day-1
         Firebase as SoR
         class-validator-only DTOs
```

---

## Platforms & runtimes

| Tech | Ring | Rationale (Sep 2026) |
| --- | --- | --- |
| **Node.js ≥ 20** (22 LTS preferred) | Adopt | NestJS 11+ dropped Node 16/18 |
| **TypeScript 5.x** (stay on 5.x until Nest confirms TS 6 decorator safety) | Adopt | Nest still relies on `experimentalDecorators` + `emitDecoratorMetadata` |
| **NestJS 11.x** | Adopt | Current stable modular monolith; Express 5 / Fastify 5 capable; JSON logger improvements |
| NestJS 12.x line | Assess | Appearing in docs indexes; wait for team migration guide + swagger/zod ecosystem before jumping mid-MVP |
| **PostgreSQL 18** | Adopt | `uuidv7()`, async I/O, skip-scan B-tree — ideal for feed/job indexes and time-ordered IDs |
| Redis | Trial | Not day-1; introduce for rate-limit/cache/queue when metrics justify |

## Monorepo & DX

| Tech | Ring | Rationale |
| --- | --- | --- |
| **pnpm workspaces** | Adopt | Fast installs; `workspace:*` for contracts; use `node-linker=hoisted` (or hoist `reflect-metadata`) so Nest DI + bare RN Metro coexist |
| **Turborepo** | Adopt | Task graph, remote cache, `dependsOn: ["^build"]` for compiled shared packages Nest needs |
| Nx | Assess | Powerful; heavier than needed for 2 apps + few packages |
| Compiled `packages/*` → CJS/ESM dual | Adopt | Nest `tsc` cannot consume raw TS from `node_modules`; build contracts before API |

Closes **AO-7** as a strong proposed default.

## API & contracts

| Tech | Ring | Rationale |
| --- | --- | --- |
| **REST `/api/v1`** | Adopt | Locked (ADR-0004) |
| **Zod 4** in `packages/api-contracts` | Adopt | Single schema source for mobile pre-check + Nest runtime validation |
| **nestjs-zod** / Standard Schema → OpenAPI | Adopt | Keeps DTO validation and Swagger aligned; Nest swagger gaining Standard Schema converters |
| **@nestjs/swagger** | Adopt | Official OpenAPI generation for mobile codegen |
| class-validator as sole contract | Hold | Duplicates schemas; worse for shared mobile packages |
| GraphQL / tRPC / gRPC to clients | Hold | Explicitly rejected for public API |

Closes **AO-6 / AO-8** as proposed defaults (envelope/pagination still finalize in conventions workshop).

### Proposed contract defaults (workshop → lock)

```http
Authorization: Bearer <access_jwt>
Idempotency-Key: <uuid>   # apply, check-in, token ops
X-Request-Id: <uuid>
```

```json
{ "data": {}, "meta": { "requestId": "…", "nextCursor": null } }
{ "error": { "code": "STRING_CODE", "message": "…", "details": {} }, "meta": { "requestId": "…" } }
```

## Data access

| Tech | Ring | Rationale |
| --- | --- | --- |
| **Prisma ORM 7+** | Adopt | Rust-free engine, driver adapters (`@prisma/adapter-pg`), project-local generated client — NestJS 11 friendly |
| Prisma 8 (TS-native rewrite) | Assess | Emerging “current” line mid-2026; keep 7 as MVP SoR until migration playbook is boring |
| TypeORM 0.3 | Assess | Fine Nest fit; weaker schema-first story for PartOn |
| Drizzle / Kysely | Assess | Great SQL control; more boilerplate early |
| PostGIS | Trial | Enable when radius queries outgrow lat/lng math |
| Firebase / Firestore as system of record | Hold | Locked away (ADR-0002) |

## Mobile

| Tech | Ring | Rationale |
| --- | --- | --- |
| **Bare React Native** (CLI / community init, owned `ios/` + `android/`) | Adopt | **Locked** — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md) |
| **React Navigation** | Adopt | Standard nav for bare RN (no Expo Router) |
| RN New Architecture (Fabric/TurboModules) via RN flags | Trial | Optional; enable when native deps are ready — **without** Expo |
| Fastlane / Xcode Cloud / Gradle CI for store builds | Adopt | Replace any EAS-shaped release thinking |
| Detox or Maestro against bare builds | Trial | Journey 1 smoke on CI |
| **Expo SDK / Expo Go / EAS / Expo Router / expo-updates** | **Hold** | Hard ban — do not adopt |

**AO-2 closed:** bare RN only; Expo forbidden.

## Admin UI (same Nest app)

| Tech | Ring | Rationale |
| --- | --- | --- |
| Nest-served SPA (React + Vite) or AdminJS | Trial | Must call domain services; pick in P0 spike (BQ-4) |
| Separate Next.js admin app | Hold (v1) | Violates “same Nest app / same rules” lock unless later ADR supersedes |

## Async & scale

| Tech | Ring | Rationale |
| --- | --- | --- |
| DB outbox + **in-process** drain | Adopt | Matches “no separate worker at start” |
| Nest `@ Cron` / schedulers | Adopt | 3h reminders, rating windows |
| **BullMQ + Redis** | Trial | Promote when outbox lag / fan-out fails CASE-PERF |
| Separate worker process | Assess → Trial in P4 | AO-3 — evidence-gated |
| Kafka / NATS day-1 | Hold | Overkill for monolith phase |

## Observability & ops

| Tech | Ring | Rationale |
| --- | --- | --- |
| **OpenTelemetry** (HTTP, Nest, pg/Prisma) | Adopt | Industry default 2026; OTLP to vendor of choice |
| Structured JSON logs + `requestId` | Adopt | Correlate RN → API → DB |
| Prometheus metrics + Grafana | Trial | After OTel traces exist |
| Cloud vendor (Fly / Railway / AWS / GCP / Azure) | Assess | AO-10; prefer managed Postgres 18 + EU/Turkey-adjacent region |
| PgBouncer / managed pooler | Trial | Before horizontal Nest replicas |

## Quality

| Tech | Ring | Rationale |
| --- | --- | --- |
| Vitest / Jest for Nest units | Adopt | Team preference OK; pick one in P0 |
| Nest HTTP e2e (supertest) | Adopt | Auth + one path per critical module |
| **Maestro** or Detox for RN flows | Trial | Journey 1 smoke on CI |
| Contract tests (OpenAPI / schemathesis) | Trial | Protect `/api/v1` from silent breaks |
| Load: k6 / Grafana k6 | Trial | Gate before worker extract |

## Security (Turkey launch)

| Practice | Ring |
| --- | --- |
| OTP primary; short-lived JWT + rotating refresh | Adopt |
| Argon2id / strong hashing for any passwords if enabled | Adopt |
| Device risk signals + rate limits | Trial (P2–P3) |
| KVKK retention + consent versioning via `policies` | Adopt (process in P3) |

---

## Proposed open-item closures

| Open ID | Proposed resolution | Promote when |
| --- | --- | --- |
| AO-2 | Bare React Native; Expo forbidden | **Accepted** — ADR-0006 |
| AO-7 | pnpm + Turborepo; packages `api-contracts`, `shared-utils` | Repo scaffold PR |
| AO-8 | Zod 4 shared schemas; Nest runtime validation; optional response parse in CI | Contract ADR |
| AO-6 | Envelope + cursor pagination + OpenAPI from Nest (draft in roadmap) | API workshop |
| ADR-0003 | Prisma 7+ with `@prisma/adapter-pg` | Backend scaffold |
| AO-3 | Stay in-process until P4 load evidence | Perf report |
| AO-10 | Shortlist 2 cloud vendors with Postgres 18 + Istanbul/EU region | Ops spike |

## Anti-radar (do not “modernize” into these)

- Rewriting the modular monolith into microservices for prestige  
- Adding GraphQL “for flexibility” while case catalog maps to REST resources  
- Putting business rules in the RN app “for offline” without server authority  
- Sharing Prisma client with mobile  
- Chasing Nest 12 / Prisma 8 mid-critical-path without migration budget  
- Reintroducing Expo “just for builds” — banned  


## Related

- Product roadmap: [`02-product-roadmap.md`](02-product-roadmap.md)  
- Locked decisions: [`01-architecture-decisions.md`](01-architecture-decisions.md)  
- Stack sketch: [`00-product-and-stack.md`](00-product-and-stack.md)  
