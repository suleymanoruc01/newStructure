import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/page-shell";
import { adminPatch, adminPost, fetchAdminList } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type PackageRow = {
  id: string;
  label: string;
  tokenCount: number;
  priceTry: number;
  discountPercent: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  iosProductId: string;
  androidProductId: string;
  adaptyProductId: string;
};

function asPackage(raw: unknown): PackageRow | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string") {
    return null;
  }
  return {
    id: item.id,
    label: typeof item.label === "string" ? item.label : "",
    tokenCount: Number(item.tokenCount),
    priceTry: Number(item.priceTry),
    discountPercent: Number(item.discountPercent),
    isPopular: Boolean(item.isPopular),
    isActive: Boolean(item.isActive),
    sortOrder: Number(item.sortOrder),
    iosProductId: String(item.iosProductId ?? ""),
    androidProductId: String(item.androidProductId ?? ""),
    adaptyProductId: String(item.adaptyProductId ?? ""),
  };
}

const defaultNewPackage = {
  label: "",
  tokenCount: "50",
  priceTry: "0",
  discountPercent: "0",
  sortOrder: "0",
  iosProductId: "",
  androidProductId: "",
  adaptyProductId: "",
};

export function TokenPackagesManagePage() {
  const [items, setItems] = useState<PackageRow[]>([]);
  const [newPackage, setNewPackage] = useState(defaultNewPackage);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const rows = await fetchAdminList("/admin/tokens/packages");
    setItems(rows.map(asPackage).filter((row): row is PackageRow => row !== null));
  }

  useEffect(() => {
    void load().catch((err) => {
      setError(isApiClientError(err) ? err.message : "Paketler yüklenemedi.");
    });
  }, []);

  async function createPackage() {
    if (newPackage.label.trim().length < 1) {
      setError("Etiket gerekli.");
      return;
    }
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      await adminPost("/admin/tokens/packages", {
        label: newPackage.label.trim(),
        tokenCount: Number(newPackage.tokenCount) || 1,
        priceTry: Number(newPackage.priceTry) || 0,
        discountPercent: Number(newPackage.discountPercent) || 0,
        sortOrder: Number(newPackage.sortOrder) || 0,
        isActive: true,
        isPopular: false,
        iosProductId: newPackage.iosProductId.trim(),
        androidProductId: newPackage.androidProductId.trim(),
        adaptyProductId: newPackage.adaptyProductId.trim(),
      });
      setNewPackage(defaultNewPackage);
      setMessage("Paket oluşturuldu.");
      await load();
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Paket oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  async function save(row: PackageRow) {
    setSavingId(row.id);
    setError(null);
    try {
      await adminPatch(`/admin/tokens/packages/${row.id}`, {
        label: row.label,
        tokenCount: row.tokenCount,
        priceTry: row.priceTry,
        discountPercent: row.discountPercent,
        isPopular: row.isPopular,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        iosProductId: row.iosProductId,
        androidProductId: row.androidProductId,
        adaptyProductId: row.adaptyProductId,
      });
      await load();
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageShell title="Jeton paketleri" screenId="w.admin.tokens.packages">
      {error ? <p className="mb-3 text-sm text-destructive" role="alert">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-muted-foreground">{message}</p> : null}
      <div className="elev mb-6 rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Yeni paket</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Etiket</Label>
            <Input
              value={newPackage.label}
              onChange={(e) => setNewPackage((p) => ({ ...p, label: e.target.value }))}
            />
          </div>
          <div>
            <Label>Jeton</Label>
            <Input
              inputMode="numeric"
              value={newPackage.tokenCount}
              onChange={(e) => setNewPackage((p) => ({ ...p, tokenCount: e.target.value }))}
            />
          </div>
          <div>
            <Label>Fiyat (TRY)</Label>
            <Input
              inputMode="numeric"
              value={newPackage.priceTry}
              onChange={(e) => setNewPackage((p) => ({ ...p, priceTry: e.target.value }))}
            />
          </div>
          <div>
            <Label>Sıra</Label>
            <Input
              inputMode="numeric"
              value={newPackage.sortOrder}
              onChange={(e) => setNewPackage((p) => ({ ...p, sortOrder: e.target.value }))}
            />
          </div>
          <div>
            <Label>App Store ürün ID</Label>
            <Input
              value={newPackage.iosProductId}
              onChange={(e) =>
                setNewPackage((p) => ({ ...p, iosProductId: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Play ürün ID</Label>
            <Input
              value={newPackage.androidProductId}
              onChange={(e) =>
                setNewPackage((p) => ({ ...p, androidProductId: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Adapty ürün ID</Label>
            <Input
              value={newPackage.adaptyProductId}
              onChange={(e) =>
                setNewPackage((p) => ({ ...p, adaptyProductId: e.target.value }))
              }
            />
          </div>
          <div className="flex items-end">
            <Button type="button" disabled={creating} onClick={() => void createPackage()}>
              Oluştur
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((row) => (
          <div
            key={row.id}
            className="elev rounded-lg border border-border bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Etiket</Label>
                <Input
                  value={row.label}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id ? { ...p, label: e.target.value } : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Jeton</Label>
                <Input
                  inputMode="numeric"
                  value={String(row.tokenCount)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, tokenCount: Number(e.target.value) || 1 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Fiyat (TRY)</Label>
                <Input
                  inputMode="numeric"
                  value={String(row.priceTry)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, priceTry: Number(e.target.value) || 0 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>İndirim %</Label>
                <Input
                  inputMode="numeric"
                  value={String(row.discountPercent)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, discountPercent: Number(e.target.value) || 0 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label>App Store ürün ID</Label>
                <Input
                  value={row.iosProductId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, iosProductId: e.target.value }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Play ürün ID</Label>
                <Input
                  value={row.androidProductId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, androidProductId: e.target.value }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Adapty ürün ID</Label>
                <Input
                  value={row.adaptyProductId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, adaptyProductId: e.target.value }
                          : p,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isPopular}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id ? { ...p, isPopular: e.target.checked } : p,
                      ),
                    )
                  }
                />
                Popüler
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === row.id ? { ...p, isActive: e.target.checked } : p,
                      ),
                    )
                  }
                />
                Aktif
              </label>
              <Button
                type="button"
                size="sm"
                disabled={savingId === row.id}
                onClick={() => void save(row)}
              >
                Kaydet
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
