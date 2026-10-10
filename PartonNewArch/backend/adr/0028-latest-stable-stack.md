# ADR-0028: Latest stable technology within locked boundaries

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Eng / Architecture  
**Related:** [ADR-0001](0001-nestjs-modular-monolith.md) · [ADR-0006](0006-bare-react-native-no-expo.md) · [03-tech-radar](../../03-tech-radar-2026.md) · [agents/09-latest-stack-policy.md](../../agents/09-latest-stack-policy.md)

## Context

PartOn locks *categories* of technology (Nest modular monolith, bare RN, Postgres, REST, Zod contracts) but must not fossilize on outdated majors. As of late 2026, NestJS **12** is the current stable line (ESM, Standard Schema, TS 6), React Native continues to ship new stables, and Zod 4 is current. Agents and humans need a clear rule: **use the newest stable release that still respects Hold fences**.

## Decision

1. For every **Adopt** stack choice, use the **latest stable** release at scaffold and keep current via automated dependency updates.  
2. **Verify versions** from npm/registry or official docs (ctx7) at install time — do not copy stale minors from memory or old markdown floors.  
3. Promote new **stable majors** of Adopt technologies (e.g. Nest 11 → 12) when vendor docs mark them stable and they remain inside ADR fences.  
4. **Hold** items stay forbidden even if “latest” (Expo, GraphQL-to-clients, RabbitMQ day-1, Next admin, etc.).  
5. Runtime floor follows the newest Adopt framework (Nest 12 → Node ≥ 20.19 / ≥ 22.12; prefer current Node LTS).  
6. Detail for agents: [`agents/09-latest-stack-policy.md`](../../agents/09-latest-stack-policy.md).

## Consequences

### Positive

- Greenfield code matches current ecosystem and security patches  
- Standard Schema / Nest 12 / TS 6 alignment with Zod contracts  
- Clear anti-pattern: inventing versions or staying on dead majors  

### Negative / tradeoffs

- Occasional migration cost when majors land mid-delivery  
- Docs version tables are **floors/hints**; `package.json` is authoritative  

### Follow-ups

- Enable Renovate/Dependabot on monorepo  
- Re-run `nest upgrade` / RN upgrade guides when majors appear  
- Update radar snapshot when Adopt majors change  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Freeze Nest 11 / RN 0.76 for “stability” | **Reject** — conflicts with latest-stable mandate |
| Always use `@next` / canary | **Reject** — alphas not default |
| Latest of everything including Expo | **Reject** — violates ADR-0006 |
