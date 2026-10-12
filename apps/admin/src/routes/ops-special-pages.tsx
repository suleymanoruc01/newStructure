import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldGrid, asRecord, asRows } from "@/components/field-grid";
import { JsonDataTable } from "@/components/json-data-table";
import { RecordView } from "@/components/record-view";
import { PageShell } from "@/components/page-shell";
import {
  adminPatch,
  adminPost,
  auditDownloadUrl,
  createAuditReport,
  fetchAdminResource,
  fetchDevopsErrorDetail,
  patchDevopsError,
} from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

export function PerfMetricsPage() {
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    void fetchAdminResource("/admin/perf/metrics").then(setData);
  }, []);
  return (
    <PageShell title="Performans metrikleri" screenId="w.admin.perf.metrics">
      <RecordView value={data} />
    </PageShell>
  );
}

export function MatchingDiagnosticsPage() {
  const [jobId, setJobId] = useState("");
  const [workerUserId, setWorkerUserId] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      const data = await fetchAdminResource(
        `/admin/matching/diagnostics?jobId=${encodeURIComponent(jobId)}&workerUserId=${encodeURIComponent(workerUserId)}`,
      );
      setResult(asRecord(data));
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Teşhis başarısız.");
      setResult(null);
    }
  }

  return (
    <PageShell title="Eşleşme teşhisi" screenId="w.admin.matching.diagnostics">
      <div className="grid max-w-lg gap-3">
        <div>
          <Label htmlFor="jobId">İlan ID</Label>
          <Input id="jobId" value={jobId} onChange={(e) => setJobId(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="workerUserId">İş arayan kullanıcı ID</Label>
          <Input
            id="workerUserId"
            value={workerUserId}
            onChange={(e) => setWorkerUserId(e.target.value)}
          />
        </div>
        <Button type="button" onClick={() => void run()}>Çalıştır</Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {result ? (
          <FieldGrid
            fields={[
              { label: "Uygun", value: result.eligible },
              { label: "Nedenler", value: result.reasons },
              { label: "Eşleşme nedenleri", value: result.matchReasons },
              { label: "Mesafe (km)", value: result.distanceKm },
              { label: "Yalnızca favoriler ilanı", value: result.jobFavoritesOnly },
              { label: "İşçi gece vardiyası", value: result.workerNightShiftAvailable },
              { label: "Yüklü belgeler", value: result.workerUploadedDocumentTypes },
            ]}
          />
        ) : null}
      </div>
    </PageShell>
  );
}

export function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_workers");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setStatus(null);
    try {
      await adminPost("/admin/notifications/broadcast", {
        title,
        body,
        audience,
      });
      setStatus("Yayın kuyruğa alındı.");
    } catch (err) {
      setStatus(isApiClientError(err) ? err.message : "Yayın başarısız.");
    }
  }

  return (
    <PageShell title="Bildirim yayını" screenId="w.admin.notifications.broadcast">
      <div className="grid max-w-lg gap-3">
        <div>
          <Label htmlFor="broadcast-title">Başlık</Label>
          <Input id="broadcast-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="broadcast-body">İçerik</Label>
          <Input id="broadcast-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="broadcast-audience">Kitle</Label>
          <select
            id="broadcast-audience"
            className="flex h-11 w-full rounded-[0.5rem] border border-input bg-card px-3 text-sm"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          >
            <option value="all_workers">Tüm iş arayanlar</option>
            <option value="all_employers">Tüm işverenler</option>
          </select>
        </div>
        <Button type="button" onClick={() => void submit()}>Gönder</Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>
    </PageShell>
  );
}

const remoteConfigLabels: Record<string, string> = {
  timeZone: "Saat dilimi (IANA)",
  geofenceRadiusM: "Geofence yarıçapı (m)",
  geofenceSoftRadiusM: "Yumuşak yarıçap (m)",
  geofenceMaxAccuracyM: "Azami GPS sapması (m)",
  checkinEarlyMinutes: "Erken check-in (dk)",
  checkinLateMinutes: "Geç check-in (dk)",
  maintenanceMode: "Bakım modu",
  minMobileIosVersion: "En düşük iOS sürümü",
  minMobileAndroidVersion: "En düşük Android sürümü",
};

function remoteConfigLabel(key: string): string {
  return remoteConfigLabels[key] ?? key;
}

