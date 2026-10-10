# ADR-0034: Web admin covers all case-catalog feature domains

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0014](0014-web-ui-shadcn-dark.md) · [cases/03-ui-coverage-mandate.md](../../cases/03-ui-coverage-mandate.md) · [web/08-admin-case-coverage.md](../../web/08-admin-case-coverage.md) · [`parton_case_tests_tr.json`](../../../parton_case_tests_tr.json)

## Context

`parton_case_tests_tr.json` defines **248** cases across **19** groups. UI mandate already requires a screen somewhere (mobile and/or web). Platform **admin** previously listed only a subset of ops screens (users, abuse, catalog, perf), leaving gaps for worker profiles, documents, matching diagnostics, applications, shifts/3h/check-in disputes, tokens ledger, ratings moderation, and notification outbox. Agents could ship “admin MVP” without ops visibility into every product domain.

## Decision

1. **Web admin (`apps/admin`) must provide an ops surface for every `CASE-*` group** in the case JSON — see matrix [web/08](../../web/08-admin-case-coverage.md).  
2. Admin is **oversight / config / moderation / support** — **not** a clone of worker day-of mobile (check-in GPS, 3h confirm UX stay mobile-primary).  
3. Every group maps to **named `w.admin.*` screen ID(s)** with components and case IDs; missing map = incomplete architecture.  
4. Admin inventory is **production-complete** — no “P2 later” for screens required by the matrix.  
5. Nest admin APIs (role `admin`) back these screens; AuthZ never lives only in the SPA (ADR-0011 / ADR-0018).  
6. Employer console (`w.employer.*`) remains separate and **not** a substitute for admin coverage.

## Consequences

### Positive

- Ops can investigate any case-domain failure  
- Agents cannot skip admin slices for “mobile-only” domains  
- Aligns with CASE-ABUSE / PERF / SECURITY already admin-centric  

### Negative / tradeoffs

- Larger admin IA / nav  
- More admin REST endpoints  

### Follow-ups

- Keep [web/08](../../web/08-admin-case-coverage.md) in sync when cases are added  
- Impersonation remains disabled by default (`open`)  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| Admin only abuse + users | **Reject** — leaves feature-domain gaps |
| Admin = full employer/worker twin | **Reject** — wrong channel; mobile owns day-of |
| Employer console substitutes for admin | **Reject** — different AuthZ audience |
