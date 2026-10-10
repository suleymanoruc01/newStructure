# CASE-NOTIFICATIONS — Bildirim Sistemi

**Cases:** 14  
**Source group description:** Push/in-app bildirimler, tokenlar, bildirim tetikleri ve bildirim durumları.

## Required capabilities
- Event-driven templates for: match, apply received, accept/reject, 3h, 10m check-in, 24h rating, favorite job, favorites-only (T-100–T-108)
- Deep link correctness (T-109)
- Idempotent send — no duplicates (T-110)
- In-app inbox when push disabled (T-111)
- Delayed/queued delivery observability (T-112)
- Strict user targeting (T-113)
- **Full-catalog alignment:** overlapping notify cases outside this group (T-096–T-099, T-114, T-119, T-123, T-133–T-135, T-172, T-226, T-231, …) use the same templates — matrix in [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) §0

## Nest modules
`notifications` + outbox; push token registry; `FcmDispatcher`

## Architecture
- **User-centered push catalog** (copy, prefs, timing): [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) · [ADR-0021](../../backend/adr/0021-push-notifications-ux.md)
- App architecture §12: [`../../04-application-architecture.md`](../../04-application-architecture.md)
- FCM transport: [`../../backend/20-fcm-messaging.md`](../../backend/20-fcm-messaging.md) · [ADR-0013](../../backend/adr/0013-fcm-push.md)
- Async/outbox: [`../../backend/08-async-events.md`](../../backend/08-async-events.md)
- Deep links: [`../../mobile/03-flows-and-deep-links.md`](../../mobile/03-flows-and-deep-links.md)
- SSE (foreground, not push): [`../../backend/19-sse.md`](../../backend/19-sse.md)
- Inbox UI: [`../../mobile/screens/shared-system.md`](../../mobile/screens/shared-system.md)

## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-100` | Yeni uygun ilan bildirimi | Yüksek | Fonksiyonel | — |
| `T-101` | Başvuru alındı bildirimi | Yüksek | Fonksiyonel | — |
| `T-102` | Onay bildirimi | Yüksek | Fonksiyonel | — |
| `T-103` | Red bildirimi | Yüksek | Fonksiyonel | — |
| `T-104` | 3 saat kala check-in bildirimi | Kritik | Fonksiyonel | — |
| `T-105` | 10 dakika kala işe geldim bildirimi | Yüksek | Fonksiyonel | — |
| `T-106` | 24 saat sonra değerlendirme bildirimi | Yüksek | Fonksiyonel | — |
| `T-107` | Favori işveren ilan bildirimi | Yüksek | Fonksiyonel | — |
| `T-108` | Sadece favorilere özel bildirim | Yüksek | Fonksiyonel | — |
| `T-109` | Bildirim tıklanınca doğru ekrana yönlendirme | Yüksek | Fonksiyonel | — |
| `T-110` | Çift bildirim oluşmaması | Yüksek | Fonksiyonel | — |
| `T-111` | Push kapalıysa uygulama içi bildirim | Yüksek | Fonksiyonel | — |
| `T-112` | Gecikmeli bildirim senaryosu | Yüksek | Fonksiyonel | — |
| `T-113` | Yanlış kullanıcıya bildirim gitmemesi | Yüksek | Fonksiyonel | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)