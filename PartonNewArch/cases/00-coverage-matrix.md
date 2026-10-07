# Case coverage matrix

**Source:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json)  
**Status:** `proposed`  
**Last updated:** 2026-10-07  

Maps all **248** Parton cases to Nest modules and UI surfaces. Missing catalog IDs (not in source): `T-095`, `T-120`, `T-208`, `T-224`.

## Legend

| Arch status | Meaning |
| --- | --- |
| `covered` | Explicitly designed in PartonNewArch |
| `partial` | Mentioned; needs stronger rules/screens |
| `gap` | Catalog requires capability not yet spelled out |

## Group summary

| Group | Cases | Primary channel | Nest modules | Group rules doc |
| --- | ---: | --- | --- | --- |
| `CASE-AUTH` | 15 | mobile+web | `auth`, `users`, `policies`, `employers`, `branches` | [groups/CASE-AUTH.md](groups/CASE-AUTH.md) |
| `CASE-WORKER-PROFILE` | 15 | mobile | `workers`, `matching`, `applications` | [groups/CASE-WORKER-PROFILE.md](groups/CASE-WORKER-PROFILE.md) |
| `CASE-EMPLOYER-BRANCH` | 8 | mobile+web | `employers`, `branches` | [groups/CASE-EMPLOYER-BRANCH.md](groups/CASE-EMPLOYER-BRANCH.md) |
| `CASE-JOB-POSTING` | 19 | web+mobile | `jobs`, `tokens`, `favorites` | [groups/CASE-JOB-POSTING.md](groups/CASE-JOB-POSTING.md) |
| `CASE-MATCHING` | 22 | backend+mobile | `matching`, `jobs`, `workers`, `favorites`, `location` | [groups/CASE-MATCHING.md](groups/CASE-MATCHING.md) |
| `CASE-APPLICATION` | 9 | mobile | `applications`, `workers`, `jobs` | [groups/CASE-APPLICATION.md](groups/CASE-APPLICATION.md) |
| `CASE-EMPLOYER-REVIEW` | 10 | web+mobile | `applications`, `jobs`, `notifications` | [groups/CASE-EMPLOYER-REVIEW.md](groups/CASE-EMPLOYER-REVIEW.md) |
| `CASE-NOTIFICATIONS` | 14 | mobile+backend | `notifications` | [groups/CASE-NOTIFICATIONS.md](groups/CASE-NOTIFICATIONS.md) |
| `CASE-AVAILABILITY-3H` | 8 | mobile+backend | `shifts`, `notifications`, `applications`, `tokens` | [groups/CASE-AVAILABILITY-3H.md](groups/CASE-AVAILABILITY-3H.md) |
| `CASE-CHECKIN` | 13 | mobile | `shifts`, `location`, `notifications`, `tokens`, `moderation` | [groups/CASE-CHECKIN.md](groups/CASE-CHECKIN.md) |
| `CASE-LOCATION` | 13 | mobile+backend | `location`, `shifts`, `branches` | [groups/CASE-LOCATION.md](groups/CASE-LOCATION.md) |
| `CASE-TOKEN` | 15 | backend+web | `tokens`, `jobs`, `shifts`, `applications` | [groups/CASE-TOKEN.md](groups/CASE-TOKEN.md) |
| `CASE-FAVORITES` | 8 | mobile+web | `favorites`, `jobs`, `matching`, `notifications` | [groups/CASE-FAVORITES.md](groups/CASE-FAVORITES.md) |
| `CASE-RATINGS` | 9 | mobile+web | `ratings`, `notifications`, `shifts` | [groups/CASE-RATINGS.md](groups/CASE-RATINGS.md) |
| `CASE-ABUSE` | 12 | backend+admin | `moderation`, `auth`, `shifts`, `location`, `ratings`, `tokens` | [groups/CASE-ABUSE.md](groups/CASE-ABUSE.md) |
| `CASE-E2E` | 31 | all | `*` | [groups/CASE-E2E.md](groups/CASE-E2E.md) |
| `CASE-PERF` | 9 | backend | `matching`, `notifications`, `applications`, `tokens`, `location` | [groups/CASE-PERF.md](groups/CASE-PERF.md) |
| `CASE-UX` | 9 | mobile+web | `*` | [groups/CASE-UX.md](groups/CASE-UX.md) |
| `CASE-SECURITY` | 9 | backend | `auth`, `users`, `policies`, `workers` | [groups/CASE-SECURITY.md](groups/CASE-SECURITY.md) |

## Full case map

