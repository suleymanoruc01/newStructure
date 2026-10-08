# 02 — Mobil ekran kataloğu (dizin)

**Durum:** `proposed`  
**Son güncelleme:** 2026-10-07

Tam envanter. Ayrıntılar [`screens/`](screens/) altındadır.

## MVP açıklamaları

| Etiket | Anlamı |
| --- | --- |
| **P0** | İlk kapalı beta için gerekli |
| **P1** | Parton vaka kapsamının tamamı için gerekli |
| **P2** | Daha sonra / iyileştirme |

## Kimlik doğrulama ve ilk kurulum

| ID | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| `m.auth.tutorial` | Uygulama tanıtımı | P2 | `CASE-UX` |
| `m.auth.phone` | Telefon girişi | P0 | `CASE-AUTH` |
| `m.auth.otp` | OTP doğrulama | P0 | `CASE-AUTH`, `CASE-SECURITY` |
| `m.auth.role-select` | Rol seçimi | P0 | `CASE-AUTH` |
| `m.auth.policies` | Politikaları kabul et | P0 | `CASE-AUTH` |
| `m.auth.email` | E-posta kaydı (isteğe bağlı) | P1* | T-002 |
| `m.auth.password-set` | Parola belirle (isteğe bağlı) | P1* | T-008 |
| `m.auth.password-reset` | Parolayı sıfırla (isteğe bağlı) | P1* | T-248 |
| `m.worker.onboarding.profile` | Çalışan profili kurulumu | P0 | `CASE-WORKER-PROFILE` |
| `m.employer.onboarding.business` | İşveren şirket kurulumu | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.onboarding.checklist` | İşveren kurulum kontrol listesi | P1 | `CASE-EMPLOYER-BRANCH` |
| `m.manager.onboarding.join` | Yönetici koduyla katıl | P0 | `CASE-EMPLOYER-BRANCH` |

## Çalışan

| ID | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| `m.worker.home.root` | Çalışan ana sayfası | P0 | `CASE-E2E`, `CASE-MATCHING` |
| `m.worker.jobs.list` | İş akışı | P0 | `CASE-MATCHING`, `CASE-JOB-POSTING` |
| `m.worker.jobs.detail` | İş ayrıntısı | P0 | `CASE-MATCHING`, `CASE-APPLICATION` |
| `m.worker.jobs.apply-confirm` | Başvuru onayı | P0 | `CASE-APPLICATION` |
| `m.worker.applications.list` | Başvurularım | P1 | `CASE-APPLICATION` |
| `m.worker.calendar.root` | Takvim / program | P1 | `CASE-WORKER-PROFILE` |
| `m.worker.availability.edit` | Müsaitlik düzenleyici | P0 | `CASE-AVAILABILITY-3H`, `CASE-WORKER-PROFILE` |
| `m.worker.shift.prep` | İşe hazırlık | P1 | `CASE-CHECKIN` |
| `m.worker.shift.availability-confirm` | 3 saat kala gelebilirim onayı | P0 | `CASE-AVAILABILITY-3H` |
| `m.worker.shift.check-in` | İşe giriş | P0 | `CASE-CHECKIN`, `CASE-LOCATION` |
| `m.worker.shift.dispute` | İşe giriş itirazı | P0 | T-135, T-212 |
| `m.worker.shift.in-shift` | Vardiya sırasındaki işlemler | P1 | `CASE-CHECKIN` |
| `m.worker.shift.check-out` | İşten çıkış | P1 | `CASE-CHECKIN` |
| `m.worker.documents.list` | Belgeler | P0 | T-022–T-024 |
| `m.worker.documents.upload` | Belge yükle | P0 | T-023–T-024, T-249 |
| `m.worker.profile.root` | Profil özeti | P0 | `CASE-WORKER-PROFILE` |
| `m.worker.profile.edit` | Profili düzenle | P0 | `CASE-WORKER-PROFILE` |
| `m.worker.revenue.root` | Kazanç / gelir | P2 | `CASE-WORKER-PROFILE` |
| `m.worker.favorites.list` | Favoriler | P1 | `CASE-FAVORITES` |
| `m.worker.push-prefs` | Push tercihleri | P1 | `CASE-NOTIFICATIONS` |

## İşveren

| ID | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| `m.employer.home.root` | İşveren ana sayfası | P0 | `CASE-E2E` |
| `m.employer.dashboard` | Gösterge paneli ölçümleri | P2 | `CASE-PERF` |
| `m.employer.business.root` | Şirket profili | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.industry.manage` | Sektör kapsamı | P1 | `CASE-EMPLOYER-BRANCH`, `CASE-JOB-POSTING` |
| `m.employer.branches.list` | Şube listesi | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.branches.detail` | Şube ayrıntısı | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.branches.form` | Şube oluştur / düzenle | P0 | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| `m.employer.jobs.list` | İş listesi | P0 | `CASE-JOB-POSTING` |
| `m.employer.jobs.detail` | İş ayrıntısı | P0 | `CASE-JOB-POSTING`, `CASE-EMPLOYER-REVIEW` |
| `m.employer.jobs.create.step1` | İş oluştur — pozisyonlar | P0 | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| `m.employer.jobs.create.step2` | İş oluştur — ayrıntılar | P0 | `CASE-JOB-POSTING` |
| `m.employer.jobs.create.step3` | İş oluştur — özet | P0 | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| `m.employer.jobs.form` | İşi düzenle (tek form) | P1 | `CASE-JOB-POSTING` |
| `m.employer.applicants.list` | Adaylar | P0 | `CASE-EMPLOYER-REVIEW`, `CASE-APPLICATION` |
| `m.employer.applicants.detail` | Aday ayrıntısı | P0 | `CASE-EMPLOYER-REVIEW` |
| `m.employer.tokens.root` | Jeton / sağlama bakiyesi | P0 | `CASE-TOKEN` |
| `m.employer.verification.status` | Şirket doğrulaması | P0 | T-015 |
| `m.employer.shift.manual-confirm` | Katılımı elle onayla | P0 | T-134, T-213 |
| `m.employer.ops.settings` | Operasyon ayarları | P2 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.favorites.workers` | Favori çalışanlar | P1 | `CASE-FAVORITES` |
| `m.employer.profile.root` | İşveren profil sekmesi | P0 | `CASE-EMPLOYER-BRANCH` |

## Yönetici

| ID | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| `m.manager.home.root` | Yönetici ana sayfası | P0 | `CASE-E2E`, `CASE-CHECKIN` |
| `m.manager.jobs.list` | Yönetici işleri | P0 | `CASE-JOB-POSTING` |
| `m.manager.jobs.form` | İş oluştur / düzenle (kapsamlı) | P1 | `CASE-JOB-POSTING` |
| `m.manager.applicants.list` | Adaylar (kapsamlı) | P0 | `CASE-EMPLOYER-REVIEW` |
| `m.manager.notifications.list` | Bildirimler | P0 | `CASE-NOTIFICATIONS` |
| `m.manager.profile.root` | Yönetici profili | P0 | `CASE-EMPLOYER-BRANCH` |

## Paylaşılan / sistem

| ID | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| `m.shared.notifications.list` | Gelen kutusu | P0 | `CASE-NOTIFICATIONS` |
| `m.shared.notifications.detail` | Bildirim ayrıntısı | P1 | `CASE-NOTIFICATIONS` |
| `m.shared.ratings.compose` | Karşı tarafı puanla | P1 | `CASE-RATINGS` |
| `m.shared.ratings.pending` | Bekleyen puanlar | P1 | `CASE-RATINGS` |
| `m.shared.job-process.detail` | İş süreci zaman çizelgesi | P1 | `CASE-APPLICATION`, `CASE-E2E` |
| `m.shared.profile.settings` | Hesap ayarları | P0 | `CASE-AUTH`, `CASE-SECURITY` |
| `m.shared.abuse.report` | Kötüye kullanım bildir | P1 | `CASE-ABUSE` |
| `m.shared.system.maintenance` | Bakım | P0 | `CASE-UX` |
| `m.shared.system.restriction` | Kısıtlama | P0 | `CASE-ABUSE`, `CASE-SECURITY` |
| `m.shared.system.blocking` | Engelleme durumu | P1 | `CASE-SECURITY` |

## Sayılar (vaka kataloğu genişletmesinden sonra)

| Alan | Ekran sayısı |
| --- | --- |
| Kimlik doğrulama / ilk kurulum | 12 (3 isteğe bağlı e-posta/parola dâhil) |
| Çalışan | 20 |
| İşveren | 21 |
| Yönetici | 6 |
| Paylaşılan / sistem | 10 |
| **Toplam** | **69** |

\* İsteğe bağlı kimlik doğrulama ekranları yalnızca ürün e-posta/parola vakalarını korursa yayımlanır.

Yeni ekran ayrıntıları: [`screens/case-driven-additions.md`](screens/case-driven-additions.md)  
Tam vaka haritası: [`../cases/00-coverage-matrix.md`](../cases/00-coverage-matrix.md)
