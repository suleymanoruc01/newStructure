# 08 — Web admin × case coverage (all 248)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0034 — Admin full case coverage](../backend/adr/0034-admin-full-case-coverage.md)  
**Source:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json) (248 cases / 19 groups)  
**Mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)  
**Screens:** [`02-screen-catalog.md`](02-screen-catalog.md) · [`screens/admin-console.md`](screens/admin-console.md)  
**UI:** [`04-shadcn-dark-ui.md`](04-shadcn-dark-ui.md) · recipe **R7**

> **Web admin must cover every application feature domain** described in the case catalog — as **ops / config / moderation / support** surfaces. Worker/employer **day-of** UX stays mobile-primary; admin still needs **visibility and control** for each group. **No CASE-* group without a `w.admin.*` screen.**

---

## 1. Channel rule (architecture)

| Channel | Role |
| --- | --- |
| **Mobile** | Worker / employer / manager product UX (check-in, 3h, apply, feed) |
| **Marketing** | Public landing / pricing / legal (`apps/marketing`) |
| **Employer console** | Optional dense employer web — **not** a substitute for admin |
| **Admin** | Platform ops for **all** case domains |

Admin does **not** re-implement GPS check-in or job-seeker feed. It **does** list, inspect, configure, moderate, credit, and diagnose those domains.

---

## 2. Group → admin screens (required)

| Group | Cases | Admin screen(s) | Ops purpose |
| --- | ---: | --- | --- |
| **CASE-AUTH** | 15 | `w.admin.login` · `w.admin.users.*` · `w.admin.policies.manage` · `w.admin.verification.queue` | Sessions, lockouts, policy versions, firm verification (T-015) |
| **CASE-WORKER-PROFILE** | 15 | `w.admin.workers.list` · `w.admin.workers.detail` · `w.admin.documents.queue` | Profiles, availability inspect, documents (T-022–024) |
| **CASE-EMPLOYER-BRANCH** | 8 | `w.admin.employers.list` · `w.admin.employers.detail` · `w.admin.branches.list` | Orgs, branches, tax/verification |
| **CASE-JOB-POSTING** | 19 | `w.admin.jobs.list` · `w.admin.jobs.detail` · `w.admin.catalog.manage` | Oversight, force-close, catalog CMS, favorites-only flag inspect |
| **CASE-MATCHING** | 22 | `w.admin.matching.diagnostics` | Explain include/exclude for worker×job (debug, no PII leak to non-admin) |
| **CASE-APPLICATION** | 9 | `w.admin.applications.list` · `w.admin.applications.detail` | Application audit / support |
| **CASE-EMPLOYER-REVIEW** | 10 | `w.admin.applications.*` · `w.admin.jobs.detail` | Accept/reject history, headcount |
| **CASE-NOTIFICATIONS** | 14 | `w.admin.notifications.outbox` · `w.admin.notifications.broadcast` | Outbox/dedupe/failures; careful broadcast |
| **CASE-AVAILABILITY-3H** | 8 | `w.admin.shifts.list` · `w.admin.shifts.detail` | 3h confirm state, seat release |
| **CASE-CHECKIN** | 13 | `w.admin.shifts.*` · `w.admin.disputes.queue` | Check-in events, manual confirm, disputes (T-134–135) |
| **CASE-LOCATION** | 13 | `w.admin.config.remote` · `w.admin.risk.queue` · `w.admin.branches.list` | Geofence defaults, mock-GPS risk, branch coords |
| **CASE-TOKEN** | 15 | `w.admin.tokens.ledger` · `w.admin.employers.detail` · `w.admin.jobs.detail` | Holds/captures, manual credit, concurrency signals |
| **CASE-FAVORITES** | 8 | `w.admin.workers.detail` · `w.admin.employers.detail` · `w.admin.jobs.detail` | Favorite edges + favorites-only jobs |
| **CASE-RATINGS** | 9 | `w.admin.ratings.queue` · `w.admin.ratings.detail` | Moderation, averages, abuse of ratings |
| **CASE-ABUSE** | 12 | `w.admin.abuse.*` · `w.admin.risk.queue` · `w.admin.users.detail` | Reports, bans, multi-account, mock GPS |
| **CASE-E2E** | 31 | **Composition** of above (journey support tools) | Support can walk a shift lifecycle end-to-end in admin |
| **CASE-PERF** | 9 | `w.admin.dashboard` · `w.admin.perf.metrics` · **`w.admin.devops.*`** | Queues + **error tracking / releases / health** — [09-admin-devops](09-admin-devops.md) · ADR-0035 |
| **CASE-UX** | 9 | `w.admin.config.remote` · `w.admin.devops.clients` · product screens | Force-update, maintenance, coachmark flags |
| **CASE-SECURITY** | 9 | `w.admin.users.*` · `w.admin.audit.*` (log/detail/CSV·PDF reports) · `w.admin.documents.queue` · devops errors (redacted) | AuthZ support, session revoke, document ACL, PII masking · ADR-0037 |

Missing IDs in source JSON (not inventable): `T-095`, `T-120`, `T-208`, `T-224` — no admin screens for them.

---

## 3. Admin nav (production)

```text
/admin
  /login
  /                      → dashboard
  /ops/perf
  /users · /users/:id
  /workers · /workers/:id
  /employers · /employers/:id
  /branches
  /verification
  /jobs · /jobs/:id
  /catalog
  /applications · /applications/:id
  /shifts · /shifts/:id
  /disputes
  /matching/diagnostics
  /tokens/ledger
  /ratings · /ratings/:id
  /notifications/outbox
  /notifications/broadcast
  /documents
  /abuse · /abuse/:id
  /risk
  /policies
  /config
  /audit
  /audit/reports
  /devops
  /devops/errors · /devops/errors/:fingerprint
  /devops/releases · /devops/services · /devops/clients
```

DevOps detail: [`09-admin-devops.md`](09-admin-devops.md) · ADR-0035.

All routes: React Router under Nest-hosted SPA — [shared/08](../shared/08-routing.md).

---

## 4. Agent rules

1. S8 implements **full** admin matrix — not abuse-only.  
2. Ground every new `w.admin.*` ID in [`02-screen-catalog.md`](02-screen-catalog.md) before coding.  
3. Every screen lists case group/IDs + components (R7).  
4. Do not claim admin “done” if any row in §2 lacks a shipped screen.  
5. Day-of GPS/3h UI stays mobile; admin shows **state + actions** (confirm dispute, restrict, credit).

---

## 5. DoD

- [ ] Every CASE-* group has ≥1 `w.admin.*` screen in catalog + screen doc  
- [ ] Nav includes §3 routes  
- [ ] Nest admin APIs + AuthZ for each surface  
- [ ] CASE-PERF metrics live; no load-gen UI  
- [ ] Components named in [`shared/02-ui-components.md`](../shared/02-ui-components.md)  
- [ ] Traceability: case IDs on screen docs  

---

## Related

- [ADR-0034](../backend/adr/0034-admin-full-case-coverage.md)  
- Catalog: [`02-screen-catalog.md`](02-screen-catalog.md)  
- Screen specs: [`screens/admin-console.md`](screens/admin-console.md)  
- Matrix: [`../cases/00-coverage-matrix.md`](../cases/00-coverage-matrix.md)  
- Mandate: [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)  
