# ADR-0015: NativeWind for bare React Native mobile UI

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../mobile/04-nativewind-ui.md`](../../mobile/04-nativewind-ui.md)  
**Upstream:** https://www.nativewind.dev/

## Context

PartOn’s client is **bare React Native** (Expo forbidden — ADR-0006). The admin web stack uses Tailwind via shadcn/ui (ADR-0014). Mobile needs a styling approach that scales across many marketplace screens without StyleSheet sprawl, stays Expo-free, and can share **design token semantics** with admin. [NativeWind](https://www.nativewind.dev/) brings Tailwind utility classes to React Native via Metro.

## Decision

1. Adopt **[NativeWind](https://www.nativewind.dev/)** as the **primary** mobile styling system (`className` + Tailwind).  
2. Scaffold on the **stable NativeWind v4.x** line compatible with bare RN / frameworkless Metro (`withNativeWind`); treat **v5** as Assess until production-ready for bare workflows.  
3. Keep **React Navigation** and owned native projects; do **not** introduce Expo to get styling.  
4. Build app-owned `components/ui` primitives; optionally Trial **React Native Reusables** as a copy-paste kit.  
5. Support **light and dark** via NativeWind color scheme APIs; default scheme is a product choice (MOB-1).  
6. Align **semantic token names** with admin shadcn where practical; do not share web components with RN.  
7. `StyleSheet` remains allowed for escapes (third-party interop, complex animations) — not the default path.

## Alternatives

### StyleSheet-only
- **Pros:** Zero extra toolchain  
- **Cons:** Verbose, weak token story, diverges from admin Tailwind  
- **Why not:** NativeWind DX + consistency  

### Styled Components / Tamagui / restyle as primary
- **Pros:** Strong typed themes  
- **Cons:** Different paradigm from admin; extra runtime  
- **Why not:** Prefer Tailwind continuum with web  

### Expo + NativeWind templates
- **Pros:** Faster bootstrap  
- **Cons:** Violates ADR-0006  
- **Why not:** Bare only  

## Consequences

### Positive
- Utility-first UI matching team Tailwind skills  
- Clear Metro-based bare RN path  
- Theme/dark-mode story from day one  

### Negative / risks
- Metro/Tailwind version coupling — pin at scaffold  
- v5 migration later may need a dedicated upgrade ADR  

### Follow-up
- Scaffold `apps/mobile` with frameworkless NativeWind guide  
- Decide MOB-1 default scheme and MOB-3 Reusables trial  
