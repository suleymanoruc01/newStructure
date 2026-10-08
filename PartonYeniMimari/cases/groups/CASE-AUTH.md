# CASE-AUTH — Kayıt / Giriş / Hesap Yönetimi

**Vaka sayısı:** 15  
**Kaynak grup açıklaması:** Kayıt, giriş, oturum, hesap oluşturma ve hesap güvenliği akışları.

## Gerekli yetenekler
- Süre sonu, yanlış kod ve kilitleme durumlarını kapsayan telefon OTP kaydı/girişi (T-005–T-007)
- E-posta kayıt yolu (T-002) — ürün v1'de olup olmadığını doğrulamalı
- Parolalı hesaplar varsa parola gücü kuralları (T-008); parola sıfırlama güvenliği için CASE-SECURITY T-248'e bakın
- Benzersiz telefon kısıtı (T-003); eksik alan doğrulaması (T-004)
- Kaydı tamamlamak için konum izni GEREKMEMELİ (T-009); işe girişe kadar ertele
- Kayıttan sonra başvurudan önce profil tamamlama eşiği (T-010)
- Şirket alanlarıyla işveren kurumu kaydı (T-011–T-012)
- Benzersiz vergi kimliği / vergi no (T-013)
- Yalnızca yetkili işveren şube oluşturabilir (T-014)
- Şirket doğrulaması tamamlanana kadar iş yayımlamayı engelle (T-015)

## Nest modülleri
`auth`, `users`, `policies`, `employers`, `branches`

## Ekranlar
`m.auth.*`, `w.auth.*`, ilk kurulum sihirbazları

## Kabul odağı
Kritik: T-003, T-005, T-006, T-009, T-014, T-015

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-001` | Geçerli telefon numarası ile kayıt | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-002` | Geçerli e-posta ile kayıt | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-003` | Aynı telefon ile ikinci kez kayıt engeli | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-004` | Eksik alanlarla kayıt denemesi | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-005` | Yanlış SMS doğrulama kodu | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-006` | Süresi geçmiş doğrulama kodu | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-007` | Çok sayıda yanlış kod girişinde bloke | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-008` | Zayıf şifre ile kayıt denemesi | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-009` | Konum izni vermeden kayıt tamamlama | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-010` | Kayıt sonrası profil tamamlama zorunluluğu | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-011` | Geçerli firma bilgileri ile kayıt | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-012` | Eksik firma bilgileri ile kayıt denemesi | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-013` | Aynı vergi numarası ile mükerrer hesap kontrolü | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-014` | Yetkisiz kullanıcının şube açma denemesi | Kritik | Fonksiyonel | İşveren kayıt senaryoları |
| `T-015` | Firma doğrulaması olmadan ilan açma denemesi | Kritik | Fonksiyonel | İşveren kayıt senaryoları |

## İzlenebilirlik
- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)
