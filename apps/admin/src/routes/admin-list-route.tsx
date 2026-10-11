import { Button } from "@/components/ui/button";
import { JsonDataTable } from "@/components/json-data-table";
import { PageShell } from "@/components/page-shell";
import { useAdminList } from "@/hooks/use-admin-list";

type AdminListRouteProps = {
  title: string;
  screenId: string;
  apiPath: string;
  linkBase?: string;
  idKey?: string;
};

export function AdminListRoute({
  title,
  screenId,
  apiPath,
  linkBase,
  idKey,
}: AdminListRouteProps) {
  const { rows, error, loading, reload } = useAdminList(apiPath);

  return (
    <PageShell title={title} screenId={screenId}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "Yükleniyor…" : `${rows.length} kayıt`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          Yenile
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : (
        <JsonDataTable rows={rows} linkBase={linkBase} idKey={idKey} />
      )}
    </PageShell>
  );
}
