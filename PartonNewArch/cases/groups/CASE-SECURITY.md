# CASE-SECURITY — Güvenlik ve Veri Koruma Testleri

**Cases:** 9  
**Source group description:** Yetkilendirme, veri koruma, hassas veri, erişim kontrolü ve güvenlik akışları.

## Required capabilities
- Object-level authZ own data only (T-244–T-245)
- Unauthenticated/unauthorized API rejected (T-246)
- Session security (refresh rotation, logout) (T-247)
- Password reset hardening if passwords exist (T-248)
- Document URLs not publicly guessable (T-249)
- Location data retention/minimization (T-250)
- Mask sensitive fields in UI (T-251)
- No secrets in logs (T-252)

## Nest modules
guards, storage signed URLs, logging redaction


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-244` | Kullanıcı yalnızca kendi verisini görebiliyor mu | Kritik | Güvenlik | — |
| `T-245` | İşveren sadece kendi adaylarını görebiliyor mu | Kritik | Güvenlik | — |
| `T-246` | Yetkisiz API erişim testi | Kritik | Güvenlik | — |
| `T-247` | Oturum yönetimi güvenliği | Kritik | Güvenlik | — |
| `T-248` | Şifre sıfırlama güvenliği | Kritik | Güvenlik | — |
| `T-249` | Belge dosyalarının yetkisiz erişime kapalı olması | Kritik | Güvenlik | — |
| `T-250` | Konum verisinin güvenli saklanması | Kritik | Güvenlik | — |
| `T-251` | Hassas alanların gereksiz gösterilmemesi | Kritik | Güvenlik | — |
| `T-252` | Loglarda hassas veri sızıntısı olmaması | Kritik | Güvenlik | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)