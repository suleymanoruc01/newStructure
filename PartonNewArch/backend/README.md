# Backend architecture notes

NestJS + PostgreSQL for PartOn. One app hosts the **versioned REST / JSON API** (`/api/v1`) and the **admin panel**, sharing domain services.

**Platform architecture (start here):** [`../04-application-architecture.md`](../04-application-architecture.md)

Read backend notes in order. Locked/open: [`../01-architecture-decisions.md`](../01-architecture-decisions.md). Delivery: [`../02-product-roadmap.md`](../02-product-roadmap.md). Radar: [`../03-tech-radar-2026.md`](../03-tech-radar-2026.md). ADRs capture stack forks.

| # | Doc | Purpose |
| --- | --- | --- |
| 01 | [Overview](01-overview.md) | Goals, principles, quality bars |
| 02 | [System context](02-system-context.md) | Actors, boundaries, trust zones |
| 03 | [Modular monolith](03-modular-monolith.md) | Nest module layout & folder conventions |
| 04 | [Domain modules](04-domain-modules.md) | Provisional bounded contexts (names with features) |
| 05 | [Data layer](05-data-layer.md) | PostgreSQL, ORM, migrations, tenancy |
| 06 | [REST API conventions](06-api-conventions.md) | `/api/v1`, schemas; envelope — [shared/12](../shared/12-api-contracts.md) |
| 07 | [Auth & security](07-auth-security.md) | Checklist — OTP/JWT, guards, abuse (see 18 for full RBAC) |
| 08 | [Async & events](08-async-events.md) | Outbox in-process first; BullMQ when evidence |
| 09 | [Observability](09-observability.md) | Health, logs, metrics, envs |
| 10 | [Legacy Firebase mapping](10-legacy-firebase-mapping.md) | Old repos → new modules |
| 11 | [Tokens & provision](11-tokens-and-provision.md) | CASE-TOKEN ledger |
| 12 | [Matching rules](12-matching-rules.md) | CASE-MATCHING |
| 13 | [Location policy](13-location-policy.md) | CASE-LOCATION / CHECKIN |
| 14 | [BullMQ vs RabbitMQ](14-bullmq-vs-rabbitmq.md) | Queue choice — BullMQ accepted, RabbitMQ Hold |
| 15 | [Redis management](15-redis-management.md) | Managed Redis, noeviction, AOF, split cache |
| 16 | [REST vs gRPC](16-rest-vs-grpc.md) | REST edge locked; gRPC Hold; both only later |
| 17 | [Privacy KVKK + GDPR](17-privacy-kvkk-gdpr.md) | Turkey-first privacy-by-design; DSR, retention, subprocessors |
| 18 | [Auth & RBAC](18-auth-rbac.md) | OTP/JWT sessions, memberships, RBAC + branch scope, admin |
| 19 | [SSE](19-sse.md) | Foreground server→client live updates (not push) |
| 20 | [FCM messaging](20-fcm-messaging.md) | Firebase Cloud Messaging — tokens, inbox, outbox; UX in [shared/05](../shared/05-push-notifications-ux.md) |
| 21 | [Client security](21-client-security.md) | Best Web + Mobile security baseline (storage, TLS, CSRF, headers) |
| 22 | [Legal audit logger](22-legal-audit-logger.md) | KVKK accountability logger; admin CSV/PDF — ADR-0037 |
| — | [API contracts](../shared/12-api-contracts.md) | Envelope, errors, Zod — ADR-0027 |
| — | [NFRs / SLOs](../05-quality-nfr.md) | Quality targets |
| — | [Testing strategy](../06-testing-strategy.md) | Case-driven pyramid |
| — | [Environments & ops](../07-environments-and-ops.md) | Deploy / health |
| — | [Doc index](../DOC-INDEX.md) | Full documentation map |
| — | [Doc cohesion](../DOC-COHESION.md) | Hub/spoke sync rules |
| — | [AGENTS](../AGENTS.md) | AI implementation entry |
| — | [Case coverage](../cases/) | 248 cases → modules / gaps |
| ADR | [Decision log](adr/README.md) | Architecture decisions |

## Suggested monorepo layout (future code)

```text
apps/
  backend/                 # NestJS — REST /api/v1 + serves admin static
    src/
      main.ts
      app.module.ts
      common/
      config/
      modules/
        auth/
        users/
        employers/
        branches/
        workers/
        jobs/
        tokens/
        applications/
        matching/
        shifts/
        location/
        ratings/
        favorites/
        notifications/
        policies/
        privacy/           # DSR export/erasure, retention jobs (P3)
        audit/             # legal audit logger + CSV/PDF — ADR-0037
        moderation/
        admin/             # ops domain / static hosting glue
      database/
  admin/                   # Vite + shadcn/ui dark SPA — ADR-0014
  mobile/                  # React Native
packages/
  api-contracts/           # Zod schemas + types — ADR-0027 (name locked)
  shared-utils/            # platform-agnostic helpers — ADR-0038
  design-tokens/           # color tokens — ADR-0038
```

Module folder names are **final for v1** (AO-5). Tooling: **pnpm + Turborepo** (ADR-0038). Production coding: [`../agents/10-production-ready.md`](../agents/10-production-ready.md).
