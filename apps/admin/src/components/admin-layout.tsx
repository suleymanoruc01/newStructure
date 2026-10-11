import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminNavSections } from "@/config/admin-nav";
import { useAuth } from "@/features/auth/auth-context";

export function AdminLayout() {
  const { state, signOut } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </a>
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="mb-6 px-4 pt-4">
          <p className="text-lg font-semibold text-foreground">PartOn Admin</p>
          <p className="text-xs text-muted-foreground">Operasyon konsolu</p>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4" aria-label="Ana menü">
          {adminNavSections.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    title={item.screenId}
                    className={({ isActive }) =>
                      [
                        "rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-background hover:text-foreground",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <details className="md:hidden">
            <summary className="cursor-pointer text-sm font-medium text-foreground">Menü</summary>
            <nav className="absolute left-4 right-4 z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-card p-2 shadow-sm" aria-label="Ana menü">
              {adminNavSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className="block rounded-md px-2 py-2 text-sm text-foreground"
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </details>
          <p className="hidden text-sm text-muted-foreground md:block">PartOn operasyon</p>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm tabular-nums text-foreground" translate="no">
                {user.phone}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" aria-hidden />
              Çıkış
            </Button>
          </div>
        </header>
        <main id="main" className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
