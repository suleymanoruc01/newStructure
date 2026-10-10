# CASE-RATINGS — Değerlendirme ve Puanlama

**Cases:** 9  
**Source group description:** Değerlendirme, puanlama, yorum, görünürlük ve puan güvenilirliği akışları.

## Required capabilities
- Schedule rating notify +24h after completion (T-172)
- Bidirectional rating + comment (T-173–T-175)
- Profanity/abuse filter (T-176)
- One rating per shift/pair (T-177)
- Rules for no-show and cancelled jobs (T-178–T-179)
- Correct average aggregation (T-180)

## Nest modules
`ratings`, `notifications`, `moderation` (text filter)

## Push templates
| Cases | `type` |
| --- | --- |
| T-172 (= T-106) | `rating.pending` |

Catalog: [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md)

## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-172` | 24 saat sonra değerlendirme bildirimi | Yüksek | Fonksiyonel | — |
| `T-173` | İşçinin işvereni puanlaması | Orta | Fonksiyonel | — |
| `T-174` | İşverenin işçiyi puanlaması | Orta | Fonksiyonel | — |
| `T-175` | Yorum bırakma | Orta | Fonksiyonel | — |
| `T-176` | Hakaret içerikli yorum filtresi | Orta | Fonksiyonel | — |
| `T-177` | Aynı iş için tekrar puan verememe | Orta | Fonksiyonel | — |
| `T-178` | İşe gelmeyen kullanıcı için değerlendirme kuralı | Orta | Fonksiyonel | — |
| `T-179` | İptal edilen işte değerlendirme tetiklenmesi | Orta | Fonksiyonel | — |
| `T-180` | Puan ortalamasının doğru hesaplanması | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)