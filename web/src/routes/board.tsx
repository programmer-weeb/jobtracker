import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { normalizeFiltersFromSearch } from "../features/applications/filters";

export const boardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/board",
  validateSearch: normalizeFiltersFromSearch,
}).lazy(() => import("./board.lazy").then((d) => d.Route));
