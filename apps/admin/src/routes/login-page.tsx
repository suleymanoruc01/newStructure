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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
        onSubmit={handleSubmit}
      >
        <p className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">PartOn</p>
        <h1 className="font-display text-[2rem] font-semibold leading-10 tracking-[-0.01em] text-foreground">Giriş</h1>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
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
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Giriş yapılıyor…" : "Giriş yap"}
          </Button>
        </form>
    </div>
  );
}
