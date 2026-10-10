# 02 — Web screen catalog (index)

**Status:** `accepted` (inventory must cover catalog cases on web/admin channels)  
**Last updated:** 2026-10-10  
**Mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md) · **Admin×cases:** [`08-admin-case-coverage.md`](08-admin-case-coverage.md) · **Components:** [`../shared/02-ui-components.md`](../shared/02-ui-components.md) · **UX layouts:** [`../shared/03-screen-ux-layout.md`](../shared/03-screen-ux-layout.md) (admin = R7)

Detail under [`screens/`](screens/). Employer console remains optional for v1 product lock but **stays in the catalog** so cases have a web surface when that channel ships.

## Public & auth

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `w.public.landing` | Marketing landing | **P0** | `CASE-UX` · [07-marketing](07-marketing.md) · ADR-0033 |
| `w.public.pricing` | Pricing / tokens explainer | **P0** | `CASE-TOKEN` · [07-marketing](07-marketing.md) · ADR-0033 |
| `w.public.legal.privacy` | Privacy | P0 | `CASE-SECURITY` |
| `w.public.legal.terms` | Terms | P0 | `CASE-SECURITY` |
| `w.auth.login` | Phone login | P0 | `CASE-AUTH` |
| `w.auth.otp` | OTP verify | P0 | `CASE-AUTH` |
| `w.auth.policies` | Policy accept | P0 | `CASE-AUTH` |
| `w.employer.onboarding` | Employer web onboarding | P0 | `CASE-EMPLOYER-BRANCH` |

## Employer console

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `w.employer.dashboard` | Dashboard | P0 | `CASE-E2E` |
| `w.employer.jobs.list` | Jobs table | P0 | `CASE-JOB-POSTING` |
| `w.employer.jobs.create` | Create job (multi-step page) | P0 | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| `w.employer.jobs.detail` | Job detail | P0 | `CASE-JOB-POSTING` |
| `w.employer.jobs.edit` | Edit job | P1 | `CASE-JOB-POSTING` |
| `w.employer.applicants.board` | Applicants board / table | P0 | `CASE-EMPLOYER-REVIEW` |
| `w.employer.applicants.detail` | Applicant drawer/page | P0 | `CASE-EMPLOYER-REVIEW` |
| `w.employer.branches.list` | Branches | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.employer.branches.form` | Branch create/edit | P0 | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| `w.employer.branches.detail` | Branch detail | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.employer.team.list` | Managers / invites | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.employer.tokens.overview` | Token balance & holds | P0 | `CASE-TOKEN` |
| `w.employer.tokens.history` | Ledger | P1 | `CASE-TOKEN` |
| `w.employer.tokens.top-up` | Top-up | P1 | T-161 |
| `w.employer.favorites.workers` | Favorite workers | P1 | `CASE-FAVORITES` |
| `w.employer.ratings.pending` | Pending ratings | P1 | `CASE-RATINGS` |
| `w.employer.notifications` | Notification center | P1 | `CASE-NOTIFICATIONS` |
| `w.employer.settings.org` | Org settings | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.employer.settings.industry` | Industries | P1 | `CASE-JOB-POSTING` |
| `w.employer.settings.billing` | Billing (if any) | P2 | `CASE-TOKEN` |
| `w.employer.reports.shifts` | Shift attendance report | P1 | `CASE-CHECKIN` |
| `w.employer.shift.attendance` | Manual confirm + disputes | P0 | T-134–T-135, T-210–T-214 |
| `w.employer.verification` | Firm verification status | P0 | T-015 |
| `w.employer.abuse.report` | Report abuse | P1 | `CASE-ABUSE` |

## Admin console

