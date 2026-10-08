# 05 — Veri katmanı (PostgreSQL)

**Durum:** proposed  
**Son güncelleme:** 2026-10-07

## Kararlar

| Konu | Seçim | Durum |
| --- | --- | --- |
| Veritabanı | PostgreSQL 18+ (denetlediğimiz, kendi yönettiğimiz/yönetilen örnek) | accepted (ana sürüm 18 önerisi [radarda](../03-tech-radar-2026.md)) |
| ORM | Şema öncelikli Prisma 7+ + sürücü bağdaştırıcısı — onay bekliyor | proposed → [ADR-0003](adr/0003-orm-choice.md) |
| Genel kimlikler | Sıralı varlıklar için UUIDv7 (uuidv7() veya uygulama tarafı) | proposed |
| Geçişler | Sürümlü, CI tarafından uygulanır; üretimde db push / sync yok | accepted |
| UUID birincil anahtarlar | Genel kimliklerde uuid / ulid | proposed |
| Mantıksal silme | Kullanıcıya dönük varlıklarda deleted_at tercih edilir | proposed |
| Çok kiracılı yapı | Paylaşılan veritabanı, işveren/şubeye göre satır kapsamı | accepted |

## İlkeler

1. **PostgreSQL tek doğruluk kaynağıdır** — mobil önbellek veya Firestore değil.
2. **Şema Git'te tutulur** — her değişiklik bir geçiş ve inceleme gerektirir.
3. **Bütünlük, normalleştirmemeden önce gelir** — yalnızca ölçülmüş bir okuma yolu için (ör. akış) denormalizasyon yapın.
4. **Kişisel veriyi en aza indirin** — ürünün ihtiyaç duyduğu veriyi saklayın; gerektiğinde şifreleyin/özetleyin (OTP sırları, jetonlar).
5. **Coğrafi veri** — konum sorguları gerektirdiğinde PostGIS kullanın; v1 için daha basitse enlem/boylam + yarıçap yardımcılarıyla başlayın (open).
6. **Mobil uygulama modelleri içe aktarmaz** — ORM varlıkları/şeması apps/backend içinde kalır; istemciler yalnızca paylaşılan API şemalarını kullanır.

## Mantıksal şemalar (ad alanları)

PostgreSQL şemaları veya açık tablo önekleri kullanın — iskelet oluştururken birini seçin.

| Alan | Örnek tablolar |
| --- | --- |
| Kimlik | users, user_roles, otp_challenges, refresh_sessions, auth_bans, device_fingerprints |
| Kurum | employers (+ tax_id, verification_status), branches, branch_managers |
| Çalışan | worker_profiles (+ age/gender/home_geo), availability_windows, worker_sectors, worker_occupations, worker_documents |
| İşler | job_catalog_items, jobs (+ favorites_only, gender_filter, headcount), job_required_documents |
| Jetonlar | token_accounts, token_holds, token_ledger_entries |
| İşe alım | applications, application_events |
| Vardiya günü | shifts, availability_confirms, check_ins, check_in_disputes, location_events |
| Sosyal | ratings, favorites |
| İletişim | notifications, device_push_tokens |
| Uyumluluk | policy_documents, policy_acceptances |
| Operasyon | outbox_events, abuse_reports, risk_events |

## İşlem yönergeleri

- Birden fazla tabloyu değiştiren her kullanım senaryosu için tek veritabanı işlemi kullanın (başvuru + bildirim outbox'ı).
- Yan etkilerde çift yazma yerine **işlemsel outbox** kullanın (push/SMS).
- Harici HTTP çağrıları boyunca uzun işlemlerden kaçının.

## İlk aşama indeksleme beklentileri

| Erişim biçimi | İndeks önerisi |
| --- | --- |
| Telefona göre kullanıcı | Normalleştirilmiş telefon üzerinde benzersiz indeks |
| Şube + durum + start_at alanlarına göre işler | Bileşik indeks |
| İş + çalışana göre başvurular | Etkin kayıtlar için benzersiz (job_id, worker_id) |
| Coğrafya / sektör akışı | Eşleştirme tasarımına bağlı |
| Kullanıcı + oluşturulma zamanına göre bildirimler | Bileşik indeks |

## Geçiş iş akışı

~~~text
şemayı düzenle → geçiş oluştur → SQL'i incele → yerelde uygula → CI hazırlığa uygulasın → üretime uygula
~~~

Hazırlık ortamı başlangıç betikleri Parton vaka çalıştırmalarını desteklemelidir (çalışan + işveren + şube + açık iş).

## Bilinçli olarak taşımadıklarımız

| Eski yapı | Neden olduğu gibi taşınmıyor |
| --- | --- |
| Her toplama için Firestore koleksiyonları | Belge biçimi ≠ ilişkisel sahiplik |
| Etkin vardiyanın doğruluk kaynağı olarak istemci Room veritabanı | Çevrimdışı veri önbellektir; işe girişi sunucu doğrular |
| Her yerde Firebase zaman damgaları | timestamptz kullanın |

## Açık sorular

| Kimlik | Soru |
| --- | --- |
| DL-1 | İlk günden PostGIS mi, önce enlem/boylam + Haversine mi? |
| DL-2 | İşler için mantıksal silme mi, arşiv tabloları mı? |
| DL-3 | Salt okunur kopya ne zaman ayrılmalı? |
