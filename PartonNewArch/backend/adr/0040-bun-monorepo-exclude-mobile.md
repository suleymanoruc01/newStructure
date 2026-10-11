# ADR-0040: Bun monorepo (exclude mobile) + Turborepo

**Status:** Accepted  
**Date:** 2026-10-11  
**Deciders:** Eng  
**Supersedes:** [ADR-0038](0038-monorepo-tooling.md) (package manager / install graph)  
**Related:** [ADR-0005](0005-monorepo.md) · [ADR-0028](0028-latest-stable-stack.md) · [ADR-0030](0030-fastlane-mobile-release.md) · [agents/03-scaffold-spec.md](../../agents/03-scaffold-spec.md) · [mobile/07-fastlane.md](../../mobile/07-fastlane.md)

## Context

Team chose **Bun** for JavaScript tooling across backend, web apps, and shared packages. React Native / Metro remain sensitive to package-manager choice; **Bun is not used under `apps/mobile`**. Mobile **store release** stays **Fastlane** (ADR-0030) — unchanged.

## Decision

1. **Bun** (latest stable) is the **primary** package manager and script runner at the **repo root** for:
   - `apps/backend`, `apps/admin`, `apps/marketing`, `apps/devops-mcp`
   - `packages/*` (`api-contracts`, `shared-utils`, `design-tokens`)
2. Root **`package.json` `workspaces`** lists those paths **explicitly** — **`apps/mobile` is not a Bun workspace member**.
3. **`apps/mobile`**: install and run JS tooling with **npm** only (`npm install` in `apps/mobile`). Link shared packages via **`file:../../packages/...`** (or equivalent npm-local paths). Do **not** run `bun install` or `bun run` inside `apps/mobile`.
4. **Turborepo** remains the task orchestrator (`turbo run build|test|lint|typecheck|dev`) for Bun workspace packages.
5. **Lockfile:** `bun.lock` at repo root for the Bun workspace; `apps/mobile/package-lock.json` for mobile when present.
6. **Mobile release:** **Fastlane** only — [mobile/07-fastlane.md](../../mobile/07-fastlane.md) · ADR-0030 (no EAS, no Bun-based mobile CI substitute).
7. **Production API runtime:** Nest still runs under **Node** via **PM2** (ADR-0031); Bun is for dev/build/install orchestration unless a future ADR adopts Bun as API runtime.

## Consequences

### Positive

- Faster installs and script execution for backend/web/packages  
- Single clear fence: Bun everywhere except mobile folder  
- Fastlane / RN toolchain unchanged  

### Negative / tradeoffs

- Two install graphs (root Bun + mobile npm)  
- Agents must not add `apps/mobile` to root workspaces  
- CI needs separate mobile job: `npm ci` in `apps/mobile` + Fastlane lanes  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| pnpm (ADR-0038) | Superseded for root workspace |
| Bun including `apps/mobile` | Reject — Metro/RN policy |
| Yarn Berry | Reject |
| EAS instead of Fastlane | Reject — ADR-0030 |
