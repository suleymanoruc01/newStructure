# Mobil — İşveren ekranları

**Durum:** `proposed`  
**Nest modülleri:** `employers`, `branches`, `jobs`, `applications`, `notifications`, `favorites`, jetonlar (`jobs`/`employers` içinde)

Yoğun aday incelemesi ve çok şubeli iş oluşturma web için **de** tasarlanmıştır ([`../../web/`](../../web/)). Mobil uygulama, hareket hâlindeki operasyonlar için tüm P0 yollarını kapsar.

---

## `m.employer.home.root` — İşveren ana sayfası

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/home` |
| **Rol** | İşveren |
| **Amaç** | Operasyon özeti: açık işler, bekleyen adaylar, jeton bakiyesi, kontrol listesi |
| **MVP** | P0 |
| **Düzen** | KPI göstergeleri; eylem kuyruğu; iş oluşturma / adaylara kısayollar |
| **Eylemler** | İş oluştur; adayları incele; şubeleri yönet |
| **API** | `GET /api/v1/employers/me/home` |
| **Vakalar** | `CASE-E2E`, `CASE-EMPLOYER-REVIEW`, `CASE-TOKEN` |
| **Eski ekran** | `EmployerHomeScreen` |

---

## `m.employer.dashboard` — Gösterge paneli

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/dashboard` |
| **Rol** | İşveren |
| **Amaç** | Grafikler / geçmiş ölçümleri |
| **MVP** | P2 |
| **Eski ekran** | `EmployerDashboardScreen` |
| **Notlar** | Kapsamlı analizler için web kanalını tercih edin |

---

## `m.employer.business.root` — Şirket profili

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/business` |
| **Rol** | İşveren |
| **Amaç** | Şirket profilini görüntüle/düzenle |
| **MVP** | P0 |
| **API** | `GET/PATCH /api/v1/employers/me` |
| **Vakalar** | `CASE-EMPLOYER-BRANCH` |
| **Eski ekran** | `EmployerBusinessScreen` |

---

## `m.employer.industry.manage` — Sektör yönetimi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/industries` |
| **Rol** | İşveren |
| **Amaç** | Katalog/iş kapsamındaki sektörleri seç |
| **MVP** | P1 |
| **API** | `PUT /api/v1/employers/me/industries` |
| **Vakalar** | `CASE-JOB-POSTING`, `CASE-EMPLOYER-BRANCH` |
| **Eski ekran** | `EmployerIndustryManagementScreen` |

---

## `m.employer.branches.list` — Şube listesi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/branches` |
| **Rol** | İşveren |
| **Amaç** | Tüm şubeleri listele |
| **MVP** | P0 |
| **Düzen** | Adres, yönetici sayısı ve etkin işleri gösteren kartlar |
| **Eylemler** | Şube ekle; ayrıntıyı aç |
| **API** | `GET /api/v1/branches` |
| **Vakalar** | `CASE-EMPLOYER-BRANCH` |
| **Eski ekran** | `EmployerBranchListScreen` |

---

## `m.employer.branches.detail` — Şube ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/branches/:branchId` |
| **Rol** | İşveren |
| **Amaç** | Şube özeti, yöneticiler, harita işareti, iş kısayolu |
| **MVP** | P0 |
| **Eylemler** | Düzenle; yönetici davet et (kod); işleri gör |
| **API** | `GET /api/v1/branches/:id` |
| **Vakalar** | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| **Eski ekran** | `EmployerBranchScreen` |

---

## `m.employer.branches.form` — Şube oluştur / düzenle

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/branches/new` · `/employer/branches/:id/edit` |
| **Rol** | İşveren |
| **Amaç** | Ad, adres, koordinat ve iletişim bilgilerini al |
| **MVP** | P0 |
| **Düzen** | Form + harita işareti seçici; koordinatları doğrula |
| **Eylemler** | Kaydet; sil (düzenleme sırasında, izin varsa) |
| **Durumlar** | geçersiz konum; yinelenen ad uyarısı |
| **API** | `POST/PATCH /api/v1/branches` |
| **Vakalar** | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| **Eski ekran** | `EmployerBranchCreateEditScreen` |

---

## `m.employer.jobs.list` — İş listesi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs` |
| **Rol** | İşveren |
| **Amaç** | İlanları duruma göre yönet (taslak/açık/dolu/kapalı) |
| **MVP** | P0 |
| **Düzen** | Durum filtreleri; aday sayılarını gösteren iş kartları |
| **Eylemler** | Oluştur; ayrıntıyı aç |
| **API** | `GET /api/v1/jobs?employer=me` |
| **Vakalar** | `CASE-JOB-POSTING` |
| **Eski ekran** | `EmployerJobsScreen` |

---

