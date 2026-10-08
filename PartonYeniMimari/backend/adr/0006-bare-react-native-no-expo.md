# ADR-0006: Çıplak React Native — Expo yasak

**Tarih:** 2026-10-07  
**Durum:** accepted

## Bağlam

PartOn mobil uygulaması, yerel modüller (konum/coğrafi çit, push, güvenli depolama) üzerinde tam denetimle iOS ve Android'i desteklemelidir. Ekip Expo'yu ve Expo tarafından yönetilen araç zincirlerini (Expo Go, zorunlu EAS yolu, Expo Router, uygulama temeli olarak `expo-*` SDK'sı) reddeder.

## Karar

Mobil uygulamayı **çıplak React Native** olarak geliştirin (React Native CLI / community CLI ile başlatma, sahip olunan `ios/` ve `android/` projeleri).

**PartOn için yasak olanlar:**

- Uygulama çatısı olarak Expo SDK
- Expo Go
- Gezinme temeli olarak Expo Router
- Sürüm modeli olarak `expo-updates` / EAS Update
- Uygulamanın bir “Expo projesi” olmasını gerektiren her şey

Yerel derlemeler, imzalama ve CI için standart RN + Xcode / Android Gradle kullanılır (Fastlane veya eşdeğeri uygundur). React Native **Yeni Mimarisi**, ekip seçtiğinde RN'nin kendi araçlarıyla yine etkinleştirilebilir — Expo'dan bağımsızdır.

## Alternatifler

### Expo (managed veya prebuild / geliştirme istemcisi)
- **Artıları:** Daha hızlı başlangıç, EAS bulut derlemeleri  
- **Eksileri:** Ürün/mühendislik talimatıyla reddedildi  
- **Neden seçilmedi:** Kesin yasak — bu ADR'nin yerini alan yeni bir ADR olmadan tekrar gündeme getirmeyin

## Sonuçlar

### Olumlu
- Yerel projeler ve bağımlılıklar tamamen sahiplenilir
- GPS / işe giriş yerel kodu Expo sürümüne bağlanmaz

### Olumsuz / riskler
- Mobil operasyon maliyeti daha yüksek (yerel araç zincirleri, mağaza hatları) — P0'da kabul edip bütçe ayırın
- RN yükseltmesi + Yeni Mimari etkinleştirmesi Expo kılavuzlarına dayanmadan belgelenmeli
