import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      const data = await fetchAdminResource(
        `/admin/matching/diagnostics?jobId=${encodeURIComponent(jobId)}&workerUserId=${encodeURIComponent(workerUserId)}`,
      );
      setResult(data);
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Teşhis başarısız.");
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
        {result ? <RecordView value={result} /> : null}
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
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
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
