# CASE-UX — Kullanılabilirlik Testleri

**Cases:** 9  
**Source group description:** Kullanılabilirlik, hata/boş/yükleniyor durumları, form anlaşılırlığı ve UI geri bildirimleri.

## Required capabilities
- First-run worker clarity (T-235); profile time budget (T-236)
- Employer create-job clarity (T-237); feed clarity (T-238)
- Application status readability (T-239)
- Check-in timing UX (T-240); location permission rationale (T-241)
- Favorites UX (T-242); token mental model (T-243)

## Screens
All P0 flows need empty/loading/error copy review checklist. Layout recipes + CASE-UX mapping: [`../../shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md) · [ADR-0019](../../backend/adr/0019-screen-ux-layout.md).  
**UX principles (Sept 2026):** [`../../shared/10-modern-ux-principles.md`](../../shared/10-modern-ux-principles.md) · [ADR-0026](../../backend/adr/0026-modern-ux-principles.md).

## Architecture
- Screen UX & layout (R1–R8): [`../../shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md)
- Wizard state (T-236/T-237 Back): [`../../shared/04-wizard-state.md`](../../shared/04-wizard-state.md)
- Accessibility WCAG (clarity + operable UI): [`../../shared/06-accessibility-wcag.md`](../../shared/06-accessibility-wcag.md)
- i18n (Turkish primary copy): [`../../shared/07-i18n.md`](../../shared/07-i18n.md)
- Components: [`../../shared/02-ui-components.md`](../../shared/02-ui-components.md)
- UI mandate: [`../03-ui-coverage-mandate.md`](../03-ui-coverage-mandate.md)
- App architecture §15.3: [`../../04-application-architecture.md`](../../04-application-architecture.md)

## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-235` | İlk kez kullanan işçi akışı anlayabiliyor mu | Orta | Kullanılabilirlik | — |
| `T-236` | Profil oluşturma süresi uygun mu | Yüksek | Kullanılabilirlik | — |
| `T-237` | İşveren ilan açma akışı anlaşılır mı | Orta | Kullanılabilirlik | — |
| `T-238` | Uygun işler ekranı yeterince net mi | Yüksek | Kullanılabilirlik | — |
| `T-239` | Başvuru durumu okunabilir mi | Orta | Kullanılabilirlik | — |
| `T-240` | Check-in zamanı kullanıcıya anlaşılır geliyor mu | Kritik | Kullanılabilirlik | — |
| `T-241` | Konum izni isteme akışı ikna edici mi | Kritik | Kullanılabilirlik | — |
| `T-242` | Favoriler ekranı anlaşılır mı | Orta | Kullanılabilirlik | — |
| `T-243` | Jeton mantığı anlaşılır mı | Kritik | Kullanılabilirlik | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md) (`ux-acceptance`)
- Layout → case table: [`../../shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md) §5