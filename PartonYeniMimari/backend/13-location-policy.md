# 13 — Konum ve coğrafi çit politikası (CASE-LOCATION + CHECKIN)

**Durum:** proposed  
**Vakalar:** T-125–T-135, T-136–T-148, E2E T-201–T-202, T-210–T-214  
**Modüller:** location, shifts, branches, moderation

## Hedefler

1. Coğrafi çit merkezi olarak şube koordinatlarını esas al (T-136–T-137).
2. Yapılandırılabilir yarıçapla işe giriş doğrula (T-138–T-139).
3. Bilinen GPS sorunlarında (kapalı alan/AVM/yüksek bina/kırsal) dolandırıcılığa kapı açmadan arayüzü esnekleştir (T-140–T-143).
4. Sahte GPS / konum yanıltma girişimlerini reddet (T-131, T-148, T-188).
5. GPS başarısız ama çalışan iş yerindeyse elle onay + itiraz olanağı sun (T-134–T-135, T-212–T-213).

## İşe giriş karar ağacı

~~~mermaid
flowchart TB
  Start[İşe giriş isteği] --> Perm{Konum izni var mı?}
  Perm -->|hayır| DenyPerm[Reddet T-132]
  Perm -->|evet| Mock{Sahte GPS sinyali var mı?}
  Mock -->|evet| DenyMock[Reddet + risk olayı T-131/T-148]
  Mock -->|hayır| Window{Zaman aralığında mı?}
  Window -->|hayır| DenyTime[Erken/geç reddet T-129/T-130]
  Window -->|evet| Dist{Mesafe <= yarıçap mı?}
  Dist -->|evet| Acc{Doğruluk kabul edilebilir mi?}
  Acc -->|evet| Pass[Başarılı → jeton tahsilat yolu]
  Acc -->|esnek| Soft[İnceleme işaretiyle kabul et veya yarıçapı genişlet]
  Dist -->|hayır| FailGeo[Reddet T-126]
  FailGeo --> Dispute[İtiraz olanağı sun T-135]
  Dispute --> Emp[İşveren elle onaylar T-134]
~~~

## Yapılandırma (yönetim w.admin.config.remote)

| Anahtar | Örnek | Vakalar |
| --- | --- | --- |
| geofence.radius_m | 50 / 100 | T-138, T-139 |
| geofence.max_accuracy_m | 30–80 | T-127 |
| geofence.soft_radius_m | Kapalı alan desteği 150 | T-140–T-142 |
| checkin.early_minutes | 15 | T-129 |
| checkin.late_minutes | 30 | T-130 |
| location.require_background | v1'de false | T-146 |

## Platform notları

| Konu | Öneri | Vakalar |
| --- | --- | --- |
| iOS ve Android | İzin metinlerini ve doğruluk API'lerini ayrı ayrı belgeleyin | T-147 |
| Wi-Fi desteği | Birleşik konumu isteğe bağlı kullan; tek başına güven kaynağı olmasın | T-144 |
| Hareket hâlindeyken işe giriş | Kararlı örnek veya kısa bekleme iste | T-145 |
| Arka plan konumu yok | v1 işe girişinde yalnızca ön plan konumu | T-146 |

## Kalıcılık ve gizlilik (CASE-SECURITY)

- İşe giriş olayını kaydet: enlem/boylam/doğruluk/zaman damgası/cihaz işaretleri — sürekli iz kaydı tutma (T-250)
- Erişim imzalı olmalı; genel günlüklerde yer almamalı (T-252)
- Saklama politikası open

## REST API'leri

~~~http
POST /api/v1/shifts/:id/check-in
POST /api/v1/shifts/:id/disputes
POST /api/v1/shifts/:id/manual-confirm   # işveren/yönetici
~~~

## Ekranlar

- m.worker.shift.check-in
- m.worker.shift.dispute (**yeni**)
- m.employer.shift.manual-confirm / w.employer.shift.attendance (**yeni**)
