# ADR-0026: Modern UX design principles (September 2026)

**Status:** Accepted  
**Date:** 2026-10-09  
**Deciders:** Product / Design / Eng  
**Related:** [ADR-0019](0019-screen-ux-layout.md) · [ADR-0020](0020-wizard-state.md) · [ADR-0021](0021-push-notifications-ux.md) · [ADR-0025](0025-modern-ui-principles.md) · [shared/10-modern-ux-principles.md](../../shared/10-modern-ux-principles.md)

## Context

ADR-0025 locked **UI** (look) for September 2026. PartOn still needed an era-dated **UX** bar—behavior, cognition, trust, time-to-value—aligned with CASE-UX (T-235–T-243), wizard continuity, permission honesty, and notification fatigue. Without it, teams optimize screens visually while shipping long onboarding, silent gates, or engagement spam.

## Decision

1. Adopt **[shared/10-modern-ux-principles.md](../../shared/10-modern-ux-principles.md)** as the **September 2026 UX** bar (principles X1–X12 + anti-patterns + flow quality checks).
2. UX principles **complement** UI principles (0025); layout recipes (0019), wizard state (0020), and push UX (0021) remain the implementation specs.
3. CASE-UX tests are the acceptance lens; map each T-id to primary X-principles in the doc.
4. Refresh the snapshot only via a new ADR.

## Consequences

### Positive

- Clear split: UI = look, UX = success over time
- Explicit ban on dark patterns, permission theater, notification spam
- Ties product cases to a dated experience bar

### Negative / tradeoffs

- Snapshot ages; conscious revision required
- Some “delight” motion/celebration constrained—intentional for marketplace trust

### Follow-ups

- Task-success metrics dashboard for T-235–T-243
- Agent/PR checklist enforcement alongside UI checklist

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Fold UX into ADR-0025 only | **Reject** — conflates look and behavior |
| Rely only on CASE-UX test list | **Reject** — tests without principles drift |
| Generic Nielsen heuristics dump | **Reject** — not PartOn / not 2026 marketplace context |
| Engagement-maximizing notify UX | **Reject** — conflicts with ADR-0021 |
