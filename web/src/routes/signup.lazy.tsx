import { createLazyRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useSignup } from "../features/auth/hooks";

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    password_confirmation: z.string().min(6)
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords must match"
  });

type FormData = z.infer<typeof schema>;

function SignupPage() {
  const signup = useSignup();
  const navigate = Route.useNavigate();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await signup.mutateAsync(values);
    await navigate({ to: "/board" });
  });

  return (
    <div className="grid min-h-screen bg-[var(--canvas-parchment)] lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex min-h-[56vh] flex-col items-center justify-center bg-white px-6 py-20 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">JobTracker</p>
        <h1 className="apple-display mt-3 max-w-3xl text-[40px] leading-[1.1] md:text-[56px]">Build a cleaner job search record.</h1>
        <p className="mt-4 max-w-2xl text-[24px] font-light leading-normal text-[var(--muted-foreground)]">
          Companies, applications, notes, and movement in one focused workspace.
        </p>
      </section>

      <section className="flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md p-6 md:p-8">
        <h1 className="apple-display mb-1 text-[34px] leading-tight">Sign up</h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">Create your JobTracker account.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div><Label htmlFor="name">Name</Label><Input id="name" {...form.register("name")} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" {...form.register("email")} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" {...form.register("password")} /></div>
          <div>
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input id="password_confirmation" type="password" {...form.register("password_confirmation")} />
            {form.formState.errors.password_confirmation && (
              <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.password_confirmation.message}</p>
            )}
          </div>
          <Button className="w-full" type="submit" disabled={signup.isPending}>
            {signup.isPending ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm">
          Already registered? <Link className="text-[var(--brand-700)] underline" to="/login">Sign in</Link>
        </p>
      </Card>
      </section>
    </div>
  );
}

export const Route = createLazyRoute("/signup")({
  component: SignupPage
});
