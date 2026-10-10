# ADR-0021: User-centered push notification experience

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md)  
**Transport ADR:** [0013 — FCM](0013-fcm-push.md)

## Context

CASE-NOTIFICATIONS (T-100–T-113) requires event-driven alerts with correct deep links, no duplicates, inbox when push is off, and strict audience. Transport (FCM HTTP v1, outbox, tokens) is locked in ADR-0013, but without a **user-centered** catalog—copy, timing, preferences, tone, and tap targets—push becomes noisy system telemetry and fails marketplace UX (3h confirm, check-in, apply outcomes).

## Decision

1. Adopt the **user-centered template catalog** in [`shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) as the product source for title/body, audience, category, urgency, collapse, TTL, and deep-link targets.  
2. **Full case coverage:** §0 matrix maps **all** notify needs in `parton_case_tests_tr.json` (CASE-NOTIFICATIONS plus T-096–T-099, T-114–T-123, T-133–T-135, T-172, T-226, T-231, and domain-implied employer/worker alerts). Orphan notify cases are not allowed.  
3. **Inbox-first:** every notify writes Postgres inbox; FCM is optional delivery (T-111).  
4. **One job per notification:** actionable outcome; tap opens the mapped screen (T-109).  
5. **Preference categories:** `shifts`, `applications`, `matching`, `favorites`, `marketing` (marketing opt-in OFF by default).  
6. Soft OS permission after first role home with in-app rationale; app usable if denied.  
7. Critical shift templates (3h / check-in / cannot-come) use high priority channels; quiet-hours Trial must not mute them by default.  
8. Locale default **tr-TR**; no secrets/OTP/precise home geo in tray copy; SMS OTP is never FCM.  
9. FCM transport details remain in [20-fcm-messaging](../20-fcm-messaging.md); this ADR does not change provider choice.

## Alternatives

### Transport-only docs (no UX catalog)
- **Pros:** Shorter  
- **Cons:** Inconsistent copy, spam, weak CASE-UX  
- **Why not:** Notifications are a product surface

### Email/SMS as primary alerts
- **Pros:** Reach  
- **Cons:** Cost/latency; not in locked mobile path for day-of  
- **Why not:** FCM + inbox for v1 transactional

### Client-chosen recipients
- **Pros:** Flexible  
- **Cons:** Breaks T-113  
- **Why not:** Nest audience only

## Consequences

### Positive
- Clear QA checklist per template  
- Aligns deep links, prefs UI, and FCM payload `type`  
- Better day-of reliability perception (3h / check-in)  

### Negative / risks
- Template copy needs product review in TR  
- Quiet hours policy still Trial  

### Follow-ups
- Implement locale template files in Nest `notifications` module  
- `m.shared.notifications.push-prefs` screen  
- Wire collapse keys + TTL in `FcmDispatcher`  
