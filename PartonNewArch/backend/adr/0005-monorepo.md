# ADR-0005: Monorepo with separate mobile and backend apps

**Date:** 2026-10-07  
**Status:** accepted

## Context

PartOn has two primary components: a React Native mobile app and a NestJS backend (REST API + admin). The team needs shared API schemas/types without leaking server secrets or DB models into the client. Independent git repos would duplicate contracts and slow cross-cutting changes.

## Decision

Develop PartOn in a **single monorepo**:

- `apps/mobile` — React Native (iOS + Android)
- `apps/backend` — NestJS modular monolith (REST `/api/v1` + admin panel)
- `packages/*` — shared contracts and platform-agnostic helpers only

Exact monorepo tool (pnpm workspaces, Nx, Turborepo, etc.) remains `open` ([AO-7](../../01-architecture-decisions.md)). Independent deploy pipelines for mobile vs backend remain `open` ([AO-1](../../01-architecture-decisions.md)).

## Alternatives

### Separate repositories
- **Pros:** Hard deploy isolation  
- **Cons:** Version drift on API contracts; harder coordinated refactors  
- **Why not:** Shared schema packages are a locked requirement

### Single app folder (mobile + API mixed)
- **Pros:** Fewer packages  
- **Cons:** Blurs ownership; risk of importing DB code into mobile  
- **Why not:** Explicit app boundaries are locked

## Consequences

### Positive
- One place for `/api/v1` schemas and derived TS types
- Clear “no secrets / no DB in shared” rule enforceable by package boundaries
- Case-driven changes can land across mobile + API in one PR when needed

### Negative / risks
- Monorepo CI complexity — mitigate with path-filtered pipelines (AO-1)
- Package graph discipline required so mobile never imports `apps/backend`
