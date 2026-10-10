# Web — Public & auth screens

**Status:** `accepted` (production coding inventory) · [agents/10](../../agents/10-production-ready.md)  
**Nest modules:** `auth`, `users`, `policies`, `employers`

---

## `w.public.landing` — Marketing landing

| Field | Detail |
| --- | --- |
| **Route** | `/` |
| **Role** | Public |
| **Purpose** | Brand + value props for workers & employers; CTA into console / store |
| **MVP** | **P0** (required — ADR-0033) |
| **Layout** | Hero, dual CTA (İşveren girişi / Uygulamayı indir), feature sections, footer legal |
| **Actions** | Employer login; App store badges; Contact |
| **Cases** | `CASE-UX` |
| **Notes** | Production marketing — [07-marketing](../07-marketing.md); brand-first viewport; prerender; no dashboard clutter; `apps/marketing` |

---

## `w.public.pricing` — Pricing

| Field | Detail |
| --- | --- |
| **Route** | `/pricing` |
| **Purpose** | Explain token / provision model |
| **MVP** | **P0** (required with marketing — ADR-0033; production, not deferred) |
| **Cases** | `CASE-TOKEN` |
| **Notes** | Live in `apps/marketing`; prerendered; linked from landing/footer — [07-marketing](../07-marketing.md) |

---

## `w.public.legal.privacy` / `w.public.legal.terms`

| Field | Detail |
| --- | --- |
| **Route** | `/legal/privacy` · `/legal/terms` |
| **MVP** | P0 |
| **Purpose** | Static legal; versions mirrored in `policies` module for acceptance |
| **Cases** | `CASE-SECURITY` |

---

## `w.auth.login` — Phone login

| Field | Detail |
| --- | --- |
| **Route** | `/login` |
| **Role** | Guest |
| **Purpose** | Start OTP for employer (and admin via separate host) |
| **MVP** | P0 |
| **Layout** | Centered card: phone, CTA, link to mobile app for workers |
| **Actions** | Send code; Worker? → store links |
| **API** | `POST /api/v1/auth/otp/request` |
| **Cases** | `CASE-AUTH` |
| **Notes** | Worker web app not in v1 — copy steers workers to RN |

---

## `w.auth.otp` — OTP verify

| Field | Detail |
| --- | --- |
| **Route** | `/login/otp` |
| **MVP** | P0 |
| **API** | `POST /api/v1/auth/otp/verify` |
| **Cases** | `CASE-AUTH`, `CASE-SECURITY` |
| **Post-success** | If employer incomplete → onboarding; else dashboard. If non-employer → message + app links |

---

## `w.auth.policies` — Policy gate

| Field | Detail |
| --- | --- |
| **Route** | `/policies/accept` |
| **MVP** | P0 |
| **API** | policies accept endpoints |
| **Cases** | `CASE-AUTH` |

---

## `w.employer.onboarding` — Web onboarding wizard

| Field | Detail |
| --- | --- |
| **Route** | `/onboarding` |
| **Role** | Employer |
| **Purpose** | Business → first branch → industry → token intro |
| **MVP** | P0 |
| **Layout** | Horizontal stepper (desktop); progress saved server-side |
| **Actions** | Next / Back / Finish → dashboard |
| **API** | `employers`, `branches`, industries |
| **Cases** | `CASE-EMPLOYER-BRANCH`, `CASE-E2E`, `CASE-UX` |
| **Parity** | Mirrors mobile employer onboarding with wider forms / map |
