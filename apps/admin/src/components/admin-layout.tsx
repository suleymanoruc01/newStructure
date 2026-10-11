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
                        "rounded-md px-3 py-2 text-left text-sm transition-colors",
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
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <p className="text-sm text-muted-foreground">PartOn operasyon</p>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm text-foreground">{user.phone}</span>
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
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
