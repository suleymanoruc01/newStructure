# ADR-0004: Genel API olarak REST / JSON

**Tarih:** 2026-10-07  
**Durum:** accepted

## Bağlam

React Native uygulaması, NestJS arka ucuyla kararlı ve sürümlü bir sözleşme üzerinden iletişim kurmalıdır. Eski PartOn, Firebase istemci SDK'ları ve dinleyiciler kullanıyordu. Paylaşılan istek/yanıt şemaları monorepo paketlerinde tutulacak ve sunucuda çalışma zamanında (isteğe bağlı olarak istemcide gönderim öncesinde de) uygulanacaktır.

## Karar

PartOn'un mobil uygulamaya dönük **tüm yeteneklerini**, HTTPS üzerinden sürümlü **REST / JSON API** olarak sunun:

- Kaynak odaklı URL'ler /api/v1/... altında
- Geriye dönük uyumsuz değişiklikler yeni ana sürüm yoluyla yayımlanır (/api/v2/...)
- İstek/yanıt **şemaları ve türetilmiş TypeScript türleri** paylaşılan paketlerde yer alır
- Mobil için genel sınır Nest denetleyicileridir (istemcilere GraphQL, gRPC veya tRPC yok)
- Yönetim arayüzü **aynı Nest alan servislerini** çağırır (süreç içinde); kullanışlı olduğunda REST de kullanabilir ama ikinci bir kural katmanı oluşturamaz

Modüller arası dahili çağrılar süreç içinde kalır. Gerçek zamanlı push FCM/APNs olarak kalır. Ayrı işçi süreci ertelendi.

**Hâlâ açık** ([01-architecture-decisions.md](../../01-architecture-decisions.md) dosyasına bakın): hata zarfı, sayfalama biçimi, belgeleme yaklaşımı, doğrulama kütüphanesi, yanıt doğrulama politikası, eski istemciler için kullanımdan kaldırma süreleri.

## Alternatifler

### GraphQL
- **Artıları:** Esnek istemci sorguları  
- **Eksileri:** AuthZ karmaşıklığı; komut ağırlıklı personel akışlarına daha az uygun  
- **Neden seçilmedi:** REST kesinleşti

### Mobil için gRPC / Connect-RPC
- **Artıları:** Güçlü türleme, verimli ikili biçim  
- **Eksileri:** RN araçları + paylaşılan JSON şemalarında sürtünme  
- **Neden seçilmedi:** REST + paylaşılan TS şemaları tercih edildi

### Firebase / BaaS tarzı SDK'yı yeniden kullanmak
- **Artıları:** İstemciyi hızlı başlatır  
- **Eksileri:** Sahiplik ve kural uygulama sorunlarını tekrarlar  
- **Neden seçilmedi:** İş kurallarının sahibi sunucu olmalı

## Sonuçlar

### Olumlu
- Mobil sürümleri için açık /api/v1 sürümleme yaklaşımı
- Paylaşılan şemalar, veritabanı modellerini paylaşmadan mobil ve arka ucu uyumlu tutar
- Rota/koruyucu düzeyinde AuthZ anlaşılır kalır

### Olumsuz / riskler
- Zarf / sayfalama / OpenAPI ayrıntıları henüz belirlenmedi — AO-6/AO-8 kapanana kadar taslak kuralları değişmez kabul etmeyin
