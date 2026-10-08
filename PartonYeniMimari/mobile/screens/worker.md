# Mobil — Çalışan ekranları

**Durum:** `proposed`  
**Nest modülleri:** `workers`, `jobs`, `matching`, `applications`, `shifts`, `location`, `favorites`, `notifications`, `ratings`

---

## `m.worker.home.root` — Çalışan ana sayfası

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/home` |
| **Rol** | Çalışan |
| **Amaç** | Bugünün özeti: yaklaşan vardiya, bekleyen teyitler, eşleşen iş önizlemesi |
| **MVP** | P0 |
| **Giriş** | Çalışan sekmesinin kökü |
| **Düzen** | Başlık (ad/puan); uyarı kartları; sonraki vardiya CTA’sı; yatay eşleşen iş listesi; kısayollar |
| **Eylemler** | İşe giriş / 3 saat kala onayı aç; işi aç; bildirimleri aç |
| **Durumlar** | boş (iş yok) → iş akışını keşfet CTA’sı; profil eksikse engellenir |
| **API** | `GET /api/v1/workers/me/home` (toplama uç noktası) veya birleştirilmiş çağrılar |
| **Vakalar** | `CASE-E2E`, `CASE-MATCHING`, `CASE-AVAILABILITY-3H`, `CASE-CHECKIN` |
| **Eski ekran** | `EmployeeHomeScreen` |

---

## `m.worker.jobs.list` — İş akışı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/jobs` |
| **Rol** | Çalışan |
| **Amaç** | Sunucunun sıraladığı uygun işleri görüntüle |
| **MVP** | P0 |
| **Giriş** | İşler sekmesi; ana sayfa önizlemesi |
| **Düzen** | Filtre etiketleri (tarih, mesafe, sektör); iş kartları (ücret, saat, mesafe, eşleşme nedenleri); yenilemek için aşağı çek |
| **Eylemler** | Ayrıntıyı aç; işvereni/işi favorile; filtreleri düzenle |
| **Durumlar** | yükleme iskeleti; eşleşme yok boş durumu; hata/yeniden dene; çevrimdışı bandı |
| **API** | `GET /api/v1/jobs/feed` |
| **Vakalar** | `CASE-MATCHING`, `CASE-LOCATION`, `CASE-PERF` |
| **Eski ekran** | `EmployeeJobsScreen` |
| **Notlar** | Eşleştirme kurallarını sunucu uygular; istemci yalnızca uygunluk nedenlerini gösterir |

---

## `m.worker.jobs.detail` — İş ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/jobs/:jobId` |
| **Rol** | Çalışan |
| **Amaç** | İşin tüm bilgileri + başvuru uygunluğu |
| **MVP** | P0 |
| **Giriş** | İş akışı, push, favoriler |
| **Düzen** | Başlık (işveren/şube); program; ücret; gereksinimler; harita önizlemesi; eşleşme ayrıntıları; sabit Başvur düğmesi |
| **Eylemler** | Başvur; Favorile; Paylaş (P2); Bildir |
| **Durumlar** | uygun değil (nedenler); zaten başvuruldu; iş kapandı |
| **API** | `GET /api/v1/jobs/:id`; `POST /api/v1/jobs/:id/applications` |
| **Vakalar** | `CASE-APPLICATION`, `CASE-MATCHING`, `CASE-SECURITY` |
| **Eski ekran** | `EmployeeJobDetailScreen` |

---

## `m.worker.jobs.apply-confirm` — Başvuru onayı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/jobs/:jobId/apply` |
| **Rol** | Çalışan |
| **Amaç** | Taahhütlerin özetini görüp başvuruyu onayla |
| **MVP** | P0 |
| **Giriş** | İş ayrıntısı Başvur |
| **Düzen** | Özet kartı; çakışma uyarıları; onay CTA’sı |
| **Eylemler** | Başvuruyu onayla; İptal et |
| **Durumlar** | başka kabul edilmiş vardiyayla çakışma; profil eksik; başarı bildirimi → süreç ayrıntısı |
| **API** | `POST /api/v1/jobs/:id/applications` (+ `Idempotency-Key`) |
| **Vakalar** | `CASE-APPLICATION`, `CASE-ABUSE` |
| **Eski ekran** | iş ayrıntısına / sürece gömülü |

---

