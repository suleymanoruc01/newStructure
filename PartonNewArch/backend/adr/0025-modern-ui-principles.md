# ADR-0025: Modern UI design principles (September 2026)

**Status:** Accepted  
**Date:** 2026-10-09  
**Deciders:** Product / Design / Eng  
**Related:** [ADR-0016](0016-mobile-ui-wwdc-liquid-glass.md) · [ADR-0017](0017-color-system.md) · [ADR-0019](0019-screen-ux-layout.md) · [ADR-0022](0022-accessibility-wcag.md) · [shared/09-modern-ui-principles.md](../../shared/09-modern-ui-principles.md)

## Context

PartOn already locks stacks (NativeWind, Liquid Glass principles, shadcn dark, color tokens, layout recipes) but lacked a single **era-dated** design-principles bar. Without it, implementations drift toward AI-generic UI (purple glow, card soup, decorative pills) or over-apply glass to content. September 2026 is the industry moment of Liquid Glass / Material 3 Expressive / content-first brand — we need that translated into enforceable PartOn rules.

## Decision

1. Adopt **[shared/09-modern-ui-principles.md](../../shared/09-modern-ui-principles.md)** as the **September 2026** visual/UX bar (principles P1–P12 + anti-patterns).
2. Principles **compose** existing ADRs; they do not replace color tokens, recipes, or component catalogs.
3. Platform split stays: **iOS glass chrome** · **Android Material Expressive** · **admin dense dark** — one brand via tokens.
4. Screen/PR review uses the checklist in §5 of the principles doc.
5. Refresh the snapshot only with a new ADR (do not silently “update for 2027 trends” in place).

## Consequences

### Positive

- Clear “modern for Sept 2026” definition for designers and agents
- Explicit ban list against generic AI aesthetics
- Aligns Liquid Glass, CASE-UX recipes, and a11y under one bar

### Negative / tradeoffs

- Snapshot will age; requires conscious ADR to revise
- Marketing web (if later) must either follow or get its own surface ADR

### Follow-ups

- Agent visual SoR: [`../../DESIGN.md`](../../DESIGN.md) · [ADR-0039](0039-design-md.md)  
- Optional Figma/Stitch library annotated with P1–P12  
- Agent lint: flag hardcoded hex / multiple primary CTAs

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Rely only on Liquid Glass + recipes | **Reject** — no anti-pattern / era bar |
| Copy a generic 2024 design-system manifesto | **Reject** — not PartOn / not 2026 |
| Force Liquid Glass on admin web | **Reject** — wrong density/job |
| Trend-chasing without snapshot date | **Reject** — unstable for v1 |
