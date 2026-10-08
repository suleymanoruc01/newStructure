# CASE-NOTIFICATIONS — Bildirim Sistemi

**Vaka sayısı:** 14  
**Kaynak grup açıklaması:** Push/in-app bildirimler, tokenlar, bildirim tetikleri ve bildirim durumları.

## Gerekli yetenekler
- Eşleşme, başvuru alındı, kabul/ret, 3 saat, 10 dakika kala işe giriş, 24 saat sonra puanlama, favori iş ve yalnızca favorilere açık işler için olay tetiklemeli şablonlar (T-100–T-108)
- Derin bağlantıların doğru hedefe yönelmesi (T-109)
- Gönderim idempotent olmalı — yinelenen bildirim olmamalı (T-110)
- Push kapalıysa uygulama içi gelen kutusu (T-111)
- Gecikmiş/kuyruğa alınmış teslimatın gözlemlenebilirliği (T-112)
- Bildirimlerin kesin olarak doğru kullanıcıya yöneltilmesi (T-113)

## Nest modülleri
`notifications` + outbox düzeni; push bildirim jetonu kayıt sistemi


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-100` | Yeni uygun ilan bildirimi | Yüksek | Fonksiyonel | — |
| `T-101` | Başvuru alındı bildirimi | Yüksek | Fonksiyonel | — |
| `T-102` | Onay bildirimi | Yüksek | Fonksiyonel | — |
| `T-103` | Red bildirimi | Yüksek | Fonksiyonel | — |
| `T-104` | 3 saat kala check-in bildirimi | Kritik | Fonksiyonel | — |
| `T-105` | 10 dakika kala işe geldim bildirimi | Yüksek | Fonksiyonel | — |
| `T-106` | 24 saat sonra değerlendirme bildirimi | Yüksek | Fonksiyonel | — |
| `T-107` | Favori işveren ilan bildirimi | Yüksek | Fonksiyonel | — |
| `T-108` | Sadece favorilere özel bildirim | Yüksek | Fonksiyonel | — |
| `T-109` | Bildirim tıklanınca doğru ekrana yönlendirme | Yüksek | Fonksiyonel | — |
| `T-110` | Çift bildirim oluşmaması | Yüksek | Fonksiyonel | — |
| `T-111` | Push kapalıysa uygulama içi bildirim | Yüksek | Fonksiyonel | — |
| `T-112` | Gecikmeli bildirim senaryosu | Yüksek | Fonksiyonel | — |
| `T-113` | Yanlış kullanıcıya bildirim gitmemesi | Yüksek | Fonksiyonel | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)