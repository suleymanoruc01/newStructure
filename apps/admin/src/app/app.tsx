import { useEffect } from "react";
import { AdminErrorBoundary } from "@/components/admin-error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { AppRouter } from "@/app/router";
import { installDevopsReporter } from "@/lib/devops-reporter";

export function App() {
  useEffect(() => {
    installDevopsReporter();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      enableSystem={false}
      storageKey="parton-admin-theme"
    >
      <AuthProvider>
        <AdminErrorBoundary>
          <AppRouter />
        </AdminErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
