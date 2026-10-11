import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminNavSections } from "@/config/admin-nav";
import { useAuth } from "@/features/auth/auth-context";

function SideNav() {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4" aria-label="Ana menü">
      {adminNavSections.map((section) => (
        <div key={section.title}>
          <p className="mb-1 px-2 text-xs text-muted-foreground">{section.title}</p>
          <div className="flex flex-col">
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                title={item.screenId}
                className={({ isActive }) =>
                  [
                    "rounded-md px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-[#F0FDFA] font-semibold text-[#0F766E]"
                      : "text-muted-foreground hover:bg-[#F8FAFC] hover:text-foreground",
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
  );
}

function OperatorBar() {
  const { state, signOut } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return (
    <div className="border-t border-border px-3 py-3">
      {user ? (
        <p className="mb-2 truncate text-xs tabular-nums text-foreground" translate="no">
          {user.phone}
        </p>
      ) : null}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void signOut()}>
        Çıkış
      </Button>
    </div>
  );
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </a>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="px-5 pb-4 pt-5">
          <p className="font-display text-xl font-semibold tracking-tight text-foreground">PartOn</p>
          <p className="text-xs text-muted-foreground">Operasyon</p>
        </div>
        <SideNav />
        <OperatorBar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <p className="font-display text-lg font-semibold text-foreground">PartOn</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? "Kapat" : "Menü"}
          </Button>
        </header>
        {menuOpen ? (
          <div className="fixed inset-0 z-30 flex flex-col bg-card pt-14 md:hidden">
            <SideNav />
            <OperatorBar />
          </div>
        ) : null}
        <main id="main" className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
