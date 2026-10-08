# Mobil — Yönetici ekranları

**Durum:** proposed  
**Nest modülleri:** branches, jobs, applications, shifts, notifications  
**Kapsam kuralı:** Her sorgu JWT/üyelik üzerinden şubeyle sınırlandırılır.

---

## m.manager.home.root — Yönetici ana sayfası

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/home |
| **Rol** | Yönetici |
| **Amaç** | Atanmış şubede bugün: kimler geliyor, bekleyen teyitler, açık pozisyonlar |
| **MVP** | P0 |
| **Düzen** | Birden fazla şube varsa şube seçici; bugünün zaman çizelgesi; uyarı kartları |
| **Eylemler** | İşi aç; adayı aç; bildirimleri aç |
| **API** | GET /api/v1/managers/me/home |
| **Vakalar** | CASE-CHECKIN, CASE-AVAILABILITY-3H, CASE-E2E |
| **Eski ekran** | ManagerHomeScreen |

---

## m.manager.jobs.list — Yönetici işleri

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/jobs |
| **Rol** | Yönetici |
| **Amaç** | Geçerli şube bağlamındaki işleri listele |
| **MVP** | P0 |
| **Eylemler** | Ayrıntıyı aç; izin varsa iş oluştur |
| **API** | GET /api/v1/jobs?branchId= |
| **Vakalar** | CASE-JOB-POSTING |
| **Eski ekran** | ManagerJobsScreen |

---

## m.manager.jobs.form — İş oluştur / düzenle (kapsamlı)

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/jobs/create · /manager/jobs/:id/edit |
| **Rol** | Yönetici |
| **Amaç** | Şubeyle sınırlı iş oluşturma (işveren sihirbazının adımları yeniden kullanılabilir) |
| **MVP** | P1 |
| **Notlar** | Jeton harcaması için işveren onayı gerekebilir — open |
| **API** | Şube kapsamıyla POST /api/v1/jobs |
| **Vakalar** | CASE-JOB-POSTING, CASE-TOKEN |
| **Eski ekran** | ManagerJobFormViewModel |

---

## m.manager.applicants.list — Adaylar (kapsamlı)

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/jobs/:jobId/applicants |
| **Rol** | Yönetici |
| **Amaç** | Şube işlerine başvuranları incele |
| **MVP** | P0 |
| **Eylemler** | Yetkiliyse Kabul et / Reddet |
| **API** | Kapsam denetimli aynı başvuru uç noktaları |
| **Vakalar** | CASE-EMPLOYER-REVIEW, CASE-SECURITY |
| **Eski ekran** | ManagerJobApplicantsViewModel |

---

## m.manager.notifications.list — Bildirimler

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/notifications |
| **Rol** | Yönetici |
| **Amaç** | Operasyon gelen kutusu (işe gelmeme, işe giriş, yeni adaylar) |
| **MVP** | P0 |
| **API** | GET /api/v1/notifications |
| **Vakalar** | CASE-NOTIFICATIONS |
| **Eski ekran** | ManagerNotificationsScreen |

---

## m.manager.profile.root — Yönetici profili

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /manager/profile |
| **Rol** | Yönetici |
| **Amaç** | Kimlik, şube üyelikleri, ayarlar, çıkış |
| **MVP** | P0 |
| **API** | GET /api/v1/managers/me |
| **Vakalar** | CASE-EMPLOYER-BRANCH |
| **Eski ekran** | ManagerProfileScreen |
