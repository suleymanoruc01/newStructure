# 01 — Web bilgi mimarisi

**Durum:** proposed  
**Son güncelleme:** 2026-10-07

## Siteler / uygulamalar

| Yüzey | Ana makine (örnek) | Hedef kitle | Sınır durumu |
| --- | --- | --- | --- |
| Tanıtım | www.parton.* | Genel | İsteğe bağlı / daha sonra |
| İşveren konsolu | app.parton.* | İşveren | v1 için **kesinleşmedi** (öncelik mobilde) |
| Yönetim | admin.parton.* (veya API ana makinesinde yol) | İç operasyon | **Kesinleşti** — REST API ile aynı NestJS uygulaması |

Yönetim arayüzü sunum aracı (Nest'in sunduğu statik SPA, AdminJS vb.) henüz kararlaştırılmadı. Ürün işveren web konsolunu yeniden kesinleştirirse daha sonra REST /api/v1 kullanabilir.

## Üst düzey harita

~~~mermaid
flowchart TB
  subgraph public [Tanıtım]
    Landing[Açılış sayfası]
    Pricing[Fiyatlandırma]
    Legal[Hukuk]
  end
  subgraph console [İşveren konsolu]
    AuthWeb[Web kimlik doğrulama]
    EDash[Gösterge paneli]
    EJobs[İşler]
    EApps[Adaylar]
    EBranches[Şubeler]
    ETokens[Jetonlar]
    ETeam[Ekip / yöneticiler]
  end
  subgraph admin [Yönetim konsolu]
    AUsers[Kullanıcılar]
    AJobs[İş denetimi]
    AAbuse[Kötüye kullanım / destek talepleri]
    ACatalog[İş kataloğu]
    AConfig[Uygulama yapılandırması]
  end
  Landing -->|Giriş çağrısı| AuthWeb
  AuthWeb --> EDash
~~~

## İşveren konsolu kabuğu

~~~text
┌──────────────────────────────────────────────────────┐
│ Üst çubuk: kurum değiştirici · jeton · zil · avatar  │
├────────────┬─────────────────────────────────────────┤
│ Kenar çubuğu│ Ana içerik                             │
│ Gösterge    │                                         │
│ İşler       │                                         │
│ Adaylar     │                                         │
│ Şubeler     │                                         │
│ Ekip        │                                         │
│ Jetonlar    │                                         │
│ Ayarlar     │                                         │
└────────────┴─────────────────────────────────────────┘
~~~

Duyarlı tasarım: 1024 pikselin altında kenar çubuğu çekmeceye dönüşür; dar ekranlarda tablolar kart yığınlarına dönüşür (saha kullanımında RN mobil uygulaması ikincil değil, öncelikli kanaldır).

## Yönetim kabuğu

Operasyon odaklı gezinme ve daha belirgin denetim banner'larıyla aynı düzen; kullanıcı taklidi varsayılan olarak kapalıdır (open).

## Web kimlik doğrulama modeli

| Konu | Öneri |
| --- | --- |
| Giriş | Mobil ile aynı telefon OTP'si (e-posta sihirli bağlantısı daha sonra — open) |
| Oturum | Bellekte erişim JWT'si; httpOnly güvenli çerezde yenileme veya API ile uyumlu güvenli depolama yaklaşımı |
| CSRF | Çerezle yenileme kullanılırsa CSRF stratejisi gerekir |
| Roller | İşveren (konsol); yönetici (yönetim sitesi); web yöneticisi = P2 |

## Eşikler

- Kimlik doğrulanmamış → giriş
- Kimliği doğrulanmış ancak işveren kurumu olmayan → ilk kurulum sihirbazı
- Politika imzalanmamış → politika eşiği sayfası
- Bakım → statik bakım sayfası
