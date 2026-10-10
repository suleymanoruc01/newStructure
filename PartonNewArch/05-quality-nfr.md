# 05 — Quality attributes & NFRs

**Status:** `proposed` (engineering targets; counsel/ops may tighten)  
**Last updated:** 2026-10-09  
**Advances:** AO-4 (traffic/SLO/region — region still open AO-10)  
**Architecture:** [`04-application-architecture.md`](04-application-architecture.md) §1  
**Perf cases:** [`cases/groups/CASE-PERF.md`](cases/groups/CASE-PERF.md) · T-226–T-234  
**Index:** [`DOC-INDEX.md`](DOC-INDEX.md)

> Architecture must be **honest about scale**: modular monolith + Postgres + staged async can grow far, but **SLOs are not proven until load tests**. Numbers below are **v1 engineering targets**, not marketing guarantees.

---

## 1. Quality attribute → response

| Attribute | Architectural response | Proof |
| --- | --- | --- |
| Correctness | Nest owns marketplace rules | CASE-* checklists |
| Reliability | Outbox; Stage B BullMQ retries | Chaos + job metrics |
| Security | OTP/JWT, RBAC+scope, client baseline | CASE-SECURITY · ADR-0018 |
| Privacy | KVKK-first minimization, DSR P3 | ADR-0010 |
| Performance | Indexes, cursor feeds, async fan-out | CASE-PERF · load plan |
| Operability | OTel, health, one deployable | [09-observability](backend/09-observability.md) |
| Usability | UX X1–X12 + UI P1–P12 | CASE-UX · ADR-0025/0026 |
| Evolvability | Module exports; extract later | ADR-0001 |
| Accessibility | WCAG 2.2 AA | ADR-0022 |

---

## 2. Proposed SLOs (P0–P1 product)

| SLO | Target (proposed) | Notes |
| --- | --- | --- |
| API availability | 99.5% monthly (ex-maintenance) | Single region until AO-10 |
| REST p95 (read) | ≤ 300 ms (app region) | Feed/detail warm path |
| REST p95 (write critical) | ≤ 500 ms | Apply / accept / check-in exclude external SMS |
| OTP SMS p95 | ≤ 10 s to handset | Carrier-dependent; measure separately |
| FCM dispatch p95 | ≤ 30 s after outbox commit | Best-effort OS delivery after |
| Check-in decision p95 | ≤ 400 ms | Geo compute in-process |
| Error budget | Track 5xx + auth outages | Page on burn |

Refine with capacity workshop; do not treat as contractual without ops sign-off.

---

## 3. Capacity planning stance

| Topic | Stance |
| --- | --- |
| Ambition | Order of millions of **registered** users long-term |
| Capacity metric | Concurrent actives, RPS, notify fan-out — **not** total users alone |
| Day-1 | Vertical Nest + Postgres; Stage A outbox |
| Stage B trigger | Evidence: queue latency, notify backlog, CPU — [08-async](backend/08-async-events.md) |
| Postgres | Connection pooling (PgBouncer/managed); watch slow queries |
| Redis | Queue Redis separate; `noeviction` — [15](backend/15-redis-management.md) |
| CDN / static | Admin SPA + assets; API not behind HTML cache |

---

## 4. CASE-PERF mapping

| Cases | NFR focus |
| --- | --- |
| T-226–T-228 | Notify fan-out / backlog |
| T-229–T-231 | Matching / feed under load |
| T-232–T-234 | Token concurrency / holds |

Load-test plan artifact: own doc or CI job before P2 scale claims (`load-test-plan` in gap backlog).

---

## 5. Resilience

| Failure | Expected behavior |
| --- | --- |
| FCM down | Inbox still written; retry outbox; user sees in-app |
| SMS provider down | OTP fail clearly; rate-limit safe |
| Redis (Stage B) down | Alert; pause workers; SoR remains Postgres |
| Nest instance down | Multi-instance behind LB when deployed; sticky not required for REST |
| Client offline | No fake check-in success; cached read OK with banner |

---

## 6. What stays open

| ID | Topic |
| --- | --- |
| AO-4 | Formal RPS / MAU targets; multi-AZ |
| AO-10 | Cloud vendor + region (KVKK residency) |
| AO-12 | Old client sunset windows |

---

## Related

- Observability: [`backend/09-observability.md`](backend/09-observability.md)  
- Testing: [`06-testing-strategy.md`](06-testing-strategy.md)  
- Ops/envs: [`07-environments-and-ops.md`](07-environments-and-ops.md)  
