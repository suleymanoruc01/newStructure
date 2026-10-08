# CASE-TOKEN — Jeton / Provizyon

**Vaka sayısı:** 15  
**Kaynak grup açıklaması:** Jeton, provizyon, bakiye, kullanım, iade ve işlem güvenliği akışları.

## Gerekli yetenekler
- Yayımlama için kullanılabilir bakiye gerekir (T-149–T-150)
- Bekletilen miktar = çalışan sayısı (T-151); çalışan sayısı değişince ayarla (T-158–T-159)
- İade kuralları: işi iptal etme, başvuru olmaması, kabul olmaması, işe gelmeme ve işe giriş yapanlardan tahsilat (T-152–T-157)
- Çok kişili işlerde kısmi tahsilat (T-157)
- Idempotent kayıt defteri — yeniden denemelerde iki kez ücret alma yok (T-160)
- Başarısız ödeme işi yayımlanmamış/taslak bırakır (T-161)
- Kayıt defteri geçmişi + canlı bakiye (T-162–T-163)

## Nest modülleri
Kayıt defteri, bekletme, tahsilat ve serbest bırakma içeren birinci sınıf jeton modülü

## Vaka kontrol listesi

| Kimlik | Başlık | Öncelik | Tür | Alternatif bölüm |
| --- | --- | --- | --- | --- |
| T-149 | Yeterli jeton ile ilan açılması | Kritik | İş Kuralı | — |
| T-150 | Yetersiz jetonla ilan açamama | Kritik | İş Kuralı | — |
| T-151 | Personel sayısı kadar jeton bloklama | Kritik | İş Kuralı | — |
| T-152 | İlan iptalinde jeton iadesi | Kritik | İş Kuralı | — |
| T-153 | Hiç başvuru gelmeyen ilanda jeton durumu | Kritik | İş Kuralı | — |
| T-154 | Başvuru var ama onay yoksa jeton durumu | Kritik | İş Kuralı | — |
| T-155 | Onay var ama işçi gelmediyse jeton durumu | Kritik | İş Kuralı | — |
| T-156 | İşçi geldiğinde jetonun kesinleşmesi | Kritik | İş Kuralı | — |
| T-157 | Çok kişili ilanda kısmi gelişte kısmi jeton düşüşü | Kritik | İş Kuralı | — |
| T-158 | Personel sayısı artırıldığında ek provizyon | Kritik | İş Kuralı | — |
| T-159 | Personel sayısı azaltıldığında iade | Kritik | İş Kuralı | — |
| T-160 | Ağ hatasında çift jeton düşüşü engeli | Kritik | İş Kuralı | — |
| T-161 | Başarısız ödeme sonrası ilanın durumu | Kritik | İş Kuralı | — |
| T-162 | Jeton hareket geçmişi raporlama | Kritik | İş Kuralı | — |
| T-163 | Anlık bakiye güncelleme | Kritik | İş Kuralı | — |

## İzlenebilirlik
- Kapsam matrisi: [../00-coverage-matrix.md](../00-coverage-matrix.md)
- Boşluk listesi: [../01-gap-backlog.md](../01-gap-backlog.md)
