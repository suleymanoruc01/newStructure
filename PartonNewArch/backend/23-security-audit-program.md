# 23 — Security audit program

**Status:** `accepted` (method); no source audit has run  
**Last updated:** 2026-10-11  
**Method:** [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (`skills/security-audit`)  
**Controls:** [18 Auth/RBAC](18-auth-rbac.md) · [21 client security](21-client-security.md) · [07 checklist](07-auth-security.md) · [17 privacy](17-privacy-kvkk-gdpr.md) · [CASE-SECURITY](../cases/groups/CASE-SECURITY.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §10 · §11 · §15.2 · §16

> PartOn security reviews follow the Cloudflare security-audit skill: a finding exists only when a lower-trust principal crosses a real trust boundary and produces a concrete result. Case checklists and ADR baselines are the controls under test. They are not verdicts.

This pass is **guidance**. `PartonNewArch` is architecture, not an application tree, so there is no `findings.json`, no severity, and no claim that a unit is `covered`. The first code audit replaces the doc anchors below with repository-relative source refs.

---

## 1. What this doc owns

| Owns | Does not own |
| --- | --- |
| How to audit PartOn once `apps/` and `packages/` exist | OTP/JWT/RBAC design — [18](18-auth-rbac.md) |
| Which skill companions apply to locked surfaces | Client storage, TLS, CSRF — [21](21-client-security.md) |
| Seed coverage units (surface × boundary × class) | Acceptance tests — [CASE-SECURITY](../cases/groups/CASE-SECURITY.md) · [06](../06-testing-strategy.md) |
| Verdict words and what may receive severity | Legal wording, VERBIS, retention durations — counsel via [17](17-privacy-kvkk-gdpr.md) |

Install when auditing code:

```text
npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit
```

A direct audit of the monorepo is **full audit mode** in that skill: six phases, output outside the repo (`~/security-audit-skill/<repo>/run-<N>`), parent-owned ledger and findings, independent verification before any report. Do not commit run artifacts into this tree unless the directory is gitignored and explicitly chosen. Security questions and design review stay in **guidance mode** and do not create those files.

---

## 2. Verdicts

Use the skill’s words. Do not invent a second scale.

| Verdict | Meaning here | Severity |
| --- | --- | --- |
| `confirmed` | Source trace plus a bounded local result: lower-trust principal, accepted input, intended control, crossed boundary, affected resource, observed outcome | Yes — skill anchors only (critical / high / medium / low / informational) |
| `needs_validation` | Source-grounded hypothesis blocked on one exact missing fact (deploy, provider, identity, runtime) | **None** |
| `rejected` | Independent verifier disproved the claim | None |

CASE priority **Kritik** (T-244–T-252) is product acceptance priority. It does not set audit severity. An unchecked box in [07](07-auth-security.md) is an implementation gap, not a confirmed vulnerability.

Severity requires demonstrated impact. Overall severity cannot exceed that impact. Anchors, from the skill:

| Severity | Demonstrated result |
| --- | --- |
| critical | Unauthenticated code execution, full data-store access, or arbitrary account takeover |
| high | An explicit control is fully defeated: auth bypass, cross-tenant read/write, stored script affecting other users, authenticated code execution, or unauthenticated remote stop of a shared service |
| medium | Real boundary violation with limited blast radius, uncommon preconditions, or a narrow resource set |
| low | Non-secret internal disclosure, or sustained effort for minimal gain |
| informational | Confirmed, minimal impact; useful mainly inside a larger finding |

The high/medium split: the result either fully defeats an explicit control with real consequences, or only weakens it.

---

## 3. Rules that bind every review

1. **Boundary and result.** Name the principal, input, control, boundary, victim resource, and observable result. A missing best practice is not a finding.
2. **Last trusted decision.** Nest guards plus SQL scope are the authorization boundary ([18](18-auth-rbac.md)). Hidden UI is not a control and not a vulnerability by itself.
3. **Defense in depth.** If layer A already stops the action, a missing layer B is a hardening note. TLS pinning is **Trial**; root/jailbreak hard-block is **Hold** ([21](21-client-security.md)). Neither absence is a confirmed finding on its own.
4. **Same-principal authority.** A worker reading their own profile, or an employer reading their own branch, is intended authority.
5. **Unknown deploy facts stay unresolved.** Cloud vendor and region are **AO-10**. If the control lives only in NGINX, the SMS provider, or the cloud IAM policy and that config is not in source, record `needs_validation` with the exact fact. Do not assume the control is present or absent.
6. **No live probing.** Do not hit deployed PartOn, shared Redis, production SMS, FCM, or paid quotas. Local checks need the skill’s OS sandbox (no external network, empty allowlisted env, read-only target, resource limits). If that sandbox is missing, leave the lead at `needs_validation`.
7. **Smallest fix.** For a confirmed issue, state the invariant and the narrowest change at the last trusted decision, plus a regression test. Audits describe fixes; they do not edit the target.
8. **Runs accumulate.** One pass is not complete coverage. Later runs carry same-source evidence and reopen changed source. A `quick` or scoped run must say it is partial.

---

## 4. Principals and resources

| Principal | Normal authority | Must not reach |
| --- | --- | --- |
| Anonymous | OTP request, public marketing, legal pages | Any `/api/v1` resource, admin, MCP |
| Worker | Own profile, applications, availability, own documents via signed URL | Other workers, employer ledgers, admin |
| Employer | Own firm, own branches, own jobs, own candidates | Other firms; platform admin |
| Manager | Explicit `branchIds` only | Other branches; firm-wide actions outside membership |
| Admin | Platform ops, DevOps, legal-audit export, moderation | Shell, git write, raw secrets via MCP |
| CI / Fastlane | Build, sign, register release metadata | Production data-plane credentials in the client bundle |
| MCP agent | Admin-scoped DevOps tools in [web/10](../web/10-devops-mcp.md) | Unlisted tools, `run_shell`, `read_env`, `git_write` |

Protected resources: PostgreSQL rows (tenant-scoped), refresh-session family, OTP challenges, document objects, precise location, legal-audit log, DevOps error samples, JWT signing and SMS/FCM credentials.

---

## 5. Companion selection

Select a companion because the **boundary** exists in the locked architecture, not because a library name might appear later. Block ids match the skill: `FILE.md#` plus the heading text before any parenthetical.

| Companion | Selected blocks | PartOn boundary | Excluded blocks | Why excluded |
| --- | --- | --- | --- | --- |
| [ATTACK-CLASSES.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/ATTACK-CLASSES.md) | Injection; Access control; Resource and file handling; Cryptography and secrets; Business logic; Feature abuse and data leakage; Chained vulnerabilities and trust boundaries; Wildcard; Obvious things | REST, SQL, logs, tokens, uploads, state machines | — | Core set applies to the Nest monolith |
| [WEB-PROTOCOL-AND-AUTH.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/WEB-PROTOCOL-AND-AUTH.md) | Core discipline; HTTP framing and cache attack classes; Browser-session attack classes; MFA, passkey, and account-transition attack classes; API-key and mTLS attack classes; Universal moves; Validation rules | NGINX, JWT, cookie refresh, OTP, `PARTON_MCP_API_KEY` | Federated-identity attack classes | AuthN is phone OTP, not OIDC/SAML. Hunt API keys inside API-key and mTLS; do not invent an mTLS control — none is specified |
| [CLIENT-SIDE.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/CLIENT-SIDE.md) | Core discipline; DOM and object-state attack classes; Cross-origin messaging and network attack classes; Cross-site information leak classes; UI-redress and navigation attack classes; Universal moves; Validation rules | Admin SPA, employer console, marketing | Service-worker and browser-storage attack classes | No service worker in [web/07](../web/07-marketing.md) or admin. Browser storage of the refresh cookie is covered by Browser-session attack classes |
| [DESKTOP-MOBILE-AND-LOCAL-IPC.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md) | Core discipline; Deep-link, callback, and navigation attack classes; Webview and native-bridge attack classes; Application-state and device-lifecycle attack classes; Universal moves; Validation rules | Bare RN, App Links, Keychain, FCM tap | Local IPC and exported-component attack classes; Privileged-helper and local-file attack classes | No Binder/XPC service or privileged helper is specified |
| [SUPPLY-CHAIN-AND-RELEASE.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/SUPPLY-CHAIN-AND-RELEASE.md) | Core discipline; Dependency and build-input attack classes; CI and automation attack classes; Release and update attack classes; Universal moves; Validation rules | Bun, Turborepo, npm (mobile), Fastlane, PM2 deploy | — | ADR-0030/0031/0040 |
| [CLOUD-AND-DEPLOYMENT.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/CLOUD-AND-DEPLOYMENT.md) | Core discipline; Ingress, network, and control-plane attack classes; Configuration and secret lifecycle attack classes; Universal moves; Validation rules | NGINX TLS, env secrets, managed Redis/Postgres | Workload identity and IAM attack classes; Container and orchestration attack classes; Managed storage, events, and edge attack classes | No IaC, Kubernetes, or object-event source until AO-10 and the repo contain them. Those blocks become planned units later; they are not covered |
| [DATA-ISOLATION-AND-LIFECYCLE.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md) | Core discipline; Tenant and object-isolation attack classes; Derived-data and disclosure attack classes; Export, backup, restore, and migration attack classes; Deletion, revocation, and lifecycle attack classes; Universal moves; Validation rules | Employer/branch scope, signed URLs, DSR, legal-audit export, retention | — | Multi-tenant SoR is PostgreSQL |
| [AI-AND-LLM.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/AI-AND-LLM.md) | Core discipline; Tool and action attack classes; MCP and sub-agent trust classes; Output and disclosure attack classes; Universal moves; Validation rules | `apps/devops-mcp` facade | Context, retrieval, and memory attack classes | No product chat, RAG, or agent memory |
| [RESOURCE-EXHAUSTION-AND-AVAILABILITY.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md) | Core discipline; Computational amplification attack classes; Resource accumulation attack classes; Quota and scheduling attack classes; Failure and recovery attack classes; Universal moves; Validation rules | OTP throttle, apply/check-in, notify fan-out, BullMQ | — | Shared Nest, Postgres, Redis, SMS spend |
| [PROTOCOLS-RPC-AND-MESSAGING.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md) | Core discipline; RPC identity and authorization attack classes; Broker and queue isolation attack classes; Replay, ordering, and transaction attack classes; Universal moves; Validation rules | Outbox, BullMQ, SSE, FCM | Framing, schema, and interpretation attack classes | gRPC and RabbitMQ are **Hold** (ADR-0009, ADR-0007). JSON Zod is covered by Injection plus [API contracts](../shared/12-api-contracts.md) |
| [MEMORY-SAFETY-AND-BINARY.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/MEMORY-SAFETY-AND-BINARY.md) | None until native code exists | — | Entire file | Locked app code is TypeScript. Re-select when a repo contains custom native parsers, unsafe FFI, or JNI beyond stock RN |

---

## 6. Seed coverage units

A unit is one entry surface, one trust boundary, one subsystem, and one attack class. This table is the **seed plan** (`status: planned`). It is not a coverage ledger and must not be cited as evidence that the unit was reviewed.

On the first full audit, replace these doc-level labels with source `canonical_refs` and set `prior_status` to `none` (no prior ledger). Sort and validate with the skill’s `validate-coverage-ledger.cjs`. Do not mark `covered` from this document.

| Surface | Boundary (last control) | Subsystem | Attack class | Control doc | Cases |
| --- | --- | --- | --- | --- | --- |
| `POST /api/v1/auth/otp/*` | Hashed OTP, lockout, throttle | `auth` | WEB-PROTOCOL-AND-AUTH.md#MFA, passkey, and account-transition attack classes | [07](07-auth-security.md) · [18](18-auth-rbac.md) | T-005–T-007 |
| `POST /api/v1/auth/token/refresh` | Rotation; reuse revokes `sid` family | `auth` | ATTACK-CLASSES.md#Cryptography and secrets | [21](21-client-security.md) | T-247 |
| Cookie refresh + logout | `HttpOnly` + `Secure` + `SameSite` + CSRF | `admin` / `web` | WEB-PROTOCOL-AND-AUTH.md#Browser-session attack classes | [21](21-client-security.md) | T-247 |
| Bearer resource routes | AuthN → role → SQL scope → state machine | domain modules | ATTACK-CLASSES.md#Access control | [18](18-auth-rbac.md) | T-244–T-246 |
| List/search/export | Per-row scope, including bulk | domain modules | DATA-ISOLATION-AND-LIFECYCLE.md#Tenant and object-isolation attack classes | [18](18-auth-rbac.md) | T-244–T-245 |
| Document GET | Short-lived signed URL | storage | ATTACK-CLASSES.md#Resource and file handling | [21](21-client-security.md) | T-249 |
| Check-in + location write | Server geofence; no client trail | `location` / `shifts` | ATTACK-CLASSES.md#Business logic | [13](13-location-policy.md) | T-188 · T-250 |
| Token hold/capture/release | Atomic ledger | `tokens` | PROTOCOLS-RPC-AND-MESSAGING.md#Replay, ordering, and transaction attack classes | [11](11-tokens-and-provision.md) | CASE-TOKEN |
| Apply / accept / shift | Idempotency-Key; illegal transition → 409 | `applications` / `shifts` | ATTACK-CLASSES.md#Business logic | [12](12-matching-rules.md) | T-181 |
| Logs, OTel, job payloads | Redaction before sink | observability | ATTACK-CLASSES.md#Obvious things | [07](07-auth-security.md) | T-252 |
| UI field display | Mask phone/tax; server still enforces | clients | ATTACK-CLASSES.md#Feature abuse and data leakage | [21](21-client-security.md) | T-251 |
| Admin + marketing HTML | CSP, frame denial, React escaping | `admin` / `marketing` | CLIENT-SIDE.md#DOM and object-state attack classes | [21](21-client-security.md) | — |
| `parton://` and HTTPS links | Allowlisted host; no tokens in query | `mobile` | DESKTOP-MOBILE-AND-LOCAL-IPC.md#Deep-link, callback, and navigation attack classes | [21](21-client-security.md) · [mobile/03](../mobile/03-flows-and-deep-links.md) | — |
| Refresh at rest | Keychain / Keystore; memory access JWT | `mobile` | DESKTOP-MOBILE-AND-LOCAL-IPC.md#Application-state and device-lifecycle attack classes | [21](21-client-security.md) | T-247 |
| FCM data | Ids only; register/unregister on session | `notifications` | PROTOCOLS-RPC-AND-MESSAGING.md#RPC identity and authorization attack classes | [20](20-fcm-messaging.md) | — |
| SSE stream | Same AuthN as REST; no secret in URL | realtime | PROTOCOLS-RPC-AND-MESSAGING.md#RPC identity and authorization attack classes | [19](19-sse.md) | — |
| Outbox → BullMQ | Tenant on payload; no Redis as SoR | async | PROTOCOLS-RPC-AND-MESSAGING.md#Broker and queue isolation attack classes | [08](08-async-events.md) · [15](15-redis-management.md) | — |
| Notify fan-out | `dedupe_key`; queue backpressure | `notifications` | RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Computational amplification attack classes | [05](../05-quality-nfr.md) | T-226–T-228 |
| OTP / apply / check-in | Throttler + SMS spend cap | `auth` | RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Quota and scheduling attack classes | [07](07-auth-security.md) | T-186 |
| DSR export/erase | Authorized, audited, scoped | `privacy` | DATA-ISOLATION-AND-LIFECYCLE.md#Export, backup, restore, and migration attack classes | [17](17-privacy-kvkk-gdpr.md) | P3 |
| Legal-audit CSV/PDF | Admin role; append-only store | `audit` | DATA-ISOLATION-AND-LIFECYCLE.md#Derived-data and disclosure attack classes | [22](22-legal-audit-logger.md) | ADR-0037 |
| DevOps MCP tools | Admin credential; allowlisted tools | `devops-mcp` | AI-AND-LLM.md#MCP and sub-agent trust classes | [web/10](../web/10-devops-mcp.md) | ADR-0036 |
| bun.lock + mobile npm lock + Fastlane | Pinned graphs; official store signing | release | SUPPLY-CHAIN-AND-RELEASE.md#Dependency and build-input attack classes | [mobile/07](../mobile/07-fastlane.md) | ADR-0028 |
| NGINX edge | TLS 1.2+; API not HTML-cached | edge | CLOUD-AND-DEPLOYMENT.md#Ingress, network, and control-plane attack classes | [web/06](../web/06-nginx.md) | — |
| Env secrets | Server only; absent from bundles | config | CLOUD-AND-DEPLOYMENT.md#Configuration and secret lifecycle attack classes | [07](../07-environments-and-ops.md) | — |

Add a unit when a new route, queue, client sink, or MCP tool appears. Do not collapse “auth reviewed” into one unit.

---

## 7. Acceptance tests vs audit

| | Case tests ([06](../06-testing-strategy.md)) | This program |
| --- | --- | --- |
| Question | Does the product rule hold for `T-###`? | Can a lower-trust principal cross a boundary? |
| Evidence | Automated test with case tag | Source path + bounded local result, independently verified |
| Gap | `partial` / `gap` in the case matrix | `planned`, `deferred`, `blocked`, or `needs_validation` |
| Passing T-244 | List endpoint filters own rows | Necessary, not sufficient — other paths to the same rows still need units |

Map CASE-SECURITY onto units in §6. CASE-ABUSE (T-181–T-192) is business-logic and quota hunting, not a substitute for access-control units. CASE-PERF numbers are SLOs; exhaustion findings need a shared-resource boundary, not a slow p95 alone.

---

## 8. Design review (before code exists)

For each new capability, answer in the PR:

1. Who is the lower-trust caller?
2. What input do they control (body, query, header, file, deep link, queue payload, MCP argument)?
3. What is the last trusted check, and which weaker path reaches the same write?
4. What other tenant, session, or operator resource changes if the check fails open?
5. Which §6 row covers it, or which new row was added?
6. Which fact is still outside the repo (AO-10, SMS vendor, pinning kill-switch)? Write that exact missing fact.

---

## 9. Running a code audit

Follow the skill’s [SKILL.md](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/SKILL.md). PartOn-specific choices:

| Setup | Value |
| --- | --- |
| Target | Monorepo root that contains `apps/` and `packages/` |
| Profile | `standard` for a first full pass; `deep` after production data; `quick` only as a partial re-run |
| Scope | Full tree, or a slice from [agents/05](../agents/05-slice-catalog.md) with everything else `out_of_scope` |
| Companions | §5. Drop a block only with the source fact that excludes it |
| Prior ledger | This file is not a prior ledger |

Phases, in order: reconnaissance (`architecture.md`, `coverage-ledger.json`) → coverage-led hunting → fresh verifier per candidate → `findings.json` validated against the skill schema → independent record verification → `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`. The parent validates the ledger after create and after every update, and validates findings in phase 4 and after every phase 5 replacement.

Stop only when both validators pass, or when `run_status` is `incomplete` with an explicit reason. Never promote a `needs_validation` lead to a severity.

---

## 10. Related

- Skill source: [github.com/cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (MIT)
- Auth checklist: [07-auth-security.md](07-auth-security.md)
- Client baseline: [21-client-security.md](21-client-security.md) · [ADR-0018](adr/0018-client-security.md)
- Privacy: [17-privacy-kvkk-gdpr.md](17-privacy-kvkk-gdpr.md)
- MCP: [../web/10-devops-mcp.md](../web/10-devops-mcp.md)
- Tests: [../06-testing-strategy.md](../06-testing-strategy.md)
