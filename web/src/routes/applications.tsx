import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { ApplicationsPage } from "../features/applications/list-page";

export const applicationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications",
  component: ApplicationsPage
});