### CASE-AUTH — Kayıt / Giriş / Hesap Yönetimi

Kayıt, giriş, oturum, hesap oluşturma ve hesap güvenliği akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-001` | Geçerli telefon numarası ile kayıt | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-002` | Geçerli e-posta ile kayıt | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `gap` | gap-email-auth |
| `T-003` | Aynı telefon ile ikinci kez kayıt engeli | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-004` | Eksik alanlarla kayıt denemesi | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-005` | Yanlış SMS doğrulama kodu | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-006` | Süresi geçmiş doğrulama kodu | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-007` | Çok sayıda yanlış kod girişinde bloke | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-008` | Zayıf şifre ile kayıt denemesi | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `gap` | gap-password |
| `T-009` | Konum izni vermeden kayıt tamamlama | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-010` | Kayıt sonrası profil tamamlama zorunluluğu | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-011` | Geçerli firma bilgileri ile kayıt | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-012` | Eksik firma bilgileri ile kayıt denemesi | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-013` | Aynı vergi numarası ile mükerrer hesap kontrolü | Orta | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `gap` | gap-tax-verification |
| `T-014` | Yetkisiz kullanıcının şube açma denemesi | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |
| `T-015` | Firma doğrulaması olmadan ilan açma denemesi | Kritik | Fonksiyonel | auth, users, policies, employers | m.auth.*, m.worker.onboarding.*, m.employer.onboarding.* | `covered` |  |

### CASE-WORKER-PROFILE — İşçi Profil Yönetimi

İşçi profil verisi, deneyim, yetkinlik, belge ve profil tamamlama akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-016` | Uygun gün seçiminin doğru kaydedilmesi | Yüksek | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-017` | Gün içinde birden fazla saat aralığı ekleme | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-018` | Çakışan saat aralıklarını engelleme | Kritik | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-019` | Gece vardiyası uygunluğu tanımlama | Yüksek | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-night-shift |
| `T-020` | Çoklu sektör seçimi | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-021` | Çoklu meslek seçimi | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-022` | Belge seçimi doğru kaydediliyor mu | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-documents |
| `T-023` | Belge yükleme varsa dosya tipi kontrolü | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-documents |
| `T-024` | Geçersiz belge yükleme | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-documents |
| `T-025` | Konum pinleme doğruluğu | Kritik | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-026` | Profil güncelleme sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-027` | Yaş değişikliği sonrası ilan görünürlüğü değişiyor mu | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-age-filter |
| `T-028` | Cinsiyet değişikliği sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `gap` | gap-gender-filter |
| `T-029` | Eksik profille başvuru engeli | Kritik | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |
| `T-030` | Profil silinince aktif başvuruların durumu | Orta | Fonksiyonel | workers, matching, applications | m.worker.profile.*, m.worker.availability.edit, m.worker.onboarding.profile | `covered` |  |

### CASE-EMPLOYER-BRANCH — İşveren Profil ve Şube Yönetimi

İşveren profili, firma bilgileri, şube ve işveren hesap yönetimi akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-031` | Yeni şube ekleme | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-032` | Aynı işverene çoklu şube ekleme | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-033` | Şube konumunun doğru kaydedilmesi | Kritik | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-034` | Şube güncelleme sonrası ilan ilişkisi | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-035` | Pasife alınan şubedeki ilanların durumu | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-036` | Yanlış koordinat ile şube oluşturma | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-037` | Sadece kendi şubelerini görüntüleme yetkisi | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |
| `T-038` | Şube silme sonrası geçmiş ilan görünürlüğü | Orta | Fonksiyonel | employers, branches | m.employer.branches.*, m.employer.business.*, w.employer.branches.* | `covered` |  |

### CASE-JOB-POSTING — İlan Oluşturma

