# ADR-0010: Privacy-by-design — KVKK primary, GDPR-ready

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../17-privacy-kvkk-gdpr.md`](../17-privacy-kvkk-gdpr.md)

## Context

PartOn launches for the **Turkey** market and processes personal data of job seekers and employers (phone numbers, profiles, location events, documents, device signals). Turkey’s **KVKK (Law No. 6698)** applies. **GDPR** may apply if EU data subjects are offered the service or if EU entities become controllers/processors. Engineering needs a clear privacy architecture so features do not invent ad-hoc PII handling.

## Decision

1. Treat **KVKK as the primary compliance regime** for v1 architecture and product flows.  
2. Implement **GDPR-ready technical controls** (DSR export/erasure, minimization, retention jobs, records of processing metadata, subprocessor register) so EU expansion does not require a rewrite.  
3. Apply **privacy by design/default** in Nest: versioned notices + acceptances (`policies`), minimized REST schemas, purpose-limited domain processing, no continuous location tracking, no PII in logs or BullMQ payloads.  
4. Prefer **data residency** aligned with legal guidance when choosing cloud region (AO-10); document every cross-border subprocessor.  
5. Deliver DSR and retention capabilities no later than **roadmap P3** (Trust); foundational controls (notice/accept, hashing, TLS, log redaction) in **P0–P1**.  
6. Engineering ships **locked retention defaults** ([17](../17-privacy-kvkk-gdpr.md) · ADR-0037) with **no TODOs**; product/legal owns VERBIS filings and public policy wording (does not block eng).

## Alternatives

### “Privacy policy PDF only, no system support”
- **Pros:** Fast  
- **Cons:** Cannot honor deletion/access; high regulatory and trust risk  
- **Why not:** Unacceptable for a staffing marketplace with geo check-in

### GDPR-only design ignoring KVKK
- **Pros:** Familiar EU templates  
- **Cons:** Misses Turkey-specific obligations and launch market  
- **Why not:** Primary market is Turkey

### Consent checkbox for all processing
- **Pros:** Simple UI  
- **Cons:** Often invalid / over-broad under KVKK & GDPR  
- **Why not:** Architecture must support distinct purposes and preferences

## Consequences

### Positive
- Clear module ownership (`policies`, `privacy`, location/shifts)  
- Aligns with CASE-SECURITY location minimization  
- Reduces rework when counsel finalizes durations and bases  

### Negative / risks
- DSR/retention work competes with feature velocity — scheduled in P3 explicitly  
- Cross-border vendors (SMS/FCM) need contractual + disclosure discipline  

### Follow-up
- Add `privacy` routes to OpenAPI when P3 starts  
- Wire retention metrics into observability  
- Legal audit logger + admin CSV/PDF — [ADR-0037](0037-legal-audit-logger.md) (accepted); retention matrix locked in [17](../17-privacy-kvkk-gdpr.md) — **no TODOs**  
