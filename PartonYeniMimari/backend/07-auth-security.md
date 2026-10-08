# 07 — Kimlik doğrulama ve güvenlik

**Durum:** proposed  
**Son güncelleme:** 2026-10-07  
**Eski sistem referansı:** Firebase Auth + OTP depoları; CASE-AUTH, CASE-SECURITY, CASE-TOKEN'a bakın

## Hedefler

- Birincil giriş yöntemi telefon OTP'si (CASE-AUTH T-001, T-005–T-007)
- Ürün T-002 / T-008 / T-248 vakalarını korursa isteğe bağlı e-posta/parola yolu (open — DM-4'e bakın)
- Kısa ömürlü erişim JWT'si + sunucuda saklanan ve döndürülen yenileme oturumları (T-247)
- Korumalı her rotada rol ve şube yetkilendirmesi (T-014, T-244–T-246)
- Sunucu tarafında kötüye kullanım / hız sınırlamaları (OTP spam'i, bot başvuruları T-186, çoklu hesap T-184)
- Yasaklılar listesi yeniden kaydı engeller (T-192)
- Kayıt konum izni **olmadan** tamamlanabilmelidir (T-009)

## Kimlik doğrulama akışı (sorunsuz yol)

~~~mermaid
sequenceDiagram
  participant App as RN uygulaması
  participant API as Nest API
  participant SMS as SMS sağlayıcısı
  participant DB as PostgreSQL
  App->>API: POST /api/v1/auth/otp/request { phone }
  API->>DB: otp_challenge oluştur (özetlenmiş kod, süre sonu)
  API->>SMS: kodu gönder
  API-->>App: 202 challengeId
  App->>API: POST /api/v1/auth/otp/verify { challengeId, code }
  API->>DB: doğrula + kullanıcıyı ekle/güncelle
  API->>DB: refresh_session oluştur
  API-->>App: accessToken + refreshToken + user
~~~

## Jetonlar

| Jeton | Yaşam süresi (öneri) | Depolama |
| --- | --- | --- |
| Erişim JWT'si | 15–30 dakika | Bellek / güvenli depo |
| Yenileme | Günler, döndürülür | Güvenli depo; veritabanında özeti |

Asgari JWT iddiaları:

~~~json
{
  "sub": "<userId>",
  "role": "worker|employer|manager|admin",
  "sid": "<sessionId>",
  "branchIds": ["…"]
}
~~~

Daha güncel yetkilendirme için branchIds çıkarılıp koruyucu tarafından veritabanından yüklenebilir (open).

## Nest yapı taşları

| Bileşen | Rol |
| --- | --- |
| Passport / özel JWT stratejisi | Erişim jetonunu doğrula |
| AuthGuard | Varsayılan kimlik doğrulama |
| RolesGuard | Rol denetimi |
| BranchScopeGuard | Yönetici/işveren kaynak kapsamı |
| Throttler | OTP + giriş uç noktaları |

## Yetkilendirme modeli

1. **Kimlik doğrulama** — geçerli erişim jetonu
2. **Rol** — uç nokta izin verilen rol kümesini kabul eder
3. **Kaynak kapsamı** — kullanıcı bu iş/şube/başvuruda işlem yapabilir
4. **Durum makinesi** — geçişe izin veriliyor (ör. başvuruyu kabul etme)

Güvenlik için istemcide “gizlenmiş” ekranlara asla güvenmeyin.

## Sırlar ve kişisel veriler

- OTP kodları özetlenmiş saklanır; açık metin yalnızca SMS'te bulunur
- Yenileme jetonları saklanırken özetlenir
- Telefon numaraları standartlaştırılır (E.164)
- Hassas eylemleri denetim kaydına alın: giriş, rol değişimi, işe giriş geçersiz kılma

## Güvenlik kontrol listesi (CASE-SECURITY eşlemesi)

- [ ] Yalnızca HTTPS
- [ ] OTP isteme/doğrulama hız sınırı
- [ ] Doğrulama başarısızlıklarında kilitleme / artan bekleme süresi
- [ ] İstemcilere yığın izleri gönderilmez
- [ ] Yalnızca parametreli SQL (ORM)
- [ ] Dosya yükleme türü/boyut sınırları (medya eklendiğinde)
- [ ] CI'da bağımlılık taraması
- [ ] Veritabanı rolünde en düşük ayrıcalık ilkesi

## Firebase Auth'tan farklar

| Firebase | Nest |
| --- | --- |
| Firebase ID jetonu | Kendi JWT'miz |
| Firestore güvenlik kuralları | Nest koruyucuları + SQL kısıtları |
| İstemci dinleyicisine güven | Açık API okumaları |
| Firestore'da FCM jetonu | API üzerinden device_push_tokens tablosu |

## Katalogdan türetilen kimlik doğrulama kuralları

| Kural | Vakalar |
| --- | --- |
| Benzersiz telefon | T-003 |
| Yanlış / süresi dolmuş OTP reddedilir; N denemeden sonra kilitlenir | T-005–T-007 |
| Eksik alanlar reddedilir | T-004 |
| İşveren vergi kimliği benzersiz | T-013 |
| Doğrulanmamış şirket iş yayımlayamaz | T-015 |
| Parola etkinse parola gücü | T-008 |
| Etkinse parola sıfırlama güvenliği | T-248 |
| Oturumdan çıkış / jeton rotasyonu | T-247 |
| Günlüklerde hassas veri bulunmaz | T-252 |

## Açık sorular

| Kimlik | Soru |
| --- | --- |
| AS-1 | SMS sağlayıcısı (Twilio, Netgsm vb.) |
| AS-2 | Cihaza bağlama / yenileme jetonunun yeniden kullanımını tespit etme (T-184) |
| AS-3 | Çok rollü kullanıcılar: tek hesap mı, ayrı girişler mi? |
| AS-4 | v1'de e-posta + parola olacak mı? |
