# Web — Admin console screens

**Status:** `accepted` (full case-domain inventory)  
**Last updated:** 2026-10-10  
**Coverage matrix:** [`../08-admin-case-coverage.md`](../08-admin-case-coverage.md) · [ADR-0034](../../backend/adr/0034-admin-full-case-coverage.md)  
**Nest modules:** `admin`, `moderation`, `users`, `workers`, `employers`, `branches`, `jobs`, `applications`, `shifts`, `tokens`, `ratings`, `notifications`, `policies`, `location`  
**Access:** Role `admin` only; Nest-hosted `/admin` or admin host  
**UI:** Vite + shadcn/ui **dark** — [`../04-shadcn-dark-ui.md`](../04-shadcn-dark-ui.md) · recipe **R7**  
**Source cases:** [`../../../parton_case_tests_tr.json`](../../../parton_case_tests_tr.json)

> Admin provides **ops / config / moderation / support** for **every** `CASE-*` group. Not a worker day-of twin.

---

## Auth & shell

### `w.admin.login`

| Field | Detail |
| --- | --- |
| **Route** | `/login` |
| **Purpose** | Privileged OTP (same AuthN stack; elevated AuthZ) |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY`, `CASE-AUTH` |
| **Components** | `PhoneField`, `OtpInput`, `FormErrorBanner` |
| **Notes** | Do not reuse employer session cookies across hosts |

### `w.admin.dashboard`

| Field | Detail |
| --- | --- |
| **Route** | `/` |
| **Purpose** | Open abuse, disputes, verification, failed outbox, OTP anomalies |
| **MVP** | P0 |
| **Primary CTA** | Open highest-priority queue |
| **Components** | `OpsMetricCards`, queue summary tables |
| **Cases** | `CASE-PERF`, `CASE-ABUSE`, `CASE-E2E` (support entry) |

### `w.admin.perf.metrics`

| Field | Detail |
| --- | --- |
| **Route** | `/ops/perf` |
| **Purpose** | Notify fan-out, matching latency, token concurrency, queue depth |
| **MVP** | P0 |
| **Components** | `OpsMetricCards`, `QueueDepthChart`, `LatencyHistogram` |
| **Cases** | T-226–T-234 |
| **Notes** | Observation only — **not** a load generator |

---

## People & orgs

### `w.admin.users.list` / `w.admin.users.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/users` · `/users/:id` |
| **Purpose** | Search accounts; roles; restrict; force logout; linked worker/employer |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY`, `CASE-AUTH`, `CASE-ABUSE` |
| **Components** | `UserSearchTable`, `RestrictionScreen` (admin variant), `RiskBadge`, `SessionRevokeButton` |

### `w.admin.workers.list` / `w.admin.workers.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/workers` · `/workers/:id` |
| **Purpose** | Inspect worker profile, availability, sectors/occupations, favorites, docs status |
| **MVP** | P0 |
| **Cases** | `CASE-WORKER-PROFILE` (T-016–030), `CASE-FAVORITES` |
| **Components** | `WorkerProfilePanel`, `AvailabilityWeekGrid` (read-only), `DocumentStatusChips` |

### `w.admin.employers.list` / `w.admin.employers.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/employers` · `/employers/:id` |
| **Purpose** | Orgs; verification; token balance; branches summary; favorites |
| **MVP** | P0 |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-TOKEN`, `CASE-AUTH` (T-011–015) |
| **Components** | `EmployerOrgCard`, `TokenBalanceChip`, `VerificationStatusBadge` |

### `w.admin.branches.list`

| Field | Detail |
| --- | --- |
| **Route** | `/branches` |
| **Purpose** | Cross-org branch search; coordinates; active/passive; jobs count |
| **MVP** | P0 |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` (T-136–137) |
| **Components** | `BranchTable`, `BranchMapPin` (read-only) |

### `w.admin.verification.queue`

| Field | Detail |
| --- | --- |
| **Route** | `/verification` |
| **Purpose** | Firm verification triage before publish (T-015) |
| **MVP** | P0 |
| **Cases** | `CASE-AUTH` |
| **Components** | `VerificationQueueTable`, `ApproveRejectBar` |

### `w.admin.documents.queue`

| Field | Detail |
| --- | --- |
| **Route** | `/documents` |
| **Purpose** | Review worker documents; type checks; ACL (T-022–024, T-249) |
| **MVP** | P0 |
| **Cases** | `CASE-WORKER-PROFILE`, `CASE-SECURITY` |
| **Components** | `DocumentReviewRow`, `DocumentTypePicker` (filter), `MaskedField` |

---

## Jobs, matching, applications

