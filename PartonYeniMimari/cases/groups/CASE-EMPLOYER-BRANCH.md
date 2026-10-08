# CASE-EMPLOYER-BRANCH — İşveren Profil ve Şube Yönetimi

**Vaka sayısı:** 8  
**Kaynak grup açıklaması:** İşveren profili, firma bilgileri, şube ve işveren hesap yönetimi akışları.

## Gerekli yetenekler
- Şube oluştur; işveren başına birden fazla şubeyi destekle (T-031–T-032)
- Koordinatları doğru biçimde kaydet (T-033); geçersiz koordinatları reddet (T-036)
- Şube güncellenince ilişkili açık işlerin gösterimini/konumunu güncelle (T-034)
- Şube devre dışı bırakılınca işlerini kapat veya dondur (T-035) — ürün kararını doğrulayın
- Mantıksal silme / arşivleme: geçmiş işlerin görünürlüğü (T-038)
- İşveren yalnızca kendi şubelerini görür (T-037)

## Nest modülleri
`employers`, `branches`, `jobs`, `location`

## Ekranlar
`m.employer.branches.*`, `w.employer.branches.*`, `w.employer.team.list`


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-031` | Yeni şube ekleme | Orta | Fonksiyonel | — |
| `T-032` | Aynı işverene çoklu şube ekleme | Orta | Fonksiyonel | — |
| `T-033` | Şube konumunun doğru kaydedilmesi | Kritik | Fonksiyonel | — |
| `T-034` | Şube güncelleme sonrası ilan ilişkisi | Orta | Fonksiyonel | — |
| `T-035` | Pasife alınan şubedeki ilanların durumu | Orta | Fonksiyonel | — |
| `T-036` | Yanlış koordinat ile şube oluşturma | Orta | Fonksiyonel | — |
| `T-037` | Sadece kendi şubelerini görüntüleme yetkisi | Orta | Fonksiyonel | — |
| `T-038` | Şube silme sonrası geçmiş ilan görünürlüğü | Orta | Fonksiyonel | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)