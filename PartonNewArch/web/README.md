# Web / admin notes

**Stitch UI:** [12-stitch-web-admin-ui.md](12-stitch-web-admin-ui.md) · Web `9476327726481865180` · Admin `11035737984554056770`  

**Status:** `accepted` (stack) · screens `accepted` (case coverage inventory)  
**Locked shape:** Admin **management panel** lives in the **same NestJS application** as the REST API and uses the **same domain services** — [ADR-0001](../backend/adr/0001-nestjs-modular-monolith.md).  
**UI stack:** **Vite React + [shadcn/ui](https://github.com/shadcn-ui/ui), dark default** — [ADR-0014](../backend/adr/0014-web-ui-shadcn-dark.md) · [`04-shadcn-dark-ui.md`](04-shadcn-dark-ui.md)  
**Process manager:** **PM2** (Nest API + admin staging/prod) — [ADR-0031](../backend/adr/0031-pm2-web-process-manager.md) · [`05-pm2.md`](05-pm2.md)  
**Edge:** **NGINX** TLS + reverse proxy — [ADR-0032](../backend/adr/0032-nginx-reverse-proxy.md) · [`06-nginx.md`](06-nginx.md)  
**Marketing:** **`apps/marketing`** Vite public site — [ADR-0033](../backend/adr/0033-marketing-site.md) · [`07-marketing.md`](07-marketing.md)  
**Admin case coverage:** all 19 `CASE-*` groups — [ADR-0034](../backend/adr/0034-admin-full-case-coverage.md) · [`08-admin-case-coverage.md`](08-admin-case-coverage.md)  
**Admin DevOps:** errors + releases + health — [ADR-0035](../backend/adr/0035-admin-devops-error-tracking.md) · [`09-admin-devops.md`](09-admin-devops.md)  
**DevOps MCP:** agent tools — [ADR-0036](../backend/adr/0036-admin-devops-mcp.md) · [`10-devops-mcp.md`](10-devops-mcp.md)  
**Legal audit:** logger + admin CSV/PDF reports — [ADR-0037](../backend/adr/0037-legal-audit-logger.md) · [`11-legal-audit-reports.md`](11-legal-audit-reports.md) · [`../backend/22-legal-audit-logger.md`](../backend/22-legal-audit-logger.md)  
**UI mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md) · components [`../shared/02-ui-components.md`](../shared/02-ui-components.md)  
**Security:** Memory access JWT; HttpOnly refresh cookie + CSRF; CSP/HSTS — [ADR-0018](../backend/adr/0018-client-security.md) · [`../backend/21-client-security.md`](../backend/21-client-security.md)  
**UX layout:** Admin R7 + shared recipes — [ADR-0019](../backend/adr/0019-screen-ux-layout.md) · [`../shared/03-screen-ux-layout.md`](../shared/03-screen-ux-layout.md)  
**Wizards:** WizardShell + Nest draft for create-job — [ADR-0020](../backend/adr/0020-wizard-state.md) · [`../shared/04-wizard-state.md`](../shared/04-wizard-state.md)  
**A11y:** WCAG 2.2 AA — [ADR-0022](../backend/adr/0022-accessibility-wcag.md) · [`../shared/06-accessibility-wcag.md`](../shared/06-accessibility-wcag.md)  
**i18n:** Turkish (`tr-TR`) primary — [ADR-0023](../backend/adr/0023-i18n-turkish-primary.md) · [`../shared/07-i18n.md`](../shared/07-i18n.md)  
**Primary users:** Platform admins  
**Mobile-first product users:** Job seekers and employers use React Native; a separate employer **web console** is **not** a locked starting boundary (may revisit later) but stays catalogued so cases have a web surface when that channel ships.

Worker day-of flows (check-in, geo) stay **mobile-only**.

## How this folder relates

Screen catalogs are the case-driven capability inventory. **Admin** screens target the Nest-hosted **shadcn/ui** SPA. **Employer console** screens are optional / future unless product re-locks a web employer channel (reuse the same UI stack).

## Read order

| # | Doc | Purpose |
| --- | --- | --- |
| — | [Application architecture §13 / §15](../04-application-architecture.md) | Web UI + case→UI mandate |
| — | [UI components](../shared/02-ui-components.md) | Named components for all cases |
| — | [Screen UX & layout](../shared/03-screen-ux-layout.md) | Recipes R1–R8 (admin = R7) |
| — | [Wizard state](../shared/04-wizard-state.md) | Multi-step forms survive Back |
| — | [Accessibility (WCAG)](../shared/06-accessibility-wcag.md) | AA keyboard, contrast, Radix |
| — | [i18n](../shared/07-i18n.md) | tr-TR primary catalogs |
| 04 | [shadcn/ui dark stack](04-shadcn-dark-ui.md) | Vite, theme, components, Nest serve |
| 05 | [PM2](05-pm2.md) | Nest web process manager staging/prod (ADR-0031) |
| 06 | [NGINX](06-nginx.md) | TLS + reverse proxy to Nest (ADR-0032) |
| 07 | [Marketing site](07-marketing.md) | Public landing + legal (ADR-0033) |
| 08 | [Admin × case coverage](08-admin-case-coverage.md) | Every CASE-* → `w.admin.*` (ADR-0034) |
| 09 | [Admin DevOps](09-admin-devops.md) | Error tracking + codebase/release ops (ADR-0035) |
| 10 | [DevOps MCP](10-devops-mcp.md) | MCP server for AI agents (ADR-0036) |
| 11 | [Legal audit reports](11-legal-audit-reports.md) | Admin CSV/PDF from legal logger (ADR-0037) |
| — | [Fluid routing](../shared/08-routing.md) | React Router data APIs, layouts (ADR-0024) |
| — | [Modern UI principles](../shared/09-modern-ui-principles.md) | Sept 2026 look bar (ADR-0025) |
| — | [Modern UX principles](../shared/10-modern-ux-principles.md) | Sept 2026 experience bar (ADR-0026) |
| — | [Doc index](../DOC-INDEX.md) | Full architecture map |
| — | [Doc cohesion](../DOC-COHESION.md) | Keep docs in sync when editing |
| — | [API contracts](../shared/12-api-contracts.md) | REST envelope / errors |
| — | [Architecture decisions](../01-architecture-decisions.md) | Locked vs open |
| 01 | [Information architecture](01-information-architecture.md) | Sites, shells, nav |
| 02 | [Screen catalog index](02-screen-catalog.md) | Inventory |
| — | [Public & auth](screens/public-auth.md) | Landing, login, policies |
| — | [Employer console](screens/employer-console.md) | Not locked for v1 boundaries |
| — | [Admin console](screens/admin-console.md) | Nest admin panel targets |
| — | [Case-driven additions](screens/case-driven-additions.md) | Top-up, perf metrics |
| 03 | [Parity with mobile](03-parity-with-mobile.md) | Channel ownership |
| — | [Cases folder](../cases/) | Traceability |

## Conventions

See [`../shared/screen-conventions.md`](../shared/screen-conventions.md). UI primitives: shadcn `components/ui` (dark tokens) + case-driven names in [`02-ui-components`](../shared/02-ui-components.md).

## Why admin exists in Nest

| Need | Why same Nest app |
| --- | --- |
| Abuse / user restrict | Same AuthZ + domain services as API |
| Catalog / remote config | One rule layer |
| Ops tooling | No duplicate backend |
| SPA hosting | Nest serves Vite build; SPA calls `/api/v1` |
