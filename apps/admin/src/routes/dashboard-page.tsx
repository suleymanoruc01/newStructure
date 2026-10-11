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
          {metricLinks.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-2xl font-semibold text-foreground">
                {metrics[item.key]}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