İlan oluşturma, ilan kuralları, ilan yayınlama ve ilan veri doğrulama akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-039` | Geçerli sektör ile ilan oluşturma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-040` | Geçerli meslek ile ilan oluşturma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-041` | Gelecek tarihli ilan oluşturma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-042` | Geçmiş tarihli ilan oluşturma denemesi | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-043` | Başlangıç saati bitiş saatinden sonra girilmesi | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-044` | Cinsiyet filtresi ile ilan oluşturma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `gap` | gap-gender-filter |
| `T-045` | Belge zorunluluğu ekleme | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `gap` | gap-documents |
| `T-046` | Personel sayısı 1 olan ilan | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-047` | Çoklu personel sayılı ilan | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-048` | Aynı saatlerde çakışan çoklu ilan | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-049` | Yetersiz jeton ile ilan açma denemesi | Kritik | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-050` | Yeterli jeton ile provizyona alma | Kritik | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-051` | İlan taslak kaydetme | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-052` | İlanı sonradan düzenleme | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-053` | Personel sayısını artırma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-054` | Personel sayısını azaltma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-055` | İlanı yayından kaldırma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `covered` |  |
| `T-056` | İlanı sadece favorilere açma | Orta | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `gap` | gap-favorites-only-job |
| `T-057` | Favorilere özel ilanda uygun aday yoksa davranış | Yüksek | Fonksiyonel | jobs, tokens, favorites | m.employer.jobs.*, w.employer.jobs.* | `gap` | gap-favorites-only-job |

### CASE-MATCHING — Eşleşme Motoru

İşçi-iş eşleşmesi, uygunluk, filtreleme, sıralama ve öneri mantığı.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-058` | Uygun gün eşleşmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-059` | Uygun olmayan gün için ilanın gösterilmemesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-060` | Uygun saat eşleşmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-061` | Uygun olmayan saat için ilanın gösterilmemesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-062` | Sektör uyumlu ilanın görünmesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-063` | Sektör uyumsuz ilanın görünmemesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-064` | Meslek uyumlu ilanın görünmesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-065` | Meslek uyumsuz ilanın görünmemesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-066` | Belgesi olan kullanıcının ilgili ilanı görmesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `gap` | gap-documents |
| `T-067` | Belgesi olmayan kullanıcının ilgili ilanı görmemesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `gap` | gap-documents |
| `T-068` | Konum yakınlığına göre sıralama | Kritik | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-069` | Çoklu sektör seçen işçiye tüm uygun ilanların görünmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-070` | Çoklu meslek seçen işçiye tüm uygun ilanların görünmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-071` | Kısmi saat çakışmasında davranış | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-072` | Tam kapsama kuralı testi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-073` | Gece vardiyası eşleşmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `gap` | gap-night-shift |
| `T-074` | Favori işveren ilanlarının ayrı gösterimi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-075` | Sadece favorilere açık ilanın diğer işçilere görünmemesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `gap` | gap-favorites-only-job |
| `T-076` | En yakın işin üstte görünmesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-077` | En yüksek eşleşme skorunun üstte görünmesi | Yüksek | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-078` | Favori işveren ilanının öncelikli görünmesi | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |
| `T-079` | Tarihi en yakın olan ilanın önceliği | Orta | İş Kuralı | matching, jobs, workers, favorites | m.worker.jobs.list, m.worker.jobs.detail | `partial` | matching-rules-engine |

### CASE-APPLICATION — Başvuru Süreci

Başvuru başlatma, başvuru durumu, iptal, kabul/red ve başvuru görünürlüğü akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-080` | Uygun ilana başvuru | Yüksek | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-081` | Aynı ilana ikinci kez başvurunun engellenmesi | Kritik | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-082` | Profil eksikse başvuru engeli | Kritik | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-083` | Süresi geçmiş ilana başvuru engeli | Kritik | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-084` | Kontenjan dolu ilana başvuru engeli | Kritik | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-085` | Aynı saat aralığında çakışan işe ikinci başvuru | Orta | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-086` | Başvuru geri çekme | Orta | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-087` | Başvuru sonrası profil değişikliği etkisi | Orta | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |
| `T-088` | İlan şartı sonradan değişirse başvuru durumu | Orta | Fonksiyonel | applications, workers, jobs | m.worker.jobs.apply-confirm, m.worker.applications.list, m.shared.job-process.detail | `covered` |  |

### CASE-EMPLOYER-REVIEW — İşveren Onay / Red Süreci

