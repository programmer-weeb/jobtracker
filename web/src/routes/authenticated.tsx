import { createRoute, Outlet, redirect } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { AuthenticatedLayout } from "../components/layout/authenticated-layout";

export const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  beforeLoad: ({ context }) => {
    if (!context.auth.hydrated) return;
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
});
