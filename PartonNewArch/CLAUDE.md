# CLAUDE.md — Claude Code project instructions

You are implementing **PartOn** from architecture docs in `PartonNewArch/`.

1. Read [`AGENTS.md`](AGENTS.md), [`DESIGN.md`](DESIGN.md) (UI/UX SoR), [`agents/10-production-ready.md`](agents/10-production-ready.md), [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md), [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md), and [`agents/09-latest-stack-policy.md`](agents/09-latest-stack-policy.md) first.  
2. Follow [`agents/00-operating-manual.md`](agents/00-operating-manual.md) and [`agents/01-implementation-playbook.md`](agents/01-implementation-playbook.md).  
3. Use frozen defaults in [`agents/02-defaults-and-non-asks.md`](agents/02-defaults-and-non-asks.md) — **do not ask** the user to re-decide locked ADRs or listed forks.  
4. **Do not invent** routes, screen IDs, case IDs, or stack choices — open the source file; cite the path.  
5. **No mocks/noops** — real Postgres + SMS/FCM sandbox; fail boot if unset; ask once for missing sandbox creds.  
6. **Latest stable** — Nest **12**, TS **6**, current Node LTS, latest RN/Zod/Prisma (`npm view` / ctx7).  
7. **Production-ready** — no MVP stubs, no eng TODOs; staging/prod paths (PM2/NGINX/Fastlane) — [`agents/10`](agents/10-production-ready.md).  
8. Acceptance = 248 cases in [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) + [`cases/`](cases/).  
9. Stack: Nest modular monolith (**PM2** + **NGINX** staging/prod) + bare RN (no Expo) on **iOS + Android** (latest OS) + Postgres + REST `/api/v1` + Vite shadcn admin + marketing.  
10. Mobile: both platforms from S2 — [`mobile/06`](mobile/06-ios-android-platforms.md); **Fastlane** — [`mobile/07`](mobile/07-fastlane.md). Web: **PM2** — [`web/05`](web/05-pm2.md); **NGINX** — [`web/06`](web/06-nginx.md); **marketing** — [`web/07`](web/07-marketing.md); **admin CASE-*** — [`web/08`](web/08-admin-case-coverage.md); **DevOps** — [`web/09`](web/09-admin-devops.md); **DevOps MCP** — [`web/10`](web/10-devops-mcp.md); **legal audit CSV/PDF** — [`web/11`](web/11-legal-audit-reports.md) · [`backend/22`](backend/22-legal-audit-logger.md).  
11. Never claim tests passed unless you ran them.

When the user says “build the app” or “implement”, start at playbook **S0** and continue slices. If sandbox SMS/FCM credentials are missing, **ask once** and pause those slices — **do not** stub or Noop.
