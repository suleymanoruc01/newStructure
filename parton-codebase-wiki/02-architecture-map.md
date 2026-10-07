# Mimari Harita Wiki: StaffMatch

Bu sayfa kaynak bağlantılı mimari harita iskeletidir. Zayıf çıkarımlar manuel inceleme sonrası doğrudan dosya kanıtı ile değiştirilmelidir.

## Top-Level Alanlar

| Alan | İndekslenen Dosya Sayısı |
| --- | --- |
| `build.gradle.kts` | 1 |
| `composeApp` | 631 |
| `gradle` | 1 |
| `iosApp` | 23 |
| `list.json` | 1 |
| `parton-case-results.json` | 1 |
| `settings.gradle.kts` | 1 |

## Katman Dağılımı

| Katman | İndekslenen Dosya Sayısı |
| --- | --- |
| `Kotlin / Android` | 612 |
| `Paylaşılan config` | 47 |

## Top-Level Alan Grafiği

```mermaid
flowchart LR
  Repo["Repo"]
  Repo --> area_build_gradle_kts["build.gradle.kts (1)"]
  Repo --> area_composeapp["composeApp (631)"]
  Repo --> area_gradle["gradle (1)"]
  Repo --> area_iosapp["iosApp (23)"]
  Repo --> area_list_json["list.json (1)"]
  Repo --> area_parton_case_results_json["parton-case-results.json (1)"]
  Repo --> area_settings_gradle_kts["settings.gradle.kts (1)"]
```

## Katman Dağılım Grafiği

```mermaid
pie title Katman Dağılımı
  "Kotlin / Android" : 612
  "Paylaşılan config" : 47
```

## Mimari Anlatım

- Giriş noktaları ve bootstrap sırası: doğrudan kaynak bağlantılarıyla belgelenmelidir.
- Feature/modül sahipliği: her top-level alanın sorumluluğu açıklanmalıdır.
- Katman sınırları: UI, domain, data, native/platform, backend sınırı ve test sorumlulukları ayrılmalıdır.
- Bilinmeyenler: incelenen kodla kanıtlanmayan her şey açık bırakılmalıdır.
