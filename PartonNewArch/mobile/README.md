# Mobile screens & navigation

**Stack:** React Native **bare** (iOS + Android) — owned `ios/` and `android/`  
**Tooling:** **Expo forbidden** — [ADR-0006](../backend/adr/0006-bare-react-native-no-expo.md)  
**API:** NestJS REST `/api/v1` via shared Zod schemas — [backend/06-api-conventions.md](../backend/06-api-conventions.md)  
**Roadmap:** Mobile slices in [P0–P4](../02-product-roadmap.md)  
**Status:** `proposed` (screens provisional until feature scoping)  
**Audience:** Job seekers (workers), Employers

Legacy Kotlin screens in [`parton-codebase-wiki/04-screens-and-views.md`](../../parton-codebase-wiki/04-screens-and-views.md) are **capability references**, not a 1:1 port map.

## Boundaries

- Screens, navigation, and device operations live **only** in the mobile app.
- Mobile **must not** import DB models or backend internals.
- Talk to the server only through the REST contract; optionally reuse shared schemas for pre-submit validation (server validation still authoritative).
- Do **not** add Expo SDK, Expo Router, EAS, or Expo Go to this app.

## Read order

| # | Doc | Purpose |
| --- | --- | --- |
| — | [Architecture decisions](../01-architecture-decisions.md) | Locked vs open |
| 01 | [Information architecture](01-information-architecture.md) | Graphs, tabs, gates |
| 02 | [Screen catalog index](02-screen-catalog.md) | Full inventory + MVP |
| — | [Auth screens](screens/auth.md) | Login / OTP / role / policies |
| — | [Worker screens](screens/worker.md) | Feed, apply, shift, profile |
| — | [Employer screens](screens/employer.md) | Branches, jobs, applicants |
| — | [Manager screens](screens/manager.md) | Branch-scoped ops (role AO-11) |
| — | [Shared / system](screens/shared-system.md) | Settings, notifications, blockers |
| — | [Case-driven additions](screens/case-driven-additions.md) | Docs, dispute, verification |
| 03 | [Flows & deep links](03-flows-and-deep-links.md) | End-to-end journeys |
| — | [Cases folder](../cases/) | Full catalog traceability |

## Conventions

See [`../shared/screen-conventions.md`](../shared/screen-conventions.md).

## Suggested RN folder mapping (future code)

```text
apps/mobile/
  ios/                   # owned native project
  android/               # owned native project
  src/
    app/                 # navigation roots (React Navigation)
    features/
      auth/
      worker/
      employer/
      shared/
```
