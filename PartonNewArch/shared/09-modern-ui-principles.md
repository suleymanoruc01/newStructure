# 09 — Modern UI design principles (September 2026)

**Status:** `accepted`  
**Snapshot:** September 2026 (locked for PartOn v1 visual bar)  
**Last updated:** 2026-10-10  
**ADR:** [0025 — Modern UI principles (Sept 2026)](../backend/adr/0025-modern-ui-principles.md) · [0039 — DESIGN.md](../backend/adr/0039-design-md.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §15.8  

**Visual SoR (agents):** **[`../DESIGN.md`](../DESIGN.md)** — Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md) format  
**Implements via:** [DESIGN.md](../DESIGN.md) · [Color](01-color-system.md) · [Components](02-ui-components.md) · [Screen UX R1–R8](03-screen-ux-layout.md) · [Liquid Glass](../mobile/05-wwdc-liquid-glass.md) · [shadcn dark](../web/04-shadcn-dark-ui.md) · [A11y](06-accessibility-wcag.md) · [Routing](08-routing.md)  
**Companion (behavior):** [10 — Modern UX principles](10-modern-ux-principles.md)

> These are **visual / interaction chrome principles**. **Agents implement look-and-feel from [`DESIGN.md`](../DESIGN.md)** (not from this file alone). For flows and trust see [10](10-modern-ux-principles.md). Stacks stay NativeWind + shadcn.

---

## Verdict

| Pillar | PartOn stance (Sept 2026) | Where specified |
| --- | --- | --- |
| Layers | **Chrome vs content** — translucent system chrome; branded, solid content | [DESIGN.md](../DESIGN.md) §1, §6 |
| Hierarchy | Surface elevation + type scale — not heavy multi-shadow cards | DESIGN.md §2, §6 · [01](01-color-system.md) |
| Density | Mobile sparse / thumb-first; admin dense / table-first | DESIGN.md §1, §5 |
| Motion | Fluid native transitions; **Reduce Motion** first-class | P11 below · a11y |
| Brand | Brand in **content + CTA/status**; chrome stays platform-familiar | DESIGN.md §1 |
| Color | Semantic tokens only (ADR-0017); one primary CTA per viewport | DESIGN.md §2 · [01](01-color-system.md) |
| Anti-patterns | No AI-generic purple glow, cream-serif terracotta cliché, card soup, pill clusters as decoration | DESIGN.md §7 |
| A11y | WCAG 2.2 AA (web) + mobile equivalent — non-negotiable | [06](06-accessibility-wcag.md) |
| Copy | Turkish primary; short, action-oriented | [07](07-i18n.md) · [10](10-modern-ux-principles.md) |
| Agent entry | Load **DESIGN.md** before generating UI | [ADR-0039](../backend/adr/0039-design-md.md) |

---

## 1. Why “September 2026”

| Era signal | Implication for PartOn |
| --- | --- |
| **iOS Liquid Glass** (WWDC25–26) | UI layer floats; glass sparingly; content carries brand |
| **Material 3 Expressive** (Android) | Parallel expressive motion/shape — not fake iOS glass |
| **Ops dark consoles** | Admin stays dense shadcn dark (not consumer glass) |
| **Marketplace trust** | Clear status, pay, distance, next step — not decorative dashboards |
| **Fatigue with AI UI** | Reject purple gradients, glow CTAs, emoji chrome, endless pills |

This snapshot is the **v1 design bar**. Refresh only via a new ADR if OS/platform language shifts materially.

---

## 2. Twelve principles

### P1 — One composition, one job

First viewport reads as **one job** (apply, confirm availability, check in, review applicant). Home may summarize, but not become a KPI dashboard for workers.

→ Recipes: [R1–R8](03-screen-ux-layout.md)

### P2 — Chrome floats; content grounds

Nav, tabs, toolbars = **UI layer** (translucent / material). Job cards, maps, forms, tables = **content layer** (opaque, high contrast).

→ [Liquid Glass](../mobile/05-wwdc-liquid-glass.md) · Admin: solid sidebar + content pane

### P3 — Elevation by surface, not shadow stacks

Use `surface-base` → `level-1` → `level-2`. Soft shadow only when needed for float (FAB, sheet). No nested card-in-card-in-card.

→ [Color system](01-color-system.md)

