# 04 — Coding conventions (agents)

**Status:** `accepted`  
**Stacks:** Nest · bare RN · Vite admin · Zod contracts

---

## Universal

| Rule | Detail |
| --- | --- |
| Grounding | [`07-anti-hallucination`](07-anti-hallucination.md) — no invented routes/screens/cases |
| No mocks | [`08-no-mocks`](08-no-mocks-fully-functional.md) — real providers; fail-fast env |
| Latest libs | [`09-latest-stack`](09-latest-stack-policy.md) — Nest 12 / TS 6 / `@latest` verified |
| Language | TypeScript strict |
| Imports | Top of file only — no inline imports |
| Exhaustive switch | `default` → `const _exhaustive: never = x` |
| IDs | UUID strings in API; DB `uuid` / `uuidv7` per data layer |
| Dates | ISO-8601 UTC in API; display `Europe/Istanbul` in UI |
| Comments | Only non-obvious intent; tag `// agent-default: gap-*` when applying defaults |
| Secrets | Never commit; never put in `packages/*` |
| Case tags | `@T-080` in test names; PR/commit body lists cases |

---

## `packages/api-contracts`

- Zod schemas + `z.infer` types + `ErrorCode` enum  
- No Nest/Prisma/RN imports  
- Export per domain folder: `auth`, `jobs`, …  
- Envelope helpers: `successMeta()`, typed error builders  

---

## Nest (`apps/backend`)

| Do | Don't |
| --- | --- |
| Thin controllers | Business rules in controllers |
| Services own transactions | Dual-write Redis without outbox |
| Guards: AuthN then AuthZ+scope | Trust client role claims alone |
| Prisma in repositories/services | Expose Prisma types to mobile |
| Outbox row in same TX as state change | Fire-and-forget FCM in request thread without outbox |
| Module `exports` for cross-module | Deep import other module internals |

Module folder shape: [03-modular-monolith](../backend/03-modular-monolith.md).

Error mapping: domain exception → HTTP + `error.code` from [12-api-contracts](../shared/12-api-contracts.md).

---

## Mobile (`apps/mobile`)

| Do | Don't |
| --- | --- |
| NativeWind `className` + tokens | Ad-hoc hex / StyleSheet-primary |
| React Navigation native stack + tabs | Expo Router |
| Access JWT in memory; refresh in Keychain | AsyncStorage for refresh |
| WizardShell / scoped store for wizards | Step-only `useState` for answers |
| Screen file maps to `m.*` id | Unnamed screens |
| i18n keys for all copy | Hardcoded Turkish/English strings |
| Glass on chrome only | Glass on job cards |

Layout recipes R1–R8 required on new screens.

---

## Admin (`apps/admin`)

| Do | Don't |
| --- | --- |
| shadcn primitives + PartOn tokens | Domain rules in React |
| React Router layouts + loaders | Next.js App Router |
| Dark default (admin) | Marketing landing chrome — use `apps/marketing` brand surface ([web/07](../web/07-marketing.md)) |
| Tables dense (R7) | Consumer card soup |

---

## Async & notify

1. Write inbox + outbox in DB transaction  
2. Drain outbox → **real** FCM HTTP v1 provider (boot fails if creds missing)  
3. Payload: `type` + ids only  
4. `dedupe_key` unique  
5. Template must exist in [shared/05](../shared/05-push-notifications-ux.md)  

---

## Testing

| Layer | Location |
| --- | --- |
| Domain unit | `*.spec.ts` beside service |
| API integration | `apps/backend/test/` |
| Contract | `packages/api-contracts` |
| UI | feature `__tests__` |

See [06-testing-strategy](../06-testing-strategy.md).

---

## Git / commits (when user asks to commit)

- Conventional commits: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`  
- Body: case IDs + screen IDs  
- Never commit `.env`  

---

## Related

- Client security: [`../backend/21-client-security.md`](../backend/21-client-security.md)  
- UI principles: [`../shared/09-modern-ui-principles.md`](../shared/09-modern-ui-principles.md)  
- UX principles: [`../shared/10-modern-ux-principles.md`](../shared/10-modern-ux-principles.md)  
