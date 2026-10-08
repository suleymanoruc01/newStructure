# 02 — Web ekran kataloğu (dizin)

**Durum:** proposed  
**Son güncelleme:** 2026-10-07

Ayrıntılar [screens/](screens/) altındadır.

## Genel sayfalar ve kimlik doğrulama

| Kimlik | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| w.public.landing | Tanıtım açılış sayfası | P1 | CASE-UX |
| w.public.pricing | Fiyatlandırma / jeton açıklaması | P2 | CASE-TOKEN |
| w.public.legal.privacy | Gizlilik | P0 | CASE-SECURITY |
| w.public.legal.terms | Kullanım koşulları | P0 | CASE-SECURITY |
| w.auth.login | Telefonla giriş | P0 | CASE-AUTH |
| w.auth.otp | OTP doğrulama | P0 | CASE-AUTH |
| w.auth.policies | Politikaları kabul et | P0 | CASE-AUTH |
| w.employer.onboarding | İşverenin web ilk kurulumu | P0 | CASE-EMPLOYER-BRANCH |

## İşveren konsolu

| Kimlik | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| w.employer.dashboard | Gösterge paneli | P0 | CASE-E2E |
| w.employer.jobs.list | İş tablosu | P0 | CASE-JOB-POSTING |
| w.employer.jobs.create | İş oluştur (çok adımlı sayfa) | P0 | CASE-JOB-POSTING, CASE-TOKEN |
| w.employer.jobs.detail | İş ayrıntısı | P0 | CASE-JOB-POSTING |
| w.employer.jobs.edit | İşi düzenle | P1 | CASE-JOB-POSTING |
| w.employer.applicants.board | Aday panosu / tablosu | P0 | CASE-EMPLOYER-REVIEW |
| w.employer.applicants.detail | Aday çekmecesi/sayfası | P0 | CASE-EMPLOYER-REVIEW |
| w.employer.branches.list | Şubeler | P0 | CASE-EMPLOYER-BRANCH |
| w.employer.branches.form | Şube oluştur/düzenle | P0 | CASE-EMPLOYER-BRANCH, CASE-LOCATION |
| w.employer.branches.detail | Şube ayrıntısı | P0 | CASE-EMPLOYER-BRANCH |
| w.employer.team.list | Yöneticiler / davetler | P0 | CASE-EMPLOYER-BRANCH |
| w.employer.tokens.overview | Jeton bakiyesi ve bekletmeler | P0 | CASE-TOKEN |
| w.employer.tokens.history | Kayıt defteri | P1 | CASE-TOKEN |
| w.employer.favorites.workers | Favori çalışanlar | P1 | CASE-FAVORITES |
| w.employer.ratings.pending | Bekleyen puanlar | P1 | CASE-RATINGS |
| w.employer.notifications | Bildirim merkezi | P1 | CASE-NOTIFICATIONS |
| w.employer.settings.org | Kurum ayarları | P0 | CASE-EMPLOYER-BRANCH |
| w.employer.settings.industry | Sektörler | P1 | CASE-JOB-POSTING |
| w.employer.settings.billing | Faturalama (varsa) | P2 | CASE-TOKEN |
| w.employer.reports.shifts | Vardiya katılım raporu | P1 | CASE-CHECKIN |
| w.employer.shift.attendance | Elle onay + itirazlar | P0 | T-134–T-135, T-210–T-214 |
| w.employer.verification | Şirket doğrulama durumu | P0 | T-015 |
| w.employer.abuse.report | Kötüye kullanım bildir | P1 | CASE-ABUSE |

## Yönetim konsolu

| Kimlik | Ad | MVP | Vakalar |
| --- | --- | --- | --- |
| w.admin.login | Yönetici girişi | P0 | CASE-SECURITY |
| w.admin.dashboard | Operasyon gösterge paneli | P1 | CASE-PERF |
| w.admin.users.list | Kullanıcılar | P0 | CASE-SECURITY |
| w.admin.users.detail | Kullanıcı ayrıntısı / kısıtla | P0 | CASE-ABUSE, CASE-SECURITY |
| w.admin.employers.list | İşverenler | P0 | CASE-EMPLOYER-BRANCH |
| w.admin.jobs.list | İş denetimi | P1 | CASE-JOB-POSTING |
| w.admin.catalog.manage | İş kataloğu CMS'si | P0 | CASE-JOB-POSTING |
| w.admin.abuse.queue | Kötüye kullanım / destek kuyruğu | P0 | CASE-ABUSE |
| w.admin.abuse.detail | Destek talebi ayrıntısı | P0 | CASE-ABUSE |
| w.admin.risk.queue | Risk / çoklu hesap / sahte GPS | P1 | CASE-ABUSE |
| w.admin.policies.manage | Politika belgeleri | P0 | CASE-AUTH |
| w.admin.config.remote | Uygulama yapılandırması / coğrafi çit / işaretler | P1 | CASE-UX, CASE-LOCATION |
| w.admin.notifications.broadcast | Toplu bildirim aracı | P2 | CASE-NOTIFICATIONS |
| w.admin.audit.log | Denetim günlüğü | P1 | CASE-SECURITY |

## Sayılar (vaka kataloğu genişletmesinden sonra)

| Alan | Ekran sayısı |
| --- | --- |
| Genel sayfalar ve kimlik doğrulama | 8 |
| İşveren konsolu | 23 |
| Yönetim konsolu | 14 |
| **Toplam** | **45** |

İş oluşturma akışında **yalnızca favoriler** işareti bulunmalıdır (T-056, T-168).  
Vaka haritası: [../cases/00-coverage-matrix.md](../cases/00-coverage-matrix.md)
