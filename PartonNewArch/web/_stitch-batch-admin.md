# Stitch batch — Admin desktop dark (40 screens)

**Batch run:** 2026-10-10 (UTC+3)  
**Project:** `11035737984554056770` (`PartOn Admin UI`)  
**Design system:** `assets/36f95a698c9e4d6fbfdda9b8b7301dad`  
**Device:** `DESKTOP`  
**Model:** `GEMINI_3_5_FLASH_LITE`  

**Visual rules (all prompts):** canvas `#252823`, sidebar/cards `#234D3C`, CTA `#E97A3D`, dense shadcn-dark tables, Turkish ops copy, JetBrains Mono for IDs/SHAs/requestIds, catalog ID in page title, no purple glow.

**Policy:** One `generate_screen_from_text` per catalog ID; **no regenerate retries** after MCP timeout (per batch instructions).

**Outcome (parallel batch):** All 40 calls returned `MCP error -32001`. None persisted.

**Sequential resume:** Started 2026-10-10 — one `generate_screen_from_text` at a time. First land: `w.admin.dashboard` → `5468ff4fb8a549f78a89fa32262b8d03`.

**Done:** 40 / 40 mapped to Stitch screen resources.

| # | Catalog ID | `generate_screen_from_text` | Stitch screen id | Notes |
| --- | --- | --- | --- | --- |
| 1 | `w.admin.login` | ok | `57a90642f8ca43158b467462b4168f4b` | Yönetici OTP giriş |
| 2 | `w.admin.dashboard` | ok | `5468ff4fb8a549f78a89fa32262b8d03` | Operasyon özeti |
| 3 | `w.admin.perf.metrics` | ok | `6b12026e2a3544a1b153d6e4b9708559` | /ops/perf |
| 4 | `w.admin.users.list` | ok | `bf4a902dc85041bd8ac7a48b5361b266` | Kullanıcı arama tablosu |
| 5 | `w.admin.users.detail` | ok | `ba9916cd9e3b47caa8ebe6fce4952a9d` | Kısıtlama / oturum sonlandır |
| 6 | `w.admin.workers.list` | ok | `7e1d7019a8db4f3b84e11f48235e824c` | İşçi listesi |
| 7 | `w.admin.workers.detail` | ok | `0b25c9b3dde74a2d8238548b10134e43` | Profil + müsaitlik RO |
| 8 | `w.admin.employers.list` | ok | `be5af3fad53146628b5771d06cb5e83f` | İşveren listesi |
| 9 | `w.admin.employers.detail` | ok | `16bd8ad03bce4b208026b6b74311aeef` | Token + doğrulama |
| 10 | `w.admin.branches.list` | ok | `dc89e96a1fec460fb33d399386d0aa2e` | Çapraz org şube |
| 11 | `w.admin.verification.queue` | ok | `a81eb44ed5504496ac6164362c4bffae` | T-015 firma doğrulama |
| 12 | `w.admin.jobs.list` | ok | `204b48a112be4bb98cfc060b32fce07e` | İlan denetimi |
| 13 | `w.admin.jobs.detail` | ok | `d0ac58b425814a4ab7f5a5bd6e6b2267` | Force-close |
| 14 | `w.admin.catalog.manage` | ok | `b9d820431a854671b347a96180d21628` | Katalog CMS |
| 15 | `w.admin.matching.diagnostics` | ok | `3569bb0ff5e74c19adcc58d3e721baef` | Eşleştirme açıklama |
| 16 | `w.admin.applications.list` | ok | `5a6742dcedd8462baa5db0c293036cae` | Başvurular |
| 17 | `w.admin.applications.detail` | ok | `7d79cf6e89294ded96278b265e25ded8` | Başvuru audit |
| 18 | `w.admin.shifts.list` | ok | `7457160925354fef89b4eda7ee75a1af` | Vardiyalar |
| 19 | `w.admin.shifts.detail` | ok | `8ed142113cc34333b47086f67796a76a` | Check-in detay |
| 20 | `w.admin.disputes.queue` | ok | `5a24c0b0d94d4ca991a10f6b52b7c6fb` | T-134–135 |
| 21 | `w.admin.tokens.ledger` | ok | `e1ec0660e15d47338ca2e3b0ffd89b08` | Jeton defteri |
| 22 | `w.admin.ratings.queue` | ok | `9ef5dba39d004c8da9d0dcafb5bc76ea` | Moderasyon kuyruğu |
| 23 | `w.admin.ratings.detail` | ok | `301307bc0e3943c2b96b812007c2d8b0` | Değerlendirme detay |
| 24 | `w.admin.documents.queue` | ok | `75e8a840b4494b068d8900dc0e5db2c2` | Belge inceleme |
| 25 | `w.admin.notifications.outbox` | ok | `4017592a72ee4773b6a6a783bce07036` | Outbox / hatalar |
| 26 | `w.admin.notifications.broadcast` | ok | `39c14c91443742c69cb78b6e1e4c9f1d` | Toplu bildirim |
| 27 | `w.admin.abuse.queue` | ok | `2a242b64bb83463f9f7738036bb21304` | Ticket kuyruğu |
| 28 | `w.admin.abuse.detail` | ok | `487c1a3833fd4b8eb0e1cdf743440df5` | Ticket detay |
| 29 | `w.admin.risk.queue` | ok | `7fb88d8b84854840a03c86f81801f401` | Mock GPS / multi-account |
| 30 | `w.admin.policies.manage` | ok | `7e21de36b352422c81588266e86c09d3` | Politika sürümleri |
| 31 | `w.admin.config.remote` | ok | `fe42f5ed34e44c23a1f228ee55365b5e` | Flags / geofence |
| 32 | `w.admin.audit.log` | ok | `edb18c7660fe4fb4be9f5fe491b307fb` | ADR-0037 log |
| 33 | `w.admin.audit.detail` | ok | `066be3d4090c48209738889186dadc57` | Olay detay |
| 34 | `w.admin.audit.reports` | ok | `9512b11ad4de4381b4490015fd1ac7d8` | CSV/PDF builder |
| 35 | `w.admin.devops.overview` | ok | `59d94911802042e99db9a190cf7d9395` | ADR-0035 özet |
| 36 | `w.admin.devops.errors.list` | ok | `565534a25f664891a3a3f741649dc1f4` | Fingerprint listesi |
| 37 | `w.admin.devops.errors.detail` | ok | `5d2fa0db09ca41fdafb117a57c078813` | Triage |
| 38 | `w.admin.devops.releases` | ok | `f6ffc53a5e4e4005bd06c527ea426c46` | Git SHA / sürüm |
| 39 | `w.admin.devops.services` | ok | `8b70de94b19346a0a30bd02032a9b30a` | Postgres/Redis/queue |
| 40 | `w.admin.devops.clients` | ok | `2de810869532435485ac9dfbf8ee8910` | AO-12 istemci sürümleri |

## Stitch resource name format

When screens appear:

```text
projects/11035737984554056770/screens/{screen_id}
```

Extract `{screen_id}` for the table **Stitch screen id** column.

## Existing non-admin screen (ignore for batch)

| Title | Stitch screen id |
| --- | --- |
| `DESIGN.md` | `13759361723738151537` |

## Catalog source

[`02-screen-catalog.md`](02-screen-catalog.md) · [`screens/admin-console.md`](screens/admin-console.md)
