# Shared screen conventions

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**UX layouts:** [`03-screen-ux-layout.md`](03-screen-ux-layout.md) · [ADR-0019](../backend/adr/0019-screen-ux-layout.md)  
**Components:** [`02-ui-components.md`](02-ui-components.md)

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
| **Recipe** | `R1`–`R8` from [03-screen-ux-layout](03-screen-ux-layout.md) |
| **Primary CTA** | Single primary action label + component |
| **Components** | Named list from [02-ui-components](02-ui-components.md) |
| **Actions** | Primary + secondary |
| **States** | loading / empty / error / blocked (copy + next step) |
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

## UX gate

A screen is incomplete without **Recipe**, **Primary CTA**, **Components**, and **States** — see [03-screen-ux-layout](03-screen-ux-layout.md) and [UI mandate](../cases/03-ui-coverage-mandate.md).

## Wizard / multi-step gate

R3 screens must declare **Wizard id**, **State owner** (`WizardShell` / scoped store), and **Draft API** (or `—`) — [04-wizard-state](04-wizard-state.md) · [ADR-0020](../backend/adr/0020-wizard-state.md). Answers must not live only in step-local state.

## Accessibility gate

P0 screens must meet [06-accessibility-wcag](06-accessibility-wcag.md) · [ADR-0022](../backend/adr/0022-accessibility-wcag.md): labeled controls, contrast tokens, keyboard (web), SR-friendly names, solid chrome when transparency reduced.

## i18n gate

User-facing copy uses locale keys with **`tr-TR` primary** — [07-i18n](07-i18n.md) · [ADR-0023](../backend/adr/0023-i18n-turkish-primary.md). No hardcoded UI strings in P0 screens.

## Cross-links

- Screen UX & layout: [`03-screen-ux-layout.md`](03-screen-ux-layout.md)
- Backend modules: [`../backend/04-domain-modules.md`](../backend/04-domain-modules.md)
- API style: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Case catalog: [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json)