export function RemoteConfigPage() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminResource("/admin/config/remote").then((data) => {
      if (data && typeof data === "object") {
        setConfig(data as Record<string, unknown>);
      }
    });
  }, []);

  async function save() {
    if (!config) {
      return;
    }
    setMessage(null);
    const emptyToNull = (value: unknown) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      return String(value);
    };
    try {
      await adminPatch("/admin/config/remote", {
        geofenceRadiusM: Number(config.geofenceRadiusM),
        geofenceSoftRadiusM: Number(config.geofenceSoftRadiusM),
        geofenceMaxAccuracyM: Number(config.geofenceMaxAccuracyM),
        checkinEarlyMinutes: Number(config.checkinEarlyMinutes),
        checkinLateMinutes: Number(config.checkinLateMinutes),
        maintenanceMode:
          config.maintenanceMode === true || config.maintenanceMode === "true",
        minMobileIosVersion: emptyToNull(config.minMobileIosVersion),
        minMobileAndroidVersion: emptyToNull(config.minMobileAndroidVersion),
        timeZone: String(config.timeZone ?? "Europe/Istanbul"),
      });
      setMessage("Yapılandırma güncellendi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    }
  }

  return (
    <PageShell title="Uzak yapılandırma" screenId="w.admin.config.remote">
      {config ? (
        <div className="grid max-w-lg gap-3">
          {Object.entries(config)
            .filter(([key]) => key !== "id" && key !== "updatedAt")
            .map(([key, value]) => (
            <div key={key}>
              <Label htmlFor={key}>{remoteConfigLabel(key)}</Label>
              <Input
                id={key}
                value={value === null ? "" : String(value)}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, [key]: e.target.value } : prev,
                  )
                }
              />
            </div>
          ))}
          <Button type="button" onClick={() => void save()}>Kaydet</Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
    </PageShell>
  );
}

export function VerimorSmsPage() {
  const [form, setForm] = useState<{
    verimorEnabled: boolean;
    username: string;
    header: string;
    passwordSet: boolean;
    fallbackOtp: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminResource("/admin/config/sms").then((data) => {
      if (!data || typeof data !== "object") {
        return;
      }
      const row = data as Record<string, unknown>;
      setForm({
        verimorEnabled: row.verimorEnabled === true,
        username: String(row.username ?? ""),
        header: String(row.header ?? ""),
        passwordSet: row.passwordSet === true,
        fallbackOtp: String(row.fallbackOtp ?? "290821"),
      });
    });
  }, []);

  async function save() {
    if (!form) {
      return;
    }
    setMessage(null);
    try {
      const json = await adminPatch("/admin/config/sms", {
        verimorEnabled: form.verimorEnabled,
        username: form.username,
        header: form.header,
        ...(password.length > 0 ? { password } : {}),
      });
      const envelope = json as { data?: Record<string, unknown> };
      const row = envelope.data;
      if (row) {
        setForm({
          verimorEnabled: row.verimorEnabled === true,
          username: String(row.username ?? ""),
          header: String(row.header ?? ""),
          passwordSet: row.passwordSet === true,
          fallbackOtp: String(row.fallbackOtp ?? "290821"),
        });
        setPassword("");
      }
      setMessage("SMS ayarları güncellendi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    }
  }

  return (
    <PageShell title="Verimor SMS" screenId="w.admin.config.sms">
      {form ? (
        <div className="grid max-w-lg gap-3">
          <p className="text-sm text-muted-foreground">
            OTP, Verimor <code>/v2/otp</code> ile gönderilir. Hesap kapalıyken
            doğrulama kodu <strong>{form.fallbackOtp}</strong> olur; SMS
            gitmez.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.verimorEnabled}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, verimorEnabled: e.target.checked } : prev,
                )
              }
            />
            Verimor aktif
          </label>
          {!form.verimorEnabled ? (
            <p className="text-sm text-muted-foreground">
              Ön tanımlı OTP: {form.fallbackOtp}
            </p>
          ) : null}
          <div>
            <Label htmlFor="verimor-username">Kullanıcı adı</Label>
            <Input
              id="verimor-username"
              value={form.username}
              autoComplete="off"
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, username: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="verimor-password">
              Şifre{form.passwordSet ? " (kayıtlı — boş bırakınca değişmez)" : ""}
            </Label>
            <Input
              id="verimor-password"
              type="password"
              value={password}
              autoComplete="new-password"
              placeholder={form.passwordSet ? "••••••" : ""}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="verimor-header">Gönderici başlığı</Label>
            <Input
              id="verimor-header"
              value={form.header}
              maxLength={20}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, header: e.target.value } : prev,
                )
              }
            />
          </div>
          <Button type="button" onClick={() => void save()}>
            Kaydet
          </Button>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
    </PageShell>
  );
}

