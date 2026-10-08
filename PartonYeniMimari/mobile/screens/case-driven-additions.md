# Mobil — Vakaların gerektirdiği ekran eklemeleri

**Durum:** proposed  
**Neden:** 248 katalog vakasının tamamı eşlenirken bulunan boşluklar.

---

## m.worker.documents.list — Belgeler

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /worker/documents |
| **Rol** | Çalışan |
| **Amaç** | Eşleştirmede kullanılan seçili/yüklenmiş sertifikaları listele |
| **MVP** | P0 |
| **Vakalar** | T-022–T-024, T-066–T-067, T-249 |
| **API** | GET /api/v1/workers/me/documents |
| **Giriş** | İlk kurulum + profil |

---

## m.worker.documents.upload — Belge yükle

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /worker/documents/upload |
| **Amaç** | Belge türü + dosya seç; MIME türü/boyutunu doğrula |
| **MVP** | P0 |
| **Durumlar** | geçersiz tür (T-024); başarı |
| **API** | POST /api/v1/workers/me/documents (imzalı yükleme) |
| **Vakalar** | T-023, T-024, T-249 |

---

## m.worker.shift.dispute — İşe giriş itirazı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /worker/shifts/:shiftId/dispute |
| **Amaç** | GPS reddine itiraz et; isteğe bağlı not/fotoğraf ekle |
| **MVP** | P0 |
| **Giriş** | Başarısız işe girişten sonra (T-126/T-211) |
| **API** | POST /api/v1/shifts/:id/disputes |
| **Vakalar** | T-135, T-212, T-214 |
| **Sonraki adım** | İşveren elle onaylar |

---

## m.employer.shift.manual-confirm — Katılımı elle onayla

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /employer/shifts/:shiftId/manual-confirm |
| **Rol** | İşveren / Yönetici |
| **Amaç** | GPS başarısız olduğunda çalışanın geldiğini onayla |
| **MVP** | P0 |
| **API** | POST /api/v1/shifts/:id/manual-confirm |
| **Vakalar** | T-134, T-213, T-214 |
| **Etki** | Politikaya göre jeton tahsilat yolu |

---

## m.employer.verification.status — Şirket doğrulaması

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /employer/verification |
| **Amaç** | Doğrulama durumunu göster; doğrulanana kadar yayımlama CTA'sını engelle |
| **MVP** | P0 |
| **Vakalar** | T-013, T-015 |
| **API** | GET /api/v1/employers/me |

---

## İsteğe bağlı kimlik doğrulama (ürün kararı)

| Kimlik | Vakalar | Not |
| --- | --- | --- |
| m.auth.email | T-002 | Yalnızca e-posta kaydı korunursa |
| m.auth.password-set | T-008 | Yalnızca parolalı hesaplar varsa |
| m.auth.password-reset | T-248 | Güvenliği güçlendirilmiş sıfırlama |

---

## Mevcut ekranlara katalog işaretleri

| Ekran | Eklenecek |
| --- | --- |
| İş oluşturma özeti | Yalnızca favoriler anahtarı (T-056, T-168) |
| İş ayrıntısı (çalışan) | Gerekli belgeler kontrol listesi (T-045, T-066) |
| Müsaitlik düzenleyicisi | Gece vardiyası / gece yarısını aşan saatler (T-019) |
| Profil düzenleme | Yaş + cinsiyet alanları (T-027, T-028) |
| Başvuru onayı | Çakışma uyarısı/engeli (T-085) |
| 3 saat kala onay | Fikir değiştirme + yanıt yok mesajları (T-117, T-118) |
| Jetonlar | Bekletme ve tahsilat açıklaması (T-243) |
