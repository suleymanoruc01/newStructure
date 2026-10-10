# 03 — Scaffold specification

**Status:** `accepted`  
**Agents:** Create this tree at repo root (sibling of `PartonNewArch/` or monorepo root containing both).  
**Preferred root:** repository root `/` with `PartonNewArch/` docs + `apps/` + `packages/`.

---

## 1. Directory tree

```text
/
├── PartonNewArch/          # architecture (existing)
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/          # filters, interceptors, request-id
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── workers/
│   │   │       ├── employers/
│   │   │       ├── branches/
│   │   │       ├── jobs/
│   │   │       ├── tokens/
│   │   │       ├── applications/
│   │   │       ├── matching/
│   │   │       ├── shifts/
│   │   │       ├── location/
│   │   │       ├── ratings/
│   │   │       ├── favorites/
│   │   │       ├── notifications/
│   │   │       ├── policies/
│   │   │       ├── privacy/
│   │   │       ├── moderation/
│   │   │       ├── health/
│   │   │       ├── audit/       # legal audit logger + CSV/PDF — ADR-0037
│   │   │       ├── devops/      # error tracking + releases — ADR-0035
│   │   │       └── admin/       # static hosting glue
│   │   ├── test/
│   │   └── package.json
│   ├── admin/                   # Vite + React + shadcn
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/ui/
│   │   │   ├── features/
│   │   │   └── lib/
│   │   └── package.json
│   ├── marketing/               # Vite public marketing — ADR-0033
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── i18n/
│   │   └── package.json
│   ├── devops-mcp/              # Admin DevOps MCP — ADR-0036
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/
│   │   │   └── client.ts
│   │   └── package.json
│   └── mobile/                  # Bare RN — NO Expo
│       ├── ios/
│       ├── android/
│       ├── src/
│       │   ├── app/             # navigation roots
│       │   ├── features/
│       │   ├── shared/
│       │   ├── i18n/
│       │   └── api/
│       └── package.json
├── packages/
│   ├── api-contracts/
│   ├── shared-utils/
│   └── design-tokens/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
├── AGENTS.md                    # copy or symlink from PartonNewArch/AGENTS.md
└── CLAUDE.md
```

---

## 2. Toolchain versions (**latest stable** — ADR-0028)

**Policy:** [`09-latest-stack-policy.md`](09-latest-stack-policy.md). Resolve with `npm view` / ctx7 at scaffold — do not copy stale pins from memory.

| Tool | Version target |
| --- | --- |
| Node | Current LTS meeting Nest 12 floor (**≥ 20.19** / **≥ 22.12**; prefer **22/24 LTS**) |
| pnpm | **Latest** stable |
| NestJS | **12.x** latest (`@nestjs/core@latest`) |
| TypeScript | **6.x** latest (Nest 12) |
| Prisma | **Latest** stable + `@prisma/adapter-pg` |
| PostgreSQL | **18** or newer stable |
| React Native | **Latest** stable bare (no Expo) |
| React (admin) | **Latest** stable compatible with Vite + shadcn |
| Vite | **Latest** stable |
| Zod | **4.x** latest |
| NativeWind | **Latest** stable v4+ |
| React Navigation | **Latest** stable compatible with that RN |
| Turborepo | **Latest** stable |

If a version conflicts at install time: pick **newest** compatible set **without** introducing Expo/Next admin/Hold tech.

---

