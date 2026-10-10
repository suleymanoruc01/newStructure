# Stitch batch C — employer + manager mobile

**Project:** `12785901164400200423` (PartOn Mobile UI)  
**Design system:** `assets/82020ca97a4c4985ba46bcfd07a5e5fc`  
**Device:** `MOBILE` · **Model:** `GEMINI_3_5_FLASH_LITE`  
**Generated:** 2026-10-10 (local)

## Run notes

**Follow-up (2026-10-10):** Sequential generates after quota burn recovered — `m.manager.home.root` landed. Remaining batch-C rows still pending; continue **one at a time**.

- `generate_screen_from_text` was invoked once per catalog ID below (19 total).
- Every parallel call returned MCP `-32001` (client timeout); per instructions, those calls were **not** retried.
- `get_project` / `list_screens` polled through ~10 minutes after the batch; **no new screens** whose title/label contains `m.employer.*` or `m.manager.*` appeared in the project (only prior worker/auth screens + `DESIGN.md`).
- One sequential follow-up generate returned **resource exhausted (quota)**.

Reconcile later with `get_project` name `projects/12785901164400200423` or `list_screens` when generation completes or quota resets.

## Mapping

| catalog_id | stitch_screen_id | title |
| --- | --- | --- |
| `m.employer.jobs.create.step1` | — | m.employer.jobs.create.step1 (pending) |
| `m.employer.jobs.create.step2` | — | m.employer.jobs.create.step2 (pending) |
| `m.employer.jobs.create.step3` | — | m.employer.jobs.create.step3 (pending) |
| `m.employer.jobs.form` | — | m.employer.jobs.form (pending) |
| `m.employer.applicants.list` | — | m.employer.applicants.list (pending) |
| `m.employer.applicants.detail` | — | m.employer.applicants.detail (pending) |
| `m.employer.tokens.root` | — | m.employer.tokens.root (pending) |
| `m.employer.tokens.top-up` | — | m.employer.tokens.top-up (pending) |
| `m.employer.verification.status` | — | m.employer.verification.status (pending) |
| `m.employer.shift.manual-confirm` | — | m.employer.shift.manual-confirm (pending) |
| `m.employer.ops.settings` | — | m.employer.ops.settings (pending) |
| `m.employer.favorites.workers` | — | m.employer.favorites.workers (pending) |
| `m.employer.profile.root` | — | m.employer.profile.root (pending) |
| `m.manager.home.root` | `3d1d40716ded49a59c190c9fd9b68d84` | PartOn - Şube Müdürü Ana Sayfası |
| `m.manager.jobs.list` | — | m.manager.jobs.list (pending) |
| `m.manager.jobs.form` | — | m.manager.jobs.form (pending) |
| `m.manager.applicants.list` | — | m.manager.applicants.list (pending) |
| `m.manager.notifications.list` | — | m.manager.notifications.list (pending) |
| `m.manager.profile.root` | — | m.manager.profile.root (pending) |
