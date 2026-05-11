import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { BriefcaseBusiness, Building2, KanbanSquare, Search, Settings, ShoppingBag } from "lucide-react";
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
  const currentItem = navItems.find((item) => location.pathname === item.to);
  const pageTitle = currentItem?.label ?? "Application";

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40">

        <div className="border-b border-black/10 bg-[rgba(245,245,247,0.8)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex min-h-[52px] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-8">
            <div className="flex items-center gap-3">
              <span className="apple-display text-[21px] leading-none">{pageTitle}</span>
              <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">Focused application tracking</span>
            </div>
            <nav className="flex flex-wrap items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm tracking-[-0.224px]",
                      active
                        ? "bg-[var(--brand)] text-white"
                        : "text-[var(--foreground)] hover:text-[var(--brand)]"
                    )}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out" : "Logout"}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
