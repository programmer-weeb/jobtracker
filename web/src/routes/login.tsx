import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.auth.hydrated && context.auth.isAuthenticated) {
      throw redirect({ to: "/board" });
    }
  },
}).lazy(() => import("./login.lazy").then((d) => d.Route));
