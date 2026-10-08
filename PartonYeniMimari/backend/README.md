# Arka uç mimarisi notları

PartOn için NestJS + PostgreSQL. Tek uygulama, **sürümlü REST / JSON API'yi** (`/api/v1`) ve **yönetim panelini** barındırır; alan servisleri ortaktır.

Belgeleri sırayla okuyun. Ürün düzeyinde kesinleşen/açık kararlar: [`../01-architecture-decisions.md`](../01-architecture-decisions.md). Teslimat: [`../02-product-roadmap.md`](../02-product-roadmap.md). Eyl 2026 teknolojileri: [`../03-tech-radar-2026.md`](../03-tech-radar-2026.md). ADR'ler teknoloji kararlarını kaydeder.

| # | Belge | Amaç |
| --- | --- | --- |
| 01 | [Genel bakış](01-overview.md) | Hedefler, ilkeler, kalite eşikleri |
| 02 | [Sistem bağlamı](02-system-context.md) | Aktörler, sınırlar, güven bölgeleri |
| 03 | [Modüler monolit](03-modular-monolith.md) | Nest modül yerleşimi ve klasör kuralları |
| 04 | [Alan modülleri](04-domain-modules.md) | Geçici sınırlı bağlamlar (özelliklerle kesinleşecek adlar) |
| 05 | [Veri katmanı](05-data-layer.md) | PostgreSQL, ORM, geçişler, çok kiracılı yapı |
| 06 | [REST API kuralları](06-api-conventions.md) | `/api/v1`, şemalar; zarf/sayfalama `open` |
| 07 | [Kimlik doğrulama ve güvenlik](07-auth-security.md) | OTP/JWT, roller, korumalar, kötüye kullanım yüzeyleri |
| 08 | [Asenkron işlemler ve olaylar](08-async-events.md) | Önce süreç içi outbox; işçi ertelendi |
| 09 | [Gözlemlenebilirlik](09-observability.md) | Sağlık, günlükler, ölçümler, ortamlar |
| 10 | [Eski Firebase eşlemesi](10-legacy-firebase-mapping.md) | Eski depolar → yeni modüller |
| 11 | [Jetonlar ve sağlama](11-tokens-and-provision.md) | CASE-TOKEN kayıt defteri |
| 12 | [Eşleştirme kuralları](12-matching-rules.md) | CASE-MATCHING |
| 13 | [Konum politikası](13-location-policy.md) | CASE-LOCATION / CHECKIN |
| — | [Vaka kapsamı](../cases/) | 248 vaka → modüller / boşluklar |
| ADR | [Karar günlüğü](adr/README.md) | Mimari kararlar |

## Önerilen monorepo yerleşimi (gelecekteki kod)

```text
apps/
  backend/                 # NestJS — REST /api/v1 + yönetim
    src/
      main.ts
      app.module.ts
      common/
      config/
      modules/
        auth/
        users/
        employers/
        branches/
        workers/
        jobs/
        tokens/
        applications/
        matching/
        shifts/
        location/
        ratings/
        favorites/
        notifications/
        policies/
        moderation/
        admin/             # yönetim paneli barındırma / operasyon modülleri
      database/
  mobile/                  # React Native
packages/
  api-contracts/           # paylaşılan istek/yanıt şemaları + türler (ad belirlenecek)
  shared-utils/            # yalnızca platformdan bağımsız yardımcılar (ad belirlenecek)
```

Yukarıdaki modül klasör adları, özellik kapsamı belirlenene kadar **geçicidir** (AO-5). Monorepo aracı belirlenecek (AO-7).
