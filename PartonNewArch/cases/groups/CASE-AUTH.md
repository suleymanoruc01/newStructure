# CASE-AUTH — Kayıt / Giriş / Hesap Yönetimi

**Cases:** 15  
**Source group description:** Kayıt, giriş, oturum, hesap oluşturma ve hesap güvenliği akışları.

## Required capabilities
- Phone OTP registration/login with expiry, wrong-code, lockout (T-005–T-007)
- Email registration path (T-002) — product must confirm if v1
- Password strength rules if password accounts exist (T-008); password reset security (see CASE-SECURITY T-248)
- Unique phone constraint (T-003); incomplete field validation (T-004)
- Location permission NOT required to finish registration (T-009); defer to check-in
- Post-register profile completion gate before apply (T-010)
- Employer org registration with firm fields (T-011–T-012)
- Unique tax ID / vergi no (T-013)
- Branch create only for authorized employer (T-014)
- Block job publish until firm verification complete (T-015)

## Nest modules
`auth`, `users`, `policies`, `employers`, `branches`

## Architecture
- App architecture §10: [`../../04-application-architecture.md`](../../04-application-architecture.md)
- Auth & RBAC: [`../../backend/18-auth-rbac.md`](../../backend/18-auth-rbac.md) · [ADR-0011](../../backend/adr/0011-auth-rbac.md)
- Checklist: [`../../backend/07-auth-security.md`](../../backend/07-auth-security.md)

## Screens
`m.auth.*`, `w.auth.*`, onboarding wizards

## Acceptance focus
Critical: T-003, T-005, T-006, T-009, T-014, T-015


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-001` | Geçerli telefon numarası ile kayıt | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-002` | Geçerli e-posta ile kayıt | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-003` | Aynı telefon ile ikinci kez kayıt engeli | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-004` | Eksik alanlarla kayıt denemesi | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-005` | Yanlış SMS doğrulama kodu | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-006` | Süresi geçmiş doğrulama kodu | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-007` | Çok sayıda yanlış kod girişinde bloke | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-008` | Zayıf şifre ile kayıt denemesi | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-009` | Konum izni vermeden kayıt tamamlama | Kritik | Fonksiyonel | İşçi kayıt senaryoları |
| `T-010` | Kayıt sonrası profil tamamlama zorunluluğu | Orta | Fonksiyonel | İşçi kayıt senaryoları |
| `T-011` | Geçerli firma bilgileri ile kayıt | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-012` | Eksik firma bilgileri ile kayıt denemesi | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-013` | Aynı vergi numarası ile mükerrer hesap kontrolü | Orta | Fonksiyonel | İşveren kayıt senaryoları |
| `T-014` | Yetkisiz kullanıcının şube açma denemesi | Kritik | Fonksiyonel | İşveren kayıt senaryoları |
| `T-015` | Firma doğrulaması olmadan ilan açma denemesi | Kritik | Fonksiyonel | İşveren kayıt senaryoları |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)