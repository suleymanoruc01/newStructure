# 07 — Anti-hallucination & grounding (mandatory)

**Status:** `accepted`  
**Audience:** All AI coding agents  
**Entrypoint:** [`../AGENTS.md`](../AGENTS.md)

> **Never invent.** Every route, screen ID, module, error code, case ID, token, and stack choice must be **traced to an inspected file** in this repo (or an agent-default id). If evidence is missing, **read/search first** — do not “fill in” from model memory.

---

## 1. Source of truth hierarchy

| Rank | Source | Use for |
| --- | --- | --- |
| 1 | `parton_case_tests_tr.json` + `cases/groups/CASE-*.md` | What must pass |
| 2 | `backend/adr/ADR-*.md` + `01-architecture-decisions.md` | Locked stack / bans |
| 3 | Domain deep-dives (`backend/11`…`21`, `shared/*`) | Rules & contracts |
| 4 | Screen catalogs (`mobile/screens/*`, `web/screens/*`) | Screen IDs & UI |
| 5 | `agents/02-defaults-and-non-asks.md` | Open forks only |
| 6 | Existing code under `apps/` / `packages/` | Current implementation |

**Not sources of truth:** chat memory, other products’ APIs, Kotlin/Firebase wiki (legacy-ref only), “typical Nest apps”, training data.

Legacy wiki [`parton-codebase-wiki/`](../../parton-codebase-wiki/) = **migration hints only** — never copy Firebase client rules into Nest.

---

## 2. Grounding rules (hard)

1. **Read before write.** Before adding a feature, open the CASE group + domain module doc + relevant screen file.  
2. **No phantom APIs.** Every `app.get/post/...` path must appear in [04-domain-modules](../backend/04-domain-modules.md) REST map or be a documented additive under the same resource family — then update that doc in the same change if truly new.  
3. **No phantom screens.** Use only `m.*` / `w.*` IDs from catalogs or gap backlog tables. Do not invent `m.worker.foo.bar`.  
4. **No phantom cases.** Do not claim `@T-999` or rename case IDs. Grep JSON/matrix.  
5. **No phantom ADRs.** Cite real `ADR-00xx` filenames.  
6. **No phantom packages.** Only `api-contracts`, `shared-utils`, `design-tokens` (+ apps).  
7. **No stack improvisation.** If tempted to add Expo/GraphQL/etc., stop — [AGENTS bans](../AGENTS.md).  
8. **Defaults are explicit.** Open forks → `agent-default: gap-*` from [02](02-defaults-and-non-asks.md). Do not invent a third policy.  
9. **Library APIs:** Prefer ctx7 / official docs for Nest, Prisma, RN, React Navigation when unsure of **syntax**. Do not invent config keys.  
10. **Do not claim green** (tests/build/deploy) unless you **ran** the command in this environment.

---

## 3. Evidence protocol (before coding a slice)

```text
CHECKLIST — copy into working notes:
[ ] CASE group file path(s) opened
[ ] T-### ids listed from JSON or group table (not memory)
[ ] Module name from backend/04-domain-modules.md
[ ] REST paths from that file (or 06 + 12 contracts)
[ ] Screen IDs from mobile/web catalogs
[ ] Components from shared/02-ui-components.md
[ ] Layout recipe R# from shared/03
[ ] Error codes from shared/12 (extend enum only if needed)
[ ] Notify? → shared/05 §0 matrix row exists
[ ] Defaults? → agents/02 row cited
```

If any box fails → **search/read**, do not guess.

---

## 4. What counts as hallucination (reject)

| Behavior | Why banned |
| --- | --- |
| Inventing endpoints “that make sense” | Breaks contract / cases |
| Renaming modules (`payroll`, `chat`) not in catalog | Out of scope |
| Claiming a case is covered without test/UI | False DoD |
| Quoting docs that were not opened | Fake citations |
| Using Firebase Auth/Firestore patterns as SoR | Wrong architecture |
| Copying competitor marketplace rules | Not PartOn |
| Fabricating seed phones, JWT secrets as “production” | Security lie |
| “Tests passed” without running | False report |
| Inventing ad-hoc retention years | Use locked matrix in [17](../backend/17-privacy-kvkk-gdpr.md) / [22](../backend/22-legal-audit-logger.md); **no TODOs** |
| Using DevOps errors as legal audit / CSV-only exports | ADR-0037 — `legal_audit_events` + admin CSV **and** PDF |
| Inventing UI palette / purple-glow AI look | [`DESIGN.md`](../DESIGN.md) · ADR-0039 · cream/forest/orange only |

---

## 5. Uncertainty handling

| Situation | Action |
| --- | --- |
| Doc silent, case silent | **Do not build** the feature; leave out of scope — do **not** add a mock/fake implementation |
| Doc conflicts with case | Prefer **case acceptance** + note conflict in PR; do not silently drop case |
| Two docs conflict | Prefer **newer ADR** / `accepted` over `proposed`; cite both |
| Version unknown at install | Pin latest compatible; do not invent version numbers in docs |
| Need a new screen | Add to catalog markdown **in same change** with case link — never code-only orphan |

---

## 6. Output discipline (agent replies)

When summarizing work:

- List **files actually touched** (paths that exist after edit).  
- List **case IDs** verified by grep/read.  
- Say **“verified: ran X”** or **“not run”** for tests.  
- Never say “per industry best practice” as a substitute for a PartOn doc cite.

---

## 7. Pre-merge anti-hallucination gate

- [ ] `rg` / search: new route appears in domain REST map or OpenAPI from real controllers  
- [ ] New screen ID appears in `mobile/02` or `web/02` or screens/*.md  
- [ ] New `error.code` in `shared/12` or contracts enum  
- [ ] No banned dependency in `package.json` (expo, amqplib as primary bus, etc.)  
- [ ] No import path `apps/backend` from mobile  
- [ ] Case IDs in tests exist in `parton_case_tests_tr.json`  

---

## 8. Quick self-test (agent)

Before finishing a turn, answer internally:

1. Which **file path** justifies this endpoint/screen/rule?  
2. Which **T-###** fails if I skip this?  
3. Did I **open** that file this session, or am I recalling?

If (3) is recall-only → open the file now.

---

## Related

- Operating manual: [`00-operating-manual.md`](00-operating-manual.md)  
- Defaults: [`02-defaults-and-non-asks.md`](02-defaults-and-non-asks.md)  
- Testing: [`../06-testing-strategy.md`](../06-testing-strategy.md)  
- Verify skill pattern: evidence before claims  
