# 06 — REST API kuralları

**Durum:** accepted (tarz + yol); aşağıdaki ayrıntılar proposed / open olarak işaretlenmiştir  
**Son güncelleme:** 2026-10-07  
**ADR:** [0004 — Genel REST / JSON API](adr/0004-rest-json-api.md)  
**Kararlar:** [../01-architecture-decisions.md](../01-architecture-decisions.md)

## Tarz (kesinleşti)

PartOn mobil ↔ arka uç sözleşmesi HTTPS üzerinden **REST / JSON API**'dir.

| Kural | Ayrıntı | Durum |
| --- | --- | --- |
| Protokol | HTTPS | locked |
| Biçim | application/json (UTF-8) | locked |
| Temel yol | **/api/v1** | locked |
| Geriye dönük uyumsuz değişiklikler | Yeni ana sürüm yolu (/api/v2, …) | locked |
| Eski istemci desteği / sonlandırma | Politika belirlenecek | open (AO-12) |
| Biçim | Kaynak odaklı URL'ler; çoğul isimler | proposed |
| Komutlar | Durum makinesi eylemleri alt kaynak olarak (POST .../accept) | proposed |
| Şemalar | Paylaşılan paketler; arka uç alan kurallarından önce çalışma zamanında doğrular | locked |
| İstemci ön kontrolü | Mobil aynı şemaları yeniden kullanabilir; sunucu doğrulamasının yerini tutmaz | locked |
| AuthZ / veritabanı kuralları | Yalnızca arka uçta — paylaşılan şemalarda değil | locked |
| Doğrulama kütüphanesi | **Zod 4 önerisi** (paylaşılan paket) — nestjs-zod / Standard Schema üzerinden | open → önerildi ([radar](../03-tech-radar-2026.md)) |
| Yanıt çalışma zamanı doğrulaması | CI / istemcide isteğe bağlı; tek doğruluk kaynağı sunucudur | open (AO-8) |
| Hata biçimi | Zarf / kodlar — taslak { error, meta } | open → taslak ([yol haritası](../02-product-roadmap.md)) |
| Sayfalama | Akışlarda imleç; yönetimde offset | open → taslak |
| Belgeleme | **Öneri:** @nestjs/swagger + Zod → OpenAPI | open → önerildi |

Yönetim paneli **aynı Nest alan servislerini** kullanır; ikinci bir genel API tarzı değildir.

## Örnek rotalar (geçici)

Yollar /api/v1/... biçimini izler. Kaynak listesi, alan modülü adları özellik kapsamıyla kesinleşene kadar **örnek niteliğindedir**.

~~~http
POST   /api/v1/auth/otp/request
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/token/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me
PATCH  /api/v1/workers/me
POST   /api/v1/employers
GET    /api/v1/branches
POST   /api/v1/branches/:branchId/jobs
GET    /api/v1/jobs/feed
GET    /api/v1/jobs/:jobId
POST   /api/v1/jobs/:jobId/applications
POST   /api/v1/applications/:id/accept
POST   /api/v1/shifts/:id/check-in
GET    /api/v1/notifications
~~~

Modül → kaynak taslağı: [04-domain-modules.md](04-domain-modules.md) (adlar geçici).

## Sürümleme

- İlk genel ana sürüm için /api/v1
- Aynı ana sürüm içinde yeni alan eklemek geriye dönük uyumludur
- Uyumsuz değişiklikler → /api/v2 (ve daha sonra /api/v1 için kullanımdan kaldırma politikası)

## Taslak istek / yanıt notları (proposed / open)

Bunlar tartışma için çalışma varsayılanlarıdır — **kesinleşmedi** (AO-6):

| Konu | Çalışma varsayılanı | Durum |
| --- | --- | --- |
| Tarihler | ISO-8601 UTC | proposed |
| Kimlikler | JSON içinde dizge UUID | proposed |
| Kısmi güncelleme | PATCH | proposed |
| Idempotency | Kritik POST isteklerinde Idempotency-Key | proposed |
| Başarı zarfı | { "data", "meta" } | open |
| Hata zarfı | { "error": { "code", "message", "details" }, "meta" } | open |
| Sayfalama | Akışlarda imleç; yönetim listelerinde offset | open |
| HTTP durum eşlemesi | Olağan şekilde 400/401/403/404/409/429/5xx | proposed |

## Kimlik doğrulama başlığı (proposed)

~~~http
Authorization: Bearer <access_token>
~~~

Yenileme özel bir REST rotasından yapılır (kesin yol auth modülüyle belirlenecek). Yenileme jetonlarını sorgu dizelerine veya derin bağlantılara asla koymayın.

## Nest denetleyici kuralları

- Yollar /api/v1 altında olmalı
- Kullanım senaryolarından önce gelen gövde/sorguları **paylaşılan şemalarla** doğrulayın
- Koruyucular işleyicilerden önce kimlik doğrulama + yetkilendirme uygular
- Denetleyiciler ince kalır; alan kurallarının sahibi servislerdir (yönetim de bunları paylaşır)

## İlişkilendirme (proposed)

Destek ve günlükler için her yanıtta istek kimliği kullanılması tercih edilir (X-Request-Id ve/veya gövde meta alanı) — AO-6 ile kesinleştirin.

## v1 genel REST API'sinin kapsamı dışında

| Yaklaşım | Durum |
| --- | --- |
| GraphQL | Reddedildi (ADR-0004) |
| İstemcilere gRPC / Connect | Reddedildi |
| İstemci Firestore / BaaS SDK'sı | Reddedildi |
| Ayrı işçi HTTP API'si | Ertelendi |

## İlgili vaka grupları

CASE-UX, CASE-SECURITY, CASE-PERF, CASE-E2E (kabul eşlemesi hâlâ [../cases/](../cases/) üzerinden yapılır)
