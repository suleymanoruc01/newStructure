# AGENTS.md — AI coding agent entrypoint

**Audience:** Cursor · Claude Code · Antigravity · Codex · similar  
**Goal:** Implement the **entire PartOn monorepo** from these docs with **minimum user questions**.  
**Last updated:** 2026-10-10  
**Docs readiness:** **Production-ready for full-stack coding** — [`agents/10-production-ready.md`](agents/10-production-ready.md)

> If you are an AI agent: **read this file first**, then follow the linked playbooks. Do **not** invent Expo, GraphQL, gRPC-to-mobile, RabbitMQ, or Next.js admin. Do **not** ask the user to re-decide locked ADRs.  
> **Production-ready:** Read [`agents/10-production-ready.md`](agents/10-production-ready.md). Ship staging/prod paths — no MVP stubs, no TODOs in eng defaults.  
> **UI/UX:** Read [`DESIGN.md`](DESIGN.md) before any screen work (Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md) format — ADR-0039). Stitch projects (all 147 screens): [`shared/13-stitch-projects.md`](shared/13-stitch-projects.md) — Mobile `12785901164400200423` · Web `9476327726481865180` · Admin `11035737984554056770`.  
> **Anti-hallucination:** Read [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md). Every route/screen/case/ADR you use must come from an **inspected file** — never from model memory.  
> **No mocks:** Read [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md). No Noop/Console/Fake providers — everything must be **fully functional** (sandbox OK).

---

## 1. Immediate context load (in order)

| # | Doc | Why |
| --- | --- | --- |
| 1 | **This file** | Operating rules + non-asks |
| 2 | [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md) | **Grounding — no invented APIs/screens/cases** |
| 3 | [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md) | **No mocks — real sandbox integrations** |
| 4 | [`agents/09-latest-stack-policy.md`](agents/09-latest-stack-policy.md) | **Latest stable** Nest 12 / TS 6 / RN / Zod… |
| 5 | [`agents/10-production-ready.md`](agents/10-production-ready.md) | **Production-ready** full-stack coding gate |
| 6 | [`DESIGN.md`](DESIGN.md) | **Visual SoR** — look & feel (ADR-0039) |
| 7 | [`agents/00-operating-manual.md`](agents/00-operating-manual.md) | How to work autonomously |
| 8 | [`agents/02-defaults-and-non-asks.md`](agents/02-defaults-and-non-asks.md) | Frozen answers for open forks |
| 9 | [`04-application-architecture.md`](04-application-architecture.md) | System structure |
| 10 | [`01-architecture-decisions.md`](01-architecture-decisions.md) | Locked vs open |
| 11 | [`agents/01-implementation-playbook.md`](agents/01-implementation-playbook.md) | Ordered build slices |
| 12 | [`agents/03-scaffold-spec.md`](agents/03-scaffold-spec.md) | Exact repo tree + versions |
| 13 | [`agents/04-coding-conventions.md`](agents/04-coding-conventions.md) | Nest / RN / Vite patterns |
| 14 | [`cases/`](cases/) + [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) | Acceptance (248 cases) |
| 15 | [`DOC-INDEX.md`](DOC-INDEX.md) · [`DOC-COHESION.md`](DOC-COHESION.md) | Find docs; keep hubs/spokes in sync |

**Do not** load the entire tree into context. Use DOC-INDEX and pull deep-dives **per slice**.

---

## 2. Hard bans (never implement)

| Banned | Use instead |
| --- | --- |
| Expo / Expo Router / EAS | Bare React Native + React Navigation + **Fastlane** (ADR-0030) |
| GraphQL / tRPC public API | REST `/api/v1` |
| gRPC to mobile/admin | REST only |
| RabbitMQ | Outbox → BullMQ (Stage B) |
| Next.js App Router admin | Vite + shadcn dark, Nest-hosted |
| Firestore / client SoR | PostgreSQL via Nest |
| Prisma / DB models in mobile | `packages/api-contracts` only |
| Secrets in shared packages | Nest env / secret manager |
| Purple-glow AI UI / glass on cards / invented palette | [`DESIGN.md`](DESIGN.md) · [09](shared/09-modern-ui-principles.md) · [01 colors](shared/01-color-system.md) |
| Mocks / Noop / Console / Fake providers | Real sandbox integrations — [08](agents/08-no-mocks-fully-functional.md) |
| Stale majors / invented version pins | **Latest stable** of Adopt stack — [09](agents/09-latest-stack-policy.md) · ADR-0028 |
| iOS-only or Android-only mobile slices | **Both** platforms + latest OS QA — [mobile/06](mobile/06-ios-android-platforms.md) · ADR-0029 |

---

## 3. Autonomy rules

