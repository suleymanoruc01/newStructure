# Bilinmeyenler ve Çelişkiler Wiki: StaffMatch

## Varsayımlar ve Bilinmeyenler

| Alan | Varsayım / Bilinmeyen | Etki | Gerekli Doğrulama |
| --- | --- | --- | --- |
| Tamamlanacak | Tamamlanacak | Tamamlanacak | Tamamlanacak |

## Çelişkiler

| Alan | Gözlenen Çelişki | Olası Etki | Önerilen Takip |
| --- | --- | --- | --- |
| Tamamlanacak | Tamamlanacak | Tamamlanacak | Tamamlanacak |

## Belirsizlik Karar Ağacı

```mermaid
flowchart TD
  Signal["Sinyal var"] --> Proof{"Doğrudan repo kanıtı var mı?"}
  Proof -->|Evet| Covered["Covered veya Partially Covered"]
  Proof -->|Hayır| Unknown["Unclear / Bilinmeyen"]
  Unknown --> Validate["Doğrulama ihtiyacı yaz"]
  Covered --> Tests{"Test kanıtı var mı?"}
  Tests -->|Evet| Confidence["Güven yükselir"]
  Tests -->|Hayır| Partial["Test kalitesi düşer"]
```

## Konservatif Kural

- Eksik kanıt küçük not değildir; durum ve güven skorunu değiştirir.
- Backend veya SDK sahipli davranış, repo kanıtlamıyorsa bilinmeyen kalmalıdır.
