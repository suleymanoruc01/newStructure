# 00 — Agent operating manual

**Status:** `accepted`  
**For:** Cursor · Claude Code · Antigravity · Codex  
**Entrypoint:** [`../AGENTS.md`](../AGENTS.md)

---

## Mission

Turn `PartonNewArch/` + `parton_case_tests_tr.json` into a **running monorepo** (`apps/*`, `packages/*`) that passes case-tagged tests, with **zero unnecessary user interaction**.

---

## Session loop

```text
1. Identify current slice from 01-implementation-playbook / 05-slice-catalog
2. Production-ready check (10): no MVP stubs / eng TODOs; ship staging/prod path
3. Grounding pass (07-anti-hallucination): open CASE + module + screens; list T-### from files
4. No-mocks check (08): real providers/Compose; no Noop/Console/Fake
5. Load only the deep-dives listed for that slice (read files — do not recall)
6. Implement Nest → contracts → clients (fully functional paths)
7. Add tests with @T-### tags against real Postgres where rules live
8. Run lint/typecheck/tests (report only what ran)
9. Gates 07 §7 + 08 §8 + 10; mark slice done; start next slice
10. Ask user ONCE if sandbox SMS/FCM creds missing — never stub
```

Never end a turn with “Would you like me to continue?” when the playbook has a next slice — **continue**.  
Never invent endpoints/screens/cases — see [`07-anti-hallucination.md`](07-anti-hallucination.md).  
Never ship mocks — see [`08-no-mocks-fully-functional.md`](08-no-mocks-fully-functional.md).

---

## Context budget

| Do | Don't |
| --- | --- |
| Read AGENTS + defaults + current slice docs | Dump all 100+ markdown files |
| Grep case group for T-ids | Paste entire JSON into context |
| Open one screen catalog section | Rewrite architecture from memory against ADRs |
| Prefer editing existing scaffold | Re-scaffold Expo “for speed” |

---

## Decision authority

| Class | Agent action |
| --- | --- |
| ADR `accepted` | Implement exactly |
| Radar **Hold** | Do not introduce |
| Gap in [`02-defaults`](02-defaults-and-non-asks.md) | Use frozen default; note in code comment `// agent-default: gap-*` |
| True unknown (not in docs) | Choose simplest option consistent with Nest+RN+REST; document in PR body; **do not block** |
| Legal/counsel (AO-13 durations) | Use **locked** retention constants in [17](../backend/17-privacy-kvkk-gdpr.md) / [22](../backend/22-legal-audit-logger.md); **no TODOs** |

---

## Parallelism

| Safe parallel | Serialize |
| --- | --- |
| Admin screen while backend route exists | Auth before protected resources |
| Shared UI components (real) | Token ledger before publish capture |
| i18n key files | Matching after jobs + workers exist |

Default: **vertical slice** (API + UI together) per playbook order.

---

## Quality gates before “slice complete”

1. Typecheck green for touched packages  
2. Unit/integration tests for new domain rules  
3. No import of `apps/backend` from mobile  
4. No hardcoded UI strings (use i18n keys)  
5. Envelope + error codes per [shared/12](../shared/12-api-contracts.md)  
6. Screen has recipe + states  

---

## Communication to user (minimal)

| Situation | Message |
| --- | --- |
| Normal progress | Brief status: slice id + what landed |
| Sandbox secret needed | Ask once for SMS/FCM keys; pause that slice — **do not** Noop |
| Conflict with ADR | Do not ask — follow ADR |
| User overrides ADR | Require explicit “supersede ADR-XXXX” before changing |

---

## Related

- **Anti-hallucination:** [`07-anti-hallucination.md`](07-anti-hallucination.md)  
- **No mocks:** [`08-no-mocks-fully-functional.md`](08-no-mocks-fully-functional.md)  
- Playbook: [`01-implementation-playbook.md`](01-implementation-playbook.md)  
- Defaults: [`02-defaults-and-non-asks.md`](02-defaults-and-non-asks.md)  
- Scaffold: [`03-scaffold-spec.md`](03-scaffold-spec.md)  
- Conventions: [`04-coding-conventions.md`](04-coding-conventions.md)  
- Slices: [`05-slice-catalog.md`](05-slice-catalog.md)  
