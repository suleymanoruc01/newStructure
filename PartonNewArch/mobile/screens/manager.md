# Mobile — Manager screens

**Status:** `accepted` (production coding inventory) · [agents/10](../../agents/10-production-ready.md)  
**Nest modules:** `branches`, `jobs`, `applications`, `shifts`, `notifications`  
**Scope rule:** Every query is branch-scoped via JWT / membership.

---

## `m.manager.home.root` — Manager home

| Field | Detail |
| --- | --- |
| **Route** | `/manager/home` |
| **Role** | Manager |
| **Purpose** | Today at assigned branch: who’s arriving, pending confirms, open roles |
| **MVP** | P0 |
| **Layout** | Branch switcher (if multi); today’s timeline; alert cards |
| **Actions** | Open job; Open applicant; Open notifications |
| **API** | `GET /api/v1/managers/me/home` |
| **Cases** | `CASE-CHECKIN`, `CASE-AVAILABILITY-3H`, `CASE-E2E` |
| **Legacy** | `ManagerHomeScreen` |

---

## `m.manager.jobs.list` — Manager jobs

| Field | Detail |
| --- | --- |
| **Route** | `/manager/jobs` |
| **Role** | Manager |
| **Purpose** | List jobs for current branch context |
| **MVP** | P0 |
| **Actions** | Open detail; Create job (if permitted) |
| **API** | `GET /api/v1/jobs?branchId=` |
| **Cases** | `CASE-JOB-POSTING` |
| **Legacy** | `ManagerJobsScreen` |

---

## `m.manager.jobs.form` — Create / edit job (scoped)

| Field | Detail |
| --- | --- |
| **Route** | `/manager/jobs/create` · `/manager/jobs/:id/edit` |
| **Role** | Manager |
| **Purpose** | Branch-limited job create (may reuse employer wizard steps) |
| **MVP** | P1 |
| **Notes** | Token spend may require employer approval — `open` |
| **API** | `POST /api/v1/jobs` with branch scope |
| **Cases** | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| **Legacy** | `ManagerJobFormViewModel` |

---

## `m.manager.applicants.list` — Applicants (scoped)

| Field | Detail |
| --- | --- |
| **Route** | `/manager/jobs/:jobId/applicants` |
| **Role** | Manager |
| **Purpose** | Review applicants for branch jobs |
| **MVP** | P0 |
| **Actions** | Accept / Reject (if authorized) |
| **API** | same application endpoints with scope checks |
| **Cases** | `CASE-EMPLOYER-REVIEW`, `CASE-SECURITY` |
| **Legacy** | `ManagerJobApplicantsViewModel` |

---

## `m.manager.notifications.list` — Notifications

| Field | Detail |
| --- | --- |
| **Route** | `/manager/notifications` |
| **Role** | Manager |
| **Purpose** | Ops inbox (no-shows, check-ins, new applicants) |
| **MVP** | P0 |
| **API** | `GET /api/v1/notifications` |
| **Cases** | `CASE-NOTIFICATIONS` |
| **Legacy** | `ManagerNotificationsScreen` |

---

## `m.manager.profile.root` — Manager profile

| Field | Detail |
| --- | --- |
| **Route** | `/manager/profile` |
| **Role** | Manager |
| **Purpose** | Identity, branch memberships, settings, logout |
| **MVP** | P0 |
| **API** | `GET /api/v1/managers/me` |
| **Cases** | `CASE-EMPLOYER-BRANCH` |
| **Legacy** | `ManagerProfileScreen` |
