# ADR-0022: Accessibility — WCAG 2.2 AA baseline (Web + Mobile)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/06-accessibility-wcag.md`](../../shared/06-accessibility-wcag.md)

## Context

PartOn’s admin (shadcn) and mobile (NativeWind + Liquid Glass principles) must work for keyboard and screen-reader users, larger text, and system accessibility settings. Color tokens and glass chrome can regress contrast and legibility—especially on day-of check-in—unless accessibility is an explicit architecture gate alongside UI mandate and CASE-UX.

## Decision

1. **Web** (admin + future employer console): target **WCAG 2.2 Level AA**.  
2. **Mobile**: deliver **equivalent AA outcomes** via VoiceOver / TalkBack, Dynamic Type, hit targets ≥ 44×44 pt, and system settings (Reduce Transparency, Increase Contrast, Reduce Motion).  
3. Contrast: body text **4.5:1**, large text/UI **3:1**, using only [color system](../../shared/01-color-system.md) tokens in light and dark.  
4. Glass/blur remains **chrome-only** with solid fallback; check-in / 3h primary CTAs stay high-contrast solid.  
5. Prefer accessible primitives (Radix/shadcn; labeled RN controls). No icon-only without names; no placeholder-as-label; no focus-outline removal without replacement.  
6. P0 journeys require a11y acceptance (auth, feed/apply, 3h, check-in, applicants, inbox).  
7. Tooling: contrast on tokens at scaffold; axe smoke for admin (P1); manual SR passes on mobile P0.  
8. AAA and formal certification are **not** v1 defaults (audit scheduled P2+).

## Alternatives

### AA only on marketing pages
- **Pros:** Less work  
- **Cons:** Ops and workers are the product  
- **Why not:** Marketplace + admin are core

### AAA everywhere day-1
- **Pros:** Stronger  
- **Cons:** Slows delivery; diminishing returns  
- **Why not:** AA baseline first

### Ignore mobile “because WCAG is web”
- **Pros:** Narrower scope  
- **Cons:** Fails VoiceOver/TalkBack users on day-of flows  
- **Why not:** Map WCAG principles to platform a11y

## Consequences

### Positive
- Clear PR checklist; aligns Liquid Glass + color tokens with real users  
- Reduces legal/UX risk for Turkey launch  

### Negative / risks
- Design iteration when contrast fails on forest/cream pairs  
- CI axe noise until baselines stabilize  

### Follow-ups
- Token contrast report at design-tokens scaffold  
- eslint-plugin-jsx-a11y / axe on admin  
- Document SR scripts for P0 mobile journeys  
