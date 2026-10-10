# ADR-0039: DESIGN.md as visual source of truth (Stitch / awesome-design-md)

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng / Design  
**Related:** [DESIGN.md](../../DESIGN.md) · [ADR-0017](0017-color-system.md) · [ADR-0025](0025-modern-ui-principles.md) · [ADR-0026](0026-modern-ux-principles.md) · [awesome-design-md](https://github.com/voltagent/awesome-design-md)

## Context

UI/UX guidance was split across color tokens, Sept 2026 principles, screen recipes, NativeWind, and shadcn docs. Coding agents still produced inconsistent or AI-generic UI because there was no single **agent-readable design system** in the [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) format popularized by [VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md).

## Decision

1. Adopt **[`PartonNewArch/DESIGN.md`](../../DESIGN.md)** as the **visual source of truth** for all generated UI (mobile, admin, marketing).  
2. Follow the Stitch / awesome-design-md **nine-section structure** (theme, color, type, components, layout, depth, do/don’t, responsive, agent prompts).  
3. **Tokens remain** those in [shared/01-color-system](../../shared/01-color-system.md) (ADR-0017) — DESIGN.md does not invent a second palette.  
4. Structural inspiration may reference public DESIGN.md analyses (e.g. warm cream retail, friendly marketplace, clean ops) — **never** copy foreign brand identity, purple SaaS tropes, or banned AI-generic patterns.  
5. [`shared/09`](../../shared/09-modern-ui-principles.md) principles are implemented **through** DESIGN.md; [`shared/10`](../../shared/10-modern-ux-principles.md) remains behavior/UX.  
6. Agents load DESIGN.md with AGENTS.md before any UI slice.

## Consequences

### Positive

- One file agents read for look-and-feel  
- Aligns with industry agent-design practice (Stitch + awesome-design-md)  
- Keeps PartOn cream/forest/orange identity  

### Negative / tradeoffs

- Must keep DESIGN.md in sync when tokens change (same PR as color ADR)  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Only keep fragmented 01/09/04 docs | **Reject** — agents miss cohesion |
| Drop in a third-party brand DESIGN.md verbatim | **Reject** — wrong identity; license/brand risk |
| Figma-only SoR | **Reject** for agents — markdown wins |
