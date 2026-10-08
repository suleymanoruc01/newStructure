# 01 — Mimari kararlar (kesinleşen ve açık)

**Durum:** `accepted` (süreç)  
**Son güncelleme:** 2026-10-07  
**Kaynak:** partOn mimari kararları (ekip soru-cevapları)

Bu dosya başlangıçta **kesinleşen** kararları ve **açık** konuları kaydeder. Özellik kapsamı, ayrıntılı alan adları ve derin API/güvenlik tasarımı; uygulama sınırları ve araçlar belirlendikten sonra ele alınır.

> **Nest mi Next mi?** Kaynak karar metninde API + yönetim için Nest.js deniyor, ardından aynı modüler monolit için “Next.js” ifadesi kullanılıyor. PartonYeniMimari bunu **NestJS** olarak yorumlar (API + yönetim tek Nest uygulamasında). Kastedilen gerçekten Next.js ise [ADR-0001](backend/adr/0001-nestjs-modular-monolith.md) açıkça geçersiz kılınmalıdır.

## Kesinleşen başlangıç kararları

| Karar | Ayrıntı |
| --- | --- |
| Monorepo | Tek depo; mobil ve arka uç ayrı klasörlerde ayrı uygulamalardır |
| Ürün | Yarı zamanlı iş arayanları işverenlerle eşleştiren mobil uygulama |
| Kullanıcı grupları (ürün v1) | İş arayanlar (çalışanlar) ve işverenler |
| Arka uç yığını | REST API **ve** yönetim paneli için **NestJS** |
| Dağıtılabilir yapı | API + yönetim paneli **aynı NestJS uygulamasında** çalışır |
| Mobil | React Native (**çıplak**); **iOS ve Android** hedeflenir; **Expo yasak** |
| Pazar | Başlangıçta yalnızca Türkiye; bulut bölgesi henüz seçilmedi |
| Dil | Mobil, arka uç ve paylaşılan paketlerde TypeScript |
| Veritabanı | PostgreSQL |
| Proje boyutu | Zaman içinde geniş / kapsamlı ürün |
| Uygulama sınırları | İki bileşen: **mobil** ve **arka uç** (API + yönetim) |
| Özellik derinliği | Özellik kataloğu daha sonra; önce **mimari sınırlar ve depo yapısı** |
| Barındırma | Bulut sağlayıcısı (belirlenecek) |
| Ekip büyüklüğü | Bu aşamada mimari tercihlerini belirlemez |
| Arka plan işçileri | Başlangıçta ayrı işçi uygulaması/süreci **yok**; gerektiğinde tekrar ele alınır |
| Modüler monolit | Arka uç Nest modülleri halinde düzenlenir; her alan kendi kurallarına ve veri erişimine sahiptir |
| Paylaşılan kurallar | REST API uç noktaları ve yönetim paneli **aynı sunucu tarafı iş kuralı katmanını** kullanır |
| Modül sınırları | Modüller arası bağımlılıklar yalnızca **açık dışa aktarımlar** üzerinden kurulur; iç uygulamaya erişilmez |
| İstemci ↔ sunucu | Yalnızca **REST API** |
| API sürüm yolu | `/api/v1/...`; geriye dönük uyumsuz değişiklikler → yeni ana sürüm (`/api/v2/...`) |
| Paylaşılan paketler | İstek/yanıt şemaları, türetilmiş TS türleri, platformdan bağımsız yardımcılar |
| Yalnızca arka uç | Veritabanı erişimi, iş kuralları, yetkilendirme, sunucu sırları |
| Yalnızca mobil | Ekranlar, gezinme, cihaz işlemleri |
| Mobil ↔ veritabanı | Mobil **veritabanı modellerine bağımlı olmamalı**; yalnızca API sözleşmesi kullanılmalı |
| Paylaşılan paket güvenliği | Paylaşılan paketlerde arka uca özel kod veya gizli bilgi bulunmamalı |
| Doğrulama | Arka uç istekleri çalışma zamanında paylaşılan şemalarla doğrular; geçersiz istekler alan kurallarından önce reddedilir |
| İstemci doğrulaması | Mobil uygulama gönderim öncesi aynı şema kurallarını **yeniden kullanabilir**; bu, sunucu doğrulamasının yerini tutmaz |
| Şema ve AuthZ | Paylaşılan şemalar **veri biçimini** tanımlar; AuthZ ve veritabanı durumu kuralları arka uçta kalır |

