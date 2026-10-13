import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/page-shell";
import { TrendBars } from "@/components/trend-bars";
import { fetchAdminDashboard } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type DashboardData = Awaited<ReturnType<typeof fetchAdminDashboard>>;

const queueMetricLinks: {
  key: keyof Pick<
    DashboardData,
    | "openAbuseReports"
    | "openDisputes"
    | "pendingVerification"
    | "outboxPending"
    | "openDevopsErrors"
    | "queuedRatings"
    | "openSupportTickets"
  >;
  label: string;
  to: string;
}[] = [
  { key: "openAbuseReports", label: "Açık kötüye kullanım", to: "/abuse" },
  { key: "openDisputes", label: "Açık uyuşmazlık", to: "/disputes" },
  { key: "pendingVerification", label: "Bekleyen doğrulama", to: "/verification" },
  { key: "outboxPending", label: "Outbox bekleyen", to: "/notifications/outbox" },
  { key: "openDevopsErrors", label: "Açık DevOps hata", to: "/devops/errors" },
  { key: "queuedRatings", label: "Puan kuyruğu", to: "/ratings" },
  { key: "openSupportTickets", label: "Açık destek", to: "/support" },
];

const businessCards: {
  key: keyof DashboardData["business"];
  label: string;
  format?: (n: number) => string;
}[] = [
  { key: "totalUsers", label: "Kayıtlı kullanıcı" },
  { key: "totalEmployers", label: "İşveren" },
  { key: "publishedJobs", label: "Yayındaki ilan" },
  { key: "totalApplications", label: "Başvuru" },
  { key: "acceptedApplications", label: "Kabul edilen başvuru" },
  { key: "completedShifts", label: "Tamamlanan vardiya" },
  { key: "topUpTokensToday", label: "Bugün yüklenen jeton" },
  {
    key: "estimatedRevenueTryMonth",
    label: "Tahmini jeton geliri (bu ay)",
    format: (n) => `${n.toLocaleString("tr-TR")} ₺`,
  },
];

function formatTry(n: number): string {
  return n.toLocaleString("tr-TR");
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminDashboard()
      .then(setMetrics)
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Panel yüklenemedi.");
      });
  }, []);

  const leadQueueKey = metrics
    ? queueMetricLinks.find((item) => Number(metrics[item.key]) > 0)?.key
    : undefined;

  return (
    <PageShell title="Kontrol paneli" screenId="w.admin.dashboard">
      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : !metrics ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-foreground">Operasyon kuyrukları</h2>
              <Link to="/ops/perf" className="text-sm text-primary underline">
                Performans metrikleri
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {queueMetricLinks.map((item) => {
                const count = Number(metrics[item.key]);
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className="elev rounded-lg border border-border bg-card px-4 py-4"
                  >
                    <p className="font-sans text-[2rem] font-semibold leading-none tabular-nums text-foreground">
                      {metrics[item.key]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                    {leadQueueKey === item.key && count > 0 ? (
                      <p className="mt-3 text-sm font-semibold text-primary">Aç</p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-foreground">Platform özeti</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {businessCards.map((item) => {
                const raw = metrics.business[item.key];
                const display = item.format ? item.format(raw) : formatTry(raw);
                return (
                  <div
                    key={item.key}
                    className="elev rounded-lg border border-border bg-card px-4 py-4"
                  >
                    <p className="font-sans text-xl font-semibold tabular-nums text-foreground">
                      {display}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Aylık gelir, paket fiyatlarından tahmin edilir; paket dışı yüklemeler ortalama birim fiyatla hesaplanır.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-foreground">Son 7 gün (İstanbul)</h2>
            <div className="grid gap-3 lg:grid-cols-3">
              <TrendBars
                title="Yeni kullanıcı"
                labels={metrics.trends.dayKeys}
                values={metrics.trends.newUsersByDay}
              />
              <TrendBars
                title="Başvuru"
                labels={metrics.trends.dayKeys}
                values={metrics.trends.applicationsByDay}
              />
              <TrendBars
                title="Jeton yükleme"
                labels={metrics.trends.dayKeys}
                values={metrics.trends.topUpTokensByDay}
                valueLabel="jeton"
              />
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
