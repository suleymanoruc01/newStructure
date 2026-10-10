# PartonNewArch — Documentation index

**Status:** `accepted` (navigation)  
**Last updated:** 2026-10-10  
**Canonical architecture:** [`04-application-architecture.md`](04-application-architecture.md)  
**Cohesion rules:** [`DOC-COHESION.md`](DOC-COHESION.md) — hubs/spokes, sync checklist, status vocabulary  
**Coding readiness:** [`agents/10-production-ready.md`](agents/10-production-ready.md)

Master map of living architecture docs. Prefer this file when onboarding or locating a concern. When editing docs, follow DOC-COHESION so links and statuses stay coherent. ADR registry must stay **0001–0039** in sync with disk, [`backend/adr/README`](backend/adr/README.md), and [`04` §18](04-application-architecture.md).

---

## 1. Read paths by role

| Role | Path |
| --- | --- |
| **AI coding agent** | **[AGENTS.md](AGENTS.md)** → **[DESIGN.md](DESIGN.md)** → [10 production-ready](agents/10-production-ready.md) → [07 grounding](agents/07-anti-hallucination.md) → [08 no-mocks](agents/08-no-mocks-fully-functional.md) → [09 latest stack](agents/09-latest-stack-policy.md) → playbook → [defaults](agents/02-defaults-and-non-asks.md) |
| **Design / UI** | **[DESIGN.md](DESIGN.md)** → [01 colors](shared/01-color-system.md) → [09 UI](shared/09-modern-ui-principles.md) → [10 UX](shared/10-modern-ux-principles.md) → [03 layouts](shared/03-screen-ux-layout.md) |
| **New engineer** | [README](README.md) → [04 architecture](04-application-architecture.md) §0–§5 → [01 decisions](01-architecture-decisions.md) → [glossary](shared/11-glossary.md) → your surface (mobile / backend / web) |
| **Backend** | [backend/README](backend/README.md) → [04 domain modules](backend/04-domain-modules.md) → [18 auth](backend/18-auth-rbac.md) → [06 API](backend/06-api-conventions.md) + [12 contracts](shared/12-api-contracts.md) → [cases](cases/) |
| **Mobile** | [mobile/README](mobile/README.md) → [06 iOS+Android](mobile/06-ios-android-platforms.md) → [07 Fastlane](mobile/07-fastlane.md) → [IA](mobile/01-information-architecture.md) → [routing](shared/08-routing.md) → screen catalogs |
| **Web / admin** | [web/README](web/README.md) → [08 admin×cases](web/08-admin-case-coverage.md) → [09 DevOps](web/09-admin-devops.md) → [10 DevOps MCP](web/10-devops-mcp.md) → [11 legal audit](web/11-legal-audit-reports.md) → [04 shadcn](web/04-shadcn-dark-ui.md) → screens |
| **Product / QA** | [02 roadmap](02-product-roadmap.md) → [cases/README](cases/README.md) → [coverage matrix](cases/00-coverage-matrix.md) → [gap backlog](cases/01-gap-backlog.md) |
| **Security / privacy** | [21 client security](backend/21-client-security.md) · [18 auth](backend/18-auth-rbac.md) · [17 privacy](backend/17-privacy-kvkk-gdpr.md) · [CASE-SECURITY](cases/groups/CASE-SECURITY.md) |
| **Design** | **[DESIGN.md](DESIGN.md)** · [01 colors](shared/01-color-system.md) · [09 UI](shared/09-modern-ui-principles.md) · [10 UX](shared/10-modern-ux-principles.md) · [03 layouts](shared/03-screen-ux-layout.md) · [02 components](shared/02-ui-components.md) |

---

## 2. Root docs

| Doc | Purpose | Status |
| --- | --- | --- |
| [README.md](README.md) | Entry + snapshot | living |
| [00-product-and-stack.md](00-product-and-stack.md) | Product context + stack sketch | accepted |
| [01-architecture-decisions.md](01-architecture-decisions.md) | Locked vs open | accepted |
| [02-product-roadmap.md](02-product-roadmap.md) | P0–P4 delivery | proposed |
| [03-tech-radar-2026.md](03-tech-radar-2026.md) | Adopt / trial / hold | accepted process |
| [04-application-architecture.md](04-application-architecture.md) | **Canonical** C4 + integration | accepted |
| [05-quality-nfr.md](05-quality-nfr.md) | NFRs / proposed SLOs / capacity | proposed |
| [06-testing-strategy.md](06-testing-strategy.md) | Case-driven test pyramid | accepted |
| [07-environments-and-ops.md](07-environments-and-ops.md) | Envs, deploy, health, ops | accepted (AO-10 vendor brand open) |
| [AGENTS.md](AGENTS.md) | **AI agent entrypoint** | accepted |
| [agents/10-production-ready.md](agents/10-production-ready.md) | **Full-stack production coding gate** | accepted |
| [DESIGN.md](DESIGN.md) | **Visual SoR** (Stitch / awesome-design-md) | accepted · ADR-0039 |
| [CLAUDE.md](CLAUDE.md) | Claude Code pointer | accepted |
| [agents/](agents/) | Playbook, defaults, scaffold, conventions, slices, grounding, no-mocks, latest-stack, **production-ready** (00–10) | accepted |
| [DOC-COHESION.md](DOC-COHESION.md) | Hub/spoke wiring & edit sync rules | accepted |
| **This file** | Doc index | accepted |

