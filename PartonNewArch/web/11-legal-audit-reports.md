# 11 — Legal audit reports (admin CSV / PDF)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0037 — Legal audit logger](../backend/adr/0037-legal-audit-logger.md)  
**Logger:** [`../backend/22-legal-audit-logger.md`](../backend/22-legal-audit-logger.md)  
**Screens:** [`screens/admin-console.md`](screens/admin-console.md) · catalog [`02-screen-catalog.md`](02-screen-catalog.md)  
**Privacy:** [`../backend/17-privacy-kvkk-gdpr.md`](../backend/17-privacy-kvkk-gdpr.md)

> Web admin exposes the **legal audit logger** for ops/compliance: browse events and download **CSV** and **PDF** reports. Server-generated; every export audited.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Required? | **Yes** — production admin |
| Formats | **CSV** and **PDF** (both) |
| Generation | Nest server-side |
| AuthZ | `admin` only |
| UI | `w.admin.audit.*` |

---

## 1. Screens

| ID | Route | Purpose |
| --- | --- | --- |
| `w.admin.audit.log` | `/audit` | Filterable event table (category, actor, date, resource) |
| `w.admin.audit.detail` | `/audit/:id` | Single event + metadata (masked) |
| `w.admin.audit.reports` | `/audit/reports` | Report builder → download CSV/PDF; history of prior exports |

All **P0**. Recipe **R7**. Cases: `CASE-SECURITY`, privacy accountability.

---

## 2. Report builder

| Field | Behavior |
| --- | --- |
| Date range | Required |
| Categories | Multi-select (`auth`, `policy`, `admin_action`, …) |
| Actor | Optional user id |
| Format | **CSV** \| **PDF** (user picks; both supported) |
| Submit | `POST /api/v1/admin/audit/reports` → job or sync file |
| Download | Signed short-lived URL or stream; **not** public bucket |

PDF layout: PartOn header, filter summary, tabular events, generated_at, actor who exported. CSV: one row per event, stable columns.

---

## 3. Components

| Component | Role |
| --- | --- |
| `AuditLogTable` | Browse |
| `AuditEventDetail` | Detail drawer/page |
| `AuditReportForm` | Filters + format |
| `AuditExportHistory` | Prior CSV/PDF jobs |
| `DownloadFileButton` | Trigger download |

---

## 4. Agent rules

1. Implement logger + all three screens in S8 (with admin matrix).  
2. Both CSV and PDF — do not ship CSV-only.  
3. Export action writes `audit_export` category event.  
4. Ground IDs in catalog; no invented report routes.

---

## 5. DoD

- [ ] Events appear for admin actions + policy accept  
- [ ] `/audit` filters work  
- [ ] CSV download opens in spreadsheet tools  
- [ ] PDF download is readable and includes filter summary  
- [ ] Export itself audited  
- [ ] No secrets/OTP in files  

---

## Related

- [ADR-0037](../backend/adr/0037-legal-audit-logger.md)  
- Logger: [`../backend/22-legal-audit-logger.md`](../backend/22-legal-audit-logger.md)  
- Admin coverage: [`08-admin-case-coverage.md`](08-admin-case-coverage.md)  