İşverenin başvuru veya işçi sürecini onaylama/red etme akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-089` | Başvuranları listeleme | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-090` | Aday filtreleme | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-091` | Aday onaylama | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-092` | Aday reddetme | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-093` | Kontenjan dolunca ilanı kapatma | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-094` | Kontenjan üstü aday onayının engellenmesi | Kritik | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-096` | Red bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-097` | Onay bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-098` | Onaylı adayı sonradan iptal etme | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |
| `T-099` | İlanı kapatma sonrası onaylı adayların durumu | Orta | Fonksiyonel | applications, jobs, notifications | m.employer.applicants.*, w.employer.applicants.*, m.manager.applicants.list | `covered` |  |

### CASE-NOTIFICATIONS — Bildirim Sistemi

Push/in-app bildirimler, tokenlar, bildirim tetikleri ve bildirim durumları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-100` | Yeni uygun ilan bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-101` | Başvuru alındı bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-102` | Onay bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-103` | Red bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-104` | 3 saat kala check-in bildirimi | Kritik | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-105` | 10 dakika kala işe geldim bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-106` | 24 saat sonra değerlendirme bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-107` | Favori işveren ilan bildirimi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-108` | Sadece favorilere özel bildirim | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `gap` | gap-favorites-only-job |
| `T-109` | Bildirim tıklanınca doğru ekrana yönlendirme | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-110` | Çift bildirim oluşmaması | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-111` | Push kapalıysa uygulama içi bildirim | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-112` | Gecikmeli bildirim senaryosu | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |
| `T-113` | Yanlış kullanıcıya bildirim gitmemesi | Yüksek | Fonksiyonel | notifications | m.shared.notifications.*, w.employer.notifications | `covered` |  |

### CASE-AVAILABILITY-3H — 3 Saat Kala Gelebilirlik Teyidi

İşe başlamadan önce 3 saat kala gelebilirlik teyidi ve ilgili durum değişimleri.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-114` | İşçiye 3 saat kala bildirim gitmesi | Yüksek | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-115` | “Gelebileceğim” seçeneği | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-116` | “Gelemiyorum” seçeneği | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-117` | Hiç yanıt verilmemesi | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-118` | Önce gelebileceğim sonra gelemiyorum seçimi | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-119` | İşverenin gelemiyorum bilgisini alması | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-121` | Birden fazla personelde sadece bazılarının iptal etmesi | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |
| `T-122` | Son dakika açılan ilanda bu akışın uyarlanması | Orta | Fonksiyonel | shifts, notifications, applications, tokens | m.worker.shift.availability-confirm | `covered` |  |

### CASE-CHECKIN — İşe Geldim Teyidi ve Check-in

İşe geldim teyidi, check-in, zaman ve konum bağımlı iş akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-123` | 10 dakika kala bildirim gitmesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-124` | İşçinin “işe geldim” seçmesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-125` | Uygun konumdaysa doğrulama başarılı olması | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-126` | Uygun konumda değilse reddedilmesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-127` | GPS sapmasında tolerans testi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-128` | Düşük internetle tekrar deneme | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-129` | Erken check-in denemesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-130` | Geç check-in denemesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-131` | Sahte konumla check-in denemesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `gap` | gap-mock-gps |
| `T-132` | Konum izni kapalıyken check-in denemesi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-133` | İşverenin işçi geldi bildirimi alması | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `covered` |  |
| `T-134` | Manuel doğrulama akışı varsa testi | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `gap` | gap-checkin-dispute |
| `T-135` | Hatalı reddedilmiş check-in için itiraz süreci | Kritik | Uçtan Uca | shifts, location, notifications, tokens | m.worker.shift.check-in, m.worker.shift.in-shift, m.worker.shift.dispute | `gap` | gap-checkin-dispute |

### CASE-LOCATION — Konum Doğrulama

Konum izni, konum doğrulama, mesafe ve geo bağımlı kontroller.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-136` | Şube koordinatı doğruysa doğrulama | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-137` | Şube koordinatı yanlışsa hata yakalama | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-138` | 50 metre yarıçap doğrulaması | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-139` | 100 metre yarıçap doğrulaması | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-140` | Kapalı alanda GPS sapması | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-141` | AVM içinde lokasyon sapması | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-142` | Plaza ve çok katlı yapı senaryosu | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-143` | Kırsal bölgede düşük GPS kalitesi | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-144` | Wi-Fi destekli konum doğrulama | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `gap` | gap-wifi-location |
| `T-145` | Hareket halindeyken check-in | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-146` | Arka planda konum izni yokken davranış | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-147` | iOS ve Android farkları | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `partial` | geofence-policy |
| `T-148` | Sahte GPS aracı tespiti | Kritik | İş Kuralı | location, shifts, branches | m.worker.shift.check-in, m.employer.branches.form, w.employer.branches.form | `gap` | gap-mock-gps |

### CASE-TOKEN — Jeton / Provizyon

Jeton, provizyon, bakiye, kullanım, iade ve işlem güvenliği akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-149` | Yeterli jeton ile ilan açılması | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-150` | Yetersiz jetonla ilan açamama | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-151` | Personel sayısı kadar jeton bloklama | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-152` | İlan iptalinde jeton iadesi | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-153` | Hiç başvuru gelmeyen ilanda jeton durumu | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-154` | Başvuru var ama onay yoksa jeton durumu | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-155` | Onay var ama işçi gelmediyse jeton durumu | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-156` | İşçi geldiğinde jetonun kesinleşmesi | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-157` | Çok kişili ilanda kısmi gelişte kısmi jeton düşüşü | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-158` | Personel sayısı artırıldığında ek provizyon | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-159` | Personel sayısı azaltıldığında iade | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-160` | Ağ hatasında çift jeton düşüşü engeli | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-161` | Başarısız ödeme sonrası ilanın durumu | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `gap` | gap-payments |
| `T-162` | Jeton hareket geçmişi raporlama | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |
| `T-163` | Anlık bakiye güncelleme | Kritik | İş Kuralı | tokens, jobs, shifts, applications | m.employer.tokens.root, w.employer.tokens.* | `partial` | tokens-module |

