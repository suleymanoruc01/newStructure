# ADR-0005: Ayrı mobil ve arka uç uygulamalarını içeren monorepo

**Tarih:** 2026-10-07  
**Durum:** accepted

## Bağlam

PartOn'un iki temel bileşeni var: React Native mobil uygulaması ve NestJS arka ucu (REST API + yönetim). Ekip, sunucu sırlarını veya veritabanı modellerini istemciye sızdırmadan paylaşılan API şemalarına/türlerine ihtiyaç duyuyor. Ayrı Git depoları sözleşmeleri çoğaltır ve yatay değişiklikleri yavaşlatır.

## Karar

PartOn'u **tek bir monorepo** içinde geliştirin:

- `apps/mobile` — React Native (iOS + Android)
- `apps/backend` — NestJS modüler monolit (REST `/api/v1` + yönetim paneli)
- `packages/*` — yalnızca paylaşılan sözleşmeler ve platformdan bağımsız yardımcılar

Kesin monorepo aracı (pnpm workspaces, Nx, Turborepo vb.) `open` durumunda kalır ([AO-7](../../01-architecture-decisions.md)). Mobil ve arka uç için bağımsız dağıtım hatları da `open` durumundadır ([AO-1](../../01-architecture-decisions.md)).

## Alternatifler

### Ayrı depolar
- **Artıları:** Dağıtımın kesin biçimde yalıtılması  
- **Eksileri:** API sözleşmelerinin sürümleri ayrışabilir; eşgüdümlü yeniden düzenleme zorlaşır  
- **Neden seçilmedi:** Paylaşılan şema paketleri kesinleşmiş bir gereksinim

### Tek uygulama klasörü (mobil + API iç içe)
- **Artıları:** Daha az paket  
- **Eksileri:** Sahiplik sınırlarını bulanıklaştırır; veritabanı kodunun mobile alınma riski  
- **Neden seçilmedi:** Açık uygulama sınırları kesinleşti

## Sonuçlar

### Olumlu
- `/api/v1` şemaları ve türetilmiş TS türleri tek yerde bulunur
- “Paylaşılanlarda sır / veritabanı yok” kuralı paket sınırlarıyla uygulanabilir
- Gerektiğinde vakaya dayalı değişiklikler mobil + API'yi tek PR'da kapsayabilir

### Olumsuz / riskler
- Monorepo CI karmaşıklığı — yola göre filtrelenmiş hatlarla azaltın (AO-1)
- Mobilin `apps/backend` paketini asla içe aktarmaması için paket grafiği disiplini gerekir