export function AdaptyPaymentsPage() {
  const [form, setForm] = useState<{
    enabled: boolean;
    publicSdkKey: string;
    placementId: string;
    appleStoreConnected: boolean;
    googleStoreConnected: boolean;
    secretSet: boolean;
    webhookAuthorizationSet: boolean;
    webhookPath: string;
  } | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [webhookAuthorization, setWebhookAuthorization] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminResource("/admin/config/adapty").then((data) => {
      if (!data || typeof data !== "object") {
        return;
      }
      const row = data as Record<string, unknown>;
      setForm({
        enabled: row.enabled === true,
        publicSdkKey: String(row.publicSdkKey ?? ""),
        placementId: String(row.placementId ?? ""),
        appleStoreConnected: row.appleStoreConnected === true,
        googleStoreConnected: row.googleStoreConnected === true,
        secretSet: row.secretSet === true,
        webhookAuthorizationSet: row.webhookAuthorizationSet === true,
        webhookPath: String(row.webhookPath ?? "/api/v1/webhooks/adapty"),
      });
    });
  }, []);

  async function save() {
    if (!form) {
      return;
    }
    setMessage(null);
    try {
      const json = await adminPatch("/admin/config/adapty", {
        enabled: form.enabled,
        publicSdkKey: form.publicSdkKey,
        placementId: form.placementId,
        appleStoreConnected: form.appleStoreConnected,
        googleStoreConnected: form.googleStoreConnected,
        ...(secretKey.length > 0 ? { secretKey } : {}),
        ...(webhookAuthorization.length > 0 ? { webhookAuthorization } : {}),
      });
      const envelope = json as { data?: Record<string, unknown> };
      const row = envelope.data;
      if (row) {
        setForm({
          enabled: row.enabled === true,
          publicSdkKey: String(row.publicSdkKey ?? ""),
          placementId: String(row.placementId ?? ""),
          appleStoreConnected: row.appleStoreConnected === true,
          googleStoreConnected: row.googleStoreConnected === true,
          secretSet: row.secretSet === true,
          webhookAuthorizationSet: row.webhookAuthorizationSet === true,
          webhookPath: String(row.webhookPath ?? "/api/v1/webhooks/adapty"),
        });
        setSecretKey("");
        setWebhookAuthorization("");
      }
      setMessage("Adapty ayarları güncellendi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    }
  }

  return (
    <PageShell title="Adapty ödemeler" screenId="w.admin.config.adapty">
      {form ? (
        <div className="grid max-w-lg gap-3">
          <p className="text-sm text-muted-foreground">
            Apple App Store ve Google Play jeton satışları Adapty üzerinden
            gider. Mağaza anahtarlarını Adapty panosunda bağlayın; webhook URL:{" "}
            <code>{form.webhookPath}</code>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, enabled: e.target.checked } : prev,
                )
              }
            />
            Adapty aktif
          </label>
          {!form.enabled ? (
            <p className="text-sm text-muted-foreground">
              Kapalıyken mağaza satışı yok; test/sandbox yükleme ve admin jeton
              kredisi çalışır.
            </p>
          ) : null}
          <div>
            <Label htmlFor="adapty-public">Public SDK key</Label>
            <Input
              id="adapty-public"
              value={form.publicSdkKey}
              autoComplete="off"
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, publicSdkKey: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="adapty-secret">
              Secret API key
              {form.secretSet ? " (kayıtlı — boş bırakınca değişmez)" : ""}
            </Label>
            <Input
              id="adapty-secret"
              type="password"
              value={secretKey}
              autoComplete="new-password"
              placeholder={form.secretSet ? "••••••" : ""}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="adapty-webhook">
              Webhook Authorization
              {form.webhookAuthorizationSet
                ? " (kayıtlı — boş bırakınca değişmez)"
                : ""}
            </Label>
            <Input
              id="adapty-webhook"
              type="password"
              value={webhookAuthorization}
              autoComplete="off"
              placeholder={form.webhookAuthorizationSet ? "••••••" : ""}
              onChange={(e) => setWebhookAuthorization(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="adapty-placement">Placement ID</Label>
            <Input
              id="adapty-placement"
              value={form.placementId}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, placementId: e.target.value } : prev,
                )
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.appleStoreConnected}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, appleStoreConnected: e.target.checked }
                    : prev,
                )
              }
            />
            App Store Adapty’de bağlı
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.googleStoreConnected}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, googleStoreConnected: e.target.checked }
                    : prev,
                )
              }
            />
            Google Play Adapty’de bağlı
          </label>
          <Button type="button" onClick={() => void save()}>
            Kaydet
          </Button>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
    </PageShell>
  );
}

export function AuditReportsPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(format: "csv" | "pdf") {
    setError(null);
    setDownloadUrl(null);
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 86400000);
    try {
      const report = await createAuditReport({
        from: from.toISOString(),
        to: to.toISOString(),
        categories: ["admin_action", "auth", "policy"],
        format,
      });
      setDownloadUrl(auditDownloadUrl(report.downloadToken));
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Rapor oluşturulamadı.");
    }
  }

  return (
    <PageShell title="Denetim raporları" screenId="w.admin.audit.reports">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void generate("csv")}>
          CSV (7 gün)
        </Button>
        <Button type="button" variant="outline" onClick={() => void generate("pdf")}>
          PDF (7 gün)
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {downloadUrl ? (
        <p className="mt-3 text-sm">
          <a href={downloadUrl} className="text-primary underline" rel="noreferrer">
            Raporu indir
          </a>
        </p>
      ) : null}
    </PageShell>
  );
}

