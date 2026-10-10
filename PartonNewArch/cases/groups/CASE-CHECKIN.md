# CASE-CHECKIN — İşe Geldim Teyidi ve Check-in

**Cases:** 13  
**Source group description:** İşe geldim teyidi, check-in, zaman ve konum bağımlı iş akışları.

## Required capabilities
- 10-minute reminder (T-123)
- Worker asserts arrived (T-124); server geo validate (T-125–T-126)
- Accuracy tolerance / indoor GPS softness (T-127, links CASE-LOCATION)
- Retry on poor network; idempotent (T-128)
- Early/late windows (T-129–T-130)
- Mock GPS rejection (T-131)
- Permission denied UX (T-132)
- Employer notified on success (T-133)
- Manual employer confirmation path (T-134)
- Dispute/appeal after false reject (T-135)

## Nest modules
`shifts`, `location`, `notifications`, `tokens`, `moderation`

## Screens
Existing check-in + **new** `m.worker.shift.dispute`, employer confirm UI on web/mobile

## Push templates
| Cases | `type` |
| --- | --- |
| T-123 | `shift.checkin_due` |
| T-133 | `shift.worker_checked_in` |
| T-134 | `shift.manual_confirmed` |
| T-135 | `shift.dispute_update` |

Catalog: [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md)

## Case checklist

| ID | Title | Priority | Type | Alt section |
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

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)