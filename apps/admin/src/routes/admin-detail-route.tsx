import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { RecordView } from "@/components/record-view";
import { PageShell } from "@/components/page-shell";
import { fetchAdminResource } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type AdminDetailRouteProps = {
  title: string;
  screenId: string;
  buildPath: (id: string) => string;
  controls?: (data: Record<string, unknown>, reload: () => void) => ReactNode;
};

export function AdminDetailRoute({
  title,
  screenId,
  buildPath,
  controls,
}: AdminDetailRouteProps) {
  const { id } = useParams<{ id: string }>();
  const buildPathRef = useRef(buildPath);
  buildPathRef.current = buildPath;
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!id) {
      setError("Kimlik eksik.");
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAdminResource(buildPathRef.current(id))
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Detay yüklenemedi.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : null;

  return (
    <PageShell title={title} screenId={screenId}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : (
        <>
          {record && controls ? controls(record, reload) : null}
          <RecordView value={data} />
        </>
      )}
    </PageShell>
  );
}
