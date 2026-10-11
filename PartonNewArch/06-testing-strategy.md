# 06 — Testing strategy (case-driven)

**Status:** `accepted` (strategy)  
**Last updated:** 2026-10-11  
**Acceptance SoR:** [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) (IDs) · NewArch scenarios [`cases/parton_case_tests_newarch_en.json`](cases/parton_case_tests_newarch_en.json) / [`cases/parton_case_tests_newarch_tr.json`](cases/parton_case_tests_newarch_tr.json) · [`cases/`](cases/)  
**Architecture:** [`04-application-architecture.md`](04-application-architecture.md)  
**Index:** [`DOC-INDEX.md`](DOC-INDEX.md)

> Every `T-###` is an **acceptance obligation**. Tests prove Nest rules, REST contracts, and UI states — not Firebase leftovers.

---

## 1. Pyramid

```mermaid
flowchart TB
  E2E[E2E journeys CASE-E2E / critical paths]
  API[API / integration - Nest + Postgres]
  Dom[Domain unit - pure rules]
  UI[UI component / screen states]
  Dom --> API
  UI --> E2E
  API --> E2E
```

| Layer | Owns | Tools (proposed) |
| --- | --- | --- |
| **Domain unit** | Matching filters, token ledger math, geofence, state machines (pure — **no mocks**) | Vitest / Jest |
| **API integration** | REST + AuthZ + **real Postgres** + outbox | Nest testing module + Compose/testcontainers |
| **Contract** | Zod schemas ↔ fixtures | `api-contracts` tests |
| **UI unit** | Components, recipes, a11y labels | RN Testing Library / Vitest (admin) |
| **E2E** | J1–Jn journeys against running API | Detox/Maestro (mobile); Playwright (admin) |
| **Perf** | CASE-PERF | k6/Artillery against staging |
| **Providers** | SMS/FCM sandbox calls (rate-limited) | Real sandbox — **no Noop** ([agents/08](agents/08-no-mocks-fully-functional.md)) |

---

## 2. Traceability rules

| Rule | Detail |
| --- | --- |
| Case ID in test name/tag | `@T-080`, `@CASE-TOKEN` |
| Nest PR | Domain/API tests for touched rules |
| UI PR | State tests (loading/empty/error/blocked) + recipe |
| Notify | Outbox + inbox + FCM sandbox send (or recorded provider message id) |
| Gap / Hold cases | Mark `skip` + gap id. v1 OTP-only skips: **T-002**, **T-008**, **T-248** ([agents/02](agents/02-defaults-and-non-asks.md)) |
| NewArch catalog | Use `architecture.rest`, `screens`, `error_codes`, `notify_template` from the EN/TR JSON when writing tests |
| Matrix | Update [`cases/00-coverage-matrix`](cases/00-coverage-matrix.md) when coverage level changes |

Incomplete: Nest green without mapped screen/components ([UI mandate](cases/03-ui-coverage-mandate.md)).

Case tests and the security audit answer different questions. A green `@T-244` shows one path enforces scope. [23 — Security audit program](backend/23-security-audit-program.md) still requires a unit per surface × boundary × attack class, and only a source-backed `confirmed` result is a vulnerability.

---

## 3. What to test per concern

| Concern | Must assert |
| --- | --- |
| AuthZ | Wrong role/branch → 403; list leak absent |
| Tokens | Hold/capture/release ledger invariants |
| Matching | Hard filter exclusions deterministic |
| Check-in | Inside/outside geofence; window closed |
| Applications | Illegal transitions → 409 |
| Notifications | `dedupe_key`; audience; inbox without FCM |
| Privacy | No PII in logs/job payloads (fixture scan) |
| Wizards | Back restores fields (client) + draft PATCH |
| i18n | `error.code` stable; message locale |

---

## 4. Environments for tests

| Env | Use |
| --- | --- |
| Local | Unit + integration (docker Postgres) |
| CI | All unit/integration; contract; lint; typecheck |
| Staging | E2E + smoke + FCM sandbox |
| Perf staging | CASE-PERF only; isolated data |

See [`07-environments-and-ops.md`](07-environments-and-ops.md).

---

## 5. Definition of done (feature)

- [ ] `CASE-*` / `T-###` listed in PR  
- [ ] Domain + API tests green  
- [ ] Screen IDs + components + recipe  
- [ ] Error codes in [12-api-contracts](shared/12-api-contracts.md) if new  
- [ ] Notify template if applicable  
- [ ] No new PII without privacy note  
- [ ] Matrix/gap updated if status changed  

---

## Related

- E2E journeys: [`cases/02-e2e-journeys.md`](cases/02-e2e-journeys.md)  
- NFRs: [`05-quality-nfr.md`](05-quality-nfr.md)  
- Security audit: [`backend/23-security-audit-program.md`](backend/23-security-audit-program.md)  
- Gap backlog: [`cases/01-gap-backlog.md`](cases/01-gap-backlog.md)  
