# ADR-0001: NestJS modular monolith (API + admin)

**Date:** 2026-10-07  
**Status:** accepted

## Context

PartOn is moving off a Kotlin + Firebase architecture. We need a backend that owns business rules and exposes them both through a mobile REST API and an admin management panel. Early delivery favors one deployable over microservices. Team size is not the deciding factor; domain coupling and shared rules are.

## Decision

Build a **single NestJS application** organized as a **modular monolith**:

- Feature modules with explicit `imports` / `exports`
- One deployable that hosts:
  - Versioned **REST API** (`/api/v1/...`) for mobile
  - **Admin management panel** using the **same** domain services (no duplicate rule layer)
- No separate worker process at start (revisit when background load requires it)
- Domain module **names** finalized when features are scoped; structure and boundaries are locked now

Cross-module access only via exported providers — never via another module’s internals.

## Alternatives

### Microservices from day one
- **Pros:** Independent scale/deploy  
- **Cons:** Ops overhead, distributed transactions, slower delivery  
- **Why not:** Domain coupling is high; separate worker/services deferred until need

### Separate Nest API + separate admin web (e.g. Next.js admin)
- **Pros:** UI stack freedom  
- **Cons:** Risk of duplicating or bypassing domain rules  
- **Why not:** Locked decision — API and admin share one Nest app and one rule layer

### Serverless handlers only (no Nest)
- **Pros:** Cheap idle  
- **Cons:** Weaker modular boundaries and shared domain logic  
- **Why not:** Nest module model matches the modular-monolith requirement

## Consequences

### Positive
- One place for AuthZ and business rules (API + admin)
- Fast local development and shared transactions
- Clear path to extract a module or worker later if needed

### Negative / risks
- Discipline required to avoid a “ball of mud”
- Admin UI presentation closed: Vite + shadcn/ui dark — [ADR-0014](0014-web-ui-shadcn-dark.md)
- Single deploy unit for API+admin — mitigate with strong module ownership
