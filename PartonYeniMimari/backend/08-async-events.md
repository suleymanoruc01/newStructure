# 08 — Asenkron işler ve olaylar

**Durum:** proposed  
**Son güncelleme:** 2026-10-07

## Neden asenkron?

PartOn'daki bazı akışlar HTTP isteğini bekletmemelidir:

- Push bildirimi dağıtımı
- Eşleştirme puanını yeniden hesaplama / akış oluşturma
- SMS yeniden denemeleri
- Kötüye kullanım buluşsal kontrolleri
- Vardiya tamamlandıktan sonra puanlama hatırlatmaları

## Yaklaşım

**Başlangıç (kesinleşti):** Ayrı işçi uygulaması/süreci yok. Nest istek yolu veritabanına yazar + **outbox satırı** ekler; yan etkileri **süreç içi** tüketici (veya Nest zamanlanmış görevleri) yürütür.

**Daha sonra (gerektiğinde):** Ayrı işçi ve/veya Redis + BullMQ (veya eşdeğeri) ekleyin. Yatay ölçekleme, bağlantı havuzu, önbellek ve gözlemlenebilirlik için [../01-architecture-decisions.md](../01-architecture-decisions.md) içindeki ölçeklenebilirlik bölümüne bakın.

~~~mermaid
flowchart LR
  API[Nest işleyici] -->|işlem| DB[(PostgreSQL)]
  API -->|aynı işlem| OB[outbox_events]
  Drain[Süreç içi tüketici] --> OB
  Drain --> Push[FCM/APNs]
  Drain --> SMS[SMS]
  Drain --> Match[Eşleştirme işleri]
~~~

## Alan olayları (örnekler)

| Olay | Üretenler | Tüketiciler | Katalog |
| --- | --- | --- | --- |
| user.registered | auth | notifications, policies | CASE-AUTH |
| job.published | jobs | matching, notifications | T-100, T-107–T-108 |
| application.submitted | applications | notifications | T-101 |
| application.accepted / rejected | applications | shifts, notifications, tokens | T-102–T-103, T-096–T-097 |
| shift.confirm_3h_due | scheduler | notifications | T-104, T-114 |
| shift.checkin_due | scheduler | notifications | T-105, T-123 |
| shift.availability_declined | shifts | notifications, tokens | T-116, T-119 |
| shift.checked_in | shifts | notifications, tokens capture | T-133, T-156 |
| shift.dispute_opened | shifts | notifications, moderation | T-135, T-212 |
| shift.completed | shifts | ratings schedule (+24h) | T-106, T-172 |
| favorite.job_for_audience | jobs/favorites | notifications | T-107–T-108 |

CASE-NOTIFICATIONS değişmezleri: yinelenen bildirim yok (T-110), doğru derin bağlantı (T-109), push kapalıysa gelen kutusuna düşür (T-111), asla yanlış kullanıcıya gönderme (T-113).

Olay yüklerini küçük tutun (kimlikler + tür); ayrıntıları tüketiciler yüklesin.

## Nest kalıpları

- Gerektiğinde içe aktarılan özel sağlayıcıları tercih edin (NotificationsDispatcher, MatchingScheduler)
- Daha gevşek bağlılık için monolit **içinde** dahili bir EventBus (Nest EventEmitter veya CQRS) kullanın
- Ham olay veri yolunu genel internete açmayın

## Güvenilirlik kuralları

1. Yan etkiler işlemden sonra (veya outbox üzerinden) çalışır — kullanıcı satırı oluşmadan SMS göndermeyin
2. Tüketiciler idempotent olmalı (işlenmiş event_id tablosu)
3. Artan bekleme süresiyle yeniden deneyin; bozuk iletileri ölü harfe ayırın
4. Gözlemlenebilirlik: kuyruk derinliği, hata oranı, gecikme

## Eşzamanlı/asenkron karar kılavuzu

| Eşzamanlı yap | Asenkron yap |
| --- | --- |
| Kimlik doğrulama yanıtını doğrula | “İş buldun” push bildirimi |
| Başvuru satırı oluştur | Çok sayıda çalışan için akışı yeniden hesapla |
| İşe giriş doğrulama sonucu | Vardiya sonrası puanlama hatırlatması |

## İlgili vaka grupları

CASE-NOTIFICATIONS, CASE-MATCHING, CASE-PERF, CASE-E2E
