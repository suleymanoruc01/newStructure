# 12 — Stitch web + admin UI

**Status:** `accepted` — Stitch projects are visual references for web marketing, employer console, and admin  
**Last updated:** 2026-10-10  
**Visual SoR:** [`../DESIGN.md`](../DESIGN.md) · [ADR-0039](../backend/adr/0039-design-md.md)  
**Catalog:** [`02-screen-catalog.md`](02-screen-catalog.md) (72 screens)

## Projects

| Channel | Title | Project ID | Design system | Device | Mode |
| --- | --- | --- | --- | --- | --- |
| **Web** (marketing + employer) | PartOn Web UI | `9476327726481865180` | `assets/a8fa890618af4ed1a14292297eed4a23` | DESKTOP | LIGHT cream |
| **Admin** | PartOn Admin UI | `11035737984554056770` | `assets/36f95a698c9e4d6fbfdda9b8b7301dad` | DESKTOP | DARK forest |
| **Mobile** (cross-ref) | PartOn Mobile UI | `12785901164400200423` | `assets/82020ca97a4c4985ba46bcfd07a5e5fc` | MOBILE | LIGHT cream — [mobile/08](../mobile/08-stitch-mobile-ui.md) |

Open: [stitch.withgoogle.com](https://stitch.withgoogle.com)

## Batch maps (generated)

| File | Scope |
| --- | --- |
| [`_stitch-batch-web.md`](_stitch-batch-web.md) | `w.public.*` · `w.auth.*` · `w.employer.*` (32) |
| [`_stitch-batch-admin.md`](_stitch-batch-admin.md) | `w.admin.*` (40) |

> Agents: after Stitch generation completes, merge batch tables into the master tables below. Implementation must match Stitch + DESIGN.md.

## Design rules

### Web (light)

- Cream `#F3E8CF` canvas; solid cards `#EADCC5`  
- Marketing: brand-first hero, one orange CTA, no cards in hero  
- Employer: sidebar + dense tables; one orange primary per page  

### Admin (dark)

- Charcoal `#252823` base; forest `#234D3C` sidebar/cards  
- Orange `#E97A3D` primary; JetBrains Mono for IDs  
- Dense tables; CSV/PDF secondary unless export is the task  

### Banned

Purple-glow AI UI · glass on tables/cards · invented hex outside tokens

## Related

- [04 shadcn dark](04-shadcn-dark-ui.md) · [07 marketing](07-marketing.md) · [08 admin cases](08-admin-case-coverage.md)  
- [mobile/08 Stitch](../mobile/08-stitch-mobile-ui.md)
