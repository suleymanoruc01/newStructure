# CASE-FAVORITES Vaka Test Görselleştirmesi

- Toplam vaka: `8`
- Sonuç kaynağı: `/Users/hakanbilir/MyDevZone/StaffMatch/parton-case-results.json`
- Kanıt politikası: isim benzerliği kapsama kanıtı değildir; her vaka doğrudan repo kanıtı ile eşleştirilmelidir.

## Öncelik Dağılımı

```mermaid
pie title CASE-FAVORITES Öncelik Dağılımı
  "Orta" : 8
```

## Test Türü Dağılımı

```mermaid
pie title CASE-FAVORITES Test Türü Dağılımı
  "fonksiyonel" : 8
```

## Vaka Test Sonuç Özeti

```mermaid
pie title CASE-FAVORITES Sonuç Durumu
  "Partially Covered" : 8
```

## Güven Dağılımı

```mermaid
pie title CASE-FAVORITES Güven Dağılımı
  "Medium" : 8
```

## Test Kalitesi Dağılımı

```mermaid
pie title CASE-FAVORITES Test Kalitesi
  "Moderate" : 8
```

## Vaka Eşleştirme Akışı

```mermaid
flowchart LR
  Catalog["Türkçe Parton Vaka Kataloğu"]
  Catalog --> Group["CASE-* Grup"]
  Group --> Case["Vaka ID / Başlık"]
  Case --> Live["WhatsApp Rol / Faz / Atama"]
  Case --> Screens["Ekran / Akış"]
  Screens --> Wiring["UI Wiring: kontrol -> handler -> state -> servis -> sonuç"]
  Case --> Logic["Servis / Mantık / Native"]
  Case --> Tests["Test Kanıtı"]
  Live --> Wiring
  Wiring --> Status["Covered / Partially Covered / Missing / Unclear"]
  Screens --> Status["Covered / Partially Covered / Missing / Unclear"]
  Logic --> Status
  Tests --> Status
  Status --> Report["Türkçe Tek Rapor"]
  Status --> Backlog["Geliştirici Uygulama Rehberi"]
```

## Sonuç Akışı

```mermaid
flowchart LR
  Case["Vaka ID"] --> Evidence["Doğrudan Repo Kanıtı"]
  Evidence --> Status["Sonuç Durumu"]
  Evidence --> Confidence["Güven"]
  Evidence --> TestQuality["Test Kalitesi"]
  Status --> Gap["Açık / Risk"]
  Confidence --> Gap
  TestQuality --> Gap
  Gap --> Guide["Geliştirici Uygulama Rehberi"]
  Gap --> Retest["Sonraki Test / Doğrulama"]
```

## Sonuç Matrisi

| Vaka ID | Başlık | Durum | Güven | Test Kalitesi | Kanıt | Açık | Olası Kod Alanı | UI Wiring Kanıtı |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `T-164` | İşverenin işçiyi favoriye alması | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-165` | İşçinin işvereni favoriye alması | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-166` | Tek taraflı favori mantığı | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-167` | Karşılıklı favori davranışı varsa testi | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-168` | Favorilere özel ilan oluşturma | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-169` | Bu ilanın sadece favorilere görünmesi | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-170` | Favoriler ekranında ilan görünmesi | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-171` | Favoriden çıkarınca erişimin kalkması | Partially Covered | Medium | Moderate | EmployeeHomeViewModel.toggleFavoriteEmployer ve employer favori çalışan akışları var. | Çapraz cihaz senkronizasyonu ve offline çatışma çözümlemesi için güçlü test yok. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |

## Vakalar

| Vaka ID | Başlık | Öncelik | Test Türü | Rol | Canlı Test Fazı | Görsel Eşleştirme Notu |
| --- | --- | --- | --- | --- | --- | --- |
| `T-164` | İşverenin işçiyi favoriye alması | Orta | Fonksiyonel | İşçi | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-165` | İşçinin işvereni favoriye alması | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-166` | Tek taraflı favori mantığı | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-167` | Karşılıklı favori davranışı varsa testi | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-168` | Favorilere özel ilan oluşturma | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-169` | Bu ilanın sadece favorilere görünmesi | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-170` | Favoriler ekranında ilan görünmesi | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-171` | Favoriden çıkarınca erişimin kalkması | Orta | Fonksiyonel | İşveren | Faz 6 - Sonrası ve Sadakat | Ekran / servis / test kanıtı ile eşleştirilecek |

## Manuel Tamamlama Kontrol Listesi

- Her vaka için ilişkili ekran/görünüm, servis/modül, native/platform alanı ve test dosyası yazılmalıdır.
- UI wiring kanıtı; ekran kontrolü, handler, state sahibi, validasyon, servis/native/API yan etkisi ve görünür sonucu birlikte göstermelidir.
- Kritik vakalarda enforcement kanıtı ve varsa test kanıtı ayrı ayrı gösterilmelidir.
- Kanıt zayıfsa durum `Unclear` veya `Partially Covered` kalmalıdır.
