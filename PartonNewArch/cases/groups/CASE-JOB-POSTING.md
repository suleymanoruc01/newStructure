# CASE-JOB-POSTING — İlan Oluşturma

**Cases:** 19  
**Source group description:** İlan oluşturma, ilan kuralları, ilan yayınlama ve ilan veri doğrulama akışları.

## Required capabilities
- Catalog-backed sector/occupation (T-039–T-040)
- Future dates only; reject past start (T-041–T-042)
- End time after start (T-043); overnight jobs allowed if night rules apply
- Optional gender filter (T-044); required documents (T-045)
- Headcount 1..N (T-046–T-047); overlapping multi-jobs same hours allowed for employer (T-048)
- Token gate + hold on publish (T-049–T-050) — see CASE-TOKEN
- Draft save (T-051); edit after create (T-052)
- Increase/decrease headcount adjusts token holds (T-053–T-054)
- Unpublish/close (T-055)
- Favorites-only visibility mode (T-056–T-057)

## Nest modules
`jobs`, `tokens`, `favorites`, `job-catalog`

## Screens
Create wizard mobile+web; favorites-only toggle on summary step


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-039` | Geçerli sektör ile ilan oluşturma | Orta | Fonksiyonel | — |
| `T-040` | Geçerli meslek ile ilan oluşturma | Orta | Fonksiyonel | — |
| `T-041` | Gelecek tarihli ilan oluşturma | Orta | Fonksiyonel | — |
| `T-042` | Geçmiş tarihli ilan oluşturma denemesi | Orta | Fonksiyonel | — |
| `T-043` | Başlangıç saati bitiş saatinden sonra girilmesi | Orta | Fonksiyonel | — |
| `T-044` | Cinsiyet filtresi ile ilan oluşturma | Orta | Fonksiyonel | — |
| `T-045` | Belge zorunluluğu ekleme | Orta | Fonksiyonel | — |
| `T-046` | Personel sayısı 1 olan ilan | Orta | Fonksiyonel | — |
| `T-047` | Çoklu personel sayılı ilan | Orta | Fonksiyonel | — |
| `T-048` | Aynı saatlerde çakışan çoklu ilan | Orta | Fonksiyonel | — |
| `T-049` | Yetersiz jeton ile ilan açma denemesi | Kritik | Fonksiyonel | — |
| `T-050` | Yeterli jeton ile provizyona alma | Kritik | Fonksiyonel | — |
| `T-051` | İlan taslak kaydetme | Orta | Fonksiyonel | — |
| `T-052` | İlanı sonradan düzenleme | Orta | Fonksiyonel | — |
| `T-053` | Personel sayısını artırma | Orta | Fonksiyonel | — |
| `T-054` | Personel sayısını azaltma | Orta | Fonksiyonel | — |
| `T-055` | İlanı yayından kaldırma | Orta | Fonksiyonel | — |
| `T-056` | İlanı sadece favorilere açma | Orta | Fonksiyonel | — |
| `T-057` | Favorilere özel ilanda uygun aday yoksa davranış | Yüksek | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)