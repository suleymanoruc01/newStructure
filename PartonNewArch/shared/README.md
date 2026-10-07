# Shared notes & package boundaries

**Status:** `accepted` (rules); package names `open`  
**Decisions:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

Cross-cutting contracts between Nest backend and React Native. **No** server secrets, DB models, or Nest providers in shared packages.

## What shared packages may contain

| Allowed | Forbidden |
| --- | --- |
| API request/response schemas | Database access / ORM models |
| TypeScript types derived from those schemas | Business rules that depend on DB state |
| Platform-agnostic helpers (pure functions, formatters) | Authorization / role policy engines |
| Shared error **code enums** (once AO-6 lands) | API keys, JWT secrets, env loaders |
| | Direct imports from `apps/backend` |

## What each app owns

| Backend (`apps/backend`) | Mobile (`apps/mobile`) |
| --- | --- |
| PostgreSQL access | Screens & navigation |
| Domain services / AuthZ | Device ops (GPS, push, secure storage) |
| REST controllers + admin UI | HTTP client using shared schemas |
| Runtime validation of inbound requests with shared schemas | Optional pre-submit validation with same schemas |

Mobile **must not** depend on database models; it talks only through the REST contract (`/api/v1`).

## Docs in this folder

| Doc | Status |
| --- | --- |
| [screen-conventions.md](screen-conventions.md) | Screen IDs / template (provisional with cases) |
| Package names & folder layout | `open` (AO-7) — **proposed** `api-contracts` + `shared-utils` via pnpm/Turborepo |
| Error catalog / pagination contract | `open` (AO-6) — draft envelope in [roadmap](../02-product-roadmap.md) / [radar](../03-tech-radar-2026.md) |
| Validation library choice | `open` (AO-8) — **proposed Zod 4** |

## Related

- REST conventions: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Monorepo ADR: [`../backend/adr/0005-monorepo.md`](../backend/adr/0005-monorepo.md)
