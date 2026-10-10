# 10 — Production-ready documentation gate

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**Purpose:** Declare that **PartonNewArch is ready for full-stack production coding**. Agents implement a shippable monorepo — not spikes, stubs, MVP gaps, or TODO-driven architecture.

> If this file and [`AGENTS.md`](../AGENTS.md) conflict with a spoke marked `proposed`, **this gate + locked ADRs win**. Update the spoke in the same change.

---

## 1. Verdict

| Topic | Stance |
| --- | --- |
| Docs ready for coding? | **Yes** — full stack |
| Target quality | **Production-ready** (staging/prod paths defined) |
| MVP / stub surfaces | **Forbidden** (marketing, admin, mobile, API) |
| TODOs in eng defaults | **Forbidden** |
| Ask user for stack? | **Never** — ADR + [`02`](02-defaults-and-non-asks.md) |

**In scope for v1 production ship:** Nest API + Vite admin + Vite marketing + bare RN (iOS+Android) + Postgres + SMS/FCM sandbox→prod + PM2 + NGINX + Fastlane + DevOps + legal audit CSV/PDF.

**Out of scope for v1 (do not block coding):** employer **web console** channel (catalogued; mobile employer is primary); cloud vendor brand (AO-10) — use Compose + VM/PM2/NGINX until human picks cloud.

---

## 2. Locked stack (implement exactly)

| Layer | Lock |
| --- | --- |
| API | NestJS **12** modular monolith, REST `/api/v1` |
| ORM | **Prisma** latest stable on PostgreSQL **18** (ADR-0003 **accepted**) |
| Contracts | Zod **4** in `packages/api-contracts` |
| Mobile | Bare RN latest, NativeWind, **iOS + Android**, Fastlane |
| Admin | Vite + shadcn dark, Nest-hosted |
| Marketing | `apps/marketing` production (all `w.public.*`, prerender) |
| Jobs | Outbox Stage A → BullMQ Stage B; RabbitMQ Hold |
| Realtime | FCM background; SSE foreground |
| Auth | Phone OTP + JWT; manager first-class AuthZ |
| Tooling | **pnpm** + **Turborepo**; packages `api-contracts`, `shared-utils`, `design-tokens` |
| Ops | PM2 + NGINX; Compose local/staging DB; Admin DevOps + MCP; legal audit |
| Clients support | Last **2** native releases (`X-API-Deprecated` when sunsetting) |
| Retention | Locked matrix in [17](../backend/17-privacy-kvkk-gdpr.md) / [22](../backend/22-legal-audit-logger.md) |

Hard bans: [`AGENTS.md`](../AGENTS.md) §2.

---

## 3. Production coding rules

1. Follow playbook **S0→S9** — [`01-implementation-playbook.md`](01-implementation-playbook.md).  
2. Every feature: Nest rule + REST + Zod + screen(s) + components + recipe + case IDs + tests on **real** DB.  
3. **No mocks** for SMS/FCM/storage/DB — [`08`](08-no-mocks-fully-functional.md).  
4. **No invented** routes/screens/cases — [`07`](07-anti-hallucination.md).  
5. **Latest stable** majors — [`09`](09-latest-stack-policy.md).  
6. Domain modules in [`04-domain-modules`](../backend/04-domain-modules.md) are **final for v1**.  
7. Screen catalogs (`m.*` / `w.*`) are **implementation inventory** — ship them.  
8. Staging/prod Nest via PM2; edge NGINX; mobile via Fastlane.  
9. Never leave `TODO(counsel)`, stub CTAs, or “MVP later” in production paths.  
10. UI from [`DESIGN.md`](../DESIGN.md) (ADR-0039) — cream/forest/orange; no purple-glow.  
11. Never claim green CI/tests unless you ran them.

---

## 4. Environments (production path)

| Env | Required |
| --- | --- |
| local | Compose Postgres (+ Redis when Stage B) + MinIO + real SMS/FCM sandbox |
| ci | Ephemeral Postgres; real sandbox creds or provider test mode — **not** Noop providers in app code |
| staging | PM2 + NGINX + sandbox SMS/FCM + synthetic data |
| production | PM2 + NGINX + prod SMS/FCM + real data; secrets via env/secret manager |

Cloud vendor brand (AWS/GCP/…) is **AO-10** and does **not** block coding or staging on a VM/Compose host.

Detail: [`../07-environments-and-ops.md`](../07-environments-and-ops.md).

---

## 5. Slice DoD + production gates

All items in [`AGENTS.md`](../AGENTS.md) §5 **plus**:

- [ ] Feature works in **local** against Compose Postgres  
- [ ] Migrations checked in; no shadow schema drift  
- [ ] Admin and/or mobile UI complete for the case (no “API only”)  
- [ ] Observability: request id + structured logs (no PII)  
- [ ] Legal audit events for privileged mutations  
- [ ] i18n `tr-TR` keys; EN `error.code`  
- [ ] Fastlane / PM2 / NGINX artifacts present when touching those surfaces  
- [ ] No banned stack; no stubs; no TODOs in shipped defaults  

---

## 6. What remains human-only (does not block coding)

| Item | Why non-blocking |
| --- | --- |
| AO-10 cloud vendor brand | Compose + PM2 + NGINX until chosen |
| Store account / ASC / Play JSON | Ask once when upload lanes needed |
| Prod SMS/FCM secrets | Ask once at prod deploy |
| VERBIS / public policy wording | Product/legal copy; eng notices versioned |

---

## 7. Agent start

Use [`06-start-prompts.md`](06-start-prompts.md). Shortest:

```text
PartonNewArch is production-ready for full-stack coding (agents/10).
Implement S0→S9 from AGENTS.md + 07 + 08 + 09 + 10. No mocks, no TODOs, no MVP gaps.
```

---

## Related

- [`AGENTS.md`](../AGENTS.md)  
- [`02-defaults-and-non-asks.md`](02-defaults-and-non-asks.md)  
- [`03-scaffold-spec.md`](03-scaffold-spec.md)  
- [`DOC-COHESION.md`](../DOC-COHESION.md) · [`DOC-INDEX.md`](../DOC-INDEX.md)  
- [`01-architecture-decisions.md`](../01-architecture-decisions.md)  
- ADR registry: [`../backend/adr/README.md`](../backend/adr/README.md) (0001–0038)  
