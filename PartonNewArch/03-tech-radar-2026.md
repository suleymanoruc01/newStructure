# 03 — Technology radar (September 2026 baseline)

**Status:** `proposed` (rings) · **latest-stable policy `accepted`** — [ADR-0028](backend/adr/0028-latest-stable-stack.md)  
**As-of:** 2026-09 (reviewed **2026-10-10**)  
**Scope:** Choices that fit PartOn’s **locked** boundaries (monorepo, Nest modular monolith API+admin, **bare** RN — **no Expo**, Postgres, REST `/api/v1`, no day-1 worker).  
**Version policy:** Always **latest stable** of each Adopt tech — [agents/09](agents/09-latest-stack-policy.md) · ADR-0028. Floors below are hints; verify with npm/docs at install.  
**Queue choice:** BullMQ is the *accepted product* when Stage B starts — it is **not** a day-1 Adopt. See [ADR-0007](backend/adr/0007-bullmq-over-rabbitmq.md).

Radar rings (ThoughtWorks-style):

| Ring | Meaning |
| --- | --- |
| **Adopt** | Default for PartOn greenfield *now*; use unless blocked |
| **Trial** | Chosen path to introduce after evidence / spike; not day-1 |
| **Assess** | Watch; do not bet the platform yet |
| **Hold** | Avoid for PartOn v1–v2 (ban or wrong fit) |

## Snapshot

```text
                    ADOPT (latest stable)
         ┌──────────────────────────────┐
         │ NestJS 12 · Node current LTS │
         │ TypeScript 6 · Postgres 18+  │
         │ Bare RN latest · Zod 4 latest│
         │ Prisma latest stable · OTel  │
         │ pnpm + Turborepo latest      │
         │ PG outbox · OpenAPI          │
         └──────────────┬───────────────┘
                        │
          TRIAL         │        ASSESS
    ┌───────────────────┼──────────────────┐
    │ BullMQ + managed Redis │ Next Prisma major │
    │ Fastify adapter          │ Drizzle/Kysely    │
    │ PgBouncer · Maestro E2E  │                   │
    └──────────────────────────┴───────────────────┘
                        │
                      HOLD
          Expo / EAS / Expo Router
          gRPC to mobile · GraphQL
          REST+gRPC dual public edge
          RabbitMQ · Kafka day-1
          Self-hosted Redis (default)
          ElastiCache Serverless + BullMQ
          Stale majors “for comfort”
```

---

## Platforms & runtimes

| Tech | Ring | Rationale (Oct 2026) |
| --- | --- | --- |
| **Node.js** current LTS (**≥ 20.19** / **≥ 22.12**; prefer **22/24 LTS**) | Adopt | NestJS **12** requires these floors for ESM/`require(esm)`; CLI generate may need Node **≥ 22.22.3** / **24+** |
| **TypeScript 6.x** latest | Adopt | Nest 12 CLI/schematics require TS 6 |
| **NestJS 12.x** latest stable | Adopt | Current stable — ESM packages, Standard Schema, native observability hooks; use `nest upgrade` from 11 |
| NestJS 11.x | Hold (new work) | Do not start greenfield on 11; migrate with official guide if legacy |
| **PostgreSQL 18** (or newer stable) | Adopt | `uuidv7()`, async I/O, skip-scan B-tree — ideal for feed/job indexes |
| **Managed Redis** (queue-dedicated) | Trial → Adopt at Stage B | **Accepted ops model** — [ADR-0008](backend/adr/0008-managed-redis.md), [15](backend/15-redis-management.md) |
| Self-hosted Redis (k8s/VMs) | Hold | Unless a platform team owns HA/patching |
| ElastiCache **Serverless** for BullMQ | Hold | Incompatible maxmemory-policy per BullMQ hosting docs — use standard nodes |

## Monorepo & DX

| Tech | Ring | Rationale |
| --- | --- | --- |
| **pnpm workspaces** | Adopt | Fast installs; `workspace:*` for contracts; use `node-linker=hoisted` (or hoist `reflect-metadata`) so Nest DI + bare RN Metro coexist |
| **Turborepo** | Adopt | Task graph, remote cache, `dependsOn: ["^build"]` for compiled shared packages Nest needs |
| Nx | Assess | Powerful; heavier than needed for 2 apps + few packages |
| Compiled `packages/*` → CJS/ESM dual | Adopt | Nest `tsc` cannot consume raw TS from `node_modules`; build contracts before API |

Closes **AO-7** — **accepted** ([ADR-0038](backend/adr/0038-monorepo-tooling.md)).

## API & contracts

