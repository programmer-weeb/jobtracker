import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (!context.auth.hydrated || !context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    throw redirect({ to: "/board" });
  }
});
