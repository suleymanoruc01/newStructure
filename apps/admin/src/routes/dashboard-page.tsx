import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/page-shell";
import { fetchAdminDashboard } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

const metricLinks: { key: keyof Awaited<ReturnType<typeof fetchAdminDashboard>>; label: string; to: string }[] = [
  { key: "openAbuseReports", label: "Açık kötüye kullanım", to: "/abuse" },
  { key: "openDisputes", label: "Açık uyuşmazlık", to: "/disputes" },
  { key: "pendingVerification", label: "Bekleyen doğrulama", to: "/verification" },
  { key: "outboxPending", label: "Outbox bekleyen", to: "/notifications/outbox" },
  { key: "openDevopsErrors", label: "Açık DevOps hata", to: "/devops/errors" },
  { key: "queuedRatings", label: "Puan kuyruğu", to: "/ratings" },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof fetchAdminDashboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminDashboard()
      .then(setMetrics)
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Panel yüklenemedi.");
      });
  }, []);

  return (
    <PageShell title="Kontrol paneli" screenId="w.admin.dashboard">
      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : !metrics ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metricLinks.map((item) => {
            const count = Number(metrics[item.key]);
            const leadKey = metricLinks.find((candidate) => Number(metrics[candidate.key]) > 0)?.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_16px_rgba(13,148,136,0.08)]"
              >
                <p className="font-sans text-[2rem] font-semibold leading-none tabular-nums text-foreground">
                  {metrics[item.key]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                {leadKey === item.key && count > 0 ? (
                  <p className="mt-3 text-sm font-semibold text-primary">Aç</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
