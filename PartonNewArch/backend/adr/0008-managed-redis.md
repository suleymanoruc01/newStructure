# ADR-0008: Managed Redis for BullMQ (ops baseline)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../15-redis-management.md`](../15-redis-management.md)

## Context

When PartOn promotes async Stage B, BullMQ requires Redis. Redis is often deployed as a disposable cache. That model is unsafe for queues: eviction and missing persistence destroy job state (notifications, delayed 3h confirms, matching recompute). Cloud vendor (AO-10) is still open, but the **management model** and **BullMQ-safe settings** must be decided before the first staging queue.

## Decision

1. Prefer **managed Redis** (ElastiCache / Memorystore / Azure Cache / Redis Cloud — matching the chosen cloud) over self-hosted Redis clusters.  
2. Use a **dedicated queue Redis** with:
   - `maxmemory-policy=noeviction`
   - AOF persistence (`appendfsync everysec` unless benchmarks require a different trade-off)
   - TLS + ACL/AUTH
   - Private network only
   - HA / Multi-AZ (or equivalent) in production  
3. On AWS specifically: **standard** ElastiCache Redis nodes — **not** Serverless — until BullMQ compatibility is confirmed for Serverless maxmemory-policy.  
4. When application caching is added later, use a **separate** Redis (or clearly separated instance) with an eviction policy — do not share the BullMQ instance’s `noeviction` role with LRU cache traffic.  
5. Local/CI may use Docker Redis with the **same** `noeviction` + AOF flags for the queue profile.

## Alternatives

### Self-managed Redis (Helm / VMs)
- **Pros:** Cost control, full knobs  
- **Cons:** Patching, failover, backup drills, on-call  
- **Why not (default):** Product team should not become a Redis SRE shop in Stage B

### Single Redis for cache + queues with `noeviction`
- **Pros:** One billable instance  
- **Cons:** Cache growth causes write failures instead of eviction; operational coupling  
- **Why not:** Split roles when cache appears

### Redis as cache-only (eviction on), BullMQ later “fixed”
- **Pros:** Familiar defaults  
- **Cons:** Violates BullMQ production requirements; silent job loss  
- **Why not:** Forbidden for queue Redis

## Consequences

### Positive
- Predictable job durability for CASE-NOTIFICATIONS / delayed shift jobs  
- Clear vendor matrix once AO-10 lands  
- Avoids classic “Redis ate my queue” incidents  

### Negative / risks
- Managed Redis cost (accept; cheaper than lost shifts/notifications)  
- Two Redis instances when cache is added — document in runbooks  
- Persistence adds write latency — benchmark Stage B before prod  

### Follow-up
- Wire `REDIS_QUEUE_URL` into Nest ConfigModule when Stage B starts  
- Add Redis to `/health/ready` and memory/eviction alerts  
- Confirm final SKU after AO-10 cloud pick  
