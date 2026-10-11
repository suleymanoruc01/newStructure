# 11 — Ponytail integration (agent workflow)

**Status:** `accepted`  
**Last updated:** 2026-10-11  
**Upstream:** [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT), vendored at [`vendor/ponytail`](../../vendor/ponytail)

## What is installed

| Artifact | Path | Purpose |
| --- | --- | --- |
| Vendored upstream | `vendor/ponytail/` | Hooks scripts, skills source, `AGENTS.md`, benchmarks |
| Cursor skills | `.cursor/skills/ponytail*` | `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help` |
| Cursor rules | `.cursor/rules/ponytail.mdc` | Always-on lazy-senior-dev ladder |
| Precedence | `.cursor/rules/parton-ponytail-precedence.mdc` | PartOn production + cases override scope cuts |
| Project hooks | `.cursor/hooks.json` | Portable via `scripts/run-ponytail-hook.mjs` |
| OpenCode / Kilo | `opencode.json` | Plugin `./vendor/ponytail/.opencode/plugins` |
| Claude / Amp / Jules | `.agents/skills/*`, `.agents/rules/ponytail.md` | Run `bun run ponytail:sync` |
| Cline | `.clinerules/ponytail.md` | Same sync script |
| Kiro | `.kiro/steering/ponytail.md` | Same sync script |
| Qoder | `.qoder/rules/ponytail.md` | Same sync script |
| Debt ledger | `.parton/ponytail-debt-ledger.md` | `/ponytail-debt` harvest target |

Refresh all agent copies after upgrading vendor:

```bash
bun run ponytail:sync
```

Refresh hooks after moving the repo:

```bash
bun run ponytail:hooks:install
```

Uninstall ponytail hooks only:

```bash
bun run ponytail:hooks:uninstall
```

Default mode: `full` (override with `PONYTAIL_DEFAULT_MODE` or `~/.config/ponytail/config.json`).

## When to use which command

| Command | Use on PartOn |
| --- | --- |
| `/ponytail-review` | Before opening an MR: diff + **callers outside the diff** (REST clients, mobile screens, admin case matrix). |
| `/ponytail-audit` | Periodic repo health; rank fixes — still implement gaps via case backlog, not audit-only deletes. |
| `/ponytail-debt` | Collect `shortcut:` comments into a ledger; resolve or ADR — no permanent TODOs in prod paths (`agents/10`). |
| `/ponytail ultra` | Refactors / debt burns only; not for skipping case-mapped features. |

## Non-negotiable overlap with Ponytail

Ponytail says: never cut validation, security, accessibility, or data-loss handling. PartOn adds:

- Full-stack slice: Nest + Zod + screen + e2e on real DB for each case group you touch.
- No Noop providers (`agents/08`).
- Turkish i18n + `DESIGN.md` tokens (`agents/10`, ADR-0039).

## Updating upstream

Replace `vendor/ponytail` from a fresh clone of `DietrichGebert/ponytail`, then:

```bash
cp -r vendor/ponytail/skills/* .cursor/skills/
cp vendor/ponytail/.cursor/rules/ponytail.mdc .cursor/rules/ponytail.mdc
bun run ponytail:hooks:install
```

Verify license: `vendor/ponytail/LICENSE` (MIT).

CI runs `bun run ponytail:verify` on every PR. Audit baseline: [`12-ponytail-audit-baseline.md`](12-ponytail-audit-baseline.md).