1. **Locked ADR = law.** Implement; do not re-open in chat.  
2. **Ground every artifact** — routes, screens, cases, error codes — per [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md).  
3. **No mocks — fully functional** — per [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md).  
4. **Latest stable libraries** — Nest **12**, TS **6**, current Node LTS, latest RN/Zod/Prisma — per [`agents/09-latest-stack-policy.md`](agents/09-latest-stack-policy.md); verify with `npm view`/ctx7 (never invent versions).  
5. **Mobile = iOS + Android** — latest stable OS QA; both CI builds; write `PLATFORM.md` — [`mobile/06-ios-android-platforms.md`](mobile/06-ios-android-platforms.md). **Fastlane** for release — [`mobile/07-fastlane.md`](mobile/07-fastlane.md) · ADR-0030. **Web = PM2 + NGINX** for Nest staging/prod — [`web/05-pm2.md`](web/05-pm2.md) · [`web/06-nginx.md`](web/06-nginx.md) · ADR-0031/0032. **Marketing** = `apps/marketing` — [`web/07-marketing.md`](web/07-marketing.md) · ADR-0033.  
6. **Open product forks** → use [`agents/02-defaults-and-non-asks.md`](agents/02-defaults-and-non-asks.md). Do not ask the user for stack. 
7. **Ask the user only for:** missing **sandbox** SMS/FCM (or prod) credentials, Apple/Google store accounts, or explicit “stop” — never for stack choice; **never** replace missing creds with Noop.  
8. **One slice at a time** from the playbook; finish DoD before the next.  
9. **Every feature:** Nest rule + REST + Zod schema + screen(s) + components + case IDs + tests against **real** Postgres/sandbox.  
10. **Prefer continuing** over asking “should I proceed?” — if the playbook says next slice **and** deps are functional, do it.  
11. **When blocked by missing sandbox secret:** ask once; pause that integration slice; do **not** stub.  
12. **Turkish UI copy** via i18n keys (`tr-TR` primary); English `error.code`.  
13. **Never claim tests/build passed** unless you ran the command.

---

## 4. Target monorepo (create if absent)

```text
apps/backend     NestJS modular monolith — REST + admin static
apps/admin       Vite React + shadcn/ui dark
apps/marketing   Vite public marketing — production (all w.public.* + prerender) — ADR-0033
apps/mobile      Bare React Native + NativeWind
apps/devops-mcp  Admin DevOps MCP (errors/releases) — ADR-0036
packages/api-contracts   Zod 4 schemas + types + error codes
packages/shared-utils    Pure helpers only
packages/design-tokens   Color tokens (ADR-0017)
```

Scaffold details: [`agents/03-scaffold-spec.md`](agents/03-scaffold-spec.md).

---

## 5. Definition of done (any slice)

- [ ] Case IDs (`T-###` / `CASE-*`) in PR/commit notes  
- [ ] Business rule in Nest domain service  
- [ ] REST under `/api/v1` + Zod in `api-contracts`  
- [ ] Envelope `{data,meta}` / `{error,meta}` ([shared/12](shared/12-api-contracts.md))  
- [ ] AuthZ: role + resource scope on protected routes  
- [ ] Screen ID(s) + named components + layout recipe R#  
- [ ] loading / empty / error / blocked states  
- [ ] Tests tagged with case IDs ([06-testing-strategy](06-testing-strategy.md))  
- [ ] No banned stack; no PII in logs/jobs  
- [ ] Anti-hallucination gate ([07](agents/07-anti-hallucination.md) §7): routes/screens/cases exist in docs/JSON  
- [ ] No mocks gate ([08](agents/08-no-mocks-fully-functional.md)): real providers; boot fails if SMS/FCM/DB unset  
- [ ] Latest-stable gate ([09](agents/09-latest-stack-policy.md)): Nest 12 / TS 6 / current LTS Node; RN/Zod/Prisma `@latest` verified  
- [ ] Dual-platform gate ([mobile/06](mobile/06-ios-android-platforms.md)): iOS **and** Android build; latest OS QA  
- [ ] Fastlane gate ([mobile/07](mobile/07-fastlane.md)): `fastlane/` + ios/android beta|release lanes; no EAS  
- [ ] PM2 gate ([web/05](web/05-pm2.md)): `ecosystem.config.cjs` for Nest; staging/prod via PM2  
- [ ] NGINX gate ([web/06](web/06-nginx.md)): templates; TLS; SSE `proxy_buffering off`  
- [ ] Marketing gate ([web/07](web/07-marketing.md)): production `apps/marketing` — all `w.public.*` + prerender/SEO; **no** MVP gaps or CTA stubs; not under `/admin`  
- [ ] Admin case gate ([web/08](web/08-admin-case-coverage.md)): every CASE-* group has `w.admin.*` ops surface (ADR-0034)  
- [ ] Admin DevOps gate ([web/09](web/09-admin-devops.md)): error triage (API+clients) + releases + services (ADR-0035)  
- [ ] DevOps MCP gate ([web/10](web/10-devops-mcp.md)): `apps/devops-mcp` authenticated tools (ADR-0036)  
- [ ] Legal audit gate ([backend/22](backend/22-legal-audit-logger.md) · [web/11](web/11-legal-audit-reports.md)): append-only logger + admin CSV **and** PDF (ADR-0037)  
- [ ] Production-ready gate ([agents/10](agents/10-production-ready.md)): no MVP stubs; no eng TODOs; staging/prod path present  
- [ ] DESIGN.md gate: UI matches [`DESIGN.md`](DESIGN.md) tokens/components (ADR-0039); no purple-glow  

