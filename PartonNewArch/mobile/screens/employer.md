# Mobile — Employer screens

**Status:** `accepted` (production coding inventory) · [agents/10](../../agents/10-production-ready.md)  
**Nest modules:** `employers`, `branches`, `jobs`, `applications`, `notifications`, `favorites`, tokens (within `jobs`/`employers`)

Dense applicant review & multi-branch job creation are **also** designed for web ([`../../web/`](../../web/)). Mobile covers full P0 paths for on-the-go ops.

---

## `m.employer.home.root` — Employer home

| Field | Detail |
| --- | --- |
| **Route** | `/employer/home` |
| **Role** | Employer |
| **Purpose** | Ops snapshot: open jobs, pending applicants, token balance, checklist |
| **MVP** | P0 |
| **Layout** | KPI chips; action queue; shortcuts to create job / applicants |
| **Actions** | Create job; Review applicants; Manage branches |
| **API** | `GET /api/v1/employers/me/home` |
| **Cases** | `CASE-E2E`, `CASE-EMPLOYER-REVIEW`, `CASE-TOKEN` |
| **Legacy** | `EmployerHomeScreen` |

---

## `m.employer.dashboard` — Dashboard

| Field | Detail |
| --- | --- |
| **Route** | `/employer/dashboard` |
| **Role** | Employer |
| **Purpose** | Charts / historical metrics |
| **MVP** | P2 |
| **Legacy** | `EmployerDashboardScreen` |
| **Notes** | Prefer web for rich analytics |

---

## `m.employer.business.root` — Business profile

| Field | Detail |
| --- | --- |
| **Route** | `/employer/business` |
| **Role** | Employer |
| **Purpose** | View/edit company profile |
| **MVP** | P0 |
| **API** | `GET/PATCH /api/v1/employers/me` |
| **Cases** | `CASE-EMPLOYER-BRANCH` |
| **Legacy** | `EmployerBusinessScreen` |

---

## `m.employer.industry.manage` — Industry management

| Field | Detail |
| --- | --- |
| **Route** | `/employer/industries` |
| **Role** | Employer |
| **Purpose** | Select industries in scope for catalog/jobs |
| **MVP** | P1 |
| **API** | `PUT /api/v1/employers/me/industries` |
| **Cases** | `CASE-JOB-POSTING`, `CASE-EMPLOYER-BRANCH` |
| **Legacy** | `EmployerIndustryManagementScreen` |

---

## `m.employer.branches.list` — Branch list

| Field | Detail |
| --- | --- |
| **Route** | `/employer/branches` |
| **Role** | Employer |
| **Purpose** | List all branches |
| **MVP** | P0 |
| **Layout** | Cards with address, manager count, active jobs |
| **Actions** | Add branch; Open detail |
| **API** | `GET /api/v1/branches` |
| **Cases** | `CASE-EMPLOYER-BRANCH` |
| **Legacy** | `EmployerBranchListScreen` |

---

## `m.employer.branches.detail` — Branch detail

| Field | Detail |
| --- | --- |
| **Route** | `/employer/branches/:branchId` |
| **Role** | Employer |
| **Purpose** | Branch overview, managers, map pin, jobs shortcut |
| **MVP** | P0 |
| **Actions** | Edit; Invite manager (code); View jobs |
| **API** | `GET /api/v1/branches/:id` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| **Legacy** | `EmployerBranchScreen` |

---

## `m.employer.branches.form` — Create / edit branch

| Field | Detail |
| --- | --- |
| **Route** | `/employer/branches/new` · `/employer/branches/:id/edit` |
| **Role** | Employer |
| **Purpose** | Capture name, address, coordinates, contact |
| **MVP** | P0 |
| **Layout** | Form + map pin picker; validate coordinates |
| **Actions** | Save; Delete (edit, if allowed) |
| **States** | invalid geo; duplicate name warning |
| **API** | `POST/PATCH /api/v1/branches` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-LOCATION` |
| **Legacy** | `EmployerBranchCreateEditScreen` |

---

## `m.employer.jobs.list` — Jobs list

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs` |
| **Role** | Employer |
| **Purpose** | Manage postings by status (draft/open/filled/closed) |
| **MVP** | P0 |
| **Layout** | Status filters; job cards with applicant counts |
| **Actions** | Create; Open detail |
| **API** | `GET /api/v1/jobs?employer=me` |
| **Cases** | `CASE-JOB-POSTING` |
| **Legacy** | `EmployerJobsScreen` |

---

## `m.employer.jobs.detail` — Job detail

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/:jobId` |
| **Role** | Employer |
| **Purpose** | Job summary + jump to applicants / edit |
| **MVP** | P0 |
| **Actions** | Edit; Close/cancel; View applicants; Copy |
| **API** | `GET /api/v1/jobs/:id` |
| **Cases** | `CASE-JOB-POSTING`, `CASE-EMPLOYER-REVIEW` |
| **Legacy** | `EmployerJobDetailScreen` |

---

## Create job wizard

**Recipe:** R3 · **Wizard id:** `create-job` · **State owner:** `WizardShell` + scoped `createJobWizardStore` (answers must survive Back) · **Draft API:** `POST/PATCH /api/v1/jobs` (`status: draft`) · Detail: [`../../shared/04-wizard-state.md`](../../shared/04-wizard-state.md) · [ADR-0020](../../backend/adr/0020-wizard-state.md)

Steps are **controlled** views of the shared draft. Do not keep job fields only in step `useState`.

### `m.employer.jobs.create.step1` — Positions

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/create/positions` |
| **Purpose** | Pick sector / occupation / headcount |
| **MVP** | P0 |
| **Recipe** | R3 |
| **State owner** | `createJobWizardStore` / shell |
| **Components** | `WizardShell`, `CatalogPicker`, `HeadcountStepper` |
| **API** | catalog read `GET /api/v1/job-catalog`; draft PATCH |
| **Cases** | `CASE-JOB-POSTING` |
| **Legacy** | `Step1PositionsScreen`, `CreateJobTabScreen` |

