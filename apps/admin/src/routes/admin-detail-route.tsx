import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { FieldGrid, asRecord, type FieldItem } from "@/components/field-grid";
import { PageShell } from "@/components/page-shell";
import { fetchAdminResource } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type OpsDetailPageProps = {
  title: string;
  screenId: string;
  buildPath: (id: string) => string;
  fields: (data: Record<string, unknown>) => FieldItem[];
  extras?: (data: Record<string, unknown>, reload: () => void) => ReactNode;
  controls?: (data: Record<string, unknown>, reload: () => void) => ReactNode;
};

export function OpsDetailPage({
  title,
  screenId,
  buildPath,
  fields,
  extras,
  controls,
}: OpsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const buildPathRef = useRef(buildPath);
  buildPathRef.current = buildPath;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
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
        setData(asRecord(payload));
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

  return (
    <PageShell title={title} screenId={screenId}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : data ? (
        <>
          {controls ? controls(data, reload) : null}
          <FieldGrid fields={fields(data)} />
          {extras ? extras(data, reload) : null}
        </>
      ) : null}
    </PageShell>
  );
}
