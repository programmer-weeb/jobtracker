import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { BriefcaseBusiness, Building2, KanbanSquare, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useLogout } from "../../features/auth/hooks";

const navItems = [
  { to: "/board", label: "Board", icon: KanbanSquare },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings }
] as const;

export function AuthenticatedLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-[var(--border)] bg-white/90 p-4 backdrop-blur md:min-h-screen md:w-72 md:border-b-0 md:border-r">
          <h1 className="text-xl font-semibold tracking-tight">JobTracker</h1>
          <nav className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-soft)]"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </aside>
        <div className="flex-1 p-4 md:p-8">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{location.pathname.slice(1) || "Dashboard"}</h2>
          </header>
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  );
}
