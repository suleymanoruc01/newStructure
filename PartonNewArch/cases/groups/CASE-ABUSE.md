# CASE-ABUSE — Negatif ve Suistimal Testleri

**Cases:** 12  
**Source group description:** Kötüye kullanım, negatif senaryolar, hile, tekrarlı işlem ve sınır ihlali kontrolleri.

## Required capabilities
- Block double-book accept same time (T-181)
- Detect chronic no-show after confirm (T-182); chronic late cancel employer (T-183)
- Multi-account same device signals (T-184)
- Fake job / bot apply defenses (T-185–T-186)
- Rating manipulation detection (T-187)
- Fake location to force token capture (T-188)
- False attendance claims either side (T-189–T-190)
- Age misrepresentation controls (T-191)
- Banned user re-registration block (T-192)

## Nest modules
`moderation`, risk scoring hooks across auth/shifts/ratings


## Case checklist

| ID | Title | Priority | Type | Alt section |
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

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)