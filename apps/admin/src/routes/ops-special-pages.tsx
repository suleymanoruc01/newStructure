import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function envelopeData(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object" || !("data" in json)) {
    return null;
  }
  const data = (json as { data: unknown }).data;
  return data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : null;
}

function statusLabel(status: string): string {
  if (status === "up") {
    return "Hazır";
  }
  if (status === "degraded") {
    return "Kısıtlı";
  }
  if (status === "down") {
    return "Kapalı";
  }
  return status;
}

type RemoteForm = {
  geofenceRadiusM: string;
  geofenceSoftRadiusM: string;
  geofenceMaxAccuracyM: string;
  checkinEarlyMinutes: string;
  checkinLateMinutes: string;
  maintenanceMode: boolean;
  minMobileIosVersion: string;
  minMobileAndroidVersion: string;
  timeZone: string;
};

function asRemoteForm(data: Record<string, unknown>): RemoteForm {
  return {
    geofenceRadiusM: String(data.geofenceRadiusM ?? "100"),
    geofenceSoftRadiusM: String(data.geofenceSoftRadiusM ?? "150"),
    geofenceMaxAccuracyM: String(data.geofenceMaxAccuracyM ?? "30"),
    checkinEarlyMinutes: String(data.checkinEarlyMinutes ?? "15"),
    checkinLateMinutes: String(data.checkinLateMinutes ?? "30"),
    maintenanceMode: data.maintenanceMode === true,
    minMobileIosVersion: String(data.minMobileIosVersion ?? ""),
    minMobileAndroidVersion: String(data.minMobileAndroidVersion ?? ""),
    timeZone: String(data.timeZone ?? "Europe/Istanbul"),
  };
}

