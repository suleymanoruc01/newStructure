# PartOn New Architecture — Development Notes

Living notes for the **PartOn** rebuild: monorepo with **React Native** (iOS/Android) and a **NestJS** modular monolith (REST API + admin), PostgreSQL, TypeScript.

**Architecture decisions (locked vs open):** [`01-architecture-decisions.md`](01-architecture-decisions.md)  
**Product roadmap:** [`02-product-roadmap.md`](02-product-roadmap.md)  
**Tech radar (Sep 2026):** [`03-tech-radar-2026.md`](03-tech-radar-2026.md)

**Acceptance spine:** all **248** cases in [`../parton_case_tests_tr.json`](../parton_case_tests_tr.json) are traced under [`cases/`](cases/). Feature depth follows the roadmap phases; case docs remain the acceptance map.

Legacy Kotlin / Firebase is reference-only: [`../parton-codebase-wiki/`](../parton-codebase-wiki/).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Repo | Monorepo | Locked — [ADR-0005](backend/adr/0005-monorepo.md) |
| Mobile | React Native bare (iOS + Android) | **Locked — no Expo** ([ADR-0006](backend/adr/0006-bare-react-native-no-expo.md)) |
| Backend | NestJS 11 modular monolith | REST `/api/v1` **+ admin** in same app |
| Public API | REST / JSON | Locked — [ADR-0004](backend/adr/0004-rest-json-api.md) |
| Contracts | Zod 4 shared schemas | **Proposed** — AO-8 |
| Shared packages | Schemas / TS types / helpers | No secrets, no DB |
| Database | PostgreSQL 18 + Prisma 7+ | PG locked; Prisma **proposed** |
| Monorepo tool | pnpm + Turborepo | **Proposed** — AO-7 |
| Workers | None at start | Separate worker deferred (P4) |
| Observability | OpenTelemetry | **Proposed** day-1 in P0 |
| Market / region | Turkey / cloud TBD | Region `open` |

## Document tree

```text
PartonNewArch/
├── README.md
├── 00-product-and-stack.md
├── 01-architecture-decisions.md   ← locked vs open decisions
├── 02-product-roadmap.md          ← phased delivery (P0–P4)
├── 03-tech-radar-2026.md          ← Sep 2026 adopt/trial/hold
├── cases/                         ← 248-case coverage (acceptance)
├── backend/                       ← Nest modular monolith notes
├── mobile/                        ← RN screens (provisional until feature scope)
├── web/                           ← admin/employer web notes (admin → Nest app)
└── shared/                        ← cross-cutting + package boundaries
```

## Target code layout (future monorepo)

```text
apps/
  mobile/                 # React Native
  backend/                # NestJS — REST /api/v1 + admin panel
packages/
  api-contracts/          # request/response schemas + derived types (name TBD)
  shared-utils/           # platform-agnostic helpers only (name TBD)
```

Exact package names / monorepo tool: `open` (AO-7).

## How to use

1. [`01-architecture-decisions.md`](01-architecture-decisions.md) — what is locked vs open  
2. [`02-product-roadmap.md`](02-product-roadmap.md) — what to build in which phase  
3. [`03-tech-radar-2026.md`](03-tech-radar-2026.md) — Sep 2026 technology defaults  
4. [`00-product-and-stack.md`](00-product-and-stack.md) — product + runtime sketch  
5. [`backend/`](backend/) — Nest modules, REST, data  
6. [`shared/`](shared/) — contract package rules  
7. [`cases/`](cases/) — acceptance mapping when implementing features  
8. [`mobile/`](mobile/) — screen inventory (provisional)  

## Status legend

| Status | Meaning |
| --- | --- |
| `accepted` | Implement against this |
| `proposed` | Strong default; confirm before coding |
| `open` | Needs a decision |
| `legacy-ref` | Old app only |
| `covered` / `partial` / `gap` | Case ↔ arch mapping status |

## Catalog alignment snapshot

| Artifact | Count |
| --- | --- |
| Case groups documented | 19 |
| Cases in matrix | 248 |
| Mobile screens (provisional) | 69 |
| Web / admin screens (provisional) | 45 |
| Backend rule deep-dives | Tokens, Matching, Location (+ domain modules) |

See [`cases/01-gap-backlog.md`](cases/01-gap-backlog.md) for remaining product forks.
