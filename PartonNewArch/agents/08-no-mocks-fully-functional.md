# 08 — No mocks · fully functional (mandatory)

**Status:** `accepted`  
**Audience:** All AI coding agents  
**Entrypoint:** [`../AGENTS.md`](../AGENTS.md)

> **Mocks, noops, fakes, and “console stubs” are forbidden in application code.** Every vertical must be **fully functional** end-to-end against real Postgres and real (sandbox) external services. Prefer **fail-fast** over silent degradation.

---

## 1. Verdict

| Topic | Stance |
| --- | --- |
| App code mocks/noops | **Banned** |
| Fake success (check-in, pay, OTP, push) | **Banned** |
| Missing env | **Fail boot** with clear error — do not fall back to noop |
| SMS / FCM / storage | **Real providers** (sandbox/dev projects OK) |
| Ledger / AuthZ / matching / geofence | **Real domain logic** — no in-memory theatre |
| Tests | Prefer **integration against real Postgres** (Compose/testcontainers); do not mock domain services to greenwash coverage |
| Ask user | Only when a **required sandbox credential** is absent and you cannot create the project yourself |

---

## 2. Banned patterns

| Banned | Why |
| --- | --- |
| `NoopFcmProvider` / “log and skip push” as default | Push path must actually call FCM HTTP v1 |
| `ConsoleSmsProvider` / “OTP always 123456” in app | OTP must go through real SMS sandbox (or documented telephony test harness that **sends**) |
| Mock payment that returns success without ledger write | Tokens must move in Postgres |
| Soft-fail AuthZ that allows on error | Security theatre |
| In-memory “DB” for Nest modules | Postgres is SoR |
| Client-only matching/filter as source of truth | Server owns rules |
| `jest.mock` of the service under test to assert itself | Meaningless |
| UI buttons that toast success without REST | Not functional |
| Seed scripts that skip OTP by hardcoding sessions in prod paths | Dev seed may insert users **in DB**, but login path stays real OTP |

---

## 3. Required functional baselines

| Capability | Fully functional means |
| --- | --- |
| Auth | Real OTP request → SMS provider API → verify → JWT + refresh persisted correctly |
| REST | Hits Nest → Prisma → Postgres; envelope per ADR-0027 |
| Tokens | Hold/capture/release rows in ledger; balances consistent under concurrency |
| Matching | SQL/service filters; feed omits ineligible jobs |
| Check-in | Real geo math + policy; fail outside geofence (no fake pass) |
| Notify | Inbox + outbox row + **FCM HTTP v1 send** (sandbox Firebase project) |
| Documents | Real upload to MinIO/S3-compatible + signed download URL that works |
| Admin | Same domain services; real mutations |
| Mobile/Web | Real API client; Keychain/HttpOnly refresh; deep links resolve |

---

## 4. Local / CI infrastructure (real, not mocked)

| Dep | How |
| --- | --- |
| Postgres 18 | Docker Compose — required |
| Redis | Compose when Stage B enabled — real BullMQ |
| Object storage | **MinIO** in Compose (S3 API) — not a fake Map |
| SMS | Real provider **test/sandbox** credentials in `.env` (Netgsm/Twilio/etc. per product pick) |
| FCM | Real Firebase **project** service account JSON path in `.env` |
| Mobile push verify | Send to a dev device token or FCM topic dry-run **API** that hits Google |

`.env.example` lists every required key. Nest `ConfigModule` **refuses to start** if SMS/FCM/DB/JWT secrets missing in `development`/`production`.  
`test` env may point at Compose Postgres + sandbox keys from CI secrets — still **no noop providers**.

---

## 5. Interfaces OK — fake implementations not OK

```text
✅ SmsProvider interface + NetgsmSmsProvider / TwilioSmsProvider (wired)
❌ SmsProvider + ConsoleSmsProvider as the active binding

✅ FcmHttpV1Provider calling Google APIs
❌ FcmProvider that only logs payload

✅ TopUpProvider + admin credit use-case that writes ledger
❌ “MockPspProvider.success()” without persistence
```

Provider selection via env (`SMS_PROVIDER=twilio`) must resolve to a **real** class.

---

## 6. Agent workflow when credentials are missing

```text
1. Create Compose services + .env.example with required vars
2. STOP feature work that needs the missing integration
3. Ask user ONCE for sandbox credentials (SMS + FCM + optional storage cloud)
4. Do not invent Console/Noop “so we can continue”
5. Other slices that need only Postgres may continue
```

Do **not** mark notify/auth slices **done** without a successful real sandbox call recorded (log request id / provider message id).

---

## 7. Testing rules

| Allowed | Forbidden |
| --- | --- |
| Integration tests on Compose Postgres | Mocking Prisma to return fiction for domain asserts |
| HTTP e2e against running Nest | Skipping AuthZ in tests “for convenience” |
| Provider contract tests hitting **sandbox** APIs (rate-limited) | Asserting Noop was called |
| Test clocks / fixed UUID seeds | Fake geofence always-true |

Unit-test pure functions (geofence distance, ledger math) with real inputs/outputs — that is not a mock.

---

## 8. DoD additions (every slice)

- [ ] No `Noop*`, `Fake*`, `Mock*`, `ConsoleSms*` as active providers in `apps/*`  
- [ ] Feature works against Compose + sandbox with real side effects  
- [ ] Missing config fails boot (or fails the use-case loudly)  
- [ ] Case-tagged test hits real DB path where the rule lives  

---

## Related

- Defaults: [`02-defaults-and-non-asks.md`](02-defaults-and-non-asks.md)  
- Ops/envs: [`../07-environments-and-ops.md`](../07-environments-and-ops.md)  
- FCM: [`../backend/20-fcm-messaging.md`](../backend/20-fcm-messaging.md)  
- Testing: [`../06-testing-strategy.md`](../06-testing-strategy.md)  
