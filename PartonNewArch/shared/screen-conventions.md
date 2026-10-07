# Shared screen conventions

**Status:** `accepted`  
**Last updated:** 2026-10-07

Conventions used by both [`../mobile/`](../mobile/) and [`../web/`](../web/) screen notes.

## Screen ID format

```text
{channel}.{role}.{area}.{name}
```

| Part | Values |
| --- | --- |
| `channel` | `m` (mobile RN), `w` (web) |
| `role` | `auth`, `worker`, `employer`, `manager`, `admin`, `shared`, `public` |
| `area` | short domain: `home`, `jobs`, `apps`, `shift`, `profile`, … |
| `name` | kebab screen slug |

Examples: `m.worker.jobs.detail`, `w.employer.jobs.create`, `w.admin.users.list`

## Screen spec template

Every screen note uses this block:

| Field | Meaning |
| --- | --- |
| **ID** | Stable screen id |
| **Name** | Human title |
| **Route** | Path / deep link |
| **Role** | Who may open it |
| **Purpose** | One sentence |
| **MVP** | `P0` / `P1` / `P2` |
| **Entry** | How users arrive |
| **Layout** | Zones / primary UI |
| **Actions** | Primary + secondary |
| **States** | loading / empty / error / blocked |
| **API** | Nest REST paths under `/api/v1` (+ owning module) |
| **Cases** | `CASE-*` groups |
| **Legacy** | Old Kotlin screen if any |
| **Notes** | Edge rules |

## Channel ownership

| Capability | Mobile | Web |
| --- | --- | --- |
| OTP login | Primary | Supported (employer/admin) |
| Worker job feed / apply | Primary | Not planned v1 |
| Check-in / geo | Primary only | No |
| Employer job create / applicants | Supported | Primary (desktop density) |
| Manager day-of ops | Primary | Optional later |
| Platform admin / abuse | Light | Primary |
| Marketing / landing | Soft gate | Primary |

## Navigation principles

1. Role graphs are separate after role selection / session restore.
2. Deep links resolve through auth + role + onboarding gates.
3. Push opens a specific screen id, never a raw deep URL without validation.
4. Destructive actions require confirm; irreversible server transitions show result state.

## State vocabulary

| State | UI expectation |
| --- | --- |
| `loading` | Skeleton / spinner; no fake data |
| `empty` | Explainer + CTA |
| `error` | Retry + error code if useful |
| `offline` | Mobile: queue or retry banner |
| `blocked` | Restriction / maintenance / force-update |
| `partial` | Show available sections; mark failed ones |

## Cross-links

- Backend modules: [`../backend/04-domain-modules.md`](../backend/04-domain-modules.md)
- API style: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Case catalog: [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json)
