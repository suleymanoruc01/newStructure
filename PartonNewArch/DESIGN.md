# PartOn DESIGN.md

**Status:** `accepted` — visual source of truth for AI coding agents  
**Format:** [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) · structure from [awesome-design-md](https://github.com/voltagent/awesome-design-md)  
**Inspirations (structure only — not brand identity):** Starbucks warm cream/green retail flagship · Wise friendly marketplace clarity · Cal.com clean ops console  
**Locked tokens:** [`shared/01-color-system.md`](shared/01-color-system.md) · [ADR-0017](backend/adr/0017-color-system.md)  
**Behavior UX:** [`shared/10-modern-ux-principles.md`](shared/10-modern-ux-principles.md) · recipes [`shared/03-screen-ux-layout.md`](shared/03-screen-ux-layout.md)  
**ADR:** [0039](backend/adr/0039-design-md.md)

> Agents: read this file before generating any UI. Pair with `AGENTS.md` (how to build) — this file is **how it should look and feel**. Do **not** copy purple-glow AI SaaS, Stripe purple gradients, or cream-serif terracotta clichés.

---

## 1. Visual Theme & Atmosphere

PartOn is a **Turkey-first shift marketplace**: workers find short jobs; employers fill seats; admins operate queues. The product must feel **trustworthy, outdoor-daylight ready, and calm under time pressure** (3h confirm, check-in windows) — not like a fintech dashboard or AI chat toy.

**Atmosphere:** Warm cream canvas (`surface-base` `#F3E8CF`) like a paper roster under sun; deep **forest** charcoal for dark mode and admin density (`#252823` / `#234D3C`); a single **orange** primary CTA (`#E97A3D`) for the one next action; mustard for favorites/stars only; rust for errors — never neon red.

**Channel voices (same tokens, different density):**

| Channel | Feel | Density |
| --- | --- | --- |
| **Mobile** (worker/employer) | Thumb-first, sparse, one job per viewport; Liquid Glass chrome only | Low |
| **Marketing** (`apps/marketing`) | Brand-first hero, cream→forest bookends, photography of real work | Editorial |
| **Admin** (Vite shadcn) | Dense tables, dark forest cards, ops clarity | High |

**Key characteristics:**

- Elevation by **surface ladder**, not shadow stacks (Starbucks/Wise lesson: color-block depth)  
- **One** primary CTA per viewport (orange)  
- Chrome floats; content stays solid and high-contrast  
- Turkish copy primary; short action labels  
- Anti-patterns: purple glow, glass on cards, pill clusters as decoration, emoji chrome  

**Page rhythm (marketing):** Cream hero → cream content → forest inverted band → cream utility → forest footer.  
**App rhythm (mobile):** Cream base → solid level-1 cards → orange CTA sticky when needed.  
**Admin rhythm:** Charcoal base → forest level-1 sidebar/cards → orange primary in toolbars.

---

## 2. Color Palette & Roles

Canonical hex and roles live in [`shared/01-color-system.md`](shared/01-color-system.md). Agents must use **semantic token names**, never invent hex.

### Surfaces (light)

| Token | Hex | Role |
| --- | --- | --- |
| `surface-base` | `#F3E8CF` | Page / app canvas |
| `surface-level-1` | `#EADCC5` | Cards, sheets, sidebars |
| `surface-level-2` | `#DDD4C7` | Modals, sticky headers |
| `surface-inverted` | `#252823` | Hero bands, footers, premium strips |

### Surfaces (dark / admin default)

| Token | Hex | Role |
| --- | --- | --- |
| `surface-base` | `#252823` | Root charcoal |
| `surface-level-1` | `#234D3C` | Cards — branded forest |
| `surface-level-2` | `#334B43` | Popovers / floating chrome |
| `surface-inverted` | `#F3E8CF` | Contrast break bands |

### Text

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `text-high-emphasis` | `#252823` | `#F3E8CF` | Titles, nav |
| `text-medium-emphasis` | `#344A32` | `#EADCC5` | Body |
| `text-low-emphasis` | `#83947A` | `#AAB8BD` | Meta |
| `text-on-color` | `#F3E8CF` | `#F3E8CF` | On orange / inverted |

### Actions & feedback

| Token | Hex | Role |
| --- | --- | --- |
| `action-primary-default` | `#E97A3D` | **The** primary CTA |
| `action-primary-hover` | `#D86A3A` | Web hover only |
| `action-primary-pressed` | `#B94E32` | Pressed / active |
| `action-secondary` | `#344A32` | Outline / ghost |
| `action-accent` | `#E2B83F` | Stars, favorites, dots — **not** CTA |
| `feedback-success` | `#79A94B` | Success |
| `feedback-warning` | `#E2B83F` | Soft warn |
| `feedback-error` | `#B94E32` | Error / destructive |
| `feedback-info` | `#AAB8BD` | Neutral tips |

### Charts

`chart-1` `#E97A3D` → `chart-2` `#BFD85A` → `chart-3` `#AAB8BD` → `chart-4` `#68734A`

### Gradients

**Hold for product UI.** Prefer solid color-block banding. Marketing may use subtle cream→level-1 washes only — never purple/indigo gradients.

---

## 3. Typography Rules

### Font families

| Role | Stack | Notes |
| --- | --- | --- |
| **Display / brand** | `"DM Sans", "Source Sans 3", system-ui, sans-serif` | Marketing + mobile titles; slightly geometric, friendly |
| **UI / body** | `"Source Sans 3", "DM Sans", system-ui, sans-serif` | Forms, tables, admin |
| **Mono (ops)** | `"JetBrains Mono", ui-monospace, monospace` | Admin IDs, request ids, hashes |

**Banned as default UI:** Inter-only / Roboto-only / Arial-only stacks for branded marketing (user design rules). Admin may use the same DM/Source pair for cohesion.

### Hierarchy

| Role | Size | Weight | Line | Use |
| --- | --- | --- | --- | --- |
| Display | 40–56px (mobile 32–40) | 600–700 | 1.1 | Marketing hero, empty-state titles |
| H1 | 28–32px | 600 | 1.2 | Screen titles |
| H2 | 22–24px | 600 | 1.25 | Section titles |
| H3 | 18–20px | 600 | 1.3 | Card titles |
| Body | 16px | 400 | 1.5 | Default |
| Body sm | 14px | 400–500 | 1.45 | Secondary, table cells |
| Caption | 12–13px | 500 | 1.4 | Meta, timestamps |
| Button | 14–16px | 600 | 1.0 | CTA labels |

**Principles:** Tight tracking on display (`-0.02em` to `-0.04em`). Hierarchy via weight + surface, not rainbow colors. Turkish diacritics must render correctly — verify font coverage for `ğüşıöç`.

---

## 4. Component Stylings

Named components stay in [`shared/02-ui-components.md`](shared/02-ui-components.md). Visual rules:

### Buttons

| Variant | Fill | Text | Radius | Notes |
| --- | --- | --- | --- | --- |
| **Primary** | `action-primary-default` | `text-on-color` | 12px (mobile/admin) · 14px marketing | One per viewport; press → `action-primary-pressed` |
| **Secondary** | transparent | `action-secondary` | 12px | 1.5px border `action-secondary` |
| **Ghost** | transparent | `text-medium` | 12px | Low emphasis |
| **Destructive** | `feedback-error` | `text-on-color` | 12px | Confirm dialogs only |
| **Admin toolbar** | primary or secondary | as above | 8px | Dense; height ~36–40px |

**Do not** use full-pill (`9999px`) for primary CTAs as default — reserved for status chips. (Avoids AI pill-cluster look.)

### Cards & lists

- Background: `surface-level-1`; radius **12px** (mobile/marketing), **8px** (admin tables/cards)  
- Border: none or 1px `surface-level-2` / hairline — **no** multi-shadow  
- Job / applicant cards: solid fill; status chip top-right; **one** primary action  
- Admin: prefer table rows over card grids for queues  

### Inputs

- Height 44–48px mobile, 40px admin  
- Radius 10–12px (mobile), 8px (admin)  
- Border: medium-emphasis green/gray; focus ring = `action-primary`  
- Labels above fields (never placeholder-only) — [a11y](shared/06-accessibility-wcag.md)  
- Error text: `feedback-error` + icon  

### Navigation

- **Mobile:** bottom tabs / stack; translucent chrome OK; content opaque  
- **Admin:** dark sidebar `surface-level-1`, content pane `surface-base`  
- **Marketing:** sticky top nav on cream; wordmark dominant in first viewport  

### Status chips

- Pill radius OK; colors from feedback/accent tokens only  
- Copy short Turkish: `Onay bekliyor`, `Check-in açık`, `Reddedildi`  

### Signature PartOn patterns

| Pattern | Rule |
| --- | --- |
| **Next-action bar** | Sticky bottom (mobile) or top toolbar (admin) with single orange CTA |
| **Token chip** | Mustard/forest chip showing held/available balance — never confuse with primary CTA |
| **Shift countdown** | High-emphasis type + warning/error as window closes |
| **Geofence map card** | Solid card; map is content; CTA “Check-in” primary |
| **Audit/export** | Admin: table + CSV/PDF buttons secondary unless generating report is the task |

---

## 5. Layout Principles

### Spacing scale (4px base)

| Token | px | Use |
| --- | --- | --- |
| `space-1` | 4 | Icon gaps |
| `space-2` | 8 | Compact stacks |
| `space-3` | 12 | Chip padding |
| `space-4` | 16 | Default gutter / card pad (mobile) |
| `space-5` | 24 | Section gaps |
| `space-6` | 32 | Card pad (marketing) |
| `space-7` | 48 | Band padding |
| `space-8` | 64–96 | Marketing section rhythm |

### Recipes

Use locked recipes **R1–R8** in [`shared/03-screen-ux-layout.md`](shared/03-screen-ux-layout.md). Do not invent zone soup.

### Whitespace

- Mobile: breathe — one job, large tap targets  
- Admin: denser, but still clear row height ≥40px  
- Marketing: hero budget — brand, one headline, one sentence, one CTA group, one dominant image ([user design rules](.cursor) apply)

### Grid

- Marketing max ~1200px  
- Admin fluid with sidebar  
- Mobile single column; lists full-bleed cards with 16px side inset  

---

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| 0 Flat | Surface color only | Default |
| 1 Raised | `surface-level-1` on `surface-base` | Cards |
| 2 Overlay | `surface-level-2` + optional soft shadow `0 1px 2px rgba(37,40,35,0.08)` | Modals |
| Chrome | Translucency / blur **chrome only** (iOS Liquid Glass principles) | Tab bars, nav |
| Inverted | `surface-inverted` band | Marketing bookends, premium |

**Shadow philosophy:** Whisper or none. Prefer surface steps (Starbucks/Wise color-block lesson). No neon glow, no multi-layer fashion shadows.

---

## 7. Do's and Don'ts

### Do

- Load [`DESIGN.md`](DESIGN.md) + [`shared/01-color-system.md`](shared/01-color-system.md) before UI code  
- One orange primary CTA per viewport  
- Cream light / forest dark branded surfaces  
- Solid content cards; glass only on system chrome  
- Turkish UI strings via i18n keys  
- WCAG 2.2 AA contrast on every text/surface pair  
- Admin dark default; mobile `system`  

### Don't

- Don't use purple/indigo AI gradients or glow CTAs  
- Don't use Inter/Roboto/Arial as the **only** marketing display stack  
- Don't put glass/blur on job cards or forms  
- Don't invent hex outside the token table  
- Don't use accent mustard as a primary button  
- Don't ship placeholder “lorem” or stub CTAs on marketing  
- Don't copy another brand’s DESIGN.md identity (Starbucks/Wise/Cal) — use **this** file  

---

## 8. Responsive Behavior

| Breakpoint | Width | Behavior |
| --- | --- | --- |
| Mobile | <768 | Single column; bottom CTA; hamburger marketing nav |
| Tablet | 768–1023 | 2-up cards where recipes allow |
| Desktop | ≥1024 | Admin sidebar + table; marketing split heroes |
| Wide | ≥1440 | Cap content width; extra cream margin |

**Touch:** Primary controls ≥44×44px. Admin mouse density OK at 36–40px height with adequate spacing.

**Collapsing:** Stack heroes; tables → card list only when recipe says so (admin prefers horizontal scroll over lossy cards).

---

## 9. Agent Prompt Guide

### Quick color reference

- Canvas: `surface-base` cream `#F3E8CF` (light) / charcoal `#252823` (dark)  
- Card: `surface-level-1`  
- Primary CTA: `action-primary-default` `#E97A3D`  
- CTA text: `text-on-color` `#F3E8CF`  
- Body text: `text-medium-emphasis`  
- Error: `feedback-error` `#B94E32`  
- Accent (stars): `action-accent` `#E2B83F`  

### Example prompts

1. “Build mobile job detail: cream `surface-base`, solid `surface-level-1` card, status chip, single orange ‘Başvur’ primary sticky bottom, secondary outline ‘Favorile’ — NativeWind tokens, recipe R3.”  
2. “Admin applications table: dark charcoal base, forest `surface-level-1` sidebar, dense table, orange ‘Ata’ only in row action menu — shadcn mapped to PartOn CSS vars.”  
3. “Marketing hero: full-bleed work photography, PartOn wordmark dominant, one Turkish headline, one sentence, one orange CTA + secondary text link — no cards in hero, no pill clusters.”  
4. “Check-in screen: map in solid card, geofence status, countdown, primary ‘Check-in yap’ disabled until in-fence with honest helper text.”  

### Iteration

1. Change one component at a time  
2. Cite token names + hex from §2  
3. Preserve one-primary-CTA and surface elevation rules  
4. Re-check a11y contrast after token swaps  

### Channel checklist

| Surface | Must read |
| --- | --- |
| Any UI | This DESIGN.md · [01 colors](shared/01-color-system.md) |
| Mobile | [04 NativeWind](mobile/04-nativewind-ui.md) · [05 glass](mobile/05-wwdc-liquid-glass.md) · [08 Stitch](mobile/08-stitch-mobile-ui.md) |
| Admin | [web/04 shadcn](web/04-shadcn-dark-ui.md) |
| Marketing | [web/07](web/07-marketing.md) |
| Behavior | [10 UX](shared/10-modern-ux-principles.md) · recipes [03](shared/03-screen-ux-layout.md) |

---

## Related architecture

| Doc | Role |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | How to build |
| [`shared/09-modern-ui-principles.md`](shared/09-modern-ui-principles.md) | Sept 2026 UI principles → implement via this DESIGN.md |
| [`shared/10-modern-ux-principles.md`](shared/10-modern-ux-principles.md) | Behavior / trust |
| [`shared/02-ui-components.md`](shared/02-ui-components.md) | Named components |
| [ADR-0039](backend/adr/0039-design-md.md) | Decision record |
