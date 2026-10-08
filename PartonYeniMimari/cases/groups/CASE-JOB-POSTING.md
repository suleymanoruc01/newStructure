# CASE-JOB-POSTING — İlan Oluşturma

**Vaka sayısı:** 19  
**Kaynak grup açıklaması:** İlan oluşturma, ilan kuralları, ilan yayınlama ve ilan verisi doğrulama akışları.

## Gerekli yetenekler
- Kataloğa dayalı sektör/meslek (T-039–T-040)
- Yalnızca gelecek tarihler; geçmiş başlangıcı reddet (T-041–T-042)
- Bitiş saati başlangıçtan sonra olmalı (T-043); gece kuralları uygulanıyorsa geceye sarkan işlere izin ver
- İsteğe bağlı cinsiyet filtresi (T-044); zorunlu belgeler (T-045)
- Çalışan sayısı 1..N (T-046–T-047); işveren aynı saatlerde birden fazla çakışan ilan verebilir (T-048)
- Yayımlamada jeton eşiği + bekletme (T-049–T-050) — CASE-TOKEN'a bakın
- Taslağı kaydet (T-051); oluşturduktan sonra düzenle (T-052)
- Çalışan sayısını artırma/azaltma jeton bekletmelerini günceller (T-053–T-054)
- Yayımdan kaldır / kapat (T-055)
- Yalnızca favorilere görünürlük modu (T-056–T-057)

## Nest modülleri
`jobs`, `tokens`, `favorites`, `job-catalog`

## Ekranlar
Mobil + web ilan oluşturma sihirbazı; özet adımında yalnızca favoriler anahtarı

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
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

## İzlenebilirlik
- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)
