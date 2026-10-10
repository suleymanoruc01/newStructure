# Stitch batch — Web desktop (32 catalog screens)

**Batch run:** 2026-10-10  
**Project:** `9476327726481865180` (PartOn Web UI)  
**Design system:** `assets/a8fa890618af4ed1a14292297eed4a23`  
**Device:** `DESKTOP` · **Model:** `GEMINI_3_5_FLASH_LITE`  
**Style:** cream `#F3E8CF` / `#fff8f0`, orange CTA `#E97A3D`, forest `#344A32` / `#252823`, Turkish, no purple glow. Marketing: brand hero; employer: sidebar + tables. Each screen title includes catalog ID.

**MCP notes (no timeout retries):** Parallel `generate_screen_from_text` often returned `-32001` while generation continued server-side. Stitch agent responses frequently omit screen IDs; use project UI or `get_screen` when ID is known. `list_screens` for this project did not enumerate generated designs (only uploaded `DESIGN.md`).

**Done (verified hex ids):** 31 / 32 · **`mcp_timeout`:** `w.employer.applicants.board`  
**Sequential resume (2026-10-10):** 3 prior MCP timeouts recovered — `w.employer.ratings.pending` → `27f55a8a390745e7a5938628d899ed27`, `w.employer.settings.org` → `65e91ed571294aa389a400dcfeee35c3`, `w.employer.settings.industry` → `fd35b999c1d446989f2dd62372db44de`

---

## Catalog → Stitch mapping

| Catalog ID | Status | Stitch screen id | Resource name |
| --- | --- | --- | --- |
| `w.public.landing` | done | `42e2127d96774386a61c40b2033159b4` | `projects/9476327726481865180/screens/42e2127d96774386a61c40b2033159b4` |
| `w.public.pricing` | done | `43725a836b2c4cc88c208cc45c0f5a1c` | `projects/9476327726481865180/screens/43725a836b2c4cc88c208cc45c0f5a1c` |
| `w.public.legal.privacy` | done | `aa4e4784b56c4acb8084967ab7b7b288` | `projects/9476327726481865180/screens/aa4e4784b56c4acb8084967ab7b7b288` |
| `w.public.legal.terms` | done | `7f7ce75b28914bb2bdb2a2a5bc9d7338` | `projects/9476327726481865180/screens/7f7ce75b28914bb2bdb2a2a5bc9d7338` |
| `w.auth.login` | done | `0818ffdee0334dca900f00867e3c57ce` | `projects/9476327726481865180/screens/0818ffdee0334dca900f00867e3c57ce` |
| `w.auth.otp` | done | `5472fc7d98cf4157a1d7a2feefc8b694` | `projects/9476327726481865180/screens/5472fc7d98cf4157a1d7a2feefc8b694` |
| `w.auth.policies` | done | `40616db49381422cb142a2bb01eb1568` | `projects/9476327726481865180/screens/40616db49381422cb142a2bb01eb1568` |
| `w.employer.onboarding` | done | `3110883bf2b5495cbaf32c6fe2dd3c1e` | `projects/9476327726481865180/screens/3110883bf2b5495cbaf32c6fe2dd3c1e` |
| `w.employer.dashboard` | done | `964a53af95af4ca4b10ca80feeeb95dc` | `projects/9476327726481865180/screens/964a53af95af4ca4b10ca80feeeb95dc` |
| `w.employer.jobs.list` | done | `875c2ea8935c4552a4ebbaf39b554e5a` | `projects/9476327726481865180/screens/875c2ea8935c4552a4ebbaf39b554e5a` |
| `w.employer.jobs.create` | done | `81efc1d2528e4e2ba784f360035852d5` | `projects/9476327726481865180/screens/81efc1d2528e4e2ba784f360035852d5` |
| `w.employer.jobs.detail` | done | `096a8e5496fa4b788c09b219e4649b66` | `projects/9476327726481865180/screens/096a8e5496fa4b788c09b219e4649b66` |
| `w.employer.jobs.edit` | done | `1b02e01943e649e7a33da106ce42673b` | `projects/9476327726481865180/screens/1b02e01943e649e7a33da106ce42673b` |
| `w.employer.applicants.board` | mcp_timeout | — | MCP -32001 (no retry) |
| `w.employer.applicants.detail` | done | `3ef05ddf93b54d31a6e0f47fe1a78cc5` | `projects/9476327726481865180/screens/3ef05ddf93b54d31a6e0f47fe1a78cc5` |
| `w.employer.branches.list` | done | `7d83beb4dd444ae9a8ead871709931e2` | `projects/9476327726481865180/screens/7d83beb4dd444ae9a8ead871709931e2` |
| `w.employer.branches.form` | done | `40203df32ede49f7833cf918cb8c6070` | `projects/9476327726481865180/screens/40203df32ede49f7833cf918cb8c6070` |
| `w.employer.branches.detail` | done | `8ed545972d4f4a74b406fdf7b775b066` | `projects/9476327726481865180/screens/8ed545972d4f4a74b406fdf7b775b066` |
| `w.employer.team.list` | done | `2d11bf6291d947c2a9cfaa7c015b8431` | `projects/9476327726481865180/screens/2d11bf6291d947c2a9cfaa7c015b8431` |
| `w.employer.tokens.overview` | done | `38b54ac8db11432ba5027e9f7600ccc5` | `projects/9476327726481865180/screens/38b54ac8db11432ba5027e9f7600ccc5` |
| `w.employer.tokens.history` | done | `d7532a2272ba46b2bda3c033ecc35b4a` | `projects/9476327726481865180/screens/d7532a2272ba46b2bda3c033ecc35b4a` |
| `w.employer.tokens.top-up` | done | `62cb5d401f4148c889963dd71824fe03` | `projects/9476327726481865180/screens/62cb5d401f4148c889963dd71824fe03` |
| `w.employer.favorites.workers` | done | `70967e2cefd444de8cacfb6b8c240b64` | `projects/9476327726481865180/screens/70967e2cefd444de8cacfb6b8c240b64` |
| `w.employer.ratings.pending` | done | `27f55a8a390745e7a5938628d899ed27` | `projects/9476327726481865180/screens/27f55a8a390745e7a5938628d899ed27` |
| `w.employer.notifications` | done | `b35ad4fc5ffc412ab8b68983b5089f2e` | `projects/9476327726481865180/screens/b35ad4fc5ffc412ab8b68983b5089f2e` |
| `w.employer.settings.org` | done | `65e91ed571294aa389a400dcfeee35c3` | `projects/9476327726481865180/screens/65e91ed571294aa389a400dcfeee35c3` |
| `w.employer.settings.industry` | done | `fd35b999c1d446989f2dd62372db44de` | `projects/9476327726481865180/screens/fd35b999c1d446989f2dd62372db44de` |
| `w.employer.settings.billing` | done | `d231b248605a4d2a8e856d2bc667360f` | `projects/9476327726481865180/screens/d231b248605a4d2a8e856d2bc667360f` |
| `w.employer.reports.shifts` | done | `896eb0863dc04def90e18815652aacb2` | `projects/9476327726481865180/screens/896eb0863dc04def90e18815652aacb2` |
| `w.employer.shift.attendance` | done | `f9b4d6222862406fad1c7feba1c0c60a` | `projects/9476327726481865180/screens/f9b4d6222862406fad1c7feba1c0c60a` |
| `w.employer.verification` | done | `5862cdff3f904b7b8e327371b6fb7b9e` | `projects/9476327726481865180/screens/5862cdff3f904b7b8e327371b6fb7b9e` |
| `w.employer.abuse.report` | done | `8a435667f3d64811a873a6c20b573775` | `projects/9476327726481865180/screens/8a435667f3d64811a873a6c20b573775` |