---

## 6. Tool-specific notes

| Tool | How to use this pack |
| --- | --- |
| **Cursor** | `AGENTS.md` + [`.cursor/rules/parton-newarch.mdc`](../.cursor/rules/parton-newarch.mdc) alwaysApply |
| **Claude Code** | [`CLAUDE.md`](CLAUDE.md) points here; follow playbook slices |
| **Antigravity / others** | Treat `AGENTS.md` as system project instructions |

---

## 7. One-shot user prompt

See [`agents/06-start-prompts.md`](agents/06-start-prompts.md). Shortest full build:

```text
PartonNewArch is production-ready for full-stack coding (agents/10).
Implement from AGENTS.md + DESIGN.md + agents/07 + 08 + 09 + 10 + mobile/06 + mobile/07.
Playbook S0→S9. Use agents/02 defaults. Ground routes/screens/cases in files — do not invent.
UI from DESIGN.md (cream/forest/orange — no purple-glow). No mocks. Latest Nest 12 / TS 6 / RN / Zod / Prisma.
Mobile iOS+Android + Fastlane. Nest PM2 + NGINX. Marketing production. Legal audit CSV/PDF.
Ask once for missing sandbox/store secrets; never stub.
```

## 8. Related

- **Anti-hallucination:** [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md)  
- **No mocks:** [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md)  
- **Latest stack:** [`agents/09-latest-stack-policy.md`](agents/09-latest-stack-policy.md) · [ADR-0028](backend/adr/0028-latest-stable-stack.md)  
- **iOS + Android:** [`mobile/06-ios-android-platforms.md`](mobile/06-ios-android-platforms.md) · [ADR-0029](backend/adr/0029-dual-platform-ios-android.md)  
- **Fastlane:** [`mobile/07-fastlane.md`](mobile/07-fastlane.md) · [ADR-0030](backend/adr/0030-fastlane-mobile-release.md)  
- **PM2 (web):** [`web/05-pm2.md`](web/05-pm2.md) · [ADR-0031](backend/adr/0031-pm2-web-process-manager.md)  
- **NGINX (web):** [`web/06-nginx.md`](web/06-nginx.md) · [ADR-0032](backend/adr/0032-nginx-reverse-proxy.md)  
- **Marketing:** [`web/07-marketing.md`](web/07-marketing.md) · [ADR-0033](backend/adr/0033-marketing-site.md)  
- **Admin × cases:** [`web/08-admin-case-coverage.md`](web/08-admin-case-coverage.md) · [ADR-0034](backend/adr/0034-admin-full-case-coverage.md)  
- **Admin DevOps:** [`web/09-admin-devops.md`](web/09-admin-devops.md) · [ADR-0035](backend/adr/0035-admin-devops-error-tracking.md)  
- **DevOps MCP:** [`web/10-devops-mcp.md`](web/10-devops-mcp.md) · [ADR-0036](backend/adr/0036-admin-devops-mcp.md)  
- **Legal audit:** [`backend/22-legal-audit-logger.md`](backend/22-legal-audit-logger.md) · [`web/11-legal-audit-reports.md`](web/11-legal-audit-reports.md) · [ADR-0037](backend/adr/0037-legal-audit-logger.md)  
- **Production-ready:** [`agents/10-production-ready.md`](agents/10-production-ready.md) · [ADR-0038](backend/adr/0038-monorepo-tooling.md)  
- **DESIGN.md:** [`DESIGN.md`](DESIGN.md) · [ADR-0039](backend/adr/0039-design-md.md)  
- Operating manual: [`agents/00-operating-manual.md`](agents/00-operating-manual.md)  
- Playbook: [`agents/01-implementation-playbook.md`](agents/01-implementation-playbook.md)  
- Defaults: [`agents/02-defaults-and-non-asks.md`](agents/02-defaults-and-non-asks.md)  
- Conventions: [`agents/04-coding-conventions.md`](agents/04-coding-conventions.md)  
- Slice catalog: [`agents/05-slice-catalog.md`](agents/05-slice-catalog.md)  
