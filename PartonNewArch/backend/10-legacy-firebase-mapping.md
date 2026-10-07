# 10 — Legacy Firebase → Nest mapping

**Status:** `legacy-ref` + migration guide  
**Last updated:** 2026-10-07

Use this when reading [`parton-codebase-wiki`](../../parton-codebase-wiki/) so we translate **capabilities**, not Firestore shapes.

## Platform shift

| Legacy | New |
| --- | --- |
| Kotlin client + Firebase backend | RN/web clients + Nest **REST API** + PostgreSQL |
| Firestore listeners | Explicit REST fetch (`/api/v1`); push for events |
| Firebase Auth | Nest OTP + JWT over REST |
| Firestore security rules | Nest REST guards + SQL constraints |
| FCM via Firebase project | Still FCM/APNs, tokens registered through REST |
| Remote Config | `policies` / app-config REST + tables |
| Client SDK as contract | OpenAPI from Nest REST controllers |

## Repository → module map

| Legacy area (examples) | Nest module |
| --- | --- |
| `FirebaseAuthRepository`, `OtpAuthRepository`, `DataStoreSessionRepository` | `auth` |
| `FirebaseUserProfileRepository`, `EnsureRoleDocumentUseCase` | `users` |
| Employee onboarding / stats | `workers` |
| Employer onboarding / industry scope | `employers` |
| `FirebaseBranchRepository`, manager code allocator | `branches` |
| `FirestoreJobRepository`, job catalog, employer/manager jobs | `jobs` |
| `FirebaseJobApplicationsRepository` | `applications` |
| Jobs feed / matching-related client logic | `matching` |
| `FirebaseActiveShiftRepository`, local shift entities | `shifts` |
| `FirebaseLocationRepository` | `location` |
| Rating stores / pending ratings | `ratings` |
| Favorites UI/data | `favorites` |
| Notification repos + `SyncFcmTokenUseCase` | `notifications` |
| Policy acceptance / remote config | `policies` |
| Tickets | `moderation` (later) |

## Anti-port list

Do **not** recreate:

1. Per-document “role documents” as the only identity model — normalize into relational roles.
2. Client-only validation for check-in / apply — move to server state machines.
3. Unbounded realtime listeners as default mobile pattern — fetch on screen focus + push for alerts.
4. Museum / sample Firebase demo leftovers if present in wiki indexes — ignore.

## Data migration stance

| Option | When |
| --- | --- |
| Greenfield empty DB | Preferred if product reset is acceptable |
| One-shot Firestore export → SQL | Only if production users must keep history |

Decision: `open` (product call). Architecture assumes greenfield unless stated otherwise.

## Case catalog continuity

Keep using [`parton_case_tests_tr.json`](../../parton_case_tests_tr.json) as acceptance inventory. For each Nest module PR, list touched `CASE-*` groups in the description.

## Related wiki pages

- Architecture map: `parton-codebase-wiki/02-architecture-map.md`
- API/services inventory: `parton-codebase-wiki/05-api-services-modules.md`
- Data flow: `parton-codebase-wiki/08-data-flow-and-side-effects.md`
- Case map: `parton-codebase-wiki/11-parton-case-map.md`
