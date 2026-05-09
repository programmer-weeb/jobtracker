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

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  authenticatedRoute.addChildren([boardRoute, applicationsRoute, applicationDetailRoute, companiesRoute, settingsRoute])
]);

export const router = createRouter({
  routeTree,
  context: {
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