### `m.employer.jobs.create.step2` — Details

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/create/details` |
| **Purpose** | Schedule, pay, branch, requirements, notes |
| **MVP** | P0 |
| **Recipe** | R3 |
| **State owner** | same wizard store (hydrate from shell/draft on mount) |
| **Components** | `WizardShell`, branch picker, requirement fields |
| **Cases** | `CASE-JOB-POSTING`, `CASE-LOCATION` |
| **Legacy** | `Step2DetailsScreen`, `EmployerJobFormScreen` |

### `m.employer.jobs.create.step3` — Summary & publish

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/create/summary` |
| **Purpose** | Review + token cost + publish |
| **MVP** | P0 |
| **Recipe** | R3 |
| **State owner** | same wizard store; reset on publish success |
| **Components** | `TokenCostPreview`, `PublishGateBanner`, `FavoritesOnlyToggle`, `DraftSavedHint` |
| **Actions** | Publish; Save draft |
| **States** | insufficient tokens → tokens screen; success |
| **API** | `POST /api/v1/jobs` publish (or promote draft); reserves tokens server-side |
| **Cases** | `CASE-JOB-POSTING`, `CASE-TOKEN` |
| **Legacy** | `Step3SummaryScreen` |

---

## `m.employer.jobs.form` — Edit job

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/:jobId/edit` |
| **MVP** | P1 |
| **Notes** | Limited fields after publish; server enforces |
| **Legacy** | `EmployerJobFormScreen` |

---

## `m.employer.applicants.list` — Applicants

| Field | Detail |
| --- | --- |
| **Route** | `/employer/jobs/:jobId/applicants` |
| **Role** | Employer |
| **Purpose** | Review candidates for a job |
| **MVP** | P0 |
| **Layout** | Filters (rating, distance, favorites); list; bulk actions P2 |
| **Actions** | Open detail; Accept; Reject |
| **API** | `GET /api/v1/jobs/:id/applications` |
| **Cases** | `CASE-EMPLOYER-REVIEW`, `CASE-APPLICATION`, `CASE-FAVORITES` |
| **Legacy** | `EmployerJobApplicantsScreen` |
| **Notes** | Web is preferred for high volume |

---

## `m.employer.applicants.detail` — Applicant detail

| Field | Detail |
| --- | --- |
| **Route** | `/employer/applications/:applicationId` |
| **Purpose** | Worker card + history + decide |
| **MVP** | P0 |
| **Actions** | Accept; Reject; Favorite worker; Message (if exists — `open`) |
| **API** | `GET /api/v1/applications/:id`; `POST .../accept|reject` |
| **Cases** | `CASE-EMPLOYER-REVIEW`, `CASE-SECURITY` |
| **Legacy** | applicant detail within employer flows |

---

## `m.employer.tokens.root` — Tokens / provision

| Field | Detail |
| --- | --- |
| **Route** | `/employer/tokens` |
| **Purpose** | Show balance, holds, purchase/top-up entry (`open` payment) |
| **MVP** | P0 (balance + holds); payment P1/P2 |
| **API** | `GET /api/v1/employers/me/tokens` |
| **Cases** | `CASE-TOKEN` |
| **Legacy** | token-related UI (may have been light in Kotlin) |
| **Related** | Top-up → `m.employer.tokens.top-up` |

---

## `m.employer.tokens.top-up` — Token top-up

| Field | Detail |
| --- | --- |
| **Route** | `/employer/tokens/top-up` |
| **Purpose** | Purchase / credit tokens |
| **MVP** | P1 |
| **Components** | `TopUpAmountPicker`, `PaymentMethodList`, `TopUpConfirmSheet` |
| **Cases** | T-161 |
| **Detail** | [`case-driven-additions.md`](case-driven-additions.md) |

---

## `m.employer.ops.settings` — Ops settings

| Field | Detail |
| --- | --- |
| **Route** | `/employer/settings/ops` |
| **MVP** | P2 |
| **Legacy** | `EmployerOpsSettingsScreen` |

---

## `m.employer.favorites.workers` — Favorite workers

| Field | Detail |
| --- | --- |
| **Route** | `/employer/favorites/workers` |
| **MVP** | P1 |
| **API** | `GET /api/v1/favorites?type=worker` |
| **Cases** | `CASE-FAVORITES` |

---

## `m.employer.profile.root` — Profile tab

| Field | Detail |
| --- | --- |
| **Route** | `/employer/profile` |
| **Purpose** | Org shortcuts: business, industry, tokens, notifications, settings |
| **MVP** | P0 |
| **Legacy** | `EmployerProfileScreen` |
