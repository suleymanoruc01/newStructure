# CASE-EMPLOYER-BRANCH — İşveren Profil ve Şube Yönetimi

**Cases:** 8  
**Source group description:** İşveren profili, firma bilgileri, şube ve işveren hesap yönetimi akışları.

## Required capabilities
- Create branch; multi-branch per employer (T-031–T-032)
- Persist accurate coordinates (T-033); reject invalid coords (T-036)
- Updating branch updates related open jobs display/geo (T-034)
- Deactivating branch closes or freezes its jobs (T-035) — confirm product rule
- Soft-delete / archive: historical jobs visibility (T-038)
- Employer only sees own branches (T-037)

## Nest modules
`employers`, `branches`, `jobs`, `location`

## Screens
`m.employer.branches.*`, `w.employer.branches.*`, `w.employer.team.list`


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-031` | Yeni şube ekleme | Orta | Fonksiyonel | — |
| `T-032` | Aynı işverene çoklu şube ekleme | Orta | Fonksiyonel | — |
| `T-033` | Şube konumunun doğru kaydedilmesi | Kritik | Fonksiyonel | — |
| `T-034` | Şube güncelleme sonrası ilan ilişkisi | Orta | Fonksiyonel | — |
| `T-035` | Pasife alınan şubedeki ilanların durumu | Orta | Fonksiyonel | — |
| `T-036` | Yanlış koordinat ile şube oluşturma | Orta | Fonksiyonel | — |
| `T-037` | Sadece kendi şubelerini görüntüleme yetkisi | Orta | Fonksiyonel | — |
| `T-038` | Şube silme sonrası geçmiş ilan görünürlüğü | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)