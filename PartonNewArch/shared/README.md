# Shared notes & package boundaries

**Status:** `accepted` — packages `api-contracts` / `shared-utils` / `design-tokens` locked (ADR-0038)  
**Application architecture:** [`../04-application-architecture.md`](../04-application-architecture.md)  
**Decisions:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)  
**Cohesion:** [`../DOC-COHESION.md`](../DOC-COHESION.md) · Index: [`../DOC-INDEX.md`](../DOC-INDEX.md)

Cross-cutting contracts between Nest backend and React Native. **No** server secrets, DB models, or Nest providers in shared packages.

## What shared packages may contain

| Allowed | Forbidden |
| --- | --- |
| API request/response schemas | Database access / ORM models |
| TypeScript types derived from those schemas | Business rules that depend on DB state |
| Platform-agnostic helpers (pure functions, formatters) | Authorization / role policy engines |
| Design tokens (colors JSON / Tailwind preset) | API keys, JWT secrets, env loaders |
| Shared error **code enums** ([12-api-contracts](12-api-contracts.md)) | |
| | Direct imports from `apps/backend` |

## What each app owns

| Backend (`apps/backend`) | Mobile (`apps/mobile`) |
| --- | --- |
| PostgreSQL access | Screens & navigation |
| Domain services / AuthZ | Device ops (GPS, push, secure storage) |
| REST controllers + admin UI | HTTP client using shared schemas |
| Runtime validation of inbound requests with shared schemas | Optional pre-submit validation with same schemas |

Mobile **must not** depend on database models; it talks only through the REST contract (`/api/v1`).

## Visual source of truth

| Doc | Status |
| --- | --- |
| **[`../DESIGN.md`](../DESIGN.md)** | **Accepted** — agent visual SoR (Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md)) · ADR-0039 |
| [13-stitch-projects.md](13-stitch-projects.md) | **Accepted** — Stitch project IDs for all 147 `m.*`/`w.*` screens |

## Docs in this folder

| Doc | Status |
| --- | --- |
| [01-color-system.md](01-color-system.md) | **Accepted** — Web + Mobile semantic colors (ADR-0017); must match DESIGN.md §2 |
| [02-ui-components.md](02-ui-components.md) | **Accepted** — Case-driven component inventory ([UI mandate](../cases/03-ui-coverage-mandate.md)) |
| [03-screen-ux-layout.md](03-screen-ux-layout.md) | **Accepted** — Layout recipes R1–R8 + CASE-UX (ADR-0019) |
| [04-wizard-state.md](04-wizard-state.md) | **Accepted** — Multi-step wizard state (lift / store / Nest draft) — ADR-0020 |
| [05-push-notifications-ux.md](05-push-notifications-ux.md) | **Accepted** — User-centered push catalog (ADR-0021) |
| [06-accessibility-wcag.md](06-accessibility-wcag.md) | **Accepted** — WCAG 2.2 AA Web + mobile equivalent (ADR-0022) |
| [07-i18n.md](07-i18n.md) | **Accepted** — Turkish (`tr-TR`) primary i18n (ADR-0023) |
| [08-routing.md](08-routing.md) | **Accepted** — Fluid routing mobile + web (ADR-0024) |
| [09-modern-ui-principles.md](09-modern-ui-principles.md) | **Accepted** — Modern UI principles Sept 2026 (ADR-0025) |
| [10-modern-ux-principles.md](10-modern-ux-principles.md) | **Accepted** — Modern UX principles Sept 2026 (ADR-0026) |
| [11-glossary.md](11-glossary.md) | **Accepted** — Domain & architecture glossary |
| [12-api-contracts.md](12-api-contracts.md) | **Accepted** — Envelope, errors, pagination, Zod (ADR-0027) |
| [screen-conventions.md](screen-conventions.md) | Screen IDs / template + UX gate fields |
| Package names & folder layout | **Accepted** — `api-contracts` / `shared-utils` / `design-tokens` — ADR-0038 |

## Related

- REST conventions: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Monorepo ADR: [`../backend/adr/0005-monorepo.md`](../backend/adr/0005-monorepo.md) · tooling [ADR-0038](../backend/adr/0038-monorepo-tooling.md)
- Agents: [`../AGENTS.md`](../AGENTS.md) · [`../agents/10-production-ready.md`](../agents/10-production-ready.md) · Glossary: [`11-glossary.md`](11-glossary.md)
