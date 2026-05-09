import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { ApplicationsPage } from "../features/applications/list-page";
import { normalizeFiltersFromSearch } from "../features/applications/filters";

export const applicationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications",
  validateSearch: normalizeFiltersFromSearch,
  component: ApplicationsPage
});
