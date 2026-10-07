# Mobile — Auth & onboarding screens

**Status:** `proposed`  
**Nest modules:** `auth`, `users`, `policies`, `workers`, `employers`, `branches`

---

## `m.auth.tutorial` — App tutorial

| Field | Detail |
| --- | --- |
| **Route** | `/auth/tutorial` |
| **Role** | Unauthenticated / first launch |
| **Purpose** | Explain worker vs employer value in 2–4 slides |
| **MVP** | P2 |
| **Entry** | First install; skippable |
| **Layout** | Full-bleed carousel, skip + next |
| **Actions** | Skip → phone; Done → phone |
| **States** | — |
| **API** | none |
| **Cases** | `CASE-UX` |
| **Legacy** | `AppTutorialScreen` |

---

## `m.auth.phone` — Phone entry

| Field | Detail |
| --- | --- |
| **Route** | `/auth/phone` |
| **Role** | Guest |
| **Purpose** | Collect E.164 phone and start OTP |
| **MVP** | P0 |
| **Entry** | Tutorial / cold start / logout |
| **Layout** | Country code + phone field; primary CTA; legal links |
| **Actions** | Continue → request OTP; Open policies |
| **States** | validation error; rate-limited; network error |
| **API** | `POST /api/v1/auth/otp/request` |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |
| **Legacy** | `PhoneEntryScreen`, `LoginScreen`, `SignInScreen`, `SignUpScreen` (collapse to one phone path) |
| **Notes** | Prefer single phone path over separate sign-in/up unless product requires email (`open` — catalog mentions email registration) |

---

## `m.auth.otp` — OTP verify

| Field | Detail |
| --- | --- |
| **Route** | `/auth/otp?challengeId=` |
| **Role** | Guest (challenge-bound) |
| **Purpose** | Verify SMS code; establish session |
| **MVP** | P0 |
| **Entry** | From phone entry |
| **Layout** | Masked phone, 6-digit input, resend timer, change-number |
| **Actions** | Verify; Resend; Change number |
| **States** | wrong code; expired; locked; success → role gate |
| **API** | `POST /api/v1/auth/otp/verify`; session tokens stored securely |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY`, `CASE-TOKEN` (session tokens) |
| **Legacy** | `OtpScreen` |

---

## `m.auth.role-select` — Role select

| Field | Detail |
| --- | --- |
| **Route** | `/auth/role` |
| **Role** | Authenticated, no active role / first time |
| **Purpose** | Choose Worker / Employer / Manager path |
| **MVP** | P0 |
| **Entry** | After OTP or if role missing |
| **Layout** | Three role cards + short descriptions |
| **Actions** | Select role → ensure role API → onboarding |
| **States** | submit error; already has role (skip) |
| **API** | `POST /api/v1/users/me/roles` (or equivalent) |
| **Cases** | `CASE-AUTH`, `CASE-E2E` |
| **Legacy** | `RoleSelectScreen` |

---

## `m.auth.policies` — Policy acceptance

| Field | Detail |
| --- | --- |
| **Route** | `/auth/policies` |
| **Role** | Authenticated |
| **Purpose** | Accept required legal documents before app use |
| **MVP** | P0 |
| **Entry** | Gate when unsigned policy version exists |
| **Layout** | Document list with open-in-webview / markdown; accept checkbox; CTA |
| **Actions** | Open doc; Accept all |
| **States** | must scroll/open before accept (if required); error |
| **API** | `GET /api/v1/policies`; `POST /api/v1/policies/acceptances` |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |
| **Legacy** | policy use-cases / remote config |

---

## `m.worker.onboarding.profile` — Worker profile setup

| Field | Detail |
| --- | --- |
| **Route** | `/onboarding/worker/profile` |
| **Role** | Worker |
| **Purpose** | Capture identity + skills + availability baseline to unlock apply |
| **MVP** | P0 |
| **Entry** | Role select → worker; incomplete profile gate |
| **Layout** | Multi-step wizard: personal → skills/sectors → availability preview → confirm |
| **Actions** | Next / Back / Save & finish |
| **States** | field validation; incomplete blocks apply later |
| **API** | `PATCH /api/v1/workers/me`; availability endpoints |
| **Cases** | `CASE-WORKER-PROFILE`, `CASE-APPLICATION` (profile incomplete blocks apply) |
| **Legacy** | `EmployeeProfileSetupScreen` |

---

## `m.employer.onboarding.business` — Employer business setup

| Field | Detail |
| --- | --- |
| **Route** | `/onboarding/employer/business` |
| **Role** | Employer |
| **Purpose** | Create employer org + first industry context |
| **MVP** | P0 |
| **Entry** | Role select → employer |
| **Layout** | Company fields, tax/identity if required, industry pickers |
| **Actions** | Continue → first branch form |
| **States** | validation; duplicate business rules (`open`) |
| **API** | `POST /api/v1/employers` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-E2E` |
| **Legacy** | employer onboarding fakes / business screens |

---

## `m.employer.onboarding.checklist` — Employer checklist

| Field | Detail |
| --- | --- |
| **Route** | `/onboarding/employer/checklist` |
| **Role** | Employer |
| **Purpose** | Show remaining setup: branch, tokens, first job |
| **MVP** | P1 |
| **Entry** | After business create; home empty state |
| **Layout** | Checklist rows with status chips + deep links |
| **Actions** | Jump to branch form / tokens / create job |
| **API** | `GET /api/v1/employers/me/setup-status` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-UX` |
| **Legacy** | `EmployerChecklistScreen` |

---

## `m.manager.onboarding.join` — Manager join

| Field | Detail |
| --- | --- |
| **Route** | `/onboarding/manager/join` |
| **Role** | Manager |
| **Purpose** | Bind manager to branch via invite/manager code |
| **MVP** | P0 |
| **Entry** | Role select → manager |
| **Layout** | Code input + branch preview on success |
| **Actions** | Submit code; Contact support |
| **States** | invalid/expired code; already linked |
| **API** | `POST /api/v1/branches/manager-join` |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-SECURITY` |
| **Legacy** | `ManagerCodeAllocator` flows |
