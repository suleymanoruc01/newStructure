import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageShell } from "@/components/page-shell";
import { fetchAdminResource } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type AdminDetailRouteProps = {
  title: string;
  screenId: string;
  buildPath: (id: string) => string;
};

export function AdminDetailRoute({
  title,
  screenId,
  buildPath,
}: AdminDetailRouteProps) {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Kimlik eksik.");
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAdminResource(buildPath(id))
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Detay yüklenemedi.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id, buildPath]);

  return (
    <PageShell title={title} screenId={screenId}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : (
        <pre className="max-h-[70vh] overflow-auto rounded-md bg-muted/40 p-4 text-xs text-foreground">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </PageShell>
  );
}
