# ADR-0017: Shared PartOn color system (Web + Mobile)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/01-color-system.md`](../../shared/01-color-system.md)

## Context

Admin (shadcn) and mobile (NativeWind) both need a coherent brand palette: cream surfaces, forest dark cards, orange primary, mustard accent, rust errors. Without a shared token doc, each app invents greys and default shadcn/Tailwind colors. Product supplied a production-ready architecture (surfaces, type, actions, feedback, charts).

## Decision

1. Adopt the token set in [`shared/01-color-system.md`](../../shared/01-color-system.md) as the **only** color source for Web and Mobile.  
2. Map tokens into shadcn CSS variables and NativeWind/Tailwind theme keys with **identical semantic names**.  
3. Establish elevation with **surface steps**, not heavy shadows.  
4. Reserve `action-primary-*` for a single primary CTA per screen; use rust `feedback-error` for errors/destructive.  
5. **Mode defaults:** mobile → `system` (+ override); admin → `dark` (+ light optional) — see color doc §8.  
6. Prefer a future `packages/design-tokens` preset; until then the markdown + scaffold CSS/theme files are normative.

## Alternatives

### Keep default shadcn zinc / NativeWind slate
- **Pros:** Zero design work  
- **Cons:** No PartOn brand; fights product palette  
- **Why not:** Brand is product requirement  

### Separate web vs mobile palettes
- **Pros:** Independent tuning  
- **Cons:** Divergent brand; double maintenance  
- **Why not:** One marketplace identity  

## Consequences

### Positive
- One vocabulary for design + eng  
- Clear CTA / feedback rules  
- Dark mode is branded (forest), not generic grey  

### Negative / risks
- Must verify WCAG on dark forest + cream text  
- shadcn defaults must be overridden at scaffold  

### Follow-up
- Generate `colors.json` + Tailwind preset at monorepo scaffold  
- Contrast audit in P0 UI spike  
