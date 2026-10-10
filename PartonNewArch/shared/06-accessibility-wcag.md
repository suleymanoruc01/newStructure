# 06 — Accessibility (WCAG) — Web + Mobile

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**ADR:** [0022 — Accessibility WCAG baseline](../backend/adr/0022-accessibility-wcag.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §15.5  
**Colors:** [`01-color-system.md`](01-color-system.md) · **UX layouts:** [`03-screen-ux-layout.md`](03-screen-ux-layout.md)  
**Stacks:** Admin [shadcn](../web/04-shadcn-dark-ui.md) · Mobile [NativeWind](../mobile/04-nativewind-ui.md) + [Liquid Glass](../mobile/05-wwdc-liquid-glass.md)

> PartOn must be usable by people using **keyboards, screen readers, larger text, and reduced motion/transparency**. Web admin targets **WCAG 2.2 Level AA**. Mobile follows the same user outcomes via **iOS / Android accessibility APIs** (VoiceOver, TalkBack, Dynamic Type) mapped to WCAG principles — not a separate “pretty but inaccessible” UI.

---

## Verdict

| Topic | PartOn stance |
| --- | --- |
| Web target | **WCAG 2.2 AA** (admin + any employer web) |
| Mobile target | **Equivalent AA outcomes** + platform checklists (Apple HIG a11y, Android accessibility) |
| Contrast | Semantic tokens must meet **4.5:1** normal text / **3:1** large text & UI components (AA) |
| Glass / blur | **Chrome only**; solid fallback when Reduce Transparency / Increase Contrast (ADR-0016) |
| Day-of critical | Check-in / 3h / geo errors: **high contrast, no glass** on primary CTA |
| Components | Prefer Radix/shadcn (web) and accessible RN primitives with labels |
| Gate | P0 screens ship with a11y acceptance; blockers for contrast/name/role/keyboard |

**Non-goal (v1):** WCAG **AAA** as default; full audited certification before launch (schedule pen-test / a11y audit P2+).

---

## 1. Principles → PartOn practice

| WCAG principle | Web (Vite + shadcn) | Mobile (bare RN) |
| --- | --- | --- |
| **Perceivable** | Contrast tokens; text alternatives; captions N/A for v1 video | Dynamic Type; `accessibilityLabel`; solid surfaces under Reduce Transparency |
| **Operable** | Full keyboard; focus visible; no keyboard traps in dialogs/sheets | Min **44×44 pt** targets; TalkBack/VoiceOver order; gesture alternatives |
| **Understandable** | Clear labels; error text tied to fields; TR locale | Same; `FormErrorBanner` / `FieldError` announced |
| **Robust** | Valid roles via Radix; test with axe / VoiceOver web | `accessibilityRole` / Android `accessibility*` props; no unlabeled icons |

---

## 2. Contrast & color (AA)

| Rule | Detail |
| --- | --- |
| Source | Only [`01-color-system`](01-color-system.md) tokens |
| Body text | ≥ **4.5:1** on `surface-*` in **light and dark** |
| Large text (≥18pt / 14pt bold) | ≥ **3:1** |
| UI / icons / borders that convey state | ≥ **3:1** against adjacent background |
| Orange CTA | Verify `action-primary` + `text-on-color` / label contrast; fix via tokens only |
| Status color | Never color-alone: pair with icon + text (`StatusBadge`) |
| Focus | Visible ring ≥ 3:1 (web `:focus-visible`; RN focus if keyboard/external) |

Scaffold: run contrast checks on token pairs; document results next to color table. Fail PRs that introduce raw hex bypassing tokens.

---

## 3. Web admin (WCAG 2.2 AA checklist)

| Area | Requirement |
| --- | --- |
| **Keyboard** | All queue actions, dialogs, sheets, sidebar nav operable without mouse |
| **Focus order** | Logical DOM order; shadcn Dialog/Sheet trap focus correctly |
| **Focus visible** | Never `outline-none` without replacement ring |
| **Name, Role, Value** | Prefer shadcn/Radix; icon-only buttons need `aria-label` |
| **Forms** | `<Label>` associated; errors via `aria-invalid` + describedby |
| **Live regions** | Toasts/Sonner polite; critical errors assertive when needed |
| **Skip link** | Skip to main content on admin shell |
| **Landmarks** | `nav`, `main`, complementary for sidebar |
| **Motion** | Honor `prefers-reduced-motion` — reduce/disable non-essential animation |
| **Zoom** | Usable at **200%** browser zoom without loss of critical actions |
| **Language** | `<html lang="tr">` (or active locale) — [07-i18n](07-i18n.md) · ADR-0023 |
| **Testing** | axe DevTools / `@axe-core` in CI smoke; keyboard pass on P0 routes |

---

## 4. Mobile (equivalent AA outcomes)

| Area | Requirement |
| --- | --- |
| **Screen reader** | Every interactive control has `accessibilityLabel` (+ hint when needed) |
| **Roles** | Buttons, headers, tabs, switches mapped (`accessibilityRole`) |
| **Dynamic Type** | Body/forms scale; OTP boxes and CTAs don’t clip (Liquid Glass §5) |
| **Hit targets** | ≥ 44×44 pt (R3/R5 sticky CTAs included) |
| **Reduce Transparency** | `useGlassEnabled()` → solid chrome |
| **Increase Contrast** | Stronger borders; disable decorative blur |
| **Reduce Motion** | Instant navigation; no decorative morph loops |
| **Color independence** | Status + MatchReasonChips use text/icon |
| **Images** | Job/hero images decorative or labeled |
| **Permissions** | `PermissionExplainer` before OS sheets (location/push) — clear language |
| **Testing** | VoiceOver (iOS) + TalkBack (Android) on P0 journeys: auth, feed, apply, 3h, check-in |

---

## 5. Screen & component rules

| Pattern | A11y rule |
| --- | --- |
| R1 lists | Row announces title + key status; unread not color-only |
| R2 detail | Sticky primary has accessible name matching visible CTA |
| R3 wizard | Step indicator announced (“Adım 2 / 4”); errors on Next focus first invalid field |
| R4 sheets | Focus moves into sheet; dismiss announced; Escape/back |
| R5 day-of | High-contrast CTA; geo status announced on change |
| R7 admin tables | Column headers; sortable buttons named; row actions labeled |
| R8 blockers | Single heading + one primary action; screen-reader friendly |

Components that **must** be a11y-complete: `PrimaryButton`, `OtpInput`, `CheckInButton`, `ApplyConfirmSheet`, `NotificationRow`, `EmptyState`, form fields, shadcn Dialog/Sheet/Table.

---

## 6. Critical journeys (P0 a11y acceptance)

| Journey | Extra bar |
| --- | --- |
| OTP login | Fields labeled; errors announced; no timed trap without extension |
| Job feed / apply | List virtualization keeps focus sane; confirm sheet accessible |
| 3h confirm / check-in | Time remaining announced; failure reasons readable |
| Employer applicants | Table/list keyboard + SR; accept/reject confirm dialogs |
| Inbox / push prefs | Toggles labeled; denied-push banner actionable |

Maps to CASE-UX clarity (T-235–T-243) and day-of safety.

---

## 7. What we reject

| Anti-pattern | Why |
| --- | --- |
| Glass/blur on form fields or check-in CTA | Fails perceivable / AA contrast |
| Icon-only controls without names | SR silence |
| `placeholder` as only label | Lost when filled |
| Removing focus outlines for aesthetics | Keyboard users stranded |
| Color-only accept/reject | Color-blind failure |
| Infinite carousels without pause | Operable / motion |
| Captcha that blocks SR without alternative | Operable (if bot protection ships) |

---

## 8. Delivery & tooling

| Phase | Outcome |
| --- | --- |
| P0 | Token contrast verified; labeled P0 controls; keyboard admin shell; Reduce Transparency solid chrome |
| P1 | axe CI smoke on admin; VO/TalkBack pass on P0 mobile journeys; wizard step announcements |
| P2 | External a11y review; quiet-hours / denser admin QA at 200% zoom |
| Later | AAA for selected legal/content pages if needed |

| Tool | Use |
| --- | --- |
| Contrast checkers | Token pairs at scaffold |
| axe / eslint-plugin-jsx-a11y | Admin CI |
| Xcode Accessibility Inspector / Android Accessibility Scanner | Mobile spot checks |
| Manual keyboard + SR | Release checklist |

---

## Related

- [ADR-0022](../backend/adr/0022-accessibility-wcag.md)  
- Color: [`01-color-system.md`](01-color-system.md)  
- Liquid Glass a11y: [`../mobile/05-wwdc-liquid-glass.md`](../mobile/05-wwdc-liquid-glass.md) §5  
- Web UI: [`../web/04-shadcn-dark-ui.md`](../web/04-shadcn-dark-ui.md)  
- Screen UX: [`03-screen-ux-layout.md`](03-screen-ux-layout.md)  