export function RemoteConfigPage() {
  const [form, setForm] = useState<RemoteForm | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetchAdminResource("/admin/config/remote")
      .then((data) => {
        if (data && typeof data === "object") {
          setForm(asRemoteForm(data as Record<string, unknown>));
        }
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Yapılandırma yüklenemedi.");
      });
  }, []);

  async function save() {
    if (!form) {
      return;
    }
    setPending(true);
    setMessage(null);
    setError(null);
    const emptyToNull = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    };
    try {
      await adminPatch("/admin/config/remote", {
        geofenceRadiusM: Number(form.geofenceRadiusM),
        geofenceSoftRadiusM: Number(form.geofenceSoftRadiusM),
        geofenceMaxAccuracyM: Number(form.geofenceMaxAccuracyM),
        checkinEarlyMinutes: Number(form.checkinEarlyMinutes),
        checkinLateMinutes: Number(form.checkinLateMinutes),
        maintenanceMode: form.maintenanceMode,
        minMobileIosVersion: emptyToNull(form.minMobileIosVersion),
        minMobileAndroidVersion: emptyToNull(form.minMobileAndroidVersion),
        timeZone: form.timeZone.trim() || "Europe/Istanbul",
      });
      setMessage("Yapılandırma güncellendi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell title="Uzak yapılandırma" screenId="w.admin.config.remote">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      {form ? (
        <div className="grid max-w-lg gap-3">
          <p className="text-sm text-muted-foreground">
            Geofence, check-in pencereleri, bakım ve zorunlu uygulama sürümü.
            İstemci sürümleri{" "}
            <Link className="text-primary underline" to="/devops/clients">
              DevOps istemciler
            </Link>
            {" "}ekranında da görünür.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, maintenanceMode: e.target.checked } : prev,
                )
              }
            />
            Bakım modu
          </label>
          <div>
            <Label htmlFor="cfg-tz">Saat dilimi (IANA)</Label>
            <Input
              id="cfg-tz"
              value={form.timeZone}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, timeZone: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-geo">Geofence yarıçapı (m)</Label>
            <Input
              id="cfg-geo"
              inputMode="numeric"
              value={form.geofenceRadiusM}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, geofenceRadiusM: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-soft">Yumuşak yarıçap (m)</Label>
            <Input
              id="cfg-soft"
              inputMode="numeric"
              value={form.geofenceSoftRadiusM}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, geofenceSoftRadiusM: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-acc">Azami GPS sapması (m)</Label>
            <Input
              id="cfg-acc"
              inputMode="numeric"
              value={form.geofenceMaxAccuracyM}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, geofenceMaxAccuracyM: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-early">Erken check-in (dk)</Label>
            <Input
              id="cfg-early"
              inputMode="numeric"
              value={form.checkinEarlyMinutes}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, checkinEarlyMinutes: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-late">Geç check-in (dk)</Label>
            <Input
              id="cfg-late"
              inputMode="numeric"
              value={form.checkinLateMinutes}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, checkinLateMinutes: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-ios">En düşük iOS sürümü</Label>
            <Input
              id="cfg-ios"
              value={form.minMobileIosVersion}
              placeholder="boş = sınır yok"
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, minMobileIosVersion: e.target.value } : prev,
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="cfg-android">En düşük Android sürümü</Label>
            <Input
              id="cfg-android"
              value={form.minMobileAndroidVersion}
              placeholder="boş = sınır yok"
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, minMobileAndroidVersion: e.target.value }
                    : prev,
                )
              }
            />
          </div>
          <Button type="button" disabled={pending} onClick={() => void save()}>
            Kaydet
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : null}
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
    active: boolean;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [probe, setProbe] = useState<string | null>(null);

  function applyRow(row: Record<string, unknown>) {
    setForm({
      verimorEnabled: row.verimorEnabled === true,
      username: String(row.username ?? ""),
      header: String(row.header ?? ""),
      passwordSet: row.passwordSet === true,
      fallbackOtp: String(row.fallbackOtp ?? "290821"),
      active: row.active === true,
    });
  }

  useEffect(() => {
    void fetchAdminResource("/admin/config/sms")
      .then((data) => {
        if (data && typeof data === "object") {
          applyRow(data as Record<string, unknown>);
        }
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "SMS ayarları yüklenemedi.");
      });
  }, []);

  async function save() {
    if (!form) {
      return;
    }
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const json = await adminPatch("/admin/config/sms", {
        verimorEnabled: form.verimorEnabled,
        username: form.username,
        header: form.header,
        ...(password.length > 0 ? { password } : {}),
      });
      const row = envelopeData(json);
      if (row) {
        applyRow(row);
        setPassword("");
      }
      setMessage("SMS ayarları güncellendi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    } finally {
      setPending(false);
    }
  }

  async function runProbe() {
    setProbe(null);
    setError(null);
    try {
      const json = await adminPost("/admin/config/sms/probe", {});
      const row = envelopeData(json);
      if (row) {
        setProbe(
          `${statusLabel(String(row.status ?? ""))}: ${String(row.detail ?? "")}`,
        );
      }
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Durum alınamadı.");
    }
  }

  return (
    <PageShell title="Verimor ayarları" screenId="w.admin.config.sms">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      {form ? (
        <div className="grid max-w-lg gap-3">
          <p className="text-sm text-muted-foreground">
            OTP, Verimor <code>/v2/otp</code> ile gönderilir. Kapalıyken kod{" "}
            <strong>{form.fallbackOtp}</strong> olur; SMS gitmez. Şifre GET ile
            dönmez.
          </p>
          <p className="text-sm">
            Durum: {form.active ? "Verimor gönderir" : `OTP ${form.fallbackOtp}`}
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={() => void save()}>
              Kaydet
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void runProbe()}
            >
              Durumu kontrol et
            </Button>
          </div>
          {probe ? <p className="text-sm text-muted-foreground">{probe}</p> : null}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </div>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : null}
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
    active: boolean;
  } | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [webhookAuthorization, setWebhookAuthorization] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [probe, setProbe] = useState<string | null>(null);

  function applyRow(row: Record<string, unknown>) {
    setForm({
      enabled: row.enabled === true,
      publicSdkKey: String(row.publicSdkKey ?? ""),
      placementId: String(row.placementId ?? ""),
      appleStoreConnected: row.appleStoreConnected === true,
      googleStoreConnected: row.googleStoreConnected === true,
      secretSet: row.secretSet === true,
      webhookAuthorizationSet: row.webhookAuthorizationSet === true,
      webhookPath: String(row.webhookPath ?? "/api/v1/webhooks/adapty"),
      active: row.active === true,
    });
  }

  useEffect(() => {
    void fetchAdminResource("/admin/config/adapty")
      .then((data) => {
        if (data && typeof data === "object") {
          applyRow(data as Record<string, unknown>);
        }
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Adapty ayarları yüklenemedi.");
      });
  }, []);

  async function save() {
    if (!form) {
      return;
    }
    setPending(true);
    setMessage(null);
    setError(null);
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
      const row = envelopeData(json);
      if (row) {
        applyRow(row);
        setSecretKey("");
        setWebhookAuthorization("");
      }
      setMessage("Adapty ayarları güncellendi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    } finally {
      setPending(false);
    }
  }

  async function runProbe() {
    setProbe(null);
    setError(null);
    try {
      const json = await adminPost("/admin/config/adapty/probe", {});
      const row = envelopeData(json);
      if (row) {
        setProbe(
          `${statusLabel(String(row.status ?? ""))}: ${String(row.detail ?? "")}`,
        );
      }
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Adapty yoklanamadı.");
    }
  }

  return (
    <PageShell title="Adapty ayarları" screenId="w.admin.config.adapty">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      {form ? (
        <div className="grid max-w-lg gap-3">
          <p className="text-sm text-muted-foreground">
            App Store ve Google Play jeton satışları Adapty üzerinden gider.
            Mağaza anahtarlarını Adapty panosunda bağlayın. Webhook:{" "}
            <code>{form.webhookPath}</code>. Ürün ID’leri{" "}
            <Link className="text-primary underline" to="/tokens/packages">
              jeton paketleri
            </Link>{" "}
            sayfasında.
          </p>
          <p className="text-sm">
            Durum: {form.active ? "Mağaza satışı açık" : "Mağaza satışı kapalı"}
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
              Kapalıyken mağaza satışı yok; test yükleme ve admin jeton kredisi
              çalışır.
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={() => void save()}>
              Kaydet
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void runProbe()}
            >
              Adapty’yi yokla
            </Button>
          </div>
          {probe ? <p className="text-sm text-muted-foreground">{probe}</p> : null}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </div>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : null}
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
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminResource("/admin/devops/services")
      .then((row) => {
        if (row && typeof row === "object") {
          setData(row as Record<string, unknown>);
        }
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Servisler yüklenemedi.");
      });
  }, []);

  const services = Array.isArray(data?.services) ? data.services : [];

  return (
    <PageShell title="Servis durumu" screenId="w.admin.devops.services">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <p className="mb-4 text-sm text-muted-foreground">
        Verimor ve Adapty xadmin yapılandırmasından okunur. FCM servis hesabı
        ortam değişkenidir.{" "}
        <Link className="text-primary underline" to="/config/sms">
          Verimor ayarları
        </Link>
        {" · "}
        <Link className="text-primary underline" to="/config/adapty">
          Adapty ayarları
        </Link>
      </p>
      {data ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Outbox bekleyen: {String(data.outboxPending ?? "—")} · hata:{" "}
            {String(data.outboxFailed ?? "—")}
          </p>
          {services.map((raw) => {
            const row = asRecord(raw);
            if (!row) {
              return null;
            }
            const name = String(row.name ?? "");
            const status = String(row.status ?? "");
            return (
              <div
                key={name}
                className="rounded-md border border-border bg-card px-4 py-3"
              >
                <p className="text-sm font-medium">
                  {name} · {statusLabel(status)}
                </p>
                {typeof row.detail === "string" ? (
                  <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : null}
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
