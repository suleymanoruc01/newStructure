# 06 — NGINX (Nest web reverse proxy)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0032 — NGINX reverse proxy](../backend/adr/0032-nginx-reverse-proxy.md)  
**Upstream:** Nest under **PM2** — [05-pm2.md](05-pm2.md) · ADR-0031  
**SSE:** [`../backend/19-sse.md`](../backend/19-sse.md) · **Security:** [`../backend/21-client-security.md`](../backend/21-client-security.md)  
**Ops:** [`../07-environments-and-ops.md`](../07-environments-and-ops.md)

> **NGINX** terminates TLS, serves **marketing** static (`apps/marketing/dist` on www), and reverse-proxies API/admin to Nest. Local day-to-day does not require NGINX.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Edge proxy | **NGINX** (Adopt) |
| Upstream | Nest on `127.0.0.1:<port>` via PM2 |
| TLS | Terminated at NGINX (or cloud LB → NGINX); Nest HTTP locally |
| Config in git | Templates under `deploy/nginx/` (or `ops/nginx/`) — **no** private keys |
| Local | Nest watch + Vite — NGINX optional |
| Hold | Caddy/Traefik/Apache as primary; Nest `:443` in prod |

---

## 1. Layout

```text
deploy/nginx/                 # or ops/nginx/
  parton.conf.template        # server blocks; envsubst or copy per env
  snippets/
    proxy-params.conf
    ssl-params.conf
  README.md                   # install + reload notes
```

Certs and `ssl_certificate` paths are **host-local** or secret-mounted — never committed.

---

## 2. Required behavior

| Concern | Requirement |
| --- | --- |
| HTTP | Redirect `80` → `443` |
| API | `location /api/` → Nest (`proxy_pass`) |
| Marketing | `www` (or apex) → static `apps/marketing/dist` — [07-marketing](07-marketing.md) |
| Admin SPA | `location /admin/` → Nest (Nest serves Vite `dist` + SPA fallback) |
| Health | `/health/live` · `/health/ready` proxied (LB may probe these) |
| Headers | `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` |
| HSTS | Enable on HTTPS server (align ADR-0018) |
| WebSockets | Not primary realtime path; SSE is |
| Client body | Size limits appropriate for document uploads (tune with product) |

---

## 3. SSE (mandatory)

Foreground SSE (ADR-0012) must not be buffered at the edge:

```nginx
location /api/v1/…sse… {   # exact paths from Nest SSE controllers — ground in code/docs
  proxy_pass http://127.0.0.1:NEST_PORT;
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_cache off;
  proxy_read_timeout 24h;
  add_header X-Accel-Buffering no;
  # … standard forwarded headers …
}
```

Idle timeout must exceed Nest SSE heartbeat interval ([19-sse](../backend/19-sse.md)). Agents must **open** the Nest SSE route file before inventing the `location` path.

---

## 4. Example skeleton (non-secret)

Agents fill `server_name`, ports, and cert paths at deploy time — do not invent production hostnames from memory.

```nginx
upstream parton_nest {
  server 127.0.0.1:3000;  # match PM2 / Nest listen
  keepalive 32;
}

server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;  # replace per env

  # ssl_certificate / ssl_certificate_key — host paths only

  location /health/ {
    proxy_pass http://parton_nest;
    include snippets/proxy-params.conf;
  }

  location /api/ {
    proxy_pass http://parton_nest;
    include snippets/proxy-params.conf;
    # optional: limit_req zone=otp for auth OTP paths
  }

  location /admin/ {
    proxy_pass http://parton_nest;
    include snippets/proxy-params.conf;
  }
}
```

Reload: `nginx -t && systemctl reload nginx` (or distro equivalent).

---

## 5. Stack with PM2

```text
Client → NGINX (TLS) → Nest (PM2, :3000) → Postgres / Redis / …
                ↘ static admin via Nest
```

Deploy order: build admin → build Nest → migrate → `pm2 reload` → `nginx -t && reload`.

---

## 6. Agent rules

1. Scaffold NGINX templates in S0/S9 with PM2 — no real certs in git.  
2. Do not document Caddy/Apache as the default edge.  
3. Always disable buffering on SSE locations.  
4. Ground SSE and admin mount paths from Nest/web docs — do not invent URLs.  
5. Ask once for staging host/`server_name`/cert material when wiring a real host.

---

## 7. DoD

- [ ] `deploy/nginx/` (or `ops/nginx/`) templates committed  
- [ ] HTTPS redirect + proxy to Nest documented  
- [ ] SSE location(s) with `proxy_buffering off`  
- [ ] No private keys in repo  
- [ ] Staging runbook: `nginx -t` + reload after Nest deploy  

---

## Related

- [ADR-0032](../backend/adr/0032-nginx-reverse-proxy.md)  
- PM2: [05-pm2.md](05-pm2.md)  
- Marketing: [07-marketing.md](07-marketing.md) · ADR-0033  
- SSE: [`../backend/19-sse.md`](../backend/19-sse.md)  
- Client security: [`../backend/21-client-security.md`](../backend/21-client-security.md)  
- Ops: [`../07-environments-and-ops.md`](../07-environments-and-ops.md)  
