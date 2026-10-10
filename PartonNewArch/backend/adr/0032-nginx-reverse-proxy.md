# ADR-0032: NGINX reverse proxy for Nest web

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0001](0001-nestjs-modular-monolith.md) · [ADR-0012](0012-sse-foreground-realtime.md) · [ADR-0018](0018-client-security.md) · [ADR-0031](0031-pm2-web-process-manager.md) · [ADR-0033](0033-marketing-site.md) · [web/06-nginx.md](../../web/06-nginx.md) · [web/07-marketing.md](../../web/07-marketing.md) · [07-environments-and-ops.md](../../07-environments-and-ops.md)

## Context

Staging/production Nest (API + admin) runs under PM2 (ADR-0031). Clients need TLS termination, HTTP→HTTPS redirect, reverse proxy to the Node process, SSE-safe buffering settings, and edge headers (HSTS). Leaving the proxy choice open invites Caddy-only, cloud-LB-only, or Nest-on-:443 patterns that diverge across envs and agent scaffolds. Cloud vendor (AO-10) remains open; the **edge reverse proxy** on VM/bare-metal hosts should be decided now.

## Decision

1. **NGINX** is the **Adopt** reverse proxy / TLS terminator in front of Nest for staging and production web traffic.  
2. Config templates live in-repo (e.g. `deploy/nginx/` or `ops/nginx/`) — **no** private keys or real certs in git.  
3. NGINX proxies to Nest on localhost (PM2-bound port); Nest does **not** terminate public TLS in prod.  
4. Required locations at minimum: `/api/v1/`, `/admin/` (SPA), `/health/`, and SSE paths with buffering disabled.  
5. Local development: Nest + Vite directly — NGINX optional.  
6. Cloud LB (AO-10) may sit **in front of** NGINX or replace TLS at the LB; if Nest runs on VMs, NGINX remains the host reverse proxy. Pure managed ingress without NGINX needs an explicit supersede ADR.  
7. **Hold** as primary edge on VM hosts: Caddy, Traefik, Apache, or exposing Nest `:443` directly.

## Consequences

### Positive

- Matches SSE guidance (`X-Accel-Buffering: no`) already in [19-sse](../19-sse.md)  
- Aligns with client security TLS/HSTS baseline (ADR-0018)  
- Clear agent scaffold next to PM2  

### Negative / tradeoffs

- Cert renewal (certbot / ACME) ops burden  
- Another config surface to keep in sync with Nest routes  

### Follow-ups

- ACME / Let’s Encrypt (or vendor cert) runbook once AO-10 host known  
- Optional rate-limit zones for `/api/v1/auth/otp`  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Caddy (auto-HTTPS) | **Reject** as primary — NGINX locked; Caddy Assess only if supersede |
| Cloud LB only (no host proxy) | **Assess** under AO-10 containers/K8s; VM default remains NGINX |
| Nest HTTPS directly | **Reject** for prod |
| Apache | **Reject** |