### CASE-FAVORITES — Favori Sistemi

Favoriye alma, favoriden çıkarma, listeleme ve favori tutarlılığı akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-164` | İşverenin işçiyi favoriye alması | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |
| `T-165` | İşçinin işvereni favoriye alması | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |
| `T-166` | Tek taraflı favori mantığı | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |
| `T-167` | Karşılıklı favori davranışı varsa testi | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |
| `T-168` | Favorilere özel ilan oluşturma | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `gap` | gap-favorites-only-job |
| `T-169` | Bu ilanın sadece favorilere görünmesi | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `gap` | gap-favorites-only-job |
| `T-170` | Favoriler ekranında ilan görünmesi | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |
| `T-171` | Favoriden çıkarınca erişimin kalkması | Orta | Fonksiyonel | favorites, jobs, matching, notifications | m.worker.favorites.list, m.employer.favorites.workers, w.employer.favorites.workers | `covered` |  |

### CASE-RATINGS — Değerlendirme ve Puanlama

Değerlendirme, puanlama, yorum, görünürlük ve puan güvenilirliği akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-172` | 24 saat sonra değerlendirme bildirimi | Yüksek | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-173` | İşçinin işvereni puanlaması | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-174` | İşverenin işçiyi puanlaması | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-175` | Yorum bırakma | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-176` | Hakaret içerikli yorum filtresi | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `gap` | gap-profanity-filter |
| `T-177` | Aynı iş için tekrar puan verememe | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-178` | İşe gelmeyen kullanıcı için değerlendirme kuralı | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-179` | İptal edilen işte değerlendirme tetiklenmesi | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |
| `T-180` | Puan ortalamasının doğru hesaplanması | Orta | Fonksiyonel | ratings, notifications, shifts | m.shared.ratings.*, w.employer.ratings.pending | `covered` |  |

### CASE-ABUSE — Negatif ve Suistimal Testleri

