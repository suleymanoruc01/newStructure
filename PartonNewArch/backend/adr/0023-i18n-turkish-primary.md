# ADR-0023: i18n — Turkish (`tr-TR`) primary

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/07-i18n.md`](../../shared/07-i18n.md)

## Context

PartOn is Turkey-first (KVKK, case catalog in Turkish, marketplace copy). Without an i18n architecture, strings hardcode in RN/admin, push templates drift to English-only, and API errors become inconsistent. Secondary English and future markets need a key-based structure from day one—even if only `tr-TR` is fully filled at launch.

## Decision

1. **Primary locale:** `tr-TR`. **Default** whenever locale is unset or unsupported.  
2. **Secondary:** `en` prepared with the same keys; not required complete on day-1 for every string.  
3. All user-facing copy (mobile, admin, push/inbox, SMS, user-safe API messages, policies UI) comes from **locale catalogs** — no hardcoded UI prose in components.  
4. Shared message ids across clients and Nest where text is shared; proposed stack **i18next** / **react-i18next** + shared JSON (Nest reads same files).  
5. Stable **`error.code`** (English); localized **`error.message`** (TR default).  
6. Formatting: `Intl` with `tr-TR`, currency **TRY**, display TZ **Europe/Istanbul** (store UTC).  
7. Locale resolution: profile → client preference → Accept-Language/device → `tr-TR`.  
8. RTL and additional languages **Hold** until a market ADR.  
9. Missing `tr-TR` keys fail review/CI; English-only user strings in P0 flows are rejected.

## Alternatives

### Hardcode Turkish in components
- **Pros:** Fast  
- **Cons:** Cannot add EN; push/API drift; unreviewable  
- **Why not:** Blocks i18n and consistency

### English-primary product
- **Pros:** Dev familiarity  
- **Cons:** Wrong for Turkey launch and case catalog  
- **Why not:** Product is TR-first

### Per-app disconnected dictionaries
- **Pros:** Independence  
- **Cons:** Push vs UI mismatch  
- **Why not:** Shared catalogs for shared meanings

## Consequences

### Positive
- Consistent TR UX; clean path to EN; aligns push ADR-0021  
- API codes stay stable for clients  

### Negative / risks
- Copy/key discipline required  
- ICU plurals for Turkish need care  

### Follow-ups
- Scaffold `packages/i18n` with `tr-TR`  
- Wire Nest push templates to catalogs  
- Profile `locale` field + settings UI when EN ships  
