# Mobil ekranlar ve gezinme

**Yığın:** Çıplak React Native (iOS + Android) — sahip olunan `ios/` ve `android/`  
**Araçlar:** **Expo yasak** — [ADR-0006](../backend/adr/0006-bare-react-native-no-expo.md)  
**API:** Paylaşılan Zod şemaları üzerinden NestJS REST `/api/v1` — [backend/06-api-conventions.md](../backend/06-api-conventions.md)  
**Yol haritası:** [P0–P4](../02-product-roadmap.md) içindeki mobil dilimler  
**Durum:** `proposed` (özellik kapsamı belirlenene kadar ekranlar geçici)  
**Hedef kitle:** İş arayanlar (çalışanlar), işverenler

[`parton-codebase-wiki/04-screens-and-views.md`](../../parton-codebase-wiki/04-screens-and-views.md) içindeki eski Kotlin ekranları bire bir taşıma haritası değil, **yetenek referanslarıdır**.

## Sınırlar

- Ekranlar, gezinme ve cihaz işlemleri **yalnızca** mobil uygulamada yer alır.
- Mobil uygulama veritabanı modellerini veya arka uç iç bileşenlerini içe **aktarmamalıdır**.
- Sunucuyla yalnızca REST sözleşmesi üzerinden konuşulur; gönderim öncesi doğrulama için paylaşılan şemalar isteğe bağlı kullanılabilir (sunucu doğrulaması yetkilidir).
- Bu uygulamaya Expo SDK, Expo Router, EAS veya Expo Go **eklemeyin**.

## Okuma sırası

| # | Belge | Amaç |
| --- | --- | --- |
| — | [Mimari kararlar](../01-architecture-decisions.md) | Kesinleşen ve açık kararlar |
| 01 | [Bilgi mimarisi](01-information-architecture.md) | Gezinme grafikleri, sekmeler, eşikler |
| 02 | [Ekran kataloğu dizini](02-screen-catalog.md) | Tam envanter + MVP |
| — | [Kimlik doğrulama ekranları](screens/auth.md) | Giriş / OTP / rol / politikalar |
| — | [Çalışan ekranları](screens/worker.md) | Akış, başvuru, vardiya, profil |
| — | [İşveren ekranları](screens/employer.md) | Şubeler, işler, adaylar |
| — | [Yönetici ekranları](screens/manager.md) | Şubeyle sınırlı operasyonlar (AO-11 rolü) |
| — | [Paylaşılan / sistem](screens/shared-system.md) | Ayarlar, bildirimler, engeller |
| — | [Vakaların gerektirdiği eklemeler](screens/case-driven-additions.md) | Belgeler, anlaşmazlık, doğrulama |
| 03 | [Akışlar ve derin bağlantılar](03-flows-and-deep-links.md) | Uçtan uca yolculuklar |
| — | [Vakalar klasörü](../cases/) | Tüm katalog izlenebilirliği |

## Kurallar

Bkz. [`../shared/screen-conventions.md`](../shared/screen-conventions.md).

## Önerilen RN klasör eşlemesi (gelecek kod)

```text
apps/mobile/
  ios/                   # sahip olunan yerel proje
  android/               # sahip olunan yerel proje
  src/
    app/                 # gezinme kökleri (React Navigation)
    features/
      auth/
      worker/
      employer/
      shared/
```
