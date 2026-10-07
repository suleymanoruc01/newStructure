# Parton case → architecture traceability

**Source of truth for acceptance:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json) (248 cases / 19 groups)

This folder binds every catalog case to Nest modules, screens, and open gaps. Phased delivery that consumes these cases: [`../02-product-roadmap.md`](../02-product-roadmap.md).

## Read order

| Doc | Purpose |
| --- | --- |
| [00-coverage-matrix.md](00-coverage-matrix.md) | All 248 cases → modules / screens / arch status |
| [01-gap-backlog.md](01-gap-backlog.md) | Gaps & partials to close in PartonNewArch / product |
| [02-e2e-journeys.md](02-e2e-journeys.md) | CASE-E2E journeys as architecture acceptance scripts |
| [groups/](groups/) | One file per `CASE-*` with rules + checklist |

## How to use in delivery

1. Pick a `CASE-*` group before implementing a module.
2. Implement Nest rules + **REST** `/api/v1` routes so checklist rows can pass.
3. Wire mobile (and Nest admin) screens listed in the group file against the contract.
4. Mark PR with case IDs (`T-080`, `T-156`, …) and REST paths.
5. Update matrix status when a gap is closed.

## Snapshot (generated)

See coverage matrix footer for current `covered` / `partial` / `gap` counts. Counts are heuristic from titles + group; refine as decisions land.
