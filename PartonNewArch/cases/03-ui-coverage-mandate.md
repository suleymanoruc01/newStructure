# 03 — UI coverage mandate (all 248 cases)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**Source:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §15  
**Components:** [`../shared/02-ui-components.md`](../shared/02-ui-components.md)  
**Layouts:** [`../shared/03-screen-ux-layout.md`](../shared/03-screen-ux-layout.md) · [ADR-0019](../backend/adr/0019-screen-ux-layout.md)  
**Wizards:** [`../shared/04-wizard-state.md`](../shared/04-wizard-state.md) · [ADR-0020](../backend/adr/0020-wizard-state.md)  
**Screens:** [`../mobile/02-screen-catalog.md`](../mobile/02-screen-catalog.md) · [`../web/02-screen-catalog.md`](../web/02-screen-catalog.md) · [`../web/08-admin-case-coverage.md`](../web/08-admin-case-coverage.md)

## Mandate

Every capability implied by `parton_case_tests_tr.json` **must** have:

1. **At least one UI screen** (mobile and/or web/admin) where a human exercises or observes the outcome, **or** an explicit **system surface** (blocking modal, empty state, toast, permission sheet) owned by a named screen.  
2. **Named UI components** that implement the interaction (see [shared/02-ui-components](../shared/02-ui-components.md)).  
3. Traceability: case ID(s) on the screen doc + component list.

**Non-goals:** Load-generator UIs for CASE-PERF (ops/admin metrics + dashboards only). Pure API AuthZ negatives (T-246) still need **403 / empty / restriction** UI when a user hits them from a client.

**Gate:** A feature PR that implements Nest rules for a `T-###` without the mapped screen/component is **incomplete**.

---

## Channel rules

| Audience | Primary UI | Notes |
| --- | --- | --- |
| Worker / employer / manager | **Mobile** (NativeWind) | Day-of geo/check-in mobile-only |
| Employer dense ops | Mobile **and/or** web console (web not locked for v1 — still catalogued) | Same REST |
| Platform ops | **Admin** shadcn — **every `CASE-*` group** | Ops/config/moderation — [web/08](../web/08-admin-case-coverage.md) · ADR-0034 |
| Matching engine | Worker **feed** + admin **diagnostics** | Product UI on mobile; explain tool on admin |

---

## Group → screens → components

