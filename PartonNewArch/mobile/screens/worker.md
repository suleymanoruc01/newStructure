# Mobile — Worker screens

**Status:** `proposed`  
**Nest modules:** `workers`, `jobs`, `matching`, `applications`, `shifts`, `location`, `favorites`, `notifications`, `ratings`

---

## `m.worker.home.root` — Worker home

| Field | Detail |
| --- | --- |
| **Route** | `/worker/home` |
| **Role** | Worker |
| **Purpose** | Today snapshot: upcoming shift, confirmations due, matched job teaser |
| **MVP** | P0 |
| **Entry** | Worker tab root |
| **Layout** | Header (name/rating); alert cards; next shift CTA; horizontal matched jobs; shortcuts |
| **Actions** | Open check-in / 3h confirm; Open job; Open notifications |
| **States** | empty (no jobs) → explore feed CTA; blocked profile incomplete |
| **API** | `GET /api/v1/workers/me/home` (aggregate) or composed calls |
| **Cases** | `CASE-E2E`, `CASE-MATCHING`, `CASE-AVAILABILITY-3H`, `CASE-CHECKIN` |
| **Legacy** | `EmployeeHomeScreen` |

---

## `m.worker.jobs.list` — Job feed

| Field | Detail |
| --- | --- |
| **Route** | `/worker/jobs` |
| **Role** | Worker |
| **Purpose** | Browse server-ranked eligible jobs |
| **MVP** | P0 |
| **Entry** | Jobs tab; home teaser |
| **Layout** | Filter chips (date, distance, sector); list cards (pay, time, distance, match reasons); pull-to-refresh |
| **Actions** | Open detail; Favorite employer/job; Adjust filters |
| **States** | loading skeleton; empty unmatched; error retry; offline banner |
| **API** | `GET /api/v1/jobs/feed` |
| **Cases** | `CASE-MATCHING`, `CASE-LOCATION`, `CASE-PERF` |
| **Legacy** | `EmployeeJobsScreen` |
| **Notes** | Matching rules enforced server-side; client only displays eligibility reasons |

---

## `m.worker.jobs.detail` — Job detail

| Field | Detail |
| --- | --- |
| **Route** | `/worker/jobs/:jobId` |
| **Role** | Worker |
| **Purpose** | Full job info + apply eligibility |
| **MVP** | P0 |
| **Entry** | Feed, push, favorites |
| **Layout** | Header (employer/branch); schedule; pay; requirements; map preview; match breakdown; sticky Apply |
| **Actions** | Apply; Favorite; Share (P2); Report |
| **States** | not eligible (reasons); already applied; job closed |
| **API** | `GET /api/v1/jobs/:id`; `POST /api/v1/jobs/:id/applications` |
| **Cases** | `CASE-APPLICATION`, `CASE-MATCHING`, `CASE-SECURITY` |
| **Legacy** | `EmployeeJobDetailScreen` |

---

## `m.worker.jobs.apply-confirm` — Apply confirm

| Field | Detail |
| --- | --- |
| **Route** | `/worker/jobs/:jobId/apply` |
| **Role** | Worker |
| **Purpose** | Confirm application with summary of commitments |
| **MVP** | P0 |
| **Entry** | Job detail Apply |
| **Layout** | Summary card; conflict warnings; confirm CTA |
| **Actions** | Confirm apply; Cancel |
| **States** | conflict with another accepted shift; profile incomplete; success toast → process detail |
| **API** | `POST /api/v1/jobs/:id/applications` (+ `Idempotency-Key`) |
| **Cases** | `CASE-APPLICATION`, `CASE-ABUSE` |
| **Legacy** | inline in job detail / process |

---

## `m.worker.applications.list` — My applications

| Field | Detail |
| --- | --- |
| **Route** | `/worker/applications` |
| **Role** | Worker |
| **Purpose** | Track pending / accepted / rejected applications |
| **MVP** | P1 |
| **Entry** | Profile or home shortcut |
| **Layout** | Segmented status tabs; list rows |
| **Actions** | Open process detail; Withdraw (if allowed) |
| **API** | `GET /api/v1/applications?mine=1` |
| **Cases** | `CASE-APPLICATION`, `CASE-EMPLOYER-REVIEW` |
| **Legacy** | partial via home / process |

---

## `m.worker.calendar.root` — Calendar

| Field | Detail |
| --- | --- |
| **Route** | `/worker/calendar` |
| **Role** | Worker |
| **Purpose** | See scheduled shifts + availability days |
| **MVP** | P1 |
| **Entry** | Calendar tab |
| **Layout** | Month/week toggle; event chips; CTA to edit availability |
| **Actions** | Open shift; Edit availability |
| **API** | `GET /api/v1/workers/me/calendar` |
| **Cases** | `CASE-WORKER-PROFILE`, `CASE-CHECKIN` |
| **Legacy** | `EmployeeCalendarScreen` |

---

## `m.worker.availability.edit` — Availability editor

| Field | Detail |
| --- | --- |
| **Route** | `/worker/availability` |
| **Role** | Worker |
| **Purpose** | Set days + multi time windows (3h matching depends on this) |
| **MVP** | P0 |
| **Entry** | Onboarding; calendar; profile |
| **Layout** | Weekday selectors; add ranges; conflict highlighting |
| **Actions** | Add range; Delete; Save |
| **States** | overlapping ranges blocked; save success |
| **API** | `PUT /api/v1/workers/me/availability` |
| **Cases** | `CASE-WORKER-PROFILE`, `CASE-AVAILABILITY-3H`, `CASE-MATCHING` |
| **Legacy** | `EmployeeAvailabilityScreen` |