## `m.employer.jobs.detail` — İş ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/:jobId` |
| **Rol** | İşveren |
| **Amaç** | İş özeti + adaylara geç / düzenle |
| **MVP** | P0 |
| **Eylemler** | Düzenle; kapat/iptal et; adayları gör; kopyala |
| **API** | `GET /api/v1/jobs/:id` |
| **Vakalar** | `CASE-JOB-POSTING`, `CASE-EMPLOYER-REVIEW` |
| **Eski ekran** | `EmployerJobDetailScreen` |

---

## İş oluşturma sihirbazı

### `m.employer.jobs.create.step1` — Pozisyonlar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/create/positions` |
| **Amaç** | Sektör / meslek / çalışan sayısı seç |
| **MVP** | P0 |
| **API** | `GET /api/v1/job-catalog` ile katalog okuma |
| **Vakalar** | `CASE-JOB-POSTING` |
| **Eski ekran** | `Step1PositionsScreen`, `CreateJobTabScreen` |

### `m.employer.jobs.create.step2` — Ayrıntılar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/create/details` |
| **Amaç** | Program, ücret, şube, gereksinimler, notlar |
| **MVP** | P0 |
| **Vakalar** | `CASE-JOB-POSTING`, `CASE-LOCATION` |
| **Eski ekran** | `Step2DetailsScreen`, `EmployerJobFormScreen` |

### `m.employer.jobs.create.step3` — Özet ve yayımlama

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/create/summary` |
| **Amaç** | İncele + jeton maliyeti + yayımla |
| **MVP** | P0 |
| **Eylemler** | Yayımla; Taslağı kaydet |
| **Durumlar** | yetersiz jeton → jeton ekranı; başarılı |
| **API** | `POST /api/v1/jobs` (jetonları sunucu tarafında rezerve eder) |
| **Vakalar** | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| **Eski ekran** | `Step3SummaryScreen` |

---

## `m.employer.jobs.form` — İşi düzenle

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/:jobId/edit` |
| **MVP** | P1 |
| **Notlar** | Yayımdan sonra sınırlı alan düzenlenebilir; kısıtları sunucu uygular |
| **Eski ekran** | `EmployerJobFormScreen` |

---

## `m.employer.applicants.list` — Adaylar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/jobs/:jobId/applicants` |
| **Rol** | İşveren |
| **Amaç** | Bir işin adaylarını incele |
| **MVP** | P0 |
| **Düzen** | Filtreler (puan, mesafe, favoriler); liste; toplu eylemler P2 |
| **Eylemler** | Ayrıntıyı aç; Kabul et; Reddet |
| **API** | `GET /api/v1/jobs/:id/applications` |
| **Vakalar** | `CASE-EMPLOYER-REVIEW`, `CASE-APPLICATION`, `CASE-FAVORITES` |
| **Eski ekran** | `EmployerJobApplicantsScreen` |
| **Notlar** | Yoğun hacimli işlemler için web tercih edilir |

---

## `m.employer.applicants.detail` — Aday ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/applications/:applicationId` |
| **Amaç** | Çalışan kartı + geçmiş + karar ver |
| **MVP** | P0 |
| **Eylemler** | Kabul et; Reddet; Çalışanı favorilere ekle; Mesaj (varsa — `open`) |
| **API** | `GET /api/v1/applications/:id`; `POST .../accept|reject` |
| **Vakalar** | `CASE-EMPLOYER-REVIEW`, `CASE-SECURITY` |
| **Eski ekran** | işveren akışlarında aday ayrıntısı |

---

## `m.employer.tokens.root` — Jetonlar / provizyon

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/tokens` |
| **Amaç** | Bakiyeyi, bekletmeleri ve satın alma/bakiye yükleme girişini göster (`open` ödeme) |
| **MVP** | P0 (balance + holds); ödeme P1/P2 |
| **API** | `GET /api/v1/employers/me/tokens` |
| **Vakalar** | `CASE-TOKEN` |
| **Eski ekran** | jetonla ilgili arayüz (Kotlin uygulamasında sınırlı kalmış olabilir) |

---

## `m.employer.ops.settings` — Operasyon ayarları

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/settings/ops` |
| **MVP** | P2 |
| **Eski ekran** | `EmployerOpsSettingsScreen` |

---

## `m.employer.favorites.workers` — Favori çalışanlar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/favorites/workers` |
| **MVP** | P1 |
| **API** | `GET /api/v1/favorites?type=worker` |
| **Vakalar** | `CASE-FAVORITES` |

---

## `m.employer.profile.root` — Profil sekmesi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/employer/profile` |
| **Amaç** | Kuruluş kısayolları: şirket, sektör, jetonlar, bildirimler, ayarlar |
| **MVP** | P0 |
| **Eski ekran** | `EmployerProfileScreen` |
