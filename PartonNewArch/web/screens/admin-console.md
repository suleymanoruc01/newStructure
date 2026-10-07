# Web — Admin console screens

**Status:** `proposed`  
**Nest modules:** `admin` / `moderation`, `users`, `policies`, `jobs` (catalog), config  
**Access:** Role `admin` only; separate host recommended

---

## `w.admin.login` — Admin login

| Field | Detail |
| --- | --- |
| **Route** | `/login` (admin host) |
| **Purpose** | Privileged auth (OTP and/or SSO — `open`) |
| **MVP** | P0 |
| **Cases** | `CASE-SECURITY` |
| **Notes** | Do not reuse employer session cookies across hosts |

---

## `w.admin.dashboard` — Ops dashboard

| Field | Detail |
| --- | --- |
| **Route** | `/` |
| **Purpose** | Queue sizes: open abuse tickets, failed jobs, OTP rate anomalies |
| **MVP** | P1 |
| **Cases** | `CASE-PERF`, `CASE-ABUSE` |

---

## Users & employers

### `w.admin.users.list` / `w.admin.users.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/users` · `/users/:id` |
| **MVP** | P0 |
| **Purpose** | Search users; view roles; restrict / unrestrict; audit recent actions |
| **Actions** | Restrict account; Force logout sessions; View linked employer/worker |
| **API** | admin user endpoints |
| **Cases** | `CASE-SECURITY`, `CASE-ABUSE` |

### `w.admin.employers.list`

| Field | Detail |
| --- | --- |
| **Route** | `/employers` |
| **MVP** | P0 |
| **Purpose** | Find orgs; inspect branches / token balance |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-TOKEN` |

---

## Content & jobs

### `w.admin.jobs.list`

| Field | Detail |
| --- | --- |
| **Route** | `/jobs` |
| **MVP** | P1 |
| **Purpose** | Oversight / force-close abusive postings |
| **Cases** | `CASE-JOB-POSTING`, `CASE-ABUSE` |

### `w.admin.catalog.manage` — Job catalog CMS

| Field | Detail |
| --- | --- |
| **Route** | `/catalog` |
| **MVP** | P0 |
| **Purpose** | Manage sectors / occupations used by create-job wizards |
| **Layout** | Tree or table; publish/draft |
| **API** | admin catalog CRUD |
| **Cases** | `CASE-JOB-POSTING` |

---

## Abuse & policies

### `w.admin.abuse.queue` / `w.admin.abuse.detail`

| Field | Detail |
| --- | --- |
| **Routes** | `/abuse` · `/abuse/:id` |
| **MVP** | P0 |
| **Purpose** | Triage user reports & system-flagged abuse |
| **Actions** | Assign; Resolve; Restrict user; Close job |
| **Cases** | `CASE-ABUSE`, `CASE-SECURITY` |

### `w.admin.policies.manage`

| Field | Detail |
| --- | --- |
| **Route** | `/policies` |
| **MVP** | P0 |
| **Purpose** | Upload/publish policy versions; force re-accept |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |

---

## Platform config

### `w.admin.config.remote`

| Field | Detail |
| --- | --- |
| **Route** | `/config` |
| **MVP** | P1 |
| **Purpose** | Feature flags, maintenance mode, min app versions, geofence defaults |
| **Cases** | `CASE-UX`, `CASE-LOCATION` |

### `w.admin.notifications.broadcast`

| Field | Detail |
| --- | --- |
| **Route** | `/notifications/broadcast` |
| **MVP** | P2 |
| **Purpose** | Careful audience-targeted announcements |
| **Cases** | `CASE-NOTIFICATIONS` |

### `w.admin.audit.log`

| Field | Detail |
| --- | --- |
| **Route** | `/audit` |
| **MVP** | P1 |
| **Purpose** | Immutable-ish log of admin actions |
| **Cases** | `CASE-SECURITY` |
