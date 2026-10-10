# Parton case → architecture traceability

**Source of truth for acceptance:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json) (248 cases / 19 groups)

This folder binds every catalog case to Nest modules, **UI screens + components**, and open gaps. Phased delivery that consumes these cases: [`../02-product-roadmap.md`](../02-product-roadmap.md).

**UI mandate:** every case feature must have screens and named components — [`03-ui-coverage-mandate.md`](03-ui-coverage-mandate.md) · [`../shared/02-ui-components.md`](../shared/02-ui-components.md).  
**Push mandate:** every notify need in the case JSON maps to a template — [`../shared/05-push-notifications-ux.md`](../shared/05-push-notifications-ux.md) §0 · [ADR-0021](../backend/adr/0021-push-notifications-ux.md).  
**Testing:** case IDs in every layer — [`../06-testing-strategy.md`](../06-testing-strategy.md).  
**Glossary:** [`../shared/11-glossary.md`](../shared/11-glossary.md).  
**Doc index:** [`../DOC-INDEX.md`](../DOC-INDEX.md) · **Cohesion:** [`../DOC-COHESION.md`](../DOC-COHESION.md).

## Read order

| Doc | Purpose |
| --- | --- |
| [00-coverage-matrix.md](00-coverage-matrix.md) | All 248 cases → modules / screens / arch status |
| [01-gap-backlog.md](01-gap-backlog.md) | Gaps & partials to close in PartonNewArch / product |
| [02-e2e-journeys.md](02-e2e-journeys.md) | CASE-E2E journeys as architecture acceptance scripts |
| [03-ui-coverage-mandate.md](03-ui-coverage-mandate.md) | **All cases → UI screens + components** (gate) |
| [groups/](groups/) | One file per `CASE-*` with rules + checklist |

## How to use in delivery

1. Pick a `CASE-*` group before implementing a module.
2. Implement Nest rules + **REST** `/api/v1` routes so checklist rows can pass.
3. Wire **mobile and/or web/admin screens** and **named components** from the mandate + group file.
4. Mark PR with case IDs (`T-080`, `T-156`, …), REST paths, and screen IDs.
5. Update matrix status when a gap is closed. A Nest-only PR without mapped UI is incomplete.

## Snapshot (generated)

See coverage matrix footer for current `covered` / `partial` / `gap` counts. Counts are heuristic from titles + group; refine as decisions land.
