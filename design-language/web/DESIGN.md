---
name: Warm Clay
platform: web
colors:
  surface-base: "#F3E8CF"
  surface-card: "#EADCC5"
  surface-shelf: "#DDD4C7"
  surface-sheet: "#FBF6EC"
  surface-hero: "#344A32"
  surface-ink: "#252823"
  text-high: "#252823"
  text-medium: "#344A32"
  text-low: "#83947A"
  text-on: "#F3E8CF"
  action-primary: "#E97A3D"
  action-hover: "#D86A3A"
  action-pressed: "#B94E32"
  action-secondary: "#344A32"
  accent: "#E2B83F"
  leaf: "#79A94B"
  danger: "#B94E32"
typography:
  display:
    fontFamily: DM Sans
    fallback: system-ui, sans-serif
  ui:
    fontFamily: Source Sans 3
    fallback: system-ui, sans-serif
rounded:
  control: 16px
  stat: 18px
  card: 22px
  bar: 28px
  sheet: 40px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  page: 960px
  form: 480px
---

# Warm Clay — Web

Portable visual language for websites and web apps. Copy this file in as `DESIGN.md`. Same pigments and clay as the mobile language: a forest hero, a cream sheet, orange as the single next step. This file adds hover, focus, and width. It does not invent a second palette for "desktop."

The reference page is a **forest band** with a soft color wash, overlapped by a **cream sheet**. On a wide window the sheet becomes a centered panel. It does not become a dense admin console.

---

## 1. Theme

**Mood:** warm paper, physical, quiet. Depth comes from a light top lip and a thicker bottom shelf, not from blur on the content.

**Three materials**

| Material | Where | Never |
| --- | --- | --- |
| **Clay** | Cards, fields, chips, capsule buttons | Hairline gray boxes |
| **Aurora** | Hero band, faintly inside the sheet | Behind tables, cards, or inputs |
| **Ink** | Type and the hero fill | A black page |

**One next step.** One orange capsule per view. The second action is a forest capsule or a text button. Links in body copy are forest, not orange.

**Light is the theme.** Cream canvas, forest hero. Do not add a dark mode unless the product already needs one. If you do, swap canvas and ink only; leave orange, mustard, and leaf alone.

**Motion stays small.** Hover darkens the orange. Press sinks the capsule by 1px. Aurora drifts a few pixels. `prefers-reduced-motion` freezes both. `prefers-reduced-transparency` removes blur and leaves solid forest and solid cream.

---

## 2. Color

Use the role. Do not add a hex for a single screen.

### Surfaces

| Role | Hex | Use |
| --- | --- | --- |
| `surface-base` | `#F3E8CF` | Page background |
| `surface-card` | `#EADCC5` | Cards, fields, idle chips |
| `surface-shelf` | `#DDD4C7` | Bottom lip, progress track |
| `surface-sheet` | `#FBF6EC` | The overlapping panel; lighter than the canvas |
| `surface-hero` | `#344A32` | Hero, forest capsule, prefix chip |
| `surface-ink` | `#252823` | Forest-button lip |

### Text

| Role | Hex | Use |
| --- | --- | --- |
| `text-high` | `#252823` | Titles, values, row labels |
| `text-medium` | `#344A32` | Body, labels, hints, text links |
| `text-low` | `#83947A` | Placeholders, idle icons, chevrons |
| `text-on` | `#F3E8CF` | Type on orange, forest, or danger |

On mustard, type is `text-high`.

### Action and feedback

| Role | Hex | Use |
| --- | --- | --- |
| `action-primary` | `#E97A3D` | The one capsule |
| `action-hover` | `#D86A3A` | Pointer hover on that capsule |
| `action-pressed` | `#B94E32` | Pressed fill, primary lip, danger |
| `action-secondary` | `#344A32` | Forest capsule, text links |
| `accent` | `#E2B83F` | Selected day, favorite, count badge |
| `leaf` | `#79A94B` | Aurora, quiet positive mark |
| `danger` | `#B94E32` | Errors, destructive capsule |

Mustard and leaf never fill a page-level button.

### Focus

Keyboard focus is a 3px ring, `#E97A3D`, offset 2px, on any control. Do not remove it for a mouse-only style. On the orange capsule the ring can be `#FBF6EC` so it stays visible.

### Aurora orbs

