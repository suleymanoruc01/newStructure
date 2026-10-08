# Paylaşılan notlar ve paket sınırları

**Durum:** `accepted` (kurallar); paket adları `open`  
**Kararlar:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

Nest arka ucu ile React Native arasındaki yatay sözleşmeler. Paylaşılan paketlerde sunucu sırrı, veritabanı modeli veya Nest sağlayıcısı **bulunmaz**.

## Paylaşılan paketlerde neler bulunabilir?

| İzin verilen | Yasak |
| --- | --- |
| API istek/yanıt şemaları | Veritabanı erişimi / ORM modelleri |
| Bu şemalardan türetilen TypeScript türleri | Veritabanı durumuna bağlı iş kuralları |
| Platformdan bağımsız yardımcılar (saf işlevler, biçimlendiriciler) | Yetkilendirme / rol politikası altyapıları |
| Paylaşılan hata **kodu enum'ları** (AO-6 tamamlandığında) | API anahtarları, JWT sırları, ortam yükleyicileri |
| | `apps/backend` içinden doğrudan içe aktarma |

## Her uygulamanın sahipliği

| Arka uç (`apps/backend`) | Mobil (`apps/mobile`) |
| --- | --- |
| PostgreSQL erişimi | Ekranlar ve gezinme |
| Alan servisleri / AuthZ | Cihaz işlemleri (GPS, push, güvenli depolama) |
| REST denetleyicileri + yönetim arayüzü | Paylaşılan şemaları kullanan HTTP istemcisi |
| Gelen isteklerin paylaşılan şemalarla çalışma zamanı doğrulaması | Aynı şemalarla isteğe bağlı gönderim öncesi doğrulama |

Mobil **veritabanı modellerine bağımlı olmamalıdır**; sunucuyla yalnızca REST sözleşmesi (`/api/v1`) üzerinden konuşur.

## Bu klasördeki belgeler

| Belge | Durum |
| --- | --- |
| [screen-conventions.md](screen-conventions.md) | Ekran kimlikleri / şablon (vakalarla birlikte geçici) |
| Paket adları ve klasör yerleşimi | `open` (AO-7) — **önerilen**: pnpm/Turborepo ile `api-contracts` + `shared-utils` |
| Hata kataloğu / sayfalama sözleşmesi | `open` (AO-6) — taslak zarf için [yol haritası](../02-product-roadmap.md) / [radar](../03-tech-radar-2026.md) |
| Doğrulama kütüphanesi seçimi | `open` (AO-8) — **Zod 4 önerisi** |

## İlgili

- REST kuralları: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Monorepo ADR'si: [`../backend/adr/0005-monorepo.md`](../backend/adr/0005-monorepo.md)
