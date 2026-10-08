# Web — İşveren konsolu ekranları

**Durum:** proposed  
**Nest modülleri:** employers, branches, jobs, applications, notifications, favorites, ratings, tokens  
**Kabuk:** Kenar çubuğu + üst çubuk (bilgi mimarisine bakın)

---

## w.employer.dashboard — Gösterge paneli

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app |
| **Rol** | İşveren |
| **Amaç** | Operasyon özeti: açık işler, bekleyen adaylar, bugünkü vardiyalar, jeton göstergesi |
| **MVP** | P0 |
| **Düzen** | KPI satırı; “İlgilenilmesi gerekenler” tablosu; kısayollar (İş oluştur, İncele) |
| **Eylemler** | İşlere/adaylara/şubelere derin bağlantı |
| **API** | GET /api/v1/employers/me/home (+ isteğe bağlı analiz) |
| **Vakalar** | CASE-E2E, CASE-EMPLOYER-REVIEW, CASE-TOKEN |
| **Mobil karşılığı** | m.employer.home.root / m.employer.dashboard |

---

## İşler

### w.employer.jobs.list — İş tablosu

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/jobs |
| **Amaç** | Tüm ilanları filtreleyebilen tablo |
| **MVP** | P0 |
| **Düzen** | Filtreler (durum, şube, tarih); sütunlar: başlık, şube, başlangıç, çalışan sayısı, adaylar, bekletilen jetonlar, durum; satır eylemleri |
| **Eylemler** | Oluştur; Aç; Çoğalt; Kapat |
| **API** | GET /api/v1/jobs?employer=me |
| **Vakalar** | CASE-JOB-POSTING, CASE-PERF |
| **Mobil karşılığı** | m.employer.jobs.list |

### w.employer.jobs.create — İş oluştur

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/jobs/new |
| **Amaç** | Canlı jeton maliyeti kenar çubuğuyla çok adımlı oluşturma |
| **MVP** | P0 |
| **Düzen** | Adımlar: Pozisyon → Ayrıntılar → İnceleme; sabit özet (maliyet, şube, program) |
| **Eylemler** | Taslağı kaydet; Yayımla |
| **Durumlar** | Yetersiz jeton; doğrulama; başarı → ayrıntı |
| **API** | katalog + POST /api/v1/jobs |
| **Vakalar** | CASE-JOB-POSTING, CASE-TOKEN |
| **Mobil karşılığı** | 1–3. oluşturma adımları |

### w.employer.jobs.detail — İş ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/jobs/:jobId |
| **Amaç** | Genel bakış + sekmeler: Ayrıntılar, Adaylar, Zaman çizelgesi, Ayarlar |
| **MVP** | P0 |
| **Eylemler** | Düzenle; Kapat; Aday panosunu aç |
| **API** | GET /api/v1/jobs/:id |
| **Vakalar** | CASE-JOB-POSTING, CASE-EMPLOYER-REVIEW |
| **Mobil karşılığı** | m.employer.jobs.detail |

### w.employer.jobs.edit — İşi düzenle

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/jobs/:jobId/edit |
| **MVP** | P1 |
| **Notlar** | Yayımlandıktan sonra alanlar sunucu kurallarına göre kilitlenir |
| **Vakalar** | CASE-JOB-POSTING |

---

## Adaylar

### w.employer.applicants.board — Aday panosu

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/jobs/:jobId/applicants · /app/applicants (genel kuyruk) |
| **Amaç** | Yoğun aday incelemesi; web'in temel farkı |
| **MVP** | P0 |
| **Düzen** | Tablo veya kanban (Beklemede / Kısa liste / Kabul edildi / Reddedildi); filtreler: puan, mesafe, favori, müsaitlik; toplu kabul/ret P1 |
| **Eylemler** | Ayrıntı çekmecesini aç; Kabul et; Reddet; Favorile |
| **API** | GET /api/v1/jobs/:id/applications; durum geçiş uç noktaları |
| **Vakalar** | CASE-EMPLOYER-REVIEW, CASE-APPLICATION, CASE-FAVORITES, CASE-SECURITY |
| **Mobil karşılığı** | m.employer.applicants.list |

### w.employer.applicants.detail — Aday ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | Panodaki çekmece veya /app/applications/:id |
| **Amaç** | Pano bağlamından ayrılmadan çalışanın tüm kartını göster |
| **MVP** | P0 |
| **Düzen** | Profil, puanlar, bu işverenle geçmiş vardiyalar, müsaitlik örtüşmesi, harita mesafesi |
| **Eylemler** | Kabul et; Reddet; Not ekle (P1); Favorile |
| **API** | GET /api/v1/applications/:id |
| **Vakalar** | CASE-EMPLOYER-REVIEW, CASE-SECURITY |
| **Mobil karşılığı** | m.employer.applicants.detail |

