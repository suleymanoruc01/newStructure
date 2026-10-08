# CASE-SECURITY — Güvenlik ve Veri Koruma Testleri

**Vaka sayısı:** 9  
**Kaynak grup açıklaması:** Yetkilendirme, veri koruma, hassas veri, erişim denetimi ve güvenlik akışları.

## Gerekli yetenekler
- Nesne düzeyinde yetkilendirme: kullanıcı yalnızca kendi verisini görür (T-244–T-245)
- Kimlik doğrulaması/yetkisi olmayan API istekleri reddedilir (T-246)
- Oturum güvenliği (yenileme jetonu rotasyonu, çıkış) (T-247)
- Parolalar varsa parola sıfırlama güvenliğini güçlendir (T-248)
- Belge URL'leri herkese açık şekilde tahmin edilemez (T-249)
- Konum verisi saklama süresi/veri minimizasyonu (T-250)
- Arayüzde hassas alanları maskele (T-251)
- Günlüklerde sır bulunmaz (T-252)

## Nest modülleri
Koruyucular, imzalı depolama URL'leri, günlüklerde veri ayıklama

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| T-244 | Kullanıcı yalnızca kendi verisini görebiliyor mu | Kritik | Güvenlik | — |
| T-245 | İşveren sadece kendi adaylarını görebiliyor mu | Kritik | Güvenlik | — |
| T-246 | Yetkisiz API erişim testi | Kritik | Güvenlik | — |
| T-247 | Oturum yönetimi güvenliği | Kritik | Güvenlik | — |
| T-248 | Şifre sıfırlama güvenliği | Kritik | Güvenlik | — |
| T-249 | Belge dosyalarının yetkisiz erişime kapalı olması | Kritik | Güvenlik | — |
| T-250 | Konum verisinin güvenli saklanması | Kritik | Güvenlik | — |
| T-251 | Hassas alanların gereksiz gösterilmemesi | Kritik | Güvenlik | — |
| T-252 | Loglarda hassas veri sızıntısı olmaması | Kritik | Güvenlik | — |

## İzlenebilirlik
- Kapsam matrisi: [../00-coverage-matrix.md](../00-coverage-matrix.md)
- Boşluk listesi: [../01-gap-backlog.md](../01-gap-backlog.md)
