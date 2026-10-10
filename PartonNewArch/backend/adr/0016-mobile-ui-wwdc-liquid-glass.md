# ADR-0016: Apple Liquid Glass / WWDC design principles for PartOn mobile

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../mobile/05-wwdc-liquid-glass.md`](../../mobile/05-wwdc-liquid-glass.md)  
**Refs:** [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass) · WWDC26 [Communicate your brand identity on iOS](https://developer.apple.com/videos/play/wwdc2026/251/)

## Context

Apple’s Liquid Glass design language (iOS 26+, refined at WWDC 2026 for iOS 27) separates a translucent **UI/navigation layer** from a **content layer**, and WWDC26 guidance pushes brand expression into content while keeping chrome familiar. PartOn ships a **bare React Native** app styled with **NativeWind** (ADR-0015), not a SwiftUI rewrite. We need an explicit stance so iOS feels current without breaking Android or Expo bans.

## Decision

1. Adopt **Liquid Glass design principles** for PartOn mobile: UI chrome vs content hierarchy, sparing translucency, brand-in-content (WWDC26).  
2. Keep **NativeWind + React Navigation** as the implementation stack — do **not** migrate the product UI to SwiftUI for glass APIs.  
3. Prefer **system/translucent navigator chrome** on iOS; approximate custom glass only where needed; always provide **solid fallbacks** for Reduce Transparency / Increase Contrast.  
4. Keep **content cards solid and scannable** (jobs, applicants, check-in) — no glass-on-every-surface.  
5. Treat **Android** with Material-appropriate chrome, not fake iOS glass.  
6. Deliver layered **app icon** assets for modern iOS appearances; parallel Android adaptive icons.  
7. Assess a native `UIGlassEffect` bridge only if translucent chrome proves insufficient after P2.

## Alternatives

### Full SwiftUI rewrite for Liquid Glass
- **Pros:** Native `.glassEffect()` fidelity  
- **Cons:** Abandons RN/NativeWind investment; dual platforms diverge  
- **Why not:** Principles > pixel API for marketplace MVP  

### Ignore Liquid Glass; flat RN only
- **Pros:** Simpler  
- **Cons:** Feels dated on iOS 26/27; fights HIG  
- **Why not:** Adopt principles with RN mapping  

### Glass everywhere (cards, lists, maps)
- **Pros:** “Modern” look  
- **Cons:** Apple explicitly warns against overuse; harms check-in legibility  
- **Why not:** Chrome only  

## Consequences

### Positive
- Clear UI kit rules for designers and RN engineers  
- Aligns with Apple docs without Expo or SwiftUI rewrite  
- A11y baked into the architecture  

### Negative / risks
- Blur fidelity will lag true `UIGlassEffect` until a native bridge  
- Extra platform chrome adapters to maintain  

### Follow-up
- LG-2 blur library Trial in P2  
- Icon Composer / layered assets with design  
- Verify React Navigation translucent options on target iOS SDK  
