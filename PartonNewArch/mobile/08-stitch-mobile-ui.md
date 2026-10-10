# 08 — Stitch mobile UI (visual redesign)

**Status:** `accepted` — Stitch project is the visual reference for mobile implementation  
**Last updated:** 2026-10-10  
**Visual SoR:** [`../DESIGN.md`](../DESIGN.md) · [ADR-0039](../backend/adr/0039-design-md.md)  
**Stack:** NativeWind — [04](04-nativewind-ui.md) · Liquid Glass chrome — [05](05-wwdc-liquid-glass.md)  
**Stitch:** [awesome-design-md](https://github.com/voltagent/awesome-design-md) format uploaded → Google Stitch MCP

## Project

| Field | Value |
| --- | --- |
| **Title** | PartOn Mobile UI |
| **Project ID** | `12785901164400200423` |
| **Resource** | `projects/12785901164400200423` |
| **Open** | [stitch.withgoogle.com](https://stitch.withgoogle.com) → PartOn Mobile UI |
| **Design system asset** | `assets/82020ca97a4c4985ba46bcfd07a5e5fc` (`PartOn` / PartOn Mobile) |
| **Device** | `MOBILE` |
| **Tokens** | Cream `#F3E8CF` · cards `#EADCC5` · orange CTA `#E97A3D` · forest `#344A32` / `#234D3C` · mustard accent `#E2B83F` |
| **Type** | DM Sans (display) · Source Sans 3 (body) · ROUND_TWELVE / ROUND_EIGHT |

> Agents implementing `apps/mobile` **must** match these Stitch screens + [`DESIGN.md`](../DESIGN.md). Do not invent a second palette.

## Coverage target

**75 / 75** mobile catalog screens must exist in this Stitch project. Seed screens below; full maps in `_stitch-batch-*.md`.

## Generated screens (seed + batches)

| Screen ID (catalog) | Stitch title | Stitch screen id | Role |
| --- | --- | --- | --- |
| `m.auth.phone` | PartOn - Giriş Yap (Telefon) | `3249113d15554a51a0f7a9f8ea61aea2` | Auth |
| `m.auth.otp` | PartOn - Doğrulama Kodu (OTP) | `70ee5f947b4f4914814e5ef0a656a4b0` | Auth |
| `m.worker.home.root` | PartOn - Çalışan Ana Sayfası (Worker Home) | `6ae695fd27724f7496ce975bc977ee0a` | Worker |
| `m.worker.jobs.list` | PartOn - Vardiya Listesi (Worker Jobs Feed) | `34f936694be144978d3825c3843401f7` | Worker |
| `m.worker.jobs.detail` | PartOn - Vardiya Detayı (Worker Job Detail) | `d8826d21fc6a45b8af176a3170d1aad8` | Worker |
| `m.worker.shift.check-in` | PartOn - Vardiya Check-in | `48746d9eda12444887ce09fea85b2e2f` | Worker |
| `m.employer.home.root` | PartOn - İşveren Ana Sayfası (Employer Home) | `cd7ac0b4f5ce40d9a6c3fe9adba52073` | Employer |
| `m.auth.role-select` | PartOn - Rol Seçimi | `270cf373fb25456c83c7abfea12c05aa` | Auth |
| `m.auth.policies` | PartOn - Politika Onayı | `27e2f66293284a7aa94ca91ec0a0cd0f` | Auth |
| `m.manager.home.root` | PartOn - Şube Müdürü Ana Sayfası | `3d1d40716ded49a59c190c9fd9b68d84` | Manager |

**Batch maps:** [`_stitch-batch-a.md`](_stitch-batch-a.md) · [`_stitch-batch-b.md`](_stitch-batch-b.md) · [`_stitch-batch-c.md`](_stitch-batch-c.md) · [`_stitch-batch-shared.md`](_stitch-batch-shared.md)

HTML + screenshots live on each `projects/.../screens/{id}` via Stitch MCP `get_screen`. Cross-channel index: [`../shared/13-stitch-projects.md`](../shared/13-stitch-projects.md).

## Design rules enforced in Stitch

1. **One orange primary CTA** per viewport (`#E97A3D`, cream label, ~12px radius — not full-pill CTA).  
2. **Solid cards** on cream canvas — no glass/blur on job cards or forms.  
3. **Turkish** primary copy; short action labels.  
4. **Mustard** only for stars / favorites / token accents — never as primary button.  
5. **No** purple-glow / indigo AI gradients.  
6. Bottom tabs: translucent chrome OK; content opaque.

## Implementation mapping

| Stitch → code | Target |
| --- | --- |
| Colors / type / radius | NativeWind theme from [`shared/01-color-system.md`](../shared/01-color-system.md) |
| Components | [`shared/02-ui-components.md`](../shared/02-ui-components.md) names |
| Layout recipes | R1–R8 [`shared/03`](../shared/03-screen-ux-layout.md) |
| Screen wiring | [`02-screen-catalog.md`](02-screen-catalog.md) + `screens/*.md` |

## Extending the Stitch project

Use Stitch MCP (or UI) with `designSystem: assets/82020ca97a4c4985ba46bcfd07a5e5fc`:

1. Remaining auth: `m.auth.role-select`, `m.auth.policies`  
2. Worker: apply-confirm, 3h confirm, availability, profile  
3. Employer: jobs list, create-job wizard, applicants, tokens  
4. Manager: home, jobs, applicants  

After new screens: update the table above + cite screen ids in the matching `screens/*.md` **Stitch** field.

## Related

- [`DESIGN.md`](../DESIGN.md) · [ADR-0039](../backend/adr/0039-design-md.md)  
- [04 NativeWind](04-nativewind-ui.md) · [05 Liquid Glass](05-wwdc-liquid-glass.md)  
- [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) · [awesome-design-md](https://github.com/voltagent/awesome-design-md)
