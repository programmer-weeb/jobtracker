import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  beforeLoad: ({ context }) => {
    if (context.auth.hydrated && context.auth.isAuthenticated) {
      throw redirect({ to: "/board" });
    }
  },
}).lazy(() => import("./signup.lazy").then((d) => d.Route));
