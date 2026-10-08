# 10 — Eski Firebase → Nest eşlemesi

**Durum:** legacy-ref + geçiş kılavuzu  
**Son güncelleme:** 2026-10-07

Firestore biçimlerini değil, **yetenekleri** dönüştürmek için [parton-codebase-wiki](../../parton-codebase-wiki/) dosyalarını incelerken bu belgeyi kullanın.

## Platform değişikliği

| Eski | Yeni |
| --- | --- |
| Kotlin istemcisi + Firebase arka ucu | RN/web istemcileri + Nest **REST API** + PostgreSQL |
| Firestore dinleyicileri | Açık REST isteği (/api/v1); olaylar için push |
| Firebase Auth | REST üzerinden Nest OTP + JWT |
| Firestore güvenlik kuralları | Nest REST koruyucuları + SQL kısıtları |
| Firebase projesi üzerinden FCM | FCM/APNs sürer; jetonlar REST üzerinden kaydedilir |
| Remote Config | policies / uygulama yapılandırması REST'i + tablolar |
| Sözleşme olarak istemci SDK'sı | Nest REST denetleyicilerinden OpenAPI |

## Depo → modül eşlemesi

| Eski alan (örnekler) | Nest modülü |
| --- | --- |
| FirebaseAuthRepository, OtpAuthRepository, DataStoreSessionRepository | auth |
| FirebaseUserProfileRepository, EnsureRoleDocumentUseCase | users |
| Çalışan ilk kurulumu / istatistikleri | workers |
| İşveren ilk kurulumu / sektör kapsamı | employers |
| FirebaseBranchRepository, yönetici kodu atayıcı | branches |
| FirestoreJobRepository, iş kataloğu, işveren/yönetici işleri | jobs |
| FirebaseJobApplicationsRepository | applications |
| İş akışı / eşleştirmeyle ilgili istemci mantığı | matching |
| FirebaseActiveShiftRepository, yerel vardiya varlıkları | shifts |
| FirebaseLocationRepository | location |
| Puanlama depoları / bekleyen puanlar | ratings |
| Favori arayüzü/verisi | favorites |
| Bildirim depoları + SyncFcmTokenUseCase | notifications |
| Politika kabulü / uzaktan yapılandırma | policies |
| Destek kayıtları | moderation (daha sonra) |

## Taşınmaması gerekenler

Şunları **yeniden oluşturmayın**:

1. Tek kimlik modeli olarak belge başına “rol belgeleri” — ilişkisel rollere normalleştirin.
2. İşe giriş / başvuru için yalnızca istemci tarafı doğrulama — sunucu durum makinelerine taşıyın.
3. Varsayılan mobil kalıbı olarak sınırsız gerçek zamanlı dinleyiciler — ekran odağında veri getir + uyarılar için push.
4. Wiki dizinlerinde bulunabilecek eski Firebase müze/demo kalıntıları — yok sayın.

## Veri taşıma yaklaşımı

| Seçenek | Ne zaman |
| --- | --- |
| Boş veritabanıyla sıfırdan başlama | Ürünü sıfırlamak kabul edilebilirse tercih edilir |
| Firestore dışa aktarımını tek seferde SQL'e taşıma | Yalnızca üretim kullanıcılarının geçmişi koruması gerekiyorsa |

Karar: open (ürün kararı). Aksi belirtilmedikçe mimari sıfırdan başlangıç varsayar.

## Vaka kataloğu sürekliliği

Kabul envanteri olarak [parton_case_tests_tr.json](../../parton_case_tests_tr.json) kullanılmaya devam edilsin. Her Nest modülü PR'ında açıklamaya etkilenen CASE-* gruplarını yazın.

## İlgili wiki sayfaları

- Mimari haritası: parton-codebase-wiki/02-architecture-map.md
- API/servis envanteri: parton-codebase-wiki/05-api-services-modules.md
- Veri akışı: parton-codebase-wiki/08-data-flow-and-side-effects.md
- Vaka haritası: parton-codebase-wiki/11-parton-case-map.md
