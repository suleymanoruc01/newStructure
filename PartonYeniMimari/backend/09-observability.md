# 09 — Gözlemlenebilirlik ve operasyonlar

**Durum:** proposed  
**Son güncelleme:** 2026-10-07

Ayrıntılı SLO'lar, kapasite hedefleri ve bulut bölgesi operasyonları **açık** durumdadır ([AO-4](../01-architecture-decisions.md)). Bu belge asgari çalışma taslağıdır.

## Hedefler

API'nin sağlıklı olup olmadığını, bir isteğin neden başarısız olduğunu ve vaka testi hatalarının sunucu günlüklerine nasıl eşlendiğini bilmek.

## Sağlık

| Uç nokta | Anlamı |
| --- | --- |
| GET /health/live | Süreç çalışıyor |
| GET /health/ready | Veritabanına (ve kuyruğa) erişilebiliyor |

PostgreSQL kapalıysa hazır olma denetimi başarısız olur.

## Günlükleme

- Yapılandırılmış JSON günlükleri
- Alanlar: requestId, userId (varsa), route, latencyMs, errorCode
- OTP kodlarını, erişim jetonlarını veya tam telefon + kod çiftlerini asla günlüğe yazmayın
- Nest istisna filtresi hataları kararlı kodlara + günlük önem düzeyine eşler

## Ölçümler (asgari)

- Rotaya göre istek oranı / gecikme / hata oranı
- OTP gönderme / doğrulama başarı oranı
- Veritabanı havuzu kullanımı
- Outbox / kuyruk gecikmesi (etkinleştirildiğinde)

## İzleme

OpenTelemetry daha sonra eklenebilir; başlangıçta uçtan uca istek kimliklerini kullanın (RN başlığı → API → işçi).

## Ortamlar ve yapılandırma

| Değişken (örnekler) | Amaç |
| --- | --- |
| DATABASE_URL | Postgres |
| JWT_ACCESS_SECRET | Erişim jetonları |
| JWT_REFRESH_SECRET | Yenileme jetonları |
| SMS_* | Sağlayıcı |
| FCM_* / APNS_* | Push |
| LOG_LEVEL | Ayrıntı düzeyi |

Başlangıçta şema doğrulaması yapan Nest ConfigModule kullanın.

## Dağıtım notları (üst düzey)

- Geçişleri dağıtımdan önce/dağıtım sırasında çalıştırın; yeni kod sütunlara ihtiyaç duyduktan sonra çalıştırmayın
- Hazır olma eşikleriyle aşamalı dağıtım
- Hazırlık şeması üretim şemasını yansıtır

## Vaka testi desteği

WhatsApp / elle Parton çalıştırmaları için hazırlık ortamı başlangıç profilleri:

- Başvuru yapmaya hazır çalışan
- Doğrulanmış şubesi olan işveren
- O şubeyle sınırlandırılmış yönetici
- Coğrafi yarıçap içinde açık iş

Başlangıç kimliklerini ileride oluşturulacak shared/fixtures.md içinde belgeleyin.

## Açık sorular

| Kimlik | Soru |
| --- | --- |
| OPS-1 | Barındırma + yönetilen Postgres sağlayıcısı |
| OPS-2 | Günlük hedefi (CloudWatch, Axiom, Grafana Cloud, …) |
