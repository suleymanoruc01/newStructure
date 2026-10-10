# 02 — Mobile screen catalog (index)

**Status:** `accepted` (inventory must cover all catalog cases)  
**Last updated:** 2026-10-09  
**Mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md) · **Components:** [`../shared/02-ui-components.md`](../shared/02-ui-components.md) · **UX layouts:** [`../shared/03-screen-ux-layout.md`](../shared/03-screen-ux-layout.md)

Full inventory. Detail lives under [`screens/`](screens/). **Every** `CASE-*` feature needs a screen here and/or web/admin plus named components, a layout recipe (R1–R8), and one primary CTA.

## MVP legend

| Tag | Meaning |
| --- | --- |
| **P0** | Required for first closed beta |
| **P1** | Needed for full Parton case coverage |
| **P2** | Later / polish |

## Auth & onboarding

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `m.auth.tutorial` | App tutorial | P2 | `CASE-UX` |
| `m.auth.phone` | Phone entry | P0 | `CASE-AUTH` |
| `m.auth.otp` | OTP verify | P0 | `CASE-AUTH`, `CASE-SECURITY` |
| `m.auth.role-select` | Role select | P0 | `CASE-AUTH` |
| `m.auth.policies` | Policy accept | P0 | `CASE-AUTH` |
| `m.auth.email` | Email register (optional) | P1* | T-002 |
| `m.auth.password-set` | Password set (optional) | P1* | T-008 |
| `m.auth.password-reset` | Password reset (optional) | P1* | T-248 |
| `m.worker.onboarding.profile` | Worker profile setup | P0 | `CASE-WORKER-PROFILE` |
| `m.employer.onboarding.business` | Employer business setup | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.onboarding.checklist` | Employer setup checklist | P1 | `CASE-EMPLOYER-BRANCH` |
| `m.manager.onboarding.join` | Join with manager code | P0 | `CASE-EMPLOYER-BRANCH` |

## Worker

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `m.worker.home.root` | Worker home | P0 | `CASE-E2E`, `CASE-MATCHING` |
| `m.worker.jobs.list` | Job feed | P0 | `CASE-MATCHING`, `CASE-JOB-POSTING` |
| `m.worker.jobs.detail` | Job detail | P0 | `CASE-MATCHING`, `CASE-APPLICATION` |
| `m.worker.jobs.apply-confirm` | Apply confirm | P0 | `CASE-APPLICATION` |
| `m.worker.jobs.apply-overlap` | Overlap warn / block sheet | P0 | T-085, T-181 |
| `m.worker.applications.list` | My applications | P1 | `CASE-APPLICATION` |
| `m.worker.calendar.root` | Calendar / schedule | P1 | `CASE-WORKER-PROFILE` |
| `m.worker.availability.edit` | Availability editor | P0 | `CASE-AVAILABILITY-3H`, `CASE-WORKER-PROFILE` |
| `m.worker.shift.prep` | Work prep | P1 | `CASE-CHECKIN` |
| `m.worker.shift.availability-confirm` | 3h can-I-come | P0 | `CASE-AVAILABILITY-3H` |
| `m.worker.shift.check-in` | Check-in | P0 | `CASE-CHECKIN`, `CASE-LOCATION` |
| `m.worker.shift.dispute` | Check-in dispute | P0 | T-135, T-212 |
| `m.worker.shift.in-shift` | In-shift actions | P1 | `CASE-CHECKIN` |
| `m.worker.shift.check-out` | Check-out | P1 | `CASE-CHECKIN` |
| `m.worker.documents.list` | Documents | P0 | T-022–T-024 |
| `m.worker.documents.upload` | Upload document | P0 | T-023–T-024, T-249 |
| `m.worker.profile.root` | Profile overview | P0 | `CASE-WORKER-PROFILE` |
| `m.worker.profile.edit` | Edit profile | P0 | `CASE-WORKER-PROFILE` |
| `m.worker.revenue.root` | Earnings / revenue | P2 | `CASE-WORKER-PROFILE` |
| `m.worker.favorites.list` | Favorites | P1 | `CASE-FAVORITES` |
| `m.worker.push-prefs` | Push preferences | P1 | `CASE-NOTIFICATIONS` |

## Employer

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `m.employer.home.root` | Employer home | P0 | `CASE-E2E` |
| `m.employer.dashboard` | Dashboard metrics | P2 | `CASE-PERF` |
| `m.employer.business.root` | Business profile | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.industry.manage` | Industry scope | P1 | `CASE-EMPLOYER-BRANCH`, `CASE-JOB-POSTING` |
| `m.employer.branches.list` | Branch list | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.branches.detail` | Branch detail | P0 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.branches.form` | Create / edit branch | P0 | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| `m.employer.jobs.list` | Jobs list | P0 | `CASE-JOB-POSTING` |
| `m.employer.jobs.detail` | Job detail | P0 | `CASE-JOB-POSTING`, `CASE-EMPLOYER-REVIEW` |
| `m.employer.jobs.create.step1` | Create job — positions | P0 | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| `m.employer.jobs.create.step2` | Create job — details | P0 | `CASE-JOB-POSTING` |
| `m.employer.jobs.create.step3` | Create job — summary | P0 | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| `m.employer.jobs.form` | Edit job (single form) | P1 | `CASE-JOB-POSTING` |
| `m.employer.applicants.list` | Applicants | P0 | `CASE-EMPLOYER-REVIEW`, `CASE-APPLICATION` |
| `m.employer.applicants.detail` | Applicant detail | P0 | `CASE-EMPLOYER-REVIEW` |
| `m.employer.tokens.root` | Token / provision balance | P0 | `CASE-TOKEN` |
| `m.employer.tokens.top-up` | Token top-up | P1 | T-161 |
| `m.employer.verification.status` | Firm verification | P0 | T-015 |
| `m.employer.shift.manual-confirm` | Manual attendance confirm | P0 | T-134, T-213 |
| `m.employer.ops.settings` | Ops settings | P2 | `CASE-EMPLOYER-BRANCH` |
| `m.employer.favorites.workers` | Favorite workers | P1 | `CASE-FAVORITES` |
| `m.employer.profile.root` | Employer profile tab | P0 | `CASE-EMPLOYER-BRANCH` |

