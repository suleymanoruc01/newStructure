# CASE-APPLICATION — Başvuru Süreci

**Vaka sayısı:** 9  
**Kaynak grup açıklaması:** Başvuru başlatma, başvuru durumu, iptal, kabul/red ve başvuru görünürlüğü akışları.

## Gerekli yetenekler
- Uygun işe başvur (T-080)
- (iş, çalışan) çifti benzersiz olmalı; yinelenen istekte işlem tekrarlanmamalı (idempotent) (T-081)
- Profil eksikse / işin süresi dolmuşsa / kontenjan doluysa engelle (T-082–T-084)
- Saatleri çakışan başvurularda uyar veya engelle (T-085) — ürün kararı: engelleme önerilir
- Beklemedeyken başvuruyu geri çekmeye izin ver (T-086)
- Başvuru sonrası profil değişikliği: başvuru anındaki görüntüyü dondur veya canlı tut — kararı belgeleyin (T-087)
- Başvurudan sonra iş gereksinimleri değişirse yeniden doğrula veya bildir (T-088)

## Nest modülleri
`applications`, `workers`, `jobs`


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-080` | Uygun ilana başvuru | Yüksek | Fonksiyonel | — |
| `T-081` | Aynı ilana ikinci kez başvurunun engellenmesi | Kritik | Fonksiyonel | — |
| `T-082` | Profil eksikse başvuru engeli | Kritik | Fonksiyonel | — |
| `T-083` | Süresi geçmiş ilana başvuru engeli | Kritik | Fonksiyonel | — |
| `T-084` | Kontenjan dolu ilana başvuru engeli | Kritik | Fonksiyonel | — |
| `T-085` | Aynı saat aralığında çakışan işe ikinci başvuru | Orta | Fonksiyonel | — |
| `T-086` | Başvuru geri çekme | Orta | Fonksiyonel | — |
| `T-087` | Başvuru sonrası profil değişikliği etkisi | Orta | Fonksiyonel | — |
| `T-088` | İlan şartı sonradan değişirse başvuru durumu | Orta | Fonksiyonel | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)