---

## `m.worker.shift.prep` — Work prep

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/prep` |
| **Role** | Worker |
| **Purpose** | Pre-shift checklist (address, dress code, contact) |
| **MVP** | P1 |
| **Entry** | Home / push day-of |
| **Layout** | Checklist; map; employer notes |
| **Actions** | Navigate (maps); Start check-in flow |
| **API** | `GET /api/v1/shifts/:id` |
| **Cases** | `CASE-CHECKIN`, `CASE-UX` |
| **Legacy** | `EmployeeWorkPrepScreen` |

---

## `m.worker.shift.availability-confirm` — 3h confirmation

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/confirm-availability` |
| **Role** | Worker |
| **Purpose** | Confirm “I can come” / “I cannot” ~3h before |
| **MVP** | P0 |
| **Entry** | Push; home alert card |
| **Layout** | Job summary; two primary choices; optional reason on decline |
| **Actions** | Confirm; Decline |
| **States** | window expired; already answered |
| **API** | `POST /api/v1/shifts/:id/availability-confirm` |
| **Cases** | `CASE-AVAILABILITY-3H`, `CASE-NOTIFICATIONS`, `CASE-ABUSE` |
| **Legacy** | notification-driven flows |

---

## `m.worker.shift.check-in` — Check-in

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/check-in` |
| **Role** | Worker |
| **Purpose** | “İşe geldim” with location verification |
| **MVP** | P0 |
| **Entry** | Push 10m; prep; home |
| **Layout** | Permission status; live distance to branch; primary Check-in; help if outside radius |
| **Actions** | Check-in; Open settings for location; Cancel |
| **States** | permission denied; outside geofence; too early/late; success |
| **API** | `POST /api/v1/shifts/:id/check-in` (+ lat/lng/accuracy) |
| **Cases** | `CASE-CHECKIN`, `CASE-LOCATION`, `CASE-SECURITY` |
| **Legacy** | `EmployeeCheckInScreen` |
| **Notes** | Server validates radius/time; client never marks success alone |

---

## `m.worker.shift.in-shift` — In-shift actions

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/active` |
| **Role** | Worker |
| **Purpose** | Actions while on active shift |
| **MVP** | P1 |
| **Entry** | After successful check-in |
| **Layout** | Timer/status; contact manager; incident/report; checkout CTA near end |
| **API** | `GET /api/v1/shifts/:id` |
| **Cases** | `CASE-CHECKIN`, `CASE-ABUSE` |
| **Legacy** | `EmployeeInShiftActionsScreen` |

---

## `m.worker.shift.check-out` — Check-out

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/check-out` |
| **Role** | Worker |
| **Purpose** | End shift confirmation |
| **MVP** | P1 |
| **Entry** | In-shift; time window |
| **Layout** | Summary; optional notes; confirm |
| **API** | `POST /api/v1/shifts/:id/check-out` |
| **Cases** | `CASE-CHECKIN`, `CASE-RATINGS` (triggers pending rating) |
| **Legacy** | `EmployeeCheckOutScreen` |

---

## `m.worker.profile.root` — Profile

| Field | Detail |
| --- | --- |
| **Route** | `/worker/profile` |
| **Role** | Worker |
| **Purpose** | Identity, rating, shortcuts |
| **MVP** | P0 |
| **Entry** | Profile tab |
| **Layout** | Avatar/name/rating; completeness meter; links (availability, applications, favorites, revenue, settings) |
| **Actions** | Edit; Logout (via settings) |
| **API** | `GET /api/v1/workers/me` |
| **Cases** | `CASE-WORKER-PROFILE` |
| **Legacy** | `EmployeeProfileScreen`, `ProfileOverviewScreen` |

---

## `m.worker.profile.edit` — Edit profile

| Field | Detail |
| --- | --- |
| **Route** | `/worker/profile/edit` |
| **Role** | Worker |
| **Purpose** | Update personal / skills fields |
| **MVP** | P0 |
| **API** | `PATCH /api/v1/workers/me` |
| **Cases** | `CASE-WORKER-PROFILE` |
| **Legacy** | profile setup reuse |

---

## `m.worker.revenue.root` — Revenue

| Field | Detail |
| --- | --- |
| **Route** | `/worker/revenue` |
| **Role** | Worker |
| **Purpose** | Earnings history / stats |
| **MVP** | P2 |
| **API** | `GET /api/v1/workers/me/revenue` |
| **Cases** | `CASE-WORKER-PROFILE` |
| **Legacy** | `EmployeeRevenueScreen` |

---

## `m.worker.favorites.list` — Favorites

| Field | Detail |
| --- | --- |
| **Route** | `/worker/favorites` |
| **Role** | Worker |
| **Purpose** | Saved employers/jobs |
| **MVP** | P1 |
| **API** | `GET /api/v1/favorites` |
| **Cases** | `CASE-FAVORITES` |
| **Legacy** | favorites surfaces |

---

## `m.worker.push-prefs` — Push preferences

| Field | Detail |
| --- | --- |
| **Route** | `/worker/settings/push` |
| **Role** | Worker |
| **Purpose** | Toggle notification categories |
| **MVP** | P1 |
| **API** | `PATCH /api/v1/notifications/preferences` |
| **Cases** | `CASE-NOTIFICATIONS` |
| **Legacy** | `EmployeePushPrefsScreen` |
