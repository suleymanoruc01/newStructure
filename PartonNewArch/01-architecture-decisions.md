# 01 — Architecture decisions (locked vs open)

**Status:** `accepted` (process)  
**Last updated:** 2026-10-10  
**Source:** partOn mimari kararları (team Q&A)

This file records **locked** starting decisions and **open** topics. Feature scope, detailed domain names, and deep API/security design follow after app boundaries and tooling are set.

> **Nest vs Next:** The source decision text names Nest.js for API + admin, then later says “Next.js” for the same modular monolith. PartonNewArch treats that as **NestJS** (API + admin in one Nest app). If the intent was literally Next.js, supersede [ADR-0001](backend/adr/0001-nestjs-modular-monolith.md) explicitly.

## Locked starting decisions

| Decision | Detail |
| --- | --- |
| Monorepo | One repository; mobile and backend as separate apps in different folders |
| Product | Mobile app matching part-time job seekers with employers |
| User groups (v1 product) | Job seekers (workers) and employers |
| Backend stack | **NestJS** for REST API **and** admin management panel |
| Deployable shape | API + admin run in the **same NestJS application** |
| Mobile | React Native (**bare**); targets **iOS and Android**; **Expo forbidden** |
| Market | Turkey only at start; cloud region **not** chosen yet |
| Language | TypeScript in mobile, backend, and shared packages |
| Database | PostgreSQL |
| Project size | Broad / comprehensive product over time |
| App boundaries | Two components: **mobile** and **backend** (API + admin) |
| Feature depth | Feature catalog later; **architecture boundaries and repo structure first** |
| Hosting | Cloud provider (vendor TBD) |
| Team size | Does not drive architecture choices at this stage |
| Background workers | **No** separate worker app/process at start; revisit when needed |
| Modular monolith | Backend organized as Nest modules; each domain owns rules + data access |
| Shared rules | REST API endpoints and admin panel use the **same** server-side business-rule layer |
| Module boundaries | Cross-module deps only through **explicit exports**; no reaching into internals |
| Client ↔ server | **REST API** only — gRPC not for clients ([ADR-0009](backend/adr/0009-rest-vs-grpc.md)) |
| API versioning path | `/api/v1/...`; breaking changes → new major (`/api/v2/...`) |
| REST + gRPC dual edge | **Hold** until multi-service extract + new ADR |
| Shared packages | Request/response schemas, derived TS types, platform-agnostic helpers |
| Backend-only | DB access, business rules, authorization, server secrets |
| Mobile-only | Screens, navigation, device operations |
| Mobile ↔ DB | Mobile **must not** depend on DB models; API contract only |
| Shared package safety | No backend-only code or secrets in shared packages |
| Validation | Backend validates requests at runtime with shared schemas; invalid requests rejected before domain rules |
| Client validation | Mobile **may** reuse the same schema rules pre-submit; never replaces server validation |
| Schema vs AuthZ | Shared schemas describe **data shape**; AuthZ and DB-state rules stay on the backend |
| Privacy regime | **KVKK primary** (Turkey launch); **GDPR-ready** technical controls — [ADR-0010](backend/adr/0010-privacy-kvkk-gdpr.md) |
| Privacy-by-design | Minimization, versioned notices/acceptances, no continuous location tracking, no PII in logs/jobs; DSR + retention by P3 |
| AuthN | Phone **OTP** → access JWT + rotating refresh sessions — [ADR-0011](backend/adr/0011-auth-rbac.md) |
| AuthZ / RBAC | Role memberships + employer/branch **resource scope** on every protected REST route — [18](backend/18-auth-rbac.md) |
| Multi-role | One account, multiple memberships, **context switch** (AS-3 default) |
| Mobile push | **FCM** HTTP v1 + Postgres inbox/tokens via outbox — [ADR-0013](backend/adr/0013-fcm-push.md) |
| Foreground live | **SSE** (not WebSocket / not FCM replacement) — [ADR-0012](backend/adr/0012-sse-foreground-realtime.md) |
| Admin Web UI | **Vite React + [shadcn/ui](https://github.com/shadcn-ui/ui), dark default**, Nest-hosted — [ADR-0014](backend/adr/0014-web-ui-shadcn-dark.md) |
| Mobile UI | **[NativeWind](https://www.nativewind.dev/)** on bare RN (Tailwind `className`) — [ADR-0015](backend/adr/0015-mobile-ui-nativewind.md) |
| Mobile design language (iOS) | **Liquid Glass / WWDC principles** (chrome vs content; brand in content) — [ADR-0016](backend/adr/0016-mobile-ui-wwdc-liquid-glass.md) |
| Color system | Shared cream / forest / orange tokens for Web + Mobile — [ADR-0017](backend/adr/0017-color-system.md) · [shared/01](shared/01-color-system.md) |
| Theme defaults | Mobile **`system`**; Admin **`dark`** (light optional) |
| Client security | Access JWT in **memory**; refresh in **Keychain** (mobile) / **HttpOnly cookie** (web) + CSRF; TLS; Nest AuthZ only — [ADR-0018](backend/adr/0018-client-security.md) · [21](backend/21-client-security.md) |
| Screen UX / layout | Recipes **R1–R8**; one primary CTA; required states; CASE-UX mapping — [ADR-0019](backend/adr/0019-screen-ux-layout.md) · [shared/03](shared/03-screen-ux-layout.md) |
| Wizard state | **Lift to `WizardShell`** (+ scoped Zustand/Context if multi-route); Nest draft for create-job; no step-only state — [ADR-0020](backend/adr/0020-wizard-state.md) · [shared/04](shared/04-wizard-state.md) |
| Push UX | User-centered templates (copy, prefs, deep links); inbox-first — [ADR-0021](backend/adr/0021-push-notifications-ux.md) · [shared/05](shared/05-push-notifications-ux.md) |
| Accessibility | **WCAG 2.2 AA** (web); equivalent AA on mobile — [ADR-0022](backend/adr/0022-accessibility-wcag.md) · [shared/06](shared/06-accessibility-wcag.md) |
| i18n | **Turkish (`tr-TR`) primary**; EN secondary; catalog keys — [ADR-0023](backend/adr/0023-i18n-turkish-primary.md) · [shared/07](shared/07-i18n.md) |
| Routing | **React Navigation** (native stack + tabs) · **React Router** admin SPA; Expo Router / Next App Router Hold — [ADR-0024](backend/adr/0024-fluid-routing.md) · [shared/08](shared/08-routing.md) |
| UI principles | **September 2026** modern bar (P1–P12); anti-AI-generic — [ADR-0025](backend/adr/0025-modern-ui-principles.md) · [shared/09](shared/09-modern-ui-principles.md) |
| UX principles | **September 2026** experience bar (X1–X12); CASE-UX — [ADR-0026](backend/adr/0026-modern-ux-principles.md) · [shared/10](shared/10-modern-ux-principles.md) |
| API contracts | Success/error **envelope**, cursor feeds, **Zod 4** in `api-contracts` — [ADR-0027](backend/adr/0027-api-contracts-baseline.md) · [shared/12](shared/12-api-contracts.md) |
| Latest stable stack | **Newest stable** Nest/RN/Prisma/Zod/Node LTS inside ADR fences — [ADR-0028](backend/adr/0028-latest-stable-stack.md) · [agents/09](agents/09-latest-stack-policy.md) |
| Mobile platforms | **iOS + Android** first-class; latest stable OS QA; both CI builds — [ADR-0029](backend/adr/0029-dual-platform-ios-android.md) · [mobile/06](mobile/06-ios-android-platforms.md) |
| Mobile release | **Fastlane** for build/sign/store (iOS + Android); EAS Hold — [ADR-0030](backend/adr/0030-fastlane-mobile-release.md) · [mobile/07](mobile/07-fastlane.md) |
| Web process manager | **PM2** for Nest (API + admin) staging/prod — [ADR-0031](backend/adr/0031-pm2-web-process-manager.md) · [web/05](web/05-pm2.md) |
| Web edge proxy | **NGINX** TLS + reverse proxy to Nest — [ADR-0032](backend/adr/0032-nginx-reverse-proxy.md) · [web/06](web/06-nginx.md) |
| Marketing site | **`apps/marketing` production** — all `w.public.*` (incl. pricing), prerender/SEO, no MVP gaps — [ADR-0033](backend/adr/0033-marketing-site.md) · [web/07](web/07-marketing.md) |
| Web admin coverage | **`apps/admin` ops surfaces for every CASE-*** group (248 cases) — [ADR-0034](backend/adr/0034-admin-full-case-coverage.md) · [web/08](web/08-admin-case-coverage.md) |
| Admin DevOps | Error tracking (all apps) + releases/health — [ADR-0035](backend/adr/0035-admin-devops-error-tracking.md) · [web/09](web/09-admin-devops.md) |
| Admin DevOps MCP | MCP server for agent triage (same Nest SoR) — [ADR-0036](backend/adr/0036-admin-devops-mcp.md) · [web/10](web/10-devops-mcp.md) |
| Legal audit logger | Append-only `legal_audit_events` + admin **CSV/PDF** reports — [ADR-0037](backend/adr/0037-legal-audit-logger.md) · [backend/22](backend/22-legal-audit-logger.md) · [web/11](web/11-legal-audit-reports.md) |
| Monorepo tooling | **pnpm** + **Turborepo** + locked packages — [ADR-0038](backend/adr/0038-monorepo-tooling.md) |
| Docs readiness | **Production-ready for full-stack coding** — [agents/10](agents/10-production-ready.md) |
| Visual design system | **[`DESIGN.md`](DESIGN.md)** (Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md) format) — [ADR-0039](backend/adr/0039-design-md.md) |

## Scalability requirement

| Topic | Stance |
| --- | --- |
| Design intent | Architecture should accommodate growing traffic and data volume |
| Long-term ambition | Serve on the order of millions of users |
| Capacity metric | Total user count alone is **not** the capacity measure; concurrent actives / RPS TBD |
| SLOs | **Proposed** engineering targets in [05-quality-nfr.md](05-quality-nfr.md); not contractual until ops sign-off |
| Proof | Load behavior validated by capacity planning and load tests — architecture choice ≠ guarantee under every load |
| Later decisions | Horizontal scaling, Postgres connection management, background jobs, cache, observability |
| Background jobs (when broker needed) | **BullMQ + managed Redis** — RabbitMQ Hold — [ADR-0007](backend/adr/0007-bullmq-over-rabbitmq.md), [ADR-0008](backend/adr/0008-managed-redis.md) |

## Open architecture topics

| ID | Topic |
| --- | --- |
| AO-1 | ~~Deploy boundaries~~ → **Accepted:** separate CI path filters (`mobile`, `backend`, `admin`, `marketing`, `packages`) — [agents/02](agents/02-defaults-and-non-asks.md) · [ADR-0038](backend/adr/0038-monorepo-tooling.md) |
| AO-2 | ~~Expo vs bare~~ → **Accepted: bare RN only; Expo forbidden** — [ADR-0006](backend/adr/0006-bare-react-native-no-expo.md) |
| AO-3 | Separate worker process (deferred until need); queue product = BullMQ when promoted — [ADR-0007](backend/adr/0007-bullmq-over-rabbitmq.md) — **non-blocking** (Stage A outbox) |
| AO-4 | Formal multi-AZ / contractual SLOs — eng targets in [05-quality-nfr](05-quality-nfr.md) are **implementable defaults**; region → AO-10 |
| AO-5 | ~~Domain modules~~ → **Accepted for v1:** names in [04-domain-modules](backend/04-domain-modules.md) |
| AO-6 | ~~Error envelope, pagination, OpenAPI~~ → **Accepted** — [ADR-0027](backend/adr/0027-api-contracts-baseline.md) |
| AO-7 | ~~Tooling / packages~~ → **Accepted:** pnpm + Turborepo + `api-contracts` / `shared-utils` / `design-tokens` — [ADR-0038](backend/adr/0038-monorepo-tooling.md) |
| AO-8 | ~~Validation library~~ → **Accepted Zod 4** — [ADR-0027](backend/adr/0027-api-contracts-baseline.md); response runtime validation optional |
| AO-9 | ~~Mobile release tooling~~ → **Accepted: Fastlane** — [ADR-0030](backend/adr/0030-fastlane-mobile-release.md) |
| AO-10 | Cloud vendor brand (AWS/GCP/…) — **only remaining open**; **does not block** coding — Compose + PM2 + NGINX ([07-environments](07-environments-and-ops.md) · [agents/10](agents/10-production-ready.md)) |
| AO-11 | ~~Manager product role~~ → **Accepted:** first-class AuthZ role + manager tabs — [ADR-0011](backend/adr/0011-auth-rbac.md) |
| AO-12 | ~~Client support window~~ → **Accepted:** last **2** native releases; `X-API-Deprecated` on sunset |
| AO-13 | ~~Retention TODOs~~ → **Locked retention matrix** in [17](backend/17-privacy-kvkk-gdpr.md) + legal audit **7y** ([ADR-0037](backend/adr/0037-legal-audit-logger.md)) |

**Production coding:** docs are ready — [agents/10-production-ready.md](agents/10-production-ready.md).

## Clarification order

1. Coding starts from locked ADRs + [agents/10](agents/10-production-ready.md) — do not re-open stack.  
2. Only ask humans for sandbox/prod secrets or AO-10 cloud vendor brand.  

## Coding closures & ADR index

Delivery plan: [`02-product-roadmap.md`](02-product-roadmap.md)  
Technology radar: [`03-tech-radar-2026.md`](03-tech-radar-2026.md)  
**Canonical ADR registry:** [`backend/adr/README.md`](backend/adr/README.md) (**0001–0038**) · mirrored in [`04` §18](04-application-architecture.md)

| Topic | Status |
| --- | --- |
| AO-1 / AO-5 / AO-7 / AO-11 / AO-12 / AO-13 | **Locked** — see open table above |
| AO-2 / AO-6 / AO-8 | **Locked** — ADR-0006 / ADR-0027 |
| AO-3 | Stage A outbox until load evidence (non-blocking) |
| AO-4 | Eng SLO defaults in [05-quality-nfr](05-quality-nfr.md); contractual multi-AZ later |
| AO-10 | Cloud vendor brand only — **non-blocking** |
| ADR-0001…0002 | Nest modular monolith · Postgres SoR |
| ADR-0003 | Prisma latest stable on PG 18 |
| ADR-0004…0009 | REST · monorepo · bare RN · BullMQ · managed Redis · no client gRPC |
| ADR-0010…0013 | Privacy · Auth/RBAC · SSE · FCM |
| ADR-0014…0026 | Admin/mobile UI · colors · security · UX · a11y · i18n · routing · principles |
| ADR-0027…0029 | API contracts · latest stable · dual-platform |
| ADR-0030…0033 | Fastlane · PM2 · NGINX · marketing |
| ADR-0034…0037 | Admin CASE-* · DevOps · MCP · legal audit CSV/PDF |
| ADR-0038 | pnpm + Turborepo + locked packages |
| ADR-0039 | DESIGN.md visual SoR (Stitch / awesome-design-md) |
| Docs readiness | [agents/10-production-ready.md](agents/10-production-ready.md) |

## Related

- **Application architecture:** [`04-application-architecture.md`](04-application-architecture.md)  
- **Client security (Web + Mobile):** [`backend/21-client-security.md`](backend/21-client-security.md)  
- **Screen UX & layout:** [`shared/03-screen-ux-layout.md`](shared/03-screen-ux-layout.md)  
- **Wizard state:** [`shared/04-wizard-state.md`](shared/04-wizard-state.md)  
- **Push UX:** [`shared/05-push-notifications-ux.md`](shared/05-push-notifications-ux.md)  
- **Accessibility (WCAG):** [`shared/06-accessibility-wcag.md`](shared/06-accessibility-wcag.md)  
- **i18n:** [`shared/07-i18n.md`](shared/07-i18n.md)
- **Routing:** [`shared/08-routing.md`](shared/08-routing.md)
- **UI principles:** [`shared/09-modern-ui-principles.md`](shared/09-modern-ui-principles.md)
- **UX principles:** [`shared/10-modern-ux-principles.md`](shared/10-modern-ux-principles.md)  
- **Glossary:** [`shared/11-glossary.md`](shared/11-glossary.md)  
- **API contracts:** [`shared/12-api-contracts.md`](shared/12-api-contracts.md)  
- **Doc index:** [`DOC-INDEX.md`](DOC-INDEX.md)  
- **Doc cohesion:** [`DOC-COHESION.md`](DOC-COHESION.md)  
- **AI agents:** [`AGENTS.md`](AGENTS.md) · [`agents/02-defaults-and-non-asks.md`](agents/02-defaults-and-non-asks.md) · [`agents/07-anti-hallucination.md`](agents/07-anti-hallucination.md) · [`agents/08-no-mocks-fully-functional.md`](agents/08-no-mocks-fully-functional.md) · [`agents/09-latest-stack-policy.md`](agents/09-latest-stack-policy.md)  
- **NFRs:** [`05-quality-nfr.md`](05-quality-nfr.md)  
- **Testing:** [`06-testing-strategy.md`](06-testing-strategy.md)  
- **Environments / ops:** [`07-environments-and-ops.md`](07-environments-and-ops.md)  
- **Color system:** [`shared/01-color-system.md`](shared/01-color-system.md)  
- **UI components (case-driven):** [`shared/02-ui-components.md`](shared/02-ui-components.md)  
- **UI coverage mandate (248 cases):** [`cases/03-ui-coverage-mandate.md`](cases/03-ui-coverage-mandate.md)  
- **Mobile UI (NativeWind):** [`mobile/04-nativewind-ui.md`](mobile/04-nativewind-ui.md)  
- **Mobile UI (WWDC Liquid Glass):** [`mobile/05-wwdc-liquid-glass.md`](mobile/05-wwdc-liquid-glass.md)  
- **iOS + Android platforms:** [`mobile/06-ios-android-platforms.md`](mobile/06-ios-android-platforms.md)  
- **Fastlane (mobile release):** [`mobile/07-fastlane.md`](mobile/07-fastlane.md)  
- **PM2 (web process manager):** [`web/05-pm2.md`](web/05-pm2.md)  
- **NGINX (web edge):** [`web/06-nginx.md`](web/06-nginx.md)  
- **Marketing site:** [`web/07-marketing.md`](web/07-marketing.md)  
- **Admin × cases:** [`web/08-admin-case-coverage.md`](web/08-admin-case-coverage.md)  
- **Admin DevOps:** [`web/09-admin-devops.md`](web/09-admin-devops.md)  
- **Admin DevOps MCP:** [`web/10-devops-mcp.md`](web/10-devops-mcp.md)  
- **Legal audit reports:** [`web/11-legal-audit-reports.md`](web/11-legal-audit-reports.md)  
- **Legal audit logger:** [`backend/22-legal-audit-logger.md`](backend/22-legal-audit-logger.md)  
- **Production-ready gate:** [`agents/10-production-ready.md`](agents/10-production-ready.md)  
- **Monorepo tooling:** [ADR-0038](backend/adr/0038-monorepo-tooling.md)  
- **DESIGN.md:** [`DESIGN.md`](DESIGN.md) · [ADR-0039](backend/adr/0039-design-md.md)  
- **Web UI (shadcn dark):** [`web/04-shadcn-dark-ui.md`](web/04-shadcn-dark-ui.md)  
- **FCM:** [`backend/20-fcm-messaging.md`](backend/20-fcm-messaging.md)  
- **Auth & RBAC:** [`backend/18-auth-rbac.md`](backend/18-auth-rbac.md)  
- **Privacy (KVKK/GDPR):** [`backend/17-privacy-kvkk-gdpr.md`](backend/17-privacy-kvkk-gdpr.md)  
- Product & runtime: [`00-product-and-stack.md`](00-product-and-stack.md)  
- Backend ADRs: [`backend/adr/`](backend/adr/)  
- REST notes: [`backend/06-api-conventions.md`](backend/06-api-conventions.md)  
- Shared packages: [`shared/`](shared/)  