## Ölçeklenebilirlik gereksinimi

| Konu | Yaklaşım |
| --- | --- |
| Tasarım amacı | Mimari artan trafiği ve veri hacmini karşılayabilmeli |
| Uzun vadeli hedef | Milyonlar mertebesinde kullanıcıya hizmet vermek |
| Kapasite ölçütü | Toplam kullanıcı sayısı tek başına **kapasite ölçütü değildir**; eşzamanlı aktif kullanıcı / RPS belirlenecek |
| SLO'lar | Gecikme ve kullanılabilirlik hedefleri henüz belirlenmedi |
| Kanıtlama | Yük davranışı kapasite planlaması ve yük testleriyle doğrulanır — mimari seçimi her yükte garanti anlamına gelmez |
| Sonraki kararlar | Yatay ölçekleme, Postgres bağlantı yönetimi, arka plan işleri, önbellek, gözlemlenebilirlik |

## Açık mimari konular

| Kimlik | Konu |
| --- | --- |
| AO-1 | Mobil ve arka ucun bağımsız geliştirme/dağıtım sınırları |
| AO-2 | ~~Expo mu çıplak RN mi~~ → **Kabul edildi: yalnızca çıplak RN; Expo yasak** — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md) |
| AO-3 | Ayrı işçi süreci (ihtiyaç doğana kadar ertelendi) |
| AO-4 | Hedef trafik, veri hacmi, kullanılabilirlik SLO'ları, dağıtım bölgesi |
| AO-5 | Alan modülü adları, veri modeli, yetkilendirme matrisi (özellik kapsamından sonra) |
| AO-6 | Sürüm yolu dışındaki ayrıntılı REST kuralları (hata zarfı, sayfalama, belgeler) |
| AO-7 | Paylaşılan paket adları ve klasör yerleşimi |
| AO-8 | Doğrulama kütüphanesi ve yanıtların çalışma zamanında doğrulanıp doğrulanmayacağı |
| AO-9 | Mobil araçlar, altyapı, dağıtım ve operasyon gereksinimleri |
| AO-10 | Bulut sağlayıcısı |
| AO-11 | Şube **yöneticisinin** birinci sınıf rol mü yoksa işveren yeteneği mi olacağı (vaka kataloğunda yöneticiler var; ürün kararında iki kullanıcı grubu belirtiliyor) |
| AO-12 | Eski mobil istemciler için destek süresi / API kullanımdan kaldırma politikası |

## Netleştirme sırası

1. Uygulama sınırları, monorepo yerleşimi, paylaşılan paketler, dağıtım yaklaşımı  
2. Özellikler kapsamlandığında → alan modülleri, veri modeli, ayrıntılı API/güvenlik

## Yol haritası ve Eyl 2026 önerileri

Teslimat planı: [`02-product-roadmap.md`](02-product-roadmap.md)  
Teknoloji radarı: [`03-tech-radar-2026.md`](03-tech-radar-2026.md)

Bu öneriler bazı açık konuların çözümünü **önerir** (sessizce kesinleştirmez):

| Açık konu | Önerilen varsayılan (ADR / çalıştayda doğrulayın) |
| --- | --- |
| AO-2 | **Kesinleşti:** çıplak React Native — Expo yasak ([ADR-0006](backend/adr/0006-bare-react-native-no-expo.md)) |
| AO-7 | pnpm workspaces + Turborepo; `api-contracts` + `shared-utils` |
| AO-8 | Zod 4 paylaşılan şemaları; alan kurallarından önce Nest çalışma zamanı doğrulaması |
| AO-6 | `{ data, meta }` / `{ error, meta }` zarfı + imleçli akışlar + Nest üzerinden OpenAPI |
| AO-3 | P4'te yük kanıtı oluşana kadar süreç içi outbox kullanımı |
| ADR-0003 | PostgreSQL 18 üzerinde PostgreSQL sürücü bağdaştırıcılı Prisma 7+ |

## İlgili

- Ürün ve çalışma zamanı: [`00-product-and-stack.md`](00-product-and-stack.md)  
- Arka uç ADR'leri: [`backend/adr/`](backend/adr/)  
- REST notları: [`backend/06-api-conventions.md`](backend/06-api-conventions.md)  
- Paylaşılan paketler: [`shared/`](shared/)
