# Web — Yönetim konsolu ekranları

**Durum:** proposed  
**Nest modülleri:** admin / moderation, users, policies, jobs (katalog), config  
**Erişim:** Yalnızca admin rolü; ayrı ana makine önerilir

---

## w.admin.login — Yönetici girişi

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /login (yönetim ana makinesi) |
| **Amaç** | Ayrıcalıklı kimlik doğrulama (OTP ve/veya SSO — open) |
| **MVP** | P0 |
| **Vakalar** | CASE-SECURITY |
| **Notlar** | İşveren oturum çerezlerini ana makineler arasında yeniden kullanmayın |

---

## w.admin.dashboard — Operasyon gösterge paneli

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | / |
| **Amaç** | Kuyruk boyutları: açık kötüye kullanım bildirimleri, başarısız işler, olağandışı OTP oranları |
| **MVP** | P1 |
| **Vakalar** | CASE-PERF, CASE-ABUSE |

---

## Kullanıcılar ve işverenler

### w.admin.users.list / w.admin.users.detail

| Alan | Ayrıntı |
| --- | --- |
| **Yollar** | /users · /users/:id |
| **MVP** | P0 |
| **Amaç** | Kullanıcı ara; rolleri gör; kısıtla/kısıtlamayı kaldır; son eylemleri denetle |
| **Eylemler** | Hesabı kısıtla; oturumları zorla kapat; bağlı işveren/çalışanı görüntüle |
| **API** | Yönetici kullanıcı uç noktaları |
| **Vakalar** | CASE-SECURITY, CASE-ABUSE |

### w.admin.employers.list

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /employers |
| **MVP** | P0 |
| **Amaç** | Kurumları bul; şubeleri / jeton bakiyesini incele |
| **Vakalar** | CASE-EMPLOYER-BRANCH, CASE-TOKEN |

---

## İçerik ve işler

### w.admin.jobs.list

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /jobs |
| **MVP** | P1 |
| **Amaç** | İşleri denetle / kötüye kullanıma açık ilanları zorla kapat |
| **Vakalar** | CASE-JOB-POSTING, CASE-ABUSE |

### w.admin.catalog.manage — İş kataloğu CMS'si

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /catalog |
| **MVP** | P0 |
| **Amaç** | İş oluşturma sihirbazlarının kullandığı sektörleri / meslekleri yönet |
| **Düzen** | Ağaç veya tablo; yayımla/taslak |
| **API** | Yönetim katalog CRUD'u |
| **Vakalar** | CASE-JOB-POSTING |

---

## Kötüye kullanım ve politikalar

### w.admin.abuse.queue / w.admin.abuse.detail

| Alan | Ayrıntı |
| --- | --- |
| **Yollar** | /abuse · /abuse/:id |
| **MVP** | P0 |
| **Amaç** | Kullanıcı bildirimlerini ve sistemin işaretlediği kötüye kullanımı önceliklendir |
| **Eylemler** | Ata; çöz; kullanıcıyı kısıtla; işi kapat |
| **Vakalar** | CASE-ABUSE, CASE-SECURITY |

### w.admin.policies.manage

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /policies |
| **MVP** | P0 |
| **Amaç** | Politika sürümlerini yükle/yayımla; yeniden kabulü zorunlu kıl |
| **Vakalar** | CASE-AUTH, CASE-SECURITY |

---

## Platform yapılandırması

### w.admin.config.remote

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /config |
| **MVP** | P1 |
| **Amaç** | Özellik işaretleri, bakım kipi, asgari uygulama sürümleri, varsayılan coğrafi çit |
| **Vakalar** | CASE-UX, CASE-LOCATION |

### w.admin.notifications.broadcast

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /notifications/broadcast |
| **MVP** | P2 |
| **Amaç** | Hedef kitlesi dikkatle seçilmiş duyurular |
| **Vakalar** | CASE-NOTIFICATIONS |

### w.admin.audit.log

| Alan | Ayrıntı |
| --- | --- |
| **Yol** | /audit |
| **MVP** | P1 |
| **Amaç** | Yönetici eylemlerinin değiştirilemez nitelikteki günlüğü |
| **Vakalar** | CASE-SECURITY |
