# ADR-0037: Legal audit logger + admin CSV/PDF reports

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng / Compliance (eng controls)  
**Related:** [ADR-0010](0010-privacy-kvkk-gdpr.md) · [ADR-0011](0011-auth-rbac.md) · [ADR-0034](0034-admin-full-case-coverage.md) · [17-privacy-kvkk-gdpr.md](../17-privacy-kvkk-gdpr.md) · [backend/22-legal-audit-logger.md](../22-legal-audit-logger.md) · [web/11-legal-audit-reports.md](../../web/11-legal-audit-reports.md)

## Context

KVKK accountability and CASE-SECURITY require an immutable record of privileged and legally sensitive processing (auth events, policy acceptances, admin actions, DSR handling, token adjustments, bans). A generic app logger or DevOps error store (ADR-0035) is insufficient: legal needs **append-only audit events**, a **locked retention default**, and **admin-facing reports** exportable as **CSV and PDF**. `audit_events` was only “proposed” in the data layer — agents could skip reporting.

## Decision

1. PartOn implements a dedicated **legal audit logger** (`legal_audit` / Nest `audit` module) writing **append-only** `legal_audit_events` (name locked; supersedes vague `audit_events` proposed).  
2. Events cover at minimum: auth (login/logout/lockout), policy acceptances, admin privileged actions, DSR export/erasure lifecycle, moderation bans/restrictions, token manual adjustments, document access by admin, broadcast sends.  
3. **Not** the same store as DevOps runtime errors (ADR-0035) or application debug logs.  
4. **Admin UI** (required): browse/filter audit trail + generate **CSV** and **PDF** reports for date/actor/category ranges — screens `w.admin.audit.*` expanded per [web/11](../../web/11-legal-audit-reports.md).  
5. Exports are generated server-side (Nest), AuthZ `admin` only, every export itself audited. PDF/CSV contain **masked** sensitive fields (no OTP, raw tokens, full document bytes).  
6. Retention: **`LEGAL_AUDIT_RETENTION_DAYS=2555` (7 years)** locked default; env override allowed; legal hold blocks purge. No TODO placeholders.  
7. Hash-chain or previous-hash column **Trial** for tamper evidence; minimum is append-only + no update/delete APIs for events.

## Consequences

### Positive

- Accountability for KVKK/GDPR-ready ops  
- Counsel/ops can pull CSV/PDF without DB access  
- Clear split: legal audit vs DevOps errors  

### Negative / tradeoffs

- Write volume on hot paths — async outbox/BullMQ acceptable for non-blocking capture  
- PDF generation dependency in Nest  

### Follow-ups

- Optional WORM/object-storage archive for exports (Assess)  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Only structured app logs | **Reject** — not reportable / not immutable legal trail |
| DevOps error store as legal log | **Reject** — wrong purpose |
| Client-side CSV only | **Reject** — incomplete, AuthZ weak |
| Skip PDF | **Reject** — user requires CSV **and** PDF |
