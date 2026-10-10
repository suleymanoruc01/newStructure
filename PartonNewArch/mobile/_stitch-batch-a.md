# Stitch batch A — auth + onboarding + worker apply/calendar/shift (mobile)

**Project:** `12785901164400200423` (PartOn Mobile UI)  
**Design system:** `assets/82020ca97a4c4985ba46bcfd07a5e5fc`  
**Device:** `MOBILE` · **Model:** `GEMINI_3_5_FLASH_LITE`  
**Generated:** 2026-10-10 (local)

## Run notes

- `generate_screen_from_text` invoked **once per catalog ID** below (Turkish prompts: cream `#F3E8CF`, cards `#EADCC5`, single orange CTA `#E97A3D`, no purple glow, catalog id in title).
- Early parallel runs hit MCP `-32001` timeouts; **no timeout retries** — IDs reconciled via `get_screen` / `list_screens` / `get_project` ([`../shared/13-stitch-projects.md`](../shared/13-stitch-projects.md)).
- **`list_screens` is incomplete** vs project inventory; prefer **`get_screen`** with `projects/12785901164400200423/screens/{id}` when you have an id from generate output.
- **3 rows** below: generate returned success text but **stitch_screen_id not yet returned** by list/get (poll Stitch UI or `list_screens` later).

## Mapping

| catalog_id | stitch_screen_id | title |
| --- | --- | --- |
| `m.auth.role-select` | `270cf373fb25456c83c7abfea12c05aa` | PartOn - Rol Seçimi (m.auth.role-select) |
| `m.auth.policies` | `27e2f66293284a7aa94ca91ec0a0cd0f` | PartOn - Politika Onayı (m.auth.policies) |
| `m.auth.tutorial` | `caa12daed3804b7bad06ad0740d2ed3a` | PartOn - Uygulama Tanıtımı (m.auth.tutorial) |
| `m.auth.email` | `0c694e4bac7a45e79f772017925e458f` | PartOn - E-posta Kaydı (m.auth.email) |
| `m.auth.password-set` | — | PartOn - Şifre Belirle (m.auth.password-set) *(pending id — poll)* |
| `m.auth.password-reset` | `a97344616ee4497380f939e2777962ef` | PartOn - Şifre Sıfırla (m.auth.password-reset) |
| `m.worker.onboarding.profile` | `69a2c7faba774652be134d4b54bce740` | PartOn - Profil Kurulumu (m.worker.onboarding.profile) |
| `m.employer.onboarding.business` | `21f2f82e896848668af91977bfb305bf` | PartOn - İşletme Kurulumu (m.employer.onboarding.business) |
| `m.employer.onboarding.checklist` | — | PartOn - Kurulum Listesi (m.employer.onboarding.checklist) *(pending id — poll)* |
| `m.manager.onboarding.join` | — | PartOn - Müdür Kodu (m.manager.onboarding.join) *(pending id — poll)* |
| `m.worker.jobs.apply-confirm` | `4ce1f13f6335425095301da6cfe0f782` | PartOn - Başvuru Onayı (m.worker.jobs.apply-confirm) |
| `m.worker.jobs.apply-overlap` | `a74a9b8c702d466ca207820cffbebf99` | PartOn - Başvuru Çakışması (m.worker.jobs.apply-overlap) |
| `m.worker.applications.list` | `cae1220275ff4edb9fdb37044e7f03c2` | PartOn - Başvurularım (m.worker.applications.list) |
| `m.worker.calendar.root` | `7a78f4f058cb41b1ad77a515c7949eae` | PartOn - Takvimim (m.worker.calendar.root) |
| `m.worker.availability.edit` | `b6975b3d3dc94883b8ce1b2b4e902383` | PartOn - Müsaitlik Düzenle (m.worker.availability.edit) |
| `m.worker.shift.prep` | `05408113644e4b3ba08c45a61b56b88a` | PartOn - Vardiya Hazırlığı (m.worker.shift.prep) |
| `m.worker.shift.availability-confirm` | `c2add6ed46df4388ab9b8ae2d18c2222` | PartOn - 3 Saat Onayı (m.worker.shift.availability-confirm) |

**Duplicate note:** A second policies screen exists at `d6460c682590436e915df0f68d778fbc` (same catalog title). Prefer one canonical row in coverage docs.

**Duplicate note:** A second email screen exists at `8ebda5d6f8f04fc085d57b77f1a3232e` (same catalog title).
