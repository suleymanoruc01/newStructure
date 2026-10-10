# Web — Case-driven screen additions

**Status:** `accepted` (mandate inventory)  
**Last updated:** 2026-10-09  
**Mandate:** [`../../cases/03-ui-coverage-mandate.md`](../../cases/03-ui-coverage-mandate.md)  
**Components:** [`../../shared/02-ui-components.md`](../../shared/02-ui-components.md)

Screens required so catalog cases have a web/admin surface (in addition to mobile). Full index: [`../02-screen-catalog.md`](../02-screen-catalog.md).

---

## `w.employer.tokens.top-up`

| | |
| --- | --- |
| **Route** | `/app/tokens/top-up` |
| **Purpose** | Purchase / credit tokens |
| **MVP** | P1 |
| **Cases** | T-161 |
| **Components** | `TopUpAmountPicker`, `PaymentMethodList`, `TopUpConfirmSheet` (shadcn Dialog + Form) |
| **API** | Token top-up / payment intent endpoints |
| **Mobile twin** | `m.employer.tokens.top-up` |

---

## `w.admin.perf.metrics`

| | |
| --- | --- |
| **Route** | `/ops/perf` |
| **Purpose** | Queue depth, notify fan-out, matching latency, token concurrency visibility for CASE-PERF |
| **MVP** | P1 |
| **Cases** | T-226–T-234 |
| **Components** | `OpsMetricCards`, `QueueDepthChart`, `LatencyHistogram` |
| **Notes** | Ops visibility only — **not** a user load-test console |

---

## Catalog flags on existing screens

| Screen | Add |
| --- | --- |
| `w.employer.jobs.create` | Favorites-only toggle (T-056, T-168) |
| `w.employer.tokens.overview` | Hold vs capture explainer + CTA → top-up (T-243, T-161) |
| `w.admin.dashboard` | Link / embed to `w.admin.perf.metrics` + verification/disputes/outbox counts |
| `w.employer.shift.attendance` | Manual confirm + dispute queue (T-134–T-135) |
| `w.employer.verification` | Firm verification status (T-015) |
| `w.admin.risk.queue` | Mock GPS / multi-account / no-show (CASE-ABUSE) |

---

## Admin case-domain surfaces (ADR-0034)

Full specs: [`admin-console.md`](admin-console.md) · matrix [`../08-admin-case-coverage.md`](../08-admin-case-coverage.md).

| Screen | Why (cases) |
| --- | --- |
| `w.admin.workers.*` | CASE-WORKER-PROFILE |
| `w.admin.documents.queue` | T-022–024, T-249 |
| `w.admin.employers.detail` · `w.admin.branches.list` | CASE-EMPLOYER-BRANCH |
| `w.admin.verification.queue` | T-015 |
| `w.admin.jobs.detail` · `w.admin.catalog.manage` | CASE-JOB-POSTING |
| `w.admin.matching.diagnostics` | CASE-MATCHING |
| `w.admin.applications.*` | CASE-APPLICATION / EMPLOYER-REVIEW |
| `w.admin.shifts.*` · `w.admin.disputes.queue` | CASE-AVAILABILITY-3H / CHECKIN |
| `w.admin.tokens.ledger` | CASE-TOKEN |
| `w.admin.ratings.*` | CASE-RATINGS |
| `w.admin.notifications.outbox` · `broadcast` | CASE-NOTIFICATIONS |
| `w.admin.perf.metrics` · `dashboard` | CASE-PERF |
| `w.admin.abuse.*` · `risk.queue` | CASE-ABUSE |
| `w.admin.audit.log` · `audit.detail` · `audit.reports` · `users.*` · `policies` · `config` | CASE-SECURITY / UX / AUTH · ADR-0037 CSV/PDF |
| `w.admin.devops.*` (6 screens) | Error tracking + releases/health — [09-admin-devops](../09-admin-devops.md) · ADR-0035 |
