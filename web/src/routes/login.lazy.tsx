import { createLazyRoute, Link } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useLogin } from "../features/auth/hooks";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormData = z.infer<typeof schema>;

function toErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; errors?: string[] } | undefined;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(", ");
    }
    if (data?.error) {
      return data.error;
    }
  }

  return "Unable to sign in. Check your email and password, then try again.";
}

function LoginPage() {
  const login = useLogin();
  const navigate = Route.useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await login.mutateAsync(values);
      await navigate({ to: "/board" });
    } catch (error) {
      setSubmitError(toErrorMessage(error));
    }
  });

  return (
    <div className="grid min-h-screen bg-[var(--canvas-parchment)] lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex min-h-[56vh] flex-col items-center justify-center bg-[var(--surface-tile-1)] px-6 py-20 text-center text-white">
        <p className="text-sm text-[var(--body-muted-dark)]">JobTracker</p>
        <h1 className="apple-display mt-3 max-w-3xl text-[40px] leading-[1.1] md:text-[56px]">Applications, arranged with calm precision.</h1>
        <p className="mt-4 max-w-2xl text-[24px] font-light leading-normal text-[var(--body-muted-dark)]">
          A quiet board, focused records, and every next step in sight.
        </p>
      </section>

      <section className="flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md p-6 md:p-8">
        <h1 className="apple-display mb-1 text-[34px] leading-tight">Login</h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">Continue tracking applications.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.password.message}</p>
            )}
          </div>
          {submitError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--danger)]" role="alert">
              {submitError}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm">
          New here? <Link className="text-[var(--brand-700)] underline" to="/signup">Create account</Link>
        </p>
      </Card>
      </section>
    </div>
  );
}

export const Route = createLazyRoute("/login")({
  component: LoginPage
});