export function DevopsServicesPage() {
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    void fetchAdminResource("/admin/devops/services").then(setData);
  }, []);
  return (
    <PageShell title="Servis durumu" screenId="w.admin.devops.services">
      <RecordView value={data} />
    </PageShell>
  );
}

export function DevopsClientsPage() {
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    void fetchAdminResource("/admin/devops/clients").then(setData);
  }, []);
  return (
    <PageShell title="İstemci sürümleri" screenId="w.admin.devops.clients">
      <RecordView value={data} />
    </PageShell>
  );
}

export function DevopsOverviewPage() {
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    void fetchAdminResource("/admin/devops/overview").then(setData);
  }, []);
  return (
    <PageShell title="DevOps özet" screenId="w.admin.devops.overview">
      <RecordView value={data} />
    </PageShell>
  );
}

export function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("open");
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    if (!id) {
      return;
    }
    const fresh = await fetchAdminResource(`/admin/support/tickets/${id}`);
    if (fresh && typeof fresh === "object") {
      const row = fresh as Record<string, unknown>;
      setData(row);
      if (typeof row.status === "string") {
        setStatus(row.status);
      }
    }
  }

  useEffect(() => {
    void reload();
  }, [id]);

  async function sendReply() {
    if (!id || reply.trim().length === 0) {
      return;
    }
    setMessage(null);
    try {
      await adminPost(`/admin/support/tickets/${id}/messages`, { body: reply.trim() });
      setReply("");
      await reload();
      setMessage("Yanıt gönderildi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Yanıt gönderilemedi.");
    }
  }

  async function saveStatus() {
    if (!id) {
      return;
    }
    setMessage(null);
    try {
      await adminPatch(`/admin/support/tickets/${id}`, { status });
      await reload();
      setMessage("Durum güncellendi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Durum güncellenemedi.");
    }
  }

  return (
    <PageShell title="Destek talebi" screenId="w.admin.support.detail">
      {message ? <p className="mb-2 text-sm text-muted-foreground">{message}</p> : null}
      {data ? (
        <>
          <FieldGrid
            fields={[
              { label: "Konu", value: data.subject },
              { label: "Durum", value: data.status },
              { label: "Öncelik", value: data.priority },
              {
                label: "Talep eden",
                value: data.requesterUserId,
                href:
                  typeof data.requesterUserId === "string"
                    ? `/users/${data.requesterUserId}`
                    : undefined,
              },
              { label: "Oluşturma", value: data.createdAt },
              { label: "Metin", value: data.body },
            ]}
          />
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold">Mesajlar</h2>
            <JsonDataTable rows={asRows(data.messages)} />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
      <div className="mt-6 grid max-w-lg gap-3">
        <Label htmlFor="support-status">Durum</Label>
        <select
          id="support-status"
          className="flex h-11 w-full rounded-[0.5rem] border border-border bg-card px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="open">Açık</option>
          <option value="in_progress">İşlemde</option>
          <option value="resolved">Çözüldü</option>
          <option value="closed">Kapalı</option>
        </select>
        <Button type="button" size="sm" onClick={() => void saveStatus()}>Durumu kaydet</Button>
        <Label htmlFor="support-reply">Yanıt</Label>
        <Input
          id="support-reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <Button type="button" onClick={() => void sendReply()}>Yanıt gönder</Button>
      </div>
    </PageShell>
  );
}

export function DevopsErrorDetailPage() {
  const { fingerprint } = useParams<{ fingerprint: string }>();
  const [data, setData] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!fingerprint) {
      return;
    }
    void fetchDevopsErrorDetail(fingerprint).then(setData);
  }, [fingerprint]);

  async function resolve(status: "resolved" | "ignored") {
    if (!fingerprint) {
      return;
    }
    setMessage(null);
    try {
      await patchDevopsError(fingerprint, { status });
      const fresh = await fetchDevopsErrorDetail(fingerprint);
      setData(fresh);
      setMessage("Durum güncellendi.");
    } catch (err) {
      setMessage(isApiClientError(err) ? err.message : "Güncelleme başarısız.");
    }
  }

  return (
    <PageShell title="DevOps hata detayı" screenId="w.admin.devops.errors.detail">
      <div className="mb-3 flex gap-2">
        <Button type="button" size="sm" onClick={() => void resolve("resolved")}>
          Çözüldü
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void resolve("ignored")}>
          Yoksay
        </Button>
      </div>
      {message ? <p className="mb-2 text-sm text-muted-foreground">{message}</p> : null}
      <RecordView value={data} />
    </PageShell>
  );
}