---

## Şubeler ve ekip

### w.employer.branches.list / form / detail

| Kimlik | Yol | MVP | Amaç |
| --- | --- | --- | --- |
| w.employer.branches.list | /app/branches | P0 | Şubelerin tablosu |
| w.employer.branches.form | /app/branches/new · .../edit | P0 | Form + harita işareti (masaüstü harita deneyimi) |
| w.employer.branches.detail | /app/branches/:id | P0 | Yöneticiler, işler, koordinatlar |

**Vakalar:** CASE-EMPLOYER-BRANCH, CASE-LOCATION  
**API:** /api/v1/branches*  
**Mobil karşılıkları:** m.employer.branches.*

### w.employer.team.list — Yöneticiler

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/team |
| **Amaç** | Yönetici davet et/iptal et; kodları göster; şube ataması |
| **MVP** | P0 |
| **Düzen** | Üyeler tablosu; “Davet kodu oluştur”; iptal et |
| **API** | GET/POST /api/v1/branches/:id/managers |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-SECURITY |
| **Mobil karşılığı** | Şube ayrıntısı üzerinden kısmen |

---

## Jetonlar

### w.employer.tokens.overview

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/tokens |
| **Amaç** | Bakiye, bekletilen ve kullanılabilir miktar; açık iş başına bekletmeleri açıkla |
| **MVP** | P0 |
| **Düzen** | Bakiye kartları; işlere bağlı bekletme tablosu; bakiye yükleme CTA'sı |
| **API** | GET /api/v1/employers/me/tokens |
| **Vakalar** | CASE-TOKEN |
| **Mobil karşılığı** | m.employer.tokens.root |

### w.employer.tokens.history

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/tokens/history |
| **MVP** | P1 |
| **Amaç** | Yükleme/düşüş/serbest bırakma kayıt defteri |
| **Vakalar** | CASE-TOKEN |

---

## Diğer işveren ekranları

| Kimlik | Yol | MVP | Amaç | Vakalar |
| --- | --- | --- | --- | --- |
| w.employer.favorites.workers | /app/favorites/workers | P1 | Kaydedilen çalışanlar | CASE-FAVORITES |
| w.employer.ratings.pending | /app/ratings/pending | P1 | Tamamlanan vardiyaları puanla | CASE-RATINGS |
| w.employer.notifications | /app/notifications | P1 | Gelen kutusu | CASE-NOTIFICATIONS |
| w.employer.settings.org | /app/settings/org | P0 | Şirket profili | CASE-EMPLOYER-BRANCH |
| w.employer.settings.industry | /app/settings/industries | P1 | Sektör kapsamı | CASE-JOB-POSTING |
| w.employer.settings.billing | /app/settings/billing | P2 | Ödeme yöntemleri | CASE-TOKEN |
| w.employer.reports.shifts | /app/reports/shifts | P1 | Katılım / işe gelmeme raporu | CASE-CHECKIN, CASE-ABUSE |
| w.employer.abuse.report | /app/abuse/report | P1 | Çalışan/iş sorunlarını bildir | CASE-ABUSE |

### w.employer.reports.shifts — Ayrıntılar

| Alan | Ayrıntı |
| --- | --- |
| **Düzen** | Tarih aralığı; şube filtresi; tablo: çalışan, iş, onay, işe giriş sonucu, mesafe |
| **Eylemler** | CSV dışa aktar (P1); başvuru zaman çizelgesini aç |
| **Notlar** | İşe giriş mobilde yapılır; web denetim/raporlama içindir |

### w.employer.shift.attendance — Elle onay ve itirazlar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/attendance · /app/shifts/:id |
| **MVP** | P0 |
| **Amaç** | GPS sorunlarını çöz: itirazı görüntüle, elle onayla, jeton kararını başlat |
| **Vakalar** | T-134–T-135, T-210–T-214 |
| **API** | POST /api/v1/shifts/:id/manual-confirm; itirazları listele |
| **Mobil karşılığı** | m.employer.shift.manual-confirm |

### w.employer.verification — Şirket doğrulaması

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /app/verification |
| **MVP** | P0 |
| **Amaç** | Vergi/şirket doğrulama durumu; doğrulanana kadar yayımlama CTA'larını engelle (T-015) |
| **Vakalar** | T-013, T-015 |

### İş oluşturma — yalnızca favorilere açık

w.employer.jobs.create inceleme adımında **Yalnızca favoriler** anahtarını ekleyin (T-056, T-168–T-169). Eşleştirme işi favori olmayanlardan gizlemelidir (T-075).
