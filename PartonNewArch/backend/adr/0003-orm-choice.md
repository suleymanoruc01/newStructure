# ADR-0003: ORM choice

**Date:** 2026-10-07  
**Status:** proposed  
**Radar:** [`../../03-tech-radar-2026.md`](../../03-tech-radar-2026.md)

## Context

NestJS needs a typed data access layer over PostgreSQL with first-class migrations. As of mid/late 2026, Prisma ORM 7 is Rust-free, uses driver adapters, and generates the client into the project (NestJS 11 + CommonJS friendly with `moduleFormat = "cjs"`). PostgreSQL 18 adds `uuidv7()` and stronger index/scan behavior for marketplace feeds.

## Decision (proposed)

Use **Prisma ORM 7+** with:

- Checked-in Prisma schema + Prisma Migrate
- `@prisma/adapter-pg` (or current Postgres driver adapter) against **PostgreSQL 18**
- Nest `PrismaService` lifecycle in `DatabaseModule`
- Public IDs via UUIDv7 where ordering/index locality helps (jobs, applications, events)

Confirm before scaffolding the API repo. Revisit Prisma 8 only after a dedicated migration spike (Assess ring).

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

- If accepted: document Nest `PrismaService` lifecycle in [`../05-data-layer.md`](../05-data-layer.md)
- If rejected for TypeORM/Drizzle: supersede this ADR and update data-layer notes
