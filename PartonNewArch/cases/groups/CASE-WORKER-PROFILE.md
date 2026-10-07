# CASE-WORKER-PROFILE — İşçi Profil Yönetimi

**Cases:** 15  
**Source group description:** İşçi profil verisi, deneyim, yetkinlik, belge ve profil tamamlama akışları.

## Required capabilities
- Save availability days (T-016)
- Multiple time ranges per day (T-017); reject overlaps (T-018)
- Night-shift availability flag/ranges crossing midnight (T-019)
- Multi sector + multi occupation selection (T-020–T-021)
- Document type selection + file upload validation (T-022–T-024)
- Worker home location pin accuracy (T-025)
- Profile update triggers matching recompute (T-026)
- Age and gender changes affect job visibility/matching (T-027–T-028)
- Incomplete profile blocks apply (T-029)
- Profile delete/deactivate disposition of active applications (T-030)

## Nest modules
`workers`, `matching`, object storage for documents

## Screens
`m.worker.onboarding.profile`, `m.worker.profile.*`, `m.worker.availability.edit`, **new** `m.worker.documents.*`

## Acceptance focus
Critical: T-018, T-025, T-029


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-016` | Uygun gün seçiminin doğru kaydedilmesi | Yüksek | Fonksiyonel | — |
| `T-017` | Gün içinde birden fazla saat aralığı ekleme | Orta | Fonksiyonel | — |
| `T-018` | Çakışan saat aralıklarını engelleme | Kritik | Fonksiyonel | — |
| `T-019` | Gece vardiyası uygunluğu tanımlama | Yüksek | Fonksiyonel | — |
| `T-020` | Çoklu sektör seçimi | Orta | Fonksiyonel | — |
| `T-021` | Çoklu meslek seçimi | Orta | Fonksiyonel | — |
| `T-022` | Belge seçimi doğru kaydediliyor mu | Orta | Fonksiyonel | — |
| `T-023` | Belge yükleme varsa dosya tipi kontrolü | Orta | Fonksiyonel | — |
| `T-024` | Geçersiz belge yükleme | Orta | Fonksiyonel | — |
| `T-025` | Konum pinleme doğruluğu | Kritik | Fonksiyonel | — |
| `T-026` | Profil güncelleme sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | — |
| `T-027` | Yaş değişikliği sonrası ilan görünürlüğü değişiyor mu | Orta | Fonksiyonel | — |
| `T-028` | Cinsiyet değişikliği sonrası eşleşme güncelleniyor mu | Yüksek | Fonksiyonel | — |
| `T-029` | Eksik profille başvuru engeli | Kritik | Fonksiyonel | — |
| `T-030` | Profil silinince aktif başvuruların durumu | Orta | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)