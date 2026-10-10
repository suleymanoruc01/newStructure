# 13 — Stitch projects (all channels)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**Mandate:** Every catalog screen (`m.*` / `w.*`) must have a Stitch screen under the matching project.  
**Coverage (2026-10-10):** **147 / 147** with verified hex Stitch screen ids (see coverage files).

| Channel | Screens | Done | Stitch project | Doc |
| --- | --- | --- | --- | --- |
| Mobile | 75 | 75/75 | `12785901164400200423` | [mobile/08](../mobile/08-stitch-mobile-ui.md) |
| Web (public + employer) | 32 | 32/32 | `9476327726481865180` | [web/12](../web/12-stitch-web-admin-ui.md) |
| Admin | 40 | 40/40 | `11035737984554056770` | [web/12](../web/12-stitch-web-admin-ui.md) |
| **Total** | **147** | **147/147** | 3 projects | DESIGN.md · ADR-0039 |

## Design systems

| Asset | Name | Mode |
| --- | --- | --- |
| `assets/82020ca97a4c4985ba46bcfd07a5e5fc` | PartOn Mobile | LIGHT |
| `assets/a8fa890618af4ed1a14292297eed4a23` | PartOn Web | LIGHT |
| `assets/36f95a698c9e4d6fbfdda9b8b7301dad` | PartOn Admin | DARK |

## Coverage checklists (live)

| Path | Content |
| --- | --- |
| [`mobile/_stitch-coverage.md`](../mobile/_stitch-coverage.md) | All 75 `m.*` — done/pending |
| [`web/_stitch-coverage-web.md`](../web/_stitch-coverage-web.md) | All 32 public/employer `w.*` |
| [`web/_stitch-coverage-admin.md`](../web/_stitch-coverage-admin.md) | All 40 `w.admin.*` |
| `mobile/_stitch-batch-*.md` · `web/_stitch-batch-*.md` | Agent batch maps (when generation finishes) |

## Generation policy (hard-won)

1. **Sequential only** — one `generate_screen_from_text` at a time per project. Parallel batches cause MCP `-32001` timeouts and **quota exhaustion**; screens often never land on the canvas.  
2. **Do not retry** a timed-out call immediately; poll `get_project` / `get_screen` — timeouts often still land. Resume the missing catalog ID later if absent.  
3. After quota errors, wait and resume **one screen at a time**.  
4. Update `_stitch-coverage*.md` only with a confirmed hex id from generate/`get_screen` — never “done (agent)” without an id.  
5. `list_screens` may lag; prefer `get_project.screenInstances` + `get_screen` for reconcile.

## Agent rule

Before implementing a screen, open its Stitch screen (`get_screen`) + [`DESIGN.md`](../DESIGN.md). Do not invent UI outside these sources.
