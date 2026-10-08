# 01 — Arka uca genel bakış

**Durum:** `accepted`  
**Son güncelleme:** 2026-10-07  
**Kararlar:** [`../01-architecture-decisions.md`](../01-architecture-decisions.md)

## Görev

Şunları sağlayan tek bir NestJS uygulaması sunmak:

- PartOn iş kurallarının sahibi olmak (**REST API** ve **yönetim paneli** tarafından paylaşılır)
- Tüm güvenilir durumu PostgreSQL'de kalıcılaştırmak
- React Native istemcisine sürümlü **REST / JSON** (`/api/v1`) sunmak
- Özellikler geliştirildiğinde kabul testleri için Parton vaka gruplarıyla eşlenebilir kalmak

## Mimari tarz

**Modüler monolit** (mikroservis değil) — [ADR-0001](adr/0001-nestjs-modular-monolith.md); REST — [ADR-0004](adr/0004-rest-json-api.md); monorepo — [ADR-0005](adr/0005-monorepo.md).

Nest uygulamayı bir modül grafiği olarak düzenler: her modül REST denetleyicilerini (gereken yerde yönetim arayüzlerini), sağlayıcıları kapsüller ve diğer modüllerin kullanması için herkese açık bir arayüz dışa aktarır. Modüller arası erişim yalnızca `exports` + `imports` ile kurulur; başka modülün iç bileşenlerine doğrudan erişilmez.

Önce monolit tercihinin nedenleri:

- Alan akışı sıkı biçimde bağlıdır (iş → başvuru → eşleştirme → işe giriş → puanlama)
- API ve yönetim paneli tek kural katmanını paylaşmalıdır
- İhtiyaç kanıtlanana kadar ayrı işçi süreci ertelenir
- Ekip büyüklüğü belirleyici değildir; açık modül sınırları daha sonra ayırmayı mümkün kılar

## Tasarım ilkeleri

| İlke | Uygulama |
| --- | --- |
| Alan modülleri | Her sınırlı bağlam için bir Nest modülü (adlar özellik kapsamıyla kesinleşir) |
| İnce REST denetleyicileri | Paylaşılan şemalarla doğrula + HTTP eşlemesi yap; kullanım senaryoları servislerde |
| Yönetim için de aynı kurallar | Yönetim arayüzü alan servislerini çağırır; paralel iş mantığı yok |
| Açık dışa aktarımlar | Modüller arası erişim yalnızca dışa aktarılan sağlayıcılarla |
| Veritabanı sahipliği | Şema + geçişler depoda; mobil modelleri içe aktarmaz |
| Sınırda AuthZ | Veri değiştiren rotalarda ve yönetim eylemlerinde koruyucular/politikalar |
| İlk gün ayrı işçi uygulaması yok | Önce süreç içi / outbox; yük gerektirdiğinde işçi ekle |
| Vakalarla bağlantı | Özellik uygularken ilişkili `CASE-*` gruplarını belirt |

## Kalite eşikleri (arka uç v1)

- TypeScript strict modu
- Alan kurallarından önce **paylaşılan şemalarla** gelen veriyi doğrulama (kütüphane `open` — AO-8)
- Alan servisleri için birim testleri; kimlik doğrulama + kritik akışlar için HTTP e2e testleri
- Her şema değişikliğinde zorunlu geçiş
- Tek doğruluk kaynağı olarak Firebase Admin SDK kullanılmaz

## Sonraki kararlara kadar kapsam dışı

- Kesin bulut sağlayıcısı / bölgesi
- Kesin SMS sağlayıcısı
- Tam ERD (özellik ve alan çalıştaylarından sonra)
- Ayrı işçi / kuyruk ürünleştirmesi
- Hata zarfı, sayfalama, OpenAPI politikası (AO-6)

## Açık sorular

| Kimlik | Soru | Durum |
| --- | --- | --- |
| BQ-1 | Monorepo | **Kabul edildi** — [ADR-0005](adr/0005-monorepo.md) |
| BQ-2 | Prisma mı TypeORM mu? | Bkz. [ADR-0003](adr/0003-orm-choice.md) |
| BQ-3 | İlk günden Redis / önbellek | Açık (ölçeklenebilirlik takip işleri) |
| BQ-4 | Yönetim arayüzü sunumu (Nest'in sunduğu SPA, AdminJS, …) | Açık |
| BQ-5 | Monorepo aracı (pnpm / Nx / Turborepo) | Açık (AO-7) |
