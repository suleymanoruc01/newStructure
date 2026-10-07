# CASE-LOCATION — Konum Doğrulama

**Cases:** 13  
**Source group description:** Konum izni, konum doğrulama, mesafe ve geo bağımlı kontroller.

## Required capabilities
- Branch coordinate truth (T-136–T-137)
- Configurable geofence radii (50m / 100m+) (T-138–T-139)
- Soft-fail / escalate for indoor, mall, high-rise, rural, Wi-Fi assist (T-140–T-144)
- Moving check-in handling (T-145)
- No background location required for v1 check-in (T-146)
- iOS/Android parity matrix (T-147)
- Mock GPS detection signals (T-148)

## Nest modules
`location` policy engine; branch geo; admin config for radii


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-136` | Şube koordinatı doğruysa doğrulama | Kritik | İş Kuralı | — |
| `T-137` | Şube koordinatı yanlışsa hata yakalama | Kritik | İş Kuralı | — |
| `T-138` | 50 metre yarıçap doğrulaması | Kritik | İş Kuralı | — |
| `T-139` | 100 metre yarıçap doğrulaması | Kritik | İş Kuralı | — |
| `T-140` | Kapalı alanda GPS sapması | Kritik | İş Kuralı | — |
| `T-141` | AVM içinde lokasyon sapması | Kritik | İş Kuralı | — |
| `T-142` | Plaza ve çok katlı yapı senaryosu | Kritik | İş Kuralı | — |
| `T-143` | Kırsal bölgede düşük GPS kalitesi | Kritik | İş Kuralı | — |
| `T-144` | Wi-Fi destekli konum doğrulama | Kritik | İş Kuralı | — |
| `T-145` | Hareket halindeyken check-in | Kritik | İş Kuralı | — |
| `T-146` | Arka planda konum izni yokken davranış | Kritik | İş Kuralı | — |
| `T-147` | iOS ve Android farkları | Kritik | İş Kuralı | — |
| `T-148` | Sahte GPS aracı tespiti | Kritik | İş Kuralı | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)