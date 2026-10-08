# Web / yönetim notları

**Durum:** `proposed` (mimari kararlarla uyumlu)  
**Kesinleşen yapı:** Yönetim **paneli**, REST API ile **aynı NestJS uygulamasında** yer alır ve **aynı alan servislerini** kullanır — [ADR-0001](../backend/adr/0001-nestjs-modular-monolith.md).  
**Birincil kullanıcılar:** Platform yöneticileri  
**Mobil öncelikli ürün kullanıcıları:** İş arayanlar ve işverenler React Native kullanır; ayrı bir işveren **web konsolu** başlangıçta kesinleşmiş sınır değildir (daha sonra yeniden değerlendirilebilir).

Çalışanların vardiya günü akışları (işe giriş, konum) **yalnızca mobilde** kalır.

## Bu klasörün kapsamı

Aşağıdaki ekran katalogları vaka kataloğundan gelen yetenek envanterleri olarak kullanılabilir. **Yönetim** ekranlarını Nest tarafından sunulan yönetim paneli hedefleri olarak değerlendirin. Ürün web işveren kanalını yeniden kesinleştirmedikçe **işveren konsolu** ekranlarını isteğe bağlı / geleceğe dönük kabul edin.

## Okuma sırası

| # | Belge | Amaç |
| --- | --- | --- |
| — | [Mimari kararlar](../01-architecture-decisions.md) | Kesinleşen ve açık kararlar |
| 01 | [Bilgi mimarisi](01-information-architecture.md) | Siteler, kabuklar, gezinme |
| 02 | [Ekran kataloğu dizini](02-screen-catalog.md) | Envanter |
| — | [Genel sayfalar ve kimlik doğrulama](screens/public-auth.md) | Açılış, giriş, politikalar |
| — | [İşveren konsolu](screens/employer-console.md) | v1 sınırlarında kesinleşmedi |
| — | [Yönetim konsolu](screens/admin-console.md) | Nest yönetim paneli hedefleri |
| 03 | [Mobil ile eşdeğerlik](03-parity-with-mobile.md) | Kanal sahipliği |
| — | [Vakalar klasörü](../cases/) | İzlenebilirlik |

## Kurallar

Bkz. [`../shared/screen-conventions.md`](../shared/screen-conventions.md).

## Yönetim neden Nest'te?

| Gereksinim | Aynı Nest uygulamasının nedeni |
| --- | --- |
| Kötüye kullanım / kullanıcı kısıtlama | API ile aynı AuthZ + alan servisleri |
| Katalog / uzaktan yapılandırma | Tek kural katmanı |
| Operasyon araçları | Yinelenen arka uç yok |
