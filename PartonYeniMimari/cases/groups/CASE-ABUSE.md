# CASE-ABUSE — Negatif ve Suistimal Testleri

**Vaka sayısı:** 12  
**Kaynak grup açıklaması:** Kötüye kullanım, negatif senaryolar, hile, tekrarlı işlem ve sınır ihlali kontrolleri.

## Gerekli yetenekler
- Aynı saat diliminde iki işi kabul etmeyi engelle (T-181)
- Onay verdikten sonra sürekli işe gelmeyen çalışanı tespit et (T-182); sürekli son dakika iptal eden işvereni tespit et (T-183)
- Aynı cihazda birden fazla hesap sinyalleri (T-184)
- Sahte ilan / bot başvurularına karşı koruma (T-185–T-186)
- Puan manipülasyonunu tespit et (T-187)
- Jeton tahsilatını zorlamak için sahte konum kullanılması (T-188)
- Taraflardan birinin gerçeğe aykırı katılım iddiası (T-189–T-190)
- Yaş beyanını yanlış vermeye karşı kontroller (T-191)
- Yasaklı kullanıcının yeniden kaydını engelle (T-192)

## Nest modülleri
`moderation`; kimlik doğrulama, vardiya ve puanlama süreçlerinde risk puanlama kancaları


## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| `T-181` | Aynı saat diliminde iki işe onay alma | Orta | Negatif | — |
| `T-182` | Sürekli “geleceğim” deyip gelmeyen işçi | Orta | Negatif | — |
| `T-183` | Sürekli son dakika iptal eden işveren | Orta | Negatif | — |
| `T-184` | Aynı cihazdan çoklu sahte hesap | Kritik | Negatif | — |
| `T-185` | Sahte ilan açma girişimi | Kritik | Negatif | — |
| `T-186` | Bot başvuru denemeleri | Orta | Negatif | — |
| `T-187` | Puan manipülasyonu | Orta | Negatif | — |
| `T-188` | Sahte konumla jeton düşürme denemesi | Kritik | Negatif | — |
| `T-189` | İşverenin gelen işçiyi gelmedi göstermesi | Orta | Negatif | — |
| `T-190` | İşçinin gelmediği halde geldi göstermesi | Orta | Negatif | — |
| `T-191` | Yaş sınırını yanlış beyan etme | Orta | Negatif | — |
| `T-192` | Yasaklı kullanıcının tekrar kayıt denemesi | Orta | Negatif | — |

## İzlenebilirlik

- Kapsam matrisi: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Boşluk listesi: [`../01-gap-backlog.md`](../01-gap-backlog.md)