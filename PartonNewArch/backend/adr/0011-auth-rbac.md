# ADR-0011: AuthN (OTP + JWT sessions) and RBAC + resource scope

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../18-auth-rbac.md`](../18-auth-rbac.md)

## Context

PartOn replaces Firebase Auth / Firestore security rules with a Nest-owned API. The marketplace has distinct actors (worker, employer, branch manager, platform admin), branch-scoped operations, verification gates, bans, and KVKK-sensitive identifiers (phone). Mobile screens must not be treated as an authorization boundary.

## Decision

1. **AuthN:** Phone OTP as primary login; short-lived **access JWT** + **rotating refresh sessions** stored hashed server-side (T-247).  
2. **AuthZ:** **RBAC + resource scope** (employer org / branch / ownership) evaluated on every protected REST route — AuthN → role → scope → domain invariants.  
3. **Roles modeled:** `worker`, `employer`, `manager`, `admin` via **memberships**, not a single mutable role column.  
4. **Active context** in JWT (`ctx.role`, `employerId`, `branchIds`); context switch via authenticated API — clients cannot forge roles.  
5. **Manager** is a first-class **branch membership** for AuthZ even while product AO-11 remains open for naming/UX.  
6. **One user account** may hold multiple memberships; use context switch (AS-3 default).  
7. **Email/password** remains optional/off until product locks AS-4.  
8. Policy acceptance and ban checks gate session issuance; verification gates publish (T-015).  
9. Shared packages may hold role/permission **enums** only — policy engine stays in Nest.

## Alternatives

### Firebase Auth + custom claims only
- **Pros:** Fast  
- **Cons:** Continues vendor lock; weak alignment with Postgres SoR and branch scope  
- **Why not:** Rebuild owns identity in Nest/Postgres

### Pure ACL / per-row grants day-1
- **Pros:** Flexible  
- **Cons:** Heavy admin UX; overkill for v1 marketplace  
- **Why not:** Role + scope covers case catalog; fine-grain later for admin

### Separate login per role
- **Pros:** Simple tokens  
- **Cons:** Bad UX for managers who are also employers; duplicate phones  
- **Why not:** Prefer memberships + context switch

## Consequences

### Positive
- Clear guard pipeline; testable AuthZ; maps to CASE-AUTH / CASE-SECURITY  
- Manager screens and admin can ship without reinventing AuthZ  
- Aligns with privacy DSR (principal = user)  

### Negative / risks
- Context switch and membership model need careful UX  
- JWT claim staleness — mitigate with DB reload on writes  

### Follow-up
- Confirm AS-1 SMS provider  
- Confirm AO-11 product language for manager  
- Lock AS-4 email/password  
