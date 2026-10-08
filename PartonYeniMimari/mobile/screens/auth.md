# Mobil — Kimlik doğrulama ve ilk kurulum ekranları

**Durum:** proposed  
**Nest modülleri:** auth, users, policies, workers, employers, branches

---

## m.auth.tutorial — Uygulama tanıtımı

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /auth/tutorial |
| **Rol** | Kimlik doğrulanmamış / ilk açılış |
| **Amaç** | 2–4 slaytta çalışan ve işveren için sunulan değeri açıkla |
| **MVP** | P2 |
| **Giriş** | İlk kurulum; atlanabilir |
| **Düzen** | Tam ekran kaydırmalı tanıtım, atla + ileri |
| **Eylemler** | Atla → telefon; Bitti → telefon |
| **Durumlar** | — |
| **API** | yok |
| **Vakalar** | CASE-UX |
| **Eski ekran** | AppTutorialScreen |

---

## m.auth.phone — Telefon girişi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /auth/phone |
| **Rol** | Misafir |
| **Amaç** | E.164 biçiminde telefon al ve OTP akışını başlat |
| **MVP** | P0 |
| **Giriş** | Tanıtım / soğuk açılış / çıkış |
| **Düzen** | Ülke kodu + telefon alanı; birincil CTA; hukuk bağlantıları |
| **Eylemler** | Devam et → OTP iste; Politikaları aç |
| **Durumlar** | doğrulama hatası; hız sınırı; ağ hatası |
| **API** | POST /api/v1/auth/otp/request |
| **Vakalar** | CASE-AUTH, CASE-SECURITY |
| **Eski ekran** | PhoneEntryScreen, LoginScreen, SignInScreen, SignUpScreen (tek telefon yolunda birleştir) |
| **Notlar** | Ürün e-posta gerektirmedikçe ayrı giriş/kayıt yerine tek telefon akışını tercih et (open — katalogda e-posta kaydı geçiyor) |

---

## m.auth.otp — OTP doğrulama

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /auth/otp?challengeId= |
| **Rol** | Misafir (doğrulama isteğine bağlı) |
| **Amaç** | SMS kodunu doğrula; oturum aç |
| **MVP** | P0 |
| **Giriş** | Telefon girişinden |
| **Düzen** | Maskelenmiş telefon, 6 haneli giriş, yeniden gönderim sayacı, numara değiştir |
| **Eylemler** | Doğrula; Yeniden gönder; Numarayı değiştir |
| **Durumlar** | yanlış kod; süresi dolmuş; kilitli; başarı → rol eşiği |
| **API** | POST /api/v1/auth/otp/verify; oturum jetonları güvenli saklanır |
| **Vakalar** | CASE-AUTH, CASE-SECURITY, CASE-TOKEN (oturum jetonları) |
| **Eski ekran** | OtpScreen |

---

## m.auth.role-select — Rol seçimi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /auth/role |
| **Rol** | Kimliği doğrulanmış, etkin rolü yok / ilk kullanım |
| **Amaç** | Çalışan / İşveren / Yönetici yolunu seç |
| **MVP** | P0 |
| **Giriş** | OTP sonrası veya rol eksikse |
| **Düzen** | Üç rol kartı + kısa açıklamalar |
| **Eylemler** | Rolü seç → rol API'sini doğrula → ilk kurulum |
| **Durumlar** | gönderim hatası; rol zaten varsa atla |
| **API** | POST /api/v1/users/me/roles (veya eşdeğeri) |
| **Vakalar** | CASE-AUTH, CASE-E2E |
| **Eski ekran** | RoleSelectScreen |

---

## m.auth.policies — Politika kabulü

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /auth/policies |
| **Rol** | Kimliği doğrulanmış |
| **Amaç** | Uygulamayı kullanmadan önce gerekli hukuki belgeleri kabul ettir |
| **MVP** | P0 |
| **Giriş** | İmzalanmamış politika sürümü bulunduğunda eşik olarak |
| **Düzen** | Web görünümünde/Markdown'da açılabilen belge listesi; kabul kutusu; CTA |
| **Eylemler** | Belgeyi aç; Tümünü kabul et |
| **Durumlar** | Gerekiyorsa kabul etmeden önce kaydır/aç; hata |
| **API** | GET /api/v1/policies; POST /api/v1/policies/acceptances |
| **Vakalar** | CASE-AUTH, CASE-SECURITY |
| **Eski ekran** | Politika kullanım senaryoları / uzaktan yapılandırma |

---

## m.worker.onboarding.profile — Çalışan profili kurulumu

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /onboarding/worker/profile |
| **Rol** | Çalışan |
| **Amaç** | Başvuru yetkisini açmak için kimlik + beceriler + temel müsaitlik bilgilerini al |
| **MVP** | P0 |
| **Giriş** | Rol seçimi → çalışan; eksik profil eşiği |
| **Düzen** | Çok adımlı sihirbaz: kişisel bilgiler → beceriler/sektörler → müsaitlik önizlemesi → onay |
| **Eylemler** | İleri / Geri / Kaydet ve bitir |
| **Durumlar** | alan doğrulaması; eksik profil daha sonra başvuruyu engeller |
| **API** | PATCH /api/v1/workers/me; müsaitlik uç noktaları |
| **Vakalar** | CASE-WORKER-PROFILE, CASE-APPLICATION (eksik profil başvuruyu engeller) |
| **Eski ekran** | EmployeeProfileSetupScreen |

---

## m.employer.onboarding.business — İşveren şirket kurulumu

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /onboarding/employer/business |
| **Rol** | İşveren |
| **Amaç** | İşveren kurumu + ilk sektör bağlamını oluştur |
| **MVP** | P0 |
| **Giriş** | Rol seçimi → işveren |
| **Düzen** | Şirket alanları, gerekiyorsa vergi/kimlik, sektör seçiciler |
| **Eylemler** | Devam et → ilk şube formu |
| **Durumlar** | doğrulama; yinelenen şirket kuralları (open) |
| **API** | POST /api/v1/employers |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-E2E |
| **Eski ekran** | İşveren ilk kurulum maketleri / şirket ekranları |

---

## m.employer.onboarding.checklist — İşveren kontrol listesi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /onboarding/employer/checklist |
| **Rol** | İşveren |
| **Amaç** | Kalan kurulum adımlarını göster: şube, jetonlar, ilk iş |
| **MVP** | P1 |
| **Giriş** | Şirket oluşturulduktan sonra; ana sayfanın boş durumu |
| **Düzen** | Durum göstergeleri + derin bağlantılar içeren kontrol listesi satırları |
| **Eylemler** | Şube formuna / jetonlara / iş oluşturmaya git |
| **API** | GET /api/v1/employers/me/setup-status |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-UX |
| **Eski ekran** | EmployerChecklistScreen |

---

## m.manager.onboarding.join — Yönetici olarak katıl

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /onboarding/manager/join |
| **Rol** | Yönetici |
| **Amaç** | Davet/yönetici koduyla yöneticiyi şubeye bağla |
| **MVP** | P0 |
| **Giriş** | Rol seçimi → yönetici |
| **Düzen** | Kod girişi + başarıda şube önizlemesi |
| **Eylemler** | Kodu gönder; Desteğe ulaş |
| **Durumlar** | geçersiz/süresi dolmuş kod; zaten bağlı |
| **API** | POST /api/v1/branches/manager-join |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-SECURITY |
| **Eski ekran** | ManagerCodeAllocator akışları |
