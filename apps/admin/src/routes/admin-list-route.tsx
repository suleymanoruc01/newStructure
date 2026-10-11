import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JsonDataTable } from "@/components/json-data-table";
import { PageShell } from "@/components/page-shell";
import { useAdminList } from "@/hooks/use-admin-list";

type AdminListRouteProps = {
  title: string;
  screenId: string;
  apiPath: string;
  linkBase?: string;
  idKey?: string;
  searchable?: boolean;
};

export function AdminListRoute({
  title,
  screenId,
  apiPath,
  linkBase,
  idKey,
  searchable = false,
}: AdminListRouteProps) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const path = searchable && search
    ? `${apiPath}?search=${encodeURIComponent(search)}`
    : apiPath;
  const { rows, error, loading, reload } = useAdminList(path);

  return (
    <PageShell title={title} screenId={screenId}>
      {searchable ? (
        <form
          className="mb-4 flex max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(draft.trim());
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Telefon"
            aria-label="Telefon ara"
          />
          <Button type="submit" variant="secondary">Ara</Button>
        </form>
      ) : null}
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