---

## Confirmed assets (screens with MCP `get_screen` / full generate payload)

### `w.public.legal.terms`

- **Title:** w.public.legal.terms — Kullanım Koşulları  
- **Screenshot:** `projects/9476327726481865180/files/ec72d4b17fd047479b9196e59db6d0d1`  
- **HTML:** `projects/9476327726481865180/files/a55a62d3adf741da9207eaac2ba01a35`

### `w.auth.otp`

- **Title:** w.auth.otp — SMS Doğrulama  
- **Screenshot:** `projects/9476327726481865180/files/84e0cc6f84fc4e359fae7343c5790986`  
- **HTML:** `projects/9476327726481865180/files/db73fb2570954fde8b8c48907087b6e3`

### `w.employer.dashboard`

- **Title:** w.employer.dashboard — Kontrol Paneli  
- **Screenshot:** `projects/9476327726481865180/files/cdc8b70e8421463f8c285983713a5802`  
- **HTML:** `projects/9476327726481865180/files/d37a4686f20447b083e2295141ca2124`

### `w.employer.branches.list`

- **Title:** w.employer.branches.list — Şubeler  
- **Screenshot:** `projects/9476327726481865180/files/7004c77242f949108edc15e258b7c962`  
- **HTML:** `projects/9476327726481865180/files/38430d4d01f34bbd9e07c3148d4ce714`

### `w.employer.notifications`

- **Title:** w.employer.notifications — Bildirimler  
- **Screenshot:** `projects/9476327726481865180/files/60365163e7c94f4faf088f9f3f4f1466`  
- **HTML:** `projects/9476327726481865180/files/f6aceed84e004b7f8919e6405607e6f7`

### `w.employer.settings.billing`

- **Title:** w.employer.settings.billing — Faturalandırma  
- **Screenshot:** `projects/9476327726481865180/files/f44a6ecc8ed04c9989eae03961b2efaa`  
- **HTML:** `projects/9476327726481865180/files/96f39beeff73454b971418befc52bdad`

