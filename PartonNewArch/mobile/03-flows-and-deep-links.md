# 03 — Mobile flows & deep links

**Status:** `proposed`  
**Last updated:** 2026-10-07

## Deep link scheme (proposed)

```text
parton://app/<path>
https://app.parton.<tld>/app/<path>   # universal / app links
```

All links run through: **session → role → onboarding → authorization → screen**.

## Critical user journeys

### J1 — Worker register → apply

```mermaid
flowchart LR
  Phone --> OTP --> Role[Worker] --> Policies --> ProfileSetup --> Feed --> Detail --> Apply
```

Screens: `m.auth.phone` → `otp` → `role-select` → `policies` → `m.worker.onboarding.profile` → `jobs.list` → `jobs.detail` → `jobs.apply-confirm`

Cases: `CASE-AUTH`, `CASE-WORKER-PROFILE`, `CASE-MATCHING`, `CASE-APPLICATION`, `CASE-E2E`

### J2 — Employer register → publish job

```mermaid
flowchart LR
  Phone --> OTP --> Role[Employer] --> Biz --> Branch --> Tokens --> CreateJob
```

Screens: auth… → `m.employer.onboarding.business` → `branches.form` → `tokens.root` → create job steps 1–3

Cases: `CASE-EMPLOYER-BRANCH`, `CASE-JOB-POSTING`, `CASE-TOKEN`, `CASE-E2E`

### J3 — Application review → accept

Employer/Manager: `applicants.list` → `applicants.detail` → accept → worker notified → `m.shared.job-process.detail`

Cases: `CASE-EMPLOYER-REVIEW`, `CASE-NOTIFICATIONS`

### J4 — Job day (3h + check-in)

```mermaid
flowchart LR
  Push3h --> Confirm --> Push10m --> CheckIn --> InShift --> CheckOut --> Rating
```

Screens: `availability-confirm` → `check-in` → `in-shift` → `check-out` → `ratings.compose`

Cases: `CASE-AVAILABILITY-3H`, `CASE-CHECKIN`, `CASE-LOCATION`, `CASE-RATINGS`

### J5 — GPS fail → dispute → manual confirm (E2E 3)

```mermaid
flowchart LR
  CheckIn --> FailGeo --> Dispute --> EmpConfirm --> TokenDecision
```

Screens: `m.worker.shift.check-in` → `m.worker.shift.dispute` → `m.employer.shift.manual-confirm` / web attendance

Cases: T-210–T-214, T-134–T-135

Full E2E tables: [`../cases/02-e2e-journeys.md`](../cases/02-e2e-journeys.md)

## Push payload → screen

| `type` | Params | Screen ID |
| --- | --- | --- |
| `job.matched` | `jobId` | `m.worker.jobs.detail` |
| `application.received` | `jobId` | `m.employer.applicants.list` |
| `application.decision` | `applicationId` | `m.shared.job-process.detail` |
| `shift.confirm_3h` | `shiftId` | `m.worker.shift.availability-confirm` |
| `shift.checkin_due` | `shiftId` | `m.worker.shift.check-in` |
| `shift.dispute_update` | `shiftId` | `m.worker.shift.dispute` / employer confirm |
| `rating.pending` | `shiftId` | `m.shared.ratings.compose` |
| `job.favorites_only` | `jobId` | `m.worker.jobs.detail` |
| `generic` | `notificationId` | `m.shared.notifications.detail` |

Invalid/expired targets fall back to role home.

## Permission UX

| Permission | First ask | Hard requirement |
| --- | --- | --- |
| Notifications | After role home once | Soft; features degrade |
| Location when-in-use | Before first check-in / distance filter | Check-in blocked without it |
| Background location | Avoid v1 | — |

## Offline (v1 stance)

- Reads: show last cache + offline banner where safe
- Writes (apply, check-in, OTP): require network; queue only if explicitly designed later
- Do not fake check-in success offline
