# CASE-LOCATION — Konum Doğrulama

**Vaka sayısı:** 13  
**Kaynak grup açıklaması:** Konum izni, konum doğrulama, mesafe ve coğrafi konuma bağlı kontroller.

## Gerekli yetenekler
- Şube koordinatları tek doğruluk kaynağıdır (T-136–T-137)
- Yapılandırılabilir coğrafi çit yarıçapları (50 m / 100 m+) (T-138–T-139)
- Kapalı alan, AVM, yüksek bina, kırsal bölge ve Wi-Fi desteğinde yumuşak başarısızlık / üst incelemeye taşıma (T-140–T-144)
- Hareket hâlindeyken işe giriş işlemi (T-145)
- v1 işe girişinde arka plan konumu gerekmez (T-146)
- iOS/Android eşdeğerlik matrisi (T-147)
- Sahte GPS tespit sinyalleri (T-148)

## Nest modülleri
`location` politika motoru; şube konumu; yarıçaplar için yönetim yapılandırması

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-136` | Şube koordinatı doğruysa doğrulama | Kritik | İş Kuralı | — |
| `T-137` | Şube koordinatı yanlışsa hata yakalama | Kritik | İş Kuralı | — |
| `T-138` | 50 metre yarıçap doğrulaması | Kritik | İş Kuralı | — |
| `T-139` | 100 metre yarıçap doğrulaması | Kritik | İş Kuralı | — |
| `T-140` | Kapalı alanda GPS sapması | Kritik | İş Kuralı | — |
| `T-141` | AVM içinde lokasyon sapması | Kritik | İş Kuralı | — |
| `T-142` | Plaza ve çok katlı yapı senaryosu | Kritik | İş Kuralı | — |
| `T-143` | Kırsal bölgede düşük GPS kalitesi | Kritik | İş Kuralı | — |
| `T-144` | Wi-Fi destekli konum doğrulama | Kritik | İş Kuralı | — |
| `T-145` | Hareket halindeyken check-in | Kritik | İş Kuralı | — |
| `T-146` | Arka planda konum izni yokken davranış | Kritik | İş Kuralı | — |
| `T-147` | iOS ve Android farkları | Kritik | İş Kuralı | — |
| `T-148` | Sahte GPS aracı tespiti | Kritik | İş Kuralı | — |

## İzlenebilirlik
- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)
