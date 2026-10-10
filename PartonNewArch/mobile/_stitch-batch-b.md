# Stitch batch B — worker shift/profile + employer ops mobile

**Project:** `12785901164400200423` (PartOn Mobile UI)  
**Design system:** `assets/82020ca97a4c4985ba46bcfd07a5e5fc`  
**Device:** `MOBILE` · **Model:** `GEMINI_3_5_FLASH_LITE`  
**Generated:** 2026-10-10 (local)

## Run notes

- Initial parallel `generate_screen_from_text` calls hit MCP `-32001` timeouts and **quota exhaustion**; timed-out calls were **not** retried (poll `get_project` / `get_screen` instead).
- **5 / 18** screens confirmed via inline generate output + `get_screen`. Others: generation invoked but no stitch id resolved before quota / timeout.
- Reconcile pending rows with `get_project` (`projects/12785901164400200423`) and `get_screen` when titles contain the catalog id or known Turkish labels. Prefer **one sequential generate per screen** ([`shared/13-stitch-projects.md`](../shared/13-stitch-projects.md)).

## Mapping

| catalog_id | stitch_screen_id | title |
| --- | --- | --- |
| `m.worker.shift.dispute` | `aba8c080335d45fe926f11277d45149e` | PartOn - Vardiya İtirazı (Shift Dispute) |
| `m.worker.shift.in-shift` | `f7383bafe86d45f9b9f555f22f1303fb` | PartOn - Aktif Vardiya (In-Shift) |
| `m.worker.shift.check-out` | `6bac3e07d0cc4edf9575295f191b14e6` | PartOn - Vardiya Çıkışı (Worker Shift Check-out) |
| `m.worker.documents.list` | — | `m.worker.documents.list` (pending — mcp_timeout) |
| `m.worker.documents.upload` | `b80a6f177f394d0681b96b99611638cb` | PartOn - Belge Yükleme (Worker Document Upload) |
| `m.worker.profile.root` | — | `m.worker.profile.root` (pending — mcp_timeout) |
| `m.worker.profile.edit` | — | `m.worker.profile.edit` (pending — mcp_timeout) |
| `m.worker.revenue.root` | — | `m.worker.revenue.root` (pending — mcp_timeout) |
| `m.worker.favorites.list` | — | `m.worker.favorites.list` (pending — mcp_timeout) |
| `m.worker.push-prefs` | — | `m.worker.push-prefs` (pending — mcp_timeout) |
| `m.employer.dashboard` | — | `m.employer.dashboard` (pending — mcp_timeout) |
| `m.employer.business.root` | — | `m.employer.business.root` (pending — mcp_timeout) |
| `m.employer.industry.manage` | — | `m.employer.industry.manage` (pending — mcp_timeout) |
| `m.employer.branches.list` | — | `m.employer.branches.list` (pending — mcp_timeout) |
| `m.employer.branches.detail` | — | `m.employer.branches.detail` (pending — mcp_timeout) |
| `m.employer.branches.form` | — | `m.employer.branches.form` (pending — mcp_timeout) |
| `m.employer.jobs.list` | — | `m.employer.jobs.list` (pending — no screen id returned) |
| `m.employer.jobs.detail` | `f974795816324a8285671d7a28a0dd5a` | PartOn - İlan Detay (m.employer.jobs.detail) |
