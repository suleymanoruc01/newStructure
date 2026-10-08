# PartOn Yeni Mimari — Geliştirme Notları

**PartOn** yeniden yapımı için güncel notlar: **React Native** (iOS/Android) ve **NestJS** modüler monoliti (REST API + yönetim paneli), PostgreSQL ve TypeScript içeren monorepo.

**Mimari kararlar (kesinleşen ve açık):** [`01-architecture-decisions.md`](01-architecture-decisions.md)  
**Ürün yol haritası:** [`02-product-roadmap.md`](02-product-roadmap.md)  
**Teknoloji radarımız (Eyl 2026):** [`03-tech-radar-2026.md`](03-tech-radar-2026.md)

**Kabul testlerinin omurgası:** [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) içindeki 248 vakanın tümü [`cases/`](cases/) altında izlenir. Özellik kapsamı yol haritası aşamalarına göre belirlenir; vaka belgeleri kabul eşlemesi olarak kalır.

Eski Kotlin / Firebase uygulaması yalnızca referans amaçlıdır: [`../parton-codebase-wiki/`](../parton-codebase-wiki/).

## Teknoloji yığını

| Katman | Seçim | Notlar |
| --- | --- | --- |
| Depo | Monorepo | Kesinleşti — [ADR-0005](backend/adr/0005-monorepo.md) |
| Mobil | Çıplak React Native (iOS + Android) | **Kesinleşti — Expo yok** ([ADR-0006](backend/adr/0006-bare-react-native-no-expo.md)) |
| Arka uç | NestJS 11 modüler monolit | Aynı uygulamada REST `/api/v1` **ve yönetim paneli** |
| Genel API | REST / JSON | Kesinleşti — [ADR-0004](backend/adr/0004-rest-json-api.md) |
| Sözleşmeler | Paylaşılan Zod 4 şemaları | **Öneri** — AO-8 |
| Paylaşılan paketler | Şemalar / TS türleri / yardımcılar | Gizli bilgi ve veritabanı kodu içermez |
| Veritabanı | PostgreSQL 18 + Prisma 7+ | PostgreSQL kesinleşti; Prisma **öneri** |
| Monorepo aracı | pnpm + Turborepo | **Öneri** — AO-7 |
| İşçiler | Başlangıçta yok | Ayrı işçi P4'e ertelendi |
| Gözlemlenebilirlik | OpenTelemetry | **Öneri**; P0'dan itibaren |
| Pazar / bölge | Türkiye / bulut bölgesi belirlenecek | Bölge `open` |

## Belge ağacı

```text
PartonYeniMimari/
├── README.md
├── 00-product-and-stack.md
├── 01-architecture-decisions.md   ← kesinleşen ve açık kararlar
├── 02-product-roadmap.md          ← aşamalı teslimat (P0–P4)
├── 03-tech-radar-2026.md          ← Eyl 2026: benimse / dene / beklet
├── cases/                         ← 248 vakanın kapsamı (kabul)
├── backend/                       ← Nest modüler monolit notları
├── mobile/                        ← RN ekranları (özellik kapsamı belirlenene kadar geçici)
├── web/                           ← yönetim/işveren web notları (yönetim → Nest uygulaması)
└── shared/                        ← yatay konular + paket sınırları
```

## Hedef kod yerleşimi (gelecekteki monorepo)

```text
apps/
  mobile/                 # React Native
  backend/                # NestJS — REST /api/v1 + yönetim paneli
packages/
  api-contracts/          # istek/yanıt şemaları + türetilmiş türler (ad belirlenecek)
  shared-utils/            # yalnızca platformdan bağımsız yardımcılar (ad belirlenecek)
```

Kesin paket adları / monorepo aracı: `open` (AO-7).

## Nasıl kullanılır?

1. [`01-architecture-decisions.md`](01-architecture-decisions.md) — kesinleşen ve açık kararlar  
2. [`02-product-roadmap.md`](02-product-roadmap.md) — hangi aşamada ne geliştirilecek  
3. [`03-tech-radar-2026.md`](03-tech-radar-2026.md) — Eyl 2026 teknoloji varsayılanları  
4. [`00-product-and-stack.md`](00-product-and-stack.md) — ürün ve çalışma zamanı taslağı  
5. [`backend/`](backend/) — Nest modülleri, REST, veri  
6. [`shared/`](shared/) — sözleşme paketi kuralları  
7. [`cases/`](cases/) — özellik geliştirirken kabul eşlemesi  
8. [`mobile/`](mobile/) — ekran envanteri (geçici)  

## Durum açıklamaları

| Durum | Anlamı |
| --- | --- |
| `accepted` | Buna göre uygulayın |
| `proposed` | Güçlü varsayılan; kodlamadan önce doğrulayın |
| `open` | Karar gerekiyor |
| `legacy-ref` | Yalnızca eski uygulama için |
| `covered` / `partial` / `gap` | Vaka ↔ mimari eşleme durumu |

## Katalog hizalama özeti

| Öğe | Sayı |
| --- | --- |
| Belgelenen vaka grupları | 19 |
| Matristeki vakalar | 248 |
| Mobil ekranlar (geçici) | 69 |
| Web / yönetim ekranları (geçici) | 45 |
| Arka uç kuralı derin incelemeleri | Jetonlar, eşleştirme, konum (+ alan modülleri) |

Kalan ürün kararları için [`cases/01-gap-backlog.md`](cases/01-gap-backlog.md) dosyasına bakın.
