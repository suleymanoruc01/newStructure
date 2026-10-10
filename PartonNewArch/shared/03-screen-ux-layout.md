# 03 — Screen UX & layout (best experience)

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**ADR:** [0019 — Screen UX & layout baseline](../backend/adr/0019-screen-ux-layout.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §15.3  
**Components:** [`02-ui-components.md`](02-ui-components.md)  
**Colors:** [`01-color-system.md`](01-color-system.md)  
**Principles:** [`09-modern-ui-principles.md`](09-modern-ui-principles.md) (UI) · [`10-modern-ux-principles.md`](10-modern-ux-principles.md) (UX) — Sept 2026  
**Conventions:** [`screen-conventions.md`](screen-conventions.md)  
**Cases:** `CASE-UX` T-235–T-243 · UI mandate [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)

> Every catalog screen must be **scannable in one glance**: one job, one primary action, clear states, and components placed in a predictable layout. Visual stacks stay NativeWind / Liquid Glass (mobile) and shadcn dark (admin) — this doc owns **composition**, not paint.

---

## Verdict

| Rule | Stance |
| --- | --- |
| One job per screen / section | Purpose + one headline idea; no dashboard clutter on consumer P0 |
| One primary CTA | Single `action-primary` per viewport (ADR-0017) |
| Layout recipes | Use named recipes below — do not invent ad-hoc zone soup |
| Components | Compose only from [`02-ui-components`](02-ui-components.md) (+ platform primitives) |
| States | Always design `loading` / `empty` / `error` / `blocked` with copy + next step |
| Chrome vs content | Mobile: glass chrome, solid content cards — [mobile/05](../mobile/05-wwdc-liquid-glass.md) |
| Density | Mobile = thumb-first sparse; Admin = table-dense; Employer web = form-dense |
| AuthZ UI | Hide disabled actions with explainers; **never** as security |

---

## 1. Layout recipes (use these)

### R1 — Tab root (Home / Feed / List)

```text
┌ safe area / translucent header ──────────────┐
│ Title · optional filter · bell               │
├──────────────────────────────────────────────┤
│ Optional alert / Confirm3h / token chip      │  ← max 1 sticky strip
├──────────────────────────────────────────────┤
│ Content list (JobCard / Applicant rows)      │  ← scrolls under chrome
│ …                                            │
├──────────────────────────────────────────────┤
│ Tab bar (glass / Material)                   │
└──────────────────────────────────────────────┘
```

| Do | Don't |
| --- | --- |
| One sticky alert max | Stack of promo banners |
| SkeletonList on first load | Blank white flash |
| EmptyState + single CTA | “No data” with no next step |

**Screens:** `m.worker.home.root`, `m.worker.jobs.list`, `m.employer.home.root`, `m.employer.jobs.list`, favorites lists.

### R2 — Detail (Job / Application / Branch)

```text
┌ back · overflow ─────────────────────────────┐
│ Hero / map / status badge                    │  ← content brand moment
│ Title + key facts (time, pay, distance)      │
│ Body sections (requirements, docs, map)      │
│ …                                            │
├ sticky bottom bar ───────────────────────────┤
│ Primary CTA  |  Secondary                    │
└──────────────────────────────────────────────┘
```

| Do | Don't |
| --- | --- |
| Sticky primary for Apply / Accept / Check-in | Primary buried mid-scroll |
| StatusBadge near title | Duplicate status in 3 places |
| Overlap / incomplete gates as sheets | Silent disabled buttons |

### R3 — Wizard / multi-step (Create job, onboarding)

```text
┌ step indicator (3–6 steps max) ──────────────┐
│ Step title + one sentence help               │
│ Form fields for THIS step only               │
├──────────────────────────────────────────────┤
│ Back · Next/Publish (primary)                │
└──────────────────────────────────────────────┘
```

| Do | Don't |
| --- | --- |
| One concern per step (T-237) | Mega-form with all job fields |
| TokenCostPreview before publish | Surprise hold after publish |
| **Lifted / store-owned values** so Back restores fields | Step-only `useState` (lost on unmount) |
| Nest draft + resume for create-job | Lose progress on back / process kill |

**State ownership (mandatory):** [`04-wizard-state.md`](04-wizard-state.md) · [ADR-0020](../backend/adr/0020-wizard-state.md) — `WizardShell` parent (and scoped Zustand/Context when steps are separate routes); hide-instead-of-unmount is **not** sufficient alone.

**A11y:** [`06-accessibility-wcag.md`](06-accessibility-wcag.md) — every recipe must keep labeled CTAs, contrast, and SR-friendly structure.

**Screens:** `m.employer.jobs.create.*`, worker/employer onboarding, `m.auth.*` gates.

### R4 — Confirm / decision sheet

```text
┌ sheet / modal ───────────────────────────────┐
│ Summary card (what happens if I confirm)     │
│ Warnings (OverlapWarnDialog, holds, etc.)    │
│ Primary confirm · Cancel                     │
└──────────────────────────────────────────────┘
```

Used for apply-confirm, accept/reject, token top-up confirm, logout, destructive admin.

### R5 — Day-of critical (Check-in / 3h / location)

```text
┌ high-contrast header (time remaining) ───────┐
│ Big status (GeofenceStatus / AccuracyMeter)  │
│ Map or branch context                        │
│ PermissionExplainer if needed (T-241)        │
├──────────────────────────────────────────────┤
│ Huge CheckInButton / CanComeButtons          │
└──────────────────────────────────────────────┘
```

| Do | Don't |
| --- | --- |
| Time + distance as hero numbers (T-240) | Dense settings chrome |
| Solid high-contrast CTA (not glass) | Translucent check-in button |
| Rationale **before** OS permission sheet | Cold system dialog |

### R6 — Settings / form single-purpose

```text
┌ title ───────────────────────────────────────┐
│ Grouped sections (list / cards)              │
│ Inline FieldError · FormErrorBanner          │
└ save / done (if dirty) ──────────────────────┘
```

### R7 — Admin / ops console (web)

```text
┌ sidebar │ top bar (org · search · user) ─────┐
│         │ page title · primary action        │
│         │ filters toolbar                    │
│         │ DataTable / queue                  │
│         │ Sheet/Dialog for detail            │
└─────────┴────────────────────────────────────┘
```

| Do | Don't |
| --- | --- |
| Table + sheet for detail | Full page hop for every row |
| One orange primary per view | Rainbow action buttons |
| OpsMetricCards above fold on dashboard | Marketing hero on admin |

### R8 — System / blocker

Full-screen `ForbiddenState`, `SessionExpiredCard`, restriction, maintenance — **one** message, **one** CTA (re-auth, contact support, dismiss).

---

## 2. Component placement rules

| Zone | Allowed components | Avoid |
| --- | --- | --- |
| Header / chrome | Title, back, bell, `ActiveContextBadge`, filter icon | Brand logo walls, multi-CTA |
| Sticky alert | One of: Confirm3h, InsufficientTokens, FormErrorBanner | Stacked toasts as layout |
| Content list | `JobCard`, `NotificationRow`, `ApplicantTable` rows | Nested cards-in-cards |
| Content detail | Solid cards, map, `MatchReasonChips`, docs checklist | Glass overlays on body copy |
| Footer / sticky | `PrimaryButton` + optional secondary | Two equal primary oranges |
| Sheets | Confirm / overlap / top-up / context-switch | Full feature apps in sheets |
| Empty / error | `EmptyState`, `SkeletonList`, retry | Raw exception strings |

**Composition law:** If a pattern repeats twice, it must be a named component in [`02-ui-components`](02-ui-components.md).

---

## 3. Hierarchy & interaction

| Principle | Practice |
| --- | --- |
| F-pattern / thumb zone | Primary CTA bottom-sticky on mobile detail/day-of |
| Progressive disclosure | Advanced filters in sheet; defaults sane for T-238 |
| Feedback | Toast for success; banner for blocking errors; inline for fields |
| Timing | Optimistic UI only when server idempotent; else await |
| Hit targets | ≥ 44×44 pt mobile; dense but clickable rows on admin |
| Motion | Sheet/tab transitions only — no decorative noise on lists |
| Typography | Title → one support line → body; no wall of equal weight |
| Color | Status via feedback tokens; one primary CTA color |

---

## 4. Required states (every screen)

Screen specs must list layout for:

| State | Layout expectation | Component |
| --- | --- | --- |
| `loading` | Skeleton matching final structure | `SkeletonList` / skeletons |
| `empty` | Illustration/icon + why + CTA | `EmptyState` |
| `error` | Retry + human message (+ code if useful) | `FormErrorBanner` / error card |
| `blocked` | Restriction / incomplete / tokens | Gate banners / system screens |
| `success` | Confirm + where next | Toast or inline success |

Offline (mobile): non-blocking banner; queue only where product allows.

---

## 5. CASE-UX → layout mapping

| Case | Layout / component focus |
| --- | --- |
| **T-235** First-run worker | R3 onboarding + `FirstRunCoachmarks` on R1 home — ≤3 coach marks |
| **T-236** Profile time | R3 short steps; `ProfileCompletionMeter`; skip-optional fields |
| **T-237** Create job clarity | R3 wizard; `TokenCostPreview` + `PublishGateBanner` on last step |
| **T-238** Feed clarity | R1; `JobCard` shows time/pay/distance; `MatchReasonChips` optional; filters secondary |
| **T-239** Application status | R2 / list; `ApplicationStatusBadge` + timeline on `job-process.detail` |
| **T-240** Check-in timing | R5; countdown + window copy above `CheckInButton` |
| **T-241** Location rationale | `PermissionExplainer` **before** OS prompt; deny → `LocationDeniedState` |
| **T-242** Favorites | R1; `FavoriteToggle` affordance obvious; empty → browse jobs CTA |
| **T-243** Token mental model | `TokenExplainer` + `HoldBreakdown` on tokens root and create-job summary |

---

## 6. Channel density

| Channel | Density | Layout bias |
| --- | --- | --- |
| Mobile worker/employer | Comfortable | R1–R6; large CTA; one column |
| Mobile manager | Comfortable | Branch-scoped lists; same recipes |
| Admin web | Compact | R7 tables, sheets, keyboard |
| Employer web (if shipped) | Compact–medium | R3 wizards + R7 boards |

Parity: same **state machines and labels**; different density — [web/03-parity](../web/03-parity-with-mobile.md).

---

## 7. Anti-patterns (UX Hold)

| Anti-pattern | Why |
| --- | --- |
| Dashboard kitchen-sink on consumer home | Breaks T-235 / one-job rule |
| Multiple primary orange buttons | Decision paralysis |
| Glass / blur on job cards or forms | Hurts readability (Liquid Glass misuse) |
| Empty state with no CTA | Dead end |
| Disabled primary with no reason | Users feel broken (use gate banner) |
| Wizard with 10+ steps | Fails T-236 / T-237 |
| Admin marketing hero / card collage | Wrong surface |
| Nesting scroll views fighting each other | Jank |

---

## 8. Screen spec UX fields (required)

Extend [`screen-conventions`](screen-conventions.md) **Layout** with:

| Field | Example |
| --- | --- |
| **Recipe** | `R1` / `R2` / … |
| **Primary CTA** | Label + component |
| **Components** | Named list from 02 |
| **States** | loading / empty / error / blocked copy keys |

PR gate: screen without recipe + states + components = incomplete (with UI mandate).

---

## 9. Delivery

| Phase | Outcome |
| --- | --- |
| P0 | Apply recipes to all P0 screens; empty/loading/error copy; T-240/241/243 layouts |
| P1 | Coachmarks T-235; wizard polish T-236/237; feed filters T-238 |
| P2 | Motion polish; admin density QA; A/B only with metrics |

---

## Related

- [ADR-0019](../backend/adr/0019-screen-ux-layout.md)  
- Components: [`02-ui-components.md`](02-ui-components.md)  
- Mobile IA: [`../mobile/01-information-architecture.md`](../mobile/01-information-architecture.md)  
- Liquid Glass: [`../mobile/05-wwdc-liquid-glass.md`](../mobile/05-wwdc-liquid-glass.md)  
- Admin UI: [`../web/04-shadcn-dark-ui.md`](../web/04-shadcn-dark-ui.md)  
- CASE-UX: [`../cases/groups/CASE-UX.md`](../cases/groups/CASE-UX.md)  