### `w.admin.jobs.list` / `w.admin.jobs.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/jobs` · `/jobs/:id` |
| **Purpose** | Oversight; force-close; inspect favorites-only, headcount, token holds |
| **MVP** | P0 |
| **Cases** | `CASE-JOB-POSTING`, `CASE-FAVORITES`, `CASE-TOKEN`, `CASE-ABUSE` |
| **Components** | `JobOversightTable`, `FavoritesOnlyBadge`, `HoldBreakdown`, `ForceCloseDialog` |

### `w.admin.catalog.manage`

| Field | Detail |
| --- | --- |
| **Route** | `/catalog` |
| **Purpose** | Sectors / occupations CMS for create-job |
| **MVP** | P0 |
| **Cases** | `CASE-JOB-POSTING` |
| **Components** | `CatalogTreeEditor` |

### `w.admin.matching.diagnostics`

| Field | Detail |
| --- | --- |
| **Route** | `/matching/diagnostics` |
| **Purpose** | Explain why a worker sees/hides a job (admin-only; no leak to workers) |
| **MVP** | P0 |
| **Cases** | `CASE-MATCHING` (T-058–079) |
| **Components** | `MatchExplainPanel`, `MatchReasonChips` (admin) |

### `w.admin.applications.list` / `w.admin.applications.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/applications` · `/applications/:id` |
| **Purpose** | Support audit of apply / withdraw / accept / reject |
| **MVP** | P0 |
| **Cases** | `CASE-APPLICATION`, `CASE-EMPLOYER-REVIEW` |
| **Components** | `ApplicationStatusBadge`, `ApplicantTable` (admin filters) |

---

## Shifts, check-in, disputes

### `w.admin.shifts.list` / `w.admin.shifts.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/shifts` · `/shifts/:id` |
| **Purpose** | 3h confirm state, check-in events, seat release, token capture linkage |
| **MVP** | P0 |
| **Cases** | `CASE-AVAILABILITY-3H`, `CASE-CHECKIN`, `CASE-E2E`, `CASE-TOKEN` |
| **Components** | `ShiftLifecycleTimeline`, `Confirm3hStatus`, `GeofenceStatus` (read-only) |

### `w.admin.disputes.queue`

| Field | Detail |
| --- | --- |
| **Route** | `/disputes` |
| **Purpose** | Manual confirm / dispute triage (T-134–135, T-210–214) |
| **MVP** | P0 |
| **Cases** | `CASE-CHECKIN`, `CASE-ABUSE` (T-189–190) |
| **Components** | `DisputeQueueTable`, `ManualConfirmPanel` (admin) |

---

## Tokens & ratings

### `w.admin.tokens.ledger`

| Field | Detail |
| --- | --- |
| **Route** | `/tokens/ledger` |
| **Purpose** | Platform ledger; holds/captures; manual credit; concurrency anomalies |
| **MVP** | P0 |
| **Cases** | `CASE-TOKEN` (T-149–163) |
| **Components** | `LedgerList`, `TokenAdjustDialog`, `HoldBreakdown` |

### `w.admin.ratings.queue` / `w.admin.ratings.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/ratings` · `/ratings/:id` |
| **Purpose** | Moderate comments; inspect averages; rating abuse |
| **MVP** | P0 |
| **Cases** | `CASE-RATINGS`, `CASE-ABUSE` (T-187) |
| **Components** | `RatingModerationRow`, `StarRating` (read-only), `ProfanityError` |

---

## Notifications

### `w.admin.notifications.outbox`

| Field | Detail |
| --- | --- |
| **Route** | `/notifications/outbox` |
| **Purpose** | Outbox lag, dedupe, failed FCM, wrong-audience debug (T-110–113) |
| **MVP** | P0 |
| **Cases** | `CASE-NOTIFICATIONS` |
| **Components** | `OutboxTable`, `DedupeKeyBadge` |

### `w.admin.notifications.broadcast`

| Field | Detail |
| --- | --- |
| **Route** | `/notifications/broadcast` |
| **Purpose** | Careful audience-targeted announcements |
| **MVP** | P0 |
| **Cases** | `CASE-NOTIFICATIONS` |
| **Components** | `BroadcastAudiencePicker`, `BroadcastConfirmDialog` |
| **Notes** | Requires dual confirm; audit every send |

---

## Abuse, risk, policies, config, audit

### `w.admin.abuse.queue` / `w.admin.abuse.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/abuse` · `/abuse/:id` |
| **MVP** | P0 |
| **Cases** | `CASE-ABUSE`, `CASE-SECURITY` |
| **Components** | `AbuseTicketTable`, `BanDetail`, `RiskBadge` |

### `w.admin.risk.queue`

