# 01 — Gap backlog (from case catalog)

**Status:** `accepted` (gaps → agent defaults; production coding ready) · [agents/10](../agents/10-production-ready.md)
**Last updated:** 2026-10-10  
**Derived from:** all 248 cases in `parton_case_tests_tr.json`  
**UI mandate:** [`03-ui-coverage-mandate.md`](03-ui-coverage-mandate.md)

Items below were under-specified or missing in the first PartonNewArch pass. Closing them keeps architecture aligned with the catalog.

## P0 — must decide / document before beta

| Gap ID | Cases | Capability | Arch action |
| --- | --- | --- | --- |
| `gap-tokens-module` | T-149–T-163, T-203, T-209, T-214, T-220, T-225 | First-class token ledger (hold/capture/release) | Add [`../backend/11-tokens-and-provision.md`](../backend/11-tokens-and-provision.md); Nest module `tokens` |
| `gap-matching-rules-engine` | T-058–T-079 | Server hard filters + ranking | Add [`../backend/12-matching-rules.md`](../backend/12-matching-rules.md) |
| `gap-checkin-dispute` | T-134, T-135, T-210–T-214 | Manual confirm + worker dispute after GPS fail | Screens + `shifts`/`moderation` APIs |
| `gap-favorites-only-job` | T-056–T-057, T-075, T-168–T-171, T-215–T-218 | Job visibility = favorites audience | Job flag + matching filter + UI toggle |
| `gap-geofence-policy` | T-125–T-127, T-136–T-148 | Radii 50/100m, indoor softness, mock GPS | [`../backend/13-location-policy.md`](../backend/13-location-policy.md) |
| `gap-firm-verification` | T-013, T-015 | Tax ID uniqueness; block publish until verified | `employers.verification_status` gate on `jobs.publish` |
| `gap-documents` | T-022–T-024, T-045, T-066–T-067, T-249 | Worker docs + job-required docs + secure download | `workers/documents` + signed URLs |
| `gap-profile-demographics` | T-027, T-028, T-044, T-191 | Age/gender on profile; optional job filters; abuse | Fields + matching + validation |

## P1 — product forks

| Gap ID | Cases | Question |
| --- | --- | --- |
| `gap-email-auth` | T-002 | Is email registration in v1 or phone-only? |
| `gap-password` | T-008, T-248 | Password accounts vs OTP-only? If yes, reset flow required |
| `gap-night-shift` | T-019, T-073 | Midnight-crossing availability & job windows |
| `gap-3h-no-response` | T-117 | Timeout policy: alert only vs auto-release seat |
| `gap-application-snapshot` | T-087, T-088 | Freeze applicant profile at apply vs live |
| `gap-overlap-apply` | T-085, T-181 | Soft warn vs hard block overlapping applications/accepts |
| `gap-payments` | T-161 | Top-up provider; failed payment leaves draft |
| `gap-wifi-location` | T-144 | Use Wi-Fi / network location as assist? |

## P1 — abuse & security hardening

| Gap ID | Cases | Action |
| --- | --- | --- |
| `gap-mock-gps` | T-131, T-148, T-188 | Detect mock location flags (Android) / risk score |
| `gap-device-fingerprint` | T-184 | Device id hash on auth; multi-account alerts |
| `gap-bot-protection` | T-186 | Rate limits + CAPTCHA/challenge on apply |
| `gap-ban-reentry` | T-192 | Ban list on phone/tax/device |
| `gap-profanity-filter` | T-176 | Rating comment moderation |
| `gap-attendance-fraud` | T-182, T-183, T-189, T-190 | Risk counters; admin queue |

## P2 — performance / UX acceptance

| Gap ID | Cases | Action |
| --- | --- | --- |
| `load-test-plan` | T-226–T-234 | Separate perf plan: notify fan-out, matching, token concurrency |
| `ux-acceptance` | T-235–T-243 | UX review per P0 screen against [layout recipes](../shared/03-screen-ux-layout.md) (copy, timing, token explainer, empty/CTA) |

## New screens / modules to add (from gaps)

### Nest modules (upgrade)

| Module | Why |
| --- | --- |
| `tokens` | Was implied under employers; catalog is ledger-critical |
| `documents` (or under `workers`) | Upload + typed docs |
| `moderation` | Dispute, abuse, ban, profanity — promote from “later” |

### Mobile screens

| ID | Purpose | Cases |
| --- | --- | --- |
| `m.worker.documents.list` | Manage certificates/docs | T-022–T-024 |
| `m.worker.documents.upload` | Upload with type checks | T-023–T-024 |
| `m.worker.shift.dispute` | Appeal failed check-in | T-135, T-212 |
| `m.employer.shift.manual-confirm` | Confirm attendance without GPS | T-134, T-213 |
| `m.shared.auth.context-switch` | Role / membership switch | AS-3 |
| `m.worker.jobs.apply-overlap` | Overlap warn/block sheet | T-085, T-181 |
| `m.employer.tokens.top-up` | Token purchase | T-161 |
| `m.shared.system.forbidden` | 403 / wrong tenant | T-244–246 |
| `m.shared.system.session-expired` | Re-auth | T-247 |
| `m.auth.email` (optional) | Email register | T-002 |
| `m.auth.password` (optional) | Password set/reset | T-008, T-248 |

### Web screens

