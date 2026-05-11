import { Card } from "../../components/ui/card";
import { env } from "../../lib/env";
import { useAuth } from "./context";

export function SettingsPage() {
  const auth = useAuth();
  const user = auth.user;

  return (
    <div className="space-y-4">
      <section className="mx-[calc(50%-50vw)] -mt-6 bg-[var(--surface-tile-2)] px-4 py-16 text-center text-white md:-mt-8 md:px-8">
        <h1 className="apple-display mx-auto max-w-4xl text-[40px] leading-[1.1] md:text-[56px]">Account and environment.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[24px] font-light leading-normal text-[var(--body-muted-dark)]">
          Session details and demo credentials for local review.
        </p>
      </section>

      <Card className="p-6 md:p-8">
        <h3 className="apple-display text-[34px] leading-tight">Account</h3>
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

      <Card className="p-6 md:p-8">
        <h3 className="apple-display text-[34px] leading-tight">Demo Accounts</h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
            <p className="font-medium">demo@example.com</p>
            <p className="mt-1 text-[var(--muted-foreground)]">password123</p>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-pearl)] p-4">
            <p className="font-medium">scoped@example.com</p>
            <p className="mt-1 text-[var(--muted-foreground)]">password123</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