---

## 3. By concern

| Concern | Primary docs |
| --- | --- |
| Modular monolith / modules | [backend/03](backend/03-modular-monolith.md) · [backend/04](backend/04-domain-modules.md) · ADR-0001 |
| Data / Postgres | [backend/05](backend/05-data-layer.md) · ADR-0002/0003 |
| REST + contracts | [backend/06](backend/06-api-conventions.md) · [shared/12](shared/12-api-contracts.md) · ADR-0004/0027 |
| AuthN / AuthZ | [backend/18](backend/18-auth-rbac.md) · ADR-0011 |
| Async / queues | [backend/08](backend/08-async-events.md) · [14](backend/14-bullmq-vs-rabbitmq.md) · ADR-0007/0008 |
| Push / SSE | [backend/20](backend/20-fcm-messaging.md) · [19](backend/19-sse.md) · [shared/05](shared/05-push-notifications-ux.md) |
| Tokens / matching / geo | [backend/11](backend/11-tokens-and-provision.md) · [12](backend/12-matching-rules.md) · [13](backend/13-location-policy.md) |
| Privacy | [backend/17](backend/17-privacy-kvkk-gdpr.md) · ADR-0010 |
| Client security | [backend/21](backend/21-client-security.md) · ADR-0018 |
| Mobile UI | [mobile/04](mobile/04-nativewind-ui.md) · [mobile/05](mobile/05-wwdc-liquid-glass.md) · [mobile/08 Stitch](mobile/08-stitch-mobile-ui.md) |
| Stitch (all channels) | [shared/13](shared/13-stitch-projects.md) · [web/12](web/12-stitch-web-admin-ui.md) · Mobile/Web/Admin projects |
| iOS + Android (latest) | [mobile/06](mobile/06-ios-android-platforms.md) · ADR-0029 |
| Fastlane (store release) | [mobile/07](mobile/07-fastlane.md) · ADR-0030 |
| PM2 (Nest web) | [web/05](web/05-pm2.md) · ADR-0031 |
| NGINX (edge) | [web/06](web/06-nginx.md) · ADR-0032 |
| Marketing site | [web/07](web/07-marketing.md) · ADR-0033 |
| Admin × all cases | [web/08](web/08-admin-case-coverage.md) · ADR-0034 |
| Admin DevOps | [web/09](web/09-admin-devops.md) · ADR-0035 · [09-observability](backend/09-observability.md) |
| Admin DevOps MCP | [web/10](web/10-devops-mcp.md) · ADR-0036 |
| Legal audit logger | [backend/22](backend/22-legal-audit-logger.md) · [web/11](web/11-legal-audit-reports.md) · ADR-0037 |
| Monorepo tooling | [ADR-0038](backend/adr/0038-monorepo-tooling.md) · [agents/10](agents/10-production-ready.md) |
| Web UI | [web/04](web/04-shadcn-dark-ui.md) |
| UX / UI principles | [shared/09](shared/09-modern-ui-principles.md) · [shared/10](shared/10-modern-ux-principles.md) |
| Routing / deep links | [shared/08](shared/08-routing.md) · [mobile/03](mobile/03-flows-and-deep-links.md) |
| i18n / a11y | [shared/07](shared/07-i18n.md) · [shared/06](shared/06-accessibility-wcag.md) |
| Acceptance (248 cases) | [cases/](cases/) · [UI mandate](cases/03-ui-coverage-mandate.md) |
| Glossary | [shared/11-glossary.md](shared/11-glossary.md) |
| API contracts | [shared/12](shared/12-api-contracts.md) · ADR-0027 |
| AI agents / grounding | [AGENTS.md](AGENTS.md) · [10 production-ready](agents/10-production-ready.md) · [07](agents/07-anti-hallucination.md) · [08](agents/08-no-mocks-fully-functional.md) · [09](agents/09-latest-stack-policy.md) · [02](agents/02-defaults-and-non-asks.md) |
| Latest stable stack | [ADR-0028](backend/adr/0028-latest-stable-stack.md) · [radar](03-tech-radar-2026.md) · [agents/09](agents/09-latest-stack-policy.md) |
| Testing / NFRs / ops | [06-testing](06-testing-strategy.md) · [05-nfr](05-quality-nfr.md) · [07-ops](07-environments-and-ops.md) |
| Doc cohesion | [DOC-COHESION.md](DOC-COHESION.md) |
| ADRs | [backend/adr/](backend/adr/) |

