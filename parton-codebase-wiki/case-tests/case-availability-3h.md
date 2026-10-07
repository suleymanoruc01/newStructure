# CASE-AVAILABILITY-3H Vaka Test Görselleştirmesi

- Toplam vaka: `8`
- Sonuç kaynağı: `/Users/hakanbilir/MyDevZone/StaffMatch/parton-case-results.json`
- Kanıt politikası: isim benzerliği kapsama kanıtı değildir; her vaka doğrudan repo kanıtı ile eşleştirilmelidir.

## Öncelik Dağılımı

```mermaid
pie title CASE-AVAILABILITY-3H Öncelik Dağılımı
  "Orta" : 7
  "Yüksek" : 1
```

## Test Türü Dağılımı

```mermaid
pie title CASE-AVAILABILITY-3H Test Türü Dağılımı
  "fonksiyonel" : 8
```

## Vaka Test Sonuç Özeti

```mermaid
pie title CASE-AVAILABILITY-3H Sonuç Durumu
  "Partially Covered" : 8
```

## Güven Dağılımı

```mermaid
pie title CASE-AVAILABILITY-3H Güven Dağılımı
  "Medium" : 8
```

## Test Kalitesi Dağılımı

```mermaid
pie title CASE-AVAILABILITY-3H Test Kalitesi
  "Weak" : 8
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
| `T-114` | İşçiye 3 saat kala bildirim gitmesi | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-115` | “Gelebileceğim” seçeneği | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-116` | “Gelemiyorum” seçeneği | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-117` | Hiç yanıt verilmemesi | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-118` | Önce gelebileceğim sonra gelemiyorum seçimi | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-119` | İşverenin gelemiyorum bilgisini alması | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-121` | Birden fazla personelde sadece bazılarının iptal etmesi | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |
| `T-122` | Son dakika açılan ilanda bu akışın uyarlanması | Partially Covered | Medium | Weak | EmployeeJobMatchEngine ve feedAvailableDays üzerinden uygunluk filtresi uygulanıyor. | 3 saat kuralının uçtan uca zorlaması ve timezone kenar durumları için doğrudan kanıt sınırlı. | shared | kontrol -> handler -> state -> servis/native/API -> görünür sonuç |

## Vakalar

| Vaka ID | Başlık | Öncelik | Test Türü | Rol | Canlı Test Fazı | Görsel Eşleştirme Notu |
| --- | --- | --- | --- | --- | --- | --- |
| `T-114` | İşçiye 3 saat kala bildirim gitmesi | Yüksek | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-115` | “Gelebileceğim” seçeneği | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-116` | “Gelemiyorum” seçeneği | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-117` | Hiç yanıt verilmemesi | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-118` | Önce gelebileceğim sonra gelemiyorum seçimi | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-119` | İşverenin gelemiyorum bilgisini alması | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-121` | Birden fazla personelde sadece bazılarının iptal etmesi | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |
| `T-122` | Son dakika açılan ilanda bu akışın uyarlanması | Orta | Fonksiyonel | İşçi | Faz 5 - İş Günü Yönetimi | Ekran / servis / test kanıtı ile eşleştirilecek |

## Manuel Tamamlama Kontrol Listesi

- Her vaka için ilişkili ekran/görünüm, servis/modül, native/platform alanı ve test dosyası yazılmalıdır.
- UI wiring kanıtı; ekran kontrolü, handler, state sahibi, validasyon, servis/native/API yan etkisi ve görünür sonucu birlikte göstermelidir.
- Kritik vakalarda enforcement kanıtı ve varsa test kanıtı ayrı ayrı gösterilmelidir.
- Kanıt zayıfsa durum `Unclear` veya `Partially Covered` kalmalıdır.
