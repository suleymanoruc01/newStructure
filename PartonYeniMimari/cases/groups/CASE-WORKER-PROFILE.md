# CASE-WORKER-PROFILE — İşçi Profil Yönetimi

**Vaka sayısı:** 15  
**Kaynak grup açıklaması:** İşçi profil verisi, deneyim, yetkinlik, belge ve profil tamamlama akışları.

## Gerekli yetenekler
- Müsait olunan günleri kaydet (T-016)
- Gün başına birden fazla saat aralığı (T-017); çakışmaları reddet (T-018)
- Gece vardiyası müsaitlik işareti / gece yarısını aşan aralıklar (T-019)
- Birden fazla sektör + meslek seçimi (T-020–T-021)
- Belge türü seçimi + dosya yükleme doğrulaması (T-022–T-024)
- Çalışanın ev konumu işaretinin doğruluğu (T-025)
- Profil güncellemesi eşleştirmenin yeniden hesaplanmasını tetikler (T-026)
- Yaş ve cinsiyet değişikliği iş görünürlüğünü/eşleşmeyi etkiler (T-027–T-028)
- Eksik profil başvuruyu engeller (T-029)
- Profil silinince/devre dışı bırakılınca etkin başvuruların durumu (T-030)

## Nest modülleri
`workers`, `matching`, belgeler için nesne depolama

## Ekranlar
`m.worker.onboarding.profile`, `m.worker.profile.*`, `m.worker.availability.edit`, **yeni** `m.worker.documents.*`

## Kabul odağı
Kritik: T-018, T-025, T-029


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-016` | Uygun gün seçiminin doğru kaydedilmesi | Yüksek | Fonksiyonel | — |
| `T-017` | Gün içinde birden fazla saat aralığı ekleme | Orta | Fonksiyonel | — |
| `T-018` | Çakışan saat aralıklarını engelleme | Kritik | Fonksiyonel | — |
| `T-019` | Gece vardiyası uygunluğu tanımlama | Yüksek | Fonksiyonel | — |
| `T-020` | Çoklu sektör seçimi | Orta | Fonksiyonel | — |
| `T-021` | Çoklu meslek seçimi | Orta | Fonksiyonel | — |
| `T-022` | Belge seçimi doğru kaydediliyor mu | Orta | Fonksiyonel | — |
| `T-023` | Belge yükleme varsa dosya tipi kontrolü | Orta | Fonksiyonel | — |
| `T-024` | Geçersiz belge yükleme | Orta | Fonksiyonel | — |
| `T-025` | Konum pinleme doğruluğu | Kritik | Fonksiyonel | — |
| `T-026` | Profil güncelleme sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | — |
| `T-027` | Yaş değişikliği sonrası ilan görünürlüğü değişiyor mu | Orta | Fonksiyonel | — |
| `T-028` | Cinsiyet değişikliği sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | — |
| `T-029` | Eksik profille başvuru engeli | Kritik | Fonksiyonel | — |
| `T-030` | Profil silinince aktif başvuruların durumu | Orta | Fonksiyonel | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)