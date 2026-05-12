import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "../routes/root";
import { indexRoute } from "../routes/index";
import { loginRoute } from "../routes/login";
import { signupRoute } from "../routes/signup";
import { authenticatedRoute } from "../routes/authenticated";
import { boardRoute } from "../routes/board";
import { applicationsRoute } from "../routes/applications";
import { applicationDetailRoute } from "../routes/application-detail";
import { companiesRoute } from "../routes/companies";
import { settingsRoute } from "../routes/settings";
import { queryClient } from "./query-client";

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  authenticatedRoute.addChildren([boardRoute, applicationsRoute, applicationDetailRoute, companiesRoute, settingsRoute])
]);

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div className="flex min-h-[200px] items-center justify-center p-8">
      <div className="text-sm font-medium text-[var(--muted-foreground)]">Loading...</div>
    </div>
  ),
  context: {
    queryClient,
    auth: {
      hydrated: false,
      isAuthenticated: false
    }
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
