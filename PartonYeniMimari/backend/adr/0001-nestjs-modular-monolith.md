# ADR-0001: NestJS modüler monoliti (API + yönetim)

**Tarih:** 2026-10-07  
**Durum:** accepted

## Bağlam

PartOn, Kotlin + Firebase mimarisinden ayrılıyor. İş kurallarının sahibi olan ve bunları hem mobil REST API hem de yönetim paneli üzerinden sunan bir arka uca ihtiyacımız var. İlk teslimatta mikroservisler yerine tek bir dağıtılabilir uygulama tercih edilir. Belirleyici olan ekip büyüklüğü değil, alanların sıkı bağı ve kuralların ortak olmasıdır.

## Karar

**Modüler monolit** olarak düzenlenmiş **tek bir NestJS uygulaması** oluşturun:

- Açık imports / exports kullanan özellik modülleri
- Şunları barındıran tek dağıtılabilir uygulama:
  - Mobil için sürümlü **REST API** (/api/v1/...)
  - **Aynı** alan servislerini kullanan yönetim paneli (yinelenen kural katmanı yok)
- Başlangıçta ayrı işçi süreci yok (arka plan yükü gerektirdiğinde yeniden değerlendirin)
- Alan modülü **adları** özellik kapsamıyla kesinleşir; yapı ve sınırlar şimdi belirlenir

Modüller arası erişim yalnızca dışa aktarılan sağlayıcılar üzerinden olur; başka modülün iç bileşenlerine erişilmez.

## Alternatifler

### İlk günden mikroservisler
- **Artıları:** Bağımsız ölçekleme/dağıtım  
- **Eksileri:** Operasyon yükü, dağıtık işlemler, daha yavaş teslimat  
- **Neden seçilmedi:** Alanlar sıkı biçimde bağlı; ayrı işçi/servis ihtiyacı kanıtlanana kadar ertelendi

### Ayrı Nest API + ayrı web yönetimi (ör. Next.js yönetim uygulaması)
- **Artıları:** Arayüz teknolojisinde özgürlük  
- **Eksileri:** Alan kurallarını çoğaltma veya atlama riski  
- **Neden seçilmedi:** Kesin karar — API ve yönetim aynı Nest uygulamasını ve kural katmanını paylaşır

### Yalnızca sunucusuz işleyiciler (Nest yok)
- **Artıları:** Boşta kalma maliyeti düşük  
- **Eksileri:** Modül sınırları ve paylaşılan alan mantığı daha zayıf  
- **Neden seçilmedi:** Nest modül modeli modüler monolit gereksinimine uyuyor

## Sonuçlar

### Olumlu
- AuthZ ve iş kuralları için tek yer (API + yönetim)
- Hızlı yerel geliştirme ve paylaşılan işlemler
- Gerekirse daha sonra modül veya işçi ayırmak için açık yol

### Olumsuz / riskler
- “Çamur yığını” oluşmaması için disiplin gerekir
- Nest'in barındırdığı yönetim arayüzü için sunum yaklaşımı belirlenmeli (SSR, statik SPA, AdminJS vb.) — araç open
- API + yönetim tek dağıtım birimidir — güçlü modül sahipliğiyle risk azaltılır
