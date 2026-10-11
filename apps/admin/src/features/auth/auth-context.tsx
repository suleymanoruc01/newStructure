import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MeUser } from "@parton/api-contracts";
import {
  fetchMe,
  isApiClientError,
  logout as apiLogout,
  refreshAccessToken,
} from "@/lib/api-client";
import { hasAccessSession } from "@/lib/session";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: MeUser };

type AuthContextValue = {
  state: AuthState;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const reload = useCallback(async () => {
    if (!hasAccessSession()) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        setState({ status: "anonymous" });
        return;
      }
    }
    try {
      const user = await fetchMe();
      if (!user.roles.includes("admin")) {
        await apiLogout();
        setState({ status: "anonymous" });
        return;
      }
      setState({ status: "authenticated", user });
    } catch (error) {
      if (isApiClientError(error) && error.status === 401) {
        setState({ status: "anonymous" });
        return;
      }
      setState({ status: "anonymous" });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const signOut = useCallback(async () => {
    await apiLogout();
    setState({ status: "anonymous" });
  }, []);

  const value = useMemo(
    () => ({ state, reload, signOut }),
    [state, reload, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