Kötüye kullanım, negatif senaryolar, hile, tekrarlı işlem ve sınır ihlali kontrolleri.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-181` | Aynı saat diliminde iki işe onay alma | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-182` | Sürekli “geleceğim” deyip gelmeyen işçi | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-183` | Sürekli son dakika iptal eden işveren | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-184` | Aynı cihazdan çoklu sahte hesap | Kritik | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `gap` | gap-device-fingerprint |
| `T-185` | Sahte ilan açma girişimi | Kritik | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-186` | Bot başvuru denemeleri | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `gap` | gap-bot-protection |
| `T-187` | Puan manipülasyonu | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-188` | Sahte konumla jeton düşürme denemesi | Kritik | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `gap` | gap-mock-gps |
| `T-189` | İşverenin gelen işçiyi gelmedi göstermesi | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-190` | İşçinin gelmediği halde geldi göstermesi | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `covered` |  |
| `T-191` | Yaş sınırını yanlış beyan etme | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `gap` | gap-age-filter |
| `T-192` | Yasaklı kullanıcının tekrar kayıt denemesi | Orta | Negatif | moderation, auth, shifts, location | m.shared.abuse.report, m.shared.system.restriction, w.admin.abuse.* | `gap` | gap-ban-reentry |

### CASE-E2E — Uçtan Uca Senaryolar

Birden fazla modülü kapsayan tam kullanıcı yolculukları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-193` | İşçi kayıt olur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-194` | İşveren kayıt olur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-195` | Şube oluşturulur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-196` | İlan oluşturulur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-197` | İlan uygun işçiye gösterilir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-198` | İşçi başvurur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-199` | İşveren onaylar | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-200` | İşçi gelebileceğini bildirir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-201` | İşçi işe gelir ve check-in yapar | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-202` | Konum doğrulanır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-203` | Jeton kesinleşir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-204` | Değerlendirme yapılır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-205` | İşçi onay alır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-206` | 3 saat kala gelemiyorum der | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-207` | İşveren bilgilendirilir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-209` | Jeton durumu doğru yönetilir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-210` | İşçi fiziksel olarak gelir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-211` | GPS doğrulaması başarısız olur | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-212` | Manuel itiraz açılır | Kritik | Uçtan Uca | * | multi | `gap` | gap-checkin-dispute |
| `T-213` | İşveren doğrular | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-214` | Jeton kararı doğru uygulanır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-215` | İşveren işçiyi favoriye alır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-216` | Yeni ilanı sadece favorilere açar | Kritik | Uçtan Uca | * | multi | `gap` | gap-favorites-only-job |
| `T-217` | İlgili işçi ilanı görür | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-218` | Başvuru ve onay tamamlanır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-219` | İşveren 5 kişilik ilan açar | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-220` | 5 jeton provizyona alınır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-221` | Başvurular gelir | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-222` | 5 kişi onaylanır | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-223` | 1 kişi iptal eder | Kritik | Uçtan Uca | * | multi | `covered` |  |
| `T-225` | Gelen kişiler kadar jeton kesinleşir | Kritik | Uçtan Uca | * | multi | `covered` |  |

### CASE-PERF — Performans ve Ölçek Testleri

Performans, ölçeklenebilirlik, hız, liste, arama ve yük altında davranış kontrolleri.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-226` | Aynı anda binlerce ilan bildirimi gönderimi | Yüksek | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-227` | Aynı anda binlerce başvuru | Orta | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-228` | Yoğun anda eşleşme motoru performansı | Yüksek | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-229` | Çok şubeli işverenlerde ilan performansı | Orta | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-230` | Konum doğrulama yoğun yük testi | Kritik | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-231` | Bildirim kuyruğu gecikme testi | Yüksek | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-232` | Jeton işlemlerinde eşzamanlılık testi | Kritik | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-233` | Duplicate işlem oluşmaması | Orta | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |
| `T-234` | Veritabanı kilitlenme testi | Orta | Performans | matching, notifications, applications, tokens | n/a-load-tests | `partial` | load-test-plan |

### CASE-UX — Kullanılabilirlik Testleri

Kullanılabilirlik, hata/boş/yükleniyor durumları, form anlaşılırlığı ve UI geri bildirimleri.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-235` | İlk kez kullanan işçi akışı anlayabiliyor mu | Orta | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-236` | Profil oluşturma süresi uygun mu | Yüksek | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-237` | İşveren ilan açma akışı anlaşılır mı | Orta | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-238` | Uygun işler ekranı yeterince net mi | Yüksek | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-239` | Başvuru durumu okunabilir mi | Orta | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-240` | Check-in zamanı kullanıcıya anlaşılır geliyor mu | Kritik | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-241` | Konum izni isteme akışı ikna edici mi | Kritik | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-242` | Favoriler ekranı anlaşılır mı | Orta | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |
| `T-243` | Jeton mantığı anlaşılır mı | Kritik | Kullanılabilirlik | * | cross-cutting UX | `partial` | ux-acceptance |

### CASE-SECURITY — Güvenlik ve Veri Koruma Testleri

Yetkilendirme, veri koruma, hassas veri, erişim kontrolü ve güvenlik akışları.

| ID | Title | Priority | Type | Modules | Screens | Arch | Gap tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T-244` | Kullanıcı yalnızca kendi verisini görebiliyor mu | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-245` | İşveren sadece kendi adaylarını görebiliyor mu | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-246` | Yetkisiz API erişim testi | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-247` | Oturum yönetimi güvenliği | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-248` | Şifre sıfırlama güvenliği | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `gap` | gap-password |
| `T-249` | Belge dosyalarının yetkisiz erişime kapalı olması | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `gap` | gap-documents |
| `T-250` | Konum verisinin güvenli saklanması | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-251` | Hassas alanların gereksiz gösterilmemesi | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |
| `T-252` | Loglarda hassas veri sızıntısı olmaması | Kritik | Güvenlik | auth, users, policies, workers | m.shared.profile.settings, w.admin.* | `covered` |  |

## Coverage snapshot

| Status | Count |
| --- | ---: |
| covered | 151 |
| partial | 61 |
| gap | 36 |
| **total** | **248** |

See [01-gap-backlog.md](01-gap-backlog.md) for remediation of `gap` / `partial` items.