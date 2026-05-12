import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";

export const companiesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/companies",
}).lazy(() => import("./companies.lazy").then((d) => d.Route));