## `m.worker.applications.list` — Başvurularım

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/applications` |
| **Rol** | Çalışan |
| **Amaç** | Bekleyen / kabul edilen / reddedilen başvuruları izle |
| **MVP** | P1 |
| **Giriş** | Profil veya ana sayfa kısayolu |
| **Düzen** | Durum sekmeleri; liste satırları |
| **Eylemler** | Süreç ayrıntısını aç; izin varsa geri çek |
| **API** | `GET /api/v1/applications?mine=1` |
| **Vakalar** | `CASE-APPLICATION`, `CASE-EMPLOYER-REVIEW` |
| **Eski ekran** | ana sayfa / süreç üzerinden kısmen |

---

## `m.worker.calendar.root` — Takvim

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/calendar` |
| **Rol** | Çalışan |
| **Amaç** | Planlanmış vardiyaları + müsait olunan günleri gör |
| **MVP** | P1 |
| **Giriş** | Takvim sekmesi |
| **Düzen** | Ay/hafta görünümü seçimi; etkinlik etiketleri; müsaitliği düzenleme CTA’sı |
| **Eylemler** | Vardiyayı aç; müsaitliği düzenle |
| **API** | `GET /api/v1/workers/me/calendar` |
| **Vakalar** | `CASE-WORKER-PROFILE`, `CASE-CHECKIN` |
| **Eski ekran** | `EmployeeCalendarScreen` |

---

## `m.worker.availability.edit` — Müsaitlik düzenleyicisi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/availability` |
| **Rol** | Çalışan |
| **Amaç** | Günleri + birden fazla zaman aralığını belirle (3 saatlik eşleştirme buna bağlıdır) |
| **MVP** | P0 |
| **Giriş** | İlk kurulum; takvim; profil |
| **Düzen** | Hafta günü seçicileri; aralık ekleme; çakışmaları vurgulama |
| **Eylemler** | Aralık ekle; sil; kaydet |
| **Durumlar** | çakışan aralık engellenir; kayıt başarılı |
| **API** | `PUT /api/v1/workers/me/availability` |
| **Vakalar** | `CASE-WORKER-PROFILE`, `CASE-AVAILABILITY-3H`, `CASE-MATCHING` |
| **Eski ekran** | `EmployeeAvailabilityScreen` |

---

## `m.worker.shift.prep` — İşe hazırlık

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/shifts/:shiftId/prep` |
| **Rol** | Çalışan |
| **Amaç** | Vardiya öncesi kontrol listesi (adres, kıyafet kuralı, iletişim) |
| **MVP** | P1 |
| **Giriş** | Ana sayfa / vardiya günü bildirimi |
| **Düzen** | Kontrol listesi; harita; işveren notları |
| **Eylemler** | Haritada yol tarifi al; işe giriş akışını başlat |
| **API** | `GET /api/v1/shifts/:id` |
| **Vakalar** | `CASE-CHECKIN`, `CASE-UX` |
| **Eski ekran** | `EmployeeWorkPrepScreen` |

---

## `m.worker.shift.availability-confirm` — 3 saat kala onay

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/shifts/:shiftId/confirm-availability` |
| **Rol** | Çalışan |
| **Amaç** | Yaklaşık 3 saat kala “Gelebilirim” / “Gelemiyorum” yanıtı ver |
| **MVP** | P0 |
| **Giriş** | Push; ana sayfa uyarı kartı |
| **Düzen** | İş özeti; iki temel seçenek; reddetme için isteğe bağlı gerekçe |
| **Eylemler** | Onayla; Reddet |
| **Durumlar** | onay süresi doldu; yanıt zaten verildi |
| **API** | `POST /api/v1/shifts/:id/availability-confirm` |
| **Vakalar** | `CASE-AVAILABILITY-3H`, `CASE-NOTIFICATIONS`, `CASE-ABUSE` |
| **Eski ekran** | bildirimle tetiklenen akışlar |

---

