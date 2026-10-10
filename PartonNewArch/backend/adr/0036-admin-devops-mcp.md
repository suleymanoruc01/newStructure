# ADR-0036: Admin DevOps MCP server

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0035](0035-admin-devops-error-tracking.md) · [ADR-0034](0034-admin-full-case-coverage.md) · [ADR-0011](0011-auth-rbac.md) · [web/09-admin-devops.md](../../web/09-admin-devops.md) · [web/10-devops-mcp.md](../../web/10-devops-mcp.md)

## Context

Admin DevOps (ADR-0035) gives humans an in-app UI for errors, releases, and service health. AI coding agents (Cursor, Claude Code, etc.) also need a **safe, typed** way to query and triage the same DevOps surface without inventing scrapers against the admin SPA or bypassing Nest AuthZ. **MCP (Model Context Protocol)** is the standard agent tool interface in this toolchain. Without a PartOn DevOps MCP, agents either skip ops work or call REST ad hoc with inconsistent auth/redaction.

## Decision

1. PartOn ships a **DevOps MCP server** as a first-class deliverable alongside Admin DevOps UI.  
2. Location: `apps/devops-mcp` (or `packages/devops-mcp` if shared tooling prefers) — **stdio and/or Streamable HTTP** transport per current MCP spec (latest stable SDK).  
3. MCP tools call the **same Nest `devops` domain services / admin REST** as `w.admin.devops.*` — **one SoR**; MCP is not a second database.  
4. **AuthZ:** Every tool invocation requires admin-scoped credentials (`PARTON_ADMIN_TOKEN` or MCP service key mapped to `admin` role). Unauthenticated MCP is **forbidden**.  
5. **Tool surface (minimum):** list/get/resolve/ignore errors; list releases; get service health; list client builds; register release (CI). Same PII redaction as ADR-0035.  
6. **Hold:** MCP tools that open a shell, mutate git, read `.env` secrets, or impersonate non-admin users.  
7. Admin UI remains required for humans; MCP does **not** replace `w.admin.devops.*` screens.

## Consequences

### Positive

- Agents can triage errors/releases with grounded tools  
- Same AuthZ and redaction path as admin SPA  
- Clear scaffold in S8 with DevOps module  

### Negative / tradeoffs

- Extra app/package to version and secure  
- MCP credentials must be rotated like other admin secrets  

### Follow-ups

- Publish Cursor / Claude MCP config snippets in `apps/devops-mcp/README.md`  
- Rate limits on resolve/register tools  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Agents scrape admin UI | **Reject** — fragile, AuthZ unclear |
| Raw REST only (no MCP) | **Reject** as sole agent path — user requires MCP |
| MCP with open/no auth | **Reject** — security |
| MCP replaces admin DevOps UI | **Reject** — humans need screens (ADR-0035) |
