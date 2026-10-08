# 11 — Jetonlar ve provizyon (CASE-TOKEN)

**Durum:** proposed  
**Vakalar:** T-149–T-163 (+ E2E T-203, T-209, T-214, T-220, T-225)  
**Modül:** birinci sınıf Nest tokens modülü

## Neden ayrı birinci sınıf modül?

Jeton bekletme/tahsilatı para işlemlerine yakındır ve iş yayımlama, çalışan sayısı değişikliği, işe gelmeme, işe giriş ve itirazlarda kullanılır. Bunlar jobs üzerinde gelişigüzel alanlar olmamalıdır.

## Kayıt defteri modeli

| Kavram | Anlamı |
| --- | --- |
| balance | Harcanabilir jetonlar |
| hold | Açık kontenjan yerleri için ayrılan |
| capture | Katılım doğrulanınca yapılan kesin düşüş |
| release | Bekletilen miktarı bakiyeye geri ekleme |
| top_up | Ödemeden gelen bakiye yüklemesi |

~~~mermaid
stateDiagram-v2
  [*] --> Kullanılabilir
  Kullanılabilir --> Bekletildi: yayımla / kontenjanı artır
  Bekletildi --> Kullanılabilir: işi iptal et / azalt / işe gelmeyince serbest bırak
  Bekletildi --> TahsilEdildi: başarılı işe giriş veya elle onay
  Kullanılabilir --> Kullanılabilir: bakiye yükle
~~~

## Kurallar (katalogdan)

| Kural | Vakalar |
| --- | --- |
| Yayımlama için available >= headcount gerekir | T-149, T-150 |
| Bekletme miktarı = çalışan sayısı | T-151, T-220 |
| Yayımlanmamış/açık işi iptal et → bekletmeleri serbest bırak | T-152 |
| Başvuru/kabul yoksa kapatma/süre sonlanmasında serbest bırak | T-153, T-154 |
| Kabul edildi ama işe gelmedi → serbest bırakma veya ceza politikası (open) | T-155 |
| İşe giriş / elle onay → katılımcı başına 1 jeton tahsil et | T-156, T-203 |
| Çok kişili işte kısmi katılım → kısmi tahsilat | T-157, T-225 |
| Kontenjanı artır → ek bekletme yap veya engelle | T-158 |
| Kontenjanı azalt → fazla bekletmeyi serbest bırak | T-159 |
| Idempotent işlemler (ağ yeniden denemelerine dayanıklı) | T-160, T-232, T-233 |
| Başarısız ödeme → iş taslak kalır | T-161 |
| Tüm hareketlerin geçmişi | T-162 |
| Arayüzde bakiye anında güncellenir | T-163 |

## Önerilen tablolar

- token_accounts (employer_id, balance)
- token_holds (job_id, seat_index?, amount, status)
- token_ledger_entries (id, employer_id, type, amount, ref_type, ref_id, idempotency_key, created_at)

## REST API

Genel (işverenin kullandığı):

~~~http
GET  /api/v1/employers/me/tokens
GET  /api/v1/employers/me/tokens/ledger
POST /api/v1/employers/me/tokens/top-ups   # ödeme niyeti
~~~

jobs / shifts tarafından kullanılan dahili Nest servis metotları (süreç içi — ikinci bir HTTP API değil):

- holdForJob(jobId, headcount, idemKey)
- adjustHold(jobId, newHeadcount, idemKey)
- releaseHold(jobId, reason, idemKey)
- captureForShift(shiftId, idemKey)

## Arayüz

- Mobil: m.employer.tokens.root
- Web: w.employer.tokens.overview, w.employer.tokens.history
- UX T-243: metin bekletme ile tahsilat farkını açıklamalı

## Açık ürün soruları

| Kimlik | Soru |
| --- | --- |
| TK-1 | can_come dedikten sonra işe gelmeme: ücret tahsil et, serbest bırak veya yalnızca ihlal mi yaz? |
| TK-2 | GPS elle doğrulanırsa her zaman jeton tahsil edilsin mi? |
| TK-3 | Ödeme sağlayıcısı |
