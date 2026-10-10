# 01 — Color system (Web + Mobile)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0017 — PartOn shared color tokens](../backend/adr/0017-color-system.md) · [0039 — DESIGN.md](../backend/adr/0039-design-md.md)  
**Agent visual SoR:** [`../DESIGN.md`](../DESIGN.md) §2 (must match this table)  
**Consumers:** Admin [shadcn/ui](../web/04-shadcn-dark-ui.md) · Mobile [NativeWind](../mobile/04-nativewind-ui.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §13–§14  
**Accessibility:** [`06-accessibility-wcag.md`](06-accessibility-wcag.md) · [ADR-0022](../backend/adr/0022-accessibility-wcag.md) — tokens must meet WCAG AA contrast

> Single **semantic token** vocabulary for PartOn. Values are hex; apps map them to CSS variables (web) and Tailwind/NativeWind theme keys (mobile). Prefer **elevation via surface steps**, not heavy drop-shadows. **UI generation** starts from [`DESIGN.md`](../DESIGN.md).

---

## Verdict

| Topic | Stance |
| --- | --- |
| Source of truth | This doc (+ future `packages/design-tokens`) |
| Web | shadcn CSS variables ← these tokens |
| Mobile | NativeWind / Tailwind theme ← **same names** |
| Elevation | Surface ladder (base → level-1 → level-2); shadows secondary |
| Primary CTA | `action-primary-*` orange — **one** primary action per screen |
| Errors | Brand rust `feedback-error` — not generic neon red |

---

## 1. Surface & elevation (spatial)

Hierarchy = subtle background shifts (tactile, premium).

### Light mode (layer by darkness)

| Token | Hex | Role |
| --- | --- | --- |
| `surface-base` | `#F3E8CF` | Root page / app deepest background (eye-strain friendly) |
| `surface-level-1` | `#EADCC5` | Cards, content blocks, sidebars on base |
| `surface-level-2` | `#DDD4C7` | Modals, dropdowns, sticky nav headers |
| `surface-inverted` | `#252823` | High-impact bands (footer, premium hero) |

### Dark mode (layer by lightness)

| Token | Hex | Role |
| --- | --- | --- |
| `surface-base` (dark) | `#252823` | Root charcoal (not pure black) |
| `surface-level-1` (dark) | `#234D3C` | Cards — branded deep forest (not grey) |
| `surface-level-2` (dark) | `#334B43` | Modals / popovers / floating chrome |
| `surface-inverted` (dark) | `#F3E8CF` | Optional light band for contrast breaks |

Implementation: same **token names** in both schemes; values swap under `.dark` / NativeWind dark.

---

## 2. Typography & contrast

Deep greens in the reading path (branded, not grey-default).

| Token | Hex | Role |
| --- | --- | --- |
| `text-high-emphasis` | `#252823` | H1–H3, primary nav (light scheme) |
| `text-medium-emphasis` | `#344A32` | Body, subtitles (>4.5:1 on light surfaces) |
| `text-low-emphasis` | `#83947A` | Timestamps, placeholders, breadcrumbs |
| `text-on-color` | `#F3E8CF` | Text on primary CTAs / dark overlays / inverted surfaces |

### Dark-scheme text overlays (derived for AA)

On dark surfaces (`#252823` / `#234D3C`), use cream-forward text:

| Token | Dark hex | Notes |
| --- | --- | --- |
| `text-high-emphasis` | `#F3E8CF` | Headings on charcoal/forest |
| `text-medium-emphasis` | `#EADCC5` | Body on dark |
| `text-low-emphasis` | `#AAB8BD` | Meta / placeholders (cooler mute) |
| `text-on-color` | `#F3E8CF` | Still on orange primary; on accent mustard prefer `#252823` if contrast fails |

Validate with contrast tooling at scaffold (**4.5:1** normal text, **3:1** large/UI — [06](06-accessibility-wcag.md)); adjust only via this table.

---

## 3. Interactive & action (state engine)

| Token | Hex | Role |
| --- | --- | --- |
| `action-primary-default` | `#E97A3D` | **Single** most important CTA per screen |
| `action-primary-hover` | `#D86A3A` | Web hover |
| `action-primary-pressed` | `#B94E32` | Mobile press / active |
| `action-secondary` | `#344A32` | Outline / ghost secondary |
| `action-accent` | `#E2B83F` | Stars, favorites, “New” badges, notification dots |

Rules:

- Never compete two `action-primary` buttons in one viewport.  
- Hover is **web-only**; mobile uses pressed.  
- Accent ≠ primary CTA.

---

## 4. Semantic & feedback

| Token | Hex | Role |
| --- | --- | --- |
| `feedback-success` | `#79A94B` | Saved, checkmarks, online |
| `feedback-warning` | `#E2B83F` | Soft warnings, missing fields |
| `feedback-error` | `#B94E32` | Validation errors, destructive confirm |
| `feedback-info` | `#AAB8BD` | Neutral tips, onboarding, info banners |

`feedback-warning` shares hue with `action-accent` — differentiate by **shape/icon/context** (banner vs star), not a second yellow.

---

## 5. Data visualization

| Order | Hex | Use |
| --- | --- | --- |
| 1 Lead | `#E97A3D` | Primary metric / progress |
| 2 Secondary | `#BFD85A` | Series 2 (strong on dark) |
| 3 Tertiary | `#AAB8BD` | Series 3 |
| 4 Quaternary | `#68734A` | Series 4 |

Tokens: `chart-1` … `chart-4` in shadcn/NativeWind maps.

---

## 6. shadcn (Web) mapping

| shadcn / CSS var | PartOn token |
| --- | --- |
| `--background` | `surface-base` |
| `--card` / `--sidebar` | `surface-level-1` |
| `--popover` | `surface-level-2` |
| `--foreground` | `text-high-emphasis` |
| `--muted-foreground` | `text-low-emphasis` |
| `--primary` | `action-primary-default` |
| `--primary-foreground` | `text-on-color` |
| `--secondary` | `action-secondary` (+ appropriate foreground) |
| `--accent` | `action-accent` |
| `--destructive` | `feedback-error` |
| `--ring` | `action-primary-default` @ focus |
| `--chart-1`…`--chart-4` | viz sequence above |

Hover/pressed: component variants (`hover:bg-[…]` / `active:`) bound to `action-primary-hover` / `action-primary-pressed` — not separate shadcn cores.

---

## 7. NativeWind (Mobile) mapping

```js
// tailwind / @theme (illustrative names)
colors: {
  surface: { base: '...', 1: '...', 2: '...', inverted: '...' },
  text: { high: '...', medium: '...', low: '...', on: '...' },
  action: { primary: '...', 'primary-hover': '...', 'primary-pressed': '...', secondary: '...', accent: '...' },
  feedback: { success: '...', warning: '...', error: '...', info: '...' },
  chart: { 1: '...', 2: '...', 3: '...', 4: '...' },
}
```

Usage: `className="bg-surface-base text-text-high"`, `bg-action-primary active:bg-action-primary-pressed`.

Liquid Glass chrome ([mobile/05](../mobile/05-wwdc-liquid-glass.md)): translucent bars sit over `surface-base`; **content cards** use `surface-level-1` solid.

---

## 8. Light ↔ dark transition (user base)

PartOn is **Turkey-first**: workers and employers use the app across daylight outdoor shifts and evening planning; admins run dense queues for long sessions.

| Surface | Default | Rationale |
| --- | --- | --- |
| **Mobile** (seeker / employer) | **`system`** + in-app override | Daytime field use → light cream; night → branded forest dark; respect OS |
| **Admin** (ops) | **`dark`** + optional light | Long queue sessions; forest dark cards reduce glare; light for a11y / shared desks |
| Persistence | Store preference (`system` \| `light` \| `dark`) per device | Survives relaunch |
| First paint | No flash: inline theme script (web); NativeWind scheme before first paint (mobile) | |
| Accessibility | Independent of scheme: Reduce Transparency → solid surfaces; Increase Contrast → stronger borders | |

Do **not** auto-flip theme by time-of-day without user control — OS `system` already covers most cases.

---

## 9. Package layout (target)

```text
packages/design-tokens/   # optional P1+
  colors.json             # canonical hex + modes
  tailwind-preset.ts      # shared by admin + mobile
  css-variables.css       # :root + .dark for shadcn
```

Until the package exists, **this markdown is normative**; both apps must not invent parallel palettes.

---

## 10. Checklist

- [ ] No raw `#E97A3D` in feature code — use tokens  
- [ ] One primary CTA color per screen  
- [ ] Elevation via `surface-*`, not stacked shadows  
- [ ] Errors use `feedback-error` rust  
- [ ] Charts use `chart-1`…`4` only  
- [ ] Dark mode uses forest card surfaces, not grey clones  
- [ ] Contrast verified for text on `surface-base` / dark bases  

---

## Related

- **DESIGN.md:** [`../DESIGN.md`](../DESIGN.md)  
- ADR: [`../backend/adr/0017-color-system.md`](../backend/adr/0017-color-system.md) · [0039](../backend/adr/0039-design-md.md)  
- Web: [`../web/04-shadcn-dark-ui.md`](../web/04-shadcn-dark-ui.md)  
- Mobile: [`../mobile/04-nativewind-ui.md`](../mobile/04-nativewind-ui.md) · [`../mobile/05-wwdc-liquid-glass.md`](../mobile/05-wwdc-liquid-glass.md)  
