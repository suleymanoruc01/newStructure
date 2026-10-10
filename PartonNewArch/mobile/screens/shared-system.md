# Mobile — Shared & system screens

**Status:** `accepted` (production coding inventory) · [agents/10](../../agents/10-production-ready.md)  
Used across roles; keep UI consistent.

---

## `m.shared.notifications.list` — Inbox

| Field | Detail |
| --- | --- |
| **Route** | `/notifications` |
| **Role** | Any authenticated |
| **Purpose** | In-app notification center (source of truth when push off — T-111) |
| **MVP** | P0 |
| **Recipe** | R1 |
| **Primary CTA** | Open notification target (`DeepLinkRouter`) |
| **Components** | `NotificationRow`, `InboxEmpty`, `SkeletonList`; push-denied banner → settings |
| **Layout** | Grouped Today/Yesterday/Earlier; unread dots; swipe mark-read; optional denied-push strip |
| **Actions** | Open target (same map as FCM); Mark all read; open push prefs |
| **API** | `GET /api/v1/notifications`; `POST .../read` |
| **Cases** | `CASE-NOTIFICATIONS` |
| **UX catalog** | [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) |
| **Legacy** | employee/employer/manager notification screens (unify shell) |

---

## `m.shared.notifications.detail` — Notification detail

| Field | Detail |
| --- | --- |
| **Route** | `/notifications/:id` |
| **MVP** | P1 |
| **Purpose** | Long `inboxBody` when tray truncated; stale-target fallback CTA |
| **Recipe** | R2 |
| **Primary CTA** | Continue to entity screen or home |
| **Components** | Detail body; `PrimaryButton` deep link |
| **API** | `GET /api/v1/notifications/:id` |
| **Cases** | `CASE-NOTIFICATIONS` |

---

## `m.shared.notifications.push-prefs` — Push preferences

| Field | Detail |
| --- | --- |
| **Route** | `/settings/notifications` |
| **MVP** | P1 |
| **Purpose** | Category toggles; marketing opt-in; open OS settings |
| **Recipe** | R6 |
| **Components** | `PushPrefToggles`, `PermissionExplainer` |
| **API** | `GET/PATCH /api/v1/notifications/preferences` |
| **Cases** | T-111, KVKK marketing |
| **Categories** | shifts · applications · matching · favorites · marketing (OFF default) |

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
| **Related** | Entry to `m.shared.auth.context-switch` when multi-membership |

---

## `m.shared.auth.context-switch` — Switch role / membership

| Field | Detail |
| --- | --- |
| **Route** | `/auth/context` (sheet or full screen) |
| **Role** | Any with ≥2 memberships |
| **Purpose** | Pick active role / employer / branch context (AS-3) |
| **MVP** | P0 |
| **Components** | `RoleSwitcherSheet`, `MembershipListItem`, `ActiveContextBadge` |
| **API** | `POST /api/v1/auth/context` |
| **Cases** | AS-3, multi-role |
| **Detail** | [`case-driven-additions.md`](case-driven-additions.md) |

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

### `m.shared.system.forbidden`

| Field | Detail |
| --- | --- |
| **Route** | `/system/forbidden` |
| **Purpose** | 403 / wrong-tenant / cross-user deny (user-visible) |
| **MVP** | P0 |
| **Components** | `ForbiddenState`, `TenantMismatchExplain` |
| **Cases** | T-244, T-245, T-246 |
| **Detail** | [`case-driven-additions.md`](case-driven-additions.md) |

### `m.shared.system.session-expired`

| Field | Detail |
| --- | --- |
| **Route** | `/system/session-expired` (or global modal) |
| **Purpose** | Re-auth after JWT expiry / forced logout |
| **MVP** | P0 |
| **Components** | `SessionExpiredCard`, `ReauthCta` |
| **Cases** | T-247 |
| **Detail** | [`case-driven-additions.md`](case-driven-additions.md) |
