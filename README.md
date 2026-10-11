# PartOn monorepo

Architecture and acceptance specs: [`PartonNewArch/`](PartonNewArch/).

**Tooling:** **Bun** + Turborepo at the root; **`apps/mobile`** uses **npm** and **Fastlane** ([ADR-0040](PartonNewArch/backend/adr/0040-bun-monorepo-exclude-mobile.md)).

**Local development (no Docker):** [`docs/DEV.md`](docs/DEV.md) — host/managed PostgreSQL, `nest start --watch` or **PM2** for API parity.

```bash
cp .env.example .env
bun run setup
bun run db:migrate
bun run --filter '@parton/backend' start:dev
```

`bun run setup` (`scripts/install.sh`) checks Bun against `packageManager` (`bun@1.4.3`, required for `bun.lock` lockfileVersion 2), installs the Bun workspace, builds `@parton/api-contracts`, then `npm ci` in `apps/mobile`. On macOS it runs `pod install` when CocoaPods is installed.

Mobile:

```bash
cd apps/mobile && npm start
npm run ios    # simulator; requires the setup script's pod install
```

## AI agents (Ponytail)

[Ponytail](https://github.com/DietrichGebert/ponytail) is vendored for minimal-diff, review-first coding. PartOn architecture rules still win over scope cuts.

- Guide: [`PartonNewArch/agents/11-ponytail-integration.md`](PartonNewArch/agents/11-ponytail-integration.md)
- Sync skills/rules after upgrading `vendor/ponytail`: `bun run ponytail:sync`
- Cursor: `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt` (see integration doc)
