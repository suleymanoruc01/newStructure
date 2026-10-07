# Mobile — Shared & system screens

**Status:** `proposed`  
Used across roles; keep UI consistent.

---

## `m.shared.notifications.list` — Inbox

| Field | Detail |
| --- | --- |
| **Route** | `/notifications` |
| **Role** | Any authenticated |
| **Purpose** | In-app notification center |
| **MVP** | P0 |
| **Layout** | Grouped by day; unread markers; swipe mark-read |
| **Actions** | Open target (deep link); Mark all read |
| **API** | `GET /api/v1/notifications`; `POST .../read` |
| **Cases** | `CASE-NOTIFICATIONS` |
| **Legacy** | employee/employer/manager notification screens (unify shell) |

---

## `m.shared.notifications.detail` — Notification detail

| Field | Detail |
| --- | --- |
| **Route** | `/notifications/:id` |
| **MVP** | P1 |
| **Purpose** | Long body when push payload truncated |
| **API** | `GET /api/v1/notifications/:id` |
| **Cases** | `CASE-NOTIFICATIONS` |

---

## `m.shared.ratings.compose` — Compose rating

| Field | Detail |
| --- | --- |
| **Route** | `/ratings/new?shiftId=` |
| **Role** | Worker or Employer/Manager counterpart |
| **Purpose** | Score + optional comment after shift |
| **MVP** | P1 |
| **Layout** | Stars; tags; comment; submit |
| **States** | window not open yet; already submitted; expired |
| **API** | `POST /api/v1/ratings` |
| **Cases** | `CASE-RATINGS` |
| **Legacy** | rating stores / pending ratings |

---

## `m.shared.ratings.pending` — Pending ratings

| Field | Detail |
| --- | --- |
| **Route** | `/ratings/pending` |
| **Purpose** | List ratings still owed |
| **MVP** | P1 |
| **API** | `GET /api/v1/ratings/pending` |
| **Cases** | `CASE-RATINGS` |

---

## `m.shared.job-process.detail` — Job process timeline

| Field | Detail |
| --- | --- |
| **Route** | `/process/:applicationId` |
| **Role** | Worker / Employer / Manager (scoped) |
| **Purpose** | Shared timeline: applied → reviewed → accepted → confirmed → checked-in → rated |
| **MVP** | P1 |
| **Layout** | Vertical stepper + contextual CTAs |
| **API** | `GET /api/v1/applications/:id/timeline` |
| **Cases** | `CASE-APPLICATION`, `CASE-E2E`, `CASE-CHECKIN` |
| **Legacy** | `JobProcessDetailScreen` |

---

## `m.shared.profile.settings` — Account settings

| Field | Detail |
| --- | --- |
| **Route** | `/settings` |
| **Role** | Any |
| **Purpose** | Language, theme (P2), push prefs link, logout, delete account (P1) |
| **MVP** | P0 (logout + legal); others staggered |
| **API** | `POST /api/v1/auth/logout`; account delete endpoint later |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |
| **Legacy** | `ProfileSettingsScreen` |

---

## `m.shared.abuse.report` — Report abuse

| Field | Detail |
| --- | --- |
| **Route** | `/abuse/report` |
| **Purpose** | Report user/job/behavior |
| **MVP** | P1 |
| **Layout** | Category; free text; optional attachments P2 |
| **API** | `POST /api/v1/moderation/reports` |
| **Cases** | `CASE-ABUSE` |
| **Legacy** | tickets |

---

## System blockers

### `m.shared.system.maintenance`

| Field | Detail |
| --- | --- |
| **Route** | `/system/maintenance` |
| **Purpose** | Hard stop when API marks maintenance |
| **MVP** | P0 |
| **Legacy** | `MaintenanceScreen` |

### `m.shared.system.restriction`

| Field | Detail |
| --- | --- |
| **Route** | `/system/restriction` |
| **Purpose** | Account restricted (abuse / risk) |
| **MVP** | P0 |
| **Legacy** | `RestrictionScreen` |
| **Cases** | `CASE-ABUSE`, `CASE-SECURITY` |

### `m.shared.system.blocking`

| Field | Detail |
| --- | --- |
| **Route** | `/system/blocking` |
| **Purpose** | Soft/hard blocks: unpaid, unverified tax, etc. |
| **MVP** | P1 |
| **Legacy** | `BlockingStatusScreen` |