**Full case-domain coverage (required):** [`08-admin-case-coverage.md`](08-admin-case-coverage.md) · [ADR-0034](../backend/adr/0034-admin-full-case-coverage.md). All rows **P0** — production ops, not deferred.

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `w.admin.login` | Admin login | P0 | `CASE-SECURITY`, `CASE-AUTH` |
| `w.admin.dashboard` | Ops dashboard | P0 | `CASE-PERF`, `CASE-ABUSE` |
| `w.admin.perf.metrics` | Perf / queue metrics | P0 | T-226–T-234 |
| `w.admin.users.list` | Users | P0 | `CASE-SECURITY`, `CASE-AUTH` |
| `w.admin.users.detail` | User detail / restrict | P0 | `CASE-ABUSE`, `CASE-SECURITY` |
| `w.admin.workers.list` | Workers | P0 | `CASE-WORKER-PROFILE` |
| `w.admin.workers.detail` | Worker detail | P0 | `CASE-WORKER-PROFILE`, `CASE-FAVORITES` |
| `w.admin.employers.list` | Employers | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.admin.employers.detail` | Employer detail | P0 | `CASE-EMPLOYER-BRANCH`, `CASE-TOKEN`, `CASE-FAVORITES` |
| `w.admin.branches.list` | Branches oversight | P0 | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| `w.admin.verification.queue` | Firm verification | P0 | `CASE-AUTH` (T-015) |
| `w.admin.jobs.list` | Jobs oversight | P0 | `CASE-JOB-POSTING` |
| `w.admin.jobs.detail` | Job detail / force-close | P0 | `CASE-JOB-POSTING`, `CASE-FAVORITES`, `CASE-TOKEN` |
| `w.admin.catalog.manage` | Job catalog CMS | P0 | `CASE-JOB-POSTING` |
| `w.admin.matching.diagnostics` | Matching explain | P0 | `CASE-MATCHING` |
| `w.admin.applications.list` | Applications | P0 | `CASE-APPLICATION`, `CASE-EMPLOYER-REVIEW` |
| `w.admin.applications.detail` | Application detail | P0 | `CASE-APPLICATION`, `CASE-EMPLOYER-REVIEW` |
| `w.admin.shifts.list` | Shifts | P0 | `CASE-AVAILABILITY-3H`, `CASE-CHECKIN` |
| `w.admin.shifts.detail` | Shift detail | P0 | `CASE-AVAILABILITY-3H`, `CASE-CHECKIN`, `CASE-E2E` |
| `w.admin.disputes.queue` | Check-in disputes | P0 | `CASE-CHECKIN` (T-134–135) |
| `w.admin.tokens.ledger` | Platform token ledger | P0 | `CASE-TOKEN` |
| `w.admin.ratings.queue` | Ratings moderation | P0 | `CASE-RATINGS` |
| `w.admin.ratings.detail` | Rating detail | P0 | `CASE-RATINGS`, `CASE-ABUSE` |
| `w.admin.documents.queue` | Document review | P0 | `CASE-WORKER-PROFILE`, `CASE-SECURITY` (T-249) |
| `w.admin.notifications.outbox` | Notify outbox / failures | P0 | `CASE-NOTIFICATIONS` |
| `w.admin.notifications.broadcast` | Broadcast tool | P0 | `CASE-NOTIFICATIONS` |
| `w.admin.abuse.queue` | Abuse / tickets queue | P0 | `CASE-ABUSE` |
| `w.admin.abuse.detail` | Ticket detail | P0 | `CASE-ABUSE` |
| `w.admin.risk.queue` | Risk / multi-account / mock GPS | P0 | `CASE-ABUSE`, `CASE-LOCATION` |
| `w.admin.policies.manage` | Policy documents | P0 | `CASE-AUTH`, `CASE-SECURITY` |
| `w.admin.config.remote` | App config / geofence / flags | P0 | `CASE-UX`, `CASE-LOCATION` |
| `w.admin.audit.log` | Legal audit log | P0 | `CASE-SECURITY` · [11-legal-audit-reports](11-legal-audit-reports.md) · ADR-0037 |
| `w.admin.audit.detail` | Legal audit event detail | P0 | `CASE-SECURITY` · ADR-0037 |
| `w.admin.audit.reports` | Legal audit CSV/PDF reports | P0 | `CASE-SECURITY` · ADR-0037 |
| `w.admin.devops.overview` | DevOps overview | P0 | `CASE-PERF` · [09-admin-devops](09-admin-devops.md) · ADR-0035 |
| `w.admin.devops.errors.list` | Error issues | P0 | `CASE-PERF`, `CASE-SECURITY` |
| `w.admin.devops.errors.detail` | Error detail / triage | P0 | `CASE-PERF` |
| `w.admin.devops.releases` | Releases / git SHA | P0 | deploy ops · ADR-0035 |
| `w.admin.devops.services` | Service health | P0 | `CASE-PERF` |
| `w.admin.devops.clients` | Client builds / versions | P0 | AO-12 · ADR-0035 |

## Counts (case-complete inventory)

| Area | Screens |
| --- | --- |
| Public & auth | 8 |
| Employer console | 24 |
| Admin console | **40** |
| **Total** | **72** |

Create-job must include **favorites-only** flag (T-056, T-168).  
Case map: [`../cases/00-coverage-matrix.md`](../cases/00-coverage-matrix.md)
