# 05 — Data layer (PostgreSQL)

**Status:** `accepted` — production coding ([agents/10](../agents/10-production-ready.md))  
**Last updated:** 2026-10-10

## Decisions

| Topic | Choice | Status |
| --- | --- | --- |
| Database | PostgreSQL **18+** (self-managed / managed instance we control) | `accepted` |
| ORM | Prisma **latest stable** schema-first + `@prisma/adapter-pg` | `accepted` — [ADR-0003](adr/0003-orm-choice.md) |
| Public IDs | UUIDv7 (`uuidv7()` or app-side) for ordered entities | `accepted` |
| Migrations | Versioned, CI-applied; no prod `db push` / sync | `accepted` |
| UUID PKs | `uuid` (UUIDv7 where ordered) for public IDs | `accepted` |
| Soft delete | Prefer `deleted_at` for user-facing entities | `accepted` |
| Multi-tenancy | Shared DB, row-level scoping by employer/branch | `accepted` |

## Principles

1. **PostgreSQL is the system of record** — not mobile cache, not Firestore.
2. **Schema in git** — every change is a migration + review.
3. **Integrity over denormalization** — denormalize only with a measured read path (e.g. feed).
4. **PII minimization (KVKK / GDPR-ready)** — store what product needs; encrypt/hash where required (OTP secrets, tokens); classify new fields before ship — [17-privacy-kvkk-gdpr](17-privacy-kvkk-gdpr.md).
5. **Retention & erasure** — soft-delete for user-facing entities; scheduled purge/anonymize per retention matrix; keep policy acceptances for accountability.
6. **Geo** — lat/lng + Haversine/radius helpers for v1; add **PostGIS** when query volume warrants (Assess); **event-based** check-in only (no tracks).
7. **Mobile never imports models** — ORM entities/schema stay in `apps/backend`; clients use shared API schemas only.

## Logical schemas (namespaces)

Use **PostgreSQL schemas** (`auth`, `jobs`, …) matching Nest modules where practical; table-prefix fallback OK if simpler at scaffold.

| Area | Example tables |
| --- | --- |
| Identity | `users`, `otp_challenges`, `refresh_sessions`, `auth_bans`, `device_fingerprints` |
| Memberships | `employer_memberships`, `branch_managers`, `platform_admins` (see [18-auth-rbac](18-auth-rbac.md)) |
| Org | `employers` (+ `tax_id`, `verification_status`), `branches`, `branch_managers` |
| Worker | `worker_profiles` (+ age/gender/home_geo), `availability_windows`, `worker_sectors`, `worker_occupations`, `worker_documents` |
| Jobs | `job_catalog_items`, `jobs` (+ `favorites_only`, `gender_filter`, headcount), `job_required_documents` |
| Tokens | `token_accounts`, `token_holds`, `token_ledger_entries` |
| Hiring | `applications`, `application_events` |
| Day-of | `shifts`, `availability_confirms`, `check_ins`, `check_in_disputes`, `location_events` |
| Social | `ratings`, `favorites` |
| Comms | `notifications` (inbox + `dedupe_key`), `device_push_tokens` — [20-fcm](20-fcm-messaging.md) |
| Compliance | `policy_documents`, `policy_acceptances`, `privacy_export_requests`, `privacy_erasure_requests`, `legal_audit_events` (append-only — ADR-0037) |
| Ops | `outbox_events`, `abuse_reports`, `risk_events` |

## Transaction guidelines

- One use-case = one DB transaction when mutating multiple tables (apply + notify outbox).
- Prefer **transactional outbox** for side effects (push/SMS) over dual-write.
- Avoid long transactions around external HTTP calls.

## Indexing expectations (early)

| Access pattern | Index hint |
| --- | --- |
| User by phone | unique on normalized phone |
| Jobs by branch + status + start_at | composite |
| Applications by job + worker | unique `(job_id, worker_id)` where active |
| Feed by geo / industry | depends on matching design |
| Notifications by user + created_at | composite |

## Migration workflow

```text
edit schema → generate migration → review SQL → apply local → CI apply staging → prod
```

Seed scripts for staging must support Parton case runs (worker + employer + branch + open job).

## What we deliberately leave behind

| Legacy | Why not port as-is |
| --- | --- |
| Firestore collections per aggregate | Document shape ≠ relational ownership |
| Client Room for active shift as truth | Offline is cache; server validates check-in |
| Firebase timestamps everywhere | Use `timestamptz` |

## Open questions

| ID | Question |
| --- | --- |
| DL-1 | PostGIS day-1 or lat/lng + Haversine first? |
| DL-2 | Soft delete vs archive tables for jobs |
| DL-3 | Separate read replica timing |
