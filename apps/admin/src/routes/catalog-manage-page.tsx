import type {
  JobCatalogOccupationRequirements,
  WorkerDocumentType,
} from "@parton/api-contracts";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/page-shell";
import {
  createAdminJobCatalogOccupation,
  createAdminJobCatalogSector,
  deleteAdminJobCatalogOccupation,
  deleteAdminJobCatalogSector,
  fetchAdminJobCatalogTree,
  patchAdminJobCatalogOccupation,
  patchAdminJobCatalogSector,
} from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type OccupationRow = {
  id: string;
  sectorId: string;
  code: string;
  title: string;
  description?: string | null;
  requirements: JobCatalogOccupationRequirements;
  sortOrder: number;
  active: boolean;
};

type SectorRow = {
  id: string;
  code: string;
  displayName: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  occupations: OccupationRow[];
};

const DOCUMENT_TYPE_OPTIONS: {
  value: WorkerDocumentType;
  label: string;
}[] = [
  { value: "id_card", label: "Kimlik" },
  { value: "criminal_record", label: "Adli sicil" },
  { value: "health_report", label: "Sağlık raporu" },
  { value: "food_hygiene", label: "Hijyen belgesi" },
  { value: "drivers_license", label: "Ehliyet" },
  { value: "other", label: "Diğer" },
];

const LICENSE_CLASS_OPTIONS = ["B", "C", "D", "E"] as const;

function emptyRequirements(): JobCatalogOccupationRequirements {
  return { requiredDocumentTypes: [] };
}

function CatalogModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      }`}
    >
      {active ? "Aktif" : "Pasif"}
    </span>
  );
}

export function CatalogManagePage() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [sectorModal, setSectorModal] = useState<"add" | "edit" | null>(null);
  const [sectorForm, setSectorForm] = useState({
    code: "",
    displayName: "",
    icon: "📂",
    sortOrder: "0",
    isActive: true,
  });
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);

  const [jobModal, setJobModal] = useState<"add" | "edit" | null>(null);
  const [jobForm, setJobForm] = useState({
    code: "",
    title: "",
    description: "",
    sortOrder: "0",
    isActive: true,
    requirements: emptyRequirements(),
  });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const filteredSectors = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = showInactive
      ? sectors
      : sectors.filter((sector) => sector.active);
    if (!q) {
      return base;
    }
    return base.filter(
      (sector) =>
        sector.displayName.toLowerCase().includes(q) ||
        sector.code.toLowerCase().includes(q) ||
        sector.occupations.some(
          (job) =>
            job.title.toLowerCase().includes(q) || job.code.toLowerCase().includes(q),
        ),
    );
  }, [filter, sectors, showInactive]);

  const selectedSector =
    sectors.find((sector) => sector.id === selectedSectorId) ?? null;

  async function load() {
    const data = await fetchAdminJobCatalogTree();
    setSectors(data.sectors);
    setSelectedSectorId((current) => {
      if (current && data.sectors.some((sector) => sector.id === current)) {
        return current;
      }
      return data.sectors[0]?.id ?? null;
    });
  }

  useEffect(() => {
    void load().catch((err) => {
      setError(isApiClientError(err) ? err.message : "Katalog yüklenemedi.");
    });
  }, []);

  function openAddSector() {
    setSectorForm({
      code: "",
      displayName: "",
      icon: "📂",
      sortOrder: "0",
      isActive: true,
    });
    setEditingSectorId(null);
    setSectorModal("add");
  }

  function openEditSector(sector: SectorRow) {
    setSectorForm({
      code: sector.code,
      displayName: sector.displayName,
      icon: sector.icon,
      sortOrder: String(sector.sortOrder),
      isActive: sector.active,
    });
    setEditingSectorId(sector.id);
    setSectorModal("edit");
  }

  function openAddJob() {
    setJobForm({
      code: "",
      title: "",
      description: "",
      sortOrder: "0",
      isActive: true,
      requirements: emptyRequirements(),
    });
    setEditingJobId(null);
    setJobModal("add");
  }

  function openEditJob(job: OccupationRow) {
    setJobForm({
      code: job.code,
      title: job.title,
      description: job.description ?? "",
      sortOrder: String(job.sortOrder),
      isActive: job.active,
      requirements: job.requirements ?? emptyRequirements(),
    });
    setEditingJobId(job.id);
    setJobModal("edit");
  }

  function toggleDocumentType(docType: WorkerDocumentType) {
    setJobForm((prev) => {
      const set = new Set(prev.requirements.requiredDocumentTypes);
      if (set.has(docType)) {
        set.delete(docType);
      } else {
        set.add(docType);
      }
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          requiredDocumentTypes: [...set],
        },
      };
    });
  }

  function toggleLicenseClass(klass: string) {
    setJobForm((prev) => {
      const current = prev.requirements.driversLicenseClasses ?? [];
      const next = current.includes(klass)
        ? current.filter((value) => value !== klass)
        : [...current, klass];
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          driversLicenseClasses: next.length > 0 ? next : undefined,
        },
      };
    });
  }

  async function saveSector() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const sortOrder = Number(sectorForm.sortOrder) || 0;
      if (sectorModal === "add") {
        const created = await createAdminJobCatalogSector({
          code: sectorForm.code.trim().toLowerCase(),
          displayName: sectorForm.displayName.trim(),
          icon: sectorForm.icon.trim() || "📂",
          sortOrder,
          active: sectorForm.isActive,
        });
        setSelectedSectorId(created.id);
      } else if (sectorModal === "edit" && editingSectorId) {
        await patchAdminJobCatalogSector(editingSectorId, {
          displayName: sectorForm.displayName.trim(),
          icon: sectorForm.icon.trim() || "📂",
          sortOrder,
          active: sectorForm.isActive,
        });
      }
      setSectorModal(null);
      await load();
      setMessage("Sektör kaydedildi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Sektör kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  async function saveJob() {
    if (!selectedSector && jobModal === "add") {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const sortOrder = Number(jobForm.sortOrder) || 0;
      const code = jobForm.code.trim().toLowerCase();
      const title = jobForm.title.trim();
      const description = jobForm.description.trim();
      const requirements = jobForm.requirements;
      if (jobModal === "add" && selectedSector) {
        await createAdminJobCatalogOccupation(selectedSector.id, {
          code,
          title,
          description: description.length > 0 ? description : null,
          requirements,
          sortOrder,
          active: jobForm.isActive,
        });
      } else if (jobModal === "edit" && editingJobId) {
        await patchAdminJobCatalogOccupation(editingJobId, {
          code,
          title,
          description: description.length > 0 ? description : null,
          requirements,
          sortOrder,
          active: jobForm.isActive,
        });
      }
      setJobModal(null);
      await load();
      setMessage("Pozisyon kaydedildi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Pozisyon kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  async function deleteJob(job: OccupationRow) {
    if (
      !window.confirm(
        `"${job.title}" kalıcı olarak silinecek. İlan veya işçi profili bu kodu kullanıyorsa silme reddedilir.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteAdminJobCatalogOccupation(job.id);
      await load();
      setMessage("Pozisyon silindi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Silme başarısız.");
    }
  }

  async function deleteSector(sector: SectorRow) {
    if (
      !window.confirm(
        `"${sector.displayName}" ve tüm pozisyonları kalıcı olarak silinecek. Kullanımda ise silme reddedilir.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteAdminJobCatalogSector(sector.id);
      await load();
      setMessage("Sektör silindi.");
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Silme başarısız.");
    }
  }

  const visibleJobs = selectedSector
    ? selectedSector.occupations.filter((job) => {
        if (!showInactive && !job.active) {
          return false;
        }
        const q = filter.trim().toLowerCase();
        if (!q) {
          return true;
        }
        return (
          job.title.toLowerCase().includes(q) || job.code.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <PageShell title="İlan kataloğu" screenId="w.admin.catalog.manage">
      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-3 text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="max-w-md flex-1">
          <Label htmlFor="catalog-filter">Ara</Label>
          <Input
            id="catalog-filter"
            placeholder="Sektör veya pozisyon…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
          />
          Pasif kayıtları göster
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Sektörler</h2>
            <Button type="button" size="sm" onClick={openAddSector}>
              <Plus className="size-4" />
              Ekle
            </Button>
          </div>
          {filteredSectors.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Layers className="mx-auto mb-4 size-12 opacity-50" />
              <p>Sektör bulunamadı</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredSectors.map((sector) => {
                const selected = selectedSectorId === sector.id;
                return (
                  <div
                    key={sector.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-6 py-4 transition-colors ${
                      selected ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedSectorId(sector.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedSectorId(sector.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-xl" aria-hidden>{sector.icon}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {sector.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sector.code} · {sector.occupations.length} pozisyon · sıra{" "}
                          {sector.sortOrder}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge active={sector.active} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditSector(sector);
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteSector(sector);
                        }}
                        aria-label="Sektörü sil"
                        title="Sil"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedSector
                ? `${selectedSector.displayName} — Pozisyonlar`
                : "Pozisyonlar"}
            </h2>
            {selectedSector ? (
              <Button type="button" size="sm" onClick={openAddJob}>
                <Plus className="size-4" />
                Ekle
              </Button>
            ) : null}
          </div>
          {!selectedSector ? (
            <div className="p-12 text-center text-muted-foreground">
              Pozisyonları görmek için bir sektör seçin
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Bu sektörde pozisyon yok
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleJobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.code} · sıra {job.sortOrder}
                        {job.requirements.requiredDocumentTypes.length > 0
                          ? ` · ${job.requirements.requiredDocumentTypes.length} belge`
                          : ""}
                      </p>
                      {job.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {job.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge active={job.active} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditJob(job)}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void deleteJob(job)}
                        aria-label="Pozisyonu sil"
                        title="Sil"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {sectorModal ? (
        <CatalogModal
          title={sectorModal === "add" ? "Sektör ekle" : "Sektör düzenle"}
          onClose={() => setSectorModal(null)}
        >
          <div className="grid gap-4">
            <div>
              <Label htmlFor="sector-code">Kod (slug)</Label>
              <Input
                id="sector-code"
                value={sectorForm.code}
                disabled={sectorModal === "edit"}
                onChange={(event) =>
                  setSectorForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="sector-name">Görünen ad</Label>
              <Input
                id="sector-name"
                value={sectorForm.displayName}
                onChange={(event) =>
                  setSectorForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="sector-icon">İkon</Label>
              <Input
                id="sector-icon"
                value={sectorForm.icon}
                onChange={(event) =>
                  setSectorForm((prev) => ({ ...prev, icon: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="sector-sort">Sıra</Label>
              <Input
                id="sector-sort"
                inputMode="numeric"
                value={sectorForm.sortOrder}
                onChange={(event) =>
                  setSectorForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sectorForm.isActive}
                onChange={(event) =>
                  setSectorForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Aktif
            </label>
            <Button type="button" disabled={pending} onClick={() => void saveSector()}>
              Kaydet
            </Button>
          </div>
        </CatalogModal>
      ) : null}

      {jobModal ? (
        <CatalogModal
          title={jobModal === "add" ? "Pozisyon ekle" : "Pozisyon düzenle"}
          onClose={() => setJobModal(null)}
        >
          <div className="grid gap-4">
            <div>
              <Label htmlFor="job-code">Meslek kodu</Label>
              <Input
                id="job-code"
                value={jobForm.code}
                onChange={(event) =>
                  setJobForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="job-title">Başlık</Label>
              <Input
                id="job-title"
                value={jobForm.title}
                onChange={(event) =>
                  setJobForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="job-description">Açıklama</Label>
              <textarea
                id="job-description"
                className="mt-1 min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={jobForm.description}
                onChange={(event) =>
                  setJobForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Gerekli belgeler</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={jobForm.requirements.requiredDocumentTypes.includes(
                        option.value,
                      )}
                      onChange={() => toggleDocumentType(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            {jobForm.requirements.requiredDocumentTypes.includes("drivers_license") ? (
              <div>
                <p className="text-sm font-medium text-foreground">Ehliyet sınıfı</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {LICENSE_CLASS_OPTIONS.map((klass) => (
                    <label
                      key={klass}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={
                          jobForm.requirements.driversLicenseClasses?.includes(klass) ??
                          false
                        }
                        onChange={() => toggleLicenseClass(klass)}
                      />
                      {klass}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={jobForm.requirements.srcRequired ?? false}
                onChange={(event) =>
                  setJobForm((prev) => ({
                    ...prev,
                    requirements: {
                      ...prev.requirements,
                      srcRequired: event.target.checked,
                    },
                  }))
                }
              />
              SRC belgesi gerekli
            </label>
            <div>
              <Label htmlFor="job-sort">Sıra</Label>
              <Input
                id="job-sort"
                inputMode="numeric"
                value={jobForm.sortOrder}
                onChange={(event) =>
                  setJobForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={jobForm.isActive}
                onChange={(event) =>
                  setJobForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Aktif
            </label>
            <Button type="button" disabled={pending} onClick={() => void saveJob()}>
              Kaydet
            </Button>
          </div>
        </CatalogModal>
      ) : null}
    </PageShell>
  );
}