### `w.employer.reports.shifts`

- **Title:** w.employer.reports.shifts — Vardiya Raporu  
- **Screenshot:** `projects/9476327726481865180/files/b1b5ffd199a44e7182f3fe213a41972a`  
- **HTML:** `projects/9476327726481865180/files/f721dca80e3945ce800e3397d4fa7bc5`

---

## Generation session ids (agent-complete, id not in MCP payload)

Use for support / Stitch UI correlation if needed.

| Catalog ID | sessionId |
| --- | --- |
| `w.public.landing` | `9415127222362832454` |
| `w.public.pricing` | `10509202983436218483` |
| `w.public.legal.privacy` | `11374663264179041381` |
| `w.auth.login` | `1714890563646922632` |
| `w.auth.policies` | `8525507718827654768` |
| `w.employer.onboarding` | `15970733839857280240` |
| `w.employer.jobs.list` | `11068406207891695916` |
| `w.employer.jobs.create` | `10095147000580129629` |
| `w.employer.jobs.detail` | `4567943891743407480` |
| `w.employer.jobs.edit` | `1854259799772534008` |
| `w.employer.applicants.board` | `10572735392338401187` |
| `w.employer.applicants.detail` | `75271411505947144` |
| `w.employer.branches.form` | `14481967421696603453` |
| `w.employer.branches.detail` | `8888392318773338928` |
| `w.employer.team.list` | `355540804220564997` |
| `w.employer.tokens.overview` | `1080173638945500503` |
| `w.employer.tokens.history` | `10889889368470834247` |
| `w.employer.tokens.top-up` | `18409794066902953409` |
| `w.employer.favorites.workers` | `2450336523712038925` |
| `w.employer.shift.attendance` | `9267980305226241168` |
| `w.employer.verification` | `4275654687116195874` |
| `w.employer.abuse.report` | `15381886996552527179` |

---

## Prompts used (`generate_screen_from_text`, one call per catalog row)

Each prompt included: catalog ID in **Screen title**, DESKTOP 1440px, DS above, Turkish, no purple.

| Catalog ID | Prompt (abbrev.) |
| --- | --- |
| `w.public.landing` | Brand-first full-bleed hero, ONE headline, ONE orange CTA İşveren girişi, cream #F3E8CF |
| `w.public.pricing` | Token/provision explainer, packages, FAQ, orange CTA |
| `w.public.legal.privacy` | KVKK legal article, Sürüm 1.0 · 2026, cream long-form |
| `w.public.legal.terms` | Numbered Turkish terms sections, marketing header/footer |
| `w.auth.login` | Centered card, +90 phone, Kod gönder, worker app links |
| `w.auth.otp` | 6 OTP boxes, Devam et, resend timer |
| `w.auth.policies` | Dual checkboxes, Kabul et ve devam et |
| `w.employer.onboarding` | Horizontal stepper: İşletme → Şube → Sektör → Token |
| `w.employer.dashboard` | Sidebar + KPI row + needs-attention table + Yeni ilan |
| `w.employer.jobs.list` | Filterable jobs table + Yeni ilan |
| `w.employer.jobs.create` | Wizard Pozisyon/Detay/Önizleme + token sidebar |
| `w.employer.jobs.detail` | Tabs Detay / Başvurular / timeline |
| `w.employer.jobs.edit` | Edit form, locked published fields |
| `w.employer.applicants.board` | Kanban/table Pending…Rejected, filters |
| `w.employer.applicants.detail` | Split panel worker profile, Kabul/Reddet |
| `w.employer.branches.list` | Branches table + Yeni şube |
| `w.employer.branches.form` | Form + map pin |
| `w.employer.branches.detail` | Managers, jobs, coordinates |
| `w.employer.team.list` | Managers table, invite codes |
| `w.employer.tokens.overview` | Balance / hold / available + holds table |
| `w.employer.tokens.history` | Ledger table, date filters |
| `w.employer.tokens.top-up` | Amount packages, payment, confirm |
| `w.employer.favorites.workers` | Saved workers table, mustard stars |
| `w.employer.ratings.pending` | Pending shift ratings table *(MCP timeout)* |
| `w.employer.notifications` | Inbox, tabs, unread |
| `w.employer.settings.org` | Company profile form *(MCP timeout)* |
| `w.employer.settings.industry` | Industry scope checkboxes *(MCP timeout)* |
| `w.employer.settings.billing` | Payment methods + invoices |
| `w.employer.reports.shifts` | Date/branch filters, attendance table, CSV export |
| `w.employer.shift.attendance` | Disputes queue, manual confirm |
| `w.employer.verification` | Firm verification status, document upload |
| `w.employer.abuse.report` | Abuse report form, Gönder |

---

## Follow-up (completed 2026-10-10)

All three prior MCP-timeout screens generated sequentially; ids synced to [`_stitch-coverage-web.md`](_stitch-coverage-web.md).
