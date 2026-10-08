# CASE-PERF — Performans ve Ölçek Testleri

**Vaka sayısı:** 9  
**Kaynak grup açıklaması:** Performans, ölçeklenebilirlik, hız, listeleme, arama ve yük altındaki davranış kontrolleri.

## Gerekli yetenekler
- Yük altında çok sayıda alıcıya bildirim dağıtımı (T-226); yoğun başvuru akışı (T-227)
- Yük altında eşleştirme (T-228); çok şubeli işveren listeleri (T-229)
- Konum doğrulama yükü (T-230); bildirim kuyruğu gecikme SLO'ları (T-231)
- Eşzamanlı jeton kayıt defteri güvenliği (T-232)
- Yinelenen işlemleri engelleme (T-233); kilitlenmeleri önleme (T-234)

## Nest modülleri
Kuyruklar, veritabanı indeksleri, idempotency anahtarları, bağlantı havuzu

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| T-226 | Aynı anda binlerce ilan bildirimi gönderimi | Yüksek | Performans | — |
| T-227 | Aynı anda binlerce başvuru | Orta | Performans | — |
| T-228 | Yoğun anda eşleşme motoru performansı | Yüksek | Performans | — |
| T-229 | Çok şubeli işverenlerde ilan performansı | Orta | Performans | — |
| T-230 | Konum doğrulama yoğun yük testi | Kritik | Performans | — |
| T-231 | Bildirim kuyruğu gecikme testi | Yüksek | Performans | — |
| T-232 | Jeton işlemlerinde eşzamanlılık testi | Kritik | Performans | — |
| T-233 | Yinelenen işlem oluşmaması | Orta | Performans | — |
| T-234 | Veritabanı kilitlenme testi | Orta | Performans | — |

## İzlenebilirlik
- Kapsam matrisi: [../00-coverage-matrix.md](../00-coverage-matrix.md)
- Boşluk listesi: [../01-gap-backlog.md](../01-gap-backlog.md)
