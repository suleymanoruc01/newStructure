# ADR-0013: Firebase Cloud Messaging for mobile push

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../20-fcm-messaging.md`](../20-fcm-messaging.md)

## Context

PartOn must notify workers and employers about time-critical marketplace events (apply, accept/reject, 3h confirm, check-in, ratings) when the app is backgrounded or killed. The legacy stack already used FCM. The rebuild moves business state to Nest + Postgres but still needs a reliable OS push channel for iOS and Android. Foreground live updates are covered separately by SSE (ADR-0012); client commands stay on REST.

## Decision

1. Use **Firebase Cloud Messaging** as the **only** mobile push provider for v1 (Android direct; iOS via FCM→APNs).  
2. Send with **FCM HTTP v1** through the **Firebase Admin SDK** on Nest — no legacy server keys.  
3. Persist **inbox + device tokens in PostgreSQL**; register tokens over **REST**; never use Firestore as notification SoR.  
4. Dispatch only via **transactional outbox** (Stage A) and later BullMQ `notifications` (Stage B) — never FCM-in-request.  
5. Prefer **per-device registration tokens**; avoid deprecated device groups; topics only for rare broadcasts.  
6. Treat push as a **hint**: payload carries `type` + ids for deep links; screens refresh via REST (T-109–T-111).  
7. Keep **SSE** for foreground; **FCM** for background; do not replace either with WebSocket/gRPC streams.  
8. Bare React Native messaging SDK only — **Expo push not used**.

## Alternatives

### OneSignal / other push SaaS
- **Pros:** Dashboard, analytics  
- **Cons:** Extra vendor; team already on Firebase for push historically  
- **Why not:** FCM is sufficient; fewer processors for KVKK register  

### APNs direct + FCM Android separately
- **Pros:** No Firebase on iOS path  
- **Cons:** Two stacks, two credential ops  
- **Why not:** FCM unified send API is simpler for Nest  

### Push as sole realtime channel
- **Pros:** One mechanism  
- **Cons:** OS batching, weak admin web, poor foreground UX  
- **Why not:** Pair with SSE (ADR-0012)  

## Consequences

### Positive
- Clear split: REST / SSE / FCM / outbox  
- Maps to CASE-NOTIFICATIONS  
- Aligns with privacy (FCM = processor) and no PII in job payloads  

### Negative / risks
- Google/Apple subprocessors and cross-border disclosure  
- Token hygiene required (`UNREGISTERED`)  
- iOS permission + APNs setup in Firebase console  

### Follow-up
- Scaffold Firebase projects (dev/staging/prod)  
- Confirm RN Firebase package versions (FCM-1)  
- Wire templates T-100–T-108 in P0–P2  
