import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminPatch, adminPost } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

function messageOf(err: unknown, fallback: string): string {
  return isApiClientError(err) ? err.message : fallback;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground";

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
