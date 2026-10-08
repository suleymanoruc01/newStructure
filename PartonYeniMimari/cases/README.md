# Parton vakalarının mimariyle izlenebilirliği

**Kabul testleri için tek doğruluk kaynağı:** [`../../parton_case_tests_tr.json`](../../parton_case_tests_tr.json) (248 vaka / 19 grup)

Bu klasör katalogdaki her vakayı Nest modülleri, ekranlar ve açık boşluklarla ilişkilendirir. Bu vakaları kullanan aşamalı teslimat: [`../02-product-roadmap.md`](../02-product-roadmap.md).

## Okuma sırası

| Belge | Amaç |
| --- | --- |
| [00-coverage-matrix.md](00-coverage-matrix.md) | 248 vakanın tamamı → modüller / ekranlar / mimari durumu |
| [01-gap-backlog.md](01-gap-backlog.md) | PartonYeniMimari / üründe kapatılacak boşluklar ve kısmi işler |
| [02-e2e-journeys.md](02-e2e-journeys.md) | Mimari kabul betikleri olarak CASE-E2E yolculukları |
| [groups/](groups/) | Kurallar + kontrol listesiyle her `CASE-*` için bir dosya |

## Teslimatta nasıl kullanılır?

1. Bir modülü uygulamadan önce `CASE-*` grubu seçin.
2. Kontrol listesi satırlarının geçmesi için Nest kurallarını + REST `/api/v1` rotalarını uygulayın.
3. Mobil (ve Nest yönetim) ekranlarını grup dosyasında belirtilen sözleşmeye bağlayın.
4. PR'da vaka kimliklerini (`T-080`, `T-156`, …) ve REST yollarını belirtin.
5. Boşluk kapandığında matris durumunu güncelleyin.

## Anlık görüntü (oluşturuldu)

Geçerli `covered` / `partial` / `gap` sayıları için kapsam matrisinin altbilgisine bakın. Sayılar başlık + gruba göre kestirimidir; kararlar netleştikçe iyileştirin.
