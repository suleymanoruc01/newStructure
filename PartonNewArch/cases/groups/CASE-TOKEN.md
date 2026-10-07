# CASE-TOKEN — Jeton / Provizyon

**Cases:** 15  
**Source group description:** Jeton, provizyon, bakiye, kullanım, iade ve işlem güvenliği akışları.

## Required capabilities
- Publish requires available balance (T-149–T-150)
- Hold = headcount (T-151); adjust on headcount change (T-158–T-159)
- Refund rules: cancel job, no applicants, no accepts, no-show vs checked-in capture (T-152–T-157)
- Partial capture for multi-headcount (T-157)
- Idempotent ledger — no double charge on retries (T-160)
- Failed payment leaves job unpublished/draft (T-161)
- Ledger history + live balance (T-162–T-163)

## Nest modules
**First-class `tokens` module** with ledger, holds, captures, releases


## Case checklist

| ID | Title | Priority | Type | Alt section |
| --- | --- | --- | --- | --- |
| `T-149` | Yeterli jeton ile ilan açılması | Kritik | İş Kuralı | — |
| `T-150` | Yetersiz jetonla ilan açamama | Kritik | İş Kuralı | — |
| `T-151` | Personel sayısı kadar jeton bloklama | Kritik | İş Kuralı | — |
| `T-152` | İlan iptalinde jeton iadesi | Kritik | İş Kuralı | — |
| `T-153` | Hiç başvuru gelmeyen ilanda jeton durumu | Kritik | İş Kuralı | — |
| `T-154` | Başvuru var ama onay yoksa jeton durumu | Kritik | İş Kuralı | — |
| `T-155` | Onay var ama işçi gelmediyse jeton durumu | Kritik | İş Kuralı | — |
| `T-156` | İşçi geldiğinde jetonun kesinleşmesi | Kritik | İş Kuralı | — |
| `T-157` | Çok kişili ilanda kısmi gelişte kısmi jeton düşüşü | Kritik | İş Kuralı | — |
| `T-158` | Personel sayısı artırıldığında ek provizyon | Kritik | İş Kuralı | — |
| `T-159` | Personel sayısı azaltıldığında iade | Kritik | İş Kuralı | — |
| `T-160` | Ağ hatasında çift jeton düşüşü engeli | Kritik | İş Kuralı | — |
| `T-161` | Başarısız ödeme sonrası ilanın durumu | Kritik | İş Kuralı | — |
| `T-162` | Jeton hareket geçmişi raporlama | Kritik | İş Kuralı | — |
| `T-163` | Anlık bakiye güncelleme | Kritik | İş Kuralı | — |

## Traceability

- Coverage matrix: [`../00-coverage-matrix.md`](../00-coverage-matrix.md)
- Gap backlog: [`../01-gap-backlog.md`](../01-gap-backlog.md)