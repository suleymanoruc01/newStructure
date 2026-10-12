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
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "#344A32",
        backgroundImage:
          "radial-gradient(circle at 85% -10%, rgba(233,122,61,0.55), transparent 42%), radial-gradient(circle at 10% 110%, rgba(121,169,75,0.4), transparent 40%)",
      }}
    >
      <div className="px-6 pb-16 pt-[max(4rem,env(safe-area-inset-top))]">
        <p className="text-xs font-semibold tracking-wide text-[#F3E8CF]">PartOn</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-[#F3E8CF]">Giriş</h1>
      </div>
      <form
        className="relative -mt-10 flex flex-1 flex-col gap-4 overflow-hidden rounded-t-[40px] px-6 pt-10 shadow-[0_-8px_16px_rgba(37,40,35,0.12)]"
        style={{
          backgroundColor: "#FBF6EC",
          borderTop: "2px solid rgba(243,232,207,0.9)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
        onSubmit={handleSubmit}
      >
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
            className="h-14 rounded-full border-transparent bg-[#EADCC5]"
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
            className="h-14 rounded-full border-transparent bg-[#EADCC5]"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="mt-2 h-14 w-full rounded-full bg-[#E97A3D] text-[#F3E8CF] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#D86A3A]"
          disabled={pending}
        >
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>
    </div>
  );
}