| Group | Cases | Primary screens | Required components (min) |
| --- | --- | --- | --- |
| **CASE-AUTH** T-001–015 | 15 | Mobile auth*; **admin** `users.*`, `policies.manage`, `verification.queue` | `PhoneField`, `OtpInput`, `PolicyAcceptList`, `VerificationQueueTable`, … |
| **CASE-WORKER-PROFILE** T-016–030 | 15 | Mobile profile*; **admin** `workers.*`, `documents.queue` | `AvailabilityWeekGrid`, `DocumentReviewRow`, … |
| **CASE-EMPLOYER-BRANCH** T-031–038 | 8 | Mobile/employer web*; **admin** `employers.*`, `branches.list` | `BranchTable`, `EmployerOrgCard`, … |
| **CASE-JOB-POSTING** T-039–057 | 19 | Employer*; **admin** `jobs.*`, `catalog.manage` | `JobOversightTable`, `CatalogTreeEditor`, … |
| **CASE-MATCHING** T-058–079 | 22 | Worker feed*; **admin** `matching.diagnostics` | `MatchExplainPanel`, `MatchReasonChips`, … |
| **CASE-APPLICATION** T-080–088 | 9 | Mobile apply*; **admin** `applications.*` | `ApplicationStatusBadge`, … |
| **CASE-EMPLOYER-REVIEW** T-089–099 | 10 | Employer board*; **admin** `applications.*`, `jobs.detail` | `ApplicantTable`, … |
| **CASE-NOTIFICATIONS** T-100–113 | 14 | Mobile inbox*; **admin** `notifications.outbox`, `broadcast` | `OutboxTable`, `BroadcastAudiencePicker`, … |
| **CASE-AVAILABILITY-3H** T-114–122 | 8 | Mobile confirm*; **admin** `shifts.*` | `ShiftLifecycleTimeline`, `Confirm3hStatus`, … |
| **CASE-CHECKIN** T-123–135 | 13 | Mobile check-in*; **admin** `shifts.*`, `disputes.queue` | `DisputeQueueTable`, `ManualConfirmPanel`, … |
| **CASE-LOCATION** T-136–148 | 13 | Mobile + branch map*; **admin** `config.remote`, `risk.queue`, `branches.list` | `GeofenceDefaultEditor`, `MockGpsWarning`, … |
| **CASE-TOKEN** T-149–163 | 15 | Employer tokens*; **admin** `tokens.ledger`, `employers.detail` | `LedgerList`, `TokenAdjustDialog`, … |
| **CASE-FAVORITES** T-164–171 | 8 | Mobile favorites*; **admin** worker/employer/job detail | `FavoriteList` (inspect), `FavoritesOnlyBadge`, … |
| **CASE-RATINGS** T-172–180 | 9 | Mobile ratings*; **admin** `ratings.*` | `RatingModerationRow`, … |
| **CASE-ABUSE** T-181–192 | 12 | Mobile report*; **admin** `abuse.*`, `risk.queue` | `AbuseTicketTable`, `BanDetail`, `RiskBadge`, … |
| **CASE-E2E** T-193–225 | 31 | Journey composition*; **admin** shifts/jobs/applications support path | Reuse admin lifecycle tools |
| **CASE-PERF** T-226–234 | 9 | **Admin** `dashboard`, `perf.metrics`, **`devops.*`** | `OpsMetricCards`, `QueueDepthChart`, `ErrorIssueTable` — **not** load tools |
| **CASE-UX** T-235–243 | 9 | Product P0 screens*; **admin** `config.remote` | `RemoteConfigForm`, `MaintenanceToggle`, … |
| **CASE-SECURITY** T-244–252 | 9 | Settings/legal*; **admin** `users.*`, `audit.*` (log/detail/CSV·PDF), `documents.queue` | `AuditLogTable`, `AuditReportForm`, `MaskedField`, `SessionRevokeButton`, … · ADR-0037 |

\* Mobile/employer product screens unchanged — see mobile catalogs. Admin column is **required** per ADR-0034 · [web/08](../web/08-admin-case-coverage.md).

\* Optional product forks still require screens if the fork is enabled.

---

## Screens added / confirmed for mandate completeness

| ID | Channel | Why |
| --- | --- | --- |
| `m.shared.auth.context-switch` | Mobile | Multi-membership / role switch (AS-3) |
| `m.employer.tokens.top-up` | Mobile | T-161 payments / top-up |
| `m.worker.jobs.apply-overlap` | Mobile (sheet) | T-085 / T-181 overlap warn-or-block |
| `m.worker.availability.edit` night ranges | Mobile (component on screen) | T-019 / T-073 |
| `w.admin.perf.metrics` | Admin | CASE-PERF observability UI |
| Full `w.admin.*` matrix (32 screens) | Admin | Every CASE-* domain — [web/08](../web/08-admin-case-coverage.md) · ADR-0034 |
| `m.shared.system.forbidden` | Mobile | T-244–246 user-visible deny |
| `m.shared.system.session-expired` | Mobile | T-247 |
| `w.employer.tokens.top-up` | Web | Parity with mobile top-up |

Detail specs: [`../mobile/screens/case-driven-additions.md`](../mobile/screens/case-driven-additions.md) · web admin/employer catalogs.

---

## Definition of done (per case)

- [ ] Screen ID listed in mobile and/or web catalog  
- [ ] Screen doc names **components** used  
- [ ] Screen declares **layout recipe** (R1–R8) + **one primary CTA** ([UX layout](../shared/03-screen-ux-layout.md))  
- [ ] Happy path + failure UI state (error, empty, blocked) covered  
- [ ] Deep link / notification entry mapped if CASE-NOTIFICATIONS touches it  
- [ ] Admin surface exists for the case’s **CASE-*** group ([web/08](../web/08-admin-case-coverage.md))  
- [ ] Case ID referenced in PR  

---

## Related

- Matrix: [`00-coverage-matrix.md`](00-coverage-matrix.md)  
- Gaps: [`01-gap-backlog.md`](01-gap-backlog.md)  
- Components: [`../shared/02-ui-components.md`](../shared/02-ui-components.md)  