## 3. Workspace files (minimal)

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "db:migrate": "pnpm --filter @parton/backend exec prisma migrate dev",
    "db:seed": "pnpm --filter @parton/backend exec prisma db seed"
  }
}
```

### `turbo.json`

Pipeline: `build` depends on `^build`; `test` depends on `build` for contracts; path-filter friendly.

---

## 4. Backend bootstrap checklist

- [ ] Global prefix `api/v1`  
- [ ] ValidationPipe + Zod (nestjs-zod)  
- [ ] Exception filter → error envelope  
- [ ] `X-Request-Id` middleware  
- [ ] PrismaService global  
- [ ] HealthModule live/ready  
- [ ] Serve `apps/admin/dist` at `/admin` (or dedicated host config)  
- [ ] Swagger at `/api/docs` (non-prod or protected)  
- [ ] **PM2:** `ecosystem.config.cjs` for Nest (`parton-api`, `instances: 1`) — [web/05](../web/05-pm2.md) · ADR-0031  
- [ ] **NGINX:** templates under `deploy/nginx/` (TLS + proxy + SSE buffering off) — [web/06](../web/06-nginx.md) · ADR-0032  
- [ ] **DevOps MCP:** `apps/devops-mcp` with authenticated tools — [web/10](../web/10-devops-mcp.md) · ADR-0036  
- [ ] **Legal audit:** Nest `audit` module + admin CSV/PDF screens — [backend/22](../backend/22-legal-audit-logger.md) · [web/11](../web/11-legal-audit-reports.md) · ADR-0037  

---

## 5. Mobile bootstrap checklist

- [ ] `npx @react-native-community/cli` init **or** equivalent bare template — **not** `create-expo-app`  
- [ ] **Latest stable** `react-native` (ADR-0028)  
- [ ] Record iOS deployment target + Android min/compile/target SDK in `PLATFORM.md` — [mobile/06](../mobile/06-ios-android-platforms.md) · ADR-0029  
- [ ] Latest stable Xcode + Android SDK Platform required by that RN  
- [ ] `run-ios` + `run-android` both succeed (latest simulator/emulator)  
- [ ] NativeWind configured  
- [ ] React Navigation native stack + tabs  
- [ ] react-native-screens / safe-area / Keychain + Android secure storage  
- [ ] i18next + `tr-TR`  
- [ ] Deep links: Universal Links + App Links + `parton://`  
- [ ] Edge-to-edge / Liquid Glass chrome per platform docs  
- [ ] **Fastlane:** `Gemfile` + `fastlane/` with `ios beta|release` and `android beta|release` — [mobile/07](../mobile/07-fastlane.md) · ADR-0030  
- [ ] No EAS / `eas.json`  

---

## 6. Admin bootstrap checklist

- [ ] Vite React TS  
- [ ] shadcn/ui dark default + PartOn CSS variables from design-tokens  
- [ ] React Router data APIs  
- [ ] API client with credentials for cookie refresh  

---

## 6b. Marketing bootstrap checklist (**production** — no MVP gaps)

- [ ] `apps/marketing` Vite React TS — [web/07](../web/07-marketing.md) · ADR-0033  
- [ ] Routes: `/`, `/pricing`, `/legal/privacy`, `/legal/terms` — **all** `w.public.*`  
- [ ] **Prerender/SSG** every public route (crawlable HTML)  
- [ ] `robots.txt` + `sitemap.xml` + per-route meta/OG  
- [ ] Real store + employer login URLs from env (ask once — never stub)  
- [ ] `tr-TR` i18n complete; design-tokens; brand-first hero (not admin dark shell)  
- [ ] NGINX www serves `dist` with asset cache headers — [web/06](../web/06-nginx.md)  
- [ ] No Next.js; no routes inside `apps/admin`; no deferred pricing/SEO  

---

## 7. Docker Compose

Services: `postgres:18`, **`minio`** (documents), optional `redis` (Stage B).  
Backend `DATABASE_URL` points at compose.  
**SMS + FCM:** real sandbox credentials in `.env` — Nest **fails boot** if missing ([08-no-mocks](08-no-mocks-fully-functional.md)).  
No production cloud required for S0–S8; sandbox projects **are** required for auth/notify slices.

---

## 8. Seed data

Staging/local seed must create:

- Admin user (phone)  
- Employer verified + branch + tokens balance  
- Worker complete profile  
- One open job  

So agents can click through Journey 1 without manual SQL.

---

## Related

- Domain modules: [`../backend/04-domain-modules.md`](../backend/04-domain-modules.md)  
- Modular monolith: [`../backend/03-modular-monolith.md`](../backend/03-modular-monolith.md)  
