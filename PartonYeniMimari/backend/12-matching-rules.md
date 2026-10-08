# 12 — Eşleştirme kuralları motoru (CASE-MATCHING)

**Durum:** proposed  
**Vakalar:** T-058–T-079 (+ E2E T-197 içinde akış görünürlüğü)  
**Modül:** matching (yalnızca sunucu; RN uygunluğu kendi başına belirlemez)

## İşlem hattı

~~~mermaid
flowchart LR
  Jobs[Yayımlanmış işler] --> Hard[Kesin filtreler]
  Hard --> Score[Puanla ve sırala]
  Score --> Feed[Çalışan akış sayfası]
~~~

## Kesin filtreler (işi gizlemeli)

| Filtre | Geçme koşulu | Vakalar |
| --- | --- | --- |
| Gün | Çalışanın müsaitliğinde iş günü bulunur | T-058, T-059 |
| Saat | Kapsama kuralına göre çalışan aralıkları iş saatlerini kapsar | T-060, T-061, T-071, T-072 |
| Sektör | Çalışan sektörleriyle kesişir | T-062, T-063, T-069 |
| Meslek | Çalışan meslekleriyle kesişir | T-064, T-065, T-070 |
| Belgeler | Çalışanda gereken tüm belge türleri vardır | T-066, T-067 |
| Demografi | Belirtilmişse yaş/cinsiyet iş kısıtlarına uyar | T-027, T-028, T-044 |
| Yalnızca favoriler | Çalışan işveren tarafından favorilenmiştir (veya karşılıklı — ürün kararı) | T-075, T-168, T-169 |
| Profil tamamlığı | Çalışan başvurabilir (başvuru anında da doğrulanır) | T-029, T-082 |
| İş durumu | Yayımlanmış, süresi dolmamış, boş kontenjanı var | T-083, T-084 |

### Saat kapsama kuralı (ürün kararı open)

| Kip | Anlamı | Vakalar |
| --- | --- | --- |
| full_cover | Çalışan aralığı iş aralığının tamamını kapsar | T-072 |
| partial_overlap | Herhangi bir örtüşme yeterlidir | T-071 |

Gece vardiyalarında (gece yarısını aşan) aralık normalleştirmesi kullanılmalı (T-019, T-073).

## Sıralama (esnek)

Önerilen puan bileşenleri (ağırlıklar yönetim yapılandırmasından ayarlanabilir):

| Sinyal | Etki | Vakalar |
| --- | --- | --- |
| Mesafe | Yakın olan üst sıraya çıkar | T-068, T-076 |
| Eşleşme puanı | Daha fazla eşleşen özellik daha yüksek puan getirir | T-077 |
| Favori işveren | Öncelik artışı | T-074, T-078 |
| Başlangıç zamanının yakınlığı | Daha yakındaki başlangıç üst sıraya çıkar | T-079 |

UX için istemciye matchReasons[] döndürün (T-238).

## Yeniden hesaplama tetikleyicileri

- Çalışanın müsaitlik/sektör/meslek/belge/demografi/konum değişikliği (T-026–T-028)
- İş yayımlama/düzenleme/kapatma
- Favori ekleme/kaldırma (T-171)

Büyük alıcı kümelerinde asenkron yeniden indeksleme tercih edilir (CASE-PERF T-228).

## REST API

Eşleştirme sunucu tarafındadır; istemciler yalnızca REST kullanır:

~~~http
GET /api/v1/jobs/feed?cursor=&limit=
GET /api/v1/jobs/:id   # mevcut kullanıcı için uygunluk + nedenleri içerir
~~~

## Karşı örüntüler

- Genel iş listesini yalnızca istemci tarafında filtrelemek
- Varlığı açığa çıkarıyorsa yalnızca favorilere açık işleri favori olmayanlara “gri” gösterme — gizlemek daha güvenli (T-075)
