# CASE-AVAILABILITY-3H — 3 Saat Kala Gelebilirlik Teyidi

**Cases:** 8  
**Source group description:** İşe başlamadan önce 3 saat kala gelebilirlik teyidi ve ilgili durum değişimleri.

## Required capabilities
- Schedule notify at T-3h (T-114); adapt if job created inside window (T-122)
- Responses: can come / cannot come (T-115–T-116)
- No response policy (T-117) — timeout → employer alert + optional auto-release
- Allow change of mind before cutoff (T-118)
- Employer receives cannot-come (T-119)
- Partial cancellations in multi-headcount jobs (T-121) release seats/tokens per rules

## Nest modules
`shifts`, `notifications`, `applications`, `tokens`


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-114` | İşçiye 3 saat kala bildirim gitmesi | Yüksek | Fonksiyonel | — |
| `T-115` | “Gelebileceğim” seçeneği | Orta | Fonksiyonel | — |
| `T-116` | “Gelemiyorum” seçeneği | Orta | Fonksiyonel | — |
| `T-117` | Hiç yanıt verilmemesi | Orta | Fonksiyonel | — |
| `T-118` | Önce gelebileceğim sonra gelemiyorum seçimi | Orta | Fonksiyonel | — |
| `T-119` | İşverenin gelemiyorum bilgisini alması | Orta | Fonksiyonel | — |
| `T-121` | Birden fazla personelde sadece bazılarının iptal etmesi | Orta | Fonksiyonel | — |
| `T-122` | Son dakika açılan ilanda bu akışın uyarlanması | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)