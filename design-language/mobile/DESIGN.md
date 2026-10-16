---
name: Warm Clay
platform: mobile
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
  day: 16px
  stat: 18px
  card: 22px
  dock: 28px
  sheet: 40px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  hero-bottom: 52px
  overlap: 40px
---

# Warm Clay — Mobile

Portable visual language for iOS and Android. Copy this file in as `DESIGN.md`. It does not name a product, a domain, or a brand color beyond the roles below.

The reference screen is a **forest hero** with a soft color wash, overlapped by a **cream sheet** that holds the work. Controls look pressed out of clay: a light top lip, a thicker bottom shelf, and one soft shadow. Orange is the single next step. Mustard is a marker, never a button.

Build the eight pieces in [§4](#4-components) before any screen. Screens are those pieces stacked.

---

## 1. Theme

**Mood:** warm paper in daylight, calm, physical, a little soft. Not a glass dashboard, not a neon toy.

**Three materials only:**

| Material | Where | Never |
| --- | --- | --- |
| **Clay** | Cards, fields, chips, capsule buttons | Flat gray rectangles |
| **Aurora** | Behind the hero, faintly on the sheet | On cards, forms, or lists |
| **Ink** | Type and the hero fill | Outlines around every element |

**One next step.** Each screen has one orange capsule. A second action is a forest capsule or a text button. A third is a row, not another button.

**Light only.** The canvas is cream. The hero is forest. Do not ship a separate dark theme unless the product already has one; if you add it later, invert canvas and ink and keep orange, mustard, and leaf unchanged.

**Motion is small.** Press scales to `0.97`. Aurora drifts a few pixels. Both stop when the OS asks for less motion. Aurora disappears when the OS asks for less transparency.

---

## 2. Color

Use the role, not a new hex. If a screen needs a color that is not in this table, it does not get one.

### Surfaces

| Role | Hex | Use |
| --- | --- | --- |
| `surface-base` | `#F3E8CF` | Screen canvas behind a normal page |
| `surface-card` | `#EADCC5` | Cards, fields, unselected chips |
| `surface-shelf` | `#DDD4C7` | Clay bottom lip, sunken tracks |
| `surface-sheet` | `#FBF6EC` | Overlapping sheet, dock fallback |
| `surface-hero` | `#344A32` | Hero, forest capsule, prefix chip |
| `surface-ink` | `#252823` | Forest-button lip, raised-tab lip |

`surface-sheet` is lighter than the canvas. That is the paper sitting on the desk, not a mistake.

### Text

| Role | Hex | Use |
| --- | --- | --- |
| `text-high` | `#252823` | Titles, values, row labels |
| `text-medium` | `#344A32` | Body, field labels, hints |
| `text-low` | `#83947A` | Placeholders, idle icons, chevrons |
| `text-on` | `#F3E8CF` | Type on orange, forest, or danger |

On mustard, type is `text-high`, not cream.

### Action and feedback

| Role | Hex | Use |
| --- | --- | --- |
| `action-primary` | `#E97A3D` | The one capsule, selected strong chips, event dots |
| `action-pressed` | `#B94E32` | Primary lip, pressed fill, danger fill |
| `action-secondary` | `#344A32` | Forest capsule, active dock icon |
| `accent` | `#E2B83F` | Selected day, favorite, count badge |
| `leaf` | `#79A94B` | Aurora only, plus a quiet positive mark |
| `danger` | `#B94E32` | Errors, destructive capsule |

`accent` and `leaf` never fill a screen-level button.

### Aurora inks

Same four pigments, used only as blurred orbs:

| Orb | Hex | Hero opacity | Sheet opacity |
| --- | --- | --- | --- |
| Orange | `#E97A3D` | `0.55` | `0.18` |
| Mustard | `#E2B83F` | `0.28` | `0.16` |
| Leaf | `#79A94B` | `0.40` | `0.14` |
| Cream | `#F3E8CF` | `0.16` | none |

No purple, indigo, cyan, pure black, or pure white.

---

## 3. Type

| Role | Family | Size / line | Weight | Use |
| --- | --- | --- | --- | --- |
| Hero title | DM Sans | 32 / 38 | 700 | First line on the forest hero |
| Sheet title | DM Sans | 20 / 26 | 600 | Title inside the sheet |
| Card title | DM Sans | 18 / 24 | 600 | Card and empty-state titles |
| Stat value | DM Sans | 18 / 24 | 600 | The number in a stat tile |
| Field value | DM Sans | 18 / 24 | 400 | Text inside a capsule field |
| Body | Source Sans 3 | 16 / 24 | 400 | Paragraphs under the hero |
| Label | Source Sans 3 | 14 / 20 | 500 | Field labels, hints, step label |
| Button | Source Sans 3 | 16 / 20 | 600 | Capsule and text buttons |
| Chip | Source Sans 3 | 14 / 18 | 400–600 | Filters; 600 on status |
| Caption | Source Sans 3 | 12 / 16 | 500–600 | Eyebrow, badge, meta |
| Dock | Source Sans 3 | 11 / 14 | 500 idle, 600 active | Tab labels |

Eyebrow on the hero is Source Sans 3, 12, weight 600, color `text-on`, sitting 6px above the title.

Do not set tracking tighter than `-0.02em`, and only on the 32px title. Do not use a second display family. DM Sans and Source Sans 3 both cover Latin, including `ğ ü ş ı ö ç`.

---

## 4. Components

Sizes are logical pixels. Hit targets are at least 44×44. The primary capsule is 56 tall.

### Buttons

Default shape is a **capsule** (fully round ends). A rectangle is the exception.

| Variant | Fill | Label | Lip | When |
| --- | --- | --- | --- | --- |
| Primary | `#E97A3D` | `text-on` | bottom 6px `#B94E32` | The one next step |
| Forest | `#344A32` | `text-on` | bottom 6px `#252823` | The second step |
| Danger | `#B94E32` | `text-on` | same lip as primary | Confirm a destructive step |
| Outline | transparent | `text-medium` | none; 1px `#344A32` border | Rare, dense rows |
| Ghost | transparent | `text-medium` | none | A text action under the capsules |

Capsule: height 56, padding horizontal 20, label 16/600. Top lip 2px `rgba(243, 232, 207, 0.70)`. Shadow `4px 10px`, blur 12, color `#252823` at `0.32` opacity. Disabled: opacity `0.40`, no press scale.

Outline and ghost: height 48, radius 16, no clay shadow.

Press (capsules, cards, chips): scale `0.97`, 160ms in, 120ms out, curve `cubic-bezier(0.23, 1, 0.32, 1)`. Skip the scale when Reduce Motion is on. The dock does not scale.

### Cards

- Fill `surface-card`, radius **22**, padding 16
- Top lip 2px `rgba(251, 246, 236, 0.90)`
- Bottom lip 4px `surface-shelf`
- Shadow `2px 6px`, blur 8, `#252823` at `0.12`
- Title left, status pill right, 12px gap
- A tappable card is the row. Do not add a button inside it unless the card is an empty state

### Sheet and hero

This pair is the default page, not a modal.

**Hero**

- Fill `surface-hero`, bottom radius 40, clip children
- Padding: safe-area top + 16, horizontal 20, bottom 52
- Order: back chip, eyebrow, 32px title, optional one-line subtitle in `text-on`
- Aurora sits behind the type (`z` under the text)

**Sheet**

- Fill `surface-sheet`, top radius 40
- Pull up by 40 so it covers the hero's bottom curve
- Top lip 2px `rgba(251, 246, 236, 0.90)`
- Shadow `0 -8px`, blur 16, `#252823` at `0.12`
- Padding horizontal 20; top 36, or 28 when the sheet has its own title; bottom = max(safe area, 16)
- A faint aurora, no blur
- Content stacks with 12px gaps

### Fields

- Label above the control, 14/500, `text-medium`, 8px under the label
- Capsule, height 56, fill `surface-card`, same lips and shadow as a card
- Value in DM Sans 18, `text-high`. Placeholder `#83947A`
- Optional prefix chip inside the left: height 40, forest fill, cream 16/600 label, chip lip
- Error: 1px `#B94E32` border on the field, message 14 in `#B94E32` 4px below
- Multiline: min height 128, radius 22, not a capsule
- Never use the placeholder as the only label

### Chips and status

Chip: height at least 44, pill, padding 12×8.

| State | Fill | Label | Bottom lip |
| --- | --- | --- | --- |
| Idle | `surface-card` | `text-high` | 3px `surface-shelf` |
| Selected | `#E97A3D` | `text-on` | 3px `#B94E32` |
| Selected marker | `#E2B83F` | `text-high` | 3px `#B94E32` |

Chip shadow: `1px 3px`, blur 4, opacity `0.12` idle and `0.20` selected. Top lip always 2px cream.

Status pill (read-only, shorter padding 12×4, label 12/600):

| Tone | Fill | Label |
| --- | --- | --- |
| Neutral | `surface-shelf` | `text-high` |
| Active | `#E97A3D` | `text-on` |
| Waiting | `#E2B83F` | `text-high` |
| Bad | `#B94E32` | `text-on` |

### Dock

Four or five tabs. Sits on the bottom safe area.

- iOS: blur 40, light chrome material, fallback `surface-sheet`
- Android: solid `surface-sheet` (no blur)
- Top radius 28, top border 2px `#F3E8CF`
- Padding top 10, horizontal 8, bottom = max(safe area, 8)
- Each tab: 44×44 icon well, radius 22, label 11 under it
- Idle icon and label: `text-low`. Active: `surface-hero`
- One tab may be "raised": when active, the well fills `surface-hero`, icon turns cream, and the well gets a 3px `#252823` bottom lip
- Badge: mustard circle, min 16, charcoal 10/700, cap the count at `9+`

### Rows, empty, progress, stats

**Row.** A card with the label 16/600 and a `›` in `text-low` at 20px. Gap between rows 12.

**Empty.** One card. Title 18/600. Optional forest capsule 16px below the title. No illustration unless the product already has one.

**Steps.** Caption "Step 2 of 4" in 14/600 `text-medium`. Track is a clay pill: fill `surface-card`, padding 8, radius full. Bars are 6px tall, radius full, gap 4. Done bars are orange; the rest are `surface-shelf`.

**Stat.** Tile min width 96, radius 18, padding 12×8, same card lip. Value 18/600, caption 12 in `text-medium`.

**Day cell.** Radius 16. Selected cell fills mustard and uses the selected chip lip. Number is DM Sans 14/600. A 6px dot under the number: orange if something is scheduled, forest if it is only a hint, otherwise invisible.

**Back.** A chip on the hero, not a naked chevron in the corner.

---

## 5. Layout

| Token | px | Use |
| --- | --- | --- |
| `xs` | 4 | Icon-to-label, dot gap |
| `sm` | 8 | Label-to-field, chip padding |
| `md` | 12 | Stacks of buttons, cards, fields |
| `lg` | 16 | Card padding, normal page gutter |
| `xl` | 20 | Hero and sheet gutter |
| `xxl` | 24 | Space before the button group |
| overlap | 40 | Sheet pull over the hero |
| hero bottom | 52 | Hero padding under the subtitle |

**Page, default.** Forest hero, then the sheet. The screen behind them is `surface-hero` so the top bounce matches the hero.

**Page, plain.** Use this for a long list that should not repeat the hero. Canvas `surface-base`, gutter 16, top and bottom 24, plus the top safe area. Still one orange action.

**Vertical rhythm inside the sheet:** title, 16, content stack at 12, flexible spacer, then the button group at 12. The legal or secondary card sits under the buttons, not beside them.

**Lists** are a single column. Cards are full width of the sheet. Do not invent a two-column grid on a phone.

**Refresh** tint is `#E97A3D`.

---

## 6. Depth

Depth is a lip plus one shadow. Do not stack three shadows.

| Level | Recipe | Use |
| --- | --- | --- |
| 0 | Flat fill | Canvas, hero fill |
| 1 Clay | top 2 / bottom 4, shadow `2,6` blur 8 at `0.12` | Cards, fields, stat, step track |
| 2 Clay | top 2 / bottom 6, shadow `4,10` blur 12 at `0.32` | Capsule buttons |
| Chip | top 2 / bottom 3, shadow `1,3` blur 4 | Chips, day cells, badges |
| Sheet | top 2, shadow `0,-8` blur 16 at `0.12` | The overlapping page |
| Dock | top border only; blur is the material | Tab bar |

**Aurora, hero.** Four circles, no pointer events. Orange 220px at top -70 / right -50. Mustard 160px at top 36 / right 28. Leaf 200px at bottom -80 / left -40. Cream 120px at bottom 8 / right -20. Opacities from §2. Then a 48px dark blur over the hero only.

**Aurora, sheet.** Same orbs, smaller and fainter (sizes 180, 140, 200), no blur, so type stays sharp.

**Drift.** 10s ease-in-out sine, then reverse. Translate about 18px one way and 14px back. Freeze at 0 when Reduce Motion is on. Paint nothing when Reduce Transparency is on; the hero stays solid forest and the sheet stays solid cream.

**Pressed.** Scale only. Do not change the lip color on press; the fill may move from `#E97A3D` to `#B94E32`.

---

## 7. Do and don't

**Do**

- Start every new screen from the hero + sheet, or from the plain cream page
- Keep one orange capsule
- Put labels above fields
- Use the lip values in §6 without tweaking them per screen
- Honor Reduce Motion and Reduce Transparency
- Keep 44px targets and 16–20px gutters

**Don't**

- Don't add purple, indigo, cyan, or a glow behind buttons
- Don't blur a card, a field, or a list
- Don't use mustard or leaf as a primary button
- Don't place two orange capsules on one screen
- Don't use a placeholder instead of a label
- Don't tighten the hero into a small banner; the title is 32px
- Don't draw a 1px gray border on cards; the lip is the edge
- Don't scale the dock on press

---

## 8. Platforms

| | iOS | Android |
| --- | --- | --- |
| Dock | Blur 40, light material | Solid `#FBF6EC` |
| Hero blur | 48, dark | Same blur if the blur view exists; otherwise solid forest plus the orbs |
| Type | `DM Sans`, `Source Sans 3` | Same files, registered under those family names |
| Safe area | Top on the hero, bottom on the sheet and dock | Same |
| Elevation | The shadow fields above | `elevation` 3 on cards, 8 on capsules and the sheet |

The layout does not change between the two. If a blur API is missing, drop the blur and keep the solid fill. Do not swap in a different palette.

**Large phones.** Still one column. Do not grow the hero title past 32.

**Tablet.** Keep the phone column, max width 480, centered on `surface-base`. Do not stretch capsules across the tablet width.

---

## 9. Prompts

Paste this file, then ask for one screen. Name the pieces, not a vibe.

**Tokens to repeat in every prompt**

- Canvas `#F3E8CF`, hero `#344A32`, sheet `#FBF6EC`, card `#EADCC5`
- Primary `#E97A3D` with lip `#B94E32`, forest button `#344A32`
- Title DM Sans 32 on the hero; UI Source Sans 3
- Card radius 22, sheet radius 40, capsule height 56

**Sign-in.** Forest hero, eyebrow = product name, one subtitle. Sheet: labeled phone or email field with a prefix chip if needed, orange capsule, forest capsule, then one clay card that navigates to legal text.

**List.** Either a plain cream page or a short hero plus sheet. Cards with a title and a status pill. One orange capsule pinned at the bottom of the sheet. Empty state is a single card.

**Form.** Sheet title, step track, fields with labels, error under the field in `#B94E32`, one orange capsule, optional ghost under it.

**Detail.** Hero shows the name. Sheet holds stat tiles, then clay rows, then the orange action.

**Settings.** Plain cream page, stack of clay rows with `›`, no orange until a row opens a form.

### Checklist before you ship a screen

1. One orange capsule, or none
2. Lips match §6
3. Aurora only on hero and sheet
4. Labels are visible without the placeholder
5. Reduce Motion and Reduce Transparency still look finished
6. iOS dock blurs; Android dock is solid cream