---

## 4. Folder tree

```text
PartonNewArch/
├── AGENTS.md / CLAUDE.md        ← AI agent entry
├── agents/                      ← autonomous implementation pack
├── DOC-INDEX.md · DOC-COHESION.md
├── README.md … 07-*.md          ← product / arch / quality / test / ops
├── cases/                       ← 248-case acceptance
├── backend/                     ← Nest deep dives + adr/
├── mobile/                      ← RN IA, catalogs, UI
├── web/                         ← admin (+ future employer) IA
└── shared/                      ← contracts, design, UX/UI cross-cuts
```

Legacy reference (not architecture SoR): [`../parton-codebase-wiki/`](../parton-codebase-wiki/).  
Case JSON SoR: [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json).

---

## 5. Status truth (avoid contradictions)

| Topic | Truth | Do not say |
| --- | --- | --- |
| API envelope / Zod | **Accepted** ADR-0027 | “AO-6/AO-8 still open” |
| Packages / tooling | **pnpm + Turborepo**; `api-contracts` / `shared-utils` / `design-tokens` — ADR-0038 | “AO-7 proposed” |
| Prisma ORM | **Accepted** ADR-0003 | “Prisma proposed / pending confirm” |
| Domain modules | **Final for v1** — [04-domain-modules](backend/04-domain-modules.md) | “names provisional” |
| `api-contracts` package name | **Locked** | “name TBD” |
| Expo | **Banned** ADR-0006 | “consider Expo for speed” |
| Open product forks | Human `open`; agents use [02-defaults](agents/02-defaults-and-non-asks.md) | Ask user mid-build |
| Mocks / Noop providers | **Banned** — [agents/08](agents/08-no-mocks-fully-functional.md) | ConsoleSms / NoopFcm “to unblock” |
| Library versions | **Latest stable** inside ADR fences — ADR-0028 | Stale Nest 11 / invented pins |
| Mobile platforms | **iOS + Android** latest OS ready — ADR-0029 | iOS-only MVP / one CI lane |
| Mobile release | **Fastlane** — ADR-0030 | EAS / Expo Application Services |
| Web process manager | **PM2** — ADR-0031 | forever / nodemon-in-prod |
| Web edge proxy | **NGINX** — ADR-0032 | Caddy/Apache primary; Nest `:443` |
| Marketing site | **`apps/marketing` production** — ADR-0033 | MVP stub; deferred pricing/SEO; CSR-only; Nest hot path |
| Web admin coverage | **Every CASE-*** — ADR-0034 · [web/08](web/08-admin-case-coverage.md) | Abuse-only admin; missing domain ops screens |
| Admin DevOps | **In-app** errors + releases — ADR-0035 | External Sentry-only; no error triage in admin |
| Admin DevOps MCP | **Required** agent facade — ADR-0036 | Unauthenticated MCP; shell/git tools |
| Legal audit | Append-only + admin **CSV/PDF** — ADR-0037 | DevOps errors as legal log; CSV-only |
| Production coding | Docs ready — [agents/10](agents/10-production-ready.md) | Waiting on AO-5/7/Prisma “proposed” |
| Visual UI | **DESIGN.md** + ADR-0017 tokens — ADR-0039 | Drop-in foreign brand DESIGN.md; purple-glow AI UI |
| SLOs | **Proposed** in [05-nfr](05-quality-nfr.md) | Contractual guarantees |

Full edit sync rules: [`DOC-COHESION.md`](DOC-COHESION.md).

---

## 6. Completeness checklist (docs)

| Area | Complete when… |
| --- | --- |
| Decision | ADR + locked row in [01](01-architecture-decisions.md) + radar ring |
| Domain rule | Module in [04](backend/04-domain-modules.md) + deep-dive if complex |
| API | Route in domain map + schema in contracts + error codes |
| UI | Screen ID + components + recipe + CASE link ([mandate](cases/03-ui-coverage-mandate.md)) |
| Notify | Template in [shared/05](shared/05-push-notifications-ux.md) §0 |
| Privacy | Field classified; retention noted if PII |
| Test | Case IDs in [06-testing-strategy](06-testing-strategy.md) layers |

---

## Related

- Cohesion model: [`DOC-COHESION.md`](DOC-COHESION.md)  
- Gap backlog (product forks): [`cases/01-gap-backlog.md`](cases/01-gap-backlog.md)  
- ADR index: [`backend/adr/README.md`](backend/adr/README.md)  
- Agents: [`AGENTS.md`](AGENTS.md) · [`agents/`](agents/)  
