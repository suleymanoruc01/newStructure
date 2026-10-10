# CASE-EMPLOYER-REVIEW — İşveren Onay / Red Süreci

**Cases:** 10  
**Source group description:** İşverenin başvuru veya işçi sürecini onaylama/red etme akışları.

## Required capabilities
- List + filter applicants (T-089–T-090)
- Accept / reject (T-091–T-092)
- Auto-close when headcount filled (T-093)
- Cannot accept beyond headcount (T-094)
- Notifications on accept/reject (T-096–T-097)
- Cancel previously accepted worker (T-098) with token/shift side effects
- Closing job impacts accepted applicants (T-099)

## Nest modules
`applications`, `jobs`, `notifications`, `tokens`, `shifts`

## Push templates
| Cases | `type` |
| --- | --- |
| T-096, T-103 | `application.rejected` |
| T-097, T-102 | `application.accepted` |
| T-098 | `application.accept_revoked` |
| T-099 | `job.closed_with_accepts` |

Catalog: [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) §0

## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-089` | Başvuranları listeleme | Orta | Fonksiyonel | — |
| `T-090` | Aday filtreleme | Orta | Fonksiyonel | — |
| `T-091` | Aday onaylama | Orta | Fonksiyonel | — |
| `T-092` | Aday reddetme | Orta | Fonksiyonel | — |
| `T-093` | Kontenjan dolunca ilanı kapatma | Orta | Fonksiyonel | — |
| `T-094` | Kontenjan üstü aday onayının engellenmesi | Kritik | Fonksiyonel | — |
| `T-096` | Red bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | — |
| `T-097` | Onay bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | — |
| `T-098` | Onaylı adayı sonradan iptal etme | Orta | Fonksiyonel | — |
| `T-099` | İlanı kapatma sonrası onaylı adayların durumu | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)