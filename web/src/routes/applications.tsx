import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { normalizeFiltersFromSearch } from "../features/applications/filters";

export const applicationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications",
  validateSearch: normalizeFiltersFromSearch,
}).lazy(() => import("./applications.lazy").then((d) => d.Route));
