# partOn — Mimari Kararları

Bu belge, partOn mimarisini soru ve cevaplarla aşamalı olarak belirlemek için tutulur. Kesinleşen kararlar ile açık konular ayrı kaydedilir.

## Kesinleşen başlangıç kararları

- Proje monorepo yapısında geliştirilecek.
- PartOn, part time iş arayanlar ile işverenleri buluşturan bir mobil uygulama olacak.
- Ürünün kullanıcı grupları iş arayanlar ve işverenler olacak.
- Next.js, backend API ve admin yönetim paneli için kullanılacak.
- Backend API ve admin paneli aynı Next.js uygulamasında birlikte çalışacak.
- Mobil uygulama React Native ile geliştirilecek.
- Mobil uygulama iOS ve Android platformlarını destekleyecek.
- Başlangıç hizmet pazarı yalnızca Türkiye olacak; sunucu bölgesi henüz seçilmedi.
- Mobil, backend ve ortak paketlerde TypeScript kullanılacak.
- Veritabanı PostgreSQL olacak.
- Proje geniş ve kapsamlı olacak.
- Proje iki ayrı bileşenden oluşacak: mobil uygulama ve backend.
- Bu bileşenler aynı monorepo içinde farklı klasörlerde tutulacak; ayrı uygulama yapıları olacak.
- Özelliklerin kapsamı daha sonra ele alınacak. Şu an mimari sınırlar ve proje yapısı belirlenecek.
- Dağıtım için bulut sağlayıcısı kullanılacak; sağlayıcı henüz seçilmedi.
- Proje ekip tarafından geliştirilecek; ekip büyüklüğü şu aşamada mimari kararların belirleyicisi olmayacak.
- Başlangıçta ayrı worker uygulaması veya süreci kurulmayacak. Arka plan işleme ihtiyacı oluştuğunda değerlendirilecek.
- Başlangıç uygulama sınırları mobil uygulama ve API/admin panelini içeren Next.js backend uygulaması olacak.
- Backend, tek Next.js uygulaması içinde modüler monolit olarak düzenlenecek.
- Her iş alanı kendi iş kurallarını ve veri erişimini içeren bir modülde tutulacak. İş alanlarının isimleri özellikler netleştiğinde belirlenecek.
- API endpoint'leri ve admin paneli aynı sunucu tarafı iş kuralları katmanını kullanacak.
- Modüller arası bağımlılıklar açık sınırlar üzerinden kurulacak; modüllerin iç uygulama ayrıntılarına doğrudan erişilmeyecek.

## Ölçeklenebilirlik gereksinimi

- Mimari, gelecekte artan trafik ve veri hacmini karşılayabilecek şekilde tasarlanacak.
- Uzun vadeli hedef milyonlarca kullanıcıya hizmet verebilmek. Eşzamanlı aktif kullanıcı ve istek hacmi tahmini henüz yok; toplam kullanıcı sayısı tek başına kapasite ölçütü olmayacak.
- Trafik hedefleri, gecikme ve erişilebilirlik hedefleri henüz belirlenmedi.
- Yük altında beklenen davranış, kapasite planlaması ve yük testleriyle doğrulanacak. Mimari seçimi tek başına her trafik seviyesinde sorunsuz çalışma garantisi olarak değerlendirilmeyecek.
- Yatay ölçekleme, PostgreSQL bağlantı yönetimi, arka plan işleri, önbellek ve gözlemlenebilirlik yaklaşımı sonraki kararlarda netleştirilecek.

## Ortak kod ve uygulama sınırları

- Ortak paketlerde API istek/yanıt şemaları, bu şemalardan türetilen TypeScript tipleri ve platformdan bağımsız yardımcılar tutulacak.
- Veritabanı erişimi, iş kuralları, yetkilendirme ve sunucu sırları backend'e özel olacak.
- Ekranlar, navigasyon ve cihaz işlemleri mobil uygulamaya özel olacak.
- Mobil uygulama veritabanı modellerine doğrudan bağımlı olmayacak; backend ile API sözleşmesi üzerinden iletişim kuracak.
- Ortak paketler backend'e özel kodu veya sunucu sırlarını içermeyecek.

## API yaklaşımı

- Mobil uygulama ile backend arasındaki iletişim REST API üzerinden sağlanacak.
- API istek/yanıt sözleşmeleri ortak paketlerde tanımlanacak.
- REST API endpoint'leri `/api/v1/...` biçiminde sürümlenecek.
- Geriye uyumsuz API değişiklikleri yeni bir ana sürüm üzerinden sunulacak. Eski mobil sürümlerin destek süresi ve API sürümlerinin kaldırılma politikası daha sonra belirlenecek.
- API istekleri backend'de çalışma anında ortak şemalar kullanılarak doğrulanacak. Geçersiz istekler iş kuralları çalıştırılmadan reddedilecek.
- Mobil uygulama aynı doğrulama kurallarını kullanıcı girdilerini göndermeden önce kontrol etmek için kullanabilecek. Mobil doğrulama backend doğrulamasının yerini almayacak.
- Paylaşılan doğrulama şemaları veri biçimini tanımlayacak; yetkilendirme ve veritabanı durumuna bağlı iş kuralları backend'de kalacak.
- Doğrulama kütüphanesi ve API yanıtlarının çalışma anında doğrulanma politikası henüz seçilmedi.
- Hata formatı, sayfalama ve dokümantasyon yaklaşımı henüz belirlenmedi.

## Açık mimari konular

- Mobil uygulama ve backend'in bağımsız geliştirme ve dağıtım sınırları.
- React Native için Expo veya doğrudan native proje yaklaşımı.
- Ayrı worker eklenmesi gelecekteki ihtiyaca ertelendi.
- Hedef trafik, veri hacmi, erişilebilirlik ve dağıtım bölgesi.
- İş alanları, veri modeli ve yetkilendirme ihtiyaçları.
- REST API standartları ve ortak paketlerin adları/klasör düzeni.
- Mobil geliştirme araçları, altyapı, dağıtım ve operasyon gereksinimleri.

## Netleştirme süreci

Önce uygulama sınırları, geliştirme araçları, ortak paketler ve dağıtım yaklaşımı belirlenecek. Özellikler ele alındığında iş alanları, veri modeli ve ayrıntılı API/güvenlik gereksinimleri bu yapıya göre tasarlanacak.
