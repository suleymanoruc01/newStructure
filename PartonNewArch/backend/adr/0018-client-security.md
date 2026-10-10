# ADR-0018: Client security baseline (Web + Mobile)

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../21-client-security.md`](../21-client-security.md)

## Context

PartOn ships a **bare React Native** consumer app and a **Nest-hosted Vite admin** (optional employer web later). AuthN/AuthZ are Nest-owned (ADR-0011), but weak client credential storage, missing browser headers, or cleartext/MITM gaps would still fail CASE-SECURITY (T-247–T-252) and KVKK expectations. We need one baseline for “best security” that fits the locked stack — not Expo SecureStore, not Firebase rules, not AuthZ in the UI.

## Decision

1. **Transport:** TLS 1.2+ only; HSTS on web; no cleartext API.  
2. **Mobile sessions:** Access JWT in **memory**; refresh in **OS Keychain/Keystore** (`react-native-keychain`). Never AsyncStorage / plaintext disk for refresh.  
3. **Web sessions:** Access JWT in **memory**; refresh in **`HttpOnly` + `Secure` + `SameSite=Strict` cookie** on the API auth path; **CSRF defense** on cookie-authenticated refresh/logout.  
4. **AuthZ remains Nest-only** — UI hiding is not security (T-244–246).  
5. **Documents:** short-lived **signed URLs** only (T-249).  
6. **Web headers:** CSP, frame denial, Referrer-Policy, Permissions-Policy on Nest-served SPA.  
7. **TLS pinning:** **Trial** for production mobile (SPKI + backup pin + kill-switch) — not day-1 blocker.  
8. **Root/jailbreak hard-block:** **Hold** as sole control; treat as abuse/check-in **risk signal**.  
9. **No secrets** (JWT keys, SMS, FCM server keys) in mobile or admin bundles.

## Alternatives

### Both tokens in localStorage / AsyncStorage
- **Pros:** Simple  
- **Cons:** XSS / backup theft steals long-lived session  
- **Why not:** Fails T-247 spirit and OWASP ASVS/MASVS storage guidance

### BFF-only cookie session for admin (no Bearer)
- **Pros:** Classic web session  
- **Cons:** Diverges from mobile Bearer model; harder shared OpenAPI client  
- **Why not:** Prefer hybrid — Bearer access + cookie refresh for web; revisit BFF if admin moves cross-site

### Mandatory certificate pinning day-1
- **Pros:** Strong MITM resistance  
- **Cons:** Outage risk on cert rotation without backup pins/ops  
- **Why not:** Trial after pin rotation runbook exists

### Hard-block rooted devices
- **Pros:** Looks strict  
- **Cons:** False positives; bypassable; hurts legitimate users  
- **Why not:** Risk scoring instead

## Consequences

### Positive
- Clear, testable client rules aligned with ADR-0011 and CASE-SECURITY  
- Web CSRF surface minimized when Nest serves SPA same-site  
- Mobile refresh protected by hardware-backed store when available  

### Negative / risks
- Cookie + Bearer hybrid needs careful CORS/CSRF implementation  
- Pinning Trial needs ops discipline  

### Follow-ups
- Implement Nest cookie refresh + CSRF endpoints  
- Mobile keychain module in P0 auth slice  
- Document pin rotation in ops runbook before enabling pinning  