| Tech | Ring | Rationale |
| --- | --- | --- |
| **REST `/api/v1`** | **Adopt** | Locked public edge — ADR-0004, [16](backend/16-rest-vs-grpc.md) |
| **Zod 4** in `packages/api-contracts` | Adopt | Single schema source for mobile pre-check + Nest runtime validation |
| **nestjs-zod** / Standard Schema → OpenAPI | Adopt | Keeps DTO validation and Swagger aligned; Nest swagger gaining Standard Schema converters |
| **@nestjs/swagger** | Adopt | Official OpenAPI generation for mobile codegen |
| class-validator as sole contract | Hold | Duplicates schemas; worse for shared mobile packages |
| GraphQL / tRPC to clients | Hold | Explicitly rejected for public API |
| **gRPC to mobile / public** | **Hold** | Rejected — ADR-0009 |
| **REST + gRPC hybrid** | **Hold** | Only after real service extract (REST north-south, gRPC east-west); not for monolith module calls |
| gRPC east-west (future services) | Assess | Revisit only post-extract + measured internal RPC need |

**AO-6 / AO-8 closed** — envelope, cursor pagination, Zod 4, OpenAPI — [ADR-0027](backend/adr/0027-api-contracts-baseline.md) · [shared/12](shared/12-api-contracts.md).

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
| **Prisma ORM** **latest stable** + `@prisma/adapter-pg` | Adopt | Prefer newest stable major that supports PG 18 — ADR-0003 · ADR-0028; verify with `npm view prisma version` |
| Older Prisma majors | Hold (new work) | Do not start greenfield on superseded majors |
| TypeORM 0.3 | Assess | Fine Nest fit; weaker schema-first story for PartOn |
| Drizzle / Kysely | Assess | Great SQL control; more boilerplate early |
| PostGIS | Trial | Enable when radius queries outgrow lat/lng math |
| Firebase / Firestore as system of record | Hold | Locked away (ADR-0002) |

## Mobile

