# Mimari Karar Kayıtları (Arka uç)

NestJS API'sini şekillendiren kararların kısa kayıtları.

## Dizin

| ADR | Başlık | Durum |
| --- | --- | --- |
| [0001](0001-nestjs-modular-monolith.md) | NestJS modüler monoliti (API + yönetim) | accepted |
| [0002](0002-postgresql-owned-db.md) | Tek doğruluk kaynağı olarak sahip olunan PostgreSQL | accepted |
| [0003](0003-orm-choice.md) | ORM seçimi (PG 18'de Prisma 7+ önerisi) | proposed |
| [0004](0004-rest-json-api.md) | Genel API olarak REST / JSON (`/api/v1`) | accepted |
| [0005](0005-monorepo.md) | Ayrı mobil ve arka uç uygulamalarını içeren monorepo | accepted |
| [0006](0006-bare-react-native-no-expo.md) | Çıplak React Native — Expo yasak | accepted |

Ürün düzeyinde kesinleşen/açık kararlar: [`../../01-architecture-decisions.md`](../../01-architecture-decisions.md).

## Ne zaman ADR eklenmeli?

- Geri alınması zor bir kütüphane seçerken (ORM, kuyruk, kimlik doğrulama protokolü)
- Modül sınırlarını veya çok kiracılı modeli değiştirirken
- Önemli bir alternatifi (ör. GraphQL, mikroservisler, REST dışı istemci protokolleri) reddederken

## Şablon

```markdown
# ADR-NNNN: Başlık

**Tarih:** YYYY-MM-DD
**Durum:** proposed | accepted | superseded

## Bağlam
## Karar
## Alternatifler
## Sonuçlar
```
