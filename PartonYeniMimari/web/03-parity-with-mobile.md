# 03 — Web ↔ mobil eşdeğerliği

**Durum:** `proposed`  
**Son güncelleme:** 2026-10-07

Nest alan kuralları ortaktır; mobil uygulama **REST** `/api/v1` kullanır. Yönetim arayüzü Nest uygulamasında barındırılır. Ayrı işveren web konsolu v1 için kesinleşmiş bir sınır değildir.

## Sahiplik matrisi

| Yetenek | Mobil RN | Web konsolu |
| --- | --- | --- |
| Çalışan kimlik doğrulama / profil / akış / başvuru | **Birincil** | v1'de yok |
| 3 saat kala onay / işe giriş / konum | **Yalnızca birincil** | Yalnızca rapor/denetim |
| İşveren ilk kurulumu | Desteklenir | **Birincil** (daha kapsamlı formlar) |
| İş oluşturma | Desteklenir | **Birincil** |
| Başvuru inceleme | Desteklenir | **Birincil** |
| Şube + yönetici davetleri | Desteklenir | **Birincil** |
| Jeton özeti | Desteklenir | **Birincil** + kayıt defteri |
| Bildirim gelen kutusu | **Birincil** | Desteklenir |
| Puanlama oluşturma | **Birincil** | Desteklenir |
| Kötüye kullanım bildirimi | Desteklenir | Desteklenir |
| Platform yönetimi | Sınırlı | **Birincil** |
| Tanıtım | Mağaza bağlantıları | **Birincil** |

## Kimlik eşleştirmeleri (seçili)

| Mobil | Web |
| --- | --- |
| `m.employer.home.root` | `w.employer.dashboard` |
| `m.employer.jobs.list` | `w.employer.jobs.list` |
| `m.employer.jobs.create.step*` | `w.employer.jobs.create` |
| `m.employer.applicants.*` | `w.employer.applicants.*` |
| `m.employer.branches.*` | `w.employer.branches.*` |
| `m.employer.tokens.root` | `w.employer.tokens.overview` |
| `m.auth.phone` / `otp` | `w.auth.login` / `otp` |
| — | `w.admin.*` (mobil karşılığı yok) |
| `m.worker.*` | — (v1'de web karşılığı yok) |

## Paylaşılan kurallar

1. **Durum makineleri aynı** — kabul/ret/işe giriş sonuçları kanala göre değişmez.
2. **Hata kodları aynı** — RN ve web aynı `error.code` değerlerini eşler.
3. **Yetkilendirme aynı** — web arayüzünde gizlemek güvenlik değildir; REST koruyucuları uygular.
4. **Tasarım sistemleri** görsel olarak farklı olabilir; bilgi mimarisi etiketleri uyumlu kalmalıdır (İşler, Adaylar, Şubeler, Jetonlar).

## Teslimat önerisi

| Aşama | Yayımla |
| --- | --- |
| Aşama A | Mobil çalışan + işveren P0 + Nest kimlik doğrulama/işler/başvurular |
| Aşama B | Web işveren konsolu (işler + adaylar + şubeler + jetonlar) |
| Aşama C | Yönetim kötüye kullanım/katalog/politikaları |
| Aşama D | Web analiz/raporlar + mobil P1/P2 cilası |