| ID | Purpose | Cases |
| --- | --- | --- |
| `w.employer.jobs.create` favorites-only flag | T-056, T-168 |
| `w.employer.shift.attendance` | Manual confirm + disputes | T-134–T-135, T-210–T-214 |
| `w.employer.verification` | Firm verification status | T-015 |
| `w.employer.tokens.top-up` | Token purchase | T-161 |
| `w.admin.perf.metrics` | CASE-PERF ops visibility | T-226–T-234 |
| `w.admin.risk.queue` | Multi-account / mock GPS / no-show | CASE-ABUSE |

### UI components (required inventory)

Named set in [`../shared/02-ui-components.md`](../shared/02-ui-components.md). Implementation gap until packages ship; architecture inventory is accepted.

## Documentation completeness (architecture)

| Gap | Resolution |
| --- | --- |
| No master doc map | [`../DOC-INDEX.md`](../DOC-INDEX.md) |
| Envelope / errors / Zod open (AO-6/8) | **Closed** — [ADR-0027](../backend/adr/0027-api-contracts-baseline.md) · [shared/12](../shared/12-api-contracts.md) |
| No glossary | [`../shared/11-glossary.md`](../shared/11-glossary.md) |
| No NFR/SLO sketch (AO-4) | Proposed — [`../05-quality-nfr.md`](../05-quality-nfr.md) (region still AO-10) |
| No testing strategy | [`../06-testing-strategy.md`](../06-testing-strategy.md) |
| No env/ops playbook | [`../07-environments-and-ops.md`](../07-environments-and-ops.md) |
| UI/UX era bars | ADR-0025 / 0026 |
| Routing / i18n / a11y / wizard / push UX | ADR-0019–0024 |
| Agent autonomy (no ask loops) | [`../AGENTS.md`](../AGENTS.md) · [`../agents/02-defaults-and-non-asks.md`](../agents/02-defaults-and-non-asks.md) |
| Anti-hallucination grounding | [`../agents/07-anti-hallucination.md`](../agents/07-anti-hallucination.md) |
| No mocks / fully functional | [`../agents/08-no-mocks-fully-functional.md`](../agents/08-no-mocks-fully-functional.md) |
| Latest stable libraries | [`../agents/09-latest-stack-policy.md`](../agents/09-latest-stack-policy.md) · [ADR-0028](../backend/adr/0028-latest-stable-stack.md) |
| Dual-platform iOS + Android | [`../mobile/06-ios-android-platforms.md`](../mobile/06-ios-android-platforms.md) · [ADR-0029](../backend/adr/0029-dual-platform-ios-android.md) |
| Fastlane mobile release | [`../mobile/07-fastlane.md`](../mobile/07-fastlane.md) · [ADR-0030](../backend/adr/0030-fastlane-mobile-release.md) |
| PM2 Nest web process manager | [`../web/05-pm2.md`](../web/05-pm2.md) · [ADR-0031](../backend/adr/0031-pm2-web-process-manager.md) |
| NGINX reverse proxy / TLS | [`../web/06-nginx.md`](../web/06-nginx.md) · [ADR-0032](../backend/adr/0032-nginx-reverse-proxy.md) |
| Marketing site (production — no MVP gaps) | [`../web/07-marketing.md`](../web/07-marketing.md) · [ADR-0033](../backend/adr/0033-marketing-site.md) |
| Admin covers all CASE-* domains | [`../web/08-admin-case-coverage.md`](../web/08-admin-case-coverage.md) · [ADR-0034](../backend/adr/0034-admin-full-case-coverage.md) |
| Admin DevOps error tracking | [`../web/09-admin-devops.md`](../web/09-admin-devops.md) · [ADR-0035](../backend/adr/0035-admin-devops-error-tracking.md) |
| Admin DevOps MCP | [`../web/10-devops-mcp.md`](../web/10-devops-mcp.md) · [ADR-0036](../backend/adr/0036-admin-devops-mcp.md) |
| Legal audit logger + CSV/PDF | [`../backend/22-legal-audit-logger.md`](../backend/22-legal-audit-logger.md) · [`../web/11-legal-audit-reports.md`](../web/11-legal-audit-reports.md) · [ADR-0037](../backend/adr/0037-legal-audit-logger.md) |
| Doc cohesion / wiring | [`../DOC-COHESION.md`](../DOC-COHESION.md) · [`../DOC-INDEX.md`](../DOC-INDEX.md) |

**Note:** Product forks above remain formally `open` for humans, but **AI agents must use** [agent defaults](../agents/02-defaults-and-non-asks.md) and proceed without asking.

## Still open (non-blocking for coding)

| Item | Stance |
| --- | --- |
| AO-10 cloud vendor brand | Compose + PM2 + NGINX until chosen |
| Formal contractual SLOs / multi-AZ | Eng defaults in [05](../05-quality-nfr.md) |
| Product Hold gaps (`gap-email-auth`, etc.) | Use [agents/02](../agents/02-defaults-and-non-asks.md) |

**Closed for production coding:** AO-1/5/7/11/12/13, ADR-0003, ADR-0038 — [agents/10](../agents/10-production-ready.md).

## Closed by prior enhancement passes

Documentation added for tokens, matching, location policy, case groups, coverage matrix, E2E journeys, **UI coverage mandate**, component inventory, and screen/module patches referenced above. **Implementation** of Nest/RN still pending.
