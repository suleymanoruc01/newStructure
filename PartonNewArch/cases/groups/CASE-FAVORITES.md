# CASE-FAVORITES — Favori Sistemi

**Cases:** 8  
**Source group description:** Favoriye alma, favoriden çıkarma, listeleme ve favori tutarlılığı akışları.

## Required capabilities
- Employer↔worker favorite either direction (T-164–T-165)
- One-way semantics; optional mutual boost (T-166–T-167)
- Favorites-only job create + visibility (T-168–T-169)
- Favorites UI lists jobs (T-170); unfavorite removes access (T-171)

## Nest modules
`favorites`, `jobs`, `matching`, `notifications`


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-164` | İşverenin işçiyi favoriye alması | Orta | Fonksiyonel | — |
| `T-165` | İşçinin işvereni favoriye alması | Orta | Fonksiyonel | — |
| `T-166` | Tek taraflı favori mantığı | Orta | Fonksiyonel | — |
| `T-167` | Karşılıklı favori davranışı varsa testi | Orta | Fonksiyonel | — |
| `T-168` | Favorilere özel ilan oluşturma | Orta | Fonksiyonel | — |
| `T-169` | Bu ilanın sadece favorilere görünmesi | Orta | Fonksiyonel | — |
| `T-170` | Favoriler ekranında ilan görünmesi | Orta | Fonksiyonel | — |
| `T-171` | Favoriden çıkarınca erişimin kalkması | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)