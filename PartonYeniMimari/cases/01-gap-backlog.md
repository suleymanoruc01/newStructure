# 01 — Boşluk listesi (vaka kataloğundan)

**Durum:** `proposed`  
**Son güncelleme:** 2026-10-07  
**Türetilen kaynak:** `parton_case_tests_tr.json` içindeki 248 vakanın tümü

Aşağıdaki öğeler, ilk PartonYeniMimari taslağında yetersiz tanımlanmış veya eksik bırakılmıştı. Bunların kapatılması mimariyi katalogla uyumlu tutar.

## P0 — beta öncesi kararlaştırılmalı / belgelenmeli

| Boşluk kimliği | Vakalar | Yetenek | Mimari eylem |
| --- | --- | --- | --- |
| `gap-tokens-module` | T-149–T-163, T-203, T-209, T-214, T-220, T-225 | Birinci sınıf jeton kayıt defteri (beklet/tahsil et/serbest bırak) | [`../backend/11-tokens-and-provision.md`](../backend/11-tokens-and-provision.md) ekle; Nest `tokens` modülü |
| `gap-matching-rules-engine` | T-058–T-079 | Sunucuda kesin filtreler + sıralama | [`../backend/12-matching-rules.md`](../backend/12-matching-rules.md) ekle |
| `gap-checkin-dispute` | T-134, T-135, T-210–T-214 | GPS başarısızlığından sonra elle onay + çalışan itirazı | Ekranlar + `shifts`/`moderation` API'leri |
| `gap-favorites-only-job` | T-056–T-057, T-075, T-168–T-171, T-215–T-218 | İş görünürlüğü = favoriler kitlesi | İş işareti + eşleştirme filtresi + arayüz anahtarı |
| `gap-geofence-policy` | T-125–T-127, T-136–T-148 | 50/100 m yarıçap, kapalı alanda tolerans, sahte GPS | [`../backend/13-location-policy.md`](../backend/13-location-policy.md) |
| `gap-firm-verification` | T-013, T-015 | Vergi kimliği benzersizliği; doğrulanana kadar ilanı engelle | `jobs.publish` için `employers.verification_status` eşiği |
| `gap-documents` | T-022–T-024, T-045, T-066–T-067, T-249 | Çalışan belgeleri + işin istediği belgeler + güvenli indirme | `workers/documents` + imzalı URL'ler |
| `gap-profile-demographics` | T-027, T-028, T-044, T-191 | Profilde yaş/cinsiyet; isteğe bağlı iş filtreleri; kötüye kullanım | Alanlar + eşleştirme + doğrulama |

## P1 — ürün karar ayrımları

| Boşluk kimliği | Vakalar | Soru |
| --- | --- | --- |
| `gap-email-auth` | T-002 | v1'de e-posta kaydı olacak mı, yalnızca telefon mu? |
| `gap-password` | T-008, T-248 | Parolalı hesap mı, yalnızca OTP mi? Varsa sıfırlama akışı gerekir |
| `gap-night-shift` | T-019, T-073 | Gece yarısını aşan müsaitlik ve iş zaman aralıkları |
| `gap-3h-no-response` | T-117 | Zaman aşımı politikası: yalnızca uyarı mı, koltuğu otomatik bırakma mı? |
| `gap-application-snapshot` | T-087, T-088 | Başvuru sırasında aday profilini dondur mu, canlı mı tut? |
| `gap-overlap-apply` | T-085, T-181 | Çakışan başvurular/kabuller için yumuşak uyarı mı, kesin engel mi? |
| `gap-payments` | T-161 | Bakiye yükleme sağlayıcısı; başarısız ödeme taslak mı bırakır? |
| `gap-wifi-location` | T-144 | Yardımcı olarak Wi-Fi / ağ konumu kullanılsın mı? |

## P1 — kötüye kullanım ve güvenliği sağlamlaştırma

| Boşluk kimliği | Vakalar | Eylem |
| --- | --- | --- |
| `gap-mock-gps` | T-131, T-148, T-188 | Sahte konum işaretlerini (Android) algıla / risk puanı kullan |
| `gap-device-fingerprint` | T-184 | Kimlik doğrulamada cihaz kimliği özeti; çoklu hesap uyarıları |
| `gap-bot-protection` | T-186 | Başvuruda hız sınırları + CAPTCHA/güvenlik sınaması |
| `gap-ban-reentry` | T-192 | Telefon/vergi/cihaz üzerinden yasaklılar listesi |
| `gap-profanity-filter` | T-176 | Puanlama yorumlarını denetle |
| `gap-attendance-fraud` | T-182, T-183, T-189, T-190 | Risk sayaçları; yönetim kuyruğu |

## P2 — performans / UX kabulü

| Boşluk kimliği | Vakalar | Eylem |
| --- | --- | --- |
| `load-test-plan` | T-226–T-234 | Bildirim dağıtımı, eşleştirme, jeton eşzamanlılığı için ayrı performans planı |
| `ux-acceptance` | T-235–T-243 | P0 ekranları için UX inceleme listesi (metin, zamanlama, jeton açıklaması) |

## Boşluklardan eklenecek yeni ekranlar / modüller

### Nest modülleri (güncelleme)

| Modül | Neden |
| --- | --- |
| `tokens` | Daha önce employers altında varsayılmıştı; katalog için kayıt defteri kritik |
| `documents` (veya `workers` altında) | Yükleme + türü belirlenmiş belgeler |
| `moderation` | İtiraz, kötüye kullanım, yasak, uygunsuz dil — “daha sonra” kapsamından öne al |

### Mobil ekranlar

| Kimlik | Amaç | Vakalar |
| --- | --- | --- |
| `m.worker.documents.list` | Sertifikaları/belgeleri yönet | T-022–T-024 |
| `m.worker.documents.upload` | Tür kontrolüyle yükle | T-023–T-024 |
| `m.worker.shift.dispute` | Başarısız işe girişe itiraz et | T-135, T-212 |
| `m.employer.shift.manual-confirm` | GPS olmadan katılımı onayla | T-134, T-213 |
| `m.auth.email` (isteğe bağlı) | E-posta kaydı | T-002 |
| `m.auth.password` (isteğe bağlı) | Parola belirle/sıfırla | T-008, T-248 |

### Web ekranları

| Kimlik | Amaç | Vakalar |
| --- | --- | --- |
| `w.employer.jobs.create` yalnızca favoriler işareti | — | T-056, T-168 |
| `w.employer.shift.attendance` | Elle onay + itirazlar | T-134–T-135, T-210–T-214 |
| `w.employer.verification` | Şirket doğrulama durumu | T-015 |
| `w.admin.risk.queue` | Çoklu hesap / sahte GPS / işe gelmeme | CASE-ABUSE |

## Bu genişletme turunda kapatılanlar

Yukarıda başvurulan jetonlar, eşleştirme, konum politikası, vaka grupları, kapsam matrisi, E2E yolculukları ve ekran/modül eklemeleri belgelendi. Uygulama çalışmaları hâlâ bekliyor.
