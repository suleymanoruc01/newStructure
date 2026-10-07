# CASE-E2E — Uçtan Uca Senaryolar

**Cases:** 31  
**Source group description:** Birden fazla modülü kapsayan tam kullanıcı yolculukları.

## Required journeys
1. **Happy path** T-193–T-204: register both → branch → job → match → apply → accept → 3h confirm → check-in → geo → token capture → rating
2. **Worker cannot come** T-205–T-209: accept → cannot-come @3h → employer notified → token correct
3. **GPS failure + manual** T-210–T-214: physical arrival → GPS fail → dispute → employer confirm → token decision
4. **Favorites rehire** T-215–T-218
5. **Multi-headcount** T-219–T-225: hold 5 → approve 5 → 1 cancel → capture for attendees only

## Note
Catalog skips T-208, T-224 (absent IDs).


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-193` | İşçi kayıt olur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-194` | İşveren kayıt olur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-195` | Şube oluşturulur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-196` | İlan oluşturulur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-197` | İlan uygun işçiye gösterilir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-198` | İşçi başvurur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-199` | İşveren onaylar | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-200` | İşçi gelebileceğini bildirir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-201` | İşçi işe gelir ve check-in yapar | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-202` | Konum doğrulanır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-203` | Jeton kesinleşir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-204` | Değerlendirme yapılır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 1: Sorunsuz Tam Akış |
| `T-205` | İşçi onay alır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 2: İşçi Gelemiyor |
| `T-206` | 3 saat kala gelemiyorum der | Kritik | Uçtan Uca | Uçtan Uca Senaryo 2: İşçi Gelemiyor |
| `T-207` | İşveren bilgilendirilir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 2: İşçi Gelemiyor |
| `T-209` | Jeton durumu doğru yönetilir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 2: İşçi Gelemiyor |
| `T-210` | İşçi fiziksel olarak gelir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 3: GPS Sorunu |
| `T-211` | GPS doğrulaması başarısız olur | Kritik | Uçtan Uca | Uçtan Uca Senaryo 3: GPS Sorunu |
| `T-212` | Manuel itiraz açılır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 3: GPS Sorunu |
| `T-213` | İşveren doğrular | Kritik | Uçtan Uca | Uçtan Uca Senaryo 3: GPS Sorunu |
| `T-214` | Jeton kararı doğru uygulanır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 3: GPS Sorunu |
| `T-215` | İşveren işçiyi favoriye alır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 4: Favori Üzerinden Tekrar Çalışma |
| `T-216` | Yeni ilanı sadece favorilere açar | Kritik | Uçtan Uca | Uçtan Uca Senaryo 4: Favori Üzerinden Tekrar Çalışma |
| `T-217` | İlgili işçi ilanı görür | Kritik | Uçtan Uca | Uçtan Uca Senaryo 4: Favori Üzerinden Tekrar Çalışma |
| `T-218` | Başvuru ve onay tamamlanır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 4: Favori Üzerinden Tekrar Çalışma |
| `T-219` | İşveren 5 kişilik ilan açar | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |
| `T-220` | 5 jeton provizyona alınır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |
| `T-221` | Başvurular gelir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |
| `T-222` | 5 kişi onaylanır | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |
| `T-223` | 1 kişi iptal eder | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |
| `T-225` | Gelen kişiler kadar jeton kesinleşir | Kritik | Uçtan Uca | Uçtan Uca Senaryo 5: Çok Kişili İlan |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)