# Mobile screens & navigation

**Stack:** React Native **bare** — **iOS + Android** first-class (latest OS ready) — owned `ios/` and `android/`  
**Platforms:** [06-ios-android-platforms.md](06-ios-android-platforms.md) · [ADR-0029](../backend/adr/0029-dual-platform-ios-android.md)  
**Release:** **Fastlane** — [07-fastlane.md](07-fastlane.md) · [ADR-0030](../backend/adr/0030-fastlane-mobile-release.md)  
**UI:** **[NativeWind](https://www.nativewind.dev/)** (Tailwind `className`) — [ADR-0015](../backend/adr/0015-mobile-ui-nativewind.md) · [`04-nativewind-ui.md`](04-nativewind-ui.md)  
**Stitch visual redesign:** [08-stitch-mobile-ui.md](08-stitch-mobile-ui.md) · project `12785901164400200423` · [`../DESIGN.md`](../DESIGN.md)  
**iOS design language:** Liquid Glass / WWDC principles — [ADR-0016](../backend/adr/0016-mobile-ui-wwdc-liquid-glass.md) · [`05-wwdc-liquid-glass.md`](05-wwdc-liquid-glass.md)  
**Tooling:** **Expo forbidden** — [ADR-0006](../backend/adr/0006-bare-react-native-no-expo.md) · latest RN — [ADR-0028](../backend/adr/0028-latest-stable-stack.md)  
**API:** NestJS REST `/api/v1` via shared Zod schemas — [backend/06-api-conventions.md](../backend/06-api-conventions.md)  
**Roadmap:** Mobile slices in [P0–P4](../02-product-roadmap.md)  
**Status:** UI stack `accepted` · screens `accepted` (case coverage inventory)  
**UI mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md) · components [`../shared/02-ui-components.md`](../shared/02-ui-components.md)  
**Security:** Access JWT in memory; refresh in Keychain — [ADR-0018](../backend/adr/0018-client-security.md) · [`../backend/21-client-security.md`](../backend/21-client-security.md)  
**UX layout:** Recipes R1–R8 — [ADR-0019](../backend/adr/0019-screen-ux-layout.md) · [`../shared/03-screen-ux-layout.md`](../shared/03-screen-ux-layout.md)  
**Wizards:** Lifted / store-owned state (survive Back) — [ADR-0020](../backend/adr/0020-wizard-state.md) · [`../shared/04-wizard-state.md`](../shared/04-wizard-state.md)  
**Push UX:** User-centered templates & prefs — [ADR-0021](../backend/adr/0021-push-notifications-ux.md) · [`../shared/05-push-notifications-ux.md`](../shared/05-push-notifications-ux.md)  
**A11y:** WCAG-equivalent AA — [ADR-0022](../backend/adr/0022-accessibility-wcag.md) · [`../shared/06-accessibility-wcag.md`](../shared/06-accessibility-wcag.md)  
**i18n:** Turkish (`tr-TR`) primary — [ADR-0023](../backend/adr/0023-i18n-turkish-primary.md) · [`../shared/07-i18n.md`](../shared/07-i18n.md)  
**Audience:** Job seekers (workers), Employers

Legacy Kotlin screens in [`parton-codebase-wiki/04-screens-and-views.md`](../../parton-codebase-wiki/04-screens-and-views.md) are **capability references**, not a 1:1 port map.

## Boundaries

- Screens, navigation, and device operations live **only** in the mobile app.
- Mobile **must not** import DB models or backend internals.
- Talk to the server only through the REST contract; optionally reuse shared schemas for pre-submit validation (server validation still authoritative).
- Do **not** add Expo SDK, Expo Router, EAS, or Expo Go to this app.
- Prefer **NativeWind** utilities for styling; do not invent a second design system.
- Ship **both** iOS and Android; QA on **latest stable** OS; CI builds both — [06](06-ios-android-platforms.md).
- Store/CI release via **Fastlane** only — [07](07-fastlane.md); never EAS.

## Read order

| # | Doc | Purpose |
| --- | --- | --- |
| — | [Application architecture §14–§15](../04-application-architecture.md) | Mobile UI + case→UI mandate |
| — | [UI components](../shared/02-ui-components.md) | Named components for all cases |
| — | [Screen UX & layout](../shared/03-screen-ux-layout.md) | Recipes R1–R8, CASE-UX |
| — | [Wizard state](../shared/04-wizard-state.md) | Multi-step forms survive Back |
| — | [Push notifications UX](../shared/05-push-notifications-ux.md) | Templates, prefs, deep links |
| — | [Accessibility (WCAG)](../shared/06-accessibility-wcag.md) | Labels, contrast, VO/TalkBack |
| — | [i18n](../shared/07-i18n.md) | tr-TR primary catalogs |
| 08 | [Stitch mobile UI](08-stitch-mobile-ui.md) | Google Stitch screens + design system (visual SoR) |
| 04 | [NativeWind UI stack](04-nativewind-ui.md) | Tailwind on bare RN, theme, components |
| 05 | [WWDC Liquid Glass](05-wwdc-liquid-glass.md) | iOS UI vs content layer, brand, a11y |
| 06 | [iOS + Android platforms](06-ios-android-platforms.md) | Latest OS, dual-platform DoD (ADR-0029) |
| 07 | [Fastlane](07-fastlane.md) | Build / sign / App Store + Play (ADR-0030) |
| — | [Doc index](../DOC-INDEX.md) | Full architecture map |
| — | [Doc cohesion](../DOC-COHESION.md) | Keep docs in sync when editing |
| — | [Glossary](../shared/11-glossary.md) | Domain terms |
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
| — | [Fluid routing](../shared/08-routing.md) | React Navigation graph, linking, gates (ADR-0024) |
| — | [Modern UI principles](../shared/09-modern-ui-principles.md) | Sept 2026 look bar (ADR-0025) |
| — | [Modern UX principles](../shared/10-modern-ux-principles.md) | Sept 2026 experience bar (ADR-0026) |
| — | [Cases folder](../cases/) | Full catalog traceability |

## Conventions

See [`../shared/screen-conventions.md`](../shared/screen-conventions.md).

## Suggested RN folder mapping (future code)

```text
apps/mobile/
  ios/                   # owned native project
  android/               # owned native project
  fastlane/              # Fastlane (ADR-0030)
  Gemfile
  PLATFORM.md
  global.css             # NativeWind / Tailwind input
  metro.config.js        # withNativeWind
  src/
    app/                 # navigation roots (React Navigation)
    components/ui/       # NativeWind primitives
    features/
      auth/
      worker/
      employer/
      shared/
```
