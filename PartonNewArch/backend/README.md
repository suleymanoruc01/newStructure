# Backend architecture notes

NestJS + PostgreSQL for PartOn. One app hosts the **versioned REST / JSON API** (`/api/v1`) and the **admin panel**, sharing domain services.

Read in order. Product-level locked/open decisions: [`../01-architecture-decisions.md`](../01-architecture-decisions.md). Delivery: [`../02-product-roadmap.md`](../02-product-roadmap.md). Sep 2026 tech: [`../03-tech-radar-2026.md`](../03-tech-radar-2026.md). ADRs capture stack forks.

| # | Doc | Purpose |
| --- | --- | --- |
| 01 | [Overview](01-overview.md) | Goals, principles, quality bars |
| 02 | [System context](02-system-context.md) | Actors, boundaries, trust zones |
| 03 | [Modular monolith](03-modular-monolith.md) | Nest module layout & folder conventions |
| 04 | [Domain modules](04-domain-modules.md) | Provisional bounded contexts (names with features) |
| 05 | [Data layer](05-data-layer.md) | PostgreSQL, ORM, migrations, tenancy |
| 06 | [REST API conventions](06-api-conventions.md) | `/api/v1`, schemas; envelope/pagination `open` |
| 07 | [Auth & security](07-auth-security.md) | OTP/JWT, roles, guards, abuse surfaces |
| 08 | [Async & events](08-async-events.md) | Outbox in-process first; worker deferred |
| 09 | [Observability](09-observability.md) | Health, logs, metrics, envs |
| 10 | [Legacy Firebase mapping](10-legacy-firebase-mapping.md) | Old repos → new modules |
| 11 | [Tokens & provision](11-tokens-and-provision.md) | CASE-TOKEN ledger |
| 12 | [Matching rules](12-matching-rules.md) | CASE-MATCHING |
| 13 | [Location policy](13-location-policy.md) | CASE-LOCATION / CHECKIN |
| — | [Case coverage](../cases/) | 248 cases → modules / gaps |
| ADR | [Decision log](adr/README.md) | Architecture decisions |

## Suggested monorepo layout (future code)

```text
apps/
  backend/                 # NestJS — REST /api/v1 + admin
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
        moderation/
        admin/             # admin panel hosting / ops modules
      database/
  mobile/                  # React Native
packages/
  api-contracts/           # shared request/response schemas + types (name TBD)
  shared-utils/            # platform-agnostic helpers only (name TBD)
```

Module folder names above are **provisional** until feature scoping (AO-5). Monorepo tool TBD (AO-7).
