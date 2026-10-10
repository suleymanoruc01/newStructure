# Agents — AI implementation pack

Instructions so **Cursor**, **Claude Code**, **Antigravity**, and similar tools can build PartOn with minimal human prompts.

| Doc | Purpose |
| --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | **Start here** — bans, autonomy, DoD |
| [`../DESIGN.md`](../DESIGN.md) | **Visual SoR** — Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md) · ADR-0039 |
| [`../CLAUDE.md`](../CLAUDE.md) | Claude Code pointer |
| [00-operating-manual.md](00-operating-manual.md) | Session loop & context budget |
| [01-implementation-playbook.md](01-implementation-playbook.md) | Ordered S0–S9 |
| [02-defaults-and-non-asks.md](02-defaults-and-non-asks.md) | Frozen answers — do not ask user |
| [03-scaffold-spec.md](03-scaffold-spec.md) | Repo tree & versions |
| [04-coding-conventions.md](04-coding-conventions.md) | Nest / RN / admin patterns |
| [05-slice-catalog.md](05-slice-catalog.md) | Per-slice deliverables & docs |
| [06-start-prompts.md](06-start-prompts.md) | Copy-paste prompts (zero follow-ups) |
| [07-anti-hallucination.md](07-anti-hallucination.md) | **Mandatory grounding** — no invented APIs/screens/cases |
| [08-no-mocks-fully-functional.md](08-no-mocks-fully-functional.md) | **No mocks** — fully functional sandbox integrations |
| [09-latest-stack-policy.md](09-latest-stack-policy.md) | **Latest stable** Nest 12 / TS 6 / RN / Zod… (ADR-0028) |
| [10-production-ready.md](10-production-ready.md) | **Production-ready** full-stack coding gate |
| [../mobile/06-ios-android-platforms.md](../mobile/06-ios-android-platforms.md) | **iOS + Android** latest OS readiness (ADR-0029) |
| [../mobile/07-fastlane.md](../mobile/07-fastlane.md) | **Fastlane** store/CI release (ADR-0030) |
| [../web/05-pm2.md](../web/05-pm2.md) | **PM2** Nest web process manager (ADR-0031) |
| [../web/06-nginx.md](../web/06-nginx.md) | **NGINX** TLS + reverse proxy (ADR-0032) |
| [../web/07-marketing.md](../web/07-marketing.md) | **Marketing site** Vite public (ADR-0033) |
| [../web/08-admin-case-coverage.md](../web/08-admin-case-coverage.md) | **Admin × all CASE-*** (ADR-0034) |
| [../web/09-admin-devops.md](../web/09-admin-devops.md) | **Admin DevOps** errors & releases (ADR-0035) |
| [../web/10-devops-mcp.md](../web/10-devops-mcp.md) | **DevOps MCP** for AI agents (ADR-0036) |
| [../web/11-legal-audit-reports.md](../web/11-legal-audit-reports.md) | **Legal audit** admin CSV/PDF (ADR-0037) |
| [../backend/22-legal-audit-logger.md](../backend/22-legal-audit-logger.md) | Legal audit logger (ADR-0037) |

**Cohesion with architecture docs:** [`../DOC-COHESION.md`](../DOC-COHESION.md) · [`../DOC-INDEX.md`](../DOC-INDEX.md)

Cursor rule: [`../../.cursor/rules/parton-newarch.mdc`](../../.cursor/rules/parton-newarch.mdc)