| Orb | Hex | Hero opacity | Sheet opacity |
| --- | --- | --- | --- |
| Orange | `#E97A3D` | `0.55` | `0.18` |
| Mustard | `#E2B83F` | `0.28` | `0.16` |
| Leaf | `#79A94B` | `0.40` | `0.14` |
| Cream | `#F3E8CF` | `0.16` | none |

No purple, indigo, cyan, pure black, or pure white.

---

## 3. Type

Load **DM Sans** for titles and values, **Source Sans 3** for everything else. Fallback `system-ui, sans-serif`. Both cover Latin, including `ğ ü ş ı ö ç`.

| Role | Family | Size / line | Weight | Use |
| --- | --- | --- | --- | --- |
| Hero | DM Sans | 32 / 38 | 700 | Band title. Up to 40px only when the window is ≥960px |
| Section | DM Sans | 20 / 26 | 600 | Sheet title, dialog title |
| Card | DM Sans | 18 / 24 | 600 | Card title, empty title, stat value |
| Field value | DM Sans | 18 / 24 | 400 | Text inside a capsule field |
| Body | Source Sans 3 | 16 / 24 | 400 | Paragraphs |
| Label | Source Sans 3 | 14 / 20 | 500 | Labels, hints |
| Button | Source Sans 3 | 16 / 20 | 600 | Capsules |
| Chip | Source Sans 3 | 14 / 18 | 400–600 | 600 on status |
| Caption | Source Sans 3 | 12 / 16 | 600 | Eyebrow, meta |
| Nav | Source Sans 3 | 14 / 18 | 500 idle, 600 current | Top bar |

Hero eyebrow: Source Sans 3, 12, weight 600, `text-on`, 6px above the title.

Tracking: `0` by default. The 32–40px title may use `-0.02em`. Do not letterspace body or buttons.

---

## 4. Components

### Buttons

Default is a capsule. Radius `9999px`. Height 56. Padding 0 20. Label 16/600. Width is the label plus padding, not the full page, except when it is the only action in a narrow column — then it may span the form column (max 480px).

| Variant | Fill | Label | Bottom lip |
| --- | --- | --- | --- |
| Primary | `#E97A3D` | `#F3E8CF` | 6px `#B94E32` |
| Forest | `#344A32` | `#F3E8CF` | 6px `#252823` |
| Danger | `#B94E32` | `#F3E8CF` | 6px `#252823` |
| Ghost | transparent | `#344A32` | none |

Top lip on filled capsules: 2px `rgba(243, 232, 207, 0.70)`. Shadow: `4px 10px 12px rgba(37, 40, 35, 0.32)`.

| State | What changes |
| --- | --- |
| Hover (primary) | Fill `#D86A3A`. Forest hover lightens the label, not the page |
| Active | Fill `#B94E32` on primary; `translateY(1px)`; bottom lip shrinks from 6px to 2px |
| Focus | 3px ring, offset 2px |
| Disabled | Opacity `0.40`, no hover, `cursor: not-allowed` |

Ghost: height 48, no shadow, no lip. Underline on hover only.

Do not use a rectangle as the primary. Radius 16 is for outline controls in a tight toolbar, and that toolbar is rare.

### Cards

- Fill `#EADCC5`, radius 22, padding 16
- Top lip 2px `rgba(251, 246, 236, 0.90)`
- Bottom lip 4px `#DDD4C7`
- Shadow `2px 6px 8px rgba(37, 40, 35, 0.12)`
- Title left, status pill right
- A whole card may be a link. Hover: `translateY(-1px)` and shadow opacity `0.18`. Do not add a second button inside a linked card
- Focus ring on the card when it is a link

### Hero and sheet

**Hero band**

- Fill `#344A32`, bottom radius 40, `overflow: hidden`, `position: relative`
- Padding: 32px 20px 52px. At ≥960px, padding top 48px and horizontal 32px
- Content sits above the aurora (`z-index: 1`)
- Order: optional back chip, eyebrow, title, one sentence in `#F3E8CF` at 16/24

**Sheet**

- Fill `#FBF6EC`, top radius 40, margin-top `-40px`, `position: relative`
- Top lip 2px cream, shadow `0 -8px 16px rgba(37, 40, 35, 0.12)`
- Padding 36px 20px 32px
- At ≥720px the sheet is a panel: radius 40 on all corners, max-width 960px, margin ` -40px auto 48px`, horizontal padding 32px
- Form pages use max-width **480px** inside that panel so capsules do not become banners

### Fields