## Manager

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `m.manager.home.root` | Manager home | P0 | `CASE-E2E`, `CASE-CHECKIN` |
| `m.manager.jobs.list` | Manager jobs | P0 | `CASE-JOB-POSTING` |
| `m.manager.jobs.form` | Create / edit job (scoped) | P1 | `CASE-JOB-POSTING` |
| `m.manager.applicants.list` | Applicants (scoped) | P0 | `CASE-EMPLOYER-REVIEW` |
| `m.manager.notifications.list` | Notifications | P0 | `CASE-NOTIFICATIONS` |
| `m.manager.profile.root` | Manager profile | P0 | `CASE-EMPLOYER-BRANCH` |

## Shared / system

| ID | Name | MVP | Cases |
| --- | --- | --- | --- |
| `m.shared.notifications.list` | Inbox | P0 | `CASE-NOTIFICATIONS` |
| `m.shared.notifications.detail` | Notification detail | P1 | `CASE-NOTIFICATIONS` |
| `m.shared.notifications.push-prefs` | Push preferences | P1 | T-111 |
| `m.shared.ratings.compose` | Rate counterpart | P1 | `CASE-RATINGS` |
| `m.shared.ratings.pending` | Pending ratings | P1 | `CASE-RATINGS` |
| `m.shared.job-process.detail` | Job process timeline | P1 | `CASE-APPLICATION`, `CASE-E2E` |
| `m.shared.profile.settings` | Account settings | P0 | `CASE-AUTH`, `CASE-SECURITY` |
| `m.shared.auth.context-switch` | Switch role / membership | P0 | AS-3, multi-role |
| `m.shared.abuse.report` | Report abuse | P1 | `CASE-ABUSE` |
| `m.shared.system.maintenance` | Maintenance | P0 | `CASE-UX` |
| `m.shared.system.restriction` | Restriction | P0 | `CASE-ABUSE`, `CASE-SECURITY` |
| `m.shared.system.blocking` | Blocking status | P1 | `CASE-SECURITY` |
| `m.shared.system.forbidden` | Forbidden / wrong tenant | P0 | T-244–246 |
| `m.shared.system.session-expired` | Session expired | P0 | T-247 |

## Counts (case-complete inventory)

| Area | Screens |
| --- | --- |
| Auth / onboarding | 12 (incl. 3 optional email/password) |
| Worker | 21 |
| Employer | 22 |
| Manager | 6 |
| Shared / system | 14 |
| **Total** | **75** |

\* Optional auth screens ship only if product keeps email/password cases.

Detail for new screens: [`screens/case-driven-additions.md`](screens/case-driven-additions.md)  
Full case map: [`../cases/00-coverage-matrix.md`](../cases/00-coverage-matrix.md)
