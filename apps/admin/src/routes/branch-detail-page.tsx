import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/page-shell";
import { adminPatch, fetchAdminResource } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type BranchDraft = {
  id: string;
  employerId: string;
  name: string;
  addressLine1: string;
  city: string;
  latitude: string;
  longitude: string;
  status: string;
  employerName?: string;
};

function asBranch(raw: unknown): BranchDraft | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.employerId !== "string") {
    return null;
  }
  const employer = item.employer;
  let employerName: string | undefined;
  if (employer && typeof employer === "object") {
    const er = employer as Record<string, unknown>;
    employerName =
      typeof er.legalName === "string"
        ? er.legalName
        : typeof er.tradingName === "string"
          ? er.tradingName
          : undefined;
  }
  return {
    id: item.id,
    employerId: item.employerId,
    name: typeof item.name === "string" ? item.name : "",
    addressLine1:
      typeof item.addressLine1 === "string" ? item.addressLine1 : "",
    city: typeof item.city === "string" ? item.city : "",
    latitude: String(item.latitude ?? ""),
    longitude: String(item.longitude ?? ""),
    status: typeof item.status === "string" ? item.status : "active",
    employerName,
  };
}

const selectClass =
  "flex h-11 w-full rounded-[0.5rem] border border-border bg-card px-3 text-sm";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [branch, setBranch] = useState<BranchDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    if (!id) {
      return;
    }
    const data = await fetchAdminResource(`/admin/branches/${id}`);
    const parsed = asBranch(data);
    if (parsed) {
      setBranch(parsed);
    }
  }

  useEffect(() => {
    void load().catch((err) => {
      setError(isApiClientError(err) ? err.message : "Şube yüklenemedi.");
    });
  }, [id]);

  async function save() {
    if (!branch) {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await adminPatch(`/admin/branches/${branch.id}`, {
        name: branch.name.trim(),
        addressLine1: branch.addressLine1.trim() || undefined,
        city: branch.city.trim() || undefined,
        latitude: Number(branch.latitude),
        longitude: Number(branch.longitude),
        status: branch.status,
      });
      setMessage("Şube kaydedildi.");
      await load();
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell title="Şube detayı" screenId="w.admin.branches.detail">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-muted-foreground">{message}</p> : null}
      {!branch ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <div className="grid max-w-lg gap-3">
          {branch.employerName ? (
            <p className="text-sm text-muted-foreground">
              İşveren:{" "}
              <Link className="text-primary underline" to={`/employers/${branch.employerId}`}>
                {branch.employerName}
              </Link>
            </p>
          ) : null}
          <div>
            <Label htmlFor="branch-name">Ad</Label>
            <Input
              id="branch-name"
              value={branch.name}
              onChange={(e) => setBranch({ ...branch, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="branch-address">Adres</Label>
            <Input
              id="branch-address"
              value={branch.addressLine1}
              onChange={(e) => setBranch({ ...branch, addressLine1: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="branch-city">İl</Label>
            <Input
              id="branch-city"
              value={branch.city}
              onChange={(e) => setBranch({ ...branch, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="branch-lat">Enlem</Label>
              <Input
                id="branch-lat"
                value={branch.latitude}
                onChange={(e) => setBranch({ ...branch, latitude: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="branch-lng">Boylam</Label>
              <Input
                id="branch-lng"
                value={branch.longitude}
                onChange={(e) => setBranch({ ...branch, longitude: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="branch-status">Durum</Label>
            <select
              id="branch-status"
              className={selectClass}
              value={branch.status}
              onChange={(e) => setBranch({ ...branch, status: e.target.value })}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="archived">Arşiv</option>
            </select>
          </div>
          <Button type="button" disabled={pending} onClick={() => void save()}>
            Kaydet
          </Button>
        </div>
      )}
    </PageShell>
  );
}
