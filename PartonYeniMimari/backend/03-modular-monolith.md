# 03 — NestJS modüler monoliti

**Durum:** accepted  
**Son güncelleme:** 2026-10-07  
**Nest başvuruları:** [Modüller](https://docs.nestjs.com/modules), [Dinamik modüller](https://docs.nestjs.com/fundamentals/dynamic-modules)

## Kurallar

1. **Kök AppModule** yalnızca özellik/altyapı modüllerini içe aktarır; alan mantığı burada bulunmaz.
2. **Her özellik modülü bir klasördür**: src/modules/<name>/ altında.
3. **Varsayılan olarak kapsülle** — diğer modüller yalnızca dışa aktardıklarını içe alabilir.
4. **Kopyalamak yerine içe aktarımla paylaş** — UsersService bir kez dışa aktarılır; gerektiği yerde UsersModule içe alınır.
5. Yapılandırma gerektiren **altyapı modülleri dinamiktir** (DatabaseModule.forRoot(), ConfigModule.forRoot()).
6. **Dairesel içe aktarma yok** — A↔B bağı varsa küçük bir paylaşılan modül çıkarın veya olay kullanın.

## Standart özellik modülü yapısı

~~~text
modules/jobs/
  jobs.module.ts
  jobs.controller.ts
  jobs.service.ts
  dto/
  entities/          # veya Prisma modelleri başka yerdedir — veri katmanına bakın
  policies/          # bu alanın yetkilendirme yardımcıları
  jobs.constants.ts
  jobs.module.spec.md  # isteğe bağlı: vaka bağlantıları + değişmezler (notlar)
~~~

Module üst verisi:

| Alan | Kullanım |
| --- | --- |
| controllers | Bu alanın REST HTTP giriş noktaları (/api/v1) |
| providers | Burada kapsanan servisler, depolar, eşleyiciler, koruyucular |
| imports | İhtiyaç duyulan dışa aktarılmış sağlayıcılara sahip diğer modüller |
| exports | Modülün genel arayüzü (genellikle servisler, nadiren denetleyiciler) |

## Modül içi katmanlar

~~~mermaid
flowchart TB
  C[Denetleyici] --> S[Uygulama servisi]
  S --> R[Depo / Prisma]
  S --> E[Alan yardımcıları / politikalar]
  R --> PG[(PostgreSQL)]
  C --> G[Koruyucular / pipe'lar]
~~~

- Denetleyiciler: REST rotaları, DTO doğrulama, HTTP durum kodları ([06-api-conventions.md](06-api-conventions.md) dosyasına bakın)
- Servisler: kullanım senaryoları / işlemler
- Depolar: yalnızca kalıcılık (Prisma istemcisi doğrudan kullanılıyorsa ince tutun; sorgu yardımcılarını yine denetleyicilerden çıkarın)

## Yatay modüller

| Modül | Sorumluluk |
| --- | --- |
| ConfigModule | Türlenmiş ortam yapılandırması |
| DatabaseModule | ORM istemcisi |
| AuthModule | OTP, JWT üretme/doğrulama, stratejiler |
| CommonModule | Filtreler, günlükleme, ilişkilendirme kimliği |
| HealthModule | Canlılık / hazır olma |
| QueueModule | Etkinleştirildiğinde BullMQ / benzeri |

## İçe aktarma grafiği (hedef)

~~~mermaid
flowchart LR
  App --> Auth
  App --> Users
  App --> Employers
  App --> Branches
  App --> Workers
  App --> Jobs
  App --> Applications
  App --> Matching
  App --> Shifts
  App --> Location
  App --> Ratings
  App --> Favorites
  App --> Notifications
  App --> Policies
  Auth --> Users
  Applications --> Jobs
  Applications --> Workers
  Matching --> Jobs
  Matching --> Workers
  Matching --> Location
  Shifts --> Applications
  Shifts --> Location
  Ratings --> Shifts
  Notifications --> Users
~~~

Grafik yoğunlaşırsa servisler arasında derin bağımlılık kurmak yerine **alan olaylarını** tercih edin ([08-async-events.md](08-async-events.md)).

## Kodlama kuralları

- Denetleyici rota önekleri: /api/v1/<resource>
- Yönetim arayüzü aynı dışa aktarılmış alan servislerini çağırır (paralel kural katmanı yok)
- Servis metotlarını fiillerle adlandırın: createJob, submitApplication
- Uygulama katmanında Nest HTTP istisnaları fırlatın; alan hatalarını tek noktada eşleyin
- Kurucu üzerinden bağımlılık eklemeyi tercih edin; ileri durumlar dışında ModuleRef kullanmayın
- Modüller arası bağımlılıklar yalnızca exports üzerinden; başka modülün iç bileşenlerine erişmeyin

## Karşı örüntüler

- Tüm kullanım senaryolarını barındıran dev AppService
- “Tek bir koleksiyon için” Firebase / Firestore istemcisi içe aktarmak
- Varsayılan olarak dairesel forwardRef kullanmak — kötü koku kabul edin
- Denetleyicilerin alanlar arasında doğrudan Prisma çağırması
- Servisleri çağırmak yerine yönetim arayüzünün alan kurallarını yeniden uygulaması
- İhtiyaç kanıtlanmadan ayrı işçi süreci
