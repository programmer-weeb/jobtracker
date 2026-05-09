import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { BoardPage } from "../features/board/page";
import { normalizeFiltersFromSearch } from "../features/applications/filters";

export const boardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/board",
  validateSearch: normalizeFiltersFromSearch,
  component: BoardPage
});
