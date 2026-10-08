# CASE-AVAILABILITY-3H — İşe 3 Saat Kala Gelebilirlik Teyidi

**Vaka sayısı:** 8  
**Kaynak grup açıklaması:** İşe başlamadan 3 saat önce gelebilirlik teyidi ve buna bağlı durum değişiklikleri.

## Gerekli yetenekler
- T-3 saatte bildirim zamanla (T-114); iş bu süre aralığında açılmışsa akışı uyarla (T-122)
- Yanıtlar: gelebilirim / gelemem (T-115–T-116)
- Yanıt yok politikası (T-117) — zaman aşımında işverene uyarı + isteğe bağlı otomatik yer serbest bırakma
- Son karar zamanından önce fikrini değiştirmeye izin ver (T-118)
- İşveren gelememe yanıtını alır (T-119)
- Çok kişilik işlerde kısmi iptaller (T-121); kurallara göre yer/jetonları serbest bırak

## Nest modülleri
shifts, notifications, applications, tokens

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| T-114 | İşçiye 3 saat kala bildirim gitmesi | Yüksek | Fonksiyonel | — |
| T-115 | “Gelebileceğim” seçeneği | Orta | Fonksiyonel | — |
| T-116 | “Gelemiyorum” seçeneği | Orta | Fonksiyonel | — |
| T-117 | Hiç yanıt verilmemesi | Orta | Fonksiyonel | — |
| T-118 | Önce gelebileceğim sonra gelemiyorum seçimi | Orta | Fonksiyonel | — |
| T-119 | İşverenin gelemiyorum bilgisini alması | Orta | Fonksiyonel | — |
| T-121 | Birden fazla personelde sadece bazılarının iptal etmesi | Orta | Fonksiyonel | — |
| T-122 | Son dakika açılan ilanda bu akışın uyarlanması | Orta | Fonksiyonel | — |

## İzlenebilirlik
- Kapsam matrisi: [../00-coverage-matrix.md](../00-coverage-matrix.md)
- Boşluk listesi: [../01-gap-backlog.md](../01-gap-backlog.md)
