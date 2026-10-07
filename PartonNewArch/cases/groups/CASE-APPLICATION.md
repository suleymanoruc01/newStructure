# CASE-APPLICATION — Başvuru Süreci

**Cases:** 9  
**Source group description:** Başvuru başlatma, başvuru durumu, iptal, kabul/red ve başvuru görünürlüğü akışları.

## Required capabilities
- Apply to eligible job (T-080)
- Idempotent unique (job, worker) (T-081)
- Block if profile incomplete / job expired / headcount full (T-082–T-084)
- Warn or block overlapping time applications (T-085) — product: block recommended
- Withdraw while pending (T-086)
- Profile change after apply: freeze snapshot vs live — document decision (T-087)
- Job requirements change after apply: revalidate or notify (T-088)

## Nest modules
`applications`, `workers`, `jobs`


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-080` | Uygun ilana başvuru | Yüksek | Fonksiyonel | — |
| `T-081` | Aynı ilana ikinci kez başvurunun engellenmesi | Kritik | Fonksiyonel | — |
| `T-082` | Profil eksikse başvuru engeli | Kritik | Fonksiyonel | — |
| `T-083` | Süresi geçmiş ilana başvuru engeli | Kritik | Fonksiyonel | — |
| `T-084` | Kontenjan dolu ilana başvuru engeli | Kritik | Fonksiyonel | — |
| `T-085` | Aynı saat aralığında çakışan işe ikinci başvuru | Orta | Fonksiyonel | — |
| `T-086` | Başvuru geri çekme | Orta | Fonksiyonel | — |
| `T-087` | Başvuru sonrası profil değişikliği etkisi | Orta | Fonksiyonel | — |
| `T-088` | İlan şartı sonradan değişirse başvuru durumu | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)