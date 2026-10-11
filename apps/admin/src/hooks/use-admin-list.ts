import { useCallback, useEffect, useState } from "react";
import { fetchAdminList } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

export function useAdminList(apiPath: string) {
  const [rows, setRows] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAdminList(apiPath);
      setRows(Array.isArray(items) ? items : []);
    } catch (err) {
      const message =
        isApiClientError(err)
          ? err.message
          : "Veri yüklenemedi.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, error, loading, reload };
}
