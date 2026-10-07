# 01 — Gap backlog (from case catalog)

**Status:** `proposed`  
**Last updated:** 2026-10-07  
**Derived from:** all 248 cases in `parton_case_tests_tr.json`

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
| `ux-acceptance` | T-235–T-243 | UX review checklist per P0 screen (copy, timing, token explainer) |

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
| `m.auth.email` (optional) | Email register | T-002 |
| `m.auth.password` (optional) | Password set/reset | T-008, T-248 |

### Web screens

| ID | Purpose | Cases |
| --- | --- | --- |
| `w.employer.jobs.create` favorites-only flag | T-056, T-168 |
| `w.employer.shift.attendance` | Manual confirm + disputes | T-134–T-135, T-210–T-214 |
| `w.employer.verification` | Firm verification status | T-015 |
| `w.admin.risk.queue` | Multi-account / mock GPS / no-show | CASE-ABUSE |

## Closed by this enhancement pass

Documentation added for tokens, matching, location policy, case groups, coverage matrix, E2E journeys, and screen/module patches referenced above. Implementation still pending.
