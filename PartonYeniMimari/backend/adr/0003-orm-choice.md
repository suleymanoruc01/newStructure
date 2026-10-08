# ADR-0003: ORM seçimi

**Tarih:** 2026-10-07  
**Durum:** proposed  
**Teknoloji radarı:** [../../03-tech-radar-2026.md](../../03-tech-radar-2026.md)

## Bağlam

NestJS, PostgreSQL üzerinde tür güvenli ve birinci sınıf geçiş desteği olan veri erişim katmanına ihtiyaç duyar. 2026 ortası/sonu itibarıyla Prisma ORM 7 Rust gerektirmez, sürücü bağdaştırıcıları kullanır ve istemciyi projeye üretir (moduleFormat = "cjs" ile NestJS 11 + CommonJS uyumlu). PostgreSQL 18; pazaryeri akışlarına uygun uuidv7() ve gelişmiş indeks/tarama davranışı sunar.

## Karar (öneri)

Aşağıdakilerle **Prisma ORM 7+** kullanın:

- Sürüme alınmış Prisma şeması + Prisma Migrate
- PostgreSQL 18 üzerinde @prisma/adapter-pg (veya güncel PostgreSQL sürücü bağdaştırıcısı)
- DatabaseModule içinde Nest PrismaService yaşam döngüsü
- Sıralama/indeks yerelliğinin yararlı olduğu yerlerde (işler, başvurular, olaylar) UUIDv7 genel kimlikleri

API deposunu iskeletlendirmeden önce doğrulayın. Prisma 8'i ancak özel bir geçiş denemesinden sonra değerlendirin (Assess halkası).

## Alternatifler

### TypeORM 0.3
- **Artıları:** NestJS belgeleri/örnekleri kapsamlı; dekoratörlü varlıklar  
- **Eksileri:** Paylaşılan sözleşmeler / geçiş disiplini için şema-öncelikli yaklaşım daha zayıf  
- **Şimdilik neden seçilmedi:** Yeni proje açıklığı için Prisma tercih ediliyor

### Drizzle / Kysely / ham pg
- **Artıları:** SQL üzerinde en yüksek denetim  
- **Eksileri:** Başlangıçta daha fazla ek kod; MVP yavaşlar  
- **Neden seçilmedi:** P0–P2 hızı için erken optimizasyon

### Hemen Prisma 8
- **Artıları:** TypeScript yerel yeni yön  
- **Eksileri:** Kanıtlanmış 7.x Nest yollarına göre ekosistem / Nest tarifleri henüz oturuyor  
- **Henüz neden seçilmedi:** Kullanım kılavuzu sıradanlaşana kadar Assess halkasında kalsın

## Sonuçlar

### Olumlu
- Belgeleme işlevi gören açık şema dosyası
- Öngörülebilir geçişler; Nest servisleri için güçlü üretilmiş türler
- Teknoloji radarındaki Eyl 2026 Nest + PostgreSQL temeliyle uyumlu

### Olumsuz / riskler
- Gelişmiş PostgreSQL özellikleri ham SQL gerektirebilir
- Nest + Prisma DI bağlantısı standartlaştırılmalı
- Mobil Prisma istemcisini asla içe aktarmamalı (paket sınırı)

## Takip
- Kabul edilirse: Nest PrismaService yaşam döngüsünü [../05-data-layer.md](../05-data-layer.md) içinde belgeleyin
- TypeORM/Drizzle seçilmezse: bu ADR'yi geçersiz kılın ve veri katmanı notlarını güncelleyin
