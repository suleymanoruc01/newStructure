# ADR-0009: REST at the edge; gRPC not for PartOn clients

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../16-rest-vs-grpc.md`](../16-rest-vs-grpc.md)  
**Supplements:** [ADR-0004](0004-rest-json-api.md)

## Context

The team must decide whether PartOn’s Nest backend should expose REST, gRPC, or both. Mobile (bare React Native) and a Nest-hosted admin share one rule layer. The architecture is a modular monolith: modules call each other in-process. Shared Zod/OpenAPI contracts under `/api/v1` are already locked for the client edge.

## Decision

1. **Public / mobile edge = REST / JSON only** (`/api/v1`) — confirm ADR-0004.  
2. **Do not** expose gRPC (or gRPC-Web) to mobile or other public clients.  
3. **Do not** adopt a dual REST+gRPC surface on every module while still a monolith.  
4. **Module-to-module** communication remains **in-process** Nest provider calls — not gRPC.  
5. **Both (REST + gRPC)** is a **future optional pattern** only after independently deployed internal services exist *and* east-west call volume justifies Protobuf RPC. That requires a new ADR; until then gRPC is **Hold** on the tech radar.

## Alternatives

### gRPC-only public API
- **Pros:** Binary efficiency, strong `.proto` contracts  
- **Cons:** Breaks Zod/OpenAPI shared-package strategy; weaker mobile/QA DX; remaps case catalog  
- **Why not:** Locked REST client contract

### Both from day one (REST gateway + gRPC modules as “services”)
- **Pros:** Looks like a service mesh  
- **Cons:** Fake distribution; double controllers; ops tax without scale benefit  
- **Why not:** Violates modular-monolith and “no premature microservices” stance

### Connect-RPC / tRPC to mobile
- **Pros:** Typed RPC ergonomics  
- **Cons:** Same north-south issues; not the locked REST shape  
- **Why not:** Hold with gRPC for the public edge

## Consequences

### Positive
- One client protocol story for RN + OpenAPI + case tests  
- Clear “when both?” answer: only after real service extract  
- Avoids proto/Zod dual source of truth  

### Negative / risks
- If extreme internal fan-out appears after extract, we may add gRPC later — budget a migration ADR  
- Teams must resist adding gRPC “because Nest supports it”  

### Follow-up
- Keep screen docs’ **API** rows as REST paths only  
- Any proposal for public gRPC must supersede ADR-0004 and ADR-0009  
