# Parton case → architecture traceability

**ID inventory (titles):** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json) (248 cases / 19 groups)  
**NewArch scenarios (architecture-mapped):**
- Turkish: [`parton_case_tests_newarch_tr.json`](parton_case_tests_newarch_tr.json)
- English: [`parton_case_tests_newarch_en.json`](parton_case_tests_newarch_en.json)

Each NewArch case binds `T-###` to Nest modules, REST `/api/v1`, screens (`m.*` / `w.*`), `error.code`, notify templates, Postgres tables, and agent-default skip/implement. Schema `2.0.0-newarch`. Regenerator: [`_generate_newarch_catalogs.py`](_generate_newarch_catalogs.py).

This folder also binds every catalog case to **UI screens + components** and open gaps. Phased delivery that consumes these cases: [`../02-product-roadmap.md`](../02-product-roadmap.md).

**UI mandate:** every case feature must have screens and named components — [`03-ui-coverage-mandate.md`](03-ui-coverage-mandate.md) · [`../shared/02-ui-components.md`](../shared/02-ui-components.md).  
**Push mandate:** every notify need in the case JSON maps to a template — [`../shared/05-push-notifications-ux.md`](../shared/05-push-notifications-ux.md) §0 · [ADR-0021](../backend/adr/0021-push-notifications-ux.md).  
**Testing:** case IDs in every layer — [`../06-testing-strategy.md`](../06-testing-strategy.md).  
**Glossary:** [`../shared/11-glossary.md`](../shared/11-glossary.md).  
**Doc index:** [`../DOC-INDEX.md`](../DOC-INDEX.md) · **Cohesion:** [`../DOC-COHESION.md`](../DOC-COHESION.md).

## Read order

| Doc | Purpose |
| --- | --- |
| [parton_case_tests_newarch_en.json](parton_case_tests_newarch_en.json) | **English** NewArch scenarios (REST, screens, error codes) |
| [parton_case_tests_newarch_tr.json](parton_case_tests_newarch_tr.json) | **Turkish** NewArch scenarios (same IDs) |
| [00-coverage-matrix.md](00-coverage-matrix.md) | All 248 cases → modules / screens / arch status |
| [01-gap-backlog.md](01-gap-backlog.md) | Gaps & partials to close in PartonNewArch / product |
| [02-e2e-journeys.md](02-e2e-journeys.md) | CASE-E2E journeys as architecture acceptance scripts |
| [03-ui-coverage-mandate.md](03-ui-coverage-mandate.md) | **All cases → UI screens + components** (gate) |
| [groups/](groups/) | One file per `CASE-*` with rules + checklist |

## How to use in delivery

1. Pick a `CASE-*` group before implementing a module.
2. Open the matching `T-###` rows in the NewArch EN or TR JSON for REST paths, screens, `error.code`, and notify templates.
3. Implement Nest rules + **REST** `/api/v1` routes so checklist rows can pass.
4. Wire **mobile and/or web/admin screens** and **named components** from the mandate + group file.
5. Mark PR with case IDs (`T-080`, `T-156`, …), REST paths, and screen IDs.
6. Update matrix status when a gap is closed. A Nest-only PR without mapped UI is incomplete.

v1 OTP-only **skip** (do not fake email/password): `T-002`, `T-008`, `T-248`. Absent catalog IDs (do not invent): `T-095`, `T-120`, `T-208`, `T-224`.

Regenerate mapped JSON after ID/title changes in the root inventory:

```bash
python3 PartonNewArch/cases/_generate_newarch_catalogs.py
```

## Snapshot (generated)

See coverage matrix footer for current `covered` / `partial` / `gap` counts. Counts are heuristic from titles + group; refine as decisions land.
