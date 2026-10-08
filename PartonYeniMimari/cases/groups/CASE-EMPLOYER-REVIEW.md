# CASE-EMPLOYER-REVIEW — İşveren Onay / Red Süreci

**Vaka sayısı:** 10  
**Kaynak grup açıklaması:** İşverenin başvuru veya işçi sürecini onaylama/red etme akışları.

## Gerekli yetenekler
- Adayları listele + filtrele (T-089–T-090)
- Onayla / reddet (T-091–T-092)
- Kontenjan dolduğunda otomatik kapat (T-093)
- Kontenjanın üzerinde kabul yapılamaz (T-094)
- Kabul/ret bildirimleri gönder (T-096–T-097)
- Daha önce kabul edilen çalışanı iptal et (T-098) jeton/vardiya yan etkileriyle birlikte
- İşin kapatılması kabul edilmiş adayları etkiler (T-099)

## Nest modülleri
`applications`, `jobs`, `notifications`, `tokens`, `shifts`


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-089` | Başvuranları listeleme | Orta | Fonksiyonel | — |
| `T-090` | Aday filtreleme | Orta | Fonksiyonel | — |
| `T-091` | Aday onaylama | Orta | Fonksiyonel | — |
| `T-092` | Aday reddetme | Orta | Fonksiyonel | — |
| `T-093` | Kontenjan dolunca ilanı kapatma | Orta | Fonksiyonel | — |
| `T-094` | Kontenjan üstü aday onayının engellenmesi | Kritik | Fonksiyonel | — |
| `T-096` | Red bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | — |
| `T-097` | Onay bildirimlerinin doğru gitmesi | Yüksek | Fonksiyonel | — |
| `T-098` | Onaylı adayı sonradan iptal etme | Orta | Fonksiyonel | — |
| `T-099` | İlanı kapatma sonrası onaylı adayların durumu | Orta | Fonksiyonel | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)