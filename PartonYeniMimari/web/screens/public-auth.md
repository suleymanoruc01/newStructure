# Web — Genel sayfalar ve kimlik doğrulama ekranları

**Durum:** proposed  
**Nest modülleri:** auth, users, policies, employers

---

## w.public.landing — Tanıtım açılış sayfası

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | / |
| **Rol** | Genel |
| **Amaç** | Çalışanlar ve işverenler için marka + değer önerileri; konsola/mağazaya yönlendirme |
| **MVP** | P1 |
| **Düzen** | Üst tanıtım alanı, iki CTA (İşveren girişi / Uygulamayı indir), özellik bölümleri, hukuk altbilgisi |
| **Eylemler** | İşveren girişi; uygulama mağazası rozetleri; iletişim |
| **Vakalar** | CASE-UX |
| **Notlar** | Tasarımda önce markayı öne çıkaran açılış sayfası kurallarını izleyin; ilk görünümde gösterge paneli kalabalığı olmasın |

---

## w.public.pricing — Fiyatlandırma

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /pricing |
| **Amaç** | Jeton / provizyon modelini açıklamak |
| **MVP** | P2 |
| **Vakalar** | CASE-TOKEN |

---

## w.public.legal.privacy / w.public.legal.terms

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /legal/privacy · /legal/terms |
| **MVP** | P0 |
| **Amaç** | Statik hukuk metinleri; kabul için sürümler policies modülünde eşlenir |
| **Vakalar** | CASE-SECURITY |

---

## w.auth.login — Telefonla giriş

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /login |
| **Rol** | Misafir |
| **Amaç** | İşveren (ve ayrı ana makineden yönetici) için OTP akışını başlatmak |
| **MVP** | P0 |
| **Düzen** | Ortalanmış kart: telefon, CTA, çalışanlar için mobil uygulama bağlantısı |
| **Eylemler** | Kod gönder; Çalışan mısınız? → mağaza bağlantıları |
| **API** | POST /api/v1/auth/otp/request |
| **Vakalar** | CASE-AUTH |
| **Notlar** | v1'de çalışan web uygulaması yok — metin çalışanları RN uygulamasına yönlendirir |

---

## w.auth.otp — OTP doğrulama

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /login/otp |
| **MVP** | P0 |
| **API** | POST /api/v1/auth/otp/verify |
| **Vakalar** | CASE-AUTH, CASE-SECURITY |
| **Başarı sonrası** | İşveren kurulumu eksikse ilk kurulum; değilse gösterge paneli. İşveren değilse bilgilendirme + uygulama bağlantıları |

---

## w.auth.policies — Politika eşiği

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /policies/accept |
| **MVP** | P0 |
| **API** | Politika kabul uç noktaları |
| **Vakalar** | CASE-AUTH |

---

## w.employer.onboarding — Web ilk kurulum sihirbazı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /onboarding |
| **Rol** | İşveren |
| **Amaç** | Şirket → ilk şube → sektör → jeton tanıtımı |
| **MVP** | P0 |
| **Düzen** | Yatay adım göstergesi (masaüstü); ilerleme sunucu tarafında kaydedilir |
| **Eylemler** | İleri / Geri / Tamamla → gösterge paneli |
| **API** | employers, branches, industries |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-E2E, CASE-UX |
| **Eşdeğerlik** | Daha geniş formlar/haritayla mobil işveren ilk kurulumunu yansıtır |