- Label above, 14/500, `#344A32`, margin-bottom 8
- Control: height 56, pill, fill `#EADCC5`, card lip and card shadow
- Value: DM Sans 18, `#252823`. Placeholder `#83947A`
- Prefix chip inside the left edge: height 40, fill `#344A32`, cream label
- Error: 1px `#B94E32` border, message 14 `#B94E32` under the field
- Textarea: min-height 128, radius 22, not a pill
- `:focus-visible` uses the orange ring. Do not rely on a color change alone

### Chips, status, nav

**Chip.** Min height 44, pill, padding 12px 16px. Idle fill `#EADCC5`, label `#252823`, bottom lip 3px `#DDD4C7`. Selected fill `#E97A3D`, label cream, lip `#B94E32`. Marker selected (a day, a favorite): fill `#E2B83F`, label `#252823`. Shadow `1px 3px 4px rgba(37, 40, 35, 0.12)`.

**Status pill.** Padding 4px 12px, label 12/600. Neutral `#DDD4C7` / ink. Active `#E97A3D` / cream. Waiting `#E2B83F` / ink. Bad `#B94E32` / cream.

**Top bar.** Sticky, fill `#FBF6EC`, bottom border 2px `#F3E8CF`, height 64, horizontal padding 20. Wordmark in DM Sans 20/600 `#252823`. Current item `#344A32` weight 600; others `#83947A`. No orange in the bar unless that item is the page's only primary action (it usually is not).

**Bottom bar.** Only under 720px, and only for an app-style shell. Same shape as a dock: top radius 28, top border 2px `#F3E8CF`, fill `#FBF6EC`. Blur with `backdrop-filter: blur(40px)` when transparency is allowed; otherwise the solid fill. Icon well 44. One item may fill `#344A32` when current.

### Rows, empty, steps, stats

**Row.** Card, label 16/600, `›` in `#83947A`. Stack gap 12. On a wide page, rows stay a single column inside the sheet.

**Empty.** One card, title 18/600, optional forest capsule 16px below.

**Steps.** "Step 2 of 4" in 14/600. Track is a pill, fill `#EADCC5`, padding 8, card shadow. Bars 6px tall, gap 4, done `#E97A3D`, rest `#DDD4C7`.

**Stat.** Min width 96, radius 18, padding 8px 12px, card lip. Value 18/600, caption 12.

---

## 5. Layout

| Token | px | Use |
| --- | --- | --- |
| `xs`–`xxl` | 4, 8, 12, 16, 20, 24 | Same jobs as mobile: dots, label gap, stacks, card pad, hero gutter, space before buttons |
| Form | 480 | Max width of a sign-in or wizard column |
| Page | 960 | Max width of the sheet panel |
| Wide | 1200 | Stop the canvas from stretching the type; extra cream is empty margin |

**Narrow (<720px).** Same stack as a phone: hero, overlapping sheet, optional bottom bar, gutter 20. Primary capsule may span the sheet.

**Medium (720–959px).** Sheet becomes a centered panel with 40px radius. No bottom bar. Top bar sticks.

**Wide (≥960px).** Hero title may go to 40px. The panel stays 960px. A list and a detail may sit side by side inside the panel, each column still using clay cards, gap 24. Do not add a second sidebar palette.

**Page background** outside the panel is `#F3E8CF`. The hero is full-bleed behind the panel's top, not a boxed banner floating in a white page.

**Vertical rhythm:** eyebrow, title, one sentence, then the sheet. Inside the sheet: title, 16, stack at 12, then the button group with 24px above it.

---

## 6. Depth

One lip, one shadow.

| Level | CSS | Use |
| --- | --- | --- |
| Card | `border-top: 2px solid rgba(251,246,236,.9); border-bottom: 4px solid #DDD4C7; box-shadow: 2px 6px 8px rgba(37,40,35,.12);` | Cards, fields, stats |
| Capsule | `border-top: 2px solid rgba(243,232,207,.7); border-bottom: 6px solid #B94E32; box-shadow: 4px 10px 12px rgba(37,40,35,.32);` | Primary. Forest uses bottom `#252823` |
| Chip | bottom lip 3px, `box-shadow: 1px 3px 4px rgba(37,40,35,.12);` | Chips |
| Sheet | `box-shadow: 0 -8px 16px rgba(37,40,35,.12);` | Panel |
| Bar | bottom or top 2px `#F3E8CF` | Top bar, narrow bottom bar |

