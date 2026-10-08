# CASE-CHECKIN — İşe Geldim Teyidi ve Check-in

**Vaka sayısı:** 13  
**Kaynak grup açıklaması:** İşe geldim teyidi, check-in, zaman ve konum bağımlı iş akışları.

## Gerekli yetenekler
- 10 dakika kala hatırlatma (T-123)
- Çalışan geldiğini bildirir (T-124); sunucu konumu doğrular (T-125–T-126)
- Doğruluk toleransı / kapalı alanda GPS esnekliği (T-127, CASE-LOCATION ile bağlantılı)
- Zayıf ağda yeniden dene; yinelenen istekte işlem tekrarlanmamalı (idempotent olmalı) (T-128)
- Erken/geç zaman aralıkları (T-129–T-130)
- Sahte GPS reddi (T-131)
- İzin reddedildi deneyimi (T-132)
- Başarı durumunda işverene bildirim gönder (T-133)
- İşverenin elle onay akışı (T-134)
- Hatalı ret sonrası anlaşmazlık/itiraz (T-135)

## Nest modülleri
`shifts`, `location`, `notifications`, `tokens`, `moderation`

## Ekranlar
Mevcut işe giriş akışına ek olarak **yeni** `m.worker.shift.dispute` ve web/mobil işveren onay arayüzü


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-123` | 10 dakika kala bildirim gitmesi | Kritik | Uçtan Uca | — |
| `T-124` | İşçinin “işe geldim” seçmesi | Kritik | Uçtan Uca | — |
| `T-125` | Uygun konumdaysa doğrulama başarılı olması | Kritik | Uçtan Uca | — |
| `T-126` | Uygun konumda değilse reddedilmesi | Kritik | Uçtan Uca | — |
| `T-127` | GPS sapmasında tolerans testi | Kritik | Uçtan Uca | — |
| `T-128` | Düşük internetle tekrar deneme | Kritik | Uçtan Uca | — |
| `T-129` | Erken check-in denemesi | Kritik | Uçtan Uca | — |
| `T-130` | Geç check-in denemesi | Kritik | Uçtan Uca | — |
| `T-131` | Sahte konumla check-in denemesi | Kritik | Uçtan Uca | — |
| `T-132` | Konum izni kapalıyken check-in denemesi | Kritik | Uçtan Uca | — |
| `T-133` | İşverenin işçi geldi bildirimi alması | Kritik | Uçtan Uca | — |
| `T-134` | Manuel doğrulama akışı varsa testi | Kritik | Uçtan Uca | — |
| `T-135` | Hatalı reddedilmiş check-in için itiraz süreci | Kritik | Uçtan Uca | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)