# CASE-PERF — Performans ve Ölçek Testleri

**Cases:** 9  
**Source group description:** Performans, ölçeklenebilirlik, hız, liste, arama ve yük altında davranış kontrolleri.

## Required capabilities
- Fan-out notify at scale (T-226); apply burst (T-227)
- Matching under load (T-228); multi-branch employer lists (T-229)
- Location verify load (T-230); notification queue lag SLOs (T-231)
- Concurrent token ledger safety (T-232)
- Duplicate suppression (T-233); deadlock avoidance (T-234)

## Nest modules
queues, DB indexes, idempotency keys, connection pooling


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-226` | Aynı anda binlerce ilan bildirimi gönderimi | Yüksek | Performans | — |
| `T-227` | Aynı anda binlerce başvuru | Orta | Performans | — |
| `T-228` | Yoğun anda eşleşme motoru performansı | Yüksek | Performans | — |
| `T-229` | Çok şubeli işverenlerde ilan performansı | Orta | Performans | — |
| `T-230` | Konum doğrulama yoğun yük testi | Kritik | Performans | — |
| `T-231` | Bildirim kuyruğu gecikme testi | Yüksek | Performans | — |
| `T-232` | Jeton işlemlerinde eşzamanlılık testi | Kritik | Performans | — |
| `T-233` | Duplicate işlem oluşmaması | Orta | Performans | — |
| `T-234` | Veritabanı kilitlenme testi | Orta | Performans | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)