**Hero wash.** Solid `#344A32`, then three radial gradients, then `backdrop-filter: blur(48px)` on an overlay so the orbs melt. Place the gradients approximately:

- Orange circle at `85% -10%`, about 220px, opacity `0.55`
- Mustard at `75% 20%`, about 160px, opacity `0.28`
- Leaf at `0% 110%`, about 200px, opacity `0.40`
- Cream at `100% 90%`, about 120px, opacity `0.16`

**Sheet wash.** The same gradients at the sheet opacities in §2. No backdrop blur, so text stays crisp.

**Drift.** Animate gradient positions 18px over 10s, `ease-in-out`, alternate. Off under `prefers-reduced-motion`. Under `prefers-reduced-transparency`, no filter and no orbs: flat `#344A32` hero, flat `#FBF6EC` sheet.

```css
:root {
  --surface-base: #f3e8cf;
  --surface-card: #eadcc5;
  --surface-shelf: #ddd4c7;
  --surface-sheet: #fbf6ec;
  --surface-hero: #344a32;
  --surface-ink: #252823;
  --text-high: #252823;
  --text-medium: #344a32;
  --text-low: #83947a;
  --text-on: #f3e8cf;
  --action-primary: #e97a3d;
  --action-hover: #d86a3a;
  --action-pressed: #b94e32;
  --accent: #e2b83f;
  --leaf: #79a94b;
  --radius-card: 22px;
  --radius-sheet: 40px;
  --radius-pill: 9999px;
}
```

Map these to whatever the codebase already calls tokens. Do not introduce a parallel set of names in components if the app already has semantic variables — point the existing names at these values.

---

## 7. Do and don't

**Do**

- Keep the hero full-bleed and the sheet overlapping it by 40px
- Cap the form column at 480px and the panel at 960px
- Show a visible focus ring
- Use one orange capsule
- Put labels above fields
- Fall back to solid fills when blur or motion is reduced

**Don't**

- Don't introduce a purple gradient, a glass card, or a white `#fff` canvas
- Don't turn the wide layout into a dark sidebar product
- Don't use mustard as a button
- Don't make every control a pill; cards are 22px, the sheet is 40px, only buttons and chips are fully round
- Don't underline the primary button
- Don't stretch a capsule across a 1200px page
- Don't put aurora on a card

---

## 8. Responsive

| Width | Behavior |
| --- | --- |
| <720 | Phone stack. Hero, sheet, optional bottom bar. Gutter 20. Capsule may be full width of the sheet |
| 720–959 | Centered sheet panel, radius 40 all around. Sticky top bar. No bottom bar |
| ≥960 | Hero title up to 40. Panel max 960. Optional two columns inside the panel |
| ≥1200 | Extra cream margin. Do not grow the panel |

Touch and mouse share the 44px minimum. The capsule stays 56 tall on desktop; do not shrink it to 32 to look "dense."

Hover exists only when the device can hover (`@media (hover: hover)`). On a touch laptop, the pressed state is enough.

Dialogs use the sheet material: `#FBF6EC`, radius 40, card-style fields, one orange capsule. Scrim is `#252823` at `0.40` opacity, not a blur of the whole app.

---

## 9. Prompts

Paste this file. Ask for one page. Repeat the tokens so the model does not drift.

**Tokens**

- Page `#F3E8CF`, hero `#344A32`, sheet `#FBF6EC`, card `#EADCC5`
- Primary `#E97A3D`, hover `#D86A3A`, lip `#B94E32`
- DM Sans titles, Source Sans 3 UI
- Card radius 22, sheet 40, capsule height 56, panel max 960, form max 480

**Sign-in.** Full-bleed forest hero, product name as eyebrow, one sentence. Overlapping sheet, max 480, labeled field, orange capsule, forest capsule, one clay card linking to the legal page.

**Marketing section.** Hero band with one headline and one orange capsule. Next band is cream with clay cards in a single row that wraps, gap 12. No card grid inside the hero.

**App list.** Top bar, then either a short hero or a cream page. Cards with title and status. One orange capsule. Empty state is one card.

**Settings.** Cream page, clay rows with `›`, no orange until a row opens a form.

### Checklist

1. One orange capsule in the view
2. Focus ring visible by keyboard
3. Panel does not exceed 960px; forms do not exceed 480px
4. Blur and drift turn off for reduced transparency and reduced motion
5. No second palette on wide screens
