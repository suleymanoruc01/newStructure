# 11 — Glossary (domain & architecture)

**Status:** `accepted`  
**Last updated:** 2026-10-09  
**Audience:** All contributors  
**Index:** [`../DOC-INDEX.md`](../DOC-INDEX.md)

Canonical terms for PartOn docs and code. Prefer these names in ADRs, cases, OpenAPI, and UI copy keys (English machine ids; Turkish user strings via i18n).

---

## Product roles

| Term | Meaning |
| --- | --- |
| **Worker** | Job seeker (işçi / part-time applicant) |
| **Employer** | Organization posting jobs; owns tokens and branches |
| **Manager** | Branch-scoped operator membership (`branch_managers`) — AuthZ ready; product label AO-11 |
| **Admin** | Platform ops user (Nest-hosted admin SPA) |
| **Context / membership** | Active role+scope for a session; switch via AS-3 |

## Marketplace objects

| Term | Meaning |
| --- | --- |
| **Job / posting** | Employer-created shift opportunity at a branch |
| **Job catalog** | Platform taxonomy of job types (admin-managed) |
| **Application** | Worker apply → employer review state machine |
| **Shift** | Accepted application that becomes attendance lifecycle (3h, check-in) |
| **Feed** | Server-matched job list for a worker (`GET /jobs/feed`) |
| **Favorites** | Directional worker↔employer preference; may gate **favorites-only** jobs |
| **Branch** | Physical workplace with geo for check-in |
| **Document** | Worker certificate/file; may be required by job |

## Tokens & money-adjacent

| Term | Meaning |
| --- | --- |
| **Token** | Employer prepaid unit for publishing / seating (not crypto) |
| **Balance** | Available tokens |
| **Hold** | Reserved tokens against a job (not spendable until capture/release) |
| **Capture** | Consume held tokens (e.g. on publish/accept rules) |
| **Release** | Return hold to balance |
| **Ledger** | Append-only token movements |
| **Top-up** | Purchase/credit tokens (provider open — gap-payments) |

## Day-of & location

| Term | Meaning |
| --- | --- |
| **3h confirm / availability confirm** | Worker must confirm ~3h before shift or seat at risk |
| **Check-in** | Geo-verified (or manual) start of attendance |
| **Geofence** | Allowed radius/accuracy policy for check-in |
| **Manual confirm** | Employer/manager attendance without successful GPS |
| **Dispute** | Worker challenge of failed/denied attendance |

## Notifications & realtime

| Term | Meaning |
| --- | --- |
| **Inbox** | Durable in-app notification store (SoR for user alerts) |
| **Outbox** | Transactional table for reliable side effects (FCM, SMS, …) |
| **FCM** | Firebase Cloud Messaging — OS push transport |
| **SSE** | Server-Sent Events — foreground live hints only |
| **dedupe_key** | Idempotency key preventing duplicate notifies |
| **Deep link** | `parton://` / Universal Link → screen after gates |

## Auth & security

| Term | Meaning |
| --- | --- |
| **OTP** | One-time password via SMS (primary AuthN) |
| **Access JWT** | Short-lived bearer; **memory only** on clients |
| **Refresh session** | Rotating credential; Keychain / HttpOnly cookie |
| **RBAC** | Role-based access control |
| **Resource scope** | Employer/branch/ownership filter on every protected route |
| **AuthZ** | Authorization (server-enforced; UI may hide only) |

## Architecture shorthand

| Term | Meaning |
| --- | --- |
| **SoR** | System of record — PostgreSQL for business state |
| **Modular monolith** | One Nest deployable; Nest modules as bounded contexts |
| **Stage A async** | Outbox + in-process drain |
| **Stage B async** | Outbox → BullMQ + managed Redis |
| **Screen ID** | `m.*` / `w.*` catalog identifier |
| **CASE-*** / **T-###** | Acceptance group / test id from case JSON |
| **AO-*** | Open architecture topic id ([01](../01-architecture-decisions.md)) |
| **ADR** | Architecture Decision Record |

## UI / UX shorthand

| Term | Meaning |
| --- | --- |
| **R1–R8** | Screen layout recipes ([03](03-screen-ux-layout.md)) |
| **P1–P12** | Sept 2026 UI principles ([09](09-modern-ui-principles.md)) |
| **X1–X12** | Sept 2026 UX principles ([10](10-modern-ux-principles.md)) |
| **WizardShell** | Lifted multi-step form state owner |
| **Liquid Glass** | iOS chrome-vs-content design language (principles, not SwiftUI rewrite) |

## Privacy

| Term | Meaning |
| --- | --- |
| **KVKK** | Turkish personal data law (primary regime) |
| **DSR** | Data subject request (export / erasure) |
| **Aydınlatma** | Privacy notice / information text version |
| **Minimization** | Store/process only what product needs |

---

## Related

- Domain modules: [`../backend/04-domain-modules.md`](../backend/04-domain-modules.md)  
- Cases: [`../cases/README.md`](../cases/README.md)  
