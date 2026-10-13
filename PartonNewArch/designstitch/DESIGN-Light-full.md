---
name: Clinical Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system embodies a serene, clinical, and reassuring atmosphere tailored for patient care and medical scheduling. It blends Modern Corporate reliability with human-centric healthcare warmth, removing clinical anxiety through soft geometric surfaces, measured typography, and an open, clean layout.

The emotional tone balances high-standard diagnostic competence with welcoming accessibility. By combining disciplined structure with soothing teals and neutral slate backdrops, the interface fosters confidence, reduces friction during scheduling, and emphasizes absolute clarity in critical health data.

## Colors
The color hierarchy is anchored around clinical trust, clarity, and patient reassurance:

- **Primary (`#0D9488` - Deep Teal)**: Drives core actions, verified confirmations, and primary interactive components. Conveys clinical precision and stability.
- **Secondary (`#06B6D4` - Cyan)**: Used for secondary visual emphasis, focused interaction states, and informational indicators.
- **Tertiary (`#10B981` - Mint/Emerald)**: Reserved specifically for operational availability, open appointment slots, and successful clinical states.
- **Neutral (`#64748B` - Slate)**: Dictates the structural canvas, borders, low-contrast text hierarchy, and resting surfaces. Paired with pure `#FFFFFF` cards against `#F8FAFC` slate canvas backgrounds to reduce glare and visual fatigue.

## Typography
The typographic architecture pairs `Plus Jakarta Sans` for titles and section markers with `Inter` for operational data, dense booking flows, and instructional body copy.

- **Plus Jakarta Sans**: Injects welcoming, humanized geometry into structural headings, physician credentials, and specialty category titles, avoiding cold institutional severity.
- **Inter**: Provides clinical legibility, standardized horizontal pacing, and clear numeric distinctions for schedules, medication dosages, and input labels.
- **Hierarchy Rules**: Display headings utilize slight negative tracking to preserve compactness. Data labels and clinical microcopy employ deliberate positive tracking to maintain legibility on varying screen resolutions.

## Layout & Spacing
The layout relies on a clean 12-column fluid grid system across desktop screens, collapsing to an 8-column system on tablets and a single-column 4-unit structure on mobile devices.

- **Grid Alignment**: Outer canvas margins enforce breathable containment (`2rem` desktop, `1rem` mobile). Component gutters ensure distinct separation between calendar pickers, practitioner listings, and summary modules.
- **Rhythm**: Element spacing follows a strict 4px/8px modular base. Information groupings use `space-sm` for related metadata (e.g., physician name and specialty), while distinct structural units use `space-lg` to prevent cognitive fatigue.

## Elevation & Depth
Elevation emphasizes clarity, hygiene, and calm layering rather than dramatic theatrical depth:

- **Surface Treatment**: The main canvas resides on a soft slate tint (`#F8FAFC`). Medical cards, scheduling panels, and modals rest on clean white (`#FFFFFF`) with precise, low-contrast slate borders (`#E2E8F0`).
- **Shadow Profile**: Shadows are ambient and diffused, tinted subtly with slate (`rgba(15, 23, 42, 0.04)` to `rgba(15, 23, 42, 0.08)`). They define actionable surfaces without cluttering the clinical space.
- **Layering Hierarchy**:
  - *Base Surface (0)*: Canvas backgrounds.
  - *Elevated Cards (1)*: Standard practitioner cards, appointment time slots. Flat border with an ambient 2px blur.
  - *Hover & Selected (2)*: 8px blur with a slight teal tint to signify interactive readiness.
  - *Overlays & Dialogs (3)*: Modals and booking confirmation drawers with soft 24px ambient drop shadows over a semi-transparent slate scrim.

## Shapes
A roundedness factor of `2` provides a balanced aesthetic: modern and approachable without compromising the disciplined structure of health informatics.

- **Base Components**: Inputs, slot chips, and standard buttons utilize `0.5rem` (`rounded-md`).
- **Structural Containers**: Practitioner profiles, booking calendar frames, and summary cards use `1rem` (`rounded-lg`).
- **Modal Sheets and Banners**: Prominent confirmation dialogs and critical notification panels scale to `1.5rem` (`rounded-xl`).
- **Complete Pills**: Used exclusively for dynamic status chips (e.g., "Available Today", "In-Person", "Telehealth").

## Components

### Buttons
- **Primary**: Solid `#0D9488` background with `#FFFFFF` text. Height of 44px (minimum touch target), `0.5rem` border radius, semi-bold Inter typography. Hover transitions gently to `#0F766E`.
- **Secondary**: Slate-tinted outline (`#CBD5E1`) with `#0D9488` text on transparent or white background.
- **Tertiary / Ghost**: Padding-only link style in primary teal for lightweight navigational actions.

### Slot & Availability Chips
- **Available Time Slot**: White surface with a thin `#CBD5E1` border and `#0F172A` text. Hover introduces a `#0D9488` border and mint wash.
- **Selected Time Slot**: Solid `#0D9488` fill with `#FFFFFF` text and slight teal glow.
- **Unavailable / Booked**: Subdued `#F1F5F9` background, `#94A3B8` text, non-interactive.
- **Status Indicator**: Fully rounded pill containing a 6px tertiary mint (`#10B981`) circular dot alongside small Inter label copy.

### Cards (Practitioner & Appointment)
- Constructed with a solid white background, framed by a 1px `#E2E8F0` border, and elevated with ambient slate drop shadow.
- Clear structural compartmentalization: avatar and biographical header, divider line, schedule slot horizontal carousel, and full-width booking action footer.

### Input Fields & Selectors
- Standard height of 44px with a 1px `#CBD5E1` border on a white ground.
- Placeholder text set in `#94A3B8`.
- Focus state activates a 2px outer ring in `#06B6D4` paired with a `#0D9488` border transition.
- Error states swap borders to soft crimson (`#EF4444`) accompanied by an inline status descriptor.

### Checkboxes & Radio Buttons
- 20px structural bounds with `0.25rem` radius for checkboxes and full circles for radio buttons.
- Selected state fills with `#0D9488` and displays a crisp white check or centered circle.

### Clinical Badges & Notice Banners
- Informational notices leverage soft cyan backgrounds (`#ECFEFF`) with `#0891B2` accent lines.
- Confirmation banners incorporate soft mint surfaces (`#ECFDF5`) framed with `#10B981` accents.