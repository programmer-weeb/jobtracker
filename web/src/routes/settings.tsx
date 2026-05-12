import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";

export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settings",
}).lazy(() => import("./settings.lazy").then((d) => d.Route));
