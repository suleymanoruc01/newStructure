# 04 — Alan modülleri

**Durum:** proposed (adlar geçici)  
**Son güncelleme:** 2026-10-07  
**Not:** Kesinleşen mimari karara göre alan modülü **adları** özellik kapsamı belirlenince kesinleşir ([AO-5](../01-architecture-decisions.md)). Aşağıdaki katalog, eski sistem + CASE-* gruplarından oluşturulmuş çalışma haritasıdır; kesinleşmiş ad listesi değildir.

PartOn için sınırlı bağlamlar. Eski depolar ve CASE-* gruplarından eşlenmiştir.

## Modül kataloğu

| Nest modülü | Sahip olduğu alan | Temel vaka grupları | Eski sistem işaretleri |
| --- | --- | --- | --- |
| auth | OTP (+ isteğe bağlı e-posta/parola), oturumlar, yenileme, çıkış, cihaz sinyalleri | CASE-AUTH, CASE-SECURITY | FirebaseAuthRepository, OtpAuthRepository |
| users | Hesap kimliği, roller, yasaklar, telefon/e-posta benzersizliği | CASE-AUTH, CASE-ABUSE | FirebaseUserProfileRepository |
| workers | Profil, müsaitlik, demografi, belgeler, ev konumu | CASE-WORKER-PROFILE | Çalışan ilk kurulumu / profil |
| employers | Kurum ilk kurulumu, vergi no, **doğrulama durumu**, sektör kapsamı | CASE-EMPLOYER-BRANCH, CASE-AUTH (T-011–T-015) | İşveren ilk kurulumu |
| branches | Şubeler, coğrafi konum, yönetici kodları/üyeliği | CASE-EMPLOYER-BRANCH, CASE-LOCATION | FirebaseBranchRepository |
| jobs | Katalog + ilanlar, yalnızca favoriler işareti, kontenjan | CASE-JOB-POSTING, CASE-FAVORITES | İş depoları |
| tokens | Bakiye, bekletme, tahsilat, serbest bırakma, kayıt defteri, bakiye yükleme | CASE-TOKEN, CASE-E2E | (eski sistem zayıftı — yeni sahiplik) |
| applications | Başvur/geri çek + işveren incelemesi durum makinesi | CASE-APPLICATION, CASE-EMPLOYER-REVIEW | Başvuru depoları |
| matching | Kesin filtreler + sıralama + nedenler | CASE-MATCHING | Akış mantığı → sunucu |
| shifts | 3 saat kala onay, işe giriş/çıkış, itirazlar, elle onay | CASE-AVAILABILITY-3H, CASE-CHECKIN | Etkin vardiya depoları |
| location | Coğrafi çit politikası, doğruluk, sahte GPS sinyalleri | CASE-LOCATION, CASE-CHECKIN | Konum depoları |
| ratings | İki yönlü puanlar, zaman aralıkları, ortalamalar, metin filtresi | CASE-RATINGS | Puanlama depoları |
| favorites | Yönlü favoriler + özel işlere uygunluk | CASE-FAVORITES | Favori arayüzü |
| notifications | Şablonlar, outbox, push jetonları, gelen kutusu | CASE-NOTIFICATIONS | Bildirim + FCM |
| policies | Hukuki sürümler + kabul | CASE-AUTH | Politika depoları |
| moderation | Kötüye kullanım raporları, itiraz kuyruğu, risk işaretleri, yasaklar | CASE-ABUSE, CASE-SECURITY | Destek kayıtları |

Ayrıca: [11-jetonlar](11-tokens-and-provision.md), [12-eşleştirme](12-matching-rules.md), [13-konum](13-location-policy.md), [../cases/](../cases/).

## REST kaynak haritası

Genel yüzey yalnızca REST'tir ([06-api-conventions.md](06-api-conventions.md), [ADR-0004](adr/0004-rest-json-api.md)). Denetleyiciler kaynakları sunar; diğer modüller servisleri süreç içinde çağırır.