| Tech | Ring | Rationale |
| --- | --- | --- |
| **Bare React Native** **latest stable** (owned `ios/` + `android/`) | Adopt | **Locked** no Expo — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md); version = npm `react-native@latest` |
| **Dual-platform latest iOS + Android** | Adopt | Both first-class; latest OS QA; CI both — [ADR-0029](backend/adr/0029-dual-platform-ios-android.md) · [mobile/06](mobile/06-ios-android-platforms.md) |
| **[NativeWind](https://www.nativewind.dev/)** latest stable (v4+) | **Adopt** | Primary mobile styling — [ADR-0015](backend/adr/0015-mobile-ui-nativewind.md), [mobile/04](mobile/04-nativewind-ui.md) |
| NativeWind `useColorScheme` / `dark:` | **Adopt** | Default **`system`**; cream light / forest dark — ADR-0017 |
| **Liquid Glass principles** (WWDC / iOS 26–27) | **Adopt** | UI chrome vs content; brand in content — [ADR-0016](backend/adr/0016-mobile-ui-wwdc-liquid-glass.md), [mobile/05](mobile/05-wwdc-liquid-glass.md) |
| Translucent RN nav chrome + a11y solid fallback | **Adopt** | Prefer system materials; Reduce Transparency safe |
| Custom blur / native `UIGlassEffect` bridge | Trial → Assess | P2 Trial blur; native bridge only if needed |
| React Native Reusables (copy-paste kit) | Trial | Optional shadcn-like primitives for RN |
| NativeWind v5 | Assess | Pre-release; promote when bare RN path is boring |
| **React Navigation** latest stable (native stack + tabs) | Adopt | Fluid mobile nav — ADR-0024 · [shared/08](shared/08-routing.md) |
| **react-native-screens** | Adopt | Native screen containers with RN |
| **React Router** (data APIs) | Adopt | Admin Vite SPA routing — ADR-0024 |
| **TanStack Router** | Assess | Only if React Router blocked |
| RN New Architecture (Fabric/TurboModules) via RN flags | Trial | Optional; enable when native deps are ready — **without** Expo |
| **Fastlane** (iOS + Android lanes) | **Adopt** | Mobile release SoR — [ADR-0030](backend/adr/0030-fastlane-mobile-release.md) · [mobile/07](mobile/07-fastlane.md); **no EAS** |
| Xcode Cloud / Gradle as sole release path | Hold | Use under Fastlane; not a second SoR |
| Detox or Maestro against bare builds | Trial | Journey 1 smoke on CI |
| StyleSheet-only / CSS-in-JS as primary UI system | **Hold** | Escapes OK; not the architecture |
| **Expo SDK / Expo Go / EAS / Expo Router / expo-updates** | **Hold** | Hard ban — do not adopt |

**AO-2 closed:** bare RN only; Expo forbidden. NativeWind does **not** require Expo.

## Admin UI (same Nest app)

| Tech | Ring | Rationale |
| --- | --- | --- |
| **React + Vite SPA** Nest-served | **Adopt** | Locked with ADR-0014 — closes BQ-4 |
| **[shadcn/ui](https://github.com/shadcn-ui/ui)** + Tailwind + Radix | **Adopt** | Owned `components/ui`; dark default — [web/04](web/04-shadcn-dark-ui.md) |
| PartOn **color tokens** (cream / forest / orange) | **Adopt** | Shared Web+Mobile — [shared/01](shared/01-color-system.md), ADR-0017 |
| **DESIGN.md** (Stitch / awesome-design-md format) | **Adopt** | Agent visual SoR — [DESIGN.md](DESIGN.md) · [ADR-0039](backend/adr/0039-design-md.md) · [awesome-design-md](https://github.com/voltagent/awesome-design-md) |
| `next-themes` class `.dark` | **Adopt** | Admin dark default; light optional |
| TanStack Query / Table + RHF + Zod | **Adopt** | Ops tables/forms against `/api/v1` |
| AdminJS / Refine auto-admin | **Hold** | Weak fit for PartOn ops UX |
| Separate Next.js admin app | **Hold** (v1) | Violates “same Nest app” unless ADR supersedes 0001 |

## Messaging (push & realtime)

| Tech | Ring | Rationale |
| --- | --- | --- |
| **FCM HTTP v1** + Firebase Admin on Nest | **Adopt** | Mobile push only; inbox/tokens in Postgres — [20](backend/20-fcm-messaging.md), ADR-0013 |
| `@react-native-firebase/messaging` (bare RN) | **Adopt** | Token lifecycle; no Expo push |
| Postgres inbox + outbox → FCM | **Adopt** | T-110–T-113; never FCM-in-request |
| **SSE** (`@Sse()`) for foreground | **Trial → Adopt** (phased) | Complements FCM — [19](backend/19-sse.md), ADR-0012 |
| WebSocket / Expo push / Firestore listeners as API | **Hold** | Wrong fit / banned patterns |
| OneSignal / dual APNs+FCM stacks | **Hold** (v1) | Extra vendor; FCM covers iOS via APNs |

## Async & scale

| Tech | Ring | Rationale |
| --- | --- | --- |
| DB outbox + **in-process** drain | **Adopt** | Locked Stage A — “no separate worker / no broker at start” |
| Nest `@Cron` / schedulers | **Adopt** | 3h reminders, rating windows (works with outbox Stage A) |
| **BullMQ + managed Redis** (`@nestjs/bullmq`) | **Trial** | Stage B after evidence. Redis: managed, `noeviction` + AOF — [14](backend/14-bullmq-vs-rabbitmq.md), [15](backend/15-redis-management.md), ADR-0007/0008 |
| Separate worker process | Assess → Trial (P4) | AO-3 — evidence-gated; BullMQ workers may stay in-process first |
| **RabbitMQ** | **Hold** | Wrong fit for Nest job workloads; reopen only with new ADR |
| Kafka / NATS day-1 | **Hold** | Event bus / streaming — overkill for monolith job phase |

### Ring note (BullMQ)

ThoughtWorks **Adopt** means “use by default *today*.” BullMQ is deliberately **Trial**: the *decision* of which broker to use later is settled (BullMQ beats RabbitMQ), but introduction waits on lag / CASE-PERF / worker-scale evidence ([08-async-events.md](backend/08-async-events.md)).

## Observability & ops

| Tech | Ring | Rationale |
| --- | --- | --- |
| **OpenTelemetry** (HTTP, Nest, pg/Prisma) | Adopt | Industry default 2026; OTLP to vendor of choice |
| Structured JSON logs + `requestId` | Adopt | Correlate RN → API → DB → DevOps errors |
| **Admin DevOps error store** (Postgres + in-app triage) | **Adopt** | Unified API/admin/marketing/mobile errors — [ADR-0035](backend/adr/0035-admin-devops-error-tracking.md) · [web/09](web/09-admin-devops.md) |
| **Admin DevOps MCP** | **Adopt** | Agent tools → Nest devops — [ADR-0036](backend/adr/0036-admin-devops-mcp.md) · [web/10](web/10-devops-mcp.md) |
| **Legal audit logger** + CSV/PDF | **Adopt** | KVKK accountability — [ADR-0037](backend/adr/0037-legal-audit-logger.md) · [backend/22](backend/22-legal-audit-logger.md) · [web/11](web/11-legal-audit-reports.md) |
| Unauthenticated / shell MCP tools | Hold | Forbidden |
| Sentry/GlitchTip as **sole** UI | Hold | Optional export OK; admin DevOps is SoR UI |
| Prometheus metrics + Grafana | Trial | After OTel traces exist |
| **PM2** (Nest web process manager) | **Adopt** | Staging/prod for API + admin — [ADR-0031](backend/adr/0031-pm2-web-process-manager.md) · [web/05](web/05-pm2.md) |
| **NGINX** (TLS + reverse proxy) | **Adopt** | Edge in front of Nest/PM2 + marketing static — [ADR-0032](backend/adr/0032-nginx-reverse-proxy.md) · [web/06](web/06-nginx.md) |
| **Marketing site** (`apps/marketing` Vite + prerender) | **Adopt** | Production public site — all `w.public.*`, no MVP gaps — [ADR-0033](backend/adr/0033-marketing-site.md) · [web/07](web/07-marketing.md) |
| Marketing as CSR-only / landing-only MVP | Hold | Gaps + SEO bottleneck forbidden |
| Next.js for marketing | Hold | Vite + prerender unless ADR supersedes |
| Caddy / Traefik / Apache as primary edge | Hold | Use NGINX |
| forever / nodemon-in-prod | Hold | Use PM2 |
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
| **User-centered push catalog** (inbox-first, prefs, deep links) | **Adopt** — ADR-0021 · [shared/05](shared/05-push-notifications-ux.md) |
| **WCAG 2.2 AA** (web) + mobile equivalent a11y | **Adopt** — ADR-0022 · [shared/06](shared/06-accessibility-wcag.md) |
| **i18n Turkish (`tr-TR`) primary** + i18next catalogs | **Adopt** — ADR-0023 · [shared/07](shared/07-i18n.md) |
| **Fluid routing** (RN Linking + React Router) | **Adopt** — ADR-0024 · [shared/08](shared/08-routing.md) |
| **Modern UI principles** (Sept 2026 bar) | **Adopt** — ADR-0025 · [shared/09](shared/09-modern-ui-principles.md) · implement via [DESIGN.md](DESIGN.md) |
| **Modern UX principles** (Sept 2026 bar) | **Adopt** — ADR-0026 · [shared/10](shared/10-modern-ux-principles.md) |
| **API contracts** (envelope + Zod 4 + cursor) | **Adopt** — ADR-0027 · [shared/12](shared/12-api-contracts.md) |
| **Latest stable stack** (within ADR fences) | **Adopt** — ADR-0028 · [agents/09](agents/09-latest-stack-policy.md) |
| **iOS + Android** dual-platform readiness | **Adopt** — ADR-0029 · [mobile/06](mobile/06-ios-android-platforms.md) |
| **Fastlane** mobile release | **Adopt** — ADR-0030 · [mobile/07](mobile/07-fastlane.md); EAS Hold |
| **PM2** Nest web process manager | **Adopt** — ADR-0031 · [web/05](web/05-pm2.md) |
| **NGINX** reverse proxy / TLS | **Adopt** — ADR-0032 · [web/06](web/06-nginx.md) |
| **Marketing site** (Vite + prerender, production) | **Adopt** — ADR-0033 · [web/07](web/07-marketing.md); no MVP gaps |
| **Admin full CASE-* coverage** | **Adopt** — ADR-0034 · [web/08](web/08-admin-case-coverage.md) |
| **Admin DevOps** (errors + releases) | **Adopt** — ADR-0035 · [web/09](web/09-admin-devops.md) |
| **Admin DevOps MCP** | **Adopt** — ADR-0036 · [web/10](web/10-devops-mcp.md) |
| **Legal audit reports** | **Adopt** — ADR-0037 · [web/11](web/11-legal-audit-reports.md) |
| Hardcoded UI copy / English-only P0 strings | **Hold** |
| OTP primary; short-lived JWT + rotating refresh | Adopt — ADR-0011 |
| RBAC + employer/branch resource scope (Nest guards) | Adopt — [18](backend/18-auth-rbac.md) |
| Auth context switch (multi-membership) | Adopt |
| **Client security baseline** (memory access; Keychain / HttpOnly refresh; CSRF; headers) | **Adopt** — ADR-0018 · [21](backend/21-client-security.md) |
| **Screen UX layout recipes** R1–R8 + CASE-UX | **Adopt** — ADR-0019 · [shared/03](shared/03-screen-ux-layout.md) |
| **Wizard state** (`WizardShell` + scoped Zustand/Context; Nest draft) | **Adopt** — ADR-0020 · [shared/04](shared/04-wizard-state.md) |
| Zustand (per-wizard stores only) | Adopt (proposed) for multi-route wizards |
| App-wide Redux for all forms | **Hold** |
| Hide-step / keep-alive as only wizard persistence | **Hold** |
| Argon2id / strong hashing for any passwords if enabled | Adopt |
| TLS certificate / SPKI pinning (mobile prod) | Trial — backup pins + kill-switch |
| Biometric unlock of refresh | Trial |
| Device risk signals + rate limits | Trial (P2–P3) |
| Hard-block rooted / jailbroken devices | **Hold** (use as risk signal only) |
| Refresh in AsyncStorage / localStorage | **Hold** |
| KVKK retention + consent versioning via `policies` | Adopt (process in P3) — ADR-0010 |
| Legal audit logger (`legal_audit_events`) + admin CSV/PDF | **Adopt** — ADR-0037 · [22](backend/22-legal-audit-logger.md) |
| DSR export/erasure APIs + retention jobs | Adopt (P3) — [17](backend/17-privacy-kvkk-gdpr.md) |
| Subprocessor register + TR/EU residency preference | Adopt (ops) — ties to AO-10 |

---

## Proposed open-item closures

| Open ID | Proposed resolution | Promote when |
| --- | --- | --- |
| AO-2 | Bare React Native; Expo forbidden | **Accepted** — ADR-0006 |
| AO-7 / ADR-0038 | pnpm + Turborepo; packages locked | **Accepted** — scaffold |
| AO-6 / AO-8 | **Accepted** — ADR-0027 (envelope, cursor, Zod 4, OpenAPI) | — |
| ADR-0003 / 0028 | Prisma **latest stable** + `@prisma/adapter-pg` | **Accepted** — backend scaffold |
| ADR-0028 | Nest **12** + TS **6** + Node LTS floors; RN/Zod latest | Continuous |
| AO-3 | Stage A outbox now; Stage B **BullMQ** (not RabbitMQ); worker extract later | Perf report — ADR-0007 |
| AO-10 | Shortlist 2 cloud vendors with Postgres 18 + Istanbul/EU region | Ops spike |

## Anti-radar (do not “modernize” into these)

- Rewriting the modular monolith into microservices for prestige  
- Adding GraphQL “for flexibility” while case catalog maps to REST resources  
- Putting business rules in the RN app “for offline” without server authority  
- Sharing Prisma client with mobile  
- Staying on Nest 11 / old RN majors “for comfort” when newer stables exist — banned (ADR-0028)  
- Chasing **canary/alpha** as default — banned (latest **stable** only)  
- Reintroducing Expo “just for builds” — banned  
- Putting BullMQ/Redis in Adopt/production before Stage A evidence — premature  
- Running BullMQ on a LRU “cache” Redis or ElastiCache Serverless — banned  
- Adopting RabbitMQ “for enterprise messaging” inside a Nest job monolith — banned until polyglot/bus need is real  
- Shipping gRPC (or dual REST+gRPC) to the mobile app “for performance” — banned until ADR supersedes 0004/0009  
- Storing refresh tokens in AsyncStorage / localStorage “for convenience” — banned (ADR-0018)  
- Treating UI hide / client checks as AuthZ — banned  
- Keeping wizard answers only in step `useState` (lost on Back/unmount) — banned (ADR-0020)  
- Relying on CSS hide / keep-alive alone for wizard persistence — banned  

## Related

- Application architecture (REST/gRPC/BullMQ/RabbitMQ): [`04-application-architecture.md`](04-application-architecture.md) §4  
- Client security: [`backend/21-client-security.md`](backend/21-client-security.md)  
- Wizard state: [`shared/04-wizard-state.md`](shared/04-wizard-state.md)  
- Product roadmap: [`02-product-roadmap.md`](02-product-roadmap.md)  
- Locked decisions: [`01-architecture-decisions.md`](01-architecture-decisions.md)  
- Stack sketch: [`00-product-and-stack.md`](00-product-and-stack.md)  
- BullMQ vs RabbitMQ: [`backend/14-bullmq-vs-rabbitmq.md`](backend/14-bullmq-vs-rabbitmq.md)  
- Redis management: [`backend/15-redis-management.md`](backend/15-redis-management.md)  
- REST vs gRPC: [`backend/16-rest-vs-grpc.md`](backend/16-rest-vs-grpc.md)  
- Async stages: [`backend/08-async-events.md`](backend/08-async-events.md)  

