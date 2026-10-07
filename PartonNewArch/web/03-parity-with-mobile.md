# 03 — Web ↔ mobile parity

**Status:** `proposed`  
**Last updated:** 2026-10-07

Same Nest domain rules; mobile uses **REST** `/api/v1`. Admin UI is hosted in the Nest app. Separate employer web console is not a locked v1 boundary.

## Ownership matrix

| Capability | Mobile RN | Web console |
| --- | --- | --- |
| Worker auth / profile / feed / apply | **Primary** | No v1 |
| 3h confirm / check-in / geo | **Primary only** | Report/audit only |
| Employer onboarding | Supported | **Primary** (wider forms) |
| Create job | Supported | **Primary** |
| Applicant review | Supported | **Primary** |
| Branch + manager invites | Supported | **Primary** |
| Tokens overview | Supported | **Primary** + ledger |
| Notifications inbox | **Primary** | Supported |
| Ratings compose | **Primary** | Supported |
| Abuse report | Supported | Supported |
| Platform admin | Minimal | **Primary** |
| Marketing | Store links | **Primary** |

## ID pairing (selected)

| Mobile | Web |
| --- | --- |
| `m.employer.home.root` | `w.employer.dashboard` |
| `m.employer.jobs.list` | `w.employer.jobs.list` |
| `m.employer.jobs.create.step*` | `w.employer.jobs.create` |
| `m.employer.applicants.*` | `w.employer.applicants.*` |
| `m.employer.branches.*` | `w.employer.branches.*` |
| `m.employer.tokens.root` | `w.employer.tokens.overview` |
| `m.auth.phone` / `otp` | `w.auth.login` / `otp` |
| — | `w.admin.*` (no mobile twin) |
| `m.worker.*` | — (no web twin v1) |

## Shared rules

1. **State machines identical** — accept/reject/check-in outcomes never diverge by channel.
2. **Error codes identical** — RN and web map the same `error.code` values.
3. **Authorization identical** — web UI hiding is not security; REST guards enforce.
4. **Design systems may differ** visually; information architecture labels should stay aligned (Jobs, Applicants, Branches, Tokens).

## Delivery suggestion

| Phase | Ship |
| --- | --- |
| Phase A | Mobile worker + employer P0 + Nest auth/jobs/applications |
| Phase B | Web employer console (jobs + applicants + branches + tokens) |
| Phase C | Admin abuse/catalog/policies |
| Phase D | Web analytics/reports + mobile polish P1/P2 |
