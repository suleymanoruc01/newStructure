# PartOn — local development (no Docker)

Runtime follows [PartonNewArch/web/05-pm2.md](../PartonNewArch/web/05-pm2.md): **Nest** for the API, **PM2** for staging/production parity, **NGINX** at the edge in deployed envs. This repo does **not** ship Docker Compose.

**Monorepo:** [ADR-0040](../PartonNewArch/backend/adr/0040-bun-monorepo-exclude-mobile.md) — **Bun** at the root; **`apps/mobile` uses npm + Fastlane** (not Bun).

## Prerequisites

| Dependency | Purpose |
| --- | --- |
| [Bun](https://bun.sh) **1.4.3+** | Root workspace installs and scripts. `package.json` `packageManager` is `bun@1.4.3` because `bun.lock` is lockfileVersion 2 |
| Node.js | Nest/PM2 production runtime; Metro when working on mobile |
| npm | `apps/mobile` only |
| PostgreSQL 18+ | System of record — **host install or managed instance** |
| Redis | Optional until BullMQ Stage B |
| S3-compatible storage | Documents (e.g. managed object storage or local MinIO **installed on the host**, not via Compose in this repo) |
| PM2 | `bunx pm2` from `apps/backend` or root `bun run pm2:start` |
| Ruby + Bundler | Fastlane in `apps/mobile` ([mobile/07](../PartonNewArch/mobile/07-fastlane.md)) |

## Environment

```bash
cp .env.example .env
# Edit DATABASE_URL and sandbox SMS/FCM credentials (Nest fails boot if required keys are missing).
```

`DATABASE_URL` examples:

- Local Postgres: `postgresql://parton:parton@localhost:5432/parton?schema=public`
- Managed: connection string from your provider (AO-10)

## Commands (Bun workspace)

```bash
bun run setup                  # scripts/install.sh — Bun workspace, api-contracts build, mobile npm ci, iOS pods on macOS
bun run db:migrate
bun run dev                    # turbo: backend watch + frontends (when wired)
```

### API only (watch mode)

```bash
bun run --filter '@parton/backend' start:dev
```

Health (once implemented): `GET http://localhost:3000/api/v1/health/ready`

### PM2 (staging / prod parity)

```bash
bun run pm2:start
cd apps/backend && bunx pm2 logs parton-api
```

Deploy path: build admin → build Nest → migrate → `bun run pm2:reload` ([web/05-pm2.md](../PartonNewArch/web/05-pm2.md)).

## Frontends

| App | Dev |
| --- | --- |
| Admin | `bun run --filter '@parton/admin' dev` (proxies API — `VITE_API_PROXY_TARGET`) |
| Marketing | `bun run --filter '@parton/marketing' dev` |
| Mobile | After `bun run setup`: `cd apps/mobile && npm start`, then `npm run ios` or `npm run android` (npm + Fastlane; **no Bun**) |

Store builds: Fastlane lanes under `apps/mobile/fastlane/`.
