# 12 — Ponytail audit baseline (PartOn monorepo)

**Status:** `accepted` (living report; refresh after major slices)  
**Last updated:** 2026-10-11  
**Method:** Ponytail audit ladder ([`vendor/ponytail/skills/ponytail-audit/SKILL.md`](../../vendor/ponytail/skills/ponytail-audit/SKILL.md)); load assumed **staging-scale** API + mobile clients, not 10k RPS load test.

## What this repo does

PartOn is a Turborepo: Nest 12 API on Postgres (`apps/backend`), bare RN mobile (`apps/mobile`), Vite admin/marketing, Zod contracts, case-driven acceptance (`PartonNewArch/cases/`). Agents implement from NewArch docs; Ponytail governs diff size and review, not scope.

## Must fix

_None open from this baseline pass after 2026-10-11 batching fix for favorites audience document lookup._

## Should fix

1. **Worker feed still ranks distance in Node after SQL prefilter** (`workerFeed`)
   - **What:** Sector and favorites-only are filtered in SQL and pages walk the whole published set. Distance sort still happens in the API process.
   - **Fix:** A Postgres distance expression (or PostGIS) ordered with the cursor, when load cases `T-226+` require it.
   - **If we skip:** Staging stays correct; a very large city feed spends CPU in the API process.

2. **Case gap backlog** (`PartonNewArch/cases/01-gap-backlog.md`)
   - **What:** P0 gaps (documents, check-in dispute, geofence, demographics) remain product work, not style debt.
   - **Fix:** Continue gap-driven slices with e2e; do not “audit delete” features.

## Nice to have

- Run `/ponytail-audit` in Cursor after large MRs; append findings here with date.
- Keep `bun run ponytail:sync` in release checklist when bumping `vendor/ponytail`.

## Verdict

**Healthy for current staging load.** Fix worker-feed SQL push before load-test milestones; keep implementing case gaps via NewArch playbook.

## Lean (applied 2026-10-11)

- Merged duplicate `parseRequiredDocumentTypes` into `apps/backend/src/common/parse-required-document-types.util.ts`.
- Batched `uploadedTypesForUsers` for favorites-only audience checks (removed per-worker query loop).

## Not checked

Full admin/marketing UI pass, mobile store builds, production PM2/NGINX deploy paths, entire 248-case matrix re-run in one session.
