# 22 — Legal audit logger

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0037 — Legal audit logger + CSV/PDF reports](adr/0037-legal-audit-logger.md)  
**Privacy:** [17-privacy-kvkk-gdpr.md](17-privacy-kvkk-gdpr.md) · [ADR-0010](adr/0010-privacy-kvkk-gdpr.md)  
**Admin reports:** [`../web/11-legal-audit-reports.md`](../web/11-legal-audit-reports.md)  
**Not:** DevOps runtime errors — [ADR-0035](adr/0035-admin-devops-error-tracking.md)

> Immutable **legal audit logger** for KVKK accountability and CASE-SECURITY. Wired into **web admin** for browse + **CSV/PDF** reports.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Store | Postgres `legal_audit_events` — **append-only** |
| Nest module | `audit` (writes) + admin controllers for query/export |
| Consumers | Admin UI + optional DevOps MCP read tools later |
| Separated from | App JSON logs · DevOps `devops_error_*` |
| Reports | Server-side **CSV** and **PDF** |
| Access | Role `admin` only |

---

## 1. What must be logged

| Category | Examples | Case / doc |
| --- | --- | --- |
| `auth` | OTP verify success/fail (no code), lockout, logout, session revoke | CASE-AUTH / SECURITY |
| `policy` | Policy acceptance (version, channel, user) | CASE-AUTH · policies |
| `admin_action` | Restrict/ban, force-close job, catalog publish, config change | CASE-ABUSE / SECURITY |
| `privacy_dsr` | Export/erasure request created/completed | ADR-0010 · privacy |
| `token_adjust` | Manual credit/debit by admin | CASE-TOKEN |
| `document_admin` | Admin view/download of worker document (metadata only) | T-249 |
| `notify_broadcast` | Admin broadcast send | CASE-NOTIFICATIONS |
| `audit_export` | CSV/PDF report generated (meta) | this ADR |

Payload: `actor_user_id`, `actor_role`, `action`, `category`, `resource_type`, `resource_id`, `request_id`, `ip` (hashed or truncated per privacy), `metadata` (JSON, **allowlisted keys**), `created_at`.

**Never store:** OTP codes, access/refresh tokens, passwords, full document bytes, raw continuous GPS trails.

---

## 2. Write path

```text
Domain service / controller
  → LegalAuditLogger.append(event)   # sync or outbox
  → legal_audit_events INSERT only
```

- No UPDATE/DELETE APIs for events  
- Failures to write audit on critical admin actions → fail the action (or durable outbox then fail) — do not silently drop  
- High-volume auth noise: may sample failures; successes that create sessions always logged  

---

## 3. Nest sketch

```text
modules/audit/
  audit.module.ts
  legal-audit.logger.ts
  audit-query.service.ts
  audit-export.service.ts    # CSV + PDF
  admin-audit.controller.ts
```

Export libs: use latest stable CSV writer + PDF library (verify with registry — e.g. PDFKit/Puppeteer; prefer lightweight PDFKit-style unless HTML templates required).

---

## 4. Retention

| Topic | Stance |
| --- | --- |
| Duration | **`LEGAL_AUDIT_RETENTION_DAYS=2555`** (7 years) — locked default in `.env.example` and Nest config |
| Override | Env may raise/lower; purge job must refuse values `< 365` without explicit `LEGAL_AUDIT_RETENTION_FORCE=1` |
| Legal hold | Flag prevents purge for disputed accounts / open cases |
| Archive | Optional object-storage cold archive (Assess) |
| TODOs | **Forbidden** — no `TODO(counsel)` in code or docs for this value |

---

## 5. Agent rules

1. Instrument every privileged admin mutation and policy acceptance.  
2. Ship admin report screens with CSV **and** PDF — [web/11](../web/11-legal-audit-reports.md).  
3. Do not reuse DevOps error tables for legal audit.  
4. Ship the locked retention default (`2555`); never leave TODO placeholders.

---

## Related

- [ADR-0037](adr/0037-legal-audit-logger.md)  
- Admin UI: [`../web/11-legal-audit-reports.md`](../web/11-legal-audit-reports.md)  
- Privacy: [17](17-privacy-kvkk-gdpr.md)  
- Data layer: [05-data-layer.md](05-data-layer.md)  
