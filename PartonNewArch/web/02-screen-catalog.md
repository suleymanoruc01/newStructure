# 02 — Web screen catalog (index)

**Status:** `proposed`  
**Last updated:** 2026-10-07

Detail under [`screens/`](screens/).

## Public & auth

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `w.public.landing` | Marketing landing | P1 | `CASE-UX` |
| `w.public.pricing` | Pricing / tokens explainer | P2 | `CASE-TOKEN` |
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

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `w.admin.login` | Admin login | P0 | `CASE-SECURITY` |
| `w.admin.dashboard` | Ops dashboard | P1 | `CASE-PERF` |
| `w.admin.users.list` | Users | P0 | `CASE-SECURITY` |
| `w.admin.users.detail` | User detail / restrict | P0 | `CASE-ABUSE`, `CASE-SECURITY` |
| `w.admin.employers.list` | Employers | P0 | `CASE-EMPLOYER-BRANCH` |
| `w.admin.jobs.list` | Jobs oversight | P1 | `CASE-JOB-POSTING` |
| `w.admin.catalog.manage` | Job catalog CMS | P0 | `CASE-JOB-POSTING` |
| `w.admin.abuse.queue` | Abuse / tickets queue | P0 | `CASE-ABUSE` |
| `w.admin.abuse.detail` | Ticket detail | P0 | `CASE-ABUSE` |
| `w.admin.risk.queue` | Risk / multi-account / mock GPS | P1 | `CASE-ABUSE` |
| `w.admin.policies.manage` | Policy documents | P0 | `CASE-AUTH` |
| `w.admin.config.remote` | App config / geofence / flags | P1 | `CASE-UX`, `CASE-LOCATION` |
| `w.admin.notifications.broadcast` | Broadcast tool | P2 | `CASE-NOTIFICATIONS` |
| `w.admin.audit.log` | Audit log | P1 | `CASE-SECURITY` |

## Counts (after case-catalog enhancement)

| Area | Screens |
| --- | --- |
| Public & auth | 8 |
| Employer console | 23 |
| Admin console | 14 |
| **Total** | **45** |

Create-job must include **favorites-only** flag (T-056, T-168).  
Case map: [`../cases/00-coverage-matrix.md`](../cases/00-coverage-matrix.md)
