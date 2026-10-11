import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/page-shell";
import {
  auditDownloadUrl,
  createAuditReport,
  fetchAdminList,
  updateAdminPolicy,
} from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type PolicyDraft = {
  id: string;
  slug: string;
  title: string;
  body: string;
  version: string;
};

function asPolicy(row: unknown): PolicyDraft | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const item = row as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.title !== "string") {
    return null;
  }
  return {
    id: item.id,
    slug: typeof item.slug === "string" ? item.slug : "",
    title: item.title,
    body: typeof item.body === "string" ? item.body : "",
    version: typeof item.version === "string" ? item.version : "",
  };
}

export function PoliciesManagePage() {
  const [items, setItems] = useState<PolicyDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const rows = await fetchAdminList("/admin/policies");
    setItems(rows.map(asPolicy).filter((row): row is PolicyDraft => row !== null));
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(isApiClientError(err) ? err.message : "Metinler yüklenemedi.");
    });
  }, []);

  function edit(id: string, patch: Partial<Pick<PolicyDraft, "title" | "body">>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function save(item: PolicyDraft) {
    setSavingId(item.id);
    setError(null);
    setMessage(null);
    try {
      await updateAdminPolicy(item.id, { title: item.title, body: item.body });
      await load();
      setMessage("Kaydedildi. Metin değiştiyse sürüm numarası arttı.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Metin kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  async function exportLog(format: "csv" | "pdf") {
    setError(null);
    setDownloadUrl(null);
    const to = new Date();
    const from = new Date(to.getTime() - 365 * 86400000);
    try {
      const report = await createAuditReport({
        from: from.toISOString(),
        to: to.toISOString(),
        categories: ["policy"],
        format,
      });
      setDownloadUrl(auditDownloadUrl(report.downloadToken));
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Rapor oluşturulamadı.");
    }
  }

  return (
    <PageShell title="Yasal metinler" screenId="w.admin.policies.manage">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void exportLog("csv")}>
          Onay kaydı CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => void exportLog("pdf")}>
          Onay kaydı PDF
        </Button>
      </div>
      {downloadUrl ? (
        <p className="mb-4 text-sm">
          <a className="underline" href={downloadUrl} rel="noreferrer">
            Raporu indir
          </a>
        </p>
      ) : null}
      <div className="grid max-w-3xl gap-6">
        {items.map((item) => (
          <form
            key={item.id}
            className="grid gap-3 rounded-lg border border-[#CBD5E1] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save(item);
            }}
          >
            <p className="text-sm text-muted-foreground">
              {item.slug} · sürüm {item.version}
            </p>
            <div>
              <Label htmlFor={`${item.id}-title`}>Başlık</Label>
              <Input
                id={`${item.id}-title`}
                value={item.title}
                onChange={(event) => edit(item.id, { title: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${item.id}-body`}>Metin</Label>
              <textarea
                id={`${item.id}-body`}
                className="min-h-40 w-full rounded-[0.5rem] border border-[#CBD5E1] bg-card px-3 py-2 text-sm text-foreground"
                value={item.body}
                onChange={(event) => edit(item.id, { body: event.target.value })}
              />
            </div>
            <Button type="submit" disabled={savingId === item.id}>
              Kaydet
            </Button>
          </form>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </PageShell>
  );
}