## `m.worker.shift.check-in` — İşe giriş

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/shifts/:shiftId/check-in` |
| **Rol** | Çalışan |
| **Amaç** | Konum doğrulamasıyla “İşe geldim” bildirimi |
| **MVP** | P0 |
| **Giriş** | 10 dakika kala push; hazırlık; ana sayfa |
| **Düzen** | İzin durumu; şubeye canlı mesafe; birincil İşe giriş düğmesi; yarıçap dışındaysa yardım |
| **Eylemler** | İşe giriş yap; konum ayarlarını aç; iptal et |
| **Durumlar** | izin reddedildi; coğrafi çit dışında; çok erken/geç; başarılı |
| **API** | `POST /api/v1/shifts/:id/check-in` (+ lat/lng/accuracy) |
| **Vakalar** | `CASE-CHECKIN`, `CASE-LOCATION`, `CASE-SECURITY` |
| **Eski ekran** | `EmployeeCheckInScreen` |
| **Notlar** | Yarıçapı ve zamanı sunucu doğrular; istemci tek başına başarı işaretleyemez |

---

## `m.worker.shift.in-shift` — Vardiya sırasındaki işlemler

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/shifts/:shiftId/active` |
| **Rol** | Çalışan |
| **Amaç** | Etkin vardiya sırasındaki işlemler |
| **MVP** | P1 |
| **Giriş** | Başarılı işe girişten sonra |
| **Düzen** | Sayaç/durum; yöneticiyle iletişim; olay bildirimi; sona yaklaşınca işten çıkış CTA’sı |
| **API** | `GET /api/v1/shifts/:id` |
| **Vakalar** | `CASE-CHECKIN`, `CASE-ABUSE` |
| **Eski ekran** | `EmployeeInShiftActionsScreen` |

---

## `m.worker.shift.check-out` — İşten çıkış

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/shifts/:shiftId/check-out` |
| **Rol** | Çalışan |
| **Amaç** | Vardiyayı bitirme onayı |
| **MVP** | P1 |
| **Giriş** | Vardiya sırasında; zaman aralığında |
| **Düzen** | Özet; isteğe bağlı notlar; onayla |
| **API** | `POST /api/v1/shifts/:id/check-out` |
| **Vakalar** | `CASE-CHECKIN`, `CASE-RATINGS` (bekleyen puanlamayı tetikler) |
| **Eski ekran** | `EmployeeCheckOutScreen` |

---

## `m.worker.profile.root` — Profil

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/profile` |
| **Rol** | Çalışan |
| **Amaç** | Kimlik, puan, kısayollar |
| **MVP** | P0 |
| **Giriş** | Profil sekmesi |
| **Düzen** | Avatar/ad/puan; profil tamamlama göstergesi; bağlantılar (müsaitlik, başvurular, favoriler, kazanç, ayarlar) |
| **Eylemler** | Düzenle; Çıkış yap (ayarlar üzerinden) |
| **API** | `GET /api/v1/workers/me` |
| **Vakalar** | `CASE-WORKER-PROFILE` |
| **Eski ekran** | `EmployeeProfileScreen`, `ProfileOverviewScreen` |

---

## `m.worker.profile.edit` — Profili düzenle

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/profile/edit` |
| **Rol** | Çalışan |
| **Amaç** | Kişisel bilgileri / beceri alanlarını güncelle |
| **MVP** | P0 |
| **API** | `PATCH /api/v1/workers/me` |
| **Vakalar** | `CASE-WORKER-PROFILE` |
| **Eski ekran** | profil kurulum akışının yeniden kullanımı |

---

## `m.worker.revenue.root` — Kazanç

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/revenue` |
| **Rol** | Çalışan |
| **Amaç** | Kazanç geçmişi / istatistikler |
| **MVP** | P2 |
| **API** | `GET /api/v1/workers/me/revenue` |
| **Vakalar** | `CASE-WORKER-PROFILE` |
| **Eski ekran** | `EmployeeRevenueScreen` |

---

## `m.worker.favorites.list` — Favoriler

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/favorites` |
| **Rol** | Çalışan |
| **Amaç** | Kaydedilen işverenler/işler |
| **MVP** | P1 |
| **API** | `GET /api/v1/favorites` |
| **Vakalar** | `CASE-FAVORITES` |
| **Eski ekran** | favori ekranları |

---

## `m.worker.push-prefs` — Push tercihleri

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/worker/settings/push` |
| **Rol** | Çalışan |
| **Amaç** | Bildirim kategorilerini aç/kapat |
| **MVP** | P1 |
| **API** | `PATCH /api/v1/notifications/preferences` |
| **Vakalar** | `CASE-NOTIFICATIONS` |
| **Eski ekran** | `EmployeePushPrefsScreen` |