| Field | Detail |
| --- | --- |
| **Route** | `/risk` |
| **MVP** | P0 |
| **Cases** | `CASE-ABUSE`, `CASE-LOCATION` (mock GPS T-148/T-188) |
| **Components** | `RiskQueueTable`, `MockGpsWarning`, `DeviceFingerprintBadge` |

### `w.admin.policies.manage`

| Field | Detail |
| --- | --- |
| **Route** | `/policies` |
| **MVP** | P0 |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |
| **Components** | `PolicyVersionEditor`, `ForceReacceptToggle` |

### `w.admin.config.remote`

| Field | Detail |
| --- | --- |
| **Route** | `/config` |
| **MVP** | P0 |
| **Cases** | `CASE-UX`, `CASE-LOCATION` |
| **Components** | `RemoteConfigForm`, `GeofenceDefaultEditor`, `MaintenanceToggle` |

### `w.admin.audit.log`

| Field | Detail |
| --- | --- |
| **Route** | `/audit` |
| **Purpose** | Browse append-only **legal audit** events (`legal_audit_events`) |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY` |
| **Components** | `AuditLogTable` |
| **Doc** | [`../11-legal-audit-reports.md`](../11-legal-audit-reports.md) · [ADR-0037](../../backend/adr/0037-legal-audit-logger.md) |

### `w.admin.audit.detail`

| Field | Detail |
| --- | --- |
| **Route** | `/audit/:id` |
| **Purpose** | Single legal audit event (masked metadata) |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY` |
| **Components** | `AuditEventDetail` |

### `w.admin.audit.reports`

| Field | Detail |
| --- | --- |
| **Route** | `/audit/reports` |
| **Purpose** | Report builder → server **CSV** and **PDF** exports; export history |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY` · privacy accountability |
| **Components** | `AuditReportForm`, `AuditExportHistory`, `DownloadFileButton` |
| **Doc** | [`../11-legal-audit-reports.md`](../11-legal-audit-reports.md) · ADR-0037 |

---

## DevOps — errors & codebase ops (ADR-0035)

**Doc:** [`../09-admin-devops.md`](../09-admin-devops.md)

### `w.admin.devops.overview`

| Field | Detail |
| --- | --- |
| **Route** | `/devops` |
| **Purpose** | Open error groups, error rate, unhealthy services, latest releases |
| **MVP** | P0 |
| **Cases** | `CASE-PERF` |
| **Components** | `DevopsOverviewCards`, links to errors/releases/services |

### `w.admin.devops.errors.list` / `w.admin.devops.errors.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/devops/errors` · `/devops/errors/:fingerprint` |
| **Purpose** | Triage fingerprint groups from API + admin + marketing + mobile; resolve/ignore |
| **MVP** | P0 |
| **Cases** | `CASE-PERF`, `CASE-SECURITY` (redaction) |
| **Components** | `ErrorIssueTable`, `StackFrameList`, `ReleaseChip`, `RequestIdLink`, `ResolveIgnoreBar` |
| **API** | Admin devops errors list/detail/patch; ingest from clients |

### `w.admin.devops.releases`

| Field | Detail |
| --- | --- |
| **Route** | `/devops/releases` |
| **Purpose** | Per-app version + git SHA + environment; link issues to release |
| **MVP** | P0 |
| **Components** | `ReleaseTable`, `GitShaBadge` |
| **Notes** | Deploy execution stays Fastlane/PM2/NGINX — this is ops visibility + register |

### `w.admin.devops.services`

| Field | Detail |
| --- | --- |
| **Route** | `/devops/services` |
| **Purpose** | Aggregate health: live/ready, Postgres, Redis, queue lag, SMS/FCM probe |
| **MVP** | P0 |
| **Cases** | `CASE-PERF` |
| **Components** | `ServiceStatusGrid`, `DependencyProbeRow` |

### `w.admin.devops.clients`

| Field | Detail |
| --- | --- |
| **Route** | `/devops/clients` |
| **Purpose** | Mobile/admin/marketing build versions; error rates by release; ties to force-update config |
| **MVP** | P0 |
| **Components** | `ClientBuildTable`, link to `w.admin.config.remote` |

---

## Related

- Coverage: [`../08-admin-case-coverage.md`](../08-admin-case-coverage.md)  
- DevOps: [`../09-admin-devops.md`](../09-admin-devops.md) · ADR-0035  
- Catalog index: [`../02-screen-catalog.md`](../02-screen-catalog.md)  
- Components: [`../../shared/02-ui-components.md`](../../shared/02-ui-components.md)  
- Mandate: [`../../cases/03-ui-coverage-mandate.md`](../../cases/03-ui-coverage-mandate.md)  
