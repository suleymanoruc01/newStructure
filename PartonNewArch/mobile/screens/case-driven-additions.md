# Mobile — Case-driven screen additions

**Status:** `accepted` (production coding inventory) · [agents/10](../../agents/10-production-ready.md)  
**Why:** Gaps found when mapping all 248 catalog cases.

---

## `m.worker.documents.list` — Documents

| Field | Detail |
| --- | --- |
| **Route** | `/worker/documents` |
| **Role** | Worker |
| **Purpose** | List selected/uploaded certificates used in matching |
| **MVP** | P0 |
| **Cases** | T-022–T-024, T-066–T-067, T-249 |
| **API** | `GET /api/v1/workers/me/documents` |
| **Entry** | Onboarding + profile |

---

## `m.worker.documents.upload` — Upload document

| Field | Detail |
| --- | --- |
| **Route** | `/worker/documents/upload` |
| **Purpose** | Pick doc type + file; validate MIME/size |
| **MVP** | P0 |
| **States** | invalid type (T-024); success |
| **API** | `POST /api/v1/workers/me/documents` (signed upload) |
| **Cases** | T-023, T-024, T-249 |

---

## `m.worker.shift.dispute` — Check-in dispute

| Field | Detail |
| --- | --- |
| **Route** | `/worker/shifts/:shiftId/dispute` |
| **Purpose** | Appeal GPS reject; attach note/photo optional |
| **MVP** | P0 |
| **Entry** | After failed check-in (T-126/T-211) |
| **API** | `POST /api/v1/shifts/:id/disputes` |
| **Cases** | T-135, T-212, T-214 |
| **Next** | Employer manual confirm |

---

## `m.employer.shift.manual-confirm` — Manual attendance

| Field | Detail |
| --- | --- |
| **Route** | `/employer/shifts/:shiftId/manual-confirm` |
| **Role** | Employer / Manager |
| **Purpose** | Confirm worker present when GPS failed |
| **MVP** | P0 |
| **API** | `POST /api/v1/shifts/:id/manual-confirm` |
| **Cases** | T-134, T-213, T-214 |
| **Effect** | Token capture path per policy |

---

## `m.employer.verification.status` — Firm verification

| Field | Detail |
| --- | --- |
| **Route** | `/employer/verification` |
| **Purpose** | Show verification state; block publish CTA until verified |
| **MVP** | P0 |
| **Cases** | T-013, T-015 |
| **API** | `GET /api/v1/employers/me` |

---

## Optional auth (product fork)

| ID | Cases | Note |
| --- | --- | --- |
| `m.auth.email` | T-002 | Only if email registration kept |
| `m.auth.password-set` | T-008 | Only if password accounts |
| `m.auth.password-reset` | T-248 | Security-hardened reset |

---

## Mandate additions (2026-10-09)

Required so every case has a dedicated UI surface. Components: [`../../shared/02-ui-components.md`](../../shared/02-ui-components.md).

### `m.shared.auth.context-switch`

| | |
| --- | --- |
| **Title** | Switch role / membership |
| **Cases** | AS-3, multi-role / multi-org |
| **Components** | `RoleSwitcherSheet`, `MembershipListItem`, `ActiveContextBadge` |
| **API** | `POST /api/v1/auth/context` (or equivalent) |

### `m.worker.jobs.apply-overlap`

| | |
| --- | --- |
| **Title** | Schedule overlap warn / block |
| **Cases** | T-085, T-181 |
| **Components** | `OverlapConflictCard`, `ConflictShiftRow`, `ApplyBlockedBanner` |
| **Flow** | From apply-confirm when API returns overlap |

### `m.employer.tokens.top-up`

| | |
| --- | --- |
| **Title** | Token top-up |
| **Cases** | T-161 |
| **Components** | `TopUpAmountPicker`, `PaymentMethodList`, `TopUpConfirmSheet` |
| **API** | Token purchase / top-up endpoints |

### `m.shared.system.forbidden`

| | |
| --- | --- |
| **Title** | Forbidden / wrong tenant |
| **Cases** | T-244, T-245, T-246 |
| **Components** | `ForbiddenState`, `TenantMismatchExplain` |

### `m.shared.system.session-expired`

| | |
| --- | --- |
| **Title** | Session expired |
| **Cases** | T-247 |
| **Components** | `SessionExpiredCard`, `ReauthCta` |

---

## Catalog flags on existing screens

| Screen | Add |
| --- | --- |
| Create job summary | Favorites-only toggle (T-056, T-168) |
| Job detail (worker) | Required documents checklist (T-045, T-066) |
| Availability editor | Night shift / cross-midnight (T-019) |
| Profile edit | Age + gender fields (T-027, T-028) |
| Apply confirm | Overlap warning/block → sheet `m.worker.jobs.apply-overlap` (T-085) |
| 3h confirm | Change-mind + no-response messaging (T-117, T-118) |
| Tokens | Hold vs capture explainer (T-243) + link to top-up |
