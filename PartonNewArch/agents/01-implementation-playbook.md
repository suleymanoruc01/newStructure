# 01 — Implementation playbook (ordered)

**Status:** `accepted`  
**Agents:** Execute slices **S0 → Sn** in order unless user names a slice.  
**Catalog detail:** [`05-slice-catalog.md`](05-slice-catalog.md)  
**Scaffold:** [`03-scaffold-spec.md`](03-scaffold-spec.md)

---

## North-star loop

```text
discover → apply → accept → 3h confirm → check-in → rate
```

Ship **thin vertical slices** that advance this loop; polish after green path.

---

## Phase → slices

### S0 — Monorepo foundation (P0)

1. Create pnpm + Turborepo workspace per scaffold spec (**latest** tool versions)  
2. Verify toolchain with `npm view` / [09-latest-stack-policy](09-latest-stack-policy.md) (Nest 12, TS 6, Node LTS)  
3. `packages/api-contracts` — envelope helpers, error codes, health schemas (Zod **4** latest)  
4. `packages/design-tokens` — from [shared/01-color-system](../shared/01-color-system.md)  
5. `apps/backend` — Nest **12** latest, TS **6**, `/api/v1`, Config, Prisma latest, Health, Exception filter  
6. Docker Compose: Postgres 18 (+ Redis optional + MinIO)  
7. CI: lint, typecheck, test  
8. `.env.example` complete (SMS/FCM required)  
9. Scaffold Nest **PM2** `ecosystem.config.cjs` (`instances: 1`) — [web/05](../web/05-pm2.md)  
10. Scaffold **NGINX** templates (`deploy/nginx/`) — [web/06](../web/06-nginx.md)  

**Exit:** `GET /health/live` + `ready` green locally.

**Docs:** [03-scaffold](03-scaffold-spec.md) · [05-data](../backend/05-data-layer.md) · [12-contracts](../shared/12-api-contracts.md) · [web/05](../web/05-pm2.md) · [web/06](../web/06-nginx.md) · ADR-0031/0032

---

### S1 — Auth vertical

1. OTP request/verify via **real SMS sandbox** provider (fail boot if unset)  
2. Access JWT (memory client-side) + refresh sessions  
3. `/me`, logout, context list/switch (real AuthZ)  
4. Zod auth schemas  
5. Integration tests `@CASE-AUTH` against Postgres + sandbox SMS  

**Exit:** real OTP SMS received → verify → tokens → `GET /me`.

**Docs:** [18-auth-rbac](../backend/18-auth-rbac.md) · [CASE-AUTH](../cases/groups/CASE-AUTH.md)

---

### S2 — Mobile + admin shells

1. Bare RN **latest** + NativeWind + React Navigation ([08-routing](../shared/08-routing.md))  
2. Write `apps/mobile/PLATFORM.md` (min/target SDK from RN template) — [mobile/06](../mobile/06-ios-android-platforms.md)  
3. Prove **`run-ios` and `run-android`** on latest stable simulator/emulator  
4. Scaffold **Fastlane** (`Gemfile` + `fastlane/` lanes ios/android beta+release) — [mobile/07](../mobile/07-fastlane.md)  
5. Secure refresh storage (Keychain + Android keystore path); memory access token  
6. Typed API client from contracts  
7. Auth screens (`m.auth.*`) on **both** platforms  
8. Vite admin + shadcn dark + React Router; Nest serves static  
9. **`apps/marketing` production site** — all `w.public.*` (landing, pricing, legal) + prerender + SEO — [web/07](../web/07-marketing.md)  
10. i18n `tr-TR` catalogs scaffolding  

**Exit:** OTP login on **iOS and Android** against local API; admin login shell; marketing **production DoD** (no deferred public screens); Fastlane project present (upload gated on secrets).

**Docs:** [mobile/06](../mobile/06-ios-android-platforms.md) · [mobile/07](../mobile/07-fastlane.md) · [mobile/04](../mobile/04-nativewind-ui.md) · [web/04](../web/04-shadcn-dark-ui.md) · [web/07](../web/07-marketing.md) · [21-client-security](../backend/21-client-security.md) · ADR-0029/0030/0033

---

### S3 — Worker + employer onboarding

1. Worker profile + availability  
2. Employer org + verification_status  
3. Branches + geo  
4. Policies accept  
5. Screens: onboarding wizards (WizardShell)  

**Cases:** CASE-WORKER-PROFILE, CASE-EMPLOYER-BRANCH  

