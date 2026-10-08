# ADR-0002: Sahip olunan tek doğruluk kaynağı olarak PostgreSQL

**Tarih:** 2026-10-07  
**Durum:** accepted

## Bağlam

Eski PartOn, birincil kalıcılık için Firestore'a (ve istemci önbelleklerine) dayanıyordu. Bu model ilişkisel bütünlüğü, raporlamayı ve sunucu tarafı uygulamayı zorlaştırdı. Yeniden yapım, kendi işlettiğimiz ve geçişlerini kendimizin yönettiği bir veritabanı gerektiriyor.

## Karar

PartOn alan verilerinin tek doğruluk kaynağı olarak **PostgreSQL** kullanın. Şema ve geçişler API deposunda (veya monorepo içindeki özel veritabanı paketinde) tutulur.

## Alternatifler

### Birincil veritabanı olarak Firestore'u korumak
- **Artıları:** Eski sistemden tanıdık  
- **Eksileri:** “Veritabanımızın sahibi olalım” hedefiyle çelişir; ilişkisel kısıtlar zayıftır  
- **Neden seçilmedi:** Firebase'i arka uç olarak kullanmaktan uzaklaşma yönünde açık ürün/mühendislik kararı

### MongoDB
- **Artıları:** Esnek belgeler  
- **Eksileri:** Birleştirmelere, kısıtlara ve SQL'in coğrafi sorgu/raporlama kolaylığına ihtiyacımız var  
- **Neden seçilmedi:** İlişkisel alan modeli PostgreSQL'e daha uygun

## Sonuçlar

### Olumlu
- Güçlü kısıtlar (benzersiz başvurular, dış anahtarlar, işlemler)
- Açık geçişler ve hazırlık ortamı eşitliği
- Analiz / yönetim sorguları daha kolay

### Olumsuz / riskler
- Geçiş disiplini gerekir
- Coğrafi işlemler için PostGIS kararı gerekebilir (veri katmanı açık sorularına bakın)
- Firestore'dan veri taşıma ayrı bir ürün kararıdır
