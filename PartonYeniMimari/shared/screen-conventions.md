# Paylaşılan ekran kuralları

**Durum:** `accepted`  
**Son güncelleme:** 2026-10-07

[`../mobile/`](../mobile/) ve [`../web/`](../web/) ekran notlarında kullanılan kurallar.

## Ekran kimliği biçimi

```text
{channel}.{role}.{area}.{name}
```

| Bölüm | Değerler |
| --- | --- |
| `channel` | `m` (mobil RN), `w` (web) |
| `role` | `auth`, `worker`, `employer`, `manager`, `admin`, `shared`, `public` |
| `area` | kısa alan adı: `home`, `jobs`, `apps`, `shift`, `profile`, … |
| `name` | kebab biçimli ekran kısa adı |

Örnekler: `m.worker.jobs.detail`, `w.employer.jobs.create`, `w.admin.users.list`

## Ekran tanımı şablonu

Her ekran notu şu alanları kullanır:

| Alan | Anlamı |
| --- | --- |
| **ID** | Kararlı ekran kimliği |
| **Name** | Kullanıcıya gösterilen başlık |
| **Route** | Yol / derin bağlantı |
| **Role** | Ekranı kimler açabilir |
| **Purpose** | Tek cümlelik amaç |
| **MVP** | `P0` / `P1` / `P2` |
| **Entry** | Kullanıcı buraya nasıl gelir |
| **Layout** | Bölgeler / ana arayüz |
| **Actions** | Birincil + ikincil eylemler |
| **States** | yükleniyor / boş / hata / engellendi |
| **API** | `/api/v1` altındaki Nest REST yolları (+ sahip modül) |
| **Cases** | `CASE-*` grupları |
| **Legacy** | Varsa eski Kotlin ekranı |
| **Notes** | Uç durum kuralları |

## Kanal sahipliği

| Yetenek | Mobil | Web |
| --- | --- | --- |
| OTP ile giriş | Birincil | Desteklenir (işveren/yönetici) |
| Çalışan iş akışı / başvuru | Birincil | v1'de planlanmıyor |
| İşe giriş / coğrafi konum | Yalnızca birincil kanal | Hayır |
| İşveren ilan oluşturma / adaylar | Desteklenir | Birincil (masaüstü yoğunluğu) |
| Yönetici vardiya günü operasyonları | Birincil | Daha sonra isteğe bağlı |
| Platform yönetimi / kötüye kullanım | Sınırlı | Birincil |
| Tanıtım / açılış sayfası | Yumuşak geçiş | Birincil |

## Gezinme ilkeleri

1. Rol seçimi / oturum geri yüklemesinden sonra rol gezinme grafikleri ayrıdır.
2. Derin bağlantılar kimlik doğrulama + rol + ilk kurulum eşiklerinden geçirilir.
3. Push bildirimi doğrulamasız ham derin URL'yi değil, belirli ekran kimliğini açar.
4. Yıkıcı eylemler onay ister; geri alınamaz sunucu geçişleri sonuç durumunu gösterir.

## Durum sözlüğü

| Durum | Arayüz beklentisi |
| --- | --- |
| `loading` | İskelet / dönen gösterge; sahte veri yok |
| `empty` | Açıklama + eylem çağrısı |
| `error` | Yeniden dene + yararlıysa hata kodu |
| `offline` | Mobil: kuyruk veya yeniden deneme bandı |
| `blocked` | Kısıtlama / bakım / zorunlu güncelleme |
| `partial` | Mevcut bölümleri göster; başarısız olanları belirt |

## Çapraz bağlantılar

- Arka uç modülleri: [`../backend/04-domain-modules.md`](../backend/04-domain-modules.md)
- API tarzı: [`../backend/06-api-conventions.md`](../backend/06-api-conventions.md)
- Vaka kataloğu: [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json)
