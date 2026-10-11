---
name: PartOn
colors:
  surface: '#fff8f0'
  surface-dim: '#e4d9c1'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fef3d9'
  surface-container: '#f8edd4'
  surface-container-high: '#f2e7ce'
  surface-container-highest: '#ece2c9'
  on-surface: '#201b0c'
  on-surface-variant: '#564239'
  inverse-surface: '#36301f'
  inverse-on-surface: '#fbf0d7'
  outline: '#8a7268'
  outline-variant: '#ddc1b4'
  surface-tint: '#9e4203'
  primary: '#9e4203'
  on-primary: '#ffffff'
  primary-container: '#e97a3d'
  on-primary-container: '#562000'
  inverse-primary: '#ffb692'
  secondary: '#4d644a'
  on-secondary: '#ffffff'
  secondary-container: '#cfeac9'
  on-secondary-container: '#536a50'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea62e'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcb'
  primary-fixed-dim: '#ffb692'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#793000'
  secondary-fixed: '#cfeac9'
  secondary-fixed-dim: '#b4ceae'
  on-secondary-fixed: '#0b200c'
  on-secondary-fixed-variant: '#364c34'
  tertiary-fixed: '#ffdf91'
  tertiary-fixed-dim: '#ecc148'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fff8f0'
  on-background: '#201b0c'
  surface-variant: '#ece2c9'
typography:
  display:
    fontFamily: DM Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-sm:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
  caption:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  button:
    fontFamily: Source Sans 3
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.0'
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system establishes a high-trust, outdoor-daylight-ready marketplace aesthetic tailored for shift workers, employers, and administrators. The mood is calm under time pressure, highly functional, and completely grounded away from generic tech-industry clichés.

- **Brand Personality:** Trustworthy, direct, calm, reliable, and operationally rigorous.
- **Target Audience:** Shift workers seeking fast job confirmations, employers managing high-turnover seating, and operations administrators running dense queues.
- **Design Style:** Solid surface elevation combined with high-contrast, structural clarity. Depth is communicated strictly through deliberate color-blocking tiers (surface ladders) rather than heavy drop shadows or trendy purple-indigo gradients. 
- **Emotional Response:** Reassurance, clarity, efficiency, and steadfast reliability.

## Colors

The color palette anchors the user interface in warm, natural tones designed for outdoor visibility and immediate operational legibility. 

- **Primary Color (`#E97A3D`):** Energetic amber-orange reserved exclusively for the single primary call-to-action per viewport. Never use for secondary actions or decorative clusters.
- **Secondary Color (`#344A32`):** Grounded olive-forest green utilized for branded cards, administrative sidebar surfaces, high-structure navigation containers, and secondary text contrast.
- **Tertiary Color (`#E2B83F`):** Warm golden mustard explicitly designated for highlight accents, rating stars, and attention-grabbing tags.
- **Neutral Color (`#F3E8CF`):** Warm cream canvas serving as the primary light-mode background, evoking paper rosters under sunlight.
- **Dark Neutral (`#252823`):** Deep charcoal acting as the default root canvas for admin views and dark mode implementations.
- **Accent & Feedback Tones:** Mustard (`#E2B83F`) is strictly dedicated to favorites and star ratings. Rust (`#B94E32`) signals errors and destructive actions.

## Typography

Typography establishes an efficient, unpretentious, and highly legible hierarchy optimized for rapid scanning and correct rendering of Turkish diacritics (`ğüşıöç`).

- **Display & Headlines:** Set in `DM Sans` with tight tracking for a friendly, modern, geometric presence.
- **UI & Body:** Set in `Source Sans 3` to ensure crisp readability across dense forms, tables, and mobile viewports.
- **Operations:** `JetBrains Mono` handles IDs, hashes, and administrative tracking numbers.
- **Hierarchy Rule:** Establish hierarchy strictly through font weight, scale, and surface placement rather than color variety.

## Layout & Spacing

The layout model relies on a responsive, content-aware grid and a strict 4px-based spacing rhythm.

- **Layout Model:** Mobile viewports use single-column fluid layouts with 16px side insets. Admin interfaces utilize dense tables and fixed-width sidebars. Marketing pages adhere to a centered 1200px max-width container with generous vertical banding.
- **Whitespace Strategy:** Prioritize breathing room on mobile devices to ensure thumb-first ergonomics. Admin views maintain high density while guaranteeing row heights of at least 40px for precise mouse interaction.
- **Spacing Scale:** Spacing tokens govern grid gutters, canvas margins, and component internal padding consistently across all form factors.

## Elevation & Depth

Visual hierarchy and depth are communicated primarily through a solid surface elevation ladder rather than complex drop-shadow stacks.

- **Flat (Level 0):** Pure surface color utilization for background canvases and base layouts.
- **Raised (Level 1):** Solid stacked surfaces (`surface-level-1` placed over `surface-base`) for cards, sheets, and sidebars.
- **Overlay (Level 2):** Elevated containers for popovers, modals, and sticky floating chrome, accompanied by minimal whisper-soft shadows (`0 1px 2px rgba(37,40,35,0.08)`) only when necessary.
- **Chrome:** Translucency and background blur are strictly restricted to system-level navigation bars (iOS Liquid Glass principles), leaving content cards completely opaque and high-contrast.

## Shapes

The shape language utilizes confident, balanced rounded corners (`roundedness: 2`) that soften the utilitarian interface while maintaining structured operational clarity.

- **Radius Scale:** Base elements and compact controls use 0.5rem (8px). Standard cards, inputs, and primary containers use `rounded-lg` (1rem / 16px), while larger modal sheets and feature banners expand to `rounded-xl` (1.5rem / 24px).
- **Pill Usage:** Full-pill (`9999px`) shapes are strictly reserved for status chips and token badges, preventing accidental visual confusion with primary call-to-action buttons.

## Components

Components are engineered for high operational clarity, predictable touch targets, and strict adherence to role-based color tokens.

- **Buttons:** Exactly one primary CTA (`action-primary-default` in orange with `text-on-color` text) appears per viewport. Secondary actions use transparent fills with 1.5px borders matching `action-secondary` (`#344A32`). Destructive actions use `feedback-error`.
- **Cards & Lists:** Built with solid fills (`surface-level-1`) and comfortable 16px (`rounded-lg`) corners. Job and applicant cards feature status chips positioned cleanly in the top-right corner.
- **Input Fields:** Generous height (44-48px on mobile, 40px on admin) with required labels placed explicitly above fields and soft rounded corners (`rounded`). Focus rings map directly to the primary action color.
- **Chips & Badges:** Short Turkish copy (`Onay bekliyor`, `Check-in açık`) enclosed in pill shapes utilizing tertiary accent (`#E2B83F`) and feedback tokens.
- **Navigation:** Mobile navigation utilizes bottom stacks with light translucency on chrome elements only, while admin dashboards feature an olive-forest (`#344A32`) sidebar paired with a charcoal-anchored content pane.