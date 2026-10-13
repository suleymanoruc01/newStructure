import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { isApiClientError, loginWithPassword } from "@/lib/api-client";

export function LoginPage() {
  const navigate = useNavigate();
  const { reload } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await loginWithPassword({
        email: email.trim(),
        password,
      });
      await reload();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        isApiClientError(err)
          ? err.message
          : "Giriş başarısız. E-posta ve parolayı kontrol edin.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <form
        className="elev w-full max-w-md rounded-xl border border-border bg-card p-8"
        onSubmit={handleSubmit}
      >
        <p className="text-[11px] font-medium tracking-[0.08em] text-primary">PARTON</p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-10 tracking-[-0.01em] text-foreground">
          Giriş
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Operasyon paneli</p>
        <div className="mt-8 space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="password">Parola</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>
    </div>
  );
}
