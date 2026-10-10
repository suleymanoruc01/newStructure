# ADR-0038: Monorepo tooling — pnpm + Turborepo + locked packages

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Eng  
**Related:** [ADR-0005](0005-monorepo.md) · [ADR-0027](0027-api-contracts-baseline.md) · [ADR-0028](0028-latest-stable-stack.md) · [agents/03-scaffold-spec.md](../../agents/03-scaffold-spec.md) · [agents/10-production-ready.md](../../agents/10-production-ready.md)

## Context

AO-7 left package layout and monorepo tooling as “proposed,” which blocked treating the scaffold as production-coding ready. Agents already defaulted to pnpm + Turborepo and three packages; the fence must be **accepted**.

## Decision

1. **pnpm** workspaces + **Turborepo** at repo root.  
2. Locked packages: `api-contracts`, `shared-utils`, `design-tokens`.  
3. Apps: `backend`, `admin`, `marketing`, `mobile`, `devops-mcp` per scaffold.  
4. CI path-filtered jobs per AO-1 (accepted with this ADR + agents/02).  
5. No Nx / Yarn / npm-workspaces as primary.

## Consequences

### Positive

- Agents scaffold without asking  
- Consistent task graph (`turbo run build/test/lint`)  

### Negative / tradeoffs

- Team must install pnpm  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Nx | Reject as primary — heavier; supersede only via ADR |
| Yarn Berry | Reject |
| Flat multi-repo | Reject — ADR-0005 monorepo |
