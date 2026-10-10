# ADR-0019: Screen UX & layout baseline

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md)

## Context

PartOn has a full screen catalog (~74 mobile / ~47 web) and a named component inventory, but CASE-UX (T-235–T-243) fails if layouts are inconsistent: multi-CTA homes, glass on content, empty states without next steps, or mega-forms. Stack choices (NativeWind, Liquid Glass principles, shadcn dark, color tokens) define *how* we paint — not *how screens are composed*.

## Decision

1. Adopt **named layout recipes** R1–R8 (tab root, detail, wizard, confirm sheet, day-of, settings, admin console, system blocker) in [`shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md).  
2. Every screen spec declares **Recipe**, **Primary CTA**, **Components**, and **States** (loading/empty/error/blocked).  
3. **One primary CTA** per viewport using `action-primary` (ADR-0017).  
4. Compose UI only from [`shared/02-ui-components.md`](../../shared/02-ui-components.md) (+ platform primitives).  
5. Map CASE-UX cases to specific recipes/components (feed clarity, check-in timing, permission rationale, token explainer, etc.).  
6. Channel density: mobile comfort vs admin compact — same labels/state machines.  
7. Reject kitchen-sink consumer dashboards, glass-on-content, and empty states without CTAs.

## Alternatives

### Freeform per-screen design
- **Pros:** Creative freedom  
- **Cons:** Inconsistent UX; slow reviews; CASE-UX regressions  
- **Why not:** Catalog scale needs recipes

### Design-system-only (tokens, no recipes)
- **Pros:** Lighter docs  
- **Cons:** Does not fix composition failures (T-235–243)  
- **Why not:** Insufficient alone

### Pixel-identical mobile/web
- **Pros:** One layout  
- **Cons:** Wrong density for ops tables vs thumb CTAs  
- **Why not:** Parity of meaning, not pixels

## Consequences

### Positive
- Reviewable UX gate alongside UI coverage mandate  
- Clear mapping from CASE-UX to layouts  
- Aligns Liquid Glass chrome/content with day-of high-contrast CTAs  

### Negative / risks
- Authors must pick a recipe (good friction)  
- Some screens are hybrids — document primary recipe + sheet overlay  

### Follow-ups
- Annotate P0 screen docs with Recipe / Primary CTA / Components  
- UX acceptance checklist in gap backlog `ux-acceptance`  
