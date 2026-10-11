import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import {
  isApiClientError,
  requestOtp,
  verifyOtp,
} from "@/lib/api-client";

type Step = "phone" | "otp";

export function LoginPage() {
  const navigate = useNavigate();
  const { reload } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await requestOtp({
        phone: phone.trim(),
        purpose: "admin_login" as const,
      });
      setChallengeId(response.data.challengeId);
      setStep("otp");
    } catch (err) {
      setError(
        isApiClientError(err)
          ? err.message
          : "Kod gönderilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeId) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      await verifyOtp({
        challengeId,
        code: code.trim(),
        roleIntent: "admin",
      });
      await reload();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        isApiClientError(err)
          ? err.message
          : "Doğrulama başarısız. Kodu kontrol edin.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PartOn Admin</CardTitle>
          <CardDescription>
            Platform operasyonları için telefon OTP ile giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form className="space-y-4" onSubmit={handleRequestOtp}>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+90 5XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Gönderiliyor…" : "Doğrulama kodu gönder"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div className="space-y-2">
                <Label htmlFor="code">6 haneli kod</Label>
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Doğrulanıyor…" : "Giriş yap"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setChallengeId(null);
                }}
              >
                Telefonu değiştir
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
