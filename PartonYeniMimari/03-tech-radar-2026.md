# 03 — Teknoloji radarı (Eylül 2026 temeli)

**Durum:** proposed  
**Tarih:** 2026-09 (2026-10-07'de gözden geçirildi)  
**Kapsam:** PartOn'un **kesinleşmiş** sınırlarına uyan seçimler (monorepo, Nest modüler monolit API+yönetim, **çıplak** RN — **Expo yok**, Postgres, REST /api/v1, ilk günden ayrı işçi yok).

Radar halkaları (ThoughtWorks tarzı):

| Halka | Anlamı |
| --- | --- |
| **Benimse** | PartOn'un yeni projesi için varsayılan; engel yoksa kullan |
| **Dene** | Bir denemede / tek modülde kullan; kanıt oluşunca yükselt |
| **Değerlendir** | Takip et; platformu henüz buna bağlama |
| **Beklet** | PartOn v1–v2 için kaçın |

## Anlık görünüm

~~~text
                    BENİMSE
         ┌─────────────────────────┐
         │ NestJS 11 · Postgres 18 │
         │ Çıplak React Native     │
         │ pnpm + Turborepo        │
         │ Zod 4 paylaşılan sözleşmeler│
         │ Prisma 7+ · OTel        │
         │ @nestjs/swagger OpenAPI │
         └───────────┬─────────────┘
                     │
         DENE        │      DEĞERLENDİR
    ┌────────────────┼────────────────┐
    │ Fastify adaptörü│ Nest 12 serisi │
    │ PgBouncer       │ Prisma 8       │
    │ BullMQ işçisi   │ RN Yeni Mimari │
    │ Maestro E2E     │ Drizzle/Kysely │
    └────────────────┴────────────────┘
                     │
                   BEKLET
         Expo / EAS / Expo Router
         GraphQL · ilk gün mikroservisler
         Tek doğruluk kaynağı olarak Firebase
         Yalnızca class-validator DTO'ları
~~~

---

## Platformlar ve çalışma zamanları

| Teknoloji | Halka | Gerekçe (Eyl 2026) |
| --- | --- | --- |
| **Node.js ≥ 20** (tercihen 22 LTS) | Benimse | NestJS 11+ artık Node 16/18'i desteklemiyor |
| **TypeScript 5.x** (Nest, TS 6 dekoratör güvenliğini doğrulayana kadar 5.x'te kal) | Benimse | Nest hâlâ experimentalDecorators + emitDecoratorMetadata kullanıyor |
| **NestJS 11.x** | Benimse | Güncel kararlı modüler monolit; Express 5 / Fastify 5 destekler; JSON günlükleme iyileştirmeleri |
| NestJS 12.x serisi | Değerlendir | Belge dizinlerinde görünmeye başladı; MVP ortasında yükseltmeden önce ekip geçiş kılavuzunu + swagger/zod ekosistemini bekle |
| **PostgreSQL 18** | Benimse | uuidv7(), asenkron G/Ç, skip-scan B-tree — akış/iş indeksleri ve zaman sıralı kimlikler için uygun |
| Redis | Dene | İlk günden değil; ölçümler gerekçe oluşturduğunda hız sınırı/önbellek/kuyruk için ekle |

## Monorepo ve geliştirici deneyimi

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| **pnpm workspaces** | Benimse | Hızlı kurulum; sözleşmeler için workspace:*; Nest DI + çıplak RN Metro birlikte çalışsın diye node-linker=hoisted (veya reflect-metadata'yı hoist et) |
| **Turborepo** | Benimse | Görev grafiği, uzak önbellek, Nest'in ihtiyaç duyduğu derlenmiş paylaşılan paketler için dependsOn: ["^build"] |
| Nx | Değerlendir | Güçlü; iki uygulama + birkaç paket için gerekenden ağır |
| Derlenmiş packages/* → çift CJS/ESM | Benimse | Nest tsc, node_modules içindeki ham TS'yi kullanamaz; API'den önce sözleşmeleri derle |

AO-7 için güçlü bir varsayılan öneri sunar.

## API ve sözleşmeler

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| **REST /api/v1** | Benimse | Kesinleşti (ADR-0004) |
| packages/api-contracts içinde **Zod 4** | Benimse | Mobil ön kontrolü + Nest çalışma zamanı doğrulaması için tek şema kaynağı |
| **nestjs-zod** / Standard Schema → OpenAPI | Benimse | DTO doğrulamasıyla Swagger'ı uyumlu tutar; Nest Swagger'a Standard Schema dönüştürücüleri ekleniyor |
| **@nestjs/swagger** | Benimse | Mobil kod üretimi için resmî OpenAPI üretimi |
| Tek sözleşme olarak class-validator | Beklet | Şemaları çoğaltır; paylaşılan mobil paketleri için daha elverişsiz |
| İstemcilere GraphQL / tRPC / gRPC | Beklet | Genel API için açıkça reddedildi |

AO-6 / AO-8 için önerilen varsayılanları kapatır (zarf/sayfalama kuralları çalıştayda kesinleşecek).

### Önerilen sözleşme varsayılanları (çalıştay → kesinleştir)

~~~http
Authorization: Bearer <access_jwt>
Idempotency-Key: <uuid>   # başvuru, işe giriş, jeton işlemleri
X-Request-Id: <uuid>
~~~

~~~json
{ "data": {}, "meta": { "requestId": "…", "nextCursor": null } }
{ "error": { "code": "STRING_CODE", "message": "…", "details": {} }, "meta": { "requestId": "…" } }
~~~

## Veri erişimi

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| **Prisma ORM 7+** | Benimse | Rust gerektirmeyen motor, sürücü bağdaştırıcıları (@prisma/adapter-pg), projeye özel üretilmiş istemci — NestJS 11 ile uyumlu |
| Prisma 8 (TS yerel yeniden yazımı) | Değerlendir | 2026 ortasında gelişen “güncel” seri; geçiş kılavuzu sorunsuz hâle gelene kadar MVP'nin tek doğruluk kaynağı olarak 7'de kal |
| TypeORM 0.3 | Değerlendir | Nest'e uygun; PartOn için şema-öncelikli yaklaşımı daha zayıf |
| Drizzle / Kysely | Değerlendir | SQL üzerinde iyi denetim; başlangıçta daha fazla ek kod |
| PostGIS | Dene | Yarıçap sorguları enlem/boylam hesabını aştığında etkinleştir |
| Tek doğruluk kaynağı olarak Firebase / Firestore | Beklet | Kesin kararla kullanım dışı (ADR-0002) |

## Mobil

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| **Çıplak React Native** (CLI / community init, sahip olunan ios/ + android/) | Benimse | **Kesinleşti** — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md) |
| **React Navigation** | Benimse | Çıplak RN için standart gezinme (Expo Router yok) |
| RN işaretleriyle RN Yeni Mimarisi (Fabric/TurboModules) | Dene | İsteğe bağlı; yerel bağımlılıklar hazır olduğunda Expo kullanmadan etkinleştir |
| Mağaza derlemeleri için Fastlane / Xcode Cloud / Gradle CI | Benimse | EAS merkezli sürüm yaklaşımını bırak |
| Çıplak derlemelerde Detox veya Maestro | Dene | CI'da Yolculuk 1 duman testi |
| **Expo SDK / Expo Go / EAS / Expo Router / expo-updates** | **Beklet** | Kesin yasak — benimseme |

**AO-2 kapandı:** yalnızca çıplak RN; Expo yasak.

## Yönetim arayüzü (aynı Nest uygulaması)

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| Nest'in sunduğu SPA (React + Vite) veya AdminJS | Dene | Alan servislerini çağırmalı; P0 denemesinde seç (BQ-4) |
| Ayrı Next.js yönetim uygulaması | Beklet (v1) | Daha sonraki bir ADR bu kararı değiştirmedikçe “aynı Nest uygulaması / aynı kurallar” kararını ihlal eder |

## Asenkron işlemler ve ölçek

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| Veritabanı outbox + **süreç içi** tüketim | Benimse | “Başlangıçta ayrı işçi yok” kararıyla uyumlu |
| Nest @Cron / zamanlayıcılar | Benimse | 3 saatlik hatırlatmalar, puanlama zaman aralıkları |
| **BullMQ + Redis** | Dene | Outbox gecikmesi / dağıtım CASE-PERF'i karşılayamazsa yükselt |
| Ayrı işçi süreci | Değerlendir → P4'te dene | AO-3 — kanıta bağlı |
| İlk günden Kafka / NATS | Beklet | Monolit aşaması için gereğinden fazla |

## Gözlemlenebilirlik ve operasyonlar

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| **OpenTelemetry** (HTTP, Nest, pg/Prisma) | Benimse | 2026'da sektör varsayılanı; seçilen sağlayıcıya OTLP |
| Yapılandırılmış JSON günlükleri + requestId | Benimse | RN → API → DB akışını ilişkilendir |
| Prometheus ölçümleri + Grafana | Dene | OTel izleri oluştuktan sonra |
| Bulut sağlayıcısı (Fly / Railway / AWS / GCP / Azure) | Değerlendir | AO-10; yönetilen PostgreSQL 18 + AB/Türkiye'ye yakın bölgeyi tercih et |
| PgBouncer / yönetilen havuzlayıcı | Dene | Nest kopyalarını yatay ölçeklemeden önce |

## Kalite

| Teknoloji | Halka | Gerekçe |
| --- | --- | --- |
| Nest birim testleri için Vitest / Jest | Benimse | Ekip tercihi uygun; P0'da birini seç |
| Nest HTTP e2e (supertest) | Benimse | Kimlik doğrulama + her kritik modül için bir yol |
| RN akışları için **Maestro** veya Detox | Dene | CI'da Yolculuk 1 duman testi |
| Sözleşme testleri (OpenAPI / schemathesis) | Dene | /api/v1'in sessizce bozulmasını önle |
| Yük: k6 / Grafana k6 | Dene | İşçi ayırmadan önce eşik |

## Güvenlik (Türkiye lansmanı)

| Uygulama | Halka |
| --- | --- |
| Birincil OTP; kısa ömürlü JWT + döndürülen yenileme jetonu | Benimse |
| Etkinleştirilirse parolalar için Argon2id / güçlü özetleme | Benimse |
| Cihaz risk sinyalleri + hız sınırları | Dene (P2–P3) |
| policies üzerinden KVKK saklama + rıza sürümleme | Benimse (P3'te süreç) |

---

## Açık konular için önerilen kapanışlar

| Açık kimlik | Önerilen çözüm | Ne zaman kesinleşmeli? |
| --- | --- | --- |
| AO-2 | Çıplak React Native; Expo yasak | **Kabul edildi** — ADR-0006 |
| AO-7 | pnpm + Turborepo; api-contracts, shared-utils paketleri | Depo iskeleti PR'ı |
| AO-8 | Zod 4 paylaşılan şemaları; Nest çalışma zamanı doğrulaması; CI'da isteğe bağlı yanıt ayrıştırma | Sözleşme ADR'si |
| AO-6 | Zarf + imleçli sayfalama + Nest'ten OpenAPI (yol haritası taslağı) | API çalıştayı |
| ADR-0003 | @prisma/adapter-pg ile Prisma 7+ | Arka uç iskeleti |
| AO-3 | P4 yük kanıtı oluşana kadar süreç içinde kal | Performans raporu |
| AO-10 | PostgreSQL 18 + İstanbul/AB bölgesi sunan iki bulut sağlayıcısını kısa listeye al | Operasyon denemesi |

## Karşı radar (bunlara “modernleşmeyin”)

- İtibar için modüler monoliti mikroservislere yeniden yazmak
- Vaka kataloğu REST kaynaklarına eşlenirken “esneklik için” GraphQL eklemek
- Sunucunun yetkisi olmadan “çevrimdışı olsun” diye RN uygulamasına iş kuralları koymak
- Prisma istemcisini mobil uygulamayla paylaşmak
- Geçiş bütçesi olmadan kritik yolun ortasında Nest 12 / Prisma 8'e atlamak
- “Yalnızca derleme için” Expo'yu geri getirmek — yasak

## İlgili

- Ürün yol haritası: [02-product-roadmap.md](02-product-roadmap.md)
- Kesinleşen kararlar: [01-architecture-decisions.md](01-architecture-decisions.md)
- Teknoloji yığını taslağı: [00-product-and-stack.md](00-product-and-stack.md)
