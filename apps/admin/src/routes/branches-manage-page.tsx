import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JsonDataTable } from "@/components/json-data-table";
import { PageShell } from "@/components/page-shell";
import { useAdminList } from "@/hooks/use-admin-list";
import { adminPost } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

export function BranchesManagePage() {
  const [employerFilter, setEmployerFilter] = useState("");
  const [filterApplied, setFilterApplied] = useState("");
  const apiPath = filterApplied
    ? `/admin/branches?employerId=${encodeURIComponent(filterApplied)}`
    : "/admin/branches";
  const { rows, error, loading, reload } = useAdminList(apiPath);

  const [create, setCreate] = useState({
    employerId: "",
    name: "",
    addressLine1: "",
    city: "",
    latitude: "41.0082",
    longitude: "28.9784",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  async function submitCreate() {
    setCreateError(null);
    setCreateMessage(null);
    try {
      const data = await adminPost("/admin/branches", {
        employerId: create.employerId.trim(),
        name: create.name.trim(),
        addressLine1: create.addressLine1.trim() || undefined,
        city: create.city.trim() || undefined,
        latitude: Number(create.latitude),
        longitude: Number(create.longitude),
      });
      setCreateMessage(
        typeof data === "object" && data && "managerInviteCode" in (data as object)
          ? "Şube oluşturuldu; yönetici davet kodu detayda."
          : "Şube oluşturuldu.",
      );
      await reload();
    } catch (err) {
      setCreateError(isApiClientError(err) ? err.message : "Şube eklenemedi.");
    }
  }

  return (
    <PageShell title="Şubeler" screenId="w.admin.branches.list">
      <div className="elev mb-8 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Yeni şube (ops)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Abonelik şube limiti admin oluşturmasında atlanır; işlem denetim günlüğüne yazılır.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="new-employer-id">İşveren ID</Label>
            <Input
              id="new-employer-id"
              value={create.employerId}
              onChange={(e) => setCreate((s) => ({ ...s, employerId: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="new-branch-name">Şube adı</Label>
            <Input
              id="new-branch-name"
              value={create.name}
              onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="new-branch-city">İl</Label>
            <Input
              id="new-branch-city"
              value={create.city}
              onChange={(e) => setCreate((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="new-branch-lat">Enlem</Label>
            <Input
              id="new-branch-lat"
              value={create.latitude}
              onChange={(e) => setCreate((s) => ({ ...s, latitude: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="new-branch-lng">Boylam</Label>
            <Input
              id="new-branch-lng"
              value={create.longitude}
              onChange={(e) => setCreate((s) => ({ ...s, longitude: e.target.value }))}
            />
          </div>
        </div>
        <Button type="button" className="mt-4" onClick={() => void submitCreate()}>
          Şube ekle
        </Button>
        {createError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">{createError}</p>
        ) : null}
        {createMessage ? (
          <p className="mt-2 text-sm text-muted-foreground">{createMessage}</p>
        ) : null}
      </div>

      <form
        className="mb-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilterApplied(employerFilter.trim());
        }}
      >
        <Input
          value={employerFilter}
          onChange={(e) => setEmployerFilter(e.target.value)}
          placeholder="İşveren ID filtresi"
          aria-label="İşveren ID filtresi"
        />
        <Button type="submit">Filtrele</Button>
      </form>

      <p className="mb-2 text-sm text-muted-foreground">
        {loading ? "Yükleniyor…" : `${rows.length} kayıt`}{" "}
        <Link className="text-primary underline" to="/branches">Yenile</Link>
      </p>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <JsonDataTable
        rows={rows}
        linkBase="/branches"
        idKey="id"
      />
    </PageShell>
  );
}
