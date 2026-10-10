# ADR-0003: ORM choice

**Date:** 2026-10-07  
**Status:** Accepted (2026-10-10)  
**Radar:** [`../../03-tech-radar-2026.md`](../../03-tech-radar-2026.md)  
**Related:** [ADR-0028](0028-latest-stable-stack.md) · [agents/10-production-ready.md](../../agents/10-production-ready.md)

## Context

NestJS needs a typed data access layer over PostgreSQL with first-class migrations. Prisma with driver adapters is the locked greenfield path for PartOn production coding.

## Decision

Use **Prisma** (**latest stable** major compatible with Nest 12 — verify at scaffold via `npm view`; historically 7.x line) with:

- Checked-in Prisma schema + Prisma Migrate
- `@prisma/adapter-pg` (or current Postgres driver adapter) against **PostgreSQL 18**
- Nest `PrismaService` lifecycle in `DatabaseModule`
- Public IDs via UUIDv7 where ordering/index locality helps (jobs, applications, events)

**Accepted for production coding** — do not re-ask. Revisit a newer Prisma major only after registry verification per ADR-0028 (not a blocker).

## Alternatives

### TypeORM 0.3
- **Pros:** Deep NestJS docs/examples, decorator entities  
- **Cons:** Weaker schema-first story for shared contracts / migrations discipline  
- **Why not (for now):** Prisma preferred for greenfield clarity

### Drizzle / Kysely / raw `pg`
- **Pros:** Maximum SQL control  
- **Cons:** More boilerplate early; slower MVP  
- **Why not:** Premature for P0–P2 velocity

### Prisma 8 immediately
- **Pros:** Newer TS-native direction  
- **Cons:** Ecosystem/ Nest recipes still settling vs proven 7.x Nest paths  
- **Why not yet:** Assess ring until playbook is boring

## Consequences

### Positive
- Explicit schema file as documentation
- Predictable migrations; strong generated types for Nest services
- Aligns with Sep 2026 Nest + Postgres baseline in the tech radar

### Negative / risks
- Advanced Postgres features may need raw SQL
- Nest + Prisma DI wiring must be standardized
- Mobile must never import the Prisma client (package boundary)

## Follow-up

- Nest `PrismaService` lifecycle documented in [`../05-data-layer.md`](../05-data-layer.md)  
- Supersede only via ADR if TypeORM/Drizzle chosen later
