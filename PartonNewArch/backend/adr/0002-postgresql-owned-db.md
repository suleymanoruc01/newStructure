# ADR-0002: PostgreSQL as owned system of record

**Date:** 2026-10-07  
**Status:** accepted

## Context

Legacy PartOn relied on Firestore (and client caches) as primary persistence. That model made relational integrity, reporting, and server-side enforcement harder. The rebuild requires a database we operate and migrate ourselves.

## Decision

Use **PostgreSQL** as the sole system of record for PartOn domain data. Schema and migrations live in the API repository (or a dedicated db package in a monorepo).

## Alternatives

### Keep Firestore as primary
- **Pros:** Familiar from legacy  
- **Cons:** Conflicts with “own our DB” goal; weak relational constraints  
- **Why not:** Explicit product/engineering direction away from Firebase-as-backend

### MongoDB
- **Pros:** Flexible documents  
- **Cons:** We need joins, constraints, geo/reporting friendliness of SQL  
- **Why not:** Relational domain fits Postgres better

## Consequences

### Positive
- Strong constraints (unique applications, FKs, transactions)
- Clear migrations and staging parity
- Easier analytics / admin queries

### Negative / risks
- Requires migration discipline
- Geo may need PostGIS decision (see data-layer open questions)
- Data migration from Firestore is a separate product decision
