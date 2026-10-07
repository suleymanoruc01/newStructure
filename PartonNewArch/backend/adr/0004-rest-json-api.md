# ADR-0004: REST / JSON as the public API

**Date:** 2026-10-07  
**Status:** accepted

## Context

The React Native app must communicate with the NestJS backend through a stable, versioned contract. Legacy PartOn used Firebase client SDKs and listeners. Shared request/response schemas will live in monorepo packages and be enforced on the server at runtime (and optionally on the client before submit).

## Decision

Expose **all mobile-facing PartOn capabilities as a versioned REST / JSON API** over HTTPS:

- Resource-oriented URLs under **`/api/v1/...`**
- Breaking changes ship as a new major path (`/api/v2/...`)
- Request/response **schemas and derived TypeScript types** live in **shared packages**
- Nest controllers are the public edge for mobile (no GraphQL, gRPC, or tRPC for clients)
- Admin UI calls the **same Nest domain services** (in-process); it may also use REST where convenient, but must not invent a second rule layer

Internal module-to-module calls stay in-process. Real-time push remains **FCM/APNs**. Separate worker process deferred.

**Still open** (see [01-architecture-decisions.md](../../01-architecture-decisions.md)): error envelope, pagination style, documentation approach, validation library, response-validation policy, deprecation windows for old clients.

## Alternatives

### GraphQL
- **Pros:** Flexible client queries  
- **Cons:** AuthZ complexity; weaker fit for command-heavy staffing flows  
- **Why not:** REST is locked

### gRPC / Connect-RPC to mobile
- **Pros:** Strong typing, efficient binary  
- **Cons:** Tooling friction for RN + shared JSON schemas  
- **Why not:** REST + shared TS schemas preferred

### Firebase / BaaS-style SDK again
- **Pros:** Fast client bootstrap  
- **Cons:** Repeats ownership and rule-enforcement problems  
- **Why not:** Server must own business rules

## Consequences

### Positive
- Clear `/api/v1` versioning story for mobile releases
- Shared schemas keep mobile and backend aligned without sharing DB models
- AuthZ at route/guard level remains straightforward

### Negative / risks
- Envelope / pagination / OpenAPI details still TBD — avoid treating draft conventions as immutable until AO-6/AO-8 close
