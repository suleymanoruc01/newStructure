import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminPatch, adminPost } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

function messageOf(err: unknown, fallback: string): string {
  return isApiClientError(err) ? err.message : fallback;
}

function asRecord(row: unknown): Record<string, unknown> | null {
  return row && typeof row === "object" && !Array.isArray(row)
    ? (row as Record<string, unknown>)
    : null;
}

const selectClass =
  "flex h-11 w-full rounded-[0.5rem] border border-input bg-card px-3 text-sm text-foreground";

export function UserStatusControl({
  userId,
  status,
  onDone,
}: {
  userId: string;
  status: string;
  onDone: () => void;
}) {
  const [next, setNext] = useState(
    status === "restricted" || status === "banned" ? status : "active",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    if (next === "banned" && !window.confirm("Hesap yasaklanır ve oturumlar kapanır.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/users/${userId}`, { status: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Durum güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="user-status">Hesap durumu</Label>
      <select
        id="user-status"
        className={selectClass}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      >
        <option value="active">Aktif</option>
        <option value="restricted">Kısıtlı</option>
        <option value="banned">Yasaklı</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Durumu kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function EmployerProfileControl({
  employerId,
  legalName,
  tradingName,
  addressLine1,
  city,
  latitude,
  longitude,
  onDone,
}: {
  employerId: string;
  legalName: string;
  tradingName: string | null;
  addressLine1?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onDone: () => void;
}) {
  const [name, setName] = useState(legalName);
  const [trade, setTrade] = useState(tradingName ?? "");
  const [address, setAddress] = useState(addressLine1 ?? "");
  const [cityValue, setCityValue] = useState(city ?? "");
  const [lat, setLat] = useState(latitude != null ? String(latitude) : "");
  const [lng, setLng] = useState(longitude != null ? String(longitude) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveProfile() {
    if (name.trim().length < 2) {
      setError("Ticari ünvan en az 2 karakter olmalı.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const parsedLat = lat.trim() ? Number(lat) : null;
      const parsedLng = lng.trim() ? Number(lng) : null;
      await adminPatch(`/admin/employers/${employerId}`, {
        legalName: name.trim(),
        tradingName: trade.trim().length > 0 ? trade.trim() : null,
        addressLine1: address.trim().length > 0 ? address.trim() : null,
        city: cityValue.trim().length > 0 ? cityValue.trim() : null,
        latitude: parsedLat,
        longitude: parsedLng,
      });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Profil güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="employer-legal-name">Ticari ünvan</Label>
      <Input
        id="employer-legal-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Label htmlFor="employer-trading-name">Marka adı (isteğe bağlı)</Label>
      <Input
        id="employer-trading-name"
        value={trade}
        onChange={(event) => setTrade(event.target.value)}
      />
      <Label htmlFor="employer-address">Adres</Label>
      <Input
        id="employer-address"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
      />
      <Label htmlFor="employer-city">İl</Label>
      <Input
        id="employer-city"
        value={cityValue}
        onChange={(event) => setCityValue(event.target.value)}
      />
      <Label htmlFor="employer-lat">Enlem</Label>
      <Input
        id="employer-lat"
        value={lat}
        onChange={(event) => setLat(event.target.value)}
      />
      <Label htmlFor="employer-lng">Boylam</Label>
      <Input
        id="employer-lng"
        value={lng}
        onChange={(event) => setLng(event.target.value)}
      />
      <Button type="button" onClick={() => void saveProfile()} disabled={pending}>
        Ünvanı kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function ApplicationStatusControl({
  applicationId,
  status,
  onDone,
}: {
  applicationId: string;
  status: string;
  onDone: () => void;
}) {
  const [next, setNext] = useState("rejected");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    if (reason.trim().length < 1) {
      setError("Destek notu gerekli.");
      return;
    }
    if (
      !window.confirm(
        `Başvuru durumu "${next}" olarak güncellenecek. İş kuralları (kontenjan, vardiya, jeton) uygulanır.`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/applications/${applicationId}`, {
        status: next,
        reason: reason.trim(),
      });
      setReason("");
      onDone();
    } catch (err) {
      setError(messageOf(err, "Durum güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="application-status">Destek durum düzeltmesi</Label>
      <p className="text-xs text-muted-foreground">Mevcut: {status}</p>
      <select
        id="application-status"
        className={selectClass}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      >
        <option value="rejected">Reddedildi</option>
        <option value="accepted">Kabul edildi</option>
        <option value="accept_revoked">Kabul geri alındı</option>
        <option value="withdrawn">Geri çekildi (bekleyen)</option>
      </select>
      <Label htmlFor="application-reason">Not</Label>
      <Input
        id="application-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Destek talebi / neden"
      />
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Durumu uygula
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function EmployerControls({
  employerId,
  verificationStatus,
  onDone,
}: {
  employerId: string;
  verificationStatus: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState(
    verificationStatus === "verified" || verificationStatus === "rejected" || verificationStatus === "bypass"
      ? verificationStatus
      : "verified",
  );
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveVerification() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/employers/${employerId}/verification`, {
        verificationStatus: status,
      });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Doğrulama güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  async function credit() {
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1 || note.trim().length === 0) {
      setError("Jeton adedi ve not gerekli.");
      return;
    }
    if (!window.confirm(`${parsed} jeton işveren hesabına yazılacak.`)) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPost(`/admin/employers/${employerId}/tokens/credit`, {
        amount: parsed,
        note: note.trim(),
      });
      setNote("");
      onDone();
    } catch (err) {
      setError(messageOf(err, "Jeton yazılamadı."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="verification-status">Doğrulama</Label>
        <select
          id="verification-status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="verified">Doğrulandı</option>
          <option value="rejected">Reddedildi</option>
          <option value="bypass">Atlandı</option>
        </select>
        <Button type="button" onClick={() => void saveVerification()} disabled={pending}>
          Doğrulamayı kaydet
        </Button>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="token-amount">Jeton ekle</Label>
        <Input
          id="token-amount"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Label htmlFor="token-note">Not</Label>
        <Input
          id="token-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void credit()} disabled={pending}>
          Jeton yaz
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function WorkplaceTokenAllocateControl({
  employerId,
  onDone,
}: {
  employerId: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("1");
  const [target, setTarget] = useState<"workplace" | "branch">("workplace");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function allocate() {
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError("Geçerli bir miktar girin.");
      return;
    }
    if (target === "branch" && branchId.trim().length < 8) {
      setError("Şube kimliği gerekli.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPost(`/admin/employers/${employerId}/tokens/allocate`, {
        amount: parsed,
        target,
        branchId: target === "branch" ? branchId.trim() : undefined,
      });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Paylaşım yapılamadı."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="alloc-amount">Dağıtılmamış jetondan paylaş</Label>
      <Input
        id="alloc-amount"
        inputMode="numeric"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <select
        className={selectClass}
        value={target}
        onChange={(event) =>
          setTarget(event.target.value === "branch" ? "branch" : "workplace")
        }
      >
        <option value="workplace">İşyeri</option>
        <option value="branch">Şube</option>
      </select>
      {target === "branch" ? (
        <Input
          placeholder="Şube kimliği"
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
        />
      ) : null}
      <Button type="button" variant="secondary" onClick={() => void allocate()} disabled={pending}>
        Paylaştır
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function TokenRequestQueue({
  employerId,
  rows,
  onDone,
}: {
  employerId: string;
  rows: unknown[];
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resolve(requestId: string, action: "approve" | "reject") {
    setPending(true);
    setError(null);
    try {
      const parsed = Number(amount);
      await adminPost(
        `/admin/employers/${employerId}/tokens/requests/${requestId}`,
        {
          action,
          amount:
            action === "approve" && Number.isInteger(parsed) && parsed > 0
              ? parsed
              : undefined,
        },
      );
      onDone();
    } catch (err) {
      setError(messageOf(err, "Talep güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Input
        placeholder="Onay miktarı (taleptesizse)"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Talep yok.</p> : null}
      {rows.map((raw, index) => {
        const row = asRecord(raw);
        if (!row) {
          return null;
        }
        const id = typeof row.id === "string" ? row.id : `row-${index}`;
        const status = String(row.status ?? "");
        return (
          <div key={id} className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              {String(row.amount ?? "—")} · {status}
            </span>
            {status === "pending" && id ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => void resolve(id, "approve")}
                >
                  Onayla
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => void resolve(id, "reject")}
                >
                  Reddet
                </Button>
              </>
            ) : null}
          </div>
        );
      })}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function EmployerSubscriptionControl({
  employerId,
  planCode,
  status,
  onDone,
}: {
  employerId: string;
  planCode: string;
  status: string;
  onDone: () => void;
}) {
  const [plan, setPlan] = useState(planCode);
  const [subStatus, setSubStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/employers/${employerId}/subscription`, {
        planCode: plan,
        status: subStatus,
      });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Abonelik güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="employer-plan">Abonelik planı</Label>
      <select
        id="employer-plan"
        className={selectClass}
        value={plan}
        onChange={(event) => setPlan(event.target.value)}
      >
        <option value="free">Ücretsiz</option>
        <option value="starter">Başlangıç</option>
        <option value="professional">Profesyonel</option>
        <option value="enterprise">Kurumsal</option>
      </select>
      <Label htmlFor="employer-sub-status">Abonelik durumu</Label>
      <select
        id="employer-sub-status"
        className={selectClass}
        value={subStatus}
        onChange={(event) => setSubStatus(event.target.value)}
      >
        <option value="active">Aktif</option>
        <option value="trialing">Deneme</option>
        <option value="past_due">Gecikmiş</option>
        <option value="cancelled">İptal</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Aboneliği kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function JobForceCloseControl({
  jobId,
  onDone,
}: {
  jobId: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function closeJob() {
    if (reason.trim().length === 0) {
      setError("Gerekçe yazın.");
      return;
    }
    if (!window.confirm("İlan kapanır ve kullanılmayan jeton iade edilir.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPost(`/admin/jobs/${jobId}/force-close`, { reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(messageOf(err, "İlan kapatılamadı."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="close-reason">Zorla kapatma gerekçesi</Label>
      <Input
        id="close-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button type="button" variant="destructive" onClick={() => void closeJob()} disabled={pending}>
        İlanı kapat
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function RatingModerationControl({
  ratingId,
  moderationStatus,
  onDone,
}: {
  ratingId: string;
  moderationStatus: string;
  onDone: () => void;
}) {
  const [next, setNext] = useState(moderationStatus === "rejected" ? "rejected" : "visible");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/ratings/${ratingId}`, { moderationStatus: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Puan güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="rating-status">Moderasyon</Label>
      <select
        id="rating-status"
        className={selectClass}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      >
        <option value="visible">Görünür</option>
        <option value="rejected">Reddedildi</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Moderasyonu kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function UserSessionsRevokeControl({
  userId,
  onDone,
}: {
  userId: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function revoke() {
    if (!window.confirm("Tüm oturumlar kapatılacak.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPost(`/admin/users/${userId}/sessions/revoke`, {});
      onDone();
    } catch (err) {
      setError(messageOf(err, "Oturumlar kapatılamadı."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Button type="button" variant="secondary" onClick={() => void revoke()} disabled={pending}>
        Oturumları kapat
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function WorkerNightShiftControl({
  workerId,
  nightShiftAvailable,
  onDone,
}: {
  workerId: string;
  nightShiftAvailable: boolean;
  onDone: () => void;
}) {
  const [next, setNext] = useState(nightShiftAvailable);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/workers/${workerId}`, { nightShiftAvailable: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Gece vardiyası güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="night-shift">Gece vardiyası</Label>
      <select
        id="night-shift"
        className={selectClass}
        value={next ? "yes" : "no"}
        onChange={(event) => setNext(event.target.value === "yes")}
      >
        <option value="yes">Uygun</option>
        <option value="no">Uygun değil</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function JobFavoritesOnlyControl({
  jobId,
  favoritesOnly,
  onDone,
}: {
  jobId: string;
  favoritesOnly: boolean;
  onDone: () => void;
}) {
  const [next, setNext] = useState(favoritesOnly);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/jobs/${jobId}`, { favoritesOnly: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Favori kısıtı güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="favorites-only">Yalnızca favoriler</Label>
      <select
        id="favorites-only"
        className={selectClass}
        value={next ? "yes" : "no"}
        onChange={(event) => setNext(event.target.value === "yes")}
      >
        <option value="yes">Açık</option>
        <option value="no">Kapalı</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function ShiftManualConfirmControl({
  shiftId,
  checkedIn,
  onDone,
}: {
  shiftId: string;
  checkedIn: boolean;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!window.confirm("Yoklama manuel onaylanır; jeton yakalanır.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPost(`/admin/shifts/${shiftId}/manual-confirm`, {});
      onDone();
    } catch (err) {
      setError(messageOf(err, "Manuel onay uygulanamadı."));
    } finally {
      setPending(false);
    }
  }

  if (checkedIn) {
    return <p className="mb-6 text-sm text-muted-foreground">Yoklama zaten onaylı.</p>;
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Button type="button" onClick={() => void confirm()} disabled={pending}>
        Manuel yoklama onayı
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function DocumentStatusControl({
  documentId,
  status,
  onDone,
}: {
  documentId: string;
  status: string;
  onDone: () => void;
}) {
  const [next, setNext] = useState(status === "rejected" ? "rejected" : "uploaded");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/documents/${documentId}`, { status: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Belge durumu güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="document-status">Belge durumu</Label>
      <select
        id="document-status"
        className={selectClass}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      >
        <option value="uploaded">Yüklendi (geçerli)</option>
        <option value="rejected">Reddedildi</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Durumu kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function DisputeResolveControl({
  disputeId,
  status,
  onDone,
}: {
  disputeId: string;
  status: string;
  onDone: () => void;
}) {
  const [next, setNext] = useState("resolved");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/disputes/${disputeId}`, { status: next });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Uyuşmazlık güncellenemedi."));
    } finally {
      setPending(false);
    }
  }

  if (status !== "open") {
    return <p className="mb-6 text-sm text-muted-foreground">Bu uyuşmazlık kapalı.</p>;
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Label htmlFor="dispute-status">Uyuşmazlık (yoklama onayı olmadan)</Label>
      <select
        id="dispute-status"
        className={selectClass}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      >
        <option value="resolved">Çözüldü</option>
        <option value="rejected">Reddedildi</option>
      </select>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        Kaydet
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function AbuseResolveControl({
  reportId,
  status,
  onDone,
}: {
  reportId: string;
  status: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resolve() {
    if (!window.confirm("Rapor çözüldü olarak kapanır.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminPatch(`/admin/abuse-reports/${reportId}/resolve`, {});
      onDone();
    } catch (err) {
      setError(messageOf(err, "Rapor kapatılamadı."));
    } finally {
      setPending(false);
    }
  }

  if (status === "resolved") {
    return <p className="mb-6 text-sm text-muted-foreground">Bu rapor çözüldü.</p>;
  }

  return (
    <div className="mb-6 grid max-w-sm gap-2">
      <Button type="button" onClick={() => void resolve()} disabled={pending}>
        Raporu çöz
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

const PERM_LABELS: Record<string, string> = {
  "jobs.create": "İlan oluştur",
  "jobs.read": "İlan görüntüle",
  "jobs.update": "İlan düzenle",
  "jobs.delete": "İlan kapat",
  "branches.create": "Şube ekle",
  "branches.update": "Şube düzenle",
  "branches.delete": "Şube kapat",
  "tokens.purchase": "Jeton satın al",
  "tokens.refund": "Jeton iadesi",
};

export function ManagerPermissionsControl({
  employerId,
  rows,
  onDone,
}: {
  employerId: string;
  rows: unknown[];
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(
    userId: string,
    current: string[],
    perm: string,
    scope: "workplace" | "branch",
    branchId?: string,
  ) {
    const next = current.includes(perm)
      ? current.filter((item) => item !== perm)
      : [...current, perm];
    setPending(userId);
    setError(null);
    try {
      await adminPatch(`/admin/employers/${employerId}/managers/${userId}`, {
        permissions: next,
        scope,
        branchId,
      });
      onDone();
    } catch (err) {
      setError(messageOf(err, "Yetki güncellenemedi."));
    } finally {
      setPending(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Yönetici yok.</p>;
  }

  return (
    <div className="grid gap-4">
      {rows.map((raw) => {
        const row = asRecord(raw);
        if (!row) {
          return null;
        }
        const userId = typeof row.userId === "string" ? row.userId : "";
        const perms = Array.isArray(row.permissions)
          ? row.permissions.filter((item): item is string => typeof item === "string")
          : [];
        const scope = row.scope === "branch" ? "branch" : "workplace";
        const branchId =
          typeof row.branchId === "string" ? row.branchId : undefined;
        return (
          <div key={userId} className="grid gap-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">
              {typeof row.phoneE164 === "string" ? row.phoneE164 : userId}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PERM_LABELS).map((perm) => {
                const on = perms.includes(perm);
                return (
                  <Button
                    key={perm}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "secondary"}
                    disabled={pending === userId || !userId}
                    onClick={() =>
                      void toggle(userId, perms, perm, scope, branchId)
                    }
                  >
                    {PERM_LABELS[perm]}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