---

### S4 — Jobs + tokens hold + matching feed

1. Job catalog + create/publish  
2. Token account + hold on publish (ledger)  
3. Matching hard filters + `GET /jobs/feed`  
4. Worker feed + job detail screens  

**Cases:** CASE-JOB-POSTING, CASE-TOKEN (hold), CASE-MATCHING  

---

### S5 — Apply → review → accept

1. Applications state machine + snapshot  
2. Employer review accept/reject  
3. Overlap rules (defaults)  
4. Inbox + outbox + **real FCM HTTP v1** (sandbox Firebase); deep links  
5. Screens both sides  

**Cases:** CASE-APPLICATION, CASE-EMPLOYER-REVIEW, CASE-NOTIFICATIONS  

**Exit:** E2E Journey 1 through accept + FCM delivery attempt to a registered token.

---

### S6 — Day-of (3h + check-in)

1. Availability confirm + no-response release (30m default)  
2. Geofence check-in + manual confirm + dispute  
3. Push templates for day-of  
4. R5 screens  

**Cases:** CASE-AVAILABILITY-3H, CASE-CHECKIN, CASE-LOCATION  

---

### S7 — Ratings, favorites, documents

1. Bidirectional ratings + window  
2. Favorites + favorites-only jobs  
3. Documents upload/signed download via **MinIO/S3** (real objects)  
4. Token capture/release + admin credit / sandbox top-up (**real ledger**)  

**Cases:** CASE-RATINGS, CASE-FAVORITES, documents gaps  

---

### S8 — Admin ops (all CASE-* domains)

1. Implement full admin matrix — [web/08](../web/08-admin-case-coverage.md) · ADR-0034  
2. People: users, workers, employers, branches, verification, documents  
3. Marketplace: jobs, catalog, matching diagnostics, applications  
4. Lifecycle: shifts, disputes, tokens ledger, ratings  
5. Notify: outbox + broadcast; abuse + risk queues  
6. Platform: policies, remote config, audit, dashboard + perf metrics  
7. **DevOps:** error ingest + triage + releases + services + clients — [web/09](../web/09-admin-devops.md) · ADR-0035  
8. **DevOps MCP:** `apps/devops-mcp` tools → Nest admin devops APIs — [web/10](../web/10-devops-mcp.md) · ADR-0036  
9. **Legal audit:** `audit` module + `w.admin.audit.*` CSV/PDF — [backend/22](../backend/22-legal-audit-logger.md) · [web/11](../web/11-legal-audit-reports.md) · ADR-0037  
9. Nest admin APIs + AuthZ for each surface (real DB)  

**Cases:** **All 19 CASE-*** groups (ops surfaces) + DevOps/operability  
**Exit:** Every row in web/08 §2 has a working `w.admin.*` screen; DevOps errors flow from API + admin SPA (+ mobile); MCP tools authenticated — no domain gaps.

---

### S9 — Hardening & polish

1. A11y pass P0 screens  
2. UX CASE-UX T-235–T-243  
3. Load-test scripts skeleton  
4. OpenAPI publish in CI  
5. Stage B BullMQ flag (off by default)  
6. Confirm **PM2** ecosystem + staging reload path — [web/05](../web/05-pm2.md) · ADR-0031  
7. Confirm **NGINX** templates + SSE proxy settings — [web/06](../web/06-nginx.md) · ADR-0032  

---

## Per-slice workflow (mandatory)

```text
A. Read slice row in 05-slice-catalog (files + cases + docs)
B. Grounding: open CASE + domain REST map + screen catalog; list T-### from files (07-anti-hallucination)
C. Apply agent defaults for any gap-* touched (cite gap id)
D. Implement backend first (schema → service → controller) — paths from docs only
E. Add/adjust Zod contracts / error codes from shared/12
F. Mobile and/or admin UI — only catalog screen IDs
G. Tests with case tags that exist in JSON
H. Run gate 07 §7; update nothing in architecture unless ADR change requested
I. Next slice
```

---

## Stop conditions

| Stop | Action |
| --- | --- |
| Local health fails | Fix before new features |
| User says pause | Pause |
| Prod deploy without AO-10 | Keep Compose/staging; ask only for vendor choice if they demand prod |

---

## Related

- Roadmap: [`../02-product-roadmap.md`](../02-product-roadmap.md)  
- E2E journeys: [`../cases/02-e2e-journeys.md`](../cases/02-e2e-journeys.md)  
