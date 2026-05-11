import { Card } from "../../components/ui/card";
import { env } from "../../lib/env";
import { useAuth } from "./context";

export function SettingsPage() {
  const auth = useAuth();
  const user = auth.user;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-xl font-semibold">Account</h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[var(--muted-foreground)]">Name</dt>
            <dd className="font-medium">{user?.name ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">Email</dt>
            <dd className="font-medium">{user?.email ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">Session</dt>
            <dd className="font-medium">{auth.isAuthenticated ? "Authenticated" : "Signed out"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">API</dt>
            <dd className="break-all font-medium">{env.apiBaseUrl}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold">Demo Accounts</h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="font-medium">demo@example.com</p>
            <p className="mt-1 text-[var(--muted-foreground)]">password123</p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-3">
            <p className="font-medium">scoped@example.com</p>
            <p className="mt-1 text-[var(--muted-foreground)]">password123</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
