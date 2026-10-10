# 10 — Admin DevOps MCP

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0036 — Admin DevOps MCP](../backend/adr/0036-admin-devops-mcp.md)  
**DevOps UI:** [`09-admin-devops.md`](09-admin-devops.md) · [ADR-0035](../backend/adr/0035-admin-devops-error-tracking.md)  
**Auth:** [ADR-0011](../backend/adr/0011-auth-rbac.md) · [18-auth-rbac](../backend/18-auth-rbac.md)

> Admin DevOps **must** expose an **MCP (Model Context Protocol) server** so AI agents can track errors and manage release/health ops with the same AuthZ and redaction as the admin UI.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Required? | **Yes** — ships with Admin DevOps |
| Package | `apps/devops-mcp` (Nest REST client → `/api/v1/admin/devops/*`) |
| SoR | Nest `devops` module / Postgres — MCP is a **facade** |
| Auth | Admin token or MCP service key → `admin` role only |
| UI | `w.admin.devops.*` still required for humans |
| Banned | Unauthenticated MCP; shell/git/secret tools |

---

## 1. Layout

```text
apps/devops-mcp/
  package.json
  src/
    index.ts           # MCP server entry (stdio / HTTP)
    tools/
      errors.ts
      releases.ts
      services.ts
      clients.ts
    auth.ts            # inject Bearer / API key
    client.ts          # typed fetch to Nest admin devops API
  README.md            # Cursor / Claude MCP config examples
```

Use **latest stable** MCP SDK (`@modelcontextprotocol/sdk` or current official package — verify with registry; do not invent pins).

---

## 2. Required tools

| Tool name | Maps to | Notes |
| --- | --- | --- |
| `devops_errors_list` | `GET .../devops/errors` | Filters: app, release, status |
| `devops_errors_get` | `GET .../devops/errors/:fingerprint` | Stack samples redacted |
| `devops_errors_resolve` | `PATCH` resolve/ignore | Audit who/when |
| `devops_releases_list` | `GET .../devops/releases` | Per-app SHA/version |
| `devops_releases_register` | `POST .../devops/releases` | CI after Fastlane/PM2 deploy |
| `devops_services_status` | `GET .../devops/services` | Health aggregates |
| `devops_clients_list` | `GET .../devops/clients` | Build versions / error rates |

Do **not** invent tools outside this table without updating this doc + ADR. Do **not** add `run_shell`, `read_env`, or `git_write`.

---

## 3. Auth & config

| Env | Purpose |
| --- | --- |
| `PARTON_API_BASE_URL` | Nest origin (e.g. `https://api…/api/v1`) |
| `PARTON_ADMIN_TOKEN` or `PARTON_MCP_API_KEY` | Admin-scoped credential |
| `PARTON_ENV` | `local` \| `staging` \| `production` (label only) |

Fail boot if credential missing ([agents/08](../agents/08-no-mocks-fully-functional.md)). Never commit tokens.

---

## 4. Agent / IDE wiring

Document in `apps/devops-mcp/README.md`:

- Cursor MCP config pointing at `pnpm --filter @parton/devops-mcp exec …` (or `node dist/index.js`)  
- Claude Code MCP registration  

Agents using PartOn DevOps **must** prefer these tools over inventing curl scrapes of `/admin`.

---

## 5. Privacy

Same rules as ADR-0035: no OTP, JWT, full phone, document bodies in tool responses. If Nest redacts, MCP must not re-hydrate secrets.

---

## 6. Agent rules

1. Scaffold `apps/devops-mcp` in **S8** with DevOps Nest module + admin screens.  
2. Ground tool names in this file — do not invent.  
3. MCP without admin auth is a **security defect**.  
4. Ask once for staging/prod MCP credentials — never stub.

---

## 7. DoD

- [ ] `apps/devops-mcp` builds and starts  
- [ ] All required tools implemented against real Nest admin APIs  
- [ ] Auth required; unauthenticated calls fail  
- [ ] README with Cursor/Claude config  
- [ ] Redaction tests  
- [ ] Listed in AGENTS / scaffold  

---

## Related

- [ADR-0036](../backend/adr/0036-admin-devops-mcp.md)  
- DevOps UI: [`09-admin-devops.md`](09-admin-devops.md)  
- Observability: [`../backend/09-observability.md`](../backend/09-observability.md)  
