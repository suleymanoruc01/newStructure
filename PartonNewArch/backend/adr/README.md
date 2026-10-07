# Architecture Decision Records (Backend)

Short records of decisions that shape the NestJS API.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-nestjs-modular-monolith.md) | NestJS modular monolith (API + admin) | accepted |
| [0002](0002-postgresql-owned-db.md) | Self-managed PostgreSQL as system of record | accepted |
| [0003](0003-orm-choice.md) | ORM choice (Prisma 7+ on PG 18 proposed) | proposed |
| [0004](0004-rest-json-api.md) | REST / JSON as the public API (`/api/v1`) | accepted |
| [0005](0005-monorepo.md) | Monorepo with separate mobile and backend apps | accepted |
| [0006](0006-bare-react-native-no-expo.md) | Bare React Native — Expo forbidden | accepted |

Product-level locked/open list: [`../../01-architecture-decisions.md`](../../01-architecture-decisions.md).

## When to add an ADR

- Choosing a library that is hard to reverse (ORM, queue, auth protocol)
- Changing module boundaries or tenancy model
- Rejecting a serious alternative (e.g. GraphQL, microservices, non-REST client protocols)

## Template

```markdown
# ADR-NNNN: Title

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | superseded

## Context
## Decision
## Alternatives
## Consequences
```
