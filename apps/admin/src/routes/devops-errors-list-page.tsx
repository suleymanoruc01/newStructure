import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { fetchDevopsErrors } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

export function DevopsErrorsListPage() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchDevopsErrors>>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDevopsErrors()
      .then(setItems)
      .catch((err) => {
        setError(isApiClientError(err) ? err.message : "Liste yüklenemedi.");
      });
  }, []);

  return (
    <PageShell title="DevOps hatalar" screenId="w.admin.devops.errors.list">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.fingerprint} className="elev rounded-lg border border-border bg-card px-4 py-3">
              <Link
                to={`/devops/errors/${encodeURIComponent(item.fingerprint)}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {item.message}
              </Link>
              <p className="text-xs text-muted-foreground">
                {item.app} · {item.status} · {item.eventCount} olay
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