### P4 — One primary action

Exactly one `action-primary` per viewport. Secondary actions are outline/ghost/text. Destructive is clearly separate.

### P5 — Brand in content and status

PartOn orange/green moments: CTAs, badges, key imagery, empty-state illustration. Do **not** paint every header brand-orange.

### P6 — Typography does hierarchy

Clear type ramp (display / title / body / caption). Prefer expressive product fonts already chosen for PartOn; avoid Inter/Roboto/Arial as the hero face on marketing-adjacent surfaces. Admin may stay system/UI-sans for density.

### P7 — Motion with purpose

Native push/pop, sheet present, subtle list reorder. 2–3 intentional motions per major flow — not bounce on every tap. **Reduce Motion** → fade/instant.

→ [Routing](08-routing.md) · [A11y](06-accessibility-wcag.md)

### P8 — States are designed, not afterthoughts

Every screen ships `loading` / `empty` / `error` / `blocked` with Turkish copy and a next step.

### P9 — Density matches role

| Surface | Density |
| --- | --- |
| Worker / day-of mobile | Sparse, large targets (≥44pt), one sticky alert max |
| Employer mobile | Form-comfortable; wizards step-scoped |
| Admin web | Dense tables, filters in querystring, keyboard-friendly |

### P10 — Real visual anchors

Job/branch imagery, maps, check-in context. Decorative gradients alone do **not** count as the main visual idea.

### P11 — Calm information

Prefer progressive disclosure (sheets, “more”) over pill clusters, stat strips, and competing badges. Max one sticky alert strip on tab roots.

### P12 — Inclusive by default

Contrast AA+, focus visible, Dynamic Type / text scaling, screen reader labels, no color-only status. TR copy; locale-neutral URLs.

---

## 3. Platform application

| Surface | Apply principles as… |
| --- | --- |
| **iOS mobile** | Liquid Glass chrome + PartOn content/tokens |
| **Android mobile** | Material 3 Expressive shapes/motion; same tokens; no fake blur everywhere |
| **Admin web** | shadcn dark, dense, high-contrast ops — principles P1, P4, P8, P9, P11, P12 |
| **Employer web** (if shipped) | Same as admin stack; slightly less dense than pure ops |

---

## 4. Anti-patterns (Hold)

| Anti-pattern | Why banned (Sept 2026) |
| --- | --- |
| Purple-on-white / indigo glow themes | AI-default look; not PartOn |
| Warm cream + terracotta serif cliché | Generic “premium” AI landing |
| Glass on every card | Fights readability; Apple: glass for chrome only |
| Multi-layer drop shadows + neon borders | Dated 2022–24 SaaS |
| Pill / chip decoration rows | Noise; use chips for filters/status only |
| Emoji as primary UI affordances | Unprofessional for marketplace trust |
| Dashboard hero for worker Home | Wrong job; use R1 |
| Dark mode as pure `#000` + grey cards | Use branded charcoal/forest surfaces |
| Hardcoded hex in screens | Tokens only |
| English-only UI strings | i18n TR primary |

---

## 5. Design review checklist (PR / screen)

- [ ] One job + one primary CTA in first viewport  
- [ ] Chrome translucent / system-like; content solid  
- [ ] Tokens only; contrast AA on text/icons  
- [ ] Loading / empty / error / blocked present  
- [ ] Motion optional under Reduce Motion  
- [ ] No anti-pattern from §4  
- [ ] Components from catalog; layout recipe named (R#)  
- [ ] TR copy keys; screen ID `m.*` / `w.*`  

---

## 6. Relationship to other docs

| Doc | Owns |
| --- | --- |
| This file | **Principles** & anti-patterns (Sept 2026 bar) |
| [03-screen-ux](03-screen-ux-layout.md) | Layout recipes |
| [01-color](01-color-system.md) | Tokens |
| [02-components](02-ui-components.md) | Component inventory |
| [mobile/05](../mobile/05-wwdc-liquid-glass.md) | iOS glass mapping |
| [web/04](../web/04-shadcn-dark-ui.md) | Admin visual stack |
| [06-a11y](06-accessibility-wcag.md) | Compliance detail |

---

## Related

- [ADR-0025](../backend/adr/0025-modern-ui-principles.md)  
- UI mandate: [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)  
