# Web — Employer console screens

**Status:** `accepted` (catalogued; employer **web** channel optional for v1 — mobile employer primary) · [agents/10](../../agents/10-production-ready.md)
**Nest modules:** `employers`, `branches`, `jobs`, `applications`, `notifications`, `favorites`, `ratings`, tokens  
**Shell:** Sidebar + top bar (see IA)

---

## `w.employer.dashboard` — Dashboard

| Field | Detail |
| --- | --- |
| **Route** | `/app` |
| **Role** | Employer |
| **Purpose** | At-a-glance ops: open jobs, pending applicants, today’s shifts, token chip |
| **MVP** | P0 |
| **Layout** | KPI row; “Needs attention” table; shortcuts (Create job, Review) |
| **Actions** | Deep link into jobs/applicants/branches |
| **API** | `GET /api/v1/employers/me/home` (+ optional analytics) |
| **Cases** | `CASE-E2E`, `CASE-EMPLOYER-REVIEW`, `CASE-TOKEN` |
| **Mobile twin** | `m.employer.home.root` / `m.employer.dashboard` |

---

## Jobs

### `w.employer.jobs.list` — Jobs table

| Field | Detail |
| --- | --- |
| **Route** | `/app/jobs` |
| **Purpose** | Filterable table of all postings |
| **MVP** | P0 |
| **Layout** | Filters (status, branch, date); columns: title, branch, start, headcount, applicants, tokens held, status; row actions |
| **Actions** | Create; Open; Duplicate; Close |
| **API** | `GET /api/v1/jobs?employer=me` |
| **Cases** | `CASE-JOB-POSTING`, `CASE-PERF` |
| **Mobile twin** | `m.employer.jobs.list` |

### `w.employer.jobs.create` — Create job

| Field | Detail |
| --- | --- |
| **Route** | `/app/jobs/new` |
| **Purpose** | Multi-step create with live token cost sidebar |
| **MVP** | P0 |
| **Recipe** | R3 |
| **Wizard id** | `create-job` |
| **State owner** | `WizardShell` (single page step index) or scoped store; controlled steps |
| **Draft API** | Nest `status: draft` — Back/reload must restore ([wizard state](../../shared/04-wizard-state.md)) |
| **Layout** | Steps: Position → Details → Review; sticky summary (cost, branch, schedule) |
| **Components** | `WizardShell`, `JobWizard`, `TokenCostPreview`, `DraftSavedHint`, `FavoritesOnlyToggle` |
| **Actions** | Save draft; Publish |
| **States** | insufficient tokens; validation; success → detail |
| **API** | catalog + `POST/PATCH /api/v1/jobs` |
| **Cases** | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| **Mobile twin** | create step1–3 |

### `w.employer.jobs.detail` — Job detail

| Field | Detail |
| --- | --- |
| **Route** | `/app/jobs/:jobId` |
| **Purpose** | Overview + tabs: Details, Applicants, Timeline, Settings |
| **MVP** | P0 |
| **Actions** | Edit; Close; Open applicants board |
| **API** | `GET /api/v1/jobs/:id` |
| **Cases** | `CASE-JOB-POSTING`, `CASE-EMPLOYER-REVIEW` |
| **Mobile twin** | `m.employer.jobs.detail` |

### `w.employer.jobs.edit` — Edit job

| Field | Detail |
| --- | --- |
| **Route** | `/app/jobs/:jobId/edit` |
| **MVP** | P1 |
| **Notes** | Field locks after publish per server rules |
| **Cases** | `CASE-JOB-POSTING` |

---

## Applicants

### `w.employer.applicants.board` — Applicants board

| Field | Detail |
| --- | --- |
| **Route** | `/app/jobs/:jobId/applicants` · `/app/applicants` (global queue) |
| **Purpose** | High-density review; primary web differentiator |
| **MVP** | P0 |
| **Layout** | Table or kanban (Pending / Shortlisted / Accepted / Rejected); filters: rating, distance, favorite, availability; bulk accept/reject P1 |
| **Actions** | Open drawer; Accept; Reject; Favorite |
| **API** | `GET /api/v1/jobs/:id/applications`; transition endpoints |
| **Cases** | `CASE-EMPLOYER-REVIEW`, `CASE-APPLICATION`, `CASE-FAVORITES`, `CASE-SECURITY` |
| **Mobile twin** | `m.employer.applicants.list` |

### `w.employer.applicants.detail` — Applicant detail

| Field | Detail |
| --- | --- |
| **Route** | Drawer on board or `/app/applications/:id` |
| **Purpose** | Full worker card without leaving board context |
| **MVP** | P0 |
| **Layout** | Profile, ratings, past shifts with this employer, availability overlap, map distance |
| **Actions** | Accept; Reject; Add note (P1); Favorite |
| **API** | `GET /api/v1/applications/:id` |
| **Cases** | `CASE-EMPLOYER-REVIEW`, `CASE-SECURITY` |
| **Mobile twin** | `m.employer.applicants.detail` |

