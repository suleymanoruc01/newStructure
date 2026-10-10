# ADR-0031: PM2 for Nest web (API + admin) process management

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0001](0001-nestjs-modular-monolith.md) · [ADR-0014](0014-web-ui-shadcn-dark.md) · [ADR-0032](0032-nginx-reverse-proxy.md) · [web/05-pm2.md](../../web/05-pm2.md) · [web/06-nginx.md](../../web/06-nginx.md) · [07-environments-and-ops.md](../../07-environments-and-ops.md)

## Context

PartOn’s web surface is the **Nest modular monolith**: REST `/api/v1` plus Nest-hosted Vite admin static (ADR-0001 / ADR-0014). Staging and production need a Node process manager for restart, logs, and optional cluster mode. Cloud vendor (AO-10) remains open; the **process manager** should not wait on that pick. Alternatives (raw `node`, systemd-only, Docker restart alone, forever) fragment ops and agent scaffolds.

## Decision

1. **PM2** is the **Adopt** process manager for the Nest web deployable (`apps/backend` serving API + admin).  
2. Config lives at repo root or `apps/backend` as `ecosystem.config.cjs` (or `.js`) checked into git **without** secrets.  
3. Staging/prod start via `pm2 start|reload` (zero-downtime reload preferred when supported).  
4. Local day-to-day still uses `pnpm`/`nest start --watch`; PM2 is for **staging/production** (and optional local parity).  
5. When Stage C introduces a separate BullMQ worker process, it may be a **second PM2 app** in the same ecosystem file — same Nest codebase, different entry/script.  
6. **Hold** as primary process manager: forever, nodemon-in-prod, unmanaged bare `node dist/main`.  
7. Docker/K8s (if chosen under AO-10) may still wrap the same Nest image; PM2 remains the default on VM/bare-metal Node hosts.

## Consequences

### Positive

- Clear agent ops DoD for web deploy  
- Restart / log / cluster knobs without inventing a custom supervisor  
- Aligns with Nest single deployable + optional worker later  

### Negative / tradeoffs

- Extra Node dependency on hosts  
- Cluster mode must respect Nest sticky needs for SSE (prefer `instances: 1` until SSE affinity designed)  

### Follow-ups

- Document SSE + multi-instance affinity if scaling Nest horizontally  
- **NGINX** edge templates — [ADR-0032](0032-nginx-reverse-proxy.md)  
- Wire deploy scripts once AO-10 host type is known  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| systemd only | **Assess** as OS wrapper that starts PM2 or Nest; not a replacement Fastfile-style SoR |
| Docker restart policy only | Fine **with** AO-10 containers; PM2 still default for Node VM hosts |
| forever / nodemon prod | **Reject** |
| Separate Next.js process for admin | **Reject** — ADR-0014 |
