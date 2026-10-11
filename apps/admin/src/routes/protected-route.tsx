import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  if (state.status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
