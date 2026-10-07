# CASE-MATCHING — Eşleşme Motoru

**Cases:** 22  
**Source group description:** İşçi-iş eşleşmesi, uygunluk, filtreleme, sıralama ve öneri mantığı.

## Required capabilities
- Hard filters: day, time, sector, occupation, documents, favorites-only (T-058–T-067, T-075)
- Soft ranking: distance, match score, favorite employer boost, soonest start (T-068, T-076–T-079)
- Multi sector/occupation OR semantics (T-069–T-070)
- Partial vs full time coverage rules (T-071–T-072) — product must define
- Night shift matching (T-073)
- Favorite employer jobs surfaced distinctly (T-074)

## Nest modules
`matching` (pure server), consumes workers/jobs/favorites/location

## Screens
`m.worker.jobs.list` must show match reasons; never client-filter as source of truth


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-058` | Uygun gün eşleşmesi | Yüksek | İş Kuralı | Temel eşleşme testleri |
| `T-059` | Uygun olmayan gün için ilanın gösterilmemesi | Yüksek | İş Kuralı | Temel eşleşme testleri |
| `T-060` | Uygun saat eşleşmesi | Yüksek | İş Kuralı | Temel eşleşme testleri |
| `T-061` | Uygun olmayan saat için ilanın gösterilmemesi | Yüksek | İş Kuralı | Temel eşleşme testleri |
| `T-062` | Sektör uyumlu ilanın görünmesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-063` | Sektör uyumsuz ilanın görünmemesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-064` | Meslek uyumlu ilanın görünmesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-065` | Meslek uyumsuz ilanın görünmemesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-066` | Belgesi olan kullanıcının ilgili ilanı görmesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-067` | Belgesi olmayan kullanıcının ilgili ilanı görmemesi | Orta | İş Kuralı | Temel eşleşme testleri |
| `T-068` | Konum yakınlığına göre sıralama | Kritik | İş Kuralı | Temel eşleşme testleri |
| `T-069` | Çoklu sektör seçen işçiye tüm uygun ilanların görünmesi | Yüksek | İş Kuralı | Karma eşleşme testleri |
| `T-070` | Çoklu meslek seçen işçiye tüm uygun ilanların görünmesi | Yüksek | İş Kuralı | Karma eşleşme testleri |
| `T-071` | Kısmi saat çakışmasında davranış | Orta | İş Kuralı | Karma eşleşme testleri |
| `T-072` | Tam kapsama kuralı testi | Orta | İş Kuralı | Karma eşleşme testleri |
| `T-073` | Gece vardiyası eşleşmesi | Yüksek | İş Kuralı | Karma eşleşme testleri |
| `T-074` | Favori işveren ilanlarının ayrı gösterimi | Orta | İş Kuralı | Karma eşleşme testleri |
| `T-075` | Sadece favorilere açık ilanın diğer işçilere görünmemesi | Orta | İş Kuralı | Karma eşleşme testleri |
| `T-076` | En yakın işin üstte görünmesi | Orta | İş Kuralı | Sıralama testleri |
| `T-077` | En yüksek eşleşme skorunun üstte görünmesi | Yüksek | İş Kuralı | Sıralama testleri |
| `T-078` | Favori işveren ilanının öncelikli görünmesi | Orta | İş Kuralı | Sıralama testleri |
| `T-079` | Tarihi en yakın olan ilanın önceliği | Orta | İş Kuralı | Sıralama testleri |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)