| Nest modülü | Temel REST kaynakları (/api/v1 altında) |
| --- | --- |
| auth | /auth/otp/*, /auth/token/refresh, /auth/logout |
| users | /me, /users/me/roles |
| workers | /workers/me, /workers/me/availability, /workers/me/documents, /workers/me/home |
| employers | /employers, /employers/me, /employers/me/setup-status, /employers/me/industries |
| branches | /branches, /branches/:id, /branches/manager-join, /branches/:id/managers |
| jobs | /jobs, /jobs/:id, /jobs/feed, /job-catalog, /branches/:id/jobs |
| tokens | /employers/me/tokens, /employers/me/tokens/ledger, /employers/me/tokens/top-ups |
| applications | /jobs/:id/applications, /applications/:id, .../accept|reject|withdraw |
| matching | GET /jobs/feed üzerinden kullanılır (+ GET /jobs/:id üzerinde uygunluk) |
| shifts | /shifts/:id, .../check-in, .../check-out, .../availability-confirm, .../disputes, .../manual-confirm |
| location | İşe girişe gömülü politika; v1'de ayrı genel konum CRUD'u yok |
| ratings | /ratings, /ratings/pending |
| favorites | /favorites |
| notifications | /notifications, /notifications/:id, .../read, /notifications/preferences |
| policies | /policies, /policies/acceptances |
| moderation | /moderation/reports (+ daha sonra yönetim rotaları) |

## Temel topluluklar (kavramsal)

~~~mermaid
erDiagram
  USER ||--o| WORKER_PROFILE : "olabilir"
  USER ||--o| EMPLOYER_MEMBERSHIP : "olabilir"
  USER ||--o| MANAGER_MEMBERSHIP : "olabilir"
  EMPLOYER ||--|{ BRANCH : "sahiptir"
  BRANCH ||--|{ JOB : "yayımlar"
  JOB ||--|{ APPLICATION : "başvuru alır"
  APPLICATION ||--o| SHIFT : "vardiyaya dönüşür"
  WORKER_PROFILE ||--|{ APPLICATION : "gönderir"
  WORKER_PROFILE ||--|{ AVAILABILITY_WINDOW : "bildirir"
  BRANCH ||--|{ RATING : "puan alır"
  USER ||--|{ DEVICE_PUSH_TOKEN : "kaydeder"
  EMPLOYER ||--|| TOKEN_ACCOUNT : "sahiptir"
  JOB ||--|{ TOKEN_HOLD : "rezervasyon yapar"
  WORKER_PROFILE ||--|{ WORKER_DOCUMENT : "yükler"
~~~

Kesin tablolar [05-data-layer.md](05-data-layer.md) ve ilerideki ERD çalıştaylarında belirlenir.

## Rol × modül matrisi

| Modül | Çalışan | İşveren | Yönetici |
| --- | --- | --- | --- |
| auth / users | ✓ | ✓ | ✓ |
| workers + documents | kendi | sınırlı oku | adayları oku |
| employers / branches | — | ✓ | kapsamlı |
| jobs | akışta oku | oluştur/yönet | kapsamlı oluştur/yönet |
| tokens | — | ✓ | sınırlı oku |
| applications | kendi | incele | kapsamlı incele |
| matching | kullan | kısıtları yapılandır | — |
| shifts / location | işe giriş / itiraz | izle / elle onayla | izle / onayla |
| ratings | ver/al | ver/al | — |
| notifications | kendi | kendi | kendi |
| favorites | ✓ | ✓ | — |
| moderation | bildir | bildir | bildir |

## Sunucu tarafında korunacak değişmezler

1. Bir oturumda kullanıcı başına en fazla bir birincil rol bağlamı vardır (rol değiştirme kuralları — open).
2. Yönetici eylemleri her zaman şubeyle sınırlandırılır.
3. Başvuru durum makinesini sunucu uygular (geçiş kuralları olmadan istemci “işe alındı” durumu atayamaz).
4. İşe giriş için geçerli atama + konum politikası + zaman aralığı gerekir (veya elle onay yolu).
5. Eşleştirme başka çalışanın kişisel verisini açığa çıkaramaz; yalnızca favorilere açık işler hedef dışındakilerden gizlenir.
6. OTP doğrulaması hız sınırına tabidir ve tek kullanımlıktır.
7. İş yayımlamak için işveren doğrulaması + yeterli jeton bakiyesi gerekir (T-015, T-149–T-150).
8. Jeton kayıt defteri işlemleri idempotenttir (T-160).
9. Kabul, kalan kontenjanı aşamaz (T-094).
10. Yasaklı kimlik (telefon/vergi/cihaz) yeniden kayıt olamaz (T-192).

## Önerilen uygulama sırası

1. auth + users + policies
2. workers (+ belgeler) + employers (+ doğrulama) + branches
3. tokens + jobs + applications
4. matching + favorites
5. location + shifts (3 saat + işe giriş + itiraz)
6. notifications + ratings
7. moderation / kötüye kullanım / yönetim riski

CASE-E2E yolculuklarıyla uyumludur ([../cases/02-e2e-journeys.md](../cases/02-e2e-journeys.md)).

## Açık sorular

| Kimlik | Soru |
| --- | --- |
| DM-1 | Tek users tablosu + rol tabloları mı, yoksa her rol için ayrı kimlik belgesi mi? |
| DM-2 | İş kataloğu başlangıç SQL verisi mi, CMS ile mi yönetilsin? |
| DM-3 | Müsaitlik aralıkları birinci sınıf tablo mu, JSON programı mı? |
| DM-4 | v1'de e-posta/parola kimlik doğrulaması olacak mı? (T-002, T-008, T-248) |
| DM-5 | 3 saat kala yanıt vermeme zaman aşımı politikası (T-117) |
| DM-6 | İşe gelmeme durumunda jetonu tahsil et mi, serbest bırak mı? (T-155) |
