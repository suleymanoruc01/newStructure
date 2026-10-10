# ADR-0012: SSE for foreground realtime (not WebSocket / not push replacement)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../19-sse.md`](../19-sse.md)

## Context

PartOn clients need timely UI updates (new applicants, inbox badges, admin queues) while a screen is open. Background alerts already use **FCM/APNs**. Bidirectional protocols (WebSocket, gRPC streams) are heavier and poorly aligned with a REST + modular-monolith marketplace. NestJS natively supports **Server-Sent Events** via `@Sse()` and `Observable<MessageEvent>`.

## Decision

1. Adopt **SSE** as the architectural mechanism for **foreground, server→client** live updates over HTTPS.  
2. Keep **REST** as the only client command/query API and **FCM/APNs** as the background notification channel.  
3. Keep **WebSocket** and **gRPC client streams** on **Hold** unless a bidirectional product (e.g. chat) appears.  
4. Implement with Nest `@Sse()`; authorize via **short-lived SSE tickets** (mobile) or same-site cookies (admin); enforce RBAC + branch scope on subscribe.  
5. Fan-out from domain/outbox: Stage A in-process hub; Stage B Redis pub/sub when multiple API instances.  
6. Phased delivery: not a P0 blocker; Trial on admin or employer live views in P1–P2.

## Alternatives

### WebSocket everywhere
- **Pros:** Bidirectional; familiar “realtime” narrative  
- **Cons:** Extra infra, auth, reconnect complexity; no chat requirement  
- **Why not:** SSE covers server→client; REST covers client→server  

### FCM only (no SSE)
- **Pros:** Simplest  
- **Cons:** Poor foreground UX (latency, OS batching); admin web awkward  
- **Why not:** Complement, don’t replace  

### gRPC streaming to mobile
- **Pros:** Strong streaming model  
- **Cons:** Conflicts with ADR-0004/0009; tooling/cost  
- **Why not:** Hold  

## Consequences

### Positive
- Fits Nest/REST stack; works through HTTP proxies with correct buffering settings  
- Clear split: REST / SSE / Push / BullMQ each have one job  

### Negative / risks
- `EventSource` auth needs ticket design  
- Multi-instance requires pub/sub (Stage B)  
- RN needs polyfill + lifecycle discipline  

### Follow-up
- Pick first surface (SSE-1)  
- Document gateway idle timeouts in ops runbook  
