# PartOn New Architecture — Development Notes

Living architecture and delivery notes for the **PartOn** rebuild: monorepo with **bare React Native** (latest stable, no Expo), **NestJS 12** modular monolith (REST API + admin), PostgreSQL, TypeScript **6** — **latest stable** libraries within ADR fences ([ADR-0028](backend/adr/0028-latest-stable-stack.md)).

## Start here

| Doc | Purpose |
| --- | --- |
| **[`AGENTS.md`](AGENTS.md)** | **AI agents (Cursor / Claude Code / Antigravity)** — build with minimal questions |
| [`agents/10-production-ready.md`](agents/10-production-ready.md) | **Docs ready for full-stack production coding** |
| **[`DESIGN.md`](DESIGN.md)** | **Visual SoR** for agents (Stitch / [awesome-design-md](https://github.com/voltagent/awesome-design-md)) · ADR-0039 |
| [`agents/`](agents/) | Playbook S0–S9, defaults, no-mocks, **latest-stack**, production gate, scaffold |
| **[`DOC-INDEX.md`](DOC-INDEX.md)** | **Full documentation map** — roles, concerns, completeness gates |
| [`DOC-COHESION.md`](DOC-COHESION.md) | How hubs/spokes stay coherent when editing |
| **[`04-application-architecture.md`](04-application-architecture.md)** | **Canonical application architecture** — C4, layers, clients, **Auth/RBAC**, **FCM**, **NativeWind + shadcn**, **KVKK/GDPR**, checklist |
| [`01-architecture-decisions.md`](01-architecture-decisions.md) | Locked vs open decisions |
| [`02-product-roadmap.md`](02-product-roadmap.md) | Phased delivery P0–P4 |
| [`03-tech-radar-2026.md`](03-tech-radar-2026.md) | Sep 2026 adopt / trial / hold |
| [`00-product-and-stack.md`](00-product-and-stack.md) | Product context + stack sketch |
| [`05-quality-nfr.md`](05-quality-nfr.md) | NFRs / proposed SLOs |
| [`06-testing-strategy.md`](06-testing-strategy.md) | Case-driven test pyramid |
| [`07-environments-and-ops.md`](07-environments-and-ops.md) | Envs, deploy, health |
| [`shared/11-glossary.md`](shared/11-glossary.md) | Domain & architecture glossary |
| [`shared/12-api-contracts.md`](shared/12-api-contracts.md) | REST envelope, errors, Zod (ADR-0027) |

**Acceptance spine:** all **248** cases in [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) → [`cases/`](cases/) — each feature needs **UI screens + components** ([mandate](cases/03-ui-coverage-mandate.md) · [components](shared/02-ui-components.md)).

Legacy Kotlin / Firebase is reference-only: [`../parton-codebase-wiki/`](../parton-codebase-wiki/).

## Architecture snapshot

| Layer | Choice | Notes |
| --- | --- | --- |
| Style | Nest **12** modular monolith (latest stable) | API + admin — ADR-0001 · ADR-0028 |
| Repo | Monorepo | `apps/mobile`, `apps/backend`, `packages/*` — ADR-0005 |
| Mobile | Bare React Native **iOS + Android** (latest OS); **Fastlane** release | **No Expo/EAS** — ADR-0006 · ADR-0029/0030 · [mobile/06](mobile/06-ios-android-platforms.md) · [mobile/07](mobile/07-fastlane.md) |
| Public API | REST `/api/v1` JSON | gRPC Hold — ADR-0004 / 0009 |
| Contracts | Shared Zod schemas | **Accepted** ADR-0027 · [shared/12](shared/12-api-contracts.md) |
| Data | PostgreSQL 18 SoR | Prisma latest stable — ADR-0002 / **0003 accepted** |
| Async A | PG outbox + in-process | Locked day-1 |
| Async B | BullMQ + managed Redis | Not RabbitMQ — ADR-0007 / 0008 |
| Observability | OpenTelemetry | Proposed P0 |
| Auth / RBAC | OTP + JWT; role + branch scope | ADR-0011 · [18](backend/18-auth-rbac.md) |
| Push | FCM HTTP v1 + inbox/outbox | ADR-0013 · [20](backend/20-fcm-messaging.md) |
| Push UX | User-centered templates, prefs, deep links | ADR-0021 · [shared/05](shared/05-push-notifications-ux.md) |
| Foreground live | SSE (not WebSocket) | ADR-0012 · [19](backend/19-sse.md) |
| Admin Web UI | Vite + shadcn/ui dark; **all CASE-*** ops + **DevOps** + **MCP** + **legal audit CSV/PDF** | ADR-0014/0031–0038 · [web/04](web/04-shadcn-dark-ui.md) · [web/08](web/08-admin-case-coverage.md) · [web/09](web/09-admin-devops.md) · [web/10](web/10-devops-mcp.md) · [web/11](web/11-legal-audit-reports.md) |
| Tooling | **pnpm** + **Turborepo** | ADR-0038 |
| Marketing | Vite `apps/marketing` **production** (landing, pricing, legal + prerender) | ADR-0033 · [web/07](web/07-marketing.md) |
| Mobile UI | NativeWind + Liquid Glass principles | ADR-0015/0016 · [mobile/04](mobile/04-nativewind-ui.md) · [mobile/05](mobile/05-wwdc-liquid-glass.md) |
| Color system | Cream / forest / orange tokens | ADR-0017 · [shared/01](shared/01-color-system.md) |
| Privacy | KVKK primary, GDPR-ready | ADR-0010 · [17](backend/17-privacy-kvkk-gdpr.md) |
| Client security | Memory access JWT; Keychain / HttpOnly refresh | ADR-0018 · [21](backend/21-client-security.md) |
| Screen UX | Layout recipes R1–R8; one primary CTA | ADR-0019 · [shared/03](shared/03-screen-ux-layout.md) |
| Wizard state | WizardShell + scoped store; Nest draft | ADR-0020 · [shared/04](shared/04-wizard-state.md) |
| Accessibility | WCAG 2.2 AA (web) + mobile equivalent | ADR-0022 · [shared/06](shared/06-accessibility-wcag.md) |
| i18n | Turkish (`tr-TR`) primary; EN secondary | ADR-0023 · [shared/07](shared/07-i18n.md) |
| Routing | React Navigation + React Router; fluid gates/deep links | ADR-0024 · [shared/08](shared/08-routing.md) |
| UI principles | September 2026 modern bar (P1–P12) | ADR-0025 · [shared/09](shared/09-modern-ui-principles.md) |
| UX principles | September 2026 experience bar (X1–X12) | ADR-0026 · [shared/10](shared/10-modern-ux-principles.md) |
| API contracts | `{data,meta}` / `{error,meta}`; Zod 4; cursor feeds | ADR-0027 · [shared/12](shared/12-api-contracts.md) |
| Versions | **Latest stable** inside ADR fences | ADR-0028 · [agents/09](agents/09-latest-stack-policy.md) |
| Market | Turkey first | Cloud region open (AO-10) |

Full diagrams and review checklist: [`04-application-architecture.md`](04-application-architecture.md).

## Document tree

```text
PartonNewArch/
├── AGENTS.md / CLAUDE.md            ← AI agent entry
├── agents/                          ← autonomous build pack
├── DOC-INDEX.md · DOC-COHESION.md   ← map + wiring rules
├── README.md
├── 00-product-and-stack.md … 07-*.md
├── cases/                           ← 248-case acceptance
├── backend/                         ← Nest deep dives + ADRs
├── mobile/                          ← RN screens
├── web/                             ← admin notes (Nest-hosted)
└── shared/                          ← contracts, design, UX/UI
```

## Target code layout (future monorepo)

```text
apps/
  mobile/                 # Bare RN + NativeWind — ADR-0015
  backend/                # NestJS — REST /api/v1 + serves admin static
  admin/                  # Vite React + shadcn/ui (dark) — ADR-0014
  marketing/              # Vite public landing + legal — ADR-0033
  devops-mcp/             # Admin DevOps MCP — ADR-0036
packages/
  api-contracts/          # Zod schemas + types — name locked (ADR-0027)
  shared-utils/           # platform-agnostic helpers — ADR-0038
  design-tokens/          # color tokens — ADR-0017 / 0038
```

## How to use

1. [`DOC-INDEX.md`](DOC-INDEX.md) — find the right doc  
2. [`04-application-architecture.md`](04-application-architecture.md) — system structure  
3. [`01-architecture-decisions.md`](01-architecture-decisions.md) — what is locked  
4. [`02-product-roadmap.md`](02-product-roadmap.md) — what to build when  
5. [`backend/`](backend/) — modules, REST, data, async, security  
6. [`shared/`](shared/) — contracts, design, UX/UI  
7. [`cases/`](cases/) — acceptance mapping  
8. [`06-testing-strategy.md`](06-testing-strategy.md) — how we prove cases  

## Backend deep-dive index

See [`backend/README.md`](backend/README.md) for backend docs/ADRs; Web UI: [`web/04-shadcn-dark-ui.md`](web/04-shadcn-dark-ui.md) (ADR-0014); Mobile UI: [`mobile/04-nativewind-ui.md`](mobile/04-nativewind-ui.md) + [`mobile/05-wwdc-liquid-glass.md`](mobile/05-wwdc-liquid-glass.md) (ADR-0015/0016).

## Status legend

| Status | Meaning |
| --- | --- |
| `accepted` | Implement against this |
| `proposed` | Strong default; confirm before treating as contractual (e.g. SLO numbers) — see [DOC-COHESION](DOC-COHESION.md) |
| `open` | Needs a decision |
| `legacy-ref` | Old app only |
| `covered` / `partial` / `gap` | Case ↔ arch mapping status |

## Catalog alignment snapshot

| Artifact | Count |
| --- | --- |
| Case groups documented | 19 |
| Cases in matrix | 248 |
| Mobile screens (catalog) | **75** — [mobile/02](mobile/02-screen-catalog.md) |
| Web screens (public+employer+admin) | **72** — [web/02](web/02-screen-catalog.md) |
| ADRs | **39** (0001–0039) — [backend/adr](backend/adr/README.md) |
| Backend deep-dives | `01`–`22` |

Cohesion: [`DOC-COHESION.md`](DOC-COHESION.md). Product forks (non-blocking): [`cases/01-gap-backlog.md`](cases/01-gap-backlog.md).
