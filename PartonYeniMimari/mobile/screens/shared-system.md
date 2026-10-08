# Mobil — Paylaşılan ve sistem ekranları

**Durum:** `proposed`  
Tüm rollerde kullanılır; arayüz tutarlı tutulmalıdır.

---

## `m.shared.notifications.list` — Gelen kutusu

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/notifications` |
| **Rol** | Kimliği doğrulanmış herkes |
| **Amaç** | Uygulama içi bildirim merkezi |
| **MVP** | P0 |
| **Düzen** | Güne göre grupla; okunmamış işaretleri; kaydırarak okundu işaretle |
| **Eylemler** | Hedefi aç (derin bağlantı); tümünü okundu işaretle |
| **API** | `GET /api/v1/notifications`; `POST .../read` |
| **Vakalar** | `CASE-NOTIFICATIONS` |
| **Eski ekran** | çalışan/işveren/yönetici bildirim ekranları (tek kabukta birleştir) |

---

## `m.shared.notifications.detail` — Bildirim ayrıntısı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/notifications/:id` |
| **MVP** | P1 |
| **Amaç** | Push içeriği kesildiyse uzun metni göster |
| **API** | `GET /api/v1/notifications/:id` |
| **Vakalar** | `CASE-NOTIFICATIONS` |

---

## `m.shared.ratings.compose` — Puanlama oluştur

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/ratings/new?shiftId=` |
| **Rol** | Çalışan veya karşı taraftaki İşveren/Yönetici |
| **Amaç** | Vardiya sonrası puan + isteğe bağlı yorum |
| **MVP** | P1 |
| **Düzen** | Yıldızlar; etiketler; yorum; gönder |
| **Durumlar** | zaman aralığı henüz açılmadı; zaten gönderildi; süresi doldu |
| **API** | `POST /api/v1/ratings` |
| **Vakalar** | `CASE-RATINGS` |
| **Eski ekran** | puanlama depoları / bekleyen puanlamalar |

---

## `m.shared.ratings.pending` — Bekleyen puanlar

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/ratings/pending` |
| **Amaç** | Henüz verilmemiş puanları listele |
| **MVP** | P1 |
| **API** | `GET /api/v1/ratings/pending` |
| **Vakalar** | `CASE-RATINGS` |

---

## `m.shared.job-process.detail` — İş süreci zaman çizelgesi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/process/:applicationId` |
| **Rol** | Çalışan / İşveren / Yönetici (yetki kapsamıyla sınırlı) |
| **Amaç** | Paylaşılan zaman çizelgesi: başvuruldu → incelendi → kabul edildi → teyit edildi → işe giriş yapıldı → puanlandı |
| **MVP** | P1 |
| **Düzen** | Dikey adım göstergesi + bağlama duyarlı CTA’lar |
| **API** | `GET /api/v1/applications/:id/timeline` |
| **Vakalar** | `CASE-APPLICATION`, `CASE-E2E`, `CASE-CHECKIN` |
| **Eski ekran** | `JobProcessDetailScreen` |

---

## `m.shared.profile.settings` — Hesap ayarları

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/settings` |
| **Rol** | Herkes |
| **Amaç** | Dil, tema (P2), push tercihleri bağlantısı, çıkış, hesabı sil (P1) |
| **MVP** | P0 (çıkış + hukuk); diğerleri aşamalı |
| **API** | `POST /api/v1/auth/logout`; hesap silme uç noktası daha sonra eklenecek |
| **Vakalar** | `CASE-AUTH`, `CASE-SECURITY` |
| **Eski ekran** | `ProfileSettingsScreen` |

---

## `m.shared.abuse.report` — Kötüye kullanım bildir

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/abuse/report` |
| **Amaç** | Kullanıcıyı/işi/davranışı bildir |
| **MVP** | P1 |
| **Düzen** | Kategori; serbest metin; P2’de isteğe bağlı ekler |
| **API** | `POST /api/v1/moderation/reports` |
| **Vakalar** | `CASE-ABUSE` |
| **Eski ekran** | destek kayıtları |

---

## Sistem engelleri

### `m.shared.system.maintenance`

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/system/maintenance` |
| **Amaç** | API bakım işareti verdiğinde erişimi tamamen durdur |
| **MVP** | P0 |
| **Eski ekran** | `MaintenanceScreen` |

### `m.shared.system.restriction`

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/system/restriction` |
| **Amaç** | Hesap kısıtlandı (kötüye kullanım / risk) |
| **MVP** | P0 |
| **Eski ekran** | `RestrictionScreen` |
| **Vakalar** | `CASE-ABUSE`, `CASE-SECURITY` |

### `m.shared.system.blocking`

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | `/system/blocking` |
| **Amaç** | Yumuşak/sert engeller: ödenmemiş bakiye, doğrulanmamış vergi bilgisi vb. |
| **MVP** | P1 |
| **Eski ekran** | `BlockingStatusScreen` |