---

## Branches & team

### `w.employer.branches.list` / `form` / `detail`

| ID | Route | MVP | Purpose |
| --- | --- | --- | --- |
| `w.employer.branches.list` | `/app/branches` | P0 | Table of branches |
| `w.employer.branches.form` | `/app/branches/new` · `.../edit` | P0 | Form + map pin (desktop map UX) |
| `w.employer.branches.detail` | `/app/branches/:id` | P0 | Managers, jobs, coordinates |

**Cases:** `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION`  
**API:** `/api/v1/branches*`  
**Mobile twins:** `m.employer.branches.*`

### `w.employer.team.list` — Managers

| Field | Detail |
| --- | --- |
| **Route** | `/app/team` |
| **Purpose** | Invite/revoke managers; show codes; branch assignment |
| **MVP** | P0 |
| **Layout** | Members table; “Generate invite code”; revoke |
| **API** | `GET/POST /api/v1/branches/:id/managers` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-SECURITY` |
| **Mobile twin** | partial via branch detail |

---

## Tokens

### `w.employer.tokens.overview`

| Field | Detail |
| --- | --- |
| **Route** | `/app/tokens` |
| **Purpose** | Balance, held, available; explain holds per open job |
| **MVP** | P0 |
| **Layout** | Balance cards; holds table linked to jobs; CTA top-up |
| **API** | `GET /api/v1/employers/me/tokens` |
| **Cases** | `CASE-TOKEN` |
| **Mobile twin** | `m.employer.tokens.root` |

### `w.employer.tokens.history`

| Field | Detail |
| --- | --- |
| **Route** | `/app/tokens/history` |
| **MVP** | P1 |
| **Purpose** | Ledger of credits/debits/releases |
| **Cases** | `CASE-TOKEN` |

### `w.employer.tokens.top-up`

| Field | Detail |
| --- | --- |
| **Route** | `/app/tokens/top-up` |
| **MVP** | P1 |
| **Purpose** | Purchase / credit tokens |
| **Layout** | Amount picker; payment method; confirm |
| **Components** | `TopUpAmountPicker`, `PaymentMethodList`, `TopUpConfirmSheet` |
| **Cases** | T-161 |
| **Mobile twin** | `m.employer.tokens.top-up` |
| **Detail** | [`case-driven-additions.md`](case-driven-additions.md) |

---

## Other employer screens

| ID | Route | MVP | Purpose | Cases |
| --- | --- | --- | --- | --- |
| `w.employer.favorites.workers` | `/app/favorites/workers` | P1 | Saved workers | `CASE-FAVORITES` |
| `w.employer.ratings.pending` | `/app/ratings/pending` | P1 | Rate completed shifts | `CASE-RATINGS` |
| `w.employer.notifications` | `/app/notifications` | P1 | Inbox | `CASE-NOTIFICATIONS` |
| `w.employer.settings.org` | `/app/settings/org` | P0 | Company profile | `CASE-EMPLOYER-BRANCH` |
| `w.employer.settings.industry` | `/app/settings/industries` | P1 | Industry scope | `CASE-JOB-POSTING` |
| `w.employer.settings.billing` | `/app/settings/billing` | P2 | Payment methods | `CASE-TOKEN` |
| `w.employer.reports.shifts` | `/app/reports/shifts` | P1 | Attendance / no-show report | `CASE-CHECKIN`, `CASE-ABUSE` |
| `w.employer.abuse.report` | `/app/abuse/report` | P1 | Report worker/job issues | `CASE-ABUSE` |

### `w.employer.reports.shifts` detail

| Field | Detail |
| --- | --- |
| **Layout** | Date range; branch filter; table: worker, job, confirm, check-in result, distance |
| **Actions** | Export CSV (P1); Open application timeline |
| **Notes** | Check-in itself is mobile; web is audit/reporting |

### `w.employer.shift.attendance` — Manual confirm & disputes

| Field | Detail |
| --- | --- |
| **Route** | `/app/attendance` · `/app/shifts/:id` |
| **MVP** | P0 |
| **Purpose** | Resolve GPS failures: view dispute, manual confirm, drive token decision |
| **Cases** | T-134–T-135, T-210–T-214 |
| **API** | `POST /api/v1/shifts/:id/manual-confirm`; list disputes |
| **Mobile twin** | `m.employer.shift.manual-confirm` |

### `w.employer.verification` — Firm verification

| Field | Detail |
| --- | --- |
| **Route** | `/app/verification` |
| **MVP** | P0 |
| **Purpose** | Tax/firm verification status; block publish CTAs until verified (T-015) |
| **Cases** | T-013, T-015 |

### Create job — favorites-only

On `w.employer.jobs.create` review step: toggle **Sadece favoriler** (T-056, T-168–T-169). Matching must omit job for non-favorites (T-